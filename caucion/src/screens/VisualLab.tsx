import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../shell/AppContext";
import { Select } from "../components/ui/controls";
import { Tabs, InlineAlert, StatusBadge, Tag } from "../components/ui/data";
import { SpecimenFrame, SpecimenFull } from "../components/patterns/Specimen";
import { TOKENS } from "../tokens/generated/tokens";
import PAIRS from "../tokens/contrast-pairs.json";
import { contrast } from "../lib/contrast";
import { Icon } from "../lib/icon";
import { cn } from "../lib/cn";
import type { RouteId } from "../shell/nav";
import type { ThemeName } from "../theme/theme";

/* ============================== Claro y oscuro ============================== */
export function ThemeComparison() {
  return (
    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
      {(["light", "dark"] as ThemeName[]).map((t) => (
        <div key={t} className="flex flex-col gap-2 min-w-0">
          <p className="t-sub flex items-center gap-2"><Icon name={t === "light" ? "Sun" : "Moon"} size={16} />{t === "light" ? "Tema claro" : "Tema oscuro"}</p>
          <SpecimenFrame theme={t} label={`Componentes en tema ${t === "light" ? "claro" : "oscuro"}`}>
            <SpecimenFull id={`tc-${t}`} />
          </SpecimenFrame>
        </div>
      ))}
    </div>
  );
}

