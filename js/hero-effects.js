/* Homepage hero v2 orchestrator. No bundler. Classic script.
 * Responsibilities:
 *   - Inject decorative layers (orbs, grid, circuit SVG, sweep, chips, halo, spot).
 *   - Wire pointer parallax + cursor spot.
 *   - Rotating keyword typewriter.
 *   - 3D tilt on hero image card (fine pointer only).
 *   - Lazy-load Three.js scene (js/hero-scene.js -> three CDN) on desktop only.
 *   - Pause/Resume control gates every animated subsystem.
 *   - IntersectionObserver + visibilitychange + prefers-reduced-motion gating.
 * Exposes window.__csmHeroFx for debug/destroy. */
(() => {
  'use strict';

  const hero = document.querySelector('#main-content.bg-radial-hero');
  if (!hero || hero.querySelector('.hero-fx')) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const smallOrCoarse = window.matchMedia('(max-width: 767px), (pointer: coarse)');

  const svgNS = 'http://www.w3.org/2000/svg';
  const make = (tag, className) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  };
  const svgEl = (tag, attrs) => {
    const el = document.createElementNS(svgNS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  /* ------------------------------------------------------------------
   * DOM: decorative layer
   * ---------------------------------------------------------------- */
  const layer = make('div', 'hero-fx');
  layer.setAttribute('aria-hidden', 'true');

  const orbs = make('div', 'hero-fx__orbs');
  orbs.append(
    make('div', 'hero-fx__orb hero-fx__orb--cyan'),
    make('div', 'hero-fx__orb hero-fx__orb--indigo'),
    make('div', 'hero-fx__orb hero-fx__orb--purple')
  );

  const grid = make('div', 'hero-fx__grid');
  const network = make('div', 'hero-fx__network');
  const sweep = make('div', 'hero-fx__sweep');
  const scene = make('div', 'hero-fx__scene');
  const chips = make('div', 'hero-fx__chips');
  const halo = make('div', 'hero-fx__halo');
  const spot = make('div', 'hero-fx__spot');

  const svg = svgEl('svg', {
    viewBox: '0 0 1440 800', preserveAspectRatio: 'none', focusable: 'false'
  });

  // Circuit trace paths. Also reused as motion-path routes for chips.
  const routes = [
    'M0 145 H110 L155 190 H260 L310 240 V330 H395',
    'M0 350 H80 L125 305 H220 L265 350 V455 H365',
    'M0 620 H125 L180 565 H275 V520 L320 475 H400',
    'M65 0 V65 L115 115 H210 V185 L260 235',
    'M0 755 H185 L240 700 V640 H350',
    'M1440 165 H1330 L1285 210 H1180 L1130 260 V350 H1045',
    'M1440 370 H1360 L1315 325 H1220 L1175 370 V475 H1075',
    'M1440 640 H1315 L1260 585 H1165 V540 L1120 495 H1040',
    'M1375 0 V85 L1325 135 H1230 V205 L1180 255',
    'M1440 775 H1255 L1200 720 V660 H1090'
  ];
  routes.forEach((d, i) => {
    svg.appendChild(svgEl('path', { d, class: 'hero-fx__track' }));
    const pulse = svgEl('path', { d, class: 'hero-fx__pulse', pathLength: '100' });
    pulse.style.setProperty('--hero-fx-delay', `${-i * 1.7}s`);
    svg.appendChild(pulse);
  });
  [[110,145],[220,305],[180,565],[210,115],[240,700],
   [1330,165],[1220,325],[1260,585],[1230,135],[1200,720]]
    .forEach(([cx, cy]) => {
      svg.appendChild(svgEl('rect', {
        x: cx - 5, y: cy - 5, width: 10, height: 10, rx: 2, class: 'hero-fx__node'
      }));
    });
  network.appendChild(svg);

  /* ------------------------------------------------------------------
   * MCP data packet chips. Only mounted if CSS Motion Path is supported.
   * ---------------------------------------------------------------- */
  const supportsMotionPath = typeof CSS !== 'undefined'
    && typeof CSS.supports === 'function'
    && (CSS.supports('offset-path', 'path("M0 0")')
      || CSS.supports('(offset-path: path("M0 0"))'));

  const CHIP_LABELS = ['orders', 'stripe', 'inventory', 'cart', 'returns'];
  if (supportsMotionPath && !reduced.matches) {
    CHIP_LABELS.forEach((label, i) => {
      const chip = make('div', 'hero-fx__chip');
      chip.textContent = label;
      // Pick a route per chip. Skip the very top/bottom edge routes.
      const route = routes[(i * 2) % routes.length];
      chip.style.offsetPath = `path('${route}')`;
      // Non-prefixed too for older draft implementations.
      chip.style.setProperty('offset-path', `path('${route}')`);
      chip.style.setProperty('--hero-fx-delay', `${-i * 2.4}s`);
      chips.appendChild(chip);
    });
  }

  layer.append(orbs, grid, network, sweep, scene, chips, halo, spot);
  hero.prepend(layer);

  /* ------------------------------------------------------------------
   * Chip container: scale to match SVG viewBox 1440x800.
   * ---------------------------------------------------------------- */
  const scaleChips = () => {
    const rect = layer.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const sx = rect.width / 1440;
    const sy = rect.height / 800;
    chips.style.transform = `scale(${sx}, ${sy})`;
  };

  /* ------------------------------------------------------------------
   * Pause/Resume control
   * ---------------------------------------------------------------- */
  const control = make('button', 'hero-fx__control');
  control.type = 'button';
  hero.appendChild(control);

  /* ------------------------------------------------------------------
   * State + pointer parallax on halo/spot/network
   * ---------------------------------------------------------------- */
  let userPaused = false;
  let visible = false;
  let active = false;
  let frame = 0;
  let lastTime = 0;
  const target = { x: 0, y: 0, px: 0, py: 0, light: 0, ox: 0, oy: 0 };
  const current = { x: 0, y: 0, px: 0, py: 0, light: 0, ox: 0, oy: 0 };

  const paint = () => {
    network.style.transform = `translate3d(${current.x * 10}px, ${current.y * 8}px, 0)`;
    halo.style.transform = `translate3d(${-current.x * 15}px, ${-current.y * 12}px, 0)`;
    orbs.style.transform = `translate3d(${current.x * 18}px, ${current.y * 14}px, 0)`;
    spot.style.transform = `translate3d(${current.px - 220}px, ${current.py - 220}px, 0)`;
    spot.style.opacity = String(current.light);
    if (heroScene && heroScene.setPointer) heroScene.setPointer(target.x, target.y);
  };
  const stopPointer = () => {
    cancelAnimationFrame(frame);
    frame = 0; lastTime = 0;
    Object.keys(target).forEach(k => { target[k] = 0; current[k] = 0; });
    paint();
  };
  const step = (time) => {
    frame = 0;
    if (!active) return;
    const delta = lastTime ? Math.min(time - lastTime, 64) : 16;
    lastTime = time;
    const ease = 1 - Math.exp(-delta / 85);
    let unsettled = false;
    Object.keys(target).forEach(k => {
      current[k] += (target[k] - current[k]) * ease;
      if (Math.abs(target[k] - current[k]) > 0.005) unsettled = true;
    });
    paint();
    if (unsettled) frame = requestAnimationFrame(step);
    else lastTime = 0;
  };
  const requestPaint = () => {
    if (!frame && active) frame = requestAnimationFrame(step);
  };

  /* ------------------------------------------------------------------
   * Rotating keyword typewriter
   * ---------------------------------------------------------------- */
  const rotator = hero.querySelector('.hero-rotator__word');
  let rotatorTimer = 0;
  let rotatorIdx = 0;
  let rotatorAlive = false;
  const RO_TYPE_MS = 55;
  const RO_DEL_MS = 35;
  const RO_HOLD_MS = 1500;

  const runRotator = () => {
    if (!rotator) return;
    const raw = rotator.getAttribute('data-words') || '';
    const words = raw.split('|').map(s => s.trim()).filter(Boolean);
    if (words.length === 0) return;
    if (reduced.matches) {
      rotator.textContent = words[0];
      return;
    }
    rotatorAlive = true;
    const tick = (phase, buffer, targetWord) => {
      if (!rotatorAlive) return;
      if (!active) { rotatorTimer = setTimeout(() => tick(phase, buffer, targetWord), 200); return; }
      if (phase === 'type') {
        if (buffer.length < targetWord.length) {
          buffer = targetWord.slice(0, buffer.length + 1);
          rotator.textContent = buffer;
          rotatorTimer = setTimeout(() => tick('type', buffer, targetWord), RO_TYPE_MS);
        } else {
          rotatorTimer = setTimeout(() => tick('del', buffer, targetWord), RO_HOLD_MS);
        }
      } else {
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          rotator.textContent = buffer;
          rotatorTimer = setTimeout(() => tick('del', buffer, targetWord), RO_DEL_MS);
        } else {
          rotatorIdx = (rotatorIdx + 1) % words.length;
          const next = words[rotatorIdx];
          rotatorTimer = setTimeout(() => tick('type', '', next), 120);
        }
      }
    };
    rotator.textContent = words[0];
    rotatorTimer = setTimeout(() => tick('del', words[0], words[0]), RO_HOLD_MS);
  };
  const stopRotator = () => {
    rotatorAlive = false;
    if (rotatorTimer) { clearTimeout(rotatorTimer); rotatorTimer = 0; }
  };

  /* ------------------------------------------------------------------
   * 3D tilt on hero image card
   * ---------------------------------------------------------------- */
  const tiltCard = hero.querySelector('.mt-12.relative.max-w-5xl');
  let tiltTarget = { rx: 0, ry: 0 };
  let tiltCurrent = { rx: 0, ry: 0 };
  let tiltFrame = 0;
  let tiltInside = false;

  const paintTilt = () => {
    if (!tiltCard) return;
    tiltCard.style.transform =
      `rotateX(${tiltCurrent.rx.toFixed(3)}deg) rotateY(${tiltCurrent.ry.toFixed(3)}deg)`;
  };
  const tiltStep = () => {
    tiltFrame = 0;
    if (!active) return;
    const ease = 0.14;
    tiltCurrent.rx += (tiltTarget.rx - tiltCurrent.rx) * ease;
    tiltCurrent.ry += (tiltTarget.ry - tiltCurrent.ry) * ease;
    paintTilt();
    if (Math.abs(tiltTarget.rx - tiltCurrent.rx) > 0.01
     || Math.abs(tiltTarget.ry - tiltCurrent.ry) > 0.01) {
      tiltFrame = requestAnimationFrame(tiltStep);
    }
  };
  const requestTilt = () => {
    if (!tiltFrame && active) tiltFrame = requestAnimationFrame(tiltStep);
  };

  if (tiltCard && finePointer.matches && !smallOrCoarse.matches) {
    tiltCard.classList.add('hero-fx-tilt');
    tiltCard.addEventListener('pointermove', (e) => {
      if (!active || e.pointerType === 'touch') return;
      const rect = tiltCard.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      tiltInside = true;
      tiltTarget.ry = nx * 8;   // ±4deg
      tiltTarget.rx = -ny * 8;
      requestTilt();
    }, { passive: true });
    tiltCard.addEventListener('pointerleave', () => {
      tiltInside = false;
      tiltTarget.rx = 0; tiltTarget.ry = 0;
      requestTilt();
    });
  }

  /* ------------------------------------------------------------------
   * Three.js constellation (lazy). Desktop, fine pointer, non-reduced.
   * ---------------------------------------------------------------- */
  let heroScene = null;
  let sceneLoading = false;
  const SHOULD_LOAD_SCENE = () =>
    !reduced.matches && finePointer.matches && !smallOrCoarse.matches;

  const loadScene = () => {
    if (heroScene || sceneLoading || !SHOULD_LOAD_SCENE()) return;
    sceneLoading = true;
    // hero-effects.js is loaded as a classic script; use absolute path.
    import('/js/hero-scene.js')
      .then((mod) => {
        if (!mod || typeof mod.createHeroScene !== 'function') return;
        return mod.createHeroScene(scene, {
          count: window.matchMedia('(min-width: 1024px)').matches ? 140 : 90
        });
      })
      .then((instance) => {
        heroScene = instance || null;
        if (heroScene && heroScene.setActive) heroScene.setActive(active);
      })
      .catch((err) => {
        // Silent fallback. CSS layers still render.
        if (window.console) console.warn('[hero-fx] scene load failed', err);
      })
      .finally(() => { sceneLoading = false; });
  };

  /* ------------------------------------------------------------------
   * Sync gate
   * ---------------------------------------------------------------- */
  const sync = () => {
    active = visible && !document.hidden && !reduced.matches && !userPaused;
    hero.classList.toggle('hero-fx-paused', !active);
    control.hidden = reduced.matches;
    control.textContent = userPaused ? 'Resume motion' : 'Pause motion';
    control.setAttribute('aria-label',
      userPaused ? 'Resume decorative hero animation' : 'Pause decorative hero animation');

    if (heroScene && heroScene.setActive) heroScene.setActive(active);

    if (active) {
      if (!rotatorAlive) runRotator();
      loadScene();
    } else {
      stopPointer();
      if (tiltFrame) { cancelAnimationFrame(tiltFrame); tiltFrame = 0; }
      tiltCurrent.rx = 0; tiltCurrent.ry = 0;
      tiltTarget.rx = 0; tiltTarget.ry = 0;
      paintTilt();
    }
  };

  /* ------------------------------------------------------------------
   * Event wiring
   * ---------------------------------------------------------------- */
  hero.addEventListener('pointermove', (e) => {
    if (!active || !finePointer.matches || e.pointerType === 'touch') return;
    const rect = layer.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const inside = px >= 0 && px <= rect.width && py >= 0 && py <= rect.height;
    target.x = inside ? (px / rect.width - 0.5) * 2 : 0;
    target.y = inside ? (py / rect.height - 0.5) * 2 : 0;
    target.px = px; target.py = py;
    target.light = inside ? 1 : 0;
    requestPaint();
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    target.x = 0; target.y = 0; target.light = 0;
    requestPaint();
  });

  control.addEventListener('click', () => {
    userPaused = !userPaused; sync();
    if (!userPaused && !rotatorAlive) runRotator();
  });

  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { stopPointer(); stopRotator(); });
  window.addEventListener('pageshow', sync);
  reduced.addEventListener('change', sync);
  finePointer.addEventListener('change', sync);
  smallOrCoarse.addEventListener('change', sync);

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(scaleChips);
    ro.observe(layer);
  } else {
    window.addEventListener('resize', scaleChips);
  }
  scaleChips();

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      sync();
    });
    io.observe(layer);
  } else {
    visible = true;
  }

  sync();

  /* ------------------------------------------------------------------
   * Debug / destroy handle
   * ---------------------------------------------------------------- */
  window.__csmHeroFx = {
    pause() { userPaused = true; sync(); },
    resume() { userPaused = false; sync(); },
    destroy() {
      stopPointer();
      stopRotator();
      if (tiltFrame) cancelAnimationFrame(tiltFrame);
      if (heroScene && heroScene.destroy) { try { heroScene.destroy(); } catch (_) {} }
      heroScene = null;
      if (layer.parentNode) layer.parentNode.removeChild(layer);
      if (control.parentNode) control.parentNode.removeChild(control);
      if (tiltCard) {
        tiltCard.classList.remove('hero-fx-tilt');
        tiltCard.style.transform = '';
      }
    }
  };
})();
