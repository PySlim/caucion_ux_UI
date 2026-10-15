// Pruebas de interfaz de CAUCIÓN V1.2 (Playwright + Chromium) sobre dist/index.html.
// Uso: npm run build && npm run test:ui        (requiere: npx playwright install chromium)
// Salida: test-results/report.json, test-results/screens/*.png y docs/REPORTE-VALIDACION.md
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_URL = pathToFileURL(path.join(ROOT, "dist/index.html")).href;
const OUT = path.join(ROOT, "test-results");
const SHOTS = path.join(OUT, "screens");
const OFFLINE = !process.argv.includes("--online"); // por defecto bloquea la red: el build debe funcionar sin CDN
fs.mkdirSync(SHOTS, { recursive: true });

const WIDTHS = [360, 390, 768, 1024, 1280, 1440];
const THEMES = ["light", "dark"];
const ROUTES = [
  { id: "dashboard", label: "Inicio operacional" },
  { id: "bandeja", label: "Bandeja" },
  { id: "expediente-SOL-2026-0147", label: "Expediente" },
  { id: "emision", label: "Emisión" },
  { id: "catalogo", label: "Visual Lab" },
];

/* Inspección de layout ejecutada en la página */
const INSPECT = () => {
  const vw = document.documentElement.clientWidth;
  const main = document.getElementById("main");
  const clip = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (["auto", "scroll", "hidden", "clip"].includes(s.overflowX) && p !== main) return true; } return false; };
  const offenders = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if ((r.right > vw + 1 || r.left < -1) && !clip(el)) offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} → ${Math.round(r.left)}..${Math.round(r.right)}`);
  }
  // Objetivos táctiles < 24 px que no sean enlaces dentro de texto (excepción WCAG 2.5.8)
  const small = [];
  for (const b0 of document.querySelectorAll("button, a[href], [role=tab], input, select, textarea")) {
    if (b0.closest(".sr-only") || b0.classList.contains("sr-only") || b0.type === "file" || b0.type === "hidden") continue;
    const b = b0.type === "checkbox" || b0.type === "radio" ? b0.closest("label") ?? b0 : b0;
    const r = b.getBoundingClientRect();
    if (!r.width || !r.height || getComputedStyle(b).visibility === "hidden") continue;
    if (r.height >= 24 && r.width >= 24) continue;
    const inline = b.parentElement && getComputedStyle(b).display.startsWith("inline") && /\S/.test((b.parentElement.textContent ?? "").replace(b.textContent ?? "", ""));
    if (!inline) small.push(`${(b.getAttribute("aria-label") || b.textContent || b.tagName).trim().slice(0, 28)} ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  // Controles sin nombre accesible
  const unnamed = [];
  for (const el of document.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea, [role=tab], [role=switch], [role=combobox]")) {
    if (el.closest("[aria-hidden=true]")) continue;
    const id = el.id;
    const name = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("title") || (el.textContent ?? "").trim()
      || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || el.closest("label") || el.getAttribute("placeholder");
    if (!name) unnamed.push(el.outerHTML.slice(0, 90));
  }
  // Texto recortado sin elipsis declarada (posible solapamiento)
  const clipped = [];
  for (const el of document.querySelectorAll("p, span, h1, h2, h3, label, td, th, button")) {
    const s = getComputedStyle(el);
    if (el.children.length || !(el.textContent ?? "").trim() || el.closest(".sr-only")) continue;
    if ((s.overflow === "hidden" || s.overflowX === "hidden") && s.textOverflow !== "ellipsis" && el.scrollWidth > el.clientWidth + 1) clipped.push((el.textContent ?? "").trim().slice(0, 40));
  }
  return { vw, docOverflow: document.documentElement.scrollWidth - vw, mainOverflow: main ? main.scrollWidth - main.clientWidth : 0, offenders: offenders.slice(0, 5), small: small.slice(0, 6), smallCount: small.length, unnamed: unnamed.slice(0, 4), unnamedCount: unnamed.length, clipped: clipped.slice(0, 4) };
};

