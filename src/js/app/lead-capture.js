/* -------------------------------------------------------------
 * Lead capture configuration
 * Points at your own Gmail SMTP mail gateway (/php/mailgate.php).
 * On the live Hostinger site, credentials live in config.creds.php (gitignored,
 * set once via hPanel) and the endpoint is relative: /php/mailgate.php
 * ----------------------------------------------------------- */
const LEAD_CAPTURE = {
  LIVE_ON_SERVER: true,
  endpoint: "/php/mailgate.php"
};

function safeReadArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function rememberLocally(key, record) {
  const existing = safeReadArray(key);
  existing.push(record);
  try {
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (err) {
    /* storage unavailable — remote delivery is still attempted */
  }
}

async function submitLead(payload, submitBtn) {
  if (!LEAD_CAPTURE.LIVE_ON_SERVER) {
    return { ok: false, reason: "not_configured" };
  }

  const originalLabel = submitBtn ? submitBtn.innerHTML : "";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Sending...";
  }

  try {
    const res = await fetch(LEAD_CAPTURE.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    return { ok: !!data.ok, reason: data.code || data.message || "request_failed", message: data.message || "" };
  } catch (err) {
    return { ok: false, reason: "network" };
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
    }
  }
}

function showFormError(form, message) {
  const errBox = form ? form.querySelector(".form-error") : null;
  if (!errBox) return;
  errBox.textContent = message;
  errBox.classList.remove("hidden");
}

function hideFormError(form) {
  const errBox = form ? form.querySelector(".form-error") : null;
  if (errBox) {
    errBox.textContent = "";
    errBox.classList.add("hidden");
  }
}

function leadFailureMessage(result, unavailableMessage) {
  if (result.reason === "not_configured") {
    return unavailableMessage;
  }
  return result.message || "Something went wrong sending your request. Please try again, or email info@epsoldev.com directly.";
}
