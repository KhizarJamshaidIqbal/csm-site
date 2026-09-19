/**
 * CSM Live MCP Terminal & Agent Simulator
 * Demonstrates real-time autonomous prompt-to-MCP tool orchestration
 */

const simulatorPresets = {
  streetwear: {
    title: "Launch Streetwear Drop with Stripe & Flash Sale",
    prompt: "Generate a limited-edition streetwear store with 12 items, 4 size variants, live Stripe checkout, and a 48h flash drop timer.",
    steps: [
      {
        phase: "CONNECT",
        text: "Connecting to CSM MCP Gateway [https://api.csmengine.dev/wp-json/csm/v1/mcp]...",
        status: "OK",
        delay: 400
      },
      {
        phase: "READ",
        tool: "resources/read",
        payload: { uri: "csm://store/overview" },
        response: { store: "CyberDrip Studio", currency: "USD", active_gateways: 2, mcp_tools_available: 317 },
        delay: 700
      },
      {
        phase: "MCP_CALL",
        tool: "payment_methods_save",
        payload: {
          gateway: "stripe",
          enabled: true,
          mode: "live",
          webhook_secret: "whsec_live_9a8f...[verified_hmac]",
          dry_run: false
        },
        response: { ok: true, status: "active", verified_endpoint: "we_1TzE4sCB9m7BI3uyTvITvJ41" },
        delay: 800
      },
      {
        phase: "MCP_CALL",
        tool: "products_bulk",
        payload: {
          count: 12,
          category: "Streetwear Drops",
          variants: ["S", "M", "L", "XL"],
          initial_stock: 50,
          currency: "USD"
        },
        response: { created: 12, variants_generated: 48, inventory_reserved: 600 },
        delay: 900
      },
      {
        phase: "MCP_CALL",
        tool: "flash_sale_set",
        payload: {
          sale_name: "Midnight Cyber Drop",
          duration_hours: 48,
          discount_percent: 25,
          apply_to_category: "Streetwear Drops",
          status_bar: true
        },
        response: { cycle_id: "flash_drop_48h", status: "active", banner_mounted: true },
        delay: 800
      },
      {
        phase: "VERIFY",
        tool: "cart_csrf_verify",
        payload: { token_header: "X-CSM-Cart-CSRF", enforce_level: "strict" },
        response: { status: "enforced", zero_leak_mode: true },
        delay: 600
      },
      {
        phase: "COMPLETE",
        text: "✓ Store fully wired & live! 12 products, 48 variants, Stripe live checkout, and 48h countdown active in 4.2 seconds.",
        status: "DEPLOYED",
        delay: 400
      }
    ],
    previewState: {
      headline: "CyberDrip Studio — Midnight Drop",
      badge: "LIVE DROP • 48H FLASH SALE",
      productCount: "12 Products (48 Variants)",
      paymentStatus: "Stripe Live Active (0% Take Rate)",
      security: "Cart-CSRF Enforced"
    }
  },

  returns: {
    title: "Process RMA Return & Restock Inventory",
    prompt: "Customer #8492 requested return for Order #CSM-9918 (Damaged Zipper). Run inspection, auto-calculate refund, and notify warehouse.",
    steps: [
      {
        phase: "CONNECT",
        text: "Querying CSM Post-Purchase RMA Engine...",
        status: "OK",
        delay: 400
      },
      {
        phase: "MCP_CALL",
        tool: "returns_get",
        payload: { return_id: "RET-8492", order_id: "CSM-9918" },
        response: { item: "Cyber Trench V2", price: "$240.00", customer: "alex@venture.io", reason: "Damaged Zipper" },
        delay: 750
      },
      {
        phase: "MCP_CALL",
        tool: "returns_inspect",
        payload: { return_id: "RET-8492", inspection_passed: true, condition: "manufacturer_defect", restock_shelf: false },
        response: { inspection_logged: true, defect_category: "hardware", assigned_rma: "RMA-77182" },
        delay: 850
      },
      {
        phase: "MCP_CALL",
        tool: "returns_refund_preview",
        payload: { return_id: "RET-8492", gateway: "stripe", restock_fee: 0 },
        response: { refundable_amount: "$240.00", tax_refund: "$19.20", total_to_credit: "$259.20" },
        delay: 700
      },
      {
        phase: "MCP_CALL",
        tool: "returns_settle",
        payload: { return_id: "RET-8492", action: "refund_stripe", notify_customer: true },
        response: { stripe_refund_id: "re_3OzP782...Kj", settled_amount: "$259.20", email_sent: true },
        delay: 900
      },
      {
        phase: "COMPLETE",
        text: "✓ Return settled, Stripe refund disbursed, RMA audit logged, customer notified autonomously.",
        status: "SETTLED",
        delay: 400
      }
    ],
    previewState: {
      headline: "RMA Settlement — RET-8492",
      badge: "REFUND PROCESSED",
      productCount: "Item: Cyber Trench V2",
      paymentStatus: "Refunded $259.20 via Stripe",
      security: "Audit Logged & Customer Notified"
    }
  },

  whatsapp: {
    title: "Activate WhatsApp AI CRM & Run Golden Set QA",
    prompt: "Connect the store to WhatsApp Agent Platform, run 50 adversarial benchmark questions, and verify instant care card responses.",
    steps: [
      {
        phase: "CONNECT",
        text: "Establishing bridge with WhatsApp Agent Gateway...",
        status: "OK",
        delay: 400
      },
      {
        phase: "MCP_CALL",
        tool: "whatsapp_agent_connect",
        payload: { channel: "official_api", phone_number_id: "+1-800-CYBERCSM", mode: "autonomous_care" },
        response: { connected: true, session_token: "wa_bridge_live_883", status: "listening" },
        delay: 800
      },
      {
        phase: "MCP_CALL",
        tool: "chat_goldenset_run",
        payload: { suite: "ecom_adversarial_v2", test_cases: 50, hallucination_threshold: 0.01 },
        response: { tests_passed: 50, failed: 0, accuracy: "100.0%", avg_latency: "42ms" },
        delay: 950
      },
      {
        phase: "MCP_CALL",
        tool: "care_card_send",
        payload: { customer_phone: "+1-555-0192", template: "order_tracking_card", dynamic_order: "CSM-9918" },
        response: { delivered: true, read_receipt: true, interactive_buttons_mounted: 3 },
        delay: 750
      },
      {
        phase: "COMPLETE",
        text: "✓ WhatsApp AI bridge active! 100% Golden Set QA score, automated tracking cards streaming to customers.",
        status: "ONLINE",
        delay: 400
      }
    ],
    previewState: {
      headline: "Unified WhatsApp CRM Agent",
      badge: "QA: 100% PASS RATE",
      productCount: "Channel: +1-800-CYBERCSM",
      paymentStatus: "Interactive Order Cards Active",
      security: "Adversarial Golden Set Passed"
    }
  }
};