async function newPage(browser, { width, height = 860, theme, scheme = "light", storage = true }) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme });
  if (storage) await ctx.addInitScript((t) => { try { localStorage.setItem("caucion.theme", t); localStorage.removeItem("caucion.sidebar"); } catch {} }, theme);
  const page = await ctx.newPage();
  const log = { errors: [], warnings: [], external: [] };
  page.on("pageerror", (e) => log.errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/ERR_|net::/.test(m.text())) log.errors.push(m.text()); if (m.type() === "warning") log.warnings.push(m.text()); });
  await page.route("**/*", (r) => {
    const u = r.request().url();
    if (u.startsWith("file:") || u.startsWith("data:") || u.startsWith("about:")) return r.continue();
    log.external.push(new URL(u).host);
    return OFFLINE ? r.abort() : r.continue();
  });
  return { ctx, page, log };
}
const ready = (page) => page.waitForFunction(() => document.querySelector("#root")?.children.length > 0, null, { timeout: 15000 });

const results = { date: new Date().toISOString(), offline: OFFLINE, matrix: [], zoom: [], interactions: [] };
const pass = (name, ok, detail = "") => { results.interactions.push({ name, ok, detail }); console.log(`${ok ? "✔" : "✘"} ${name}${detail ? " — " + detail : ""}`); };

const browser = await chromium.launch();

/* 1) Matriz responsiva: 6 anchos × 2 temas × 5 pantallas */
for (const width of WIDTHS) for (const theme of THEMES) {
  const { ctx, page, log } = await newPage(browser, { width, theme });
  for (const r of ROUTES) {
    await page.goto(`${APP_URL}#${r.id}`);
    await page.reload();
    await ready(page);
    await page.waitForTimeout(900);
    const m = await page.evaluate(INSPECT);
    const appliedTheme = await page.evaluate(() => document.documentElement.getAttribute("data-caucion-theme"));
    const ok = m.docOverflow <= 0 && m.mainOverflow <= 0 && m.offenders.length === 0 && m.unnamedCount === 0 && m.clipped.length === 0 && appliedTheme === theme;
    results.matrix.push({ width, theme, route: r.id, ok, ...m, appliedTheme, smallTargets: width < 768 ? m.smallCount : null });
    await page.screenshot({ path: path.join(SHOTS, `${width}-${theme}-${r.id.split("-")[0]}.png`) });
    if (!ok) console.log(`✘ ${width} ${theme} ${r.id}`, JSON.stringify({ d: m.docOverflow, mo: m.mainOverflow, off: m.offenders, un: m.unnamed, cl: m.clipped, t: appliedTheme }));
  }
  results.matrix.filter((x) => x.width === width && x.theme === theme).forEach((x) => (x.consoleErrors = log.errors.length, x.consoleWarnings = log.warnings.length));
  if (log.errors.length) console.log(`  errores de consola ${width}/${theme}:`, log.errors.slice(0, 3));
  results.external = [...new Set([...(results.external ?? []), ...log.external])];
  await ctx.close();
}
const mOk = results.matrix.filter((x) => x.ok).length;
console.log(`Matriz responsiva: ${mOk}/${results.matrix.length} combinaciones sin incidencias`);

/* 1b) Anchos intermedios (el diseño es fluido, no sólo para los anchos de referencia) */
results.intermediate = [];
for (const width of [480, 600, 900, 1100, 1366, 1920]) {
  const { ctx, page } = await newPage(browser, { width, theme: "light" });
  for (const r of ROUTES) {
    await page.goto(`${APP_URL}#${r.id}`); await page.reload(); await ready(page); await page.waitForTimeout(700);
    const m = await page.evaluate(INSPECT);
    const ok = m.docOverflow <= 0 && m.mainOverflow <= 0 && m.offenders.length === 0 && m.clipped.length === 0;
    results.intermediate.push({ width, route: r.id, ok, ...m });
    if (!ok) console.log(`✘ intermedio ${width} ${r.id}`, m.offenders, m.mainOverflow);
  }
  await ctx.close();
}
console.log(`Anchos intermedios: ${results.intermediate.filter((x) => x.ok).length}/${results.intermediate.length}`);

