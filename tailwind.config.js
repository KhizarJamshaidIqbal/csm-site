/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js"
  ],
  safelist: [
    // Classes toggled at runtime by js/app.js (must exist in compiled CSS)
    "bg-[#060913]/90",
    "backdrop-blur-md",
    "border-b",
    "border-white/10",
    "shadow-xl",
    "border-cyan-500",
    "text-white",
    "text-slate-400",
    "border-transparent"
  ],
  theme: {
    extend: {
      colors: {
        space: '#060913',
        card: 'rgba(14, 20, 36, 0.75)',
        primary: '#06B6D4'
      }
    }
  }
}
