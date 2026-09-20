const fs = require('fs');

const pages = [
  'index.html',
  'product.html',
  'investors.html',
  'about.html',
  'security.html',
  'privacy.html',
  'terms.html'
];

const pageSet = new Set(pages);
const idCache = {};
let broken = 0;
let checked = 0;

function idsIn(file) {
  if (!fs.existsSync(file)) return new Set();
  const html = fs.readFileSync(file, 'utf8');
  const ids = new Set();
  for (const match of html.matchAll(/id="([^"]+)"/g)) {
    ids.add(match[1]);
  }
  return ids;
}

function isExternalHref(href) {
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('javascript:') ||
    href.startsWith('data:')
  );
}

function splitHref(href) {
  const hashIndex = href.indexOf('#');
  const rawPath = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const anchor = hashIndex >= 0 ? href.slice(hashIndex + 1) : null;
  const queryIndex = rawPath.indexOf('?');
  const pathname = queryIndex >= 0 ? rawPath.slice(0, queryIndex) : rawPath;
  return { pathname, anchor };
}

function resolveInternalPath(pathname, currentPage) {
  if (!pathname) return currentPage;

  if (pathname.startsWith('/')) {
    if (pathname === '/') return 'index.html';
    const rootPath = pathname.slice(1);
    if (pageSet.has(`${rootPath}.html`)) return `${rootPath}.html`;
    return rootPath;
  }

  if (pageSet.has(`${pathname}.html`)) {
    return `${pathname}.html`;
  }

  return pathname;
}

for (const page of pages) {
  idCache[page] = idsIn(page);
}

for (const page of pages) {
  if (!fs.existsSync(page)) continue;

  const html = fs.readFileSync(page, 'utf8');

  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    checked++;

    if (href === '#' || isExternalHref(href)) {
      continue;
    }

    const { pathname, anchor } = splitHref(href);

    if (pathname.endsWith('.html')) {
      console.log(`BROKEN LINK: ${page} -> ${href} (LEGACY .html LINK)`);
      broken++;
      continue;
    }

    let file = page;
    if (pathname || pathname === '/') {
      file = resolveInternalPath(pathname, page);
    }

    if (!fs.existsSync(file)) {
      console.log(`BROKEN FILE: ${page} -> ${href} (file ${file} does not exist)`);
      broken++;
      continue;
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
