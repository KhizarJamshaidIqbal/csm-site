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
