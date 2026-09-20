# CSM Engine — Startup & Investor Site
> **The Autonomous E-Commerce Backend for the AI Builder Era.**
> Bridging generative UI builders (Lovable, v0, Bolt, Cursor) to a 317-tool MCP commerce backend.

---

## Overview

**CSM Engine (Commerce State Machine)** is a headless commerce backend for WordPress with a React admin, a public `csm/v1` REST API and an MCP server exposing 317 tools, 5 resources and curated prompts to AI agents. This repository is the public marketing and investor website for it.

---

## Architecture of this repository

The deployed site is plain static HTML + compiled Tailwind + vanilla JS + a small PHP mail gateway. To keep every source file small and shared chrome in one place, the HTML and `js/app.js` are **compiled from `src/`** by `build.js` and the generated output is committed (same policy as `css/tailwind.css`). Hostinger serves the committed files; no server-side build runs on deploy.

```
├── build.js                    # Page compiler + JS bundler + size lint (Node >= 18, no dependencies)
├── package.json                # npm scripts: build, check, validate, tailwind
├── src/                        # SOURCES (edit these)
│   ├── pages/*.html            # One file per page; JSON front-matter + {{> partial}} includes
│   ├── partials/
│   │   ├── header.html         # Shared header + mobile drawer for secondary pages
│   │   ├── footer.html         # Shared footer for secondary pages
│   │   ├── modals.html         # Waitlist + pitch-deck modals
│   │   ├── scripts.html        # Script tags + closing body/html
│   │   ├── legal/              # Reduced chrome for privacy/terms
│   │   ├── home/               # Homepage sections (hero, simulator, architecture, ...)
│   │   ├── product/            # Architecture page sections
│   │   └── investors/          # Investors page specific modals
│   └── js/app/                 # app.js modules, concatenated in manifest.json order
├── index.html, about.html, product.html, investors.html,
│   security.html, privacy.html, terms.html   # GENERATED (do not hand-edit)
├── js/
│   ├── app.js                  # GENERATED from src/js/app
│   ├── simulator.js            # Scripted MCP terminal demo (homepage only)
│   ├── calculator.js           # ROI worksheet (homepage only)
│   ├── hero-effects.js         # Homepage hero v2 orchestrator (loaded on homepage only)
│   └── hero-scene.js           # Three.js constellation ES module, loaded lazily by hero-effects.js
├── css/
│   ├── input.css               # Tailwind entry
│   ├── tailwind.css            # COMPILED Tailwind (do not hand-edit)
│   ├── styles.css              # Custom styling, animations, terminal theme
│   └── hero-effects.css        # Homepage hero v2 decorative layers
├── php/
│   ├── mailgate.php            # Lead gateway (waitlist | deck) -> SMTP via PHPMailer
│   ├── config.php              # Credential loader (no secrets)
│   ├── .htaccess               # Blocks web access to submissions.log / config.creds.php
│   └── PHPMailer/              # Vendored library
├── assets/                     # Logo + hero image
├── validate-links.js           # Internal link + anchor integrity
├── validate-ld.js              # JSON-LD parse check
├── robots.txt, sitemap.xml, tailwind.config.js
└── AGENTS.md                   # Operations contract for agents
```

### Template syntax (`src/`)

| Syntax | Meaning |
|---|---|
| `---` JSON `---` | Front-matter at the top of a page, e.g. `{"page":"about"}` |
| `{{> header.html}}` | Include `src/partials/header.html` (nested includes allowed) |
| `{{desknav about}}` | Desktop nav link attributes; active when `page` matches |
| `{{mobnav about}}` | Mobile drawer link attributes |
| `{{footnav about}}` | Footer link attributes |
| `{{page}}` | Any front-matter variable |

### Rules

- Edit files under `src/`, then run `npm run build`. Commit both the source and the regenerated output.
- No hand-written source file may exceed **500 lines**. `npm run check` fails the build otherwise.
- `npm run check` also fails when a committed generated file no longer matches its sources.


## Clean URLs

Apache/LiteSpeed uses the root `.htaccess` file to map clean page URLs to the committed root HTML files.

- Write internal page links as `/`, `/product`, `/investors`, `/about`, `/security`, `/privacy`, and `/terms`.
- Do not author internal links as `index.html` or `about.html`.
- `/about` is served from `about.html`, and direct requests to `about.html` redirect to `/about`.

---


## Local workflow

```powershell
npm run build            # regenerate root HTML + js/app.js from src/
npm run check            # generated output up to date + size lint
npm run validate         # check + link integrity + JSON-LD
python -m http.server 8080   # preview at http://localhost:8080 (forms need PHP)
```

### Rebuilding Tailwind CSS

```powershell
# One-time: standalone CLI, no Node needed
curl.exe -L -o tailwindcss.exe https://github.com/tailwindlabs/tailwindcss/releases/download/v3.4.17/tailwindcss-windows-x64.exe
.\tailwindcss.exe -i css/input.css -o css/tailwind.css --minify
```

`tailwind.config.js` scans `*.html` (generated pages) and `js/**/*.js`, and safelists classes toggled at runtime by `src/js/app/navbar.js` and `widgets.js`.

---

## Lead capture (forms)

Both forms POST JSON to `/php/mailgate.php` with `type: "waitlist" | "deck"`.

- Delivery: authenticated SMTP via PHPMailer.
- Credentials: `php/config.creds.php` (gitignored, created once on the server via hPanel). If absent the endpoint returns `503 { ok:false, code:"not_configured" }`.
- Server controls subject and sender name. Per-IP rate limit (10/min), honeypot, strict field allow-list.
- Every validated submission is appended to `php/submissions.log` **before** SMTP is attempted, so a delivery failure never loses a lead. The log is blocked from HTTP by `php/.htaccess`.
- Status codes: `200` ok, `400` validation, `405` method, `429` rate limited, `502` SMTP failure, `503` not configured.
