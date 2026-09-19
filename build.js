#!/usr/bin/env node
/**
 * CSM Engine site compiler.
 *
 * Sources live in src/. Deployed files are generated into the repo root and
 * committed (same policy as css/tailwind.css) so Hostinger can serve them
 * without a server-side build step.
 *
 *   node build.js              write generated files
 *   node build.js --check      fail if committed output differs from sources
 *   node build.js --lint-size  fail if any hand-written source file > MAX_LINES
 *
 * Template syntax (src/pages/*.html and src/partials/**):
 *   ---            JSON front-matter block on the first lines of a page
 *   {{> path}}     include src/partials/<path> (recursive)
 *   {{name}}       variable from front-matter (HTML inserted as-is)
 *   {{desknav k}}  attributes for a desktop nav link, active when page === k
 *   {{mobnav k}}   attributes for a mobile drawer link
 *   {{footnav k}}  attributes for a footer link
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const PAGES_DIR = path.join(SRC, 'pages');
const PARTIALS_DIR = path.join(SRC, 'partials');
const JS_MANIFEST = path.join(SRC, 'js', 'app', 'manifest.json');
const JS_OUT = path.join(ROOT, 'js', 'app.js');
const MAX_LINES = 500;
const MAX_DEPTH = 20;

const HELPERS = {
  desknav: (page, key) => page === key
    ? 'class="text-cyan-400 font-semibold transition-colors" aria-current="page"'
    : 'class="hover:text-white transition-colors"',
  mobnav: (page, key) => page === key
    ? 'class="block text-cyan-400 font-semibold text-base"'
    : 'class="block text-slate-300 hover:text-white text-base font-medium"',
  footnav: (page, key) => page === key
    ? 'class="text-white transition-colors"'
    : 'class="hover:text-white transition-colors"'
};

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function parseFrontMatter(source, file) {
  if (!source.startsWith('---')) return { vars: {}, body: source };
  const end = source.indexOf('\n---', 3);
  if (end === -1) throw new Error(`${file}: unterminated front-matter`);
  const json = source.slice(3, end).trim();
  let vars;
  try {
    vars = JSON.parse(json);
  } catch (e) {
    throw new Error(`${file}: invalid front-matter JSON: ${e.message}`);
  }
  let body = source.slice(end + 4);
  if (body.startsWith('\r\n')) body = body.slice(2);
  else if (body.startsWith('\n')) body = body.slice(1);
  return { vars, body };
}

function render(template, vars, file, depth) {
  if (depth > MAX_DEPTH) throw new Error(`${file}: include depth exceeded`);
  return template.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, expr) => {
    if (expr.startsWith('>')) {
      const rel = expr.slice(1).trim();
      const partialFile = path.join(PARTIALS_DIR, rel);
      if (!fs.existsSync(partialFile)) throw new Error(`${file}: missing partial ${rel}`);
      return render(read(partialFile), vars, partialFile, depth + 1);
    }
    const parts = expr.split(/\s+/);
    if (parts.length === 2 && HELPERS[parts[0]]) {
      return HELPERS[parts[0]](vars.page, parts[1]);
    }
    if (parts.length === 1 && Object.prototype.hasOwnProperty.call(vars, parts[0])) {
      return String(vars[parts[0]]);
    }
    throw new Error(`${file}: unknown template expression ${match}`);
  });
}

function compilePages() {
  const out = new Map();
  for (const name of fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html')).sort()) {
    const file = path.join(PAGES_DIR, name);
    const { vars, body } = parseFrontMatter(read(file), file);
    out.set(path.join(ROOT, name), render(body, vars, file, 0));
  }
  return out;
}

function compileJs() {
  if (!fs.existsSync(JS_MANIFEST)) return new Map();
  const manifest = JSON.parse(read(JS_MANIFEST));
  const dir = path.dirname(JS_MANIFEST);
  const chunks = manifest.files.map(f => {
    const file = path.join(dir, f);
    if (!fs.existsSync(file)) throw new Error(`manifest.json: missing ${f}`);
    return `/* ---- src/js/app/${f} ---- */\n${read(file).replace(/\s+$/, '')}\n`;
  });
  const banner = `${manifest.banner || ''}`;
  return new Map([[JS_OUT, banner + chunks.join('\n')]]);
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc); else acc.push(p);
  }
  return acc;
}

function lintSize() {
  const targets = [
    ...walk(SRC),
    ...walk(path.join(ROOT, 'php')).filter(p => !p.includes(`${path.sep}PHPMailer${path.sep}`)),
    path.join(ROOT, 'css', 'styles.css'),
    path.join(ROOT, 'js', 'simulator.js'),
    path.join(ROOT, 'js', 'calculator.js'),
    path.join(ROOT, 'build.js'),
    path.join(ROOT, 'validate-links.js'),
    path.join(ROOT, 'validate-ld.js'),
    path.join(ROOT, 'tailwind.config.js')
  ].filter(p => fs.existsSync(p) && /\.(html|js|css|php|json)$/.test(p));
  const over = targets
    .map(p => ({ p, n: read(p).split('\n').length }))
    .filter(x => x.n > MAX_LINES);
  for (const x of over) console.error(`SIZE: ${path.relative(ROOT, x.p)} has ${x.n} lines (max ${MAX_LINES})`);
  console.log(`Size lint: ${targets.length} source files checked, ${over.length} over limit.`);
  return over.length === 0;
}

function firstDiffLine(a, b) {
  const al = a.split('\n'), bl = b.split('\n');
  for (let i = 0; i < Math.max(al.length, bl.length); i++) {
    if (al[i] !== bl[i]) return i + 1;
  }
  return -1;
}

function main() {
  const args = new Set(process.argv.slice(2));
  let ok = true;
  if (args.has('--lint-size')) ok = lintSize() && ok;

  const outputs = new Map([...compilePages(), ...compileJs()]);
  if (args.has('--check')) {
    for (const [file, content] of outputs) {
      const current = fs.existsSync(file) ? read(file) : '';
      if (current !== content) {
        ok = false;
        console.error(`STALE: ${path.relative(ROOT, file)} differs from sources (first diff at line ${firstDiffLine(current, content)}). Run: npm run build`);
      }
    }
    if (ok) console.log(`Check: ${outputs.size} generated files match their sources.`);
  } else if (!args.has('--lint-size') || args.has('--write')) {
    for (const [file, content] of outputs) {
      fs.writeFileSync(file, content);
      console.log(`wrote ${path.relative(ROOT, file)} (${content.split('\n').length} lines)`);
    }
  }
  process.exit(ok ? 0 : 1);
}

main();
