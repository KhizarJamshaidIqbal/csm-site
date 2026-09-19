/**
 * CSM Startup Landing & Investor Portal - Main Application Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initModals();
  initFaqAccordion();
  initArchitectureTabs();
  initCopySnippets();
  initWaitlistCounter();
});

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
    return { ok: !!data.ok, reason: data.message || "request_failed" };
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

/* -------------------------------------------------------------
 * Navbar & Mobile Menu
 * ----------------------------------------------------------- */
function initNavbar() {
  const header = document.getElementById("main-header");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header.classList.add("bg-[#060913]/90", "backdrop-blur-md", "border-b", "border-white/10", "shadow-xl");
    } else {
      header.classList.remove("bg-[#060913]/90", "backdrop-blur-md", "border-b", "border-white/10", "shadow-xl");
    }
  });

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
    const mobileLinks = mobileMenu.querySelectorAll ? mobileMenu.querySelectorAll("a") : [];
    mobileLinks.forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
      });
    });
  }
}

/* -------------------------------------------------------------
 * Modals: Early Access Waitlist & Investor Pitch Deck
 * ----------------------------------------------------------- */
function initModals() {
  // Waitlist Modal
  const waitlistModal = document.getElementById("waitlist-modal");
  const waitlistTriggers = document.querySelectorAll(".open-waitlist-btn");
  const waitlistClose = document.getElementById("close-waitlist-btn");
  const waitlistForm = document.getElementById("waitlist-form");
  const waitlistSuccess = document.getElementById("waitlist-success");
  const waitlistTicketNum = document.getElementById("waitlist-ticket-number");

  // Investor Deck Modal
  const deckModal = document.getElementById("deck-modal");
  const deckTriggers = document.querySelectorAll(".open-deck-btn");
  const deckClose = document.getElementById("close-deck-btn");
  const deckForm = document.getElementById("deck-form");
  const deckSuccess = document.getElementById("deck-success");

  // Open Waitlist
  waitlistTriggers.forEach(btn => {
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
  deckTriggers.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(deckModal);
    });
  });

  // Close buttons
  if (waitlistClose) {
    waitlistClose.addEventListener("click", () => closeModal(waitlistModal));
  }
  if (deckClose) {
    deckClose.addEventListener("click", () => closeModal(deckModal));
  }

  // Backdrop click & Escape key
  [waitlistModal, deckModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (!e) return;

    if (e.key === "Escape") {
      closeModal(waitlistModal);
      closeModal(deckModal);
    }

    // Focus trap: keep Tab cycling inside the open modal
    if (e.key === "Tab") {
      const activeModal = [waitlistModal, deckModal].find(m => m && !m.classList.contains("hidden"));
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

  // Success-view close buttons (replaces inline onclick handlers)
  const waitlistSuccessClose = document.getElementById("waitlist-success-close");
  const deckSuccessClose = document.getElementById("deck-success-close");
  if (waitlistSuccessClose) {
    waitlistSuccessClose.addEventListener("click", () => closeModal(waitlistModal));
  }
  if (deckSuccessClose) {
    deckSuccessClose.addEventListener("click", () => closeModal(deckModal));
  }

  // Deep-link support: open modals when arriving from subpages
  // e.g. about.html links to index.html#waitlist or index.html#pitch-deck
  if (window.location.hash === "#waitlist" && waitlistModal) {
    openModal(waitlistModal);
  } else if (window.location.hash === "#pitch-deck" && deckModal) {
    openModal(deckModal);
  }

  // Waitlist Form Submit
  if (waitlistForm) {
    waitlistForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideFormError(waitlistForm);

      const name = document.getElementById("wl-name").value.trim();
      const email = document.getElementById("wl-email").value.trim();
      const company = document.getElementById("wl-company").value.trim();
      const role = document.querySelector('input[name="user_role"]:checked')?.value || "builder";
      const builderTool = document.getElementById("wl-builder")?.value || "lovable";

      // Generate VIP ticket number (vanity number, also used locally)
      const existingWaitlist = safeReadArray("csm_waitlist");
      const ticketNumber = 1420 + existingWaitlist.length + 1;

      const record = {
        name,
        email,
        company,
        role,
        builderTool,
        ticketNumber,
        timestamp: new Date().toISOString()
      };

      // Always keep a local backup so no lead is ever lost
      existingWaitlist.push(record);
      try {
        localStorage.setItem("csm_waitlist", JSON.stringify(existingWaitlist));
      } catch (err) {
        /* storage unavailable — remote delivery is still attempted */
      }

      const submitBtn = waitlistForm.querySelector('button[type="submit"]');
      const result = await submitLead({
        type: "waitlist",
        ticketNumber: ticketNumber,
        timestamp: new Date().toISOString(),
        subject: "New CSM Engine Waitlist Signup",
        from_name: "CSM Engine Waitlist",
        name: name,
        email: email,
        company: company,
        role: role,
        builder_tool: builderTool,
        botcheck: ""
      }, submitBtn);

      if (!result.ok) {
        if (result.reason === "not_configured") {
          showFormError(waitlistForm, "Online signup is temporarily unavailable. Please email founders@csmengine.dev and we will reserve your spot manually.");
        } else {
          showFormError(waitlistForm, "Something went wrong sending your request. Please try again, or email founders@csmengine.dev directly.");
        }
        return;
      }

      if (waitlistTicketNum) {
        waitlistTicketNum.textContent = `#${ticketNumber.toLocaleString()}`;
      }

      waitlistForm.classList.add("hidden");
      if (waitlistSuccess) {
        waitlistSuccess.classList.remove("hidden");
      }
    });
  }

  // Deck Form Submit
  if (deckForm) {
    deckForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideFormError(deckForm);

      const deckEmail = document.getElementById("deck-email").value.trim();
      const deckFund = document.getElementById("deck-fund").value.trim();

      const deckRequests = safeReadArray("csm_deck_requests");
      deckRequests.push({ email: deckEmail, fund: deckFund, date: new Date().toISOString() });
      try {
        localStorage.setItem("csm_deck_requests", JSON.stringify(deckRequests));
      } catch (err) {
        /* storage unavailable — remote delivery is still attempted */
      }

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
        if (result.reason === "not_configured") {
          showFormError(deckForm, "Online requests are temporarily unavailable. Please email founders@csmengine.dev to receive the confidential deck.");
        } else {
          showFormError(deckForm, "Something went wrong sending your request. Please try again, or email founders@csmengine.dev directly.");
        }
        return;
      }

      deckForm.classList.add("hidden");
      if (deckSuccess) {
        deckSuccess.classList.remove("hidden");
      }
    });
  }
}

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

/* -------------------------------------------------------------
 * Dynamic Waitlist Counter
 * ----------------------------------------------------------- */
function initWaitlistCounter() {
  const counterEl = document.getElementById("dynamic-waitlist-count");
  if (!counterEl) return;

  const stored = safeReadArray("csm_waitlist");
  const count = 1420 + stored.length;
  counterEl.textContent = count.toLocaleString();
}

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
function initCopySnippets() {
  const copyButtons = document.querySelectorAll(".copy-snippet-btn");

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

  copyButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-copy-target");
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      copyTextToClipboard(targetEl.textContent.trim()).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="text-emerald-400">✓ Copied!</span>`;
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      }).catch(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="text-amber-400">⚠ Copy blocked — select manually</span>`;
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2500);
      });
    });
  });
}
