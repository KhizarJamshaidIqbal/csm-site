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
      mobileMenu.classList.toggle("hidden");
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
    if (e && e.key === "Escape") {
      closeModal(waitlistModal);
      closeModal(deckModal);
    }
  });

  // Waitlist Form Submit
  if (waitlistForm) {
    waitlistForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("wl-name").value.trim();
      const email = document.getElementById("wl-email").value.trim();
      const company = document.getElementById("wl-company").value.trim();
      const role = document.querySelector('input[name="user_role"]:checked')?.value || "builder";
      const builderTool = document.getElementById("wl-builder")?.value || "lovable";

      // Generate realistic VIP ticket number
      const existingWaitlist = JSON.parse(localStorage.getItem("csm_waitlist") || "[]");
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

      existingWaitlist.push(record);
      localStorage.setItem("csm_waitlist", JSON.stringify(existingWaitlist));

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
    deckForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const deckEmail = document.getElementById("deck-email").value.trim();
      const deckFund = document.getElementById("deck-fund").value.trim();

      const deckRequests = JSON.parse(localStorage.getItem("csm_deck_requests") || "[]");
      deckRequests.push({ email: deckEmail, fund: deckFund, date: new Date().toISOString() });
      localStorage.setItem("csm_deck_requests", JSON.stringify(deckRequests));

      deckForm.classList.add("hidden");
      if (deckSuccess) {
        deckSuccess.classList.remove("hidden");
      }
    });
  }
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

/* -------------------------------------------------------------
 * Dynamic Waitlist Counter
 * ----------------------------------------------------------- */
function initWaitlistCounter() {
  const counterEl = document.getElementById("dynamic-waitlist-count");
  if (!counterEl) return;

  const stored = JSON.parse(localStorage.getItem("csm_waitlist") || "[]");
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

  copyButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-copy-target");
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      navigator.clipboard.writeText(targetEl.textContent.trim()).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="text-emerald-400">✓ Copied!</span>`;
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      });
    });
  });
}