/* 2) Zoom 200 % (reflow): 1280 y 1440 al 200 % equivalen a 640 y 720 px CSS */
for (const [w, h, label] of [[640, 400, "1280 px al 200 %"], [720, 450, "1440 px al 200 %"]]) for (const theme of THEMES) {
  const { ctx, page } = await newPage(browser, { width: w, height: h, theme });
  for (const r of ROUTES) {
    await page.goto(`${APP_URL}#${r.id}`); await page.reload(); await ready(page); await page.waitForTimeout(700);
    const m = await page.evaluate(INSPECT);
    const ok = m.docOverflow <= 0 && m.mainOverflow <= 0 && m.offenders.length === 0 && m.clipped.length === 0;
    results.zoom.push({ label, theme, route: r.id, ok, ...m });
    if (!ok) console.log(`✘ zoom ${label} ${theme} ${r.id}`, m.offenders, m.clipped);
  }
  await ctx.close();
}
console.log(`Zoom 200 %: ${results.zoom.filter((x) => x.ok).length}/${results.zoom.length}`);

/* 3) Tema: prefers-color-scheme, persistencia, sin parpadeo */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: "dark" });
  await ctx.addInitScript(() => { document.addEventListener("DOMContentLoaded", () => { (window).__themeAtDCL = document.documentElement.getAttribute("data-caucion-theme"); (window).__rootAtDCL = document.getElementById("root")?.children.length ?? -1; }); });
  const page = await ctx.newPage();
  await page.route("**/*", (r) => (r.request().url().startsWith("file:") ? r.continue() : r.abort()));
  await page.goto(`${APP_URL}#dashboard`); await ready(page);
  const at = await page.evaluate(() => [(window).__themeAtDCL, document.documentElement.getAttribute("data-caucion-theme"), localStorage.getItem("caucion.theme")]);
  pass("Sin preferencia guardada se respeta prefers-color-scheme (oscuro)", at[1] === "dark" && at[2] === null, `tema=${at[1]}, guardado=${at[2]}`);
  pass("Tema aplicado antes de cargar la aplicación (sin parpadeo)", at[0] === "dark", `atributo en DOMContentLoaded=${at[0]}`);
  await page.getByRole("button", { name: "Cambiar a tema claro" }).click();
  const after = await page.evaluate(() => [document.documentElement.getAttribute("data-caucion-theme"), localStorage.getItem("caucion.theme")]);
  pass("Conmutación global desde el topbar", after[0] === "light" && after[1] === "light", `tema=${after[0]}, guardado=${after[1]}`);
  await page.reload(); await ready(page);
  const persisted = await page.evaluate(() => document.documentElement.getAttribute("data-caucion-theme"));
  pass("Preferencia persistente tras recargar", persisted === "light", `tema=${persisted}`);
  await page.getByRole("button", { name: /Menú de usuario/ }).click();
  await page.getByRole("menuitem", { name: "Según el sistema" }).click();
  const sys = await page.evaluate(() => [document.documentElement.getAttribute("data-caucion-theme"), localStorage.getItem("caucion.theme")]);
  pass("Opción «Según el sistema» vuelve a seguir al sistema", sys[0] === "dark" && sys[1] === null, `tema=${sys[0]}`);
  await ctx.close();
}

