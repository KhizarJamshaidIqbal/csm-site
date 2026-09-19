/* Landing page only. No store credentials or live MCP calls belong here. */
'use strict';
(() => {
  const menu = document.getElementById('site-nav');
  const toggle = document.getElementById('mobile-menu-btn');
  const mobile = window.matchMedia('(max-width: 800px)');
  function closeMenu() {
    if (!menu || !toggle) return;
    toggle.setAttribute('aria-expanded', 'false');
    menu.hidden = mobile.matches;
  }
  if (menu && toggle) {
    const syncMenu = () => { toggle.hidden = !mobile.matches; closeMenu(); };
    syncMenu();
    mobile.addEventListener('change', syncMenu);
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(expanded));
      menu.hidden = !expanded;
    });
    menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && mobile.matches && !menu.hidden) { closeMenu(); toggle.focus(); }
    });
  }
  document.querySelectorAll('a[data-role]').forEach(link => {
    link.addEventListener('click', () => {
      const role = document.getElementById('wl-role');
      if (role) role.value = link.dataset.role;
    });
  });
  const walkthroughs = {
    build: ['Discover the MCP tool catalog and schemas.', 'Read store context with authorized access.', 'Preview supported changes and obtain approval.', 'Connect the public API and test the storefront.'],
    operate: ['Inspect the current store state.', 'Choose an operation allowed by the token permissions.', 'Explicitly request a dry run when the tool supports it.', 'Approve the intended change, then read back the result.']
  };
  document.querySelectorAll('[data-demo]').forEach(button => {
    button.addEventListener('click', () => {
      const steps = walkthroughs[button.dataset.demo];
      const target = document.getElementById('demo-steps');
      if (!steps || !target) return;
      document.querySelectorAll('[data-demo]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      target.replaceChildren(...steps.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    });
  });
  const estimate = document.getElementById('estimate-form');
  if (estimate) {
    const calculate = () => {
      const output = document.getElementById('estimate-result');
      if (!output) return;
      if (!estimate.checkValidity()) { output.textContent = 'Enter valid values within the allowed ranges.'; return; }
      const hours = document.getElementById('estimate-hours').valueAsNumber;
      const rate = document.getElementById('estimate-rate').valueAsNumber;
      const projects = document.getElementById('estimate-projects').valueAsNumber;
      const total = hours * rate * projects;
      output.textContent = Number.isFinite(total) ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(total)} estimated time value` : 'Enter valid numbers.';
    };
    estimate.addEventListener('submit', event => { event.preventDefault(); calculate(); });
    estimate.addEventListener('input', calculate);
    calculate();
  }
  document.querySelectorAll('.lead-form').forEach(form => {
    let submitting = false;
    let completed = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitting || completed || !form.reportValidity()) return;
      const button = form.querySelector('button[type="submit"]');
      const status = form.querySelector('.form-status');
      if (!button || !status) return;
      const fields = new FormData(form);
      const value = name => String(fields.get(name) || '').trim();
      const type = form.dataset.leadType;
      if (!['waitlist', 'deck'].includes(type)) return;
      if (value('botcheck')) { status.dataset.error = 'true'; status.textContent = 'Unable to submit this request.'; return; }
      // Match the existing PHP gateway allow-list. Never manufacture queue positions.
      const payload = {
        type, email: value('email'), name: value('name'), company: value('company'),
        role: value('role'), fund: value('fund'), builder_tool: value('builder_tool'),
        botcheck: value('botcheck'), timestamp: new Date().toISOString(),
        subject: type === 'waitlist' ? 'New CSM Engine Waitlist Signup' : 'New CSM Engine Pitch Deck Request',
        from_name: type === 'waitlist' ? 'CSM Engine Waitlist' : 'CSM Engine Investor Portal'
      };
      submitting = true;
      button.disabled = true;
      const label = button.textContent;
      button.textContent = 'Sending request…';
      form.setAttribute('aria-busy', 'true');
      status.dataset.error = 'false';
      status.textContent = 'Sending your request securely.';
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch('/php/mailgate.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload), signal: controller.signal, credentials: 'same-origin'
        });
        const result = await response.json();
        if (!response.ok || result.ok !== true) throw new Error('Submission not confirmed');
        completed = true;
        form.reset();
        status.textContent = type === 'waitlist' ? 'Request received. Thank you for your interest in early access. The team will review your request.' : 'Investor request received. The team will follow up by email.';
        button.textContent = 'Request received';
      } catch (error) {
        status.dataset.error = 'true';
        status.textContent = 'We could not confirm delivery. Your details are still in this form. Please email info@epsoldev.com before resubmitting if you are unsure whether the request was received.';
      } finally {
        window.clearTimeout(timeout);
        submitting = false;
        form.removeAttribute('aria-busy');
        if (!completed) { button.disabled = false; button.textContent = label; }
      }
    });
  });
})();
