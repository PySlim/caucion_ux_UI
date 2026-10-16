// Genera src/tokens/generated/tokens.css y tokens.ts desde src/tokens/tokens.json.
// Uso: node scripts/build-tokens.mjs  (también lo ejecuta build.mjs)
import fs from "node:fs";
import path from "node:path";
import { ROOT, loadTokens, refVar, resolveValue, flattenPrimitives, resolvedTheme } from "./lib/tokens.mjs";

export function buildTokens() {
  const t = loadTokens();
  const sem = Object.keys(t.semantic).filter((k) => !k.startsWith("$"));
  for (const th of ["light", "dark"]) {
    const keys = Object.keys(t.theme[th]);
    const missing = sem.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !sem.includes(k));
    if (missing.length || extra.length) throw new Error(`Tema ${th}: faltan [${missing}] sobran [${extra}]`);
  }
  const L = [];
  L.push("/* GENERADO por scripts/build-tokens.mjs desde tokens.json — no editar a mano. */");
  L.push("/* Capa 1 · Primitivos */");
  L.push(":root {");
  for (const [k, v] of flattenPrimitives(t.primitive)) L.push(`  ${k}: ${v};`);
  L.push("  /* Capa 3 · Componente (independientes del tema) */");
  for (const [k, c] of Object.entries(t.component)) if (!c.themed) L.push(`  --${k}: ${refVar(c.value)};`);
  L.push("  /* Tipografía por roles */");
  L.push("  --font-sans: var(--p-font-family-sans);");
  L.push("  --font-mono: var(--p-font-family-mono);");
  for (const [role, r] of Object.entries(t.typography)) {
    if (role.startsWith("$")) continue;
    L.push(`  --type-${role}-size: ${refVar(r.size)}; --type-${role}-leading: ${refVar(r.leading)}; --type-${role}-weight: ${refVar(r.weight)}; --type-${role}-tracking: ${r.tracking};`);
  }
  L.push("}");
  const themeBlock = (sel, th) => {
    L.push(`${sel} {`);
    L.push(`  color-scheme: ${th};`);
    for (const [k, v] of Object.entries(t.theme[th])) L.push(`  --${k}: ${refVar(v)};`);
    for (const [k, c] of Object.entries(t.component)) if (c.themed) L.push(`  --${k}: ${refVar(c.value)};`);
    L.push("}");
  };
  L.push("/* Capa 2 · Semánticos resueltos por tema (Capa 4 · Tema) */");
  themeBlock(':root, [data-caucion-theme="light"]', "light");
  themeBlock('[data-caucion-theme="dark"]', "dark");
  L.push("/* Densidad: Balanced (oficial), Compact (reservada), Touch (< 768 px) */");
  const dens = (sel, d) => { L.push(`${sel} {`); for (const [k, v] of Object.entries(t.density[d])) L.push(`  --${k}: ${v};`); L.push("}"); };
  dens(':root, [data-caucion-density="balanced"]', "balanced");
  dens('[data-caucion-density="compact"]', "compact");
  L.push("@media (max-width: 767px) {");
  L.push('  :root, [data-caucion-density] {');
  for (const [k, v] of Object.entries(t.density.touch)) L.push(`    --${k}: ${v};`);
  for (const [role, r] of Object.entries(t.typography)) if (r.mobileSize) L.push(`    --type-${role}-size: ${refVar(r.mobileSize)}; --type-${role}-leading: ${refVar(r.mobileLeading)};`);
  L.push("  }");
  L.push("}");

  const outDir = path.join(ROOT, "src/tokens/generated");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "tokens.css"), L.join("\n") + "\n");

  // TS: valores resueltos para documentación, catálogo y pruebas
  const colors = {};
  for (const [fam, shades] of Object.entries(t.primitive.color)) for (const [s, v] of Object.entries(shades)) colors[`${fam}-${s}`] = v;
  const ts = {
    meta: t.meta,
    primitive: { color: colors, radius: t.primitive.radius, space: t.primitive.space, font: t.primitive.font },
    semantic: Object.fromEntries(sem.map((k) => [k, t.semantic[k]])),
    theme: { light: resolvedTheme(t, "light"), dark: resolvedTheme(t, "dark") },
    themeRefs: { light: t.theme.light, dark: t.theme.dark },
    component: Object.fromEntries(Object.entries(t.component).map(([k, c]) => [k, { value: c.themed ? c.value : resolveValue(t, c.value), ref: c.value, use: c.use }])),
    density: { balanced: t.density.balanced, compact: t.density.compact, touch: t.density.touch },
    typography: Object.fromEntries(Object.entries(t.typography).filter(([k]) => !k.startsWith("$")).map(([k, r]) => [k, {
      size: resolveValue(t, r.size), leading: resolveValue(t, r.leading), weight: resolveValue(t, r.weight), tracking: r.tracking, use: r.use,
      mobileSize: r.mobileSize ? resolveValue(t, r.mobileSize) : null,
    }])),
  };
  fs.writeFileSync(path.join(outDir, "tokens.ts"),
    "// GENERADO por scripts/build-tokens.mjs desde tokens.json — no editar a mano.\n" +
    `export const TOKENS = ${JSON.stringify(ts, null, 2)} as const;\n` +
    "export type ThemeName = keyof typeof TOKENS.theme;\nexport type SemanticToken = keyof typeof TOKENS.semantic;\n");
  return { semantic: sem.length, primitives: flattenPrimitives(t.primitive).length, component: Object.keys(t.component).length };
}

if (process.argv[1] && process.argv[1].endsWith("build-tokens.mjs")) console.log("tokens:", buildTokens());
