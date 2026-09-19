const fs = require('fs');

const pages = [
  "index.html",
  "product.html",
  "investors.html",
  "about.html",
  "security.html",
  "privacy.html",
  "terms.html"
];

let valid = 0;
let invalid = 0;

for (const page of pages) {
  if (!fs.existsSync(page)) continue;
  const html = fs.readFileSync(page, 'utf8');
  const regex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match;
  let blockIndex = 1;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const type = data['@type'] || (data['@graph'] ? data['@graph'].map(g => g['@type']).join('+') : 'unknown');
      console.log(`${page} block ${blockIndex}: valid — ${type}`);
      valid++;
    } catch (e) {
      console.error(`ERROR: ${page} block ${blockIndex}: INVALID JSON: ${e.message}`);
      invalid++;
    }
    blockIndex++;
  }
}

console.log(`JSON-LD: ${valid} valid, ${invalid} invalid.`);
process.exit(invalid ? 1 : 0);
