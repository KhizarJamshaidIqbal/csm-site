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
