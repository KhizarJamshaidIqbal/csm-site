/* Homepage hero Three.js particle constellation. ES module.
 * Loaded on demand by /js/hero-effects.js via dynamic import().
 * Three.js is fetched from a CDN as an ES module; failures fall back silently. */
'use strict';

const THREE_CDN_PRIMARY = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const THREE_CDN_FALLBACK = 'https://unpkg.com/three@0.160.0/build/three.module.js';

async function loadThree() {
  try {
    return await import(/* @vite-ignore */ THREE_CDN_PRIMARY);
  } catch (_) {
    return await import(/* @vite-ignore */ THREE_CDN_FALLBACK);
  }
}

/**
 * Create a particle-network scene inside `container`.
 * Returns { setPointer(x,y), setActive(bool), destroy() }.
 * All numeric options are clamped defensively.
 */
export async function createHeroScene(container, options = {}) {
  if (!container || !(container instanceof HTMLElement)) return null;

  let THREE;
  try {
    THREE = await loadThree();
  } catch (err) {
    if (window.console) console.warn('[hero-scene] three load failed', err);
    return null;
  }

  const count = Math.max(30, Math.min(200, options.count || 140));
  const linkDist = 120;
  const linkDist2 = linkDist * linkDist;
  const cursorRadius = 180;
  const cursorRadius2 = cursorRadius * cursorRadius;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'low-power'
  });
  renderer.setClearColor(0x000000, 0);
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);

  const rect0 = container.getBoundingClientRect();
  let width = Math.max(1, Math.floor(rect0.width || 1200));
  let height = Math.max(1, Math.floor(rect0.height || 600));
  renderer.setSize(width, height, false);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    -width / 2, width / 2, height / 2, -height / 2, -1000, 1000
  );
  camera.position.z = 10;

  // Particle data. World coords are pixel-scaled around origin.
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const home = new Float32Array(count * 3);

  const rand = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < count; i++) {
    const x = rand(-width / 2, width / 2);
    const y = rand(-height / 2, height / 2);
    const z = rand(-40, 40);
    positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
    home[i * 3] = x; home[i * 3 + 1] = y; home[i * 3 + 2] = z;
    velocities[i * 3] = rand(-0.08, 0.08);
    velocities[i * 3 + 1] = rand(-0.08, 0.08);
    velocities[i * 3 + 2] = rand(-0.02, 0.02);
  }

  // Points
  const pointsGeom = new THREE.BufferGeometry();
  pointsGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pointsMat = new THREE.PointsMaterial({
    color: 0x67e8f9,
    size: 2.2,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const points = new THREE.Points(pointsGeom, pointsMat);
  scene.add(points);

  // Line segments between neighbours. Cap segment count defensively.
  const maxSegments = count * 6;
  const linePositions = new Float32Array(maxSegments * 2 * 3);
  const lineColors = new Float32Array(maxSegments * 2 * 3);
  const linesGeom = new THREE.BufferGeometry();
  linesGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  linesGeom.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
  linesGeom.setDrawRange(0, 0);
  const linesMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const lines = new THREE.LineSegments(linesGeom, linesMat);
  scene.add(lines);

  const cyan = new THREE.Color(0x22d3ee);
  const indigo = new THREE.Color(0x6366f1);

  // Pointer in normalized [-1..1]. Convert to world coords each frame.
  const pointer = { x: 0, y: 0, has: false };

  const handleResize = () => {
    const r = container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(r.width));
    const h = Math.max(1, Math.floor(r.height));
    if (w === width && h === h) return;
    width = w; height = h;
    renderer.setSize(width, height, false);
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
  };
  const ro = 'ResizeObserver' in window ? new ResizeObserver(handleResize) : null;
  if (ro) ro.observe(container);

  let active = true;
  let running = false;
  let raf = 0;
  let disposed = false;

  const positionsAttr = pointsGeom.getAttribute('position');
  const linePosAttr = linesGeom.getAttribute('position');
  const lineColAttr = linesGeom.getAttribute('color');

  const tick = () => {
    raf = 0;
    if (disposed || !active) { running = false; return; }
    running = true;

    const px = pointer.x * (width / 2);
    const py = pointer.y * (height / 2);

    // Update particles
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      positions[ix]     += velocities[ix];
      positions[ix + 1] += velocities[ix + 1];
      positions[ix + 2] += velocities[ix + 2];

      // Gentle pull back to home to keep field stable
      positions[ix]     += (home[ix]     - positions[ix])     * 0.0008;
      positions[ix + 1] += (home[ix + 1] - positions[ix + 1]) * 0.0008;
      positions[ix + 2] += (home[ix + 2] - positions[ix + 2]) * 0.0008;

      // Cursor attraction
      if (pointer.has) {
        const dx = px - positions[ix];
        const dy = py - positions[ix + 1];
        const d2 = dx * dx + dy * dy;
        if (d2 < cursorRadius2 && d2 > 0.01) {
          const f = (1 - d2 / cursorRadius2) * 0.06;
          positions[ix]     += dx * f;
          positions[ix + 1] += dy * f;
        }
      }

      // Wrap around edges with a small margin
      const mx = width / 2 + 40, my = height / 2 + 40;
      if (positions[ix]     >  mx) positions[ix]     = -mx;
      if (positions[ix]     < -mx) positions[ix]     =  mx;
      if (positions[ix + 1] >  my) positions[ix + 1] = -my;
      if (positions[ix + 1] < -my) positions[ix + 1] =  my;
    }
    positionsAttr.needsUpdate = true;

    // Build line segments
    let seg = 0;
    for (let i = 0; i < count && seg < maxSegments; i++) {
      const ax = positions[i * 3];
      const ay = positions[i * 3 + 1];
      const az = positions[i * 3 + 2];
      // Distance from cursor for brightness boost on this endpoint
      let aNear = false;
      if (pointer.has) {
        const dx = px - ax, dy = py - ay;
        aNear = (dx * dx + dy * dy) < cursorRadius2;
      }
      for (let j = i + 1; j < count && seg < maxSegments; j++) {
        const bx = positions[j * 3];
        const by = positions[j * 3 + 1];
        const dx = ax - bx, dy = ay - by;
        const d2 = dx * dx + dy * dy;
        if (d2 > linkDist2) continue;
        const t = 1 - d2 / linkDist2; // 0..1
        const bz = positions[j * 3 + 2];
        const base = t * 0.55;
        let bNear = false;
        if (pointer.has) {
          const ex = px - bx, ey = py - by;
          bNear = (ex * ex + ey * ey) < cursorRadius2;
        }
        const boost = (aNear || bNear) ? 0.35 : 0;
        const bright = Math.min(1, base + boost);
        // Mix cyan-indigo based on t (closer = cyan)
        const mixT = 1 - t;
        const r = cyan.r * t + indigo.r * mixT;
        const g = cyan.g * t + indigo.g * mixT;
        const b = cyan.b * t + indigo.b * mixT;
        const off = seg * 6;
        linePositions[off]     = ax;
        linePositions[off + 1] = ay;
        linePositions[off + 2] = az;
        linePositions[off + 3] = bx;
        linePositions[off + 4] = by;
        linePositions[off + 5] = bz;
        lineColors[off]     = r * bright;
        lineColors[off + 1] = g * bright;
        lineColors[off + 2] = b * bright;
        lineColors[off + 3] = r * bright;
        lineColors[off + 4] = g * bright;
        lineColors[off + 5] = b * bright;
        seg++;
      }
    }
    linesGeom.setDrawRange(0, seg * 2);
    linePosAttr.needsUpdate = true;
    lineColAttr.needsUpdate = true;

    try {
      renderer.render(scene, camera);
    } catch (err) {
      if (window.console) console.warn('[hero-scene] render error', err);
      disposed = true;
      running = false;
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  const start = () => { if (!running && !disposed) tick(); };

  start();

  return {
    setPointer(x, y) {
      // Called with normalized -1..1 values from the orchestrator.
      const nx = Math.max(-1, Math.min(1, Number(x) || 0));
      const ny = Math.max(-1, Math.min(1, Number(y) || 0));
      pointer.x = nx;
      pointer.y = -ny; // screen y is inverted vs world y
      pointer.has = nx !== 0 || ny !== 0;
    },
    setActive(flag) {
      active = !!flag;
      if (active) start();
    },
    destroy() {
      disposed = true;
      active = false;
      if (raf) cancelAnimationFrame(raf);
      if (ro) { try { ro.disconnect(); } catch (_) {} }
      try { pointsGeom.dispose(); } catch (_) {}
      try { linesGeom.dispose(); } catch (_) {}
      try { pointsMat.dispose(); } catch (_) {}
      try { linesMat.dispose(); } catch (_) {}
      try { renderer.dispose(); } catch (_) {}
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }
  };
}
