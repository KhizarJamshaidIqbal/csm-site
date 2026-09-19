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
