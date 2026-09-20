/**
 * CSM Startup Landing & Investor Portal - Main Application Logic
 *
 * GENERATED FILE. Do not edit directly.
 * Sources: src/js/app/*.js (order defined in src/js/app/manifest.json)
 * Rebuild:  npm run build
 */

/* ---- src/js/app/lead-capture.js ---- */
/* -------------------------------------------------------------
 * Lead capture configuration
 * Points at your own Gmail SMTP mail gateway (/php/mailgate.php).
 * On the live Hostinger site, credentials live in config.creds.php (gitignored,
 * set once via hPanel) and the endpoint is relative: /php/mailgate.php
 * ----------------------------------------------------------- */
const LEAD_CAPTURE = {
  LIVE_ON_SERVER: true,
  endpoint: "/php/mailgate.php"
};

function safeReadArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function rememberLocally(key, record) {
  const existing = safeReadArray(key);
  existing.push(record);
  try {
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (err) {
    /* storage unavailable — remote delivery is still attempted */
  }
}

async function submitLead(payload, submitBtn) {
  if (!LEAD_CAPTURE.LIVE_ON_SERVER) {
    return { ok: false, reason: "not_configured" };
  }

  const originalLabel = submitBtn ? submitBtn.innerHTML : "";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Sending...";
  }

  try {
    const res = await fetch(LEAD_CAPTURE.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    return { ok: !!data.ok, reason: data.code || data.message || "request_failed", message: data.message || "" };
  } catch (err) {
    return { ok: false, reason: "network" };
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    }
  }
}

function showFormError(form, message) {
  const errBox = form ? form.querySelector(".form-error") : null;
  if (!errBox) return;
  errBox.textContent = message;
  errBox.classList.remove("hidden");
}


function hideFormError(form) {
  const errBox = form ? form.querySelector(".form-error") : null;
  if (errBox) {
    errBox.textContent = "";
    errBox.classList.add("hidden");
  }
}

function leadFailureMessage(result, unavailableMessage) {
  if (result.reason === "not_configured") {
    return unavailableMessage;
  }
  return result.message || "Something went wrong sending your request. Please try again, or email info@epsoldev.com directly.";
}

/* ---- src/js/app/navbar.js ---- */
/* -------------------------------------------------------------
 * Navbar & Mobile Menu
 * ----------------------------------------------------------- */

const SCROLLED_HEADER_CLASSES = ["bg-[#060913]/90", "backdrop-blur-md", "border-b", "border-white/10", "shadow-xl"];

function initNavbar() {
  const header = document.getElementById("main-header");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  // Only the homepage has a transparent header that gains a backdrop on scroll.
  // Secondary pages ship a permanently styled header without #main-header.
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 20) {
        header.classList.add(...SCROLLED_HEADER_CLASSES);
      } else {
        header.classList.remove(...SCROLLED_HEADER_CLASSES);
      }
    });
  }

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      const willOpen = mobileMenu.classList.contains("hidden");
      mobileMenu.classList.toggle("hidden");
      mobileMenuBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });

    // Close mobile menu on Escape key
    document.addEventListener("keydown", (e) => {
      if (e && e.key === "Escape" && !mobileMenu.classList.contains("hidden")) {
        mobileMenu.classList.add("hidden");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
        mobileMenuBtn.focus();
      }
    });

    // Close mobile menu on anchor click
    mobileMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }
}

/* ---- src/js/app/modals.js ---- */

/* -------------------------------------------------------------
 * Modals: Early Access Waitlist & Investor Pitch Deck
 * ----------------------------------------------------------- */

let lastFocusedElement = null;

function getModalFocusables(modal) {
  return Array.from(
    modal.querySelectorAll('a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])')
  ).filter(el => el.offsetParent !== null);
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  lastFocusedElement = document.activeElement;

  // Move focus into the modal (prefer the first form field)
  const focusables = getModalFocusables(modal);
  if (focusables.length) {
    const firstInput = modal.querySelector('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea');
    const target = firstInput && focusables.includes(firstInput) ? firstInput : focusables[0];
    target.focus();
  }
}

function closeModal(modal) {
  if (!modal) return;
  const wasOpen = !modal.classList.contains("hidden");
  modal.classList.add("hidden");

  // Only restore page scroll when no modal remains open
  if (!document.querySelector("#waitlist-modal:not(.hidden), #deck-modal:not(.hidden)")) {
    document.body.style.overflow = "";
  }

  if (wasOpen && lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
  lastFocusedElement = null;
}

function bindModalChrome(modal, closeBtn, successCloseBtn) {
  if (!modal) return;
  if (closeBtn) closeBtn.addEventListener("click", () => closeModal(modal));
  if (successCloseBtn) successCloseBtn.addEventListener("click", () => closeModal(modal));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal);
  });
}


