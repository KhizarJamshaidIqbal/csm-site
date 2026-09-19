# CSM Engine — Autonomous E-Commerce Backend Platform
> **The Autonomous E-Commerce Backend for the AI Builder Era.**
> Bridging Generative UI Builders (Lovable, v0, Bolt, Cursor) to a Battle-Tested 317-Tool MCP Commerce OS.

---

## 🚀 Overview

**CSM Engine (Commerce State Machine)** is an enterprise e-commerce operating system powered by the **Model Context Protocol (MCP)**. While generative AI frontend tools allow creators to build stunning storefronts in 60 seconds, **99% cannot launch** because real commerce requires an immense, mission-critical backend stack.

CSM bridges this gap by letting AI agents autonomously wire frontends to over **317 production-grade MCP tools**—covering Stripe/PayPal payment tokenization, atomic inventory reservation, RMA returns, cart CSRF protection, flash drops, and official WhatsApp CRM.

---

## 💎 Key Features of this Platform

- **Seed Round & Investor Data Room Portal**: High-converting pitch narrative showcasing the $6.3T global TAM, unit economics, defensibility moat, and seed allocation.
- **Interactive Live MCP Terminal Simulator**: Real-time interactive playground simulating prompt-to-MCP tool execution for Streetwear Drops, Post-Purchase RMA returns, and WhatsApp AI bridges (XSS-hardened output rendering).
- **Interactive Engineering ROI Calculator**: Quantifies developer hours, capital saved, and speed-to-market advantages with a dynamic full-time-equivalent estimate.
- **Multi-Tier Early Access Waitlist**: Segmented lead capture for VC/Angel investors, AI builders/agencies, and merchants — delivered via Web3Forms with local backup.
- **6 Architectural Pillars**: Comprehensive technical breakdown of the 317+ MCP tool catalog.
- **Production SEO & A11y**: Canonical URLs, Open Graph + Twitter cards, Organization & FAQPage JSON-LD, sitemap/robots, accessible modals with focus trapping.
- **Sleek Enterprise Design**: Dark glassmorphic aesthetic inspired by Linear, Supabase, and Stripe with a compiled Tailwind production build.

---

## 📁 Directory Layout

```
d:\Local SEO\Site\Khizar\CSM-site\
├── index.html                  # Main investor landing page & early access portal
├── about.html                  # About Us — thesis, origin, milestones, investor CTA
├── security.html               # Security whitepaper & trust center (CSRF, HMAC, RBAC, audit)
├── privacy.html                # Privacy Policy — enterprise sovereign data policy
├── terms.html                  # Terms of Service — licensing, SLA, fair compute
├── robots.txt                  # Crawler directives incl. AI search bots (GPTBot, ClaudeBot, PerplexityBot)
├── sitemap.xml                 # 5-URL canonical sitemap (csmengine.epsoldev.com)
├── tailwind.config.js          # Tailwind content scan + safelist for JS-injected classes
├── css/
│   ├── input.css               # Tailwind source entry (@tailwind directives)
│   ├── tailwind.css            # COMPILED production CSS (do not hand-edit)
│   └── styles.css              # Custom styling, animations, glow effects, terminal theme
├── js/
│   ├── app.js                  # Modals, mobile menu, accordion, tabs, lead capture (Web3Forms), waitlist persistence
│   ├── simulator.js            # Live MCP terminal simulator engine (XSS-hardened rendering)
│   └── calculator.js           # Interactive ROI savings calculator (dynamic FTE estimate)
├── assets/
│   └── icons/
│       └── csm-logo.svg        # Scalable vector logo (also used as favicon)
└── README.md                   # Project documentation & overview
```

---

## ⚡ How to Preview Locally

You can open `index.html` directly in any modern browser:

```powershell
# Option 1: Start a lightweight Python HTTP server
cd "d:\Local SEO\Site\Khizar\CSM-site"
python -m http.server 8080

# Option 2: Open directly in Chrome/Edge
Start-Process "d:\Local SEO\Site\Khizar\CSM-site\index.html"
```

Then visit: `http://localhost:8080`

---

## 🛠 Rebuilding Tailwind CSS

The site uses a **compiled Tailwind production build** (no CDN runtime). After editing
HTML classes or JS-injected classes, regenerate `css/tailwind.css`:

```powershell
# One-time: download the standalone CLI (no Node.js needed)
curl.exe -L -o tailwindcss.exe https://github.com/tailwindlabs/tailwindcss/releases/download/v3.4.17/tailwindcss-windows-x64.exe

# Rebuild (minified)
.\tailwindcss.exe -i css/input.css -o css/tailwind.css --minify
```

`tailwind.config.js` scans `*.html` + `js/**/*.js` and safelists the classes that
`app.js` toggles at runtime — add any new runtime-toggled classes there.

---

## 📮 Activating Lead Capture (Forms)

Both the waitlist and pitch-deck forms post to **Web3Forms** (`api.web3forms.com/submit`):

1. Create a free account at https://web3forms.com and copy your access key.
2. Paste it into `js/app.js` → `LEAD_CAPTURE.accessKey`.

Until the key is set, submissions are backed up to `localStorage` and the forms show
an honest "temporarily unavailable" message.
