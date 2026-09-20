/* Homepage hero v2 orchestrator. Classic script, defensive cleanup. */
(() => {
  'use strict';
  const hero = document.querySelector('#main-content.bg-radial-hero');
  if (!hero || hero.querySelector('.hero-fx')) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const smallOrCoarse = window.matchMedia('(max-width: 767px), (pointer: coarse)');
  const svgNS = 'http://www.w3.org/2000/svg';
  const make = (tag, className) => { const el = document.createElement(tag); if (className) el.className = className; return el; };
  const svgEl = (tag, attrs) => { const el = document.createElementNS(svgNS, tag); Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value)); return el; };
  const routes = [
    'M0 145 H110 L155 190 H260 L310 240 V330 H395', 'M0 350 H80 L125 305 H220 L265 350 V455 H365',
    'M0 620 H125 L180 565 H275 V520 L320 475 H400', 'M65 0 V65 L115 115 H210 V185 L260 235',
    'M0 755 H185 L240 700 V640 H350', 'M1440 165 H1330 L1285 210 H1180 L1130 260 V350 H1045',
    'M1440 370 H1360 L1315 325 H1220 L1175 370 V475 H1075', 'M1440 640 H1315 L1260 585 H1165 V540 L1120 495 H1040',
    'M1375 0 V85 L1325 135 H1230 V205 L1180 255', 'M1440 775 H1255 L1200 720 V660 H1090'
  ];

  const layer = make('div', 'hero-fx');
  layer.setAttribute('aria-hidden', 'true');
  const orbs = make('div', 'hero-fx__orbs');
  orbs.append(make('div', 'hero-fx__orb hero-fx__orb--cyan'), make('div', 'hero-fx__orb hero-fx__orb--indigo'), make('div', 'hero-fx__orb hero-fx__orb--purple'));
  const grid = make('div', 'hero-fx__grid');
  const network = make('div', 'hero-fx__network');
  const sweep = make('div', 'hero-fx__sweep');
  const scene = make('div', 'hero-fx__scene');
  const chips = make('div', 'hero-fx__chips');
  const halo = make('div', 'hero-fx__halo');
  const spot = make('div', 'hero-fx__spot');
  const svg = svgEl('svg', { viewBox: '0 0 1440 800', preserveAspectRatio: 'none', focusable: 'false' });
  routes.forEach((d, index) => {
    svg.appendChild(svgEl('path', { d, class: 'hero-fx__track' }));
    const pulse = svgEl('path', { d, class: 'hero-fx__pulse', pathLength: '100' });
    pulse.style.setProperty('--hero-fx-delay', `${-index * 1.7}s`);
    svg.appendChild(pulse);
  });
  [[110,145],[220,305],[180,565],[210,115],[240,700],[1330,165],[1220,325],[1260,585],[1230,135],[1200,720]].forEach(([x, y]) => svg.appendChild(svgEl('rect', { x: x - 5, y: y - 5, width: 10, height: 10, rx: 2, class: 'hero-fx__node' })));
  network.appendChild(svg);

  const supportsMotionPath = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && (CSS.supports('offset-path', 'path("M0 0")') || CSS.supports('(offset-path: path("M0 0"))'));
  if (supportsMotionPath && !reduced.matches) {
    ['orders', 'stripe', 'inventory', 'cart', 'returns'].forEach((label, index) => {
      const chip = make('div', 'hero-fx__chip');
      chip.textContent = label;
      chip.style.setProperty('offset-path', `path('${routes[(index * 2) % routes.length]}')`);
      chip.style.setProperty('--hero-fx-delay', `${-index * 2.4}s`);
      chips.appendChild(chip);
    });
  }
  layer.append(orbs, grid, network, sweep, scene, chips, halo, spot);
  hero.prepend(layer);

  let chipResizeObserver = null;
  const scaleChips = () => {
    const rect = layer.getBoundingClientRect();
    if (rect.width && rect.height) chips.style.transform = `scale(${rect.width / 1440}, ${rect.height / 800})`;
  };
  if ('ResizeObserver' in window) {
    chipResizeObserver = new ResizeObserver(scaleChips);
    chipResizeObserver.observe(layer);
  } else window.addEventListener('resize', scaleChips);
  scaleChips();

  const control = make('button', 'hero-fx__control');
  control.type = 'button';
  hero.appendChild(control);
  let userPaused = false;
  let visible = false;
  let active = false;
  let frame = 0;
  let lastTime = 0;
  const target = { x: 0, y: 0, px: 0, py: 0, light: 0 };
  const current = { x: 0, y: 0, px: 0, py: 0, light: 0 };
  let heroScene = null;
  let sceneLoading = false;
  let rotatorTimer = 0;
  let rotatorAlive = false;
  let rotatorIndex = 0;
  let tiltFrame = 0;
  let tiltTarget = { rx: 0, ry: 0 };
  let tiltCurrent = { rx: 0, ry: 0 };
  const rotator = hero.querySelector('.hero-rotator__word');
  const tiltCard = hero.querySelector('.mt-12.relative.max-w-5xl');

  const paint = () => {
    network.style.transform = `translate3d(${current.x * 10}px, ${current.y * 8}px, 0)`;
    halo.style.transform = `translate3d(${-current.x * 15}px, ${-current.y * 12}px, 0)`;
    orbs.style.transform = `translate3d(${current.x * 18}px, ${current.y * 14}px, 0)`;
    spot.style.transform = `translate3d(${current.px - 220}px, ${current.py - 220}px, 0)`;
    spot.style.opacity = String(current.light);
    if (heroScene && heroScene.setPointer) heroScene.setPointer(target.x, target.y);
  };
  const stopPointer = () => {
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    Object.keys(target).forEach(key => { target[key] = 0; current[key] = 0; });
    paint();
  };
  const step = (time) => {
    frame = 0;
    if (!active) return;
    const delta = lastTime ? Math.min(time - lastTime, 64) : 16;
    lastTime = time;
    const ease = 1 - Math.exp(-delta / 85);
    let unsettled = false;
    Object.keys(target).forEach(key => { current[key] += (target[key] - current[key]) * ease; if (Math.abs(target[key] - current[key]) > 0.005) unsettled = true; });
    paint();
    if (unsettled) frame = requestAnimationFrame(step); else lastTime = 0;
  };
  const requestPaint = () => { if (!frame && active) frame = requestAnimationFrame(step); };

  const stopRotator = () => { rotatorAlive = false; if (rotatorTimer) clearTimeout(rotatorTimer); rotatorTimer = 0; };
  const runRotator = () => {
    if (!rotator || reduced.matches) { if (rotator && reduced.matches) rotator.textContent = (rotator.dataset.words || '').split('|')[0]; return; }
    const words = (rotator.dataset.words || '').split('|').map(word => word.trim()).filter(Boolean);
    if (!words.length) return;
    rotatorAlive = true;
    const tick = (phase, buffer, word) => {
      if (!rotatorAlive) return;
      if (!active) { rotatorTimer = setTimeout(() => tick(phase, buffer, word), 200); return; }
      if (phase === 'type' && buffer.length < word.length) {
        buffer = word.slice(0, buffer.length + 1); rotator.textContent = buffer;
        rotatorTimer = setTimeout(() => tick('type', buffer, word), 55);
      } else if (phase === 'type') rotatorTimer = setTimeout(() => tick('del', buffer, word), 1500);
      else if (buffer.length) { buffer = buffer.slice(0, -1); rotator.textContent = buffer; rotatorTimer = setTimeout(() => tick('del', buffer, word), 35); }
      else { rotatorIndex = (rotatorIndex + 1) % words.length; rotatorTimer = setTimeout(() => tick('type', '', words[rotatorIndex]), 120); }
    };
    rotator.textContent = words[0];
    rotatorTimer = setTimeout(() => tick('del', words[0], words[0]), 1500);
  };

  const paintTilt = () => { if (tiltCard) tiltCard.style.transform = `rotateX(${tiltCurrent.rx.toFixed(3)}deg) rotateY(${tiltCurrent.ry.toFixed(3)}deg)`; };
  const tiltStep = () => {
    tiltFrame = 0;
    if (!active) return;
    tiltCurrent.rx += (tiltTarget.rx - tiltCurrent.rx) * 0.14;
    tiltCurrent.ry += (tiltTarget.ry - tiltCurrent.ry) * 0.14;
    paintTilt();
    if (Math.abs(tiltTarget.rx - tiltCurrent.rx) > 0.01 || Math.abs(tiltTarget.ry - tiltCurrent.ry) > 0.01) tiltFrame = requestAnimationFrame(tiltStep);
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

  const shouldLoadScene = () => !reduced.matches && finePointer.matches && !smallOrCoarse.matches;
  const loadScene = () => {
    if (heroScene || sceneLoading || !shouldLoadScene()) return;
    sceneLoading = true;
    import('/js/hero-scene.js').then(module => typeof module.createHeroScene === 'function' ? module.createHeroScene(scene, { count: window.matchMedia('(min-width: 1024px)').matches ? 140 : 90 }) : null).then(instance => { heroScene = instance || null; if (heroScene && heroScene.setActive) heroScene.setActive(active); }).catch(error => { if (window.console) console.warn('[hero-fx] scene load failed', error); }).finally(() => { sceneLoading = false; });
  };

  const sync = () => {
    active = visible && !document.hidden && !reduced.matches && !userPaused;
    hero.classList.toggle('hero-fx-paused', !active);
    control.hidden = reduced.matches;
    control.textContent = userPaused ? 'Resume motion' : 'Pause motion';
    control.setAttribute('aria-label', userPaused ? 'Resume decorative hero animation' : 'Pause decorative hero animation');
    if (heroScene && heroScene.setActive) heroScene.setActive(active);
    if (active) { if (!rotatorAlive) runRotator(); loadScene(); }
    else { stopPointer(); if (tiltFrame) cancelAnimationFrame(tiltFrame); tiltFrame = 0; tiltCurrent = { rx: 0, ry: 0 }; tiltTarget = { rx: 0, ry: 0 }; paintTilt(); }
  };

  const onHeroPointerMove = event => {
    if (!active || !finePointer.matches || event.pointerType === 'touch') return;
    const rect = layer.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const inside = px >= 0 && px <= rect.width && py >= 0 && py <= rect.height;
    target.x = inside ? (px / rect.width - 0.5) * 2 : 0;
    target.y = inside ? (py / rect.height - 0.5) * 2 : 0;
    target.px = px; target.py = py; target.light = inside ? 1 : 0;
    requestPaint();
  };
  const onHeroPointerLeave = () => { target.x = 0; target.y = 0; target.light = 0; requestPaint(); };
  const onControlClick = () => { userPaused = !userPaused; sync(); };
  const onVisibilityChange = sync;
  const onPageHide = () => { stopPointer(); stopRotator(); };
  const onPageShow = sync;
  hero.addEventListener('pointermove', onHeroPointerMove, { passive: true });
  hero.addEventListener('pointerleave', onHeroPointerLeave);
  control.addEventListener('click', onControlClick);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', onPageHide);
  window.addEventListener('pageshow', onPageShow);
  reduced.addEventListener('change', sync);
  finePointer.addEventListener('change', sync);
  smallOrCoarse.addEventListener('change', sync);

  let intersectionObserver = null;
  if ('IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
    intersectionObserver.observe(layer);
  } else visible = true;
  sync();

  window.__csmHeroFx = {
    pause() { userPaused = true; sync(); },
    resume() { userPaused = false; sync(); },
    destroy() {
      stopPointer(); stopRotator();
      hero.removeEventListener('pointermove', onHeroPointerMove);
      hero.removeEventListener('pointerleave', onHeroPointerLeave);
      control.removeEventListener('click', onControlClick);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      reduced.removeEventListener('change', sync);
      finePointer.removeEventListener('change', sync);
      smallOrCoarse.removeEventListener('change', sync);
      if (onTiltMove && tiltCard) tiltCard.removeEventListener('pointermove', onTiltMove);
      if (onTiltLeave && tiltCard) tiltCard.removeEventListener('pointerleave', onTiltLeave);
      if (chipResizeObserver) chipResizeObserver.disconnect();
      else window.removeEventListener('resize', scaleChips);
      if (intersectionObserver) intersectionObserver.disconnect();
      if (tiltFrame) cancelAnimationFrame(tiltFrame);
      if (heroScene && heroScene.destroy) { try { heroScene.destroy(); } catch (_) {} }
      heroScene = null;
      if (layer.parentNode) layer.parentNode.removeChild(layer);
      if (control.parentNode) control.parentNode.removeChild(control);
      if (tiltCard) { tiltCard.classList.remove('hero-fx-tilt'); tiltCard.style.transform = ''; }
      if (window.__csmHeroFx) delete window.__csmHeroFx;
    }
  };
})();
