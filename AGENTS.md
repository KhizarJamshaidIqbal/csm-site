# AGENTS.md — CSM Engine Startup & Investor Platform

Operating guidelines, deployment contracts, and architecture rules for agents working on the **CSM Engine (Commerce State Machine)** startup platform.

---

## 🚀 Live Production & Infrastructure

* **Live URL:** `https://csmengine.epsoldev.com`
* **GitHub Repository:** `https://github.com/KhizarJamshaidIqbal/csm-site`
* **Tracking Branch:** `main`
* **Hosting Platform:** Hostinger Git Integration (`u606995444` / `csmengine.epsoldev.com`)
* **Deployment Path:** `public_html/` (Root serving `index.html`)
* **Edge CDN & DNS:** Cloudflare Edge + Hostinger CDN

---

## ⚡ Mandatory Auto-Deployment Rule

> **"git push karein ge, site automatically bina kisi click ke 1 second mein live update ho jaya karegi!"**

1. **Direct GitHub Webhook Connection:**  
   Hostinger is natively connected to GitHub repository `KhizarJamshaidIqbal/csm-site`.
2. **Instant Sync:**  
   Whenever an agent commits and executes `git push origin main`, Hostinger triggers the auto-deployment webhook instantly.
3. **Zero Build Step:**  
   The site uses modern vanilla web standards (HTML5, compiled Tailwind CSS, JetBrains Mono/Plus Jakarta Sans, ES2023). Tailwind is pre-compiled into `css/tailwind.css` — no server-side build runs on deploy; just commit the compiled file. Pushing to `main` updates the live site in seconds.

---

## 🔄 Post-Deployment Cache Invalidation Protocol

When changes are pushed to `main`, execute the following cache purge sequence via **CSM MCP tools** to ensure visitors see the fresh build immediately:

```bash
# 1. Hostinger Cache Purge (via CSM MCP)
hostinger_cache_purge { domain: "epsoldev.com" }

# 2. Cloudflare Edge + WP Cache Purge (via CSM MCP)
tools_purge_cache {}
```

---

## 🧪 Live Verification Contract (ScreenSync Operator)

Never assume a change works without visual and DOM confirmation on the live site:

1. Use `screensync-operator` (`web_navigate`) to visit `https://csmengine.epsoldev.com/`.
2. Ensure active window focus (`web_window { action: "focus" }`) before capturing screenshots.
3. Verify interactive components:
   * **Waitlist Modal:** Role switching, form input, and dynamic VIP ticket generation (`#1,421 VIP`).
   * **MCP Terminal Simulator:** Streaming log execution and real-time Storefront State preview.
   * **ROI Calculator:** Interactive sliders and mathematical value outputs.
4. Record verified patterns via `screensync-learn` (`web_learn`).

---

## 📁 Repository Structure & File Conventions

```
d:\Local SEO\Site\Khizar\CSM-site\
├── AGENTS.md                   # This operations contract & agent rules
├── README.md                   # Project summary, thesis & local preview instructions
├── index.html                  # Main investor landing page & early-access portal
├── css/
│   └── styles.css              # Custom styling, animations, glow effects, terminal theme
├── js/
│   ├── app.js                  # Modals, mobile menu, accordion, waitlist persistence
│   ├── simulator.js            # Live MCP terminal simulator engine
│   └── calculator.js           # Interactive ROI savings calculator
└── assets/
    ├── icons/
    │   └── csm-logo.svg        # Scalable vector brand logo
    └── images/
        ├── hero-agent-mesh.jpg # 3D hero render (Frontend Builder -> CSM Core -> Backend)
        └── csm-mcp-architecture.jpg # 3D schematic of MCP Agent Hub & Database
```

---

## 🛡️ Coding Standards (Ponytail Protocol)

* **Boring over clever:** Shortest working diff wins.
* **Semantic HTML:** Keep DOM clean and accessible with proper ARIA attributes.
* **No broken assets:** Verify every relative path (`assets/images/`, `assets/icons/`, `css/`, `js/`) before pushing.
* **Defensive DOM queries:** Always use optional chaining or presence guards (`document.getElementById(...)`) to prevent unhandled runtime exceptions.
