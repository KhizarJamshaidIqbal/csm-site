/* Homepage hero Three.js particle constellation. ES module. */
'use strict';

const THREE_CDN_PRIMARY = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const THREE_CDN_FALLBACK = 'https://unpkg.com/three@0.160.0/build/three.module.js';

async function loadThree() {
  try { return await import(/* @vite-ignore */ THREE_CDN_PRIMARY); }
  catch (_) { return await import(/* @vite-ignore */ THREE_CDN_FALLBACK); }
}

export async function createHeroScene(container, options = {}) {
  if (!container || !(container instanceof HTMLElement)) return null;
  let THREE;
  try { THREE = await loadThree(); }
  catch (err) {
    if (window.console) console.warn('[hero-scene] three load failed', err);
    return null;
  }

  const count = Math.max(30, Math.min(200, options.count || 140));
  const linkDist = 120;
  const linkDist2 = linkDist * linkDist;
  const cursorRadius = 180;
  const cursorRadius2 = cursorRadius * cursorRadius;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const initial = container.getBoundingClientRect();
  let width = Math.max(1, Math.floor(initial.width || 1200));
  let height = Math.max(1, Math.floor(initial.height || 600));
  renderer.setSize(width, height, false);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -1000, 1000);
  camera.position.z = 10;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const home = new Float32Array(count * 3);
  const rand = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < count; i++) {
    const x = rand(-width / 2, width / 2);
    const y = rand(-height / 2, height / 2);
    const z = rand(-40, 40);
    const ix = i * 3;
    positions[ix] = home[ix] = x;
    positions[ix + 1] = home[ix + 1] = y;
    positions[ix + 2] = home[ix + 2] = z;
    velocities[ix] = rand(-0.08, 0.08);
    velocities[ix + 1] = rand(-0.08, 0.08);
    velocities[ix + 2] = rand(-0.02, 0.02);
  }

  const pointsGeom = new THREE.BufferGeometry();
  pointsGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pointsMat = new THREE.PointsMaterial({ color: 0x67e8f9, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(new THREE.Points(pointsGeom, pointsMat));

  const maxSegments = count * 6;
  const linePositions = new Float32Array(maxSegments * 2 * 3);
  const lineColors = new Float32Array(maxSegments * 2 * 3);
  const linesGeom = new THREE.BufferGeometry();
  linesGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  linesGeom.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
  linesGeom.setDrawRange(0, 0);
  const linesMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(new THREE.LineSegments(linesGeom, linesMat));
  const cyan = new THREE.Color(0x22d3ee);
  const indigo = new THREE.Color(0x6366f1);
  const pointer = { x: 0, y: 0, has: false };

  const handleResize = () => {
    const rect = container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    if (w === width && h === height) return;
    width = w;
    height = h;
    renderer.setSize(width, height, false);
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(handleResize) : null;
  if (resizeObserver) resizeObserver.observe(container);

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
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      positions[ix] += velocities[ix];
      positions[ix + 1] += velocities[ix + 1];
      positions[ix + 2] += velocities[ix + 2];
      positions[ix] += (home[ix] - positions[ix]) * 0.0008;
      positions[ix + 1] += (home[ix + 1] - positions[ix + 1]) * 0.0008;
      positions[ix + 2] += (home[ix + 2] - positions[ix + 2]) * 0.0008;
      if (pointer.has) {
        const dx = px - positions[ix];
        const dy = py - positions[ix + 1];
        const d2 = dx * dx + dy * dy;
        if (d2 < cursorRadius2 && d2 > 0.01) {
          const force = (1 - d2 / cursorRadius2) * 0.06;
          positions[ix] += dx * force;
          positions[ix + 1] += dy * force;
        }
      }
      const mx = width / 2 + 40;
      const my = height / 2 + 40;
      if (positions[ix] > mx) positions[ix] = -mx;
      if (positions[ix] < -mx) positions[ix] = mx;
      if (positions[ix + 1] > my) positions[ix + 1] = -my;
      if (positions[ix + 1] < -my) positions[ix + 1] = my;
    }
    positionsAttr.needsUpdate = true;

    let segment = 0;
    for (let i = 0; i < count && segment < maxSegments; i++) {
      const ax = positions[i * 3];
      const ay = positions[i * 3 + 1];
      const az = positions[i * 3 + 2];
      let aNear = false;
      if (pointer.has) {
        const dx = px - ax;
        const dy = py - ay;
        aNear = dx * dx + dy * dy < cursorRadius2;
      }
      for (let j = i + 1; j < count && segment < maxSegments; j++) {
        const bx = positions[j * 3];
        const by = positions[j * 3 + 1];
        const dx = ax - bx;
        const dy = ay - by;
        const distance2 = dx * dx + dy * dy;
        if (distance2 > linkDist2) continue;
        const proximity = 1 - distance2 / linkDist2;
        const bz = positions[j * 3 + 2];
        let bNear = false;
        if (pointer.has) {
          const ex = px - bx;
          const ey = py - by;
          bNear = ex * ex + ey * ey < cursorRadius2;
        }
        const bright = Math.min(1, proximity * 0.55 + (aNear || bNear ? 0.35 : 0));
        const mix = 1 - proximity;
        const r = (cyan.r * proximity + indigo.r * mix) * bright;
        const g = (cyan.g * proximity + indigo.g * mix) * bright;
        const b = (cyan.b * proximity + indigo.b * mix) * bright;
        const off = segment * 6;
        linePositions[off] = ax;
        linePositions[off + 1] = ay;
        linePositions[off + 2] = az;
        linePositions[off + 3] = bx;
        linePositions[off + 4] = by;
        linePositions[off + 5] = bz;
        for (const index of [off, off + 3]) {
          lineColors[index] = r;
          lineColors[index + 1] = g;
          lineColors[index + 2] = b;
        }
        segment++;
      }
    }
    linesGeom.setDrawRange(0, segment * 2);
    linePosAttr.needsUpdate = true;
    lineColAttr.needsUpdate = true;
    try { renderer.render(scene, camera); }
    catch (err) {
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
      const nx = Math.max(-1, Math.min(1, Number(x) || 0));
      const ny = Math.max(-1, Math.min(1, Number(y) || 0));
      pointer.x = nx;
      pointer.y = -ny;
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
      if (resizeObserver) { try { resizeObserver.disconnect(); } catch (_) {} }
      for (const resource of [pointsGeom, linesGeom, pointsMat, linesMat]) {
        try { resource.dispose(); } catch (_) {}
      }
      try { renderer.dispose(); } catch (_) {}
      if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}
