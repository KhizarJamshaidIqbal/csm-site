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

let broken = 0;
let checked = 0;

function idsIn(file) {
  if (!fs.existsSync(file)) return new Set();
  const html = fs.readFileSync(file, 'utf8');
  const ids = new Set();
  for (const m of html.matchAll(/id="([^"]+)"/g)) {
    ids.add(m[1]);
  }
  return ids;
}

const idCache = {};
for (const p of pages) {
  idCache[p] = idsIn(p);
}

for (const page of pages) {
  if (!fs.existsSync(page)) continue;
  const html = fs.readFileSync(page, 'utf8');
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    checked++;
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:') || href === '#') {
      continue;
    }
    let file = page;
    let anchor = null;
    if (href.startsWith('#')) {
      anchor = href.slice(1);
    } else {
      const [f, a] = href.split('#');
      if (f) file = f;
      anchor = a || null;
      if (!fs.existsSync(file)) {
        console.log(`BROKEN FILE: ${page} -> ${href} (file ${file} does not exist)`);
        broken++;
        continue;
      }
    }
    if (anchor) {
      const target = idCache[file] || idsIn(file);
      if (!target.has(anchor)) {
        console.log(`BROKEN ANCHOR: ${page} -> ${href} (no id="${anchor}" in ${file})`);
        broken++;
      }
    }
  }
}

console.log(`Link integrity: ${checked} links checked, ${broken} broken.`);
process.exit(broken ? 1 : 0);