/* ============================== Contraste ============================== */
export function ContrastReport() {
  const [open, setOpen] = useState(false);
  const rows = (["light", "dark"] as ThemeName[]).flatMap((theme) => {
    const c = TOKENS.theme[theme] as Record<string, string>;
    return (PAIRS as { fg: string; bg: string; min: number; desc: string }[]).map((p) => ({ theme, ...p, r: contrast(c[p.fg], c[p.bg]), fgv: c[p.fg], bgv: c[p.bg] }));
  });
  const fails = rows.filter((r) => r.r < r.min).length;
  return (
    <div className="bg-surface border border-line rounded-card shadow-card">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="w-full flex flex-wrap items-center gap-3 px-[var(--panel-pad)] min-h-[var(--panel-head-h)] py-2 text-left hv:bg-subtle rounded-card">
        <Icon name={open ? "ChevronDown" : "ChevronRight"} size={16} className="text-fg-muted" />
        <span className="t-sub flex-1">Contraste WCAG 2.2 AA · claro y oscuro</span>
        <StatusBadge def={{ label: fails ? `${fails} pares fallan` : `${rows.length}/${rows.length} pares cumplen`, tone: fails ? "danger" : "success", icon: fails ? "CircleX" : "CircleCheck" }} />
      </button>
      {open && (
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full t-table min-w-[620px]">
            <thead><tr className="text-left text-fg-muted bg-subtle"><th className="font-medium h-9 pl-4 pr-3">Uso</th><th className="font-medium px-3">Tema</th><th className="font-medium px-3">Muestra</th><th className="font-medium px-3 text-right">Ratio</th><th className="font-medium px-3 pr-4 text-right">Mínimo</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.theme + r.desc} className="border-t border-line">
                  <td className="pl-4 pr-3 py-1.5">{r.desc}<span className="block t-help text-fg-muted t-ref">--{r.fg} / --{r.bg}</span></td>
                  <td className="px-3 py-1.5">{r.theme === "light" ? "Claro" : "Oscuro"}</td>
                  <td className="px-3 py-1.5"><span className="inline-flex items-center h-6 px-2 rounded-badge border border-line t-caption" style={{ background: r.bgv, color: r.fgv }}>Aa 123</span></td>
                  <td className={cn("px-3 py-1.5 text-right tnum font-medium", r.r < r.min ? "text-danger" : "text-fg")}>{r.r.toFixed(2)}:1</td>
                  <td className="px-3 pr-4 py-1.5 text-right tnum text-fg-muted">{r.min}:1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================== Estado de componentes ============================== */
type Row = { c: string; variants: string; states: string; pending?: string };
const STATUS_ROWS: Row[] = [
  { c: "Button", variants: "primary, secondary, tertiary, danger, quiet · sm, md, lg · con icono", states: "default, hover, focus, active, disabled, loading" },
  { c: "Icon Button", variants: "quiet, secondary, primary, danger, nav · contador", states: "default, hover, focus, disabled, loading" },
  { c: "Input", variants: "prefijo, sufijo, icono, numérico · sm, md, lg", states: "default, hover, focus, disabled, read-only, error, success, warning, loading" },
  { c: "Select", variants: "nativo · sm, md, lg", states: "default, hover, focus, disabled, error", pending: "Sin lista personalizada: para búsqueda se usa Combobox." },
  { c: "Checkbox", variants: "con y sin etiqueta, descripción", states: "default, checked, indeterminate, hover, focus, disabled, error" },
  { c: "Radio", variants: "con y sin etiqueta, descripción", states: "default, checked, hover, focus, disabled, error" },
  { c: "Tabs", variants: "línea, segmentado · contador, alerta, icono", states: "default, hover, seleccionado, focus, disabled", pending: "Las pestañas no enlazan su panel con aria-controls; sin indicador visual de desplazamiento cuando no caben." },
  { c: "Badge", variants: "soft, solid, outline (instrumento), dot · sm, md · 8 tonos", states: "estático" },
  { c: "Card", variants: "Panel (con y sin cabecera, flush), SummaryCard (estática, interactiva)", states: "default, hover, focus, loading" },
  { c: "Data Table", variants: "cómoda, compacta, cebra · selección, acciones por fila", states: "orden asc/desc/ninguno, seleccionada, activa, loading, vacía", pending: "La vista alternativa en tarjetas existe sólo en la bandeja; no hay redimensionado de columnas." },
  { c: "Modal", variants: "sm, md, lg, xl · pantalla completa bajo 640 px", states: "abierto, foco atrapado, Esc, retorno de foco" },
  { c: "Drawer", variants: "derecho, ancho por token · ancho completo en móvil", states: "abierto, foco atrapado, Esc, retorno de foco" },
  { c: "Dropdown", variants: "ítems, separador, deshabilitado, destructivo, marcado, atajo", states: "abierto, ítem activo, navegación ↑ ↓ Inicio Fin, Esc", pending: "Sin búsqueda por tipeo ni submenús." },
  { c: "Tooltip", variants: "arriba, abajo, derecha · alineado al centro o al inicio", states: "hover, focus, Esc", pending: "No cambia de lado automáticamente si choca con el borde; no usa portal." },
  { c: "Toast", variants: "éxito, error, advertencia, info · con acción", states: "entrada, cierre manual, cierre automático", pending: "No pausa el cierre automático con el puntero o el foco." },
  { c: "Sidebar", variants: "expandido, colapsado, drawer móvil · contador, etiqueta V2", states: "activo, hover, focus, ↑ ↓ Inicio Fin, Esc y retorno de foco en móvil" },
  { c: "Topbar", variants: "escritorio, tablet, móvil", states: "breadcrumbs, búsqueda, tema, notificaciones, menú de usuario" },
];
export function ComponentStatus() {
  const pend = STATUS_ROWS.filter((r) => r.pending).length;
  return (
    <div className="bg-surface border border-line rounded-card shadow-card">
      <div className="px-[var(--panel-pad)] py-3 border-b border-line flex flex-wrap items-center gap-2">
        <Tag tone="success" icon="CircleCheck">{STATUS_ROWS.length - pend} completos</Tag>
        <Tag tone="warning" icon="CircleAlert">{pend} con pendientes</Tag>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full t-table min-w-[760px]">
          <thead><tr className="text-left text-fg-muted bg-subtle"><th className="font-medium h-9 pl-4 pr-3">Componente</th><th className="font-medium px-3">Variantes</th><th className="font-medium px-3">Estados implementados</th><th className="font-medium px-3 pr-4">Estado</th></tr></thead>
          <tbody>
            {STATUS_ROWS.map((r) => (
              <tr key={r.c} className="border-t border-line align-top">
                <td className="pl-4 pr-3 py-2.5 font-medium whitespace-nowrap">{r.c}</td>
                <td className="px-3 py-2.5 text-fg-muted">{r.variants}</td>
                <td className="px-3 py-2.5 text-fg-muted">{r.states}</td>
                <td className="px-3 pr-4 py-2.5 min-w-[220px]">
                  {r.pending
                    ? <><StatusBadge size="sm" def={{ label: "Con pendientes", tone: "warning", icon: "CircleAlert" }} /><p className="t-help text-fg-muted mt-1">{r.pending}</p></>
                    : <StatusBadge size="sm" def={{ label: "Completo", tone: "success", icon: "CircleCheck" }} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================== Vista previa responsiva ============================== */
const DEVICES = [
  { id: "m360", label: "Mobile S · 360", w: 360, h: 740 },
  { id: "m390", label: "Mobile M · 390", w: 390, h: 780 },
  { id: "t768", label: "Tablet · 768", w: 768, h: 960 },
  { id: "t1024", label: "Tablet H · 1024", w: 1024, h: 720 },
  { id: "d1280", label: "Desktop · 1280", w: 1280, h: 760 },
  { id: "d1440", label: "Desktop amplio · 1440", w: 1440, h: 820 },
];
const ROUTES: { id: string; label: string; route: RouteId; param?: string }[] = [
  { id: "dashboard", label: "Inicio operacional", route: "dashboard" },
  { id: "bandeja", label: "Bandeja de solicitudes", route: "bandeja" },
  { id: "expediente", label: "Expediente SOL-2026-0147", route: "expediente", param: "SOL-2026-0147" },
  { id: "emision", label: "Workspace de emisión", route: "emision" },
  { id: "catalogo", label: "Visual Lab", route: "catalogo" },
];
const FONTS_FALLBACK = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap";

function buildSrcDoc(cfg: { route: RouteId; param?: string; theme: ThemeName }): string | null {
  const css = document.getElementById("caucion-css")?.textContent;
  const js = document.getElementById("caucion-app")?.textContent;
  if (!css || !js) return null;
  const fonts = (document.querySelector('link[href*="fonts.googleapis.com/css2"]') as HTMLLinkElement | null)?.href ?? FONTS_FALLBACK;
  const close = "</" + "script>";
  return `<!doctype html><html lang="es" data-caucion-theme="${cfg.theme}" data-caucion-density="balanced"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="${fonts}"><style>${css}</style><script>window.__CAUCION_EMBED=${JSON.stringify(cfg)}${close}</head><body><div id="root"></div><div id="overlay-root"></div><script>${js}${close}</body></html>`;
}

export function ResponsivePreview() {
  const { theme: appTheme, embedded } = useApp();
  const [dev, setDev] = useState("m390");
  const [routeId, setRouteId] = useState("bandeja");
  const [theme, setTheme] = useState<ThemeName>(appTheme);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [reported, setReported] = useState<number | null>(null);
  const [boxW, setBoxW] = useState(800);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const d = DEVICES.find((x) => x.id === dev)!;
  const r = ROUTES.find((x) => x.id === routeId)!;

  // srcdoc se construye una vez; ruta y tema viajan después por postMessage, sin recargar
  const srcDoc = useMemo(() => (embedded ? null : buildSrcDoc({ route: r.route, param: r.param, theme })), []);

  useEffect(() => {
    const ro = new ResizeObserver(() => setBoxW(box.current?.clientWidth ?? 800));
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const h = (e: MessageEvent) => { if (e.data?.source === "caucion-embed" && e.source === frame.current?.contentWindow) { setStatus("ready"); setReported(e.data.width ?? null); } };
    window.addEventListener("message", h);
    const t = setTimeout(() => setStatus((s) => (s === "loading" ? "failed" : s)), 8000);
    return () => { window.removeEventListener("message", h); clearTimeout(t); };
  }, []);
  const post = (msg: object) => { try { frame.current?.contentWindow?.postMessage({ source: "caucion-lab", ...msg }, "*"); } catch {} };
  useEffect(() => { if (status === "ready") post({ theme }); }, [theme, status]);
  useEffect(() => { if (status === "ready") post({ route: r.route, param: r.param }); }, [routeId, status]);

  if (embedded) return <InlineAlert tone="neutral">La vista previa responsiva no se anida dentro de otra vista previa.</InlineAlert>;
  if (!srcDoc) return <InlineAlert tone="warning" title="Vista previa no disponible">No se encontró el código de la aplicación en la página. Valida el comportamiento redimensionando la ventana del navegador.</InlineAlert>;
  const scale = Math.min(1, (boxW - 2) / d.w);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5 min-w-0 max-w-full">
          <span className="t-label">Dispositivo</span>
          <Tabs variant="segmented" ariaLabel="Dispositivo" value={dev} onChange={setDev} tabs={DEVICES.map((x) => ({ id: x.id, label: x.label }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="t-label">Tema</span>
          <Tabs variant="segmented" ariaLabel="Tema de la vista previa" value={theme} onChange={(v) => setTheme(v as ThemeName)} tabs={[{ id: "light", label: "Claro", icon: "Sun" }, { id: "dark", label: "Oscuro", icon: "Moon" }]} />
        </div>
        <div className="flex flex-col gap-1.5 w-full sm:w-64">
          <label className="t-label" htmlFor="rp-route">Pantalla</label>
          <Select id="rp-route" value={routeId} onChange={(e) => setRouteId(e.target.value)} options={ROUTES.map((x) => ({ value: x.id, label: x.label }))} />
        </div>
      </div>
      <p className="t-help text-fg-muted flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5"><Icon name="Ruler" size={14} />Viewport real: <span className="tnum text-fg font-medium">{d.w} × {d.h} px</span></span>
        {scale < 1 && <span>Mostrado al <span className="tnum">{Math.round(scale * 100)} %</span> para caber en pantalla; el diseño se calcula a {d.w} px.</span>}
        {status === "ready" && <Tag tone="success" icon="CircleCheck">Iframe activo{reported ? ` · ancho inicial ${reported} px` : ""}</Tag>}
        {status === "loading" && <Tag tone="info" icon="Loader">Cargando la aplicación…</Tag>}
      </p>
      {status === "failed" && (
        <InlineAlert tone="warning" title="El entorno no confirmó la carga del iframe">
          Algunos visores bloquean marcos anidados. Si el marco aparece vacío, valida en el navegador: abre esta página, activa el modo dispositivo de las herramientas de desarrollo (Ctrl + Shift + M en Chrome) y prueba 360, 390, 768, 1024, 1280 y 1440 px.
        </InlineAlert>
      )}
      <div ref={box} className="bg-muted border border-line rounded-card overflow-hidden flex justify-center">
        <div style={{ width: d.w * scale, height: d.h * scale }} className="relative">
          <iframe ref={frame} title={`Vista previa a ${d.w} px`} srcDoc={srcDoc}
            style={{ width: d.w, height: d.h, transform: `scale(${scale})`, transformOrigin: "top left", border: 0, display: "block", background: "var(--bg-canvas)" }} />
        </div>
      </div>
    </div>
  );
}
