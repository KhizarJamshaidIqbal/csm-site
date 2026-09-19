/* Decorative homepage enhancement. No libraries, network data or layout changes. */
(() => {
  'use strict';
  const hero = document.querySelector('#main-content.bg-radial-hero');
  if (!hero || hero.querySelector('.hero-fx')) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const svgNS = 'http://www.w3.org/2000/svg';
  const make = (tag, className) => {
    const el = document.createElement(tag);
    el.className = className;
    return el;
  };
  const svgElement = (tag, attributes) => {
    const el = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  };

  const layer = make('div', 'hero-fx');
  layer.setAttribute('aria-hidden', 'true');
  const halo = make('div', 'hero-fx__halo');
  const network = make('div', 'hero-fx__network');
  const spot = make('div', 'hero-fx__spot');
  const svg = svgElement('svg', {
    viewBox: '0 0 1440 800', preserveAspectRatio: 'none', focusable: 'false'
  });
  // Paired circuit traces frame the copy. These are illustrations, not live telemetry.
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
  routes.forEach((d, index) => {
    svg.appendChild(svgElement('path', { d, class: 'hero-fx__track' }));
    const pulse = svgElement('path', { d, class: 'hero-fx__pulse', pathLength: '100' });
    pulse.style.setProperty('--hero-fx-delay', `${-index * 1.7}s`);
    svg.appendChild(pulse);
  });
  [[110,145], [220,305], [180,565], [210,115], [240,700],
    [1330,165], [1220,325], [1260,585], [1230,135], [1200,720]]
    .forEach(([cx, cy]) => {
      svg.appendChild(svgElement('rect', {
        x: cx - 5, y: cy - 5, width: 10, height: 10, rx: 2, class: 'hero-fx__node'
      }));
    });
  network.appendChild(svg);
  layer.append(halo, network, spot);
  hero.prepend(layer);

  const control = make('button', 'hero-fx__control');
  control.type = 'button';
  hero.appendChild(control);
  let userPaused = false;
  let visible = false;
  let active = false;
  let frame = 0;
  let lastTime = 0;
  let revealDone = false;
  let entrance = [];
  const target = { x: 0, y: 0, px: 0, py: 0, light: 0 };
  const current = { ...target };

  const paint = () => {
    network.style.transform = `translate3d(${current.x * 10}px, ${current.y * 8}px, 0)`;
    halo.style.transform = `translate3d(${-current.x * 15}px, ${-current.y * 12}px, 0)`;
    spot.style.transform = `translate3d(${current.px - 220}px, ${current.py - 220}px, 0)`;
    spot.style.opacity = String(current.light);
  };
  const stopPointer = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    Object.keys(target).forEach(key => { target[key] = 0; current[key] = 0; });
    paint();
  };
  const step = (time) => {
    frame = 0;
    if (!active || !finePointer.matches) return;
    const delta = lastTime ? Math.min(time - lastTime, 64) : 16;
    lastTime = time;
    const ease = 1 - Math.exp(-delta / 85);
    let unsettled = false;
    Object.keys(target).forEach(key => {
      current[key] += (target[key] - current[key]) * ease;
      if (Math.abs(target[key] - current[key]) > 0.005) unsettled = true;
    });
    paint();
    if (unsettled) frame = requestAnimationFrame(step);
    else lastTime = 0;
  };
  const requestPaint = () => {
    if (!frame && active && finePointer.matches) frame = requestAnimationFrame(step);
  };
  const reveal = () => {
    if (revealDone) return;
    revealDone = true;
    const content = hero.querySelector(':scope > .text-center');
    if (!content || typeof content.animate !== 'function') return;
    // Brief opacity-only reveal. Text positions and button hit areas never move.
    entrance = Array.from(content.children).slice(0, 4).map((el, index) =>
      el.animate([{ opacity: 0.8 }, { opacity: 1 }], {
        duration: 500, delay: index * 70, easing: 'ease-out'
      })
    );
  };
  const sync = () => {
    active = visible && !document.hidden && !reduced.matches && !userPaused;
    hero.classList.toggle('hero-fx-paused', !active);
    control.hidden = reduced.matches;
    control.textContent = userPaused ? 'Resume motion' : 'Pause motion';
    control.setAttribute('aria-label', userPaused ? 'Resume decorative hero animation' : 'Pause decorative hero animation');
    if (!active || !finePointer.matches) stopPointer();
    if (active) reveal();
    else {
      entrance.forEach(animation => animation.cancel());
      entrance = [];
    }
  };

  hero.addEventListener('pointermove', event => {
    if (!active || !finePointer.matches || event.pointerType === 'touch') return;
    const rect = layer.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const inside = px >= 0 && px <= rect.width && py >= 0 && py <= rect.height;
    target.x = inside ? (px / rect.width - 0.5) * 2 : 0;
    target.y = inside ? (py / rect.height - 0.5) * 2 : 0;
    target.px = px;
    target.py = py;
    target.light = inside ? 1 : 0;
    requestPaint();
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    target.x = 0;
    target.y = 0;
    target.light = 0;
    requestPaint();
  });
  control.addEventListener('click', () => { userPaused = !userPaused; sync(); });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', stopPointer);
  window.addEventListener('pageshow', sync);
  reduced.addEventListener('change', sync);
  finePointer.addEventListener('change', sync);
  // Observe the decorative area, not the tall hero image further down the page.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    });
    observer.observe(layer);
  }
  // Without IntersectionObserver keep static decoration, with no animation loop.
  sync();
})();
