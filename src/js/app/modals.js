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
