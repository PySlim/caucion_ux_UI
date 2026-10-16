// Servidor de desarrollo: recompila al guardar en src/ y sirve dist/ en http://localhost:5173
// Recarga manual del navegador tras cada cambio (sin HMR, a propósito: cero dependencias extra).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAll } from "../build.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
let building = false, queued = false;

async function rebuild(reason) {
  if (building) { queued = true; return; }
  building = true;
  try { const r = await buildAll({ minify: false }); console.log(`[dev] ${reason} · ${r.ms} ms`); }
  catch (e) { console.error("[dev] error de compilación:\n", e.message ?? e); }
  building = false;
  if (queued) { queued = false; rebuild("cambios pendientes"); }
}

await rebuild("inicio");
fs.watch(path.join(ROOT, "src"), { recursive: true }, (_e, file) => {
  if (!file || file.includes("generated")) return;
  rebuild(file);
});

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  let file = path.join(ROOT, "dist", url === "/" ? "index.html" : url);
  if (!file.startsWith(path.join(ROOT, "dist")) || !fs.existsSync(file)) {
    file = path.join(ROOT, "dist", "index.html");
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end("No encontrado");
    return;
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, HOST, () => console.log(`[dev] http://${HOST}:${PORT}`));
