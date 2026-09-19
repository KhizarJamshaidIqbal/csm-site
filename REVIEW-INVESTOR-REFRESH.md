# Investor homepage refresh: implementation and release review

## Scope

Branch: `feat/investor-site-refresh`. Do not merge until release checks below are complete. The repository's AGENTS.md says main auto-deploys to production.

- Redesigned index.html while retaining its public section anchors and the existing `/php/mailgate.php` lead gateway.
- Added `css/launch.css` and `js/launch.js`, loaded only on the homepage. Existing shared styles and JS are left unchanged for other pages. The new CSS is page-exclusive, not selector-namespaced.
- Both forms preserve gateway types `waitlist` and `deck`, accepted field names, subjects, and from-name values. SMTP recipient and credentials were not modified.
- Replaced modals with visible, anchored forms. Existing `index.html#waitlist` and `index.html#pitch-deck` links still lead to their respective forms.
- No browser-local PII backup or invented VIP queue numbers in the new code. Legacy script files remain in the repository but are not loaded by the homepage.
- Kept compiled Tailwind CSS. New page-specific selectors are ordinary CSS and do not require a Tailwind rebuild. No framework upgrade was attempted.
- Original inline SVG architecture artwork, not generated photography; no external image dependency for the homepage hero.
- Simulation is explicitly labeled and makes no MCP calls. Savings worksheet uses editable assumptions instead of product performance claims.
- Numeric traction, fundraising targets, tool counts, latency, pricing, and guaranteed outcomes omitted until substantiated.

## Evidence

- Contact: https://epsoldev.com/ publicly lists `info@epsoldev.com`. Only the public contact was updated; this does not change SMTP delivery configuration.
- Founder attribution: existing about.html names Khizar Jamshaid Iqbal and Epsol Development.
- Product framing: plugin README describes WordPress headless commerce, React back office, public REST API, and MCP.
- Source review: `custom-store-management-CSM/plugin/custom-store-management/custom-store-management.php` defines separate public and admin namespaces. `includes/mcp/class-csm-mcp-tool-registry.php` provides discovery, read-only mutation rejection, and approval/dry-run handling. `class-csm-mcp-server.php` handles MCP requests. This was static source review, not deployment verification.
- Exact adapter inventory, live tool count, payment behavior, and production readiness were not verified. Do not infer them from the previous chat reports.

## Static checks performed

- Compared HTML input names and JavaScript payload with the PHP gateway allow-list and response envelope.
- Checked submit guards, duplicate-click prevention, timeout, HTTP and JSON success checks, failure path, and preserved input on errors.
- Reviewed no-JavaScript fallback: forms explicitly POST and include type/subject/from-name, rather than leaking personal fields into a default GET URL.
- Reviewed labels, landmarks, skip navigation, focus styles, native FAQ disclosure, mobile menu state, reduced motion, and SVG description.
- Reviewed first-party asset paths, old anchor compatibility, and content claims.
- Independent static reviewer inspected CSS, JS, and gateway. Its HTML fetch was truncated; it was not a complete independent HTML audit.
- Reviewed changes a second time and corrected native form fallback in a follow-up commit.

## Not executed

No shell, browser automation, screenshot capture, PHP runtime, or image generator was available in this session. No automated tests, browser render, performance measurement, real email, MCP operation, or production deployment was executed. Static review is not a passing runtime test result.

## Release blockers and existing issues

1. `privacy.html` still says Web3Forms delivers submissions. Actual gateway uses PHPMailer/SMTP and logs lead details after successful sending. Privacy disclosures also describe browser localStorage backup, which the new homepage no longer uses. Owner/legal review must align the policy with actual processing, retention, and hosting before release.
2. Existing about/security/terms pages retain unverified numeric, pricing, availability, and security claims, plus older contact addresses. Review them against evidence and align with the homepage before publishing. Those files were not silently rewritten as part of this homepage change.
3. Existing `php/mailgate.php` writes its log only after SMTP success. Its header comment incorrectly suggests failures are backed up. Confirm failure handling and protect `php/submissions.log` from web access at deployment.
4. Existing gateway exposes mail debug details when debug is enabled; keep production debug off and review server response handling. No server-side rate limiting is visible in the reviewed gateway file; evaluate host-level protection and application abuse controls.
5. Revoke/replace credentials previously pasted into chat through their issuing services. None were included in this branch.

## Required pre-merge validation

- Serve the branch in a PHP-enabled staging environment, not production.
- Check widths 320, 375, 768, 1024, and 1440px, plus 200% zoom. Confirm no horizontal overflow, readable diagram and navigation, and visible focus indicators.
- Keyboard-test menu, all anchors, FAQ, role selection, forms, and calculator. Verify reduced-motion preference.
- Mock the mail endpoint: test success `{ok:true}`, `{ok:false}`, malformed JSON, non-2xx, network rejection, and a request taking over 20 seconds. Failure must not show success or clear fields. Double clicks must not issue duplicate requests.
- Disable JavaScript and confirm POST fallback uses the correct type and no personal data appears in the URL. Direct fallback returns raw JSON by design; email contact is also available.
- With explicit approval and a staging inbox, send one waitlist and one deck request. Confirm actual delivery and expected payload fields without sending real customer data.
- Calculator default: 40 × 50 × 1 = USD 2,000. Test empty, zero, negative, out-of-range, and large values.
- Run HTML validation, JavaScript syntax checks, accessibility scans, and responsive screenshots. Inspect network and browser console for errors.
- Validate linked policy/company pages and contact consistency, resolve blockers, then obtain approval to merge/deploy.