function bindModalKeyboard(modals) {
  document.addEventListener("keydown", (e) => {
    if (!e) return;

    if (e.key === "Escape") {
      modals.forEach(closeModal);
    }

    // Focus trap: keep Tab cycling inside the open modal
    if (e.key === "Tab") {
      const activeModal = modals.find(m => m && !m.classList.contains("hidden"));
      if (!activeModal) return;

      const focusables = getModalFocusables(activeModal);
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}


function bindWaitlistForm(waitlistForm, waitlistSuccess) {
  if (!waitlistForm) return;
  waitlistForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFormError(waitlistForm);

    const name = document.getElementById("wl-name").value.trim();
    const email = document.getElementById("wl-email").value.trim();
    const company = document.getElementById("wl-company").value.trim();
    const role = document.querySelector('input[name="user_role"]:checked')?.value || "builder";
    const builderTool = document.getElementById("wl-builder")?.value || "lovable";

    // Always keep a local backup so no lead is ever lost
    rememberLocally("csm_waitlist", { name, email, company, role, builderTool, timestamp: new Date().toISOString() });

    const submitBtn = waitlistForm.querySelector('button[type="submit"]');
    const result = await submitLead({
      type: "waitlist",
      timestamp: new Date().toISOString(),
      subject: "New CSM Engine Waitlist Signup",
      name: name,
      email: email,
      company: company,
      role: role,
      builder_tool: builderTool,
      botcheck: ""
    }, submitBtn);

    if (!result.ok) {
      showFormError(waitlistForm, leadFailureMessage(result,
        "Online signup is temporarily unavailable. Please email info@epsoldev.com and we will reserve your spot manually."));
      return;
    }

    waitlistForm.classList.add("hidden");
    if (waitlistSuccess) {
      waitlistSuccess.classList.remove("hidden");
    }
  });
}


function bindDeckForm(deckForm, deckSuccess) {
  if (!deckForm) return;
  deckForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFormError(deckForm);

    const deckEmail = document.getElementById("deck-email").value.trim();
    const deckFund = document.getElementById("deck-fund").value.trim();

    rememberLocally("csm_deck_requests", { email: deckEmail, fund: deckFund, date: new Date().toISOString() });

    const submitBtn = deckForm.querySelector('button[type="submit"]');
    const result = await submitLead({
      type: "deck",
      subject: "New CSM Engine Pitch Deck Request",
      from_name: "CSM Engine Investor Portal",
      fund: deckFund,
      email: deckEmail,
      botcheck: ""
    }, submitBtn);

    if (!result.ok) {
      showFormError(deckForm, leadFailureMessage(result,
        "Online requests are temporarily unavailable. Please email info@epsoldev.com to receive the confidential deck."));
      return;
    }

    deckForm.classList.add("hidden");
    if (deckSuccess) {
      deckSuccess.classList.remove("hidden");
    }
  });
}


function initModals() {
  const waitlistModal = document.getElementById("waitlist-modal");
  const deckModal = document.getElementById("deck-modal");

  // Open Waitlist (optionally preselecting a role via data-role)
  document.querySelectorAll(".open-waitlist-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const preselectedRole = btn.getAttribute("data-role");
      if (preselectedRole) {
        const roleRadio = document.querySelector(`input[name="user_role"][value="${preselectedRole}"]`);
        if (roleRadio) roleRadio.checked = true;
      }
      openModal(waitlistModal);
    });
  });

  // Open Deck Modal
  document.querySelectorAll(".open-deck-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(deckModal);
    });
  });

  bindModalChrome(waitlistModal, document.getElementById("close-waitlist-btn"), document.getElementById("waitlist-success-close"));
  bindModalChrome(deckModal, document.getElementById("close-deck-btn"), document.getElementById("deck-success-close"));
  bindModalKeyboard([waitlistModal, deckModal]);

  // Deep-link support: open modals when arriving from subpages
  // e.g. /about links to /#waitlist or /#pitch-deck
  if (window.location.hash === "#waitlist" && waitlistModal) {
    openModal(waitlistModal);
  } else if (window.location.hash === "#pitch-deck" && deckModal) {
    openModal(deckModal);
  }

  bindWaitlistForm(document.getElementById("waitlist-form"), document.getElementById("waitlist-success"));
  bindDeckForm(document.getElementById("deck-form"), document.getElementById("deck-success"));
}

