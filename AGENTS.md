# AGENTS.md — CSM Engine Startup & Investor Platform

Operating guidelines, deployment contracts, and architecture rules for agents working on the **CSM Engine (Commerce State Machine)** website.

---

## Live production & infrastructure

* **Live URL:** `https://csmengine.epsoldev.com`
* **GitHub Repository:** `https://github.com/KhizarJamshaidIqbal/csm-site`
* **Tracking Branch:** `main`
* **Hosting Platform:** Hostinger Git Integration (`u606995444` / `csmengine.epsoldev.com`)
* **Deployment Path:** `public_html/` (root serves `index.html`)
* **Edge CDN & DNS:** Cloudflare Edge + Hostinger CDN

---

## Auto-deployment rule

1. Hostinger is connected to this repository by webhook. Every push to `main` deploys immediately.
2. **Never push work in progress to `main`.** Work on a branch, open a PR, verify, then merge.
3. **Zero server-side build.** The deployed files are committed: root `*.html` and `js/app.js` are generated from `src/` by `build.js`; `css/tailwind.css` is compiled by the Tailwind CLI. Run the build locally and commit the output.

---

## Source-of-truth rule (read before editing)

| You want to change | Edit | Then run |
|---|---|---|
| Any page markup or copy | `src/pages/*.html` or `src/partials/**` | `npm run build` |
| Header / footer / modals shared by pages | `src/partials/{header,footer,modals}.html` | `npm run build` |
| Homepage sections | `src/partials/home/*.html` | `npm run build` |
| `js/app.js` behaviour | `src/js/app/*.js` (order in `manifest.json`) | `npm run build` |
| Tailwind utilities | any `*.html` / `js/**` class usage | Tailwind CLI (see README) |
| Mail gateway | `php/mailgate.php`, `php/config.php` | none |

Do **not** hand-edit `index.html`, `about.html`, `product.html`, `investors.html`, `security.html`, `privacy.html`, `terms.html`, `js/app.js` or `css/tailwind.css`. `npm run check` fails when generated files drift from their sources.

**Hard limit:** no hand-written source file over 500 lines (`npm run check` enforces it). Split at section boundaries into partials or modules.

---

## Pre-merge checklist

```bash
npm run validate      # build check + size lint + link integrity + JSON-LD
php -l php/mailgate.php
```

Then verify in a browser at 375 / 768 / 1440 px: header, mobile drawer, both modals (open, Escape, focus trap, submit success + error), FAQ accordion, architecture tabs, simulator, calculator.

---

## Post-deployment cache invalidation

After a merge to `main`, purge caches via CSM MCP tools:

```bash
hostinger_cache_purge { domain: "epsoldev.com" }
tools_purge_cache {}
```

---

## Live verification contract (ScreenSync)

Never assume a change works without visual and DOM confirmation on the live site:

1. `web_navigate` to `https://csmengine.epsoldev.com/`, focus the window, capture desktop + mobile screenshots.
2. Verify: waitlist and deck modals (role switching, submit, success view), MCP terminal simulator (scripted stream + preview), ROI calculator sliders, mobile drawer, FAQ, tabs.
3. Check the browser console for errors and the network panel for 404s.

---

## Coding standards

* **Boring over clever:** shortest working diff wins.
* **Semantic HTML** with correct ARIA; keep the design system (dark theme, cyan/violet accents, Plus Jakarta Sans + JetBrains Mono) untouched unless the task is a design change.
* **No broken assets:** verify every relative path before pushing. The only images in the repo are `assets/icons/csm-logo.svg` and `assets/images/hero-agent-mesh.jpg`.
* **Defensive DOM queries:** presence-guard every `getElementById` result; `js/app.js` is shared by all pages and not every element exists on every page.
* **Never commit secrets.** `php/config.creds.php` and `php/submissions.log` are gitignored and blocked by `php/.htaccess`.
