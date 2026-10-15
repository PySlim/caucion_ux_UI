// Utilidades compartidas: carga tokens.json y resuelve referencias {grupo.clave}.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const TOKENS_FILE = path.join(ROOT, "src/tokens/tokens.json");
export const loadTokens = () => JSON.parse(fs.readFileSync(TOKENS_FILE, "utf8"));

const REF = /^\{([^}]+)\}$/;
const get = (obj, dotted) => dotted.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

/** Valor final (hex, px…) de una referencia primitiva. */
export function resolveValue(t, v) {
  const m = typeof v === "string" && v.match(REF);
  if (!m) return v;
  const r = get(t.primitive, m[1]);
  if (r === undefined || typeof r === "object") throw new Error(`Referencia inválida: ${v}`);
  return r;
}
/** Nombre de variable CSS primitiva para una referencia. */
export function refVar(v) {
  const m = typeof v === "string" && v.match(REF);
  if (!m) return v;
  return `var(--p-${m[1].replace(/\./g, "-").replace(/-0\.5$/, "-0_5")})`;
}
/** Aplana la capa primitiva a pares [nombreVar, valor]. */
export function flattenPrimitives(obj, prefix = []) {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue;
    const key = [...prefix, k];
    if (v && typeof v === "object") out.push(...flattenPrimitives(v, key));
    else out.push([`--p-${key.join("-").replace(/\./g, "_")}`, v]);
  }
  return out;
}
/** Paleta resuelta (hex) de un tema: { "bg-canvas": "#F3F6FA", ... } */
export function resolvedTheme(t, theme) {
  return Object.fromEntries(Object.entries(t.theme[theme]).map(([k, v]) => [k, resolveValue(t, v)]));
}