let isSimRunning = false;

function initSimulator() {
  const terminalOutput = document.getElementById("terminal-output");
  const presetButtons = document.querySelectorAll(".sim-preset-btn");
  const customRunBtn = document.getElementById("sim-run-custom");
  const customInput = document.getElementById("sim-custom-prompt");

  if (!terminalOutput) return;

  // Initial preset
  loadPreset("streetwear");

  presetButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (isSimRunning) return;
      const presetKey = btn.getAttribute("data-preset");
      presetButtons.forEach(b => b.classList.remove("tab-active"));
      btn.classList.add("tab-active");
      loadPreset(presetKey);
    });
  });

  if (customRunBtn && customInput) {
    customRunBtn.addEventListener("click", () => {
      if (isSimRunning) return;
      const val = customInput.value.trim();
      if (!val) return;
      runCustomPrompt(val);
    });
  }
}

async function loadPreset(presetKey) {
  const data = simulatorPresets[presetKey];
  if (!data) return;
  runSimulation(data);
}

async function runSimulation(data) {
  isSimRunning = true;
  const terminalOutput = document.getElementById("terminal-output");
  const previewHeadline = document.getElementById("sim-preview-headline");
  const previewBadge = document.getElementById("sim-preview-badge");
  const previewProducts = document.getElementById("sim-preview-products");
  const previewPayment = document.getElementById("sim-preview-payment");
  const previewSecurity = document.getElementById("sim-preview-security");
  const simProgress = document.getElementById("sim-progress");

  // Reset terminal
  terminalOutput.innerHTML = `
    <div class="text-slate-400 mb-2 font-mono text-xs">
      <span class="text-cyan-400">csm-agent@mcp:~$</span> prompt --text "${escapeHtml(data.prompt)}"
    </div>
    <div class="h-px bg-white/10 my-3"></div>
  `;

  if (simProgress) {
    simProgress.style.width = "5%";
  }

  const totalSteps = data.steps.length;

  for (let i = 0; i < totalSteps; i++) {
    const step = data.steps[i];
    await sleep(step.delay);

    const stepDiv = document.createElement("div");
    stepDiv.className = "mb-3 font-mono text-xs animate-fade-in";

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

    if (step.phase === "CONNECT") {
      stepDiv.innerHTML = `
        <div class="flex items-center gap-2 text-slate-300">
          <span class="text-slate-500">[${timestamp}]</span>
          <span class="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-semibold text-[10px]">MCP_HANDSHAKE</span>
          <span>${escapeHtml(step.text)}</span>
          <span class="text-emerald-400 ml-auto font-bold">[${step.status}]</span>
        </div>
      `;
    } else if (step.phase === "READ" || step.phase === "MCP_CALL" || step.phase === "VERIFY") {
      stepDiv.innerHTML = `
        <div class="p-2 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
          <div class="flex items-center gap-2 text-cyan-300 font-semibold mb-1">
            <span class="text-slate-500">[${timestamp}]</span>
            <span class="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-semibold text-[10px]">TOOL_EXEC</span>
            <span class="text-white">${step.tool}</span>
          </div>
          <div class="text-slate-400 text-[11px] pl-3 border-l border-purple-500/40 my-1 font-mono">
            <div><span class="text-slate-500">args:</span> ${escapeHtml(JSON.stringify(step.payload))}</div>
            <div><span class="text-emerald-400">response:</span> ${escapeHtml(JSON.stringify(step.response))}</div>
          </div>
        </div>
      `;
    } else if (step.phase === "COMPLETE") {
      stepDiv.innerHTML = `
        <div class="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
          <span>${escapeHtml(step.text)}</span>
          <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">${step.status}</span>
        </div>
      `;
    }

    terminalOutput.appendChild(stepDiv);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;

    if (simProgress) {
      const pct = Math.round(((i + 1) / totalSteps) * 100);
      simProgress.style.width = `${pct}%`;
    }
  }

  // Update live preview pane
  if (data.previewState) {
    if (previewHeadline) previewHeadline.textContent = data.previewState.headline;
    if (previewBadge) previewBadge.textContent = data.previewState.badge;
    if (previewProducts) previewProducts.textContent = data.previewState.productCount;
    if (previewPayment) previewPayment.textContent = data.previewState.paymentStatus;
    if (previewSecurity) previewSecurity.textContent = data.previewState.security;
  }

  isSimRunning = false;
}