/* 4) Navegación móvil, foco y teclado */
{
  const { ctx, page } = await newPage(browser, { width: 390, height: 780, theme: "light" });
  await page.goto(`${APP_URL}#bandeja`); await ready(page);
  const menuBtn = page.getByRole("button", { name: "Abrir navegación" });
  await menuBtn.click(); await page.waitForTimeout(150);
  const inDrawer = await page.evaluate(() => !!document.activeElement?.closest("[role=dialog][aria-label='Navegación principal']"));
  pass("Drawer móvil: el foco entra en la navegación", inDrawer);
  for (let i = 0; i < 40; i++) await page.keyboard.press("Tab");
  const trapped = await page.evaluate(() => !!document.activeElement?.closest("[role=dialog][aria-label='Navegación principal']"));
  pass("Drawer móvil: Tab queda atrapado dentro", trapped);
  await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  const back = await page.evaluate(() => [!!document.querySelector("[role=dialog][aria-label='Navegación principal']"), document.activeElement?.getAttribute("aria-label")]);
  pass("Drawer móvil: Esc cierra y devuelve el foco al botón de menú", !back[0] && back[1] === "Abrir navegación", `foco=${back[1]}`);

  await page.getByRole("button", { name: "Nueva solicitud" }).first().click(); await page.waitForTimeout(250);
  await page.getByRole("button", { name: "Registrar solicitud" }).click(); await page.waitForTimeout(250);
  const modal = await page.evaluate(() => { const d = document.querySelector("[role=dialog][aria-modal=true]"); const r = d?.getBoundingClientRect(); return { inView: !!r && r.left >= 0 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1, alert: !!d?.querySelector("[role=alert]"), focusIn: !!document.activeElement?.closest("[role=dialog]") }; });
  pass("Modal a 390 px dentro del viewport con validación visible", modal.inView && modal.alert && modal.focusIn, JSON.stringify(modal));
  await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  const mBack = await page.evaluate(() => [!!document.querySelector("[role=dialog][aria-modal=true]"), (document.activeElement?.textContent ?? "").trim()]);
  pass("Modal: Esc cierra y devuelve el foco al disparador", !mBack[0] && /Nueva solicitud/.test(mBack[1]), `foco=${mBack[1]}`);

  await page.getByRole("button", { name: /Notificaciones/ }).click(); await page.waitForTimeout(150);
  const menu = await page.evaluate(() => { const m = document.querySelector("[role=menu]"); const r = m?.getBoundingClientRect(); return { inView: !!r && r.left >= 0 && r.right <= innerWidth + 1, active: m?.getAttribute("aria-activedescendant") }; });
  await page.keyboard.press("ArrowDown");
  const moved = await page.evaluate(() => document.querySelector("[role=menu]")?.getAttribute("aria-activedescendant"));
  pass("Menú a 390 px dentro del viewport y navegable con flechas", menu.inView && !!moved && moved !== menu.active, `activo ${menu.active} → ${moved}`);
  await page.keyboard.press("Escape");
  await ctx.close();
}
{
  const { ctx, page } = await newPage(browser, { width: 1280, height: 860, theme: "light" });
  await page.goto(`${APP_URL}#expediente-SOL-2026-0147`); await ready(page); await page.waitForTimeout(700);
  await page.getByRole("tab", { name: /Resumen/ }).focus();
  await page.keyboard.press("ArrowRight");
  const tab = await page.evaluate(() => document.querySelector("[role=tab][aria-selected=true]")?.textContent);
  pass("Tabs: ← → cambian de pestaña", /Participantes/.test(tab ?? ""), `seleccionada=${tab}`);
  const ring = await page.evaluate(() => { const el = document.activeElement; const s = getComputedStyle(el); return `${s.outlineStyle} ${s.outlineWidth}`; });
  pass("Foco visible (contorno de 2 px)", /solid 2px/.test(ring), ring);
  await page.locator("body").press("[");
  await page.waitForTimeout(400);
  const w1 = await page.evaluate(() => document.querySelector("aside")?.getBoundingClientRect().width);
  pass("Sidebar colapsable con teclado ( [ )", Math.round(w1 ?? 0) === 64, `ancho=${w1}`);
  await page.locator("[data-nav]").first().focus(); await page.keyboard.press("ArrowDown");
  const navFocus = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent);
  pass("Sidebar navegable con flechas", !!navFocus && !/Inicio operacional/.test(navFocus), `foco=${navFocus}`);
  await ctx.close();
}

