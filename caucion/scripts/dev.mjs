// Servidor de desarrollo: recompila al guardar en src/ y sirve dist/ en http://localhost:5173
// Recarga manual del navegador tras cada cambio (sin HMR, a propósito: cero dependencias extra).
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAll } from "../build.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT) || 5173;
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

http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  const file = path.join(ROOT, "dist", url === "/" ? "index.html" : url);
  if (!file.startsWith(path.join(ROOT, "dist")) || !fs.existsSync(file)) { res.writeHead(404); res.end("No encontrado"); return; }
  res.writeHead(200, { "Content-Type": file.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`[dev] http://localhost:${PORT}`));
