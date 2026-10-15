import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppContext, type AppCtx } from "./shell/AppContext";
import { AppShell, PageHeader, PageBody, type Crumb } from "./shell/AppShell";
import { SearchPalette } from "./shell/SearchPalette";
import { ALL_NAV, navItem, type RouteId } from "./shell/nav";
import { ToastProvider } from "./components/ui/overlays";
import { EmptyState } from "./components/ui/data";
import { Button } from "./components/ui/controls";
import { SOLICITUDES, type Solicitud } from "./data/mock";
import { Dashboard } from "./screens/Dashboard";
import { Bandeja } from "./screens/Bandeja";
import { Expediente } from "./screens/Expediente";
import { Emision } from "./screens/Emision";
import { Catalogo } from "./screens/Catalogo";
import { applyTheme, loadThemePref, saveThemePref, resolveTheme, onSystemThemeChange, DEFAULT_DENSITY, type ThemeName, type ThemePref } from "./theme/theme";

/** Configuración cuando la app corre dentro de la vista previa responsiva del Visual Lab. */
export interface EmbedConfig { route: RouteId; param?: string; theme: ThemeName }
const EMBED: EmbedConfig | undefined = (window as any).__CAUCION_EMBED;

const ROUTES = new Set(ALL_NAV.map((n) => n.id as string).concat("expediente"));

function parseHash(): { route: RouteId; param?: string } {
  const h = (typeof location !== "undefined" ? location.hash : "").replace(/^#/, "");
  const [r, ...rest] = h.split("-");
  if (ROUTES.has(r)) return { route: r as RouteId, param: rest.join("-") || undefined };
  return { route: "dashboard" };
}

export default function App() {
  const initial = EMBED ? { route: EMBED.route, param: EMBED.param } : parseHash();
  const [route, setRoute] = useState<RouteId>(initial.route);
  const [param, setParam] = useState<string | undefined>(initial.param ?? (initial.route === "expediente" ? "SOL-2026-0147" : undefined));
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(SOLICITUDES);
  const [search, setSearch] = useState(false);
  const [themePref, setThemePrefState] = useState<ThemePref>(() => EMBED?.theme ?? loadThemePref());
  const [theme, setThemeState] = useState<ThemeName>(() => resolveTheme(EMBED?.theme ?? loadThemePref()));
  const setThemePref = useCallback((p: ThemePref) => { setThemePrefState(p); setThemeState(resolveTheme(p)); if (!EMBED) saveThemePref(p); }, []);

  const go = useCallback((r: RouteId, opts?: { id?: string; tab?: string }) => {
    setRoute(r);
    setParam(opts?.id ?? opts?.tab);
    const hash = r + (opts?.id ? "-" + opts.id : opts?.tab ? "-" + opts.tab : "");
    if (!EMBED) { try { history.replaceState(null, "", "#" + hash); } catch {} }
    document.getElementById("main")?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const h = () => { const p = parseHash(); setRoute(p.route); setParam(p.param); };
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearch(true); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => { applyTheme(document.documentElement, theme, DEFAULT_DENSITY); }, [theme]);
  // Con preferencia "Según el sistema", el tema sigue los cambios del sistema operativo
  useEffect(() => (themePref === "system" ? onSystemThemeChange(setThemeState) : undefined), [themePref]);
  // Vista previa embebida: recibe cambios de apariencia/ruta del Visual Lab y avisa cuando está lista
  useEffect(() => {
    if (!EMBED) return;
    const h = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.source !== "caucion-lab") return;
      if (d.theme === "light" || d.theme === "dark") { setThemePrefState(d.theme); setThemeState(d.theme); }
      if (d.route) { setRoute(d.route); setParam(d.param); }
    };
    window.addEventListener("message", h);
    try { window.parent?.postMessage({ source: "caucion-embed", ready: true, width: window.innerWidth }, "*"); } catch {}
    return () => window.removeEventListener("message", h);
  }, []);

  const ctx: AppCtx = useMemo(() => ({
    route, go, routeParam: param, solicitudes,
    addSolicitud: (s) => setSolicitudes((xs) => [s, ...xs]),
    updateSolicitud: (id, patch) => setSolicitudes((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch, actualizada: "2026-10-15T11:30:00" } : x))),
    openSearch: () => setSearch(true),
    theme, themePref, setThemePref, density: DEFAULT_DENSITY, embedded: !!EMBED,
  }), [route, param, solicitudes, theme, themePref]);

  const crumbs: Crumb[] = (() => {
    const home: Crumb = { label: "Inicio", to: "dashboard" };
    if (route === "dashboard") return [{ label: "Inicio operacional" }];
    if (route === "expediente") return [home, { label: "Solicitudes", to: "bandeja" }, { label: param ?? "SOL-2026-0147" }];
    if (route === "emision") return [home, { label: "Emisiones", to: "emision" }, { label: "EMI-2026-0089" }];
    const n = navItem(route);
    return [home, ...(n?.group ? [{ label: n.group }] : []), { label: n?.label ?? route }];
  })();

  let screen: React.ReactNode;
  switch (route) {
    case "dashboard": screen = <Dashboard />; break;
    case "bandeja": screen = <Bandeja />; break;
    case "expediente": screen = <Expediente key={param} />; break;
    case "emision": screen = <Emision />; break;
    case "catalogo": screen = <Catalogo />; break;
    default: {
      const n = navItem(route)!;
      screen = (
        <>
          <PageHeader module={n.group} title={n.label} description={n.description} />
          <PageBody>
            <div className="bg-surface border border-line rounded-card">
              <EmptyState icon={n.icon} title="Módulo fuera del alcance de V1"
                body={`${n.label} forma parte de la arquitectura de módulos, pero su diseño se abordará en una siguiente iteración. El shell, la navegación y los componentes ya lo soportan.`}
                action={<Button variant="primary" onClick={() => go("bandeja")}>Ir a solicitudes</Button>}
                secondary={<Button onClick={() => go("catalogo")}>Ver Design System</Button>} />
            </div>
          </PageBody>
        </>
      );
    }
  }

  return (
    <AppContext.Provider value={ctx}>
      <ToastProvider>
        <AppShell crumbs={crumbs}>
          <div key={route + (param ?? "")} className="rise min-h-full">{screen}</div>
        </AppShell>
        <SearchPalette open={search} onClose={() => setSearch(false)} />
      </ToastProvider>
    </AppContext.Provider>
  );
}
