// Verifica que todos los nombres de icono usados en src/ existan en icon-registry.ts.
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/tokens.mjs";
const reg = fs.readFileSync(path.join(ROOT, "src/lib/icon-registry.ts"), "utf8");
const known = new Set([...reg.matchAll(/^\s+(\w+): Lu/gm)].map((m) => m[1]));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const missing = new Set();
for (const f of walk(path.join(ROOT, "src")).filter((f) => /\.tsx?$/.test(f) && !f.endsWith("icon-registry.ts"))) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/(?:icon|name)(?:=|:\s*)\{?\s*"([A-Z][A-Za-z0-9]*)"/g)) if (!known.has(m[1])) missing.add(`${m[1]} (${path.relative(ROOT, f)})`);
}
if (missing.size) { console.log("Iconos sin registrar:", [...missing].join(", ")); process.exit(1); }
console.log(`Iconos: ${known.size} registrados, todos los usos directos resueltos.`);