/* 5) Visual Lab: vista previa responsiva en iframe */
{
  const { ctx, page } = await newPage(browser, { width: 1440, height: 900, theme: "light" });
  await page.goto(`${APP_URL}#catalogo-responsive`); await ready(page);
  await page.waitForFunction(() => /Iframe activo/.test(document.body.textContent ?? ""), null, { timeout: 15000 }).catch(() => {});
  const frame = page.frames().find((f) => f !== page.mainFrame());
  const w = frame ? await frame.evaluate(() => innerWidth) : null;
  await page.getByRole("tab", { name: "Desktop amplio · 1440" }).click(); await page.waitForTimeout(500);
  const w2 = frame ? await frame.evaluate(() => innerWidth) : null;
  await page.getByRole("tab", { name: "Oscuro" }).click(); await page.waitForTimeout(400);
  const t2 = frame ? await frame.evaluate(() => document.documentElement.getAttribute("data-caucion-theme")) : null;
  pass("Visual Lab: iframe con ancho real (390 → 1440 px) y cambio de tema", w === 390 && w2 === 1440 && t2 === "dark", `ancho ${w} → ${w2}, tema ${t2}`);
  await page.screenshot({ path: path.join(SHOTS, "visual-lab-preview.png") });
  await ctx.close();
}
await browser.close();

/* Informe */
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(results, null, 2));
const cell = (w, t) => { const rows = results.matrix.filter((x) => x.width === w && x.theme === t); const bad = rows.filter((x) => !x.ok); return bad.length ? `✘ ${bad.map((b) => b.route.split("-")[0]).join(", ")}` : `✔ ${rows.length}/${rows.length}`; };
const small = results.matrix.filter((x) => x.width < 768 && x.smallTargets).map((x) => `${x.width}/${x.theme}/${x.route.split("-")[0]}: ${x.small.join("; ")}`);
let md = `# Reporte de validación — CAUCIÓN Design System V1.2\n\nGenerado por \`npm run test:ui\` el ${results.date}. Chromium (Playwright) sobre \`dist/index.html\`, red externa ${OFFLINE ? "bloqueada (prueba sin CDN)" : "permitida"}.\n\n`;
md += `## Matriz responsiva (5 pantallas por celda)\n\n| Ancho | Claro | Oscuro |\n|---|---|---|\n`;
for (const w of WIDTHS) md += `| ${w} px | ${cell(w, "light")} | ${cell(w, "dark")} |\n`;
md += `\nCriterios por combinación: sin desbordamiento horizontal del documento ni del área de trabajo, ningún elemento fuera del viewport salvo dentro de un contenedor con desplazamiento propio, todos los controles con nombre accesible, ningún texto recortado sin elipsis y tema aplicado correcto.\n\n`;
md += `## Anchos intermedios\n\n${results.intermediate.filter((x) => x.ok).length}/${results.intermediate.length} combinaciones correctas (480, 600, 900, 1100, 1366 y 1920 px, tema claro, 5 pantallas).\n\n`;
md += `## Zoom 200 % (reflow)\n\n${results.zoom.filter((x) => x.ok).length}/${results.zoom.length} combinaciones correctas (1280 y 1440 px al 200 %, ambos temas, 5 pantallas).\n\n`;
md += `## Interacción, foco y tema\n\n| Prueba | Resultado | Detalle |\n|---|---|---|\n${results.interactions.map((i) => `| ${i.name} | ${i.ok ? "✔ Aprobada" : "✘ Fallida"} | ${i.detail.replace(/\|/g, "/")} |`).join("\n")}\n\n`;
md += `## Objetivos táctiles menores de 24 px (< 768 px)\n\n${small.length ? small.map((s) => `- ${s}`).join("\n") : "Ninguno fuera de enlaces dentro de texto (excepción WCAG 2.5.8)."}\n\n`;
md += `## Recursos externos solicitados\n\n${(results.external ?? []).length ? results.external.map((h) => `- ${h}`).join("\n") : "Ninguno."}\n`;
fs.mkdirSync(path.join(ROOT, "docs"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "docs/REPORTE-VALIDACION.md"), md);
const failed = results.matrix.filter((x) => !x.ok).length + results.intermediate.filter((x) => !x.ok).length + results.zoom.filter((x) => !x.ok).length + results.interactions.filter((x) => !x.ok).length;
console.log(`\nInforme: docs/REPORTE-VALIDACION.md · ${failed} incidencias`);
process.exit(failed ? 1 : 0);
