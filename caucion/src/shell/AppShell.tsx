import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import { Icon } from "../lib/icon";
import { NAV, navItem, type RouteId } from "./nav";
import { useApp } from "./AppContext";
import { IconButton, Button } from "../components/ui/controls";
import { Dropdown, Tooltip } from "../components/ui/overlays";
import { Avatar } from "../components/ui/data";
import { CURRENT_USER, ALERTAS, PENDIENTES } from "../data/mock";
import { relative } from "../lib/format";

/* ============================== Sidebar ============================== */
function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: { collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onCloseMobile: () => void }) {
  const { route, go } = useApp();
  const listRef = useRef<HTMLElement>(null);
  const activeId: RouteId = route === "expediente" ? "bandeja" : route;

  // Navegación por teclado: ↑ ↓ Inicio Fin entre ítems
  const onKey = (e: React.KeyboardEvent) => {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-nav]") ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    let n = -1;
    if (e.key === "ArrowDown") n = Math.min(i + 1, items.length - 1);
    if (e.key === "ArrowUp") n = Math.max(i - 1, 0);
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = items.length - 1;
    if (n >= 0) { e.preventDefault(); items[n].focus(); }
  };

  const content = (
    <div className={cn("on-nav h-full flex flex-col bg-nav text-fg-on-nav", collapsed && !mobileOpen ? "w-[var(--sidebar-w-collapsed)]" : "w-[var(--sidebar-w)] max-w-full")}>
      {/* Identidad */}
      <div className={cn("h-[var(--topbar-h)] flex items-center gap-2.5 border-b border-line-nav shrink-0", collapsed && !mobileOpen ? "justify-center px-0" : "px-4")}>
        <Logo />
        {(!collapsed || mobileOpen) && (
          <div className="flex flex-col leading-none min-w-0">
            <span className="t-wordmark">CAUCIÓN</span>
            <span className="text-2xs text-fg-on-nav-muted mt-1 tracking-wide">Garantías y cauciones · DS V1.2</span>
          </div>
        )}
      </div>

      <nav ref={listRef} aria-label="Navegación principal" onKeyDown={onKey} className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {NAV.map((g, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-4")}>
            {g.label && (collapsed && !mobileOpen
              ? <div className="mx-4 mb-2 border-t border-line-nav" aria-hidden="true" />
              : <p className="px-4 mb-1 t-module text-2xs text-fg-on-nav-muted">{g.label}</p>)}
            <ul className="flex flex-col gap-px px-2">
              {g.items.map((it) => {
                const active = it.id === activeId;
                const compact = collapsed && !mobileOpen;
                const btn = (
                  <NavButton icon={it.icon} label={it.label} active={active} badge={it.badge} tag={!it.v1 ? "V2" : undefined} collapsed={compact}
                    onClick={() => { go(it.id); onCloseMobile(); }} />
                );
                return <li key={it.id}>{collapsed && !mobileOpen ? <Tooltip content={it.label} side="right">{btn}</Tooltip> : btn}</li>;
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("border-t border-line-nav p-2 shrink-0 flex", collapsed && !mobileOpen ? "justify-center" : "justify-between items-center")}>
        {(!collapsed || mobileOpen) && <span className="px-2 t-help text-fg-on-nav-muted">Prototipo · datos ficticios</span>}
        <IconButton variant="nav" icon={mobileOpen ? "X" : collapsed ? "PanelLeftOpen" : "PanelLeftClose"} label={mobileOpen ? "Cerrar navegación" : collapsed ? "Expandir navegación ( [ )" : "Contraer navegación ( [ )"}
          onClick={mobileOpen ? onCloseMobile : onToggle} />
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block h-full shrink-0 transition-[width] duration-150" style={{ width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)" }}>
        {content}
      </aside>
      {mobileOpen && <MobileNav onClose={onCloseMobile}>{content}</MobileNav>}
    </>
  );
}

/** Ítem de navegación lateral. Reutilizado por el Sidebar y por el Visual Lab. */
export function NavButton({ icon, label, active, badge, tag, collapsed, onClick, state }: {
  icon: string; label: string; active?: boolean; badge?: number; tag?: string; collapsed?: boolean; onClick?: () => void; state?: "hover";
}) {
  return (
    <button
      data-nav
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "relative w-full h-[var(--nav-item-h)] flex items-center gap-3 rounded-control text-sm transition-colors",
        collapsed ? "justify-center px-0" : "px-2.5",
        active ? "bg-nav-active text-fg-on-nav font-medium" : "text-fg-on-nav-muted hv:bg-nav-hover hv:text-fg-on-nav",
        state === "hover" && !active && "bg-nav-hover text-fg-on-nav",
      )}
    >
      {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-nav-indicator" aria-hidden="true" />}
      <Icon name={icon} size={18} />
      {!collapsed && <span className="flex-1 min-w-0 text-left truncate">{label}</span>}
      {!collapsed && tag && <span className="text-2xs uppercase tracking-wider text-fg-on-nav-muted border border-line-nav rounded-badge px-1">{tag}</span>}
      {badge ? (
        collapsed
          ? <span className="absolute top-1.5 right-2.5 h-2 w-2 rounded-full bg-nav-indicator" aria-label={`${badge} pendientes`} />
          : <span className="min-w-5 h-5 px-1.5 rounded-full bg-nav-badge text-nav-badge-fg text-2xs leading-5 font-semibold tnum text-center" aria-label={`${badge} pendientes`}>{badge}</span>
      ) : null}
    </button>
  );
}

/** Drawer de navegación (< 768 px): modal, foco atrapado, Esc cierra y el foco vuelve al botón de menú. */
function MobileNav({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    setTimeout(() => (el?.querySelector<HTMLElement>("[aria-current=page]") ?? el?.querySelector<HTMLElement>("[data-nav]"))?.focus(), 20);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.key === "Tab" && el) {
        const f = Array.from(el.querySelectorAll<HTMLElement>("button:not([disabled]),a[href]"));
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, []);
  return createPortal(
    <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navegación principal">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="relative h-full w-fit max-w-[86vw] slide-in shadow-modal" style={{ paddingLeft: "env(safe-area-inset-left, 0px)" }}>{children}</div>
    </div>,
    document.getElementById("overlay-root") ?? document.body,
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  // Monograma provisional: sello de garantía (anillo + barra). Sujeto a identidad corporativa.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect x="1" y="1" width="30" height="30" style={{ rx: "min(var(--radius-control), 9px)" } as React.CSSProperties} fill="none" stroke="var(--nav-indicator)" strokeWidth="2" />
      <path d="M21.5 11.2A7 7 0 1 0 21.5 20.8" fill="none" stroke="var(--fg-on-nav)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M14 16h9" stroke="var(--nav-indicator)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/* ============================== Topbar ============================== */
export interface Crumb { label: string; to?: RouteId }

function Topbar({ crumbs, onMenu }: { crumbs: Crumb[]; onMenu: () => void }) {
  const { go, openSearch, theme, themePref, setThemePref } = useApp();
  const [unread, setUnread] = useState(ALERTAS.length);
  return (
    <header className="h-[var(--topbar-h)] shrink-0 bg-surface border-b border-line flex items-center gap-1.5 sm:gap-3 pr-2 md:pr-4"
      style={{ paddingLeft: "max(12px, env(safe-area-inset-left, 0px))" }}>
      <IconButton icon="Menu" label="Abrir navegación" className="md:hidden" onClick={onMenu} />
      <nav aria-label="Ruta de navegación" className="min-w-0 flex-1 md:flex-none">
        <ol className="flex items-center gap-1.5 t-label min-w-0">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={i} className={cn("flex items-center gap-1.5 min-w-0", !last && "hidden sm:flex")}>
                {c.to && !last ? (
                  <button className="text-fg-muted hv:text-fg hv:underline underline-offset-2 truncate" onClick={() => go(c.to!)}>{c.label}</button>
                ) : (
                  <span className={cn("truncate", last ? "text-fg font-semibold" : "text-fg-muted")} aria-current={last ? "page" : undefined}>{c.label}</span>
                )}
                {!last && <Icon name="ChevronRight" size={14} className="text-fg-subtle shrink-0" />}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="hidden lg:flex items-center ml-1 shrink-0">
        <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-badge bg-warning-soft text-warning t-caption whitespace-nowrap" title="Entorno de prototipo: todos los datos son ficticios">
          <Icon name="FlaskConical" size={13} /> Prototipo · datos ficticios
        </span>
      </div>

      <div className="flex-1 hidden md:block" />

      <button type="button" onClick={openSearch}
        className="hidden md:flex items-center gap-2 h-8 w-[260px] xl:w-[300px] 2xl:w-[340px] shrink-0 px-2.5 rounded-control border border-line-strong bg-subtle text-fg-muted t-body hv:bg-surface hv:border-fg-muted transition-colors"
        aria-label="Búsqueda global (Ctrl + K)">
        <Icon name="Search" size={16} />
        <span className="flex-1 text-left truncate">Buscar solicitud, caución o cliente</span>
        <kbd className="t-ref text-2xs px-1 rounded-badge border border-line">Ctrl K</kbd>
      </button>
      <IconButton icon="Search" label="Buscar" className="md:hidden" onClick={openSearch} />

      <Dropdown width={360}
        header={
          <div className="px-3 pt-1.5 pb-2 border-b border-line mb-1 flex items-center justify-between">
            <span className="t-sub">Notificaciones</span>
            <button className="t-label text-fg-link hv:underline" onClick={() => setUnread(0)}>Marcar como leídas</button>
          </div>
        }
        items={[
          ...ALERTAS.map((a) => ({ label: a.title, icon: a.severity === "danger" ? "CircleAlert" : a.severity === "warning" ? "TriangleAlert" : "Info", hint: relative(a.when), onSelect: () => a.ref?.startsWith("SOL") ? go("expediente", { id: a.ref }) : a.ref?.startsWith("EMI") ? go("emision") : go("dashboard") })),
          { separator: true },
          { label: `${PENDIENTES.length} tareas asignadas a ti`, icon: "ListChecks", onSelect: () => go("dashboard") },
        ]}
        trigger={(p) => <IconButton {...p} icon="Bell" label={`Notificaciones (${unread} sin leer)`} badge={unread} />}
      />
      <IconButton icon={theme === "dark" ? "Sun" : "Moon"} label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        onClick={() => setThemePref(theme === "dark" ? "light" : "dark")} />
      <IconButton icon="CircleHelp" label="Ayuda y atajos de teclado" className="hidden sm:inline-flex" onClick={() => go("catalogo", { tab: "fundamentos" })} />

      <Dropdown width={248}
        header={
          <div className="px-3 pt-1.5 pb-2.5 border-b border-line mb-1">
            <p className="t-sub">{CURRENT_USER.name}</p>
            <p className="t-help text-fg-muted">{CURRENT_USER.role} · perfil demo</p>
          </div>
        }
        items={[
          { label: "Mi perfil", icon: "UserRound" },
          { label: "Preferencias", icon: "SlidersHorizontal" },
          { separator: true },
          { label: "Tema claro", icon: "Sun", checked: themePref === "light", onSelect: () => setThemePref("light") },
          { label: "Tema oscuro", icon: "Moon", checked: themePref === "dark", onSelect: () => setThemePref("dark") },
          { label: "Según el sistema", icon: "Monitor", checked: themePref === "system", onSelect: () => setThemePref("system") },
          { separator: true },
          { label: "Visual Lab · Design System", icon: "Palette", onSelect: () => go("catalogo") },
          { separator: true },
          { label: "Cerrar sesión", icon: "LogOut", danger: true },
        ]}
        trigger={(p) => (
          <button {...p} type="button" className="flex items-center gap-2 h-[var(--control-h-md)] min-w-[var(--control-h-md)] pl-1 pr-1.5 rounded-control hv:bg-muted" aria-label={`Menú de usuario: ${CURRENT_USER.name}`}>
            <Avatar name={CURRENT_USER.name} size={26} />
            <span className="hidden xl:flex flex-col items-start leading-tight whitespace-nowrap">
              <span className="t-label">{CURRENT_USER.name}</span>
              <span className="text-2xs text-fg-muted">{CURRENT_USER.role}</span>
            </span>
            <Icon name="ChevronDown" size={14} className="text-fg-muted hidden xl:block" />
          </button>
        )}
      />
    </header>
  );
}

/* ============================== AppShell ============================== */
export function AppShell({ crumbs, children }: { crumbs: Crumb[]; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (!(window as any).__CAUCION_EMBED) { try { const v = localStorage.getItem("caucion.sidebar"); if (v) return v === "1"; } catch {} }
    return typeof window !== "undefined" && window.innerWidth < 1200;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = () => setCollapsed((c) => { if (!(window as any).__CAUCION_EMBED) { try { localStorage.setItem("caucion.sidebar", c ? "0" : "1"); } catch {} } return !c; });

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "[" && !e.ctrlKey && !e.metaKey && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") toggle();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="h-full flex overflow-hidden">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-[70] focus:top-2 focus:left-2 focus:px-3 focus:py-2 focus:bg-surface focus:rounded-control focus:shadow-popover">Saltar al contenido</a>
      <Sidebar collapsed={collapsed} onToggle={toggle} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar crumbs={crumbs} onMenu={() => setMobileOpen(true)} />
        <main id="main" tabIndex={-1} className="flex-1 overflow-auto outline-none">{children}</main>
      </div>
    </div>
  );
}

/* ============================== Workspace: PageHeader ============================== */
export function PageHeader({ module, title, description, meta, actions, children, back }: {
  module?: string; title: React.ReactNode; description?: React.ReactNode; meta?: React.ReactNode; actions?: React.ReactNode; children?: React.ReactNode; back?: { label: string; onClick: () => void };
}) {
  return (
    <div className="bg-surface border-b border-line">
      <div className="gutter pt-4 pb-3 flex flex-col gap-3">
        {back && (
          <button onClick={back.onClick} className="self-start -mb-1 min-h-6 inline-flex items-center gap-1 t-label text-fg-muted hv:text-fg">
            <Icon name="ArrowLeft" size={14} /> {back.label}
          </button>
        )}
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
          <div className="flex-1 min-w-[260px]">
            {module && <p className="t-module text-accent-fg mb-1">{module}</p>}
            <h1 className="t-page text-fg">{title}</h1>
            {description && <p className="t-body text-fg-muted mt-1 max-w-[72ch]">{description}</p>}
            {meta && <div className="mt-2">{meta}</div>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("gutter py-5 flex flex-col gap-5", className)}>
      {children}
    </div>
  );
}

/* Estados de pantalla para demostración */
export type DemoState = "ready" | "loading" | "empty" | "error";
export function DemoStateMenu({ value, onChange }: { value: DemoState; onChange: (s: DemoState) => void }) {
  const opts: { id: DemoState; label: string; icon: string }[] = [
    { id: "ready", label: "Con datos", icon: "Table2" },
    { id: "loading", label: "Cargando", icon: "Loader" },
    { id: "empty", label: "Sin resultados", icon: "Inbox" },
    { id: "error", label: "Error de carga", icon: "ServerCrash" },
  ];
  return (
    <Dropdown width={210}
      header={<p className="px-3 pt-1 pb-1.5 t-help text-fg-muted">Simular estado de la pantalla</p>}
      items={opts.map((o) => ({ label: o.label, icon: o.icon, checked: o.id === value, onSelect: () => onChange(o.id) }))}
      trigger={(p) => <Button {...p} variant="quiet" icon="FlaskConical" iconRight="ChevronDown">Estado: {opts.find((o) => o.id === value)!.label}</Button>}
    />
  );
}

export { navItem };
