// Build de CAUCIÓN: tokens → CSS (Tailwind v4) + JS (esbuild) → HTML autocontenido.
// Uso: npm run build            → dist/caucion.html (artifact) y dist/index.html (documento completo)
//      npm run dev              → recompila al guardar y sirve http://localhost:5173
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";
import { compile } from "tailwindcss";
import { buildTokens } from "./scripts/build-tokens.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const TW_DIR = path.resolve(path.dirname(require.resolve("tailwindcss")), "..");
const DIST = path.join(ROOT, "dist");

const FONTS_URL = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap";
// Aplica tema y densidad antes del primer pintado (evita el parpadeo de tema).
const NO_FLASH = `(function(){var d='light';try{var p=localStorage.getItem('caucion.theme');d=(p==='light'||p==='dark')?p:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}var r=document.documentElement;r.setAttribute('data-caucion-theme',d);r.setAttribute('data-caucion-density','balanced')})();`;

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
}

export async function buildAll({ minify = true } = {}) {
  const t0 = Date.now();
  // 0) Tokens: tokens.json → generated/tokens.css + tokens.ts
  buildTokens();

  // 1) JS
  const js = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/main.tsx")],
    bundle: true,
    write: false,
    format: "iife",
    minify,
    target: "es2020",
    jsx: "automatic",
    loader: { ".css": "empty" },
    define: { "process.env.NODE_ENV": JSON.stringify(minify ? "production" : "development") },
    legalComments: "none",
    logLevel: "warning",
  });
  const bundle = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

  // 2) CSS: Tailwind compila sólo las clases presentes en src/
  const candidates = new Set();
  for (const f of walk(path.join(ROOT, "src")).filter((f) => /\.(tsx?|css)$/.test(f)))
    for (const tok of fs.readFileSync(f, "utf8").split(/[\s"'`{}<>;]+/)) if (tok && tok.length < 120) candidates.add(tok);
  const entry = path.join(ROOT, "src/styles/app.css");
  const compiler = await compile(fs.readFileSync(entry, "utf8"), {
    base: path.dirname(entry),
    loadStylesheet: async (id, base) => {
      const p = id === "tailwindcss" ? path.join(TW_DIR, "index.css") : id.startsWith("tailwindcss/") ? path.join(TW_DIR, id.slice(12)) : path.resolve(base, id);
      return { path: p, base: path.dirname(p), content: fs.readFileSync(p, "utf8") };
    },
  });
  let css = compiler.build([...candidates]);
  css = (await esbuild.transform(css, { loader: "css", minify, target: ["chrome110", "safari16", "firefox115"] })).code;

  // 3) HTML. caucion.html: contenido para un host que añade <head>/<body> (artifact).
  const head = `<title>CAUCIÓN Design System</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="CAUCIÓN Design System V1.2 (Corporate Refined) y prototipo navegable. Datos ficticios.">
<script>${NO_FLASH}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS_URL}">
<style id="caucion-css">${css}</style>`;
  const body = `<div id="root"></div>
<div id="overlay-root"></div>
<script id="caucion-app">${bundle}</script>`;
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, "caucion.html"), `${head}\n${body}\n`);
  fs.writeFileSync(path.join(DIST, "index.html"),
    `<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`);
  return { ms: Date.now() - t0, js: bundle.length, css: css.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const r = await buildAll({ minify: !process.argv.includes("--dev") });
  console.log(`build ok · JS ${(r.js / 1024).toFixed(0)} KB · CSS ${(r.css / 1024).toFixed(0)} KB · ${r.ms} ms → dist/index.html, dist/caucion.html`);
}
