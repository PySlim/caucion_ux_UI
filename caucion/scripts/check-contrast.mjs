// Verifica WCAG 2.2 AA para los temas claro y oscuro definidos en tokens.json.
// Uso: npm run check:contrast   (sale con código 1 si algún par falla)
import fs from "node:fs";
import path from "node:path";
import { ROOT, loadTokens, resolvedTheme } from "./lib/tokens.mjs";

const lum = (hex) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const PAIRS = JSON.parse(fs.readFileSync(path.join(ROOT, "src/tokens/contrast-pairs.json"), "utf8"));

export function check() {
  const t = loadTokens();
  const rows = [];
  for (const theme of ["light", "dark"]) {
    const c = resolvedTheme(t, theme);
    for (const p of PAIRS) {
      if (!c[p.fg] || !c[p.bg]) throw new Error(`Token inexistente en ${theme}: ${p.fg} / ${p.bg}`);
      const r = ratio(c[p.fg], c[p.bg]);
      rows.push({ theme, ...p, r, ok: r >= p.min });
    }
  }
  return rows;
}

if (process.argv[1] && process.argv[1].endsWith("check-contrast.mjs")) {
  const rows = check();
  const fails = rows.filter((r) => !r.ok);
  for (const r of fails) console.log(`FALLA ${r.theme} · ${r.desc}: ${r.fg} sobre ${r.bg} = ${r.r.toFixed(2)} (mín ${r.min})`);
  console.log(`${rows.length - fails.length}/${rows.length} pares cumplen WCAG 2.2 AA (claro y oscuro)`);
  process.exit(fails.length ? 1 : 0);
}
