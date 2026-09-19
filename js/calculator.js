/**
 * CSM ROI & Engineering Savings Calculator
 * Quantifies time, capital, and speed-to-market advantages for investors and founders.
 */

function initCalculator() {
  const storesSlider = document.getElementById("calc-stores-slider");
  const rateSlider = document.getElementById("calc-rate-slider");
  const gmvSlider = document.getElementById("calc-gmv-slider");

  const storesValDisplay = document.getElementById("calc-stores-val");
  const rateValDisplay = document.getElementById("calc-rate-val");
  const gmvValDisplay = document.getElementById("calc-gmv-val");

  const hoursSavedDisplay = document.getElementById("calc-hours-saved");
  const capitalSavedDisplay = document.getElementById("calc-capital-saved");
  const speedupDisplay = document.getElementById("calc-speedup");
  const platformTaxSavedDisplay = document.getElementById("calc-tax-saved");

  if (!storesSlider || !rateSlider || !gmvSlider) return;

  function updateCalculations() {
    const storesCount = parseInt(storesSlider.value, 10);
    const hourlyRate = parseInt(rateSlider.value, 10);
    const avgGmv = parseInt(gmvSlider.value, 10); // in thousands ($K)

    // Update value labels
    if (storesValDisplay) storesValDisplay.textContent = `${storesCount} stores`;
    if (rateValDisplay) rateValDisplay.textContent = `$${hourlyRate}/hr`;
    if (gmvValDisplay) gmvValDisplay.textContent = `$${avgGmv}k GMV`;

    // Calculation constants
    // Traditional custom backend: ~320 hours per custom store (auth, cart CSRF, DB, Stripe, webhooks, RMA, emails, admin SPA)
    // CSM Agentic Backend: ~2 hours of prompt & MCP integration
    const hoursPerStoreTraditional = 320;
    const hoursPerStoreCSM = 2;
    const hoursSavedPerStore = hoursPerStoreTraditional - hoursPerStoreCSM;

    const totalHoursSaved = storesCount * hoursSavedPerStore;
    const totalCapitalSaved = totalHoursSaved * hourlyRate;

    // Platform tax calculation: Shopify charges ~2.0% third-party gateway fee or 2.9%+30c
    // CSM has 0% platform fee.
    const totalGmvAnnual = storesCount * avgGmv * 1000;
    const platformTaxSaved = Math.round(totalGmvAnnual * 0.02);

    const speedupRatio = Math.round(hoursPerStoreTraditional / hoursPerStoreCSM);

    if (hoursSavedDisplay) {
      hoursSavedDisplay.textContent = totalHoursSaved.toLocaleString();
    }
    if (capitalSavedDisplay) {
      capitalSavedDisplay.textContent = `$${totalCapitalSaved.toLocaleString()}`;
    }
    if (speedupDisplay) {
      speedupDisplay.textContent = `${speedupRatio}x`;
    }
    if (platformTaxSavedDisplay) {
      platformTaxSavedDisplay.textContent = `$${platformTaxSaved.toLocaleString()}`;
    }
  }

  storesSlider.addEventListener("input", updateCalculations);
  rateSlider.addEventListener("input", updateCalculations);
  gmvSlider.addEventListener("input", updateCalculations);

  // Initial calculation
  updateCalculations();
}

document.addEventListener("DOMContentLoaded", initCalculator);
