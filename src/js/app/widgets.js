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

/* -------------------------------------------------------------
 * Hero Interactive Multi-Screen Showcase Slider
 * ----------------------------------------------------------- */

function initHeroSlider() {
  const slider = document.getElementById("hero-slider");
  if (!slider) return;

  const tabBtns = Array.from(slider.querySelectorAll("[data-hero-slide-tab]"));
  const slidePanels = Array.from(slider.querySelectorAll(".hero-slide-panel"));
  const prevBtn = slider.querySelector("[data-hero-slide-prev]");
  const nextBtn = slider.querySelector("[data-hero-slide-next]");
  const dots = Array.from(slider.querySelectorAll("[data-hero-dot]"));

  if (!slidePanels.length) return;

  let current = 0;
  const count = slidePanels.length;
  let autoTimer = null;
  let isHovered = false;

  const showSlide = (index) => {
    current = (index + count) % count;

    // Update panels
    slidePanels.forEach((panel, i) => {
      const isActive = i === current;
      panel.classList.toggle("opacity-100", isActive);
      panel.classList.toggle("z-10", isActive);
      panel.classList.toggle("opacity-0", !isActive);
      panel.classList.toggle("pointer-events-none", !isActive);
      panel.classList.toggle("z-0", !isActive);
    });

    // Update tabs
    tabBtns.forEach((btn, i) => {
      const isActive = i === current;
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
      const dot = btn.querySelector(".hero-tab-dot");

      if (isActive) {
        btn.classList.add("bg-cyan-500/20", "text-cyan-300", "border-cyan-500/40");
        btn.classList.remove("text-slate-400", "border-transparent");
        if (dot) {
          dot.classList.add("bg-cyan-400");
          dot.classList.remove("bg-slate-600");
        }
        // Smoothly scroll active tab into view if container is horizontally scrollable
        if (typeof btn.scrollIntoView === "function") {
          btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      } else {
        btn.classList.remove("bg-cyan-500/20", "text-cyan-300", "border-cyan-500/40");
        btn.classList.add("text-slate-400", "border-transparent");
        if (dot) {
          dot.classList.remove("bg-cyan-400");
          dot.classList.add("bg-slate-600");
        }
      }
    });

    // Update mobile dots
    dots.forEach((dot, i) => {
      const isActive = i === current;
      dot.className = isActive
        ? "w-5 h-1 rounded-full bg-cyan-400 transition-all"
        : "w-1.5 h-1 rounded-full bg-slate-600 transition-all";
    });
  };

  const next = () => showSlide(current + 1);
  const prev = () => showSlide(current - 1);

  const startAuto = () => {
    stopAuto();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    autoTimer = setInterval(() => {
      if (!isHovered && !document.hidden) next();
    }, 2800);
  };

  const stopAuto = () => {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  };

  tabBtns.forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      showSlide(idx);
      startAuto();
    });
  });

  dots.forEach((dot, idx) => {
    dot.addEventListener("click", () => {
      showSlide(idx);
      startAuto();
    });
  });

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      next();
      startAuto();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prev();
      startAuto();
    });
  }

  slider.addEventListener("mouseenter", () => { isHovered = true; });
  slider.addEventListener("mouseleave", () => { isHovered = false; });

  // Touch swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  slider.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  slider.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
      startAuto();
    }
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  showSlide(0);
  startAuto();
}

