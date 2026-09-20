/* Homepage ambient v2 orchestrator across sections through FAQ.
   Classic script, defensive cleanup, zero dependencies. */
(() => {
  'use strict';
  const TARGET_SECTIONS = [
    { id: 'main-content', chips: ['orders', 'stripe', 'inventory', 'cart', 'returns'] },
    { id: 'breakthrough', chips: ['ai-store', 'paradox', 'liability', 'state-machine', 'sync'] },
    { id: 'simulator', chips: ['mcp-exec', 'checkout_create', 'tools/call', 'sse-stream', 'sandbox'] },
    { id: 'architecture', chips: ['orders_api', 'inventory_db', 'returns_flow', 'auth_guard', 'webhooks'] },
    { id: 'investor-thesis', chips: ['tam', '0% fee', 'stripe-aws', 'margin', 'growth'] },
    { id: 'calculator', chips: ['dev-costs', 'time-to-market', 'roi', 'savings', 'speed'] },
    { id: 'early-access', chips: ['alpha-key', 'seat', 'founder', 'seed-round', 'whitelist'] },
    { id: 'faq', chips: ['security', 'sla', 'scale', 'zero-trust', 'compliance'] }
  ];

  const heroRoot = document.querySelector('#main-content.bg-radial-hero');
  if (!heroRoot || heroRoot.querySelector('.hero-fx')) return;

  const activeSections = TARGET_SECTIONS
    .map(cfg => ({ ...cfg, el: document.getElementById(cfg.id) }))
    .filter(item => Boolean(item.el && !item.el.querySelector('.hero-fx')));

  if (activeSections.length === 0) return;

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
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  };

  const routes = [
    'M0 145 H110 L155 190 H260 L310 240 V330 H395', 'M0 350 H80 L125 305 H220 L265 350 V455 H365',
    'M0 620 H125 L180 565 H275 V520 L320 475 H400', 'M65 0 V65 L115 115 H210 V185 L260 235',
    'M0 755 H185 L240 700 V640 H350', 'M1440 165 H1330 L1285 210 H1180 L1130 260 V350 H1045',
    'M1440 370 H1360 L1315 325 H1220 L1175 370 V475 H1075', 'M1440 640 H1315 L1260 585 H1165 V540 L1120 495 H1040',
    'M1375 0 V85 L1325 135 H1230 V205 L1180 255', 'M1440 775 H1255 L1200 720 V660 H1090'
  ];

  const supportsMotionPath = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' &&
    (CSS.supports('offset-path', 'path("M0 0")') || CSS.supports('(offset-path: path("M0 0"))'));

  // Global state
  let userPaused = false;
  let inRange = true;
  let active = false;
  let heroScene = null;
  let sceneLoading = false;
  const sectionInstances = [];

  // Mount per-section ambient layers
  activeSections.forEach((item, secIdx) => {
    const layer = make('div', 'hero-fx');
    layer.setAttribute('aria-hidden', 'true');

    const orbs = make('div', 'hero-fx__orbs');
    const orbA = make('div', 'hero-fx__orb hero-fx__orb--cyan');
    const orbB = make('div', 'hero-fx__orb hero-fx__orb--indigo');
    const orbC = make('div', 'hero-fx__orb hero-fx__orb--purple');
    if (secIdx % 2 === 1) {
      orbA.style.animationDelay = '-7s';
      orbB.style.animationDelay = '-11s';
      orbC.style.animationDelay = '-5s';
    }
    orbs.append(orbA, orbB, orbC);

    const grid = make('div', 'hero-fx__grid');
    const network = make('div', 'hero-fx__network');
    const sweep = make('div', 'hero-fx__sweep');
    if (secIdx % 2 === 1) sweep.style.animationDelay = '-4.5s';

    const chips = make('div', 'hero-fx__chips');
    const halo = make('div', 'hero-fx__halo');
    const spot = make('div', 'hero-fx__spot');

    const svg = svgEl('svg', { viewBox: '0 0 1440 800', preserveAspectRatio: 'none', focusable: 'false' });
    routes.forEach((d, index) => {
      svg.appendChild(svgEl('path', { d, class: 'hero-fx__track' }));
      const pulse = svgEl('path', { d, class: 'hero-fx__pulse', pathLength: '100' });
      pulse.style.setProperty('--hero-fx-delay', `${-(index * 1.7 + secIdx * 1.1)}s`);
      svg.appendChild(pulse);
    });
    [[110,145],[220,305],[180,565],[210,115],[240,700],[1330,165],[1220,325],[1260,585],[1230,135],[1200,720]].forEach(([x, y]) => {
      svg.appendChild(svgEl('rect', { x: x - 5, y: y - 5, width: 10, height: 10, rx: 2, class: 'hero-fx__node' }));
    });
    network.appendChild(svg);

    if (supportsMotionPath && !reduced.matches) {
      item.chips.forEach((label, index) => {
        const chip = make('div', 'hero-fx__chip');
        chip.textContent = label;
        chip.style.setProperty('offset-path', `path('${routes[(index * 2) % routes.length]}')`);
        chip.style.setProperty('--hero-fx-delay', `${-(index * 2.4 + secIdx * 1.3)}s`);
        chips.appendChild(chip);
      });
    }

    layer.append(orbs, grid, network, sweep, chips, halo, spot);
    item.el.prepend(layer);

    const scaleChips = () => {
      const rect = layer.getBoundingClientRect();
      if (rect.width && rect.height) {
        chips.style.transform = `scale(${rect.width / 1440}, ${rect.height / 800})`;
      }
    };
    let ro = null;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(scaleChips);
      ro.observe(layer);
    } else window.addEventListener('resize', scaleChips);
    scaleChips();

    // Section-level pointer handling for parallax & spot
    const sTarget = { x: 0, y: 0, px: 0, py: 0, light: 0 };
    const sCurrent = { x: 0, y: 0, px: 0, py: 0, light: 0 };
    let sFrame = 0;
    let sLastTime = 0;

    const paintSection = () => {
      network.style.transform = `translate3d(${sCurrent.x * 10}px, ${sCurrent.y * 8}px, 0)`;
      halo.style.transform = `translate3d(${-sCurrent.x * 15}px, ${-sCurrent.y * 12}px, 0)`;
      orbs.style.transform = `translate3d(${sCurrent.x * 18}px, ${sCurrent.y * 14}px, 0)`;
      spot.style.transform = `translate3d(${sCurrent.px - 220}px, ${sCurrent.py - 220}px, 0)`;
      spot.style.opacity = String(sCurrent.light);
      if (heroScene && heroScene.setPointer) heroScene.setPointer(sTarget.x, sTarget.y);
    };

    const stepSection = (time) => {
      sFrame = 0;
      if (!active) return;
      const delta = sLastTime ? Math.min(time - sLastTime, 64) : 16;
      sLastTime = time;
      const ease = 1 - Math.exp(-delta / 85);
      let unsettled = false;
      Object.keys(sTarget).forEach(key => {
        sCurrent[key] += (sTarget[key] - sCurrent[key]) * ease;
        if (Math.abs(sTarget[key] - sCurrent[key]) > 0.005) unsettled = true;
      });
      paintSection();
      if (unsettled) sFrame = requestAnimationFrame(stepSection); else sLastTime = 0;
    };

    const requestSectionPaint = () => {
      if (!sFrame && active) sFrame = requestAnimationFrame(stepSection);
    };

    const onPointerMove = event => {
      if (!active || !finePointer.matches || event.pointerType === 'touch') return;
      const rect = layer.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const inside = px >= 0 && px <= rect.width && py >= 0 && py <= rect.height;
      sTarget.x = inside ? (px / rect.width - 0.5) * 2 : 0;
      sTarget.y = inside ? (py / rect.height - 0.5) * 2 : 0;
      sTarget.px = px;
      sTarget.py = py;
      sTarget.light = inside ? 1 : 0;
      requestSectionPaint();
    };

    const onPointerLeave = () => {
      sTarget.x = 0; sTarget.y = 0; sTarget.light = 0;
      requestSectionPaint();
    };

    item.el.addEventListener('pointermove', onPointerMove, { passive: true });
    item.el.addEventListener('pointerleave', onPointerLeave);

    sectionInstances.push({
      id: item.id,
      el: item.el,
      layer,
      ro,
      scaleChips,
      onPointerMove,
      onPointerLeave,
      stop() {
        if (sFrame) cancelAnimationFrame(sFrame);
        sFrame = 0; sLastTime = 0;
        Object.keys(sTarget).forEach(k => { sTarget[k] = 0; sCurrent[k] = 0; });
        paintSection();
      }
    });
  });

  // Global Viewport-Fixed Three.js Scene Container
  const fixedScene = make('div', 'hero-fx-fixed-scene');
  fixedScene.setAttribute('aria-hidden', 'true');
  document.body.appendChild(fixedScene);

  // Rotating keyword line in Hero
  let rotatorTimer = 0;
  let rotatorAlive = false;
  let rotatorIndex = 0;
  const rotator = heroRoot.querySelector('.hero-rotator__word');

  const stopRotator = () => {
    rotatorAlive = false;
    if (rotatorTimer) clearTimeout(rotatorTimer);
    rotatorTimer = 0;
  };
  const runRotator = () => {
    if (!rotator || reduced.matches) {
      if (rotator && reduced.matches) rotator.textContent = (rotator.dataset.words || '').split('|')[0];
      return;
    }
    const words = (rotator.dataset.words || '').split('|').map(w => w.trim()).filter(Boolean);
    if (!words.length) return;
    rotatorAlive = true;
    const tick = (phase, buffer, word) => {
      if (!rotatorAlive) return;
      if (!active) { rotatorTimer = setTimeout(() => tick(phase, buffer, word), 200); return; }
      if (phase === 'type' && buffer.length < word.length) {
        buffer = word.slice(0, buffer.length + 1);
        rotator.textContent = buffer;
        rotatorTimer = setTimeout(() => tick('type', buffer, word), 55);
      } else if (phase === 'type') {
        rotatorTimer = setTimeout(() => tick('del', buffer, word), 1500);
      } else if (buffer.length) {
        buffer = buffer.slice(0, -1);
        rotator.textContent = buffer;
        rotatorTimer = setTimeout(() => tick('del', buffer, word), 35);
      } else {
        rotatorIndex = (rotatorIndex + 1) % words.length;
        rotatorTimer = setTimeout(() => tick('type', '', words[rotatorIndex]), 120);
      }
    };
    rotator.textContent = words[0];
    rotatorTimer = setTimeout(() => tick('del', words[0], words[0]), 1500);
  };

  // 3D Perspective Card Tilt in Hero
  let tiltFrame = 0;
  let tiltTarget = { rx: 0, ry: 0 };
  let tiltCurrent = { rx: 0, ry: 0 };
  const tiltCard = heroRoot.querySelector('.mt-12.relative.max-w-5xl');

  const paintTilt = () => {
    if (tiltCard) tiltCard.style.transform = `rotateX(${tiltCurrent.rx.toFixed(3)}deg) rotateY(${tiltCurrent.ry.toFixed(3)}deg)`;
  };
  const tiltStep = () => {
    tiltFrame = 0;
    if (!active) return;
    tiltCurrent.rx += (tiltTarget.rx - tiltCurrent.rx) * 0.14;
    tiltCurrent.ry += (tiltTarget.ry - tiltCurrent.ry) * 0.14;
    paintTilt();
    if (Math.abs(tiltTarget.rx - tiltCurrent.rx) > 0.01 || Math.abs(tiltTarget.ry - tiltCurrent.ry) > 0.01) {
      tiltFrame = requestAnimationFrame(tiltStep);
    }
  };
  const requestTilt = () => { if (!tiltFrame && active) tiltFrame = requestAnimationFrame(tiltStep); };

  let onTiltMove = null;
  let onTiltLeave = null;
  if (tiltCard && finePointer.matches && !smallOrCoarse.matches) {
    tiltCard.classList.add('hero-fx-tilt');
    onTiltMove = event => {
      if (!active || event.pointerType === 'touch') return;
      const rect = tiltCard.getBoundingClientRect();
      tiltTarget.ry = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
      tiltTarget.rx = -((event.clientY - rect.top) / rect.height - 0.5) * 8;
      requestTilt();
    };
    onTiltLeave = () => { tiltTarget.rx = 0; tiltTarget.ry = 0; requestTilt(); };
    tiltCard.addEventListener('pointermove', onTiltMove, { passive: true });
    tiltCard.addEventListener('pointerleave', onTiltLeave);
  }

  // Three.js scene loader
  const shouldLoadScene = () => !reduced.matches && finePointer.matches && !smallOrCoarse.matches;
  const loadScene = () => {
    if (heroScene || sceneLoading || !shouldLoadScene()) return;
    sceneLoading = true;
    import('/js/hero-scene.js').then(module => {
      if (typeof module.createHeroScene === 'function') {
        return module.createHeroScene(fixedScene, {
          count: window.matchMedia('(min-width: 1024px)').matches ? 140 : 90
        });
      }
      return null;
    }).then(instance => {
      heroScene = instance || null;
      if (heroScene && heroScene.setActive) heroScene.setActive(active && inRange);
    }).catch(error => {
      if (window.console) console.warn('[hero-fx] scene load failed', error);
    }).finally(() => { sceneLoading = false; });
  };

  // Sync active states across all sections and Three.js scene
  const sync = () => {
    active = inRange && !document.hidden && !reduced.matches && !userPaused;
    document.body.classList.toggle('hero-fx-paused', !active);
    activeSections.forEach(s => s.el.classList.toggle('hero-fx-paused', !active));
    fixedScene.classList.toggle('hero-fx-hidden', !active);

    if (heroScene && heroScene.setActive) heroScene.setActive(active);

    if (active) {
      if (!rotatorAlive) runRotator();
      loadScene();
    } else {
      sectionInstances.forEach(s => s.stop());
      if (tiltFrame) cancelAnimationFrame(tiltFrame);
      tiltFrame = 0;
      tiltCurrent = { rx: 0, ry: 0 };
      tiltTarget = { rx: 0, ry: 0 };
      paintTilt();
    }
  };

  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => {
    sectionInstances.forEach(s => s.stop());
    stopRotator();
  });
  window.addEventListener('pageshow', sync);
  reduced.addEventListener('change', sync);
  finePointer.addEventListener('change', sync);
  smallOrCoarse.addEventListener('change', sync);

  // Observe range from Hero down through FAQ
  const firstSection = activeSections[0]?.el;
  const lastSection = activeSections[activeSections.length - 1]?.el;
  let rangeObserver = null;
  const intersectingMap = new Map();

  if ('IntersectionObserver' in window && firstSection && lastSection) {
    rangeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        intersectingMap.set(entry.target, entry.isIntersecting);
      });
      inRange = Array.from(intersectingMap.values()).some(Boolean);
      sync();
    }, { rootMargin: '100px 0px 100px 0px' });

    activeSections.forEach(s => {
      intersectingMap.set(s.el, true);
      rangeObserver.observe(s.el);
    });
  } else inRange = true;

  sync();

  window.__csmHeroFx = {
    pause() { userPaused = true; sync(); },
    resume() { userPaused = false; sync(); },
    destroy() {
      stopRotator();
      sectionInstances.forEach(s => {
        s.stop();
        s.el.removeEventListener('pointermove', s.onPointerMove);
        s.el.removeEventListener('pointerleave', s.onPointerLeave);
        if (s.ro) s.ro.disconnect();
        else window.removeEventListener('resize', s.scaleChips);
        if (s.layer.parentNode) s.layer.parentNode.removeChild(s.layer);
      });
      if (rangeObserver) rangeObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
      finePointer.removeEventListener('change', sync);
      smallOrCoarse.removeEventListener('change', sync);
      if (onTiltMove && tiltCard) tiltCard.removeEventListener('pointermove', onTiltMove);
      if (onTiltLeave && tiltCard) tiltCard.removeEventListener('pointerleave', onTiltLeave);
      if (tiltFrame) cancelAnimationFrame(tiltFrame);
      if (heroScene && heroScene.destroy) {
        try { heroScene.destroy(); } catch (_) {}
      }
      heroScene = null;
      if (fixedScene.parentNode) fixedScene.parentNode.removeChild(fixedScene);
      if (tiltCard) { tiltCard.classList.remove('hero-fx-tilt'); tiltCard.style.transform = ''; }
      document.body.classList.remove('hero-fx-paused');
      if (window.__csmHeroFx) delete window.__csmHeroFx;
    }
  };
})();
