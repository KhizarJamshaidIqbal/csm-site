const fs = require("fs");
const pages = ["index.html", "about.html", "security.html", "privacy.html", "terms.html"];
let ok = 0, fail = 0;
for (const p of pages) {
  const html = fs.readFileSync(p, "utf8");
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m, n = 0;
  while ((m = re.exec(html)) !== null) {
    n++;
    try {
      const data = JSON.parse(m[1]);
      const type = data["@type"] || (data["@graph"] ? data["@graph"].map(g => g["@type"]).join("+") : "?");
      console.log(`${p} block ${n}: valid — ${type}`);
      ok++;
    } catch (e) {
      console.log(`${p} block ${n}: INVALID — ${e.message}`);
      fail++;
    }
  }
}
console.log(`JSON-LD: ${ok} valid, ${fail} invalid.`);
process.exit(fail ? 1 : 0);