/* ---- src/js/app/widgets.js ---- */
/* -------------------------------------------------------------
 * FAQ Accordion
 * ----------------------------------------------------------- */


function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach(item => {
    const btn = item.querySelector(".faq-question");
    const ans = item.querySelector(".faq-answer");
    const icon = item.querySelector(".faq-icon");

    if (!btn || !ans) return;

    btn.addEventListener("click", () => {
      const isExpanded = btn.getAttribute("aria-expanded") === "true";

      // Close all other items for clean accordion UX
      faqItems.forEach(otherItem => {
        const otherBtn = otherItem.querySelector(".faq-question");
        const otherAns = otherItem.querySelector(".faq-answer");
        const otherIcon = otherItem.querySelector(".faq-icon");
        if (otherBtn && otherAns) {
          otherBtn.setAttribute("aria-expanded", "false");
          otherAns.classList.add("hidden");
          if (otherIcon) otherIcon.style.transform = "rotate(0deg)";
        }
      });

      if (!isExpanded) {
        btn.setAttribute("aria-expanded", "true");
        ans.classList.remove("hidden");
        if (icon) icon.style.transform = "rotate(180deg)";
      }
    });
  });
}

/* -------------------------------------------------------------
 * Architecture 6 Pillars Tabs
 * ----------------------------------------------------------- */


function initArchitectureTabs() {
  const tabButtons = document.querySelectorAll(".arch-tab-btn");
  const tabPanels = document.querySelectorAll(".arch-tab-panel");

  if (!tabButtons.length) return;

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetPillar = btn.getAttribute("data-pillar");

      tabButtons.forEach(b => {
        b.classList.remove("tab-active", "border-cyan-500", "text-white");
        b.classList.add("text-slate-400", "border-transparent");
      });

      btn.classList.add("tab-active", "border-cyan-500", "text-white");
      btn.classList.remove("text-slate-400", "border-transparent");

      tabPanels.forEach(panel => {
        if (panel.id === `pillar-${targetPillar}`) {
          panel.classList.remove("hidden");
        } else {
          panel.classList.add("hidden");
        }
      });
    });
  });
}

/* -------------------------------------------------------------
 * Copy Snippets
 * ----------------------------------------------------------- */

function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for non-secure contexts / older browsers
  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      ok ? resolve() : reject(new Error("copy_failed"));
    } catch (err) {
      document.body.removeChild(textarea);
      reject(err);
    }
  });
}

function flashButtonLabel(btn, html, ms) {
  const originalText = btn.innerHTML;
  btn.innerHTML = html;
  setTimeout(() => {
    btn.innerHTML = originalText;
  }, ms);
}


function initCopySnippets() {
  document.querySelectorAll(".copy-snippet-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-copy-target");
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      copyTextToClipboard(targetEl.textContent.trim())
        .then(() => flashButtonLabel(btn, `<span class="text-emerald-400">✓ Copied!</span>`, 2000))
        .catch(() => flashButtonLabel(btn, `<span class="text-amber-400">⚠ Copy blocked — select manually</span>`, 2500));
    });
  });
}

/* ---- src/js/app/bootstrap.js ---- */
/* -------------------------------------------------------------
 * Bootstrap: single entry point
 * ----------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initModals();
  initFaqAccordion();
  initArchitectureTabs();
  initCopySnippets();

  // Progressive enhancement only. No dependencies.
  const heroRoot = document.querySelector("#main-content.bg-radial-hero");
  if (!heroRoot) return;

  const stylesheetHref = "css/hero-effects.css";
  const scriptSrc = "js/hero-effects.js";

  const startHeroEffects = () => {
    if (document.querySelector(`script[src="${scriptSrc}"]`)) return;
    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    document.head.appendChild(script);
  };

  const existingStylesheet = document.querySelector(`link[href="${stylesheetHref}"]`);
  if (existingStylesheet) {
    if (existingStylesheet.sheet) startHeroEffects();
    else existingStylesheet.addEventListener("load", startHeroEffects, { once: true });
    return;
  }

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = stylesheetHref;
  stylesheet.addEventListener("load", startHeroEffects, { once: true });
  document.head.appendChild(stylesheet);
});