function runCustomPrompt(promptText) {
  const customData = {
    title: "Autonomous Agent Orchestration",
    prompt: promptText,
    steps: [
      {
        phase: "CONNECT",
        text: "Parsing intent and routing to relevant CSM MCP tool catalog (317 tools loaded)...",
        status: "MAPPED",
        delay: 500
      },
      {
        phase: "MCP_CALL",
        tool: "prompts/get plan-a-safe-change",
        payload: { request: promptText },
        response: { plan_approved: true, mode: "additive-first", tools_queued: 4 },
        delay: 750
      },
      {
        phase: "MCP_CALL",
        tool: "products_list",
        payload: { limit: 10, status: "publish" },
        response: { count: 10, catalog_synced: true },
        delay: 600
      },
      {
        phase: "MCP_CALL",
        tool: "seo_page_save",
        payload: { route: "/storefront-live", schema_type: "ItemPage", indexing_ready: true },
        response: { ok: true, json_ld_graph: "ProductGroup+BreadcrumbList" },
        delay: 700
      },
      {
        phase: "COMPLETE",
        text: `✓ Autonomous execution finished for prompt: "${promptText.slice(0, 40)}..."`,
        status: "COMPLETED",
        delay: 400
      }
    ],
    previewState: {
      headline: "Custom Agent Execution",
      badge: "LIVE SYNCHRONIZED",
      productCount: "Custom Catalog Active",
      paymentStatus: "Stripe & PayPal Dual Ready",
      security: "Zero-Vulnerability Strict Envelope"
    }
  };

  runSimulation(customData);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener("DOMContentLoaded", initSimulator);
