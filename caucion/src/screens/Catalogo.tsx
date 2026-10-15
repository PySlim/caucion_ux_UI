import React, { useEffect, useRef, useState } from "react";
import { PageHeader, PageBody, Logo } from "../shell/AppShell";
import { useApp } from "../shell/AppContext";
import { Button, IconButton, Input, Textarea, Select, Combobox, DatePicker, Checkbox, Radio, Switch, SearchInput, FileUpload, Field } from "../components/ui/controls";
import { Tabs, StatusBadge, Amount, DescriptionList, Timeline, ActivityLog, InlineAlert, Tag, DataTable, Pagination, SummaryCard, EmptyState, ErrorState, Skeleton, FilterChip, type Column, type Sort } from "../components/ui/data";
import { Modal, Drawer, Dropdown, Tooltip, ToastView, ConfirmDialog, useToast } from "../components/ui/overlays";
import { FilterMenu } from "../components/patterns/FilterMenu";
import { SOLICITUD_STATUS, INSTRUMENT_STATUS, ACTIVITY_STATUS, DOC_STATUS, type StatusDef } from "../domain/status";
import { TOKENS } from "../tokens/generated/tokens";
import { contrast } from "../lib/contrast";
import { TOMADORES, HISTORIAL_0147, COMPARACION_0147 } from "../data/mock";
import { Icon } from "../lib/icon";
import { cn } from "../lib/cn";
import { ThemeComparison, ContrastReport, ResponsivePreview, ComponentStatus } from "./VisualLab";

const SECTIONS = [
  { id: "identidad", label: "Identidad", group: "Design System V1.2" },
  { id: "paleta", label: "Paleta Corporate Refined", group: "Fundamentos" },
  { id: "tokens", label: "Tokens", group: "Fundamentos" },
  { id: "tipografia", label: "Tipografía", group: "Fundamentos" },
  { id: "forma", label: "Radios, sombras y espaciado", group: "Fundamentos" },
  { id: "iconografia", label: "Iconografía", group: "Fundamentos" },
  { id: "fundamentos", label: "Foco, teclado y breakpoints", group: "Fundamentos" },
  { id: "controles", label: "Controles", group: "Componentes" },
  { id: "datos", label: "Datos", group: "Componentes" },
  { id: "interacciones", label: "Interacciones", group: "Componentes" },
  { id: "temas", label: "Claro y oscuro", group: "Componentes" },
  { id: "estado", label: "Estado de componentes", group: "Componentes" },
  { id: "patrones", label: "Patrones de negocio", group: "Componentes" },
  { id: "responsive", label: "Vista previa responsiva", group: "Validación" },
  { id: "decisiones", label: "Decisiones y pendientes", group: "Validación" },
];

export function Catalogo() {
  const { routeParam } = useApp();
  const [active, setActive] = useState(SECTIONS[0].id);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { if (routeParam) setTimeout(() => jump(routeParam), 50); }, [routeParam]);
  useEffect(() => {
    const scroller = document.getElementById("main");
    if (!scroller) return;
    const h = () => {
      const top = scroller.getBoundingClientRect().top + 90;
      let cur = SECTIONS[0].id;
      for (const s of SECTIONS) { const el = document.getElementById(`ds-${s.id}`); if (el && el.getBoundingClientRect().top <= top) cur = s.id; }
      setActive(cur);
    };
    scroller.addEventListener("scroll", h, { passive: true });
    return () => scroller.removeEventListener("scroll", h);
  }, []);
  const jump = (id: string) => { document.getElementById(`ds-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); setActive(id); };

  let lastGroup = "";
  return (
    <>
      <PageHeader module="Sistema · Catálogo interno" title="Visual Lab · CAUCIÓN Design System V1.2"
        description="Referencia oficial de la identidad Corporate Refined: tokens, tipografía, formas, componentes con sus estados reales, temas claro y oscuro y comportamiento responsivo. Herramienta interna de desarrollo."
        actions={<Tag tone="accent" icon="BadgeCheck">Corporate Refined · identidad oficial</Tag>} />
      <PageBody>
        <div className="lg:hidden flex flex-col gap-1.5">
          <label htmlFor="ds-jump" className="t-label">Ir a la sección</label>
          <select id="ds-jump" value={active} onChange={(e) => jump(e.target.value)}
            className="h-[var(--control-h-md)] w-full rounded-control border border-line-strong bg-surface text-fg px-2.5 text-base">
            {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.group} · {s.label}</option>)}
          </select>
        </div>
        <div className="flex gap-8 items-start">
          <nav aria-label="Secciones del Visual Lab" className="hidden lg:block w-[220px] shrink-0 sticky top-4">
            <ul className="flex flex-col gap-px">
              {SECTIONS.map((s) => {
                const head = s.group !== lastGroup ? ((lastGroup = s.group), true) : false;
                return (
                  <React.Fragment key={s.id}>
                    {head && <li className="t-module text-fg-muted px-2 pt-3 pb-1 first:pt-0">{s.group}</li>}
                    <li>
                      <button onClick={() => jump(s.id)} aria-current={active === s.id ? "true" : undefined}
                        className={cn("w-full text-left min-h-[var(--control-h-sm)] px-2 rounded-control t-label border-l-2", active === s.id ? "border-action bg-surface text-fg shadow-card" : "border-transparent text-fg-muted hv:text-fg hv:bg-muted")}>
                        {s.label}
                      </button>
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>
          </nav>
          <div ref={root} className="flex-1 min-w-0 flex flex-col gap-10">
            <Identidad />
            <Paleta />
            <Tokens />
            <Tipografia />
            <Forma />
            <Iconografia />
            <FocoBreakpoints />
            <Controles />
            <Datos />
            <Interacciones />
            <Section id="temas" eyebrow="Componentes" title="Claro y oscuro"
              intro="Los mismos componentes con el tema claro y el oscuro, uno junto al otro. El tema activo de la aplicación se cambia desde el topbar o el menú de usuario; sin preferencia guardada se sigue la configuración del sistema.">
              <ThemeComparison />
              <ContrastReport />
            </Section>
            <Section id="estado" eyebrow="Componentes" title="Estado de componentes"
              intro="Variantes y estados realmente implementados en el código. Un componente con pendientes no se declara completo.">
              <ComponentStatus />
            </Section>
            <Patrones />
            <Section id="responsive" eyebrow="Validación" title="Vista previa responsiva"
              intro="La aplicación completa dentro de un iframe con el ancho real de cada dispositivo: el diseño se calcula a ese ancho; sólo se reduce la escala para que quepa en pantalla.">
              <ResponsivePreview />
            </Section>
            <Decisiones />
          </div>
        </div>
      </PageBody>
    </>
  );
}

/* ---------- helpers ---------- */
function Section({ id, eyebrow, title, intro, children }: { id: string; eyebrow: string; title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={`ds-${id}`} className="scroll-mt-4 flex flex-col gap-4" aria-labelledby={`ds-${id}-h`}>
      <header className="border-b border-line pb-3">
        <p className="t-module text-accent-fg">{eyebrow}</p>
        <h2 id={`ds-${id}-h`} className="text-xl font-semibold mt-0.5">{title}</h2>
        {intro && <p className="t-body text-fg-muted mt-1 max-w-[80ch]">{intro}</p>}
      </header>
      {children}
    </section>
  );
}
function Spec({ title, desc, children, className, flush }: { title: string; desc?: string; children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <div className={cn("bg-surface border border-line rounded-card shadow-card min-w-0", className)}>
      <div className="px-4 py-2.5 border-b border-line flex flex-wrap items-baseline gap-x-3">
        <h3 className="t-sub">{title}</h3>
        {desc && <p className="t-help text-fg-muted">{desc}</p>}
      </div>
      <div className={cn(!flush && "p-4")}>{children}</div>
    </div>
  );
}
function StateRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[96px_1fr] items-center gap-x-4 gap-y-1.5 py-2 border-b border-line last:border-0">
      <span className="t-help text-fg-muted font-medium">{label}</span>
      <div className="flex flex-wrap items-center gap-3 min-w-0">{children}</div>
    </div>
  );
}
function Code({ children }: { children: string }) {
  return <pre className="t-ref text-xs leading-5 bg-muted border border-line rounded-control p-3 overflow-x-auto whitespace-pre">{children}</pre>;
}
function Swatch({ color, className }: { color: string; className?: string }) {
  return <span className={cn("inline-block rounded-badge border border-line shrink-0", className)} style={{ background: color }} aria-hidden="true" />;
}

/* ---------- Identidad ---------- */
function Identidad() {
  const P = [
    { i: "Landmark", t: "Confianza institucional", d: "Azul marino como ancla de identidad y navegación; superficies claras y bordes finos." },
    { i: "Scale", t: "Solidez y precisión", d: "Cifras tabulares alineadas, código de moneda separado, referencias en monoespaciada." },
    { i: "Compass", t: "Claridad", d: "Breadcrumb, eyebrow de módulo y título responden: dónde estoy, qué consulto, qué puedo hacer." },
    { i: "Tags", t: "Estados inequívocos", d: "Cuatro vocabularios de estado diferenciados por forma, icono y color." },
    { i: "Rows3", t: "Densidad equilibrada", d: "Controles de 36 px, filas de 48 px y paneles de 20 px: cómodo sin desperdiciar pantalla." },
    { i: "Fingerprint", t: "Trazabilidad", d: "Toda decisión pide fundamento y queda registrada con usuario, fecha y hora." },
  ];
  const brand: [string, string, string][] = [
    ["Primary", TOKENS.primitive.color["navy-900"], "Identidad y navegación"],
    ["Action", TOKENS.primitive.color["blue-600"], "Acciones principales"],
    ["Accent", TOKENS.primitive.color["teal-600"], "Acento no textual"],
    ["Background", TOKENS.primitive.color["slate-50"], "Fondo general"],
  ];
  return (
    <Section id="identidad" eyebrow="Design System V1.2" title="Corporate Refined"
      intro="Identidad única y aprobada de CAUCIÓN. Sobria, institucional y precisa: el azul marino ancla la identidad, el azul de acción se reserva para lo que el usuario puede hacer y el turquesa marca la ubicación activa. Radio base de 8 px, densidad equilibrada y sombras discretas.">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="bg-nav rounded-card p-5 flex flex-col gap-6 text-fg-on-nav on-nav">
          <div className="flex items-center gap-3"><Logo size={40} /><div><p className="t-wordmark text-lg">CAUCIÓN</p><p className="t-help text-fg-on-nav-muted">Monograma provisional · sello de garantía</p></div></div>
          <div className="flex flex-col gap-1.5">
            {brand.map(([n, c, u]) => (
              <div key={n} className="flex items-center gap-2"><Swatch color={c} className="h-5 w-10 border-line-nav" /><span className="t-help text-fg-on-nav-muted flex-1">{n} · {u}</span><span className="t-ref text-2xs">{c}</span></div>
            ))}
          </div>
          <p className="t-help text-fg-on-nav-muted">IBM Plex Sans para interfaz · IBM Plex Mono para referencias. Respaldo: Segoe UI, system-ui, Arial.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
          {P.map((p) => (
            <div key={p.t} className="bg-surface border border-line rounded-card p-4 flex flex-col gap-1.5">
              <Icon name={p.i} size={18} className="text-accent-fg" />
              <p className="t-sub">{p.t}</p>
              <p className="t-body text-fg-muted">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------- Paleta ---------- */
const FAMILY_LABEL: Record<string, string> = { navy: "Navy · Primary", ink: "Ink · superficies oscuras", blue: "Blue · Action", teal: "Teal · Accent", slate: "Slate · neutros claros", green: "Green · éxito", amber: "Amber · advertencia", red: "Red · error", violet: "Violet · decisión" };
function Paleta() {
  const fams: Record<string, [string, string][]> = {};
  for (const [k, v] of Object.entries(TOKENS.primitive.color)) { const [f, s] = k.split("-"); (fams[f] ??= []).push([s, v as string]); }
  return (
    <Section id="paleta" eyebrow="Fundamentos" title="Paleta Corporate Refined"
      intro="Capa primitiva: valores concretos agrupados por familia. Los componentes nunca los usan directamente; pasan por los tokens semánticos de cada tema.">
      <InlineAlert tone="info" title="Ajuste por contraste en Text Secondary">
        La paleta aprobada define Text Secondary #64748B. Sobre el fondo #F3F6FA da 4.39:1 y no cumple WCAG 2.2 AA (4.5:1), así que el texto secundario usa #5B6B80 (5.02:1). #64748B se conserva como primitivo (slate-500). El turquesa #0D9488 se usa sólo en elementos no textuales; el texto de acento usa #0F766E.
      </InlineAlert>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(fams).map(([f, shades]) => (
          <Spec key={f} title={FAMILY_LABEL[f] ?? f} flush>
            <ul className="divide-y divide-line">
              {shades.map(([s, v]) => (
                <li key={s} className="flex items-center gap-3 px-4 py-1.5">
                  <Swatch color={v} className="h-6 w-10" />
                  <span className="t-ref flex-1">--p-color-{f}-{s}</span>
                  <span className="t-ref text-fg-muted">{v}</span>
                </li>
              ))}
            </ul>
          </Spec>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Tokens ---------- */
function Tokens() {
  const [layer, setLayer] = useState("semantic");
  const sem = Object.entries(TOKENS.semantic) as [keyof typeof TOKENS.theme.light, string][];
  const isColor = (v: string) => /^#|^rgb/.test(v);
  return (
    <Section id="tokens" eyebrow="Fundamentos" title="Tokens"
      intro="Fuente única: src/tokens/tokens.json. scripts/build-tokens.mjs genera tokens.css (variables CSS) y tokens.ts (valores para documentación y pruebas), por lo que ambos están siempre sincronizados.">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { t: "1 · Primitivos", d: "Valores: colores, radios, espaciado, tipografía.", c: "--p-color-navy-900", n: Object.keys(TOKENS.primitive.color).length + Object.keys(TOKENS.primitive.radius).length + Object.keys(TOKENS.primitive.space).length },
          { t: "2 · Semánticos", d: "Roles que consumen los componentes.", c: "--bg-surface, --action", n: sem.length },
          { t: "3 · Componente", d: "Decisiones por componente: radios, sombras, medidas.", c: "--radius-control", n: Object.keys(TOKENS.component).length },
          { t: "4 · Tema", d: "Valor de cada semántico en claro y oscuro.", c: '[data-caucion-theme="dark"]', n: 2 },
        ].map((l) => (
          <div key={l.t} className="bg-surface border border-line rounded-card p-4 flex flex-col gap-1">
            <p className="t-sub">{l.t}</p>
            <p className="t-help text-fg-muted">{l.d}</p>
            <p className="t-ref text-fg-link mt-1">{l.c}</p>
            <p className="t-caption text-fg-muted tnum">{l.n} {l.t.startsWith("4") ? "temas" : "tokens"}</p>
          </div>
        ))}
      </div>
      <Tabs ariaLabel="Capa de tokens" value={layer} onChange={setLayer}
        tabs={[{ id: "semantic", label: "Semánticos por tema", count: sem.length }, { id: "component", label: "Componente", count: Object.keys(TOKENS.component).length }, { id: "density", label: "Densidad" }]} />
      {layer === "semantic" && (
        <Spec title="Semánticos y su valor por tema" flush>
          <div className="overflow-x-auto">
            <table className="w-full t-table min-w-[720px]">
              <thead><tr className="text-left text-fg-muted bg-subtle"><th className="font-medium h-9 pl-4 pr-3">Token</th><th className="font-medium px-3">Uso</th><th className="font-medium px-3">Claro</th><th className="font-medium px-3 pr-4">Oscuro</th></tr></thead>
              <tbody>
                {sem.map(([k, use]) => {
                  const l = TOKENS.theme.light[k] as string, d = TOKENS.theme.dark[k] as string;
                  return (
                    <tr key={k} className="border-t border-line align-top">
                      <td className="pl-4 pr-3 py-2 t-ref whitespace-nowrap">--{k}</td>
                      <td className="px-3 py-2 text-fg-muted">{use}</td>
                      {[l, d].map((v, i) => (
                        <td key={i} className={cn("px-3 py-2", i === 1 && "pr-4")}>
                          <span className="inline-flex items-center gap-2 whitespace-nowrap">{isColor(v) && <Swatch color={v} className="h-4 w-6" />}<span className="t-ref">{v}</span></span>
                          <span className="block t-help text-fg-subtle t-ref">{String((i === 0 ? TOKENS.themeRefs.light : TOKENS.themeRefs.dark)[k]).replace(/[{}]/g, "")}</span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Spec>
      )}
      {layer === "component" && (
        <Spec title="Tokens de componente" flush>
          <div className="overflow-x-auto">
            <table className="w-full t-table min-w-[560px]">
              <thead><tr className="text-left text-fg-muted bg-subtle"><th className="font-medium h-9 pl-4 pr-3">Token</th><th className="font-medium px-3">Valor</th><th className="font-medium px-3 pr-4">Uso</th></tr></thead>
              <tbody>
                {Object.entries(TOKENS.component).map(([k, c]) => (
                  <tr key={k} className="border-t border-line align-top">
                    <td className="pl-4 pr-3 py-2 t-ref whitespace-nowrap">--{k}</td>
                    <td className="px-3 py-2 t-ref max-w-[340px] break-words">{c.value}{c.ref !== c.value && <span className="block t-help text-fg-subtle">{String(c.ref).replace(/[{}]/g, "")}</span>}</td>
                    <td className="px-3 pr-4 py-2 text-fg-muted">{c.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Spec>
      )}
      {layer === "density" && (
        <Spec title="Densidad" desc="Balanced es la oficial; Compact queda definida para el futuro; Touch se aplica bajo 768 px" flush>
          <div className="overflow-x-auto">
            <table className="w-full t-table min-w-[520px]">
              <thead><tr className="text-left text-fg-muted bg-subtle"><th className="font-medium h-9 pl-4 pr-3">Token</th><th className="font-medium px-3 text-right">Balanced</th><th className="font-medium px-3 text-right">Compact</th><th className="font-medium px-3 pr-4 text-right">Touch</th></tr></thead>
              <tbody>
                {Object.keys(TOKENS.density.balanced).map((k) => (
                  <tr key={k} className="border-t border-line">
                    <td className="pl-4 pr-3 py-2 t-ref">--{k}</td>
                    <td className="px-3 py-2 t-ref text-right font-medium">{(TOKENS.density.balanced as Record<string, string>)[k]}</td>
                    <td className="px-3 py-2 t-ref text-right text-fg-muted">{(TOKENS.density.compact as Record<string, string>)[k]}</td>
                    <td className="px-3 pr-4 py-2 t-ref text-right text-fg-muted">{(TOKENS.density.touch as Record<string, string>)[k] ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Spec>
      )}
      <Spec title="Cómo se consumen">
        <Code>{`/* Capa 1 · primitivo */            --p-color-navy-900: #142B49;
/* Capa 4 · tema → Capa 2 */        [data-caucion-theme="dark"] { --bg-nav: var(--p-color-ink-950); }
/* Capa 3 · componente */           --radius-control: var(--p-radius-md);   /* 8 px */
/* Tailwind (sólo roles) */         className="bg-surface text-fg rounded-control shadow-card"`}</Code>
      </Spec>
    </Section>
  );
}

/* ---------- Tipografía ---------- */
const TYPE_SAMPLE: Record<string, string> = {
  module: "Operación · Gestión comercial", page: "Bandeja de solicitudes", section: "Información económica", sub: "Tareas pendientes",
  body: "Ejecución de obra de mejoramiento vial — tramo ficticio", label: "Suma asegurada", table: "Constructora Ejemplo Andina S.A.C.",
  help: "Importe máximo garantizado. Se muestra con 2 decimales.", caption: "Vence hoy", "amount-lg": "4,860,250.00", amount: "12,400,000.00", ref: "SOL-2026-0147 · CAU-2026-004812",
};
const px = (rem: string) => (rem.endsWith("rem") ? `${Math.round(parseFloat(rem) * 16 * 10) / 10}px` : rem);
function Tipografia() {
  return (
    <Section id="tipografia" eyebrow="Fundamentos" title="Tipografía"
      intro="IBM Plex Sans (se mantiene la de V1): proporciones estrechas, buena legibilidad en 13–14 px y cifras tabulares nativas. IBM Plex Mono para números de solicitud, caución y referencias. Tamaños en rem: respetan el tamaño de texto y el zoom del navegador.">
      <Spec title="Escala por roles" desc="Fuente: tokens.json → typography" flush>
        <ul>
          {Object.entries(TOKENS.typography).map(([k, t]) => (
            <li key={k} className="grid grid-cols-1 md:grid-cols-[180px_1fr_230px] gap-x-6 gap-y-1 items-baseline px-4 py-3 border-b border-line last:border-0">
              <span className="t-label text-fg-muted">{t.use}</span>
              <span className={cn(`t-${k}`, "text-fg min-w-0 break-words")}>{TYPE_SAMPLE[k]}</span>
              <span className="t-ref text-2xs text-fg-muted">.t-{k} · {px(t.size)}/{px(t.leading)} · {t.weight}{t.mobileSize ? ` · móvil ${px(t.mobileSize)}` : ""}</span>
            </li>
          ))}
        </ul>
      </Spec>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Spec title="Alineación de cifras" desc="tabular-nums + alineación a la derecha">
          <div className="overflow-x-auto"><table className="w-full t-table">
            <thead><tr className="text-fg-muted"><th className="text-left font-medium pb-2">Proporcional (evitar)</th><th className="text-right font-medium pb-2">Tabular (usar)</th></tr></thead>
            <tbody>
              {[1111111.11, 48000000, 904550.5, 12400000].map((n) => (
                <tr key={n} className="border-t border-line">
                  <td className="py-1.5" style={{ fontVariantNumeric: "proportional-nums" }}>{n.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td className="py-1.5 text-right"><Amount value={n} currency="PEN" /></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Spec>
        <Spec title="Formatos de datos financieros" desc="Supuesto: locale es-PE">
          <DescriptionList columns={2} items={[
            { label: "Importe en tabla", value: <Amount value={4860250} currency="PEN" /> },
            { label: "Importe destacado", value: <Amount value={4860250} currency="PEN" size="lg" /> },
            { label: "Con símbolo", value: <Amount value={350000} currency="USD" symbol /> },
            { label: "Fecha", value: <span className="tnum">02/11/2026</span> },
            { label: "Rango de vigencia", value: <span className="tnum">02/11/2026 – 01/11/2027</span> },
            { label: "Fecha y hora", value: <span className="tnum">15/10/2026 10:41</span> },
            { label: "Porcentaje", value: <span className="tnum">1.15 %</span> },
            { label: "Referencia", value: <span className="t-ref">CAU-2026-004812</span> },
          ]} />
        </Spec>
      </div>
    </Section>
  );
}

/* ---------- Forma ---------- */
function Forma() {
  const roles = Object.entries(TOKENS.component).filter(([k]) => k.startsWith("radius-"));
  const shadows = Object.entries(TOKENS.component).filter(([k]) => k.startsWith("shadow-"));
  return (
    <Section id="forma" eyebrow="Fundamentos" title="Radios, sombras y espaciado"
      intro="Radio base de 8 px para controles y tarjetas; 12 px para lo que flota; 4 px para badges. Bordes de 1 px y tres niveles de sombra discreta. Retícula de 4 px.">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Spec title="Escala de radios" desc="Primitivos">
          <ul className="grid grid-cols-1 gap-3">
            {Object.entries(TOKENS.primitive.radius).filter(([k]) => k !== "none").map(([k, v]) => (
              <li key={k} className="flex items-center gap-3">
                <span className={cn("h-10 w-16 bg-muted border border-line-strong shrink-0", k === "md" && "border-action border-2")} style={{ borderRadius: v === "9999px" ? 20 : v }} />
                <span className="t-label">{k} · <span className="t-ref">{v === "9999px" ? "full" : v}</span>{k === "md" && <span className="t-help text-action-fg"> · base</span>}</span>
              </li>
            ))}
          </ul>
        </Spec>
        <Spec title="Radios por rol" desc="Tokens de componente">
          <ul className="flex flex-col gap-3">
            {roles.map(([k, c]) => (
              <li key={k} className="flex items-center gap-3">
                <span className="h-9 w-14 bg-surface border border-line-strong shrink-0" style={{ borderRadius: `var(--${k})` }} />
                <span className="min-w-0"><span className="t-ref block">--{k} · {c.value}</span><span className="t-help text-fg-muted">{c.use}</span></span>
              </li>
            ))}
          </ul>
        </Spec>
        <Spec title="Elevación" desc="Discreta; más opaca en oscuro">
          <ul className="grid grid-cols-1 gap-4 bg-canvas p-3 rounded-control">
            {shadows.map(([k, c]) => (
              <li key={k} className="bg-surface rounded-card p-3 border border-line" style={{ boxShadow: `var(--${k})` }}>
                <p className="t-ref">--{k}</p><p className="t-help text-fg-muted">{c.use}</p>
              </li>
            ))}
          </ul>
        </Spec>
      </div>
      <Spec title="Espaciado" desc="Base 4 px">
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
          {Object.entries(TOKENS.primitive.space).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(([k, v]) => (
            <li key={k} className="grid grid-cols-[80px_44px_minmax(0,1fr)] items-center gap-3">
              <span className="t-ref text-fg-muted">space-{k}</span>
              <span className="t-ref text-right">{v}</span>
              <span className="h-3 max-w-full bg-action-soft border border-action/40 rounded-badge" style={{ width: Math.max(1, parseFloat(v) * 3) }} />
            </li>
          ))}
        </ul>
      </Spec>
    </Section>
  );
}

/* ---------- Iconografía ---------- */
function Iconografia() {
  const ICONS = ["Inbox", "FileStack", "ShieldCheck", "FilePen", "ScanSearch", "Gauge", "Landmark", "Network", "Building2", "Stamp", "History", "ChartColumn", "Gavel", "Undo2", "Paperclip", "Lock", "CircleCheck", "CircleAlert", "TriangleAlert", "Info", "Search", "Download", "Upload", "Plus", "Ellipsis", "Calendar", "Bell", "Sun", "Moon", "Monitor"];
  return (
    <Section id="iconografia" eyebrow="Fundamentos" title="Iconografía" intro="Lucide, empaquetado localmente (sin CDN). Trazo 1.75 en 16 px y 2 en 12–14 px. El icono acompaña a una etiqueta; un icono solo exige aria-label y tooltip. Tamaños: 14 en línea, 16 en controles, 18 en navegación, 20 en estados vacíos.">
      <Spec title="Set base" flush>
        <ul className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-10">
          {ICONS.map((i) => (
            <li key={i} className="flex flex-col items-center gap-1.5 py-3 border-b border-r border-line">
              <Icon name={i} size={20} />
              <span className="text-2xs text-fg-muted t-ref truncate max-w-full px-1">{i}</span>
            </li>
          ))}
        </ul>
      </Spec>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Spec title="Correcto: icono + etiqueta"><div className="flex flex-wrap gap-2"><Button icon="Download">Exportar</Button><Button icon="Gavel" variant="primary">Registrar decisión</Button></div></Spec>
        <Spec title="Icono solo: con tooltip y nombre accesible"><div className="flex gap-2 items-center pb-8"><Tooltip content="Notificaciones (4 sin leer)" forceOpen side="bottom" align="start"><IconButton icon="Bell" label="Notificaciones" badge={4} /></Tooltip></div></Spec>
      </div>
    </Section>
  );
}

/* ---------- Foco y breakpoints ---------- */
const BREAKPOINTS = [
  { name: "< 768", behavior: "Sidebar como drawer modal; controles táctiles de 40–44 px; bandeja en tarjetas; modales a pantalla completa." },
  { name: "md 768", behavior: "Sidebar colapsado (64 px) con tooltips; formularios a 2 columnas donde caben." },
  { name: "lg 1024", behavior: "Bandeja en tabla; navegación del Visual Lab visible." },
  { name: "1200", behavior: "Sidebar expandido por defecto (se recuerda la elección del usuario)." },
  { name: "xl 1280", behavior: "Escritorio: riel contextual del expediente a la derecha; tabla con columnas integradas." },
  { name: "2xl 1440", behavior: "Escritorio amplio: todas las columnas de la bandeja visibles." },
];
function FocoBreakpoints() {
  return (
    <Section id="fundamentos" eyebrow="Fundamentos" title="Foco, teclado y breakpoints" intro="Foco visible de 2 px con separación de 2 px en el color de foco del tema; blanco sobre la navegación. Todo es operable con teclado. El diseño es fluido: los breakpoints sólo cambian la disposición.">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Spec title="Estados de foco">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3 items-center"><Button state="focus">Botón</Button><IconButton icon="Ellipsis" label="Más" state="focus" variant="secondary" /><Checkbox state="focus" label="Checkbox" defaultChecked /></div>
            <Input state="focus" placeholder="Input con foco" />
            <div className="bg-nav rounded-control p-3 on-nav"><button className="is-focus px-2 h-[var(--control-h-sm)] rounded-control text-fg-on-nav t-label" style={{ outlineColor: "var(--fg-on-nav)" }}>Ítem de navegación</button></div>
          </div>
        </Spec>
        <Spec title="Atajos de teclado" flush>
          <ul className="divide-y divide-line">
            {[["Ctrl K", "Búsqueda global"], ["[", "Contraer / expandir navegación"], ["↑ ↓ Inicio Fin", "Moverse en navegación, menús y combobox"], ["← →", "Cambiar de pestaña"], ["Esc", "Cerrar modal, drawer, menú o navegación móvil"], ["Tab / Shift Tab", "Foco atrapado dentro de diálogos"]].map(([k, d]) => (
              <li key={k} className="px-4 py-2 flex justify-between gap-3 t-body"><span>{d}</span><kbd className="t-ref text-2xs px-1.5 rounded-badge border border-line bg-subtle whitespace-nowrap">{k}</kbd></li>
            ))}
          </ul>
        </Spec>
        <Spec title="Puntos de adaptación" flush>
          <ul className="divide-y divide-line">
            {BREAKPOINTS.map((b) => (
              <li key={b.name} className="px-4 py-2 grid grid-cols-[72px_1fr] gap-3"><span className="t-ref">{b.name}</span><span className="t-help text-fg-muted">{b.behavior}</span></li>
            ))}
          </ul>
        </Spec>
      </div>
    </Section>
  );
}

/* ---------- Controles ---------- */
function Controles() {
  const [combo, setCombo] = useState<string | null>("t01");
  const [d, setD] = useState("2026-11-02");
  const [sw, setSw] = useState(true);
  const [q, setQ] = useState("SOL-2026");
  const [txt, setTxt] = useState("Se requiere flujo de caja proyectado a 12 meses.");
  return (
    <Section id="controles" eyebrow="Componentes" title="Controles" intro="Altura por defecto 32 px (md), 28 px para barras densas (sm) y 40 px para acciones táctiles o de alto énfasis (lg). Los estados hover y foco se muestran forzados para revisión.">
      <Spec title="Button" desc="primary · secondary · tertiary · danger · quiet">
        {(["primary", "secondary", "tertiary", "danger", "quiet"] as const).map((v) => (
          <StateRow key={v} label={v}>
            <Button variant={v}>Default</Button>
            <Button variant={v} state="hover">Hover</Button>
            <Button variant={v} state="focus">Focus</Button>
            <Button variant={v} disabled>Disabled</Button>
            <Button variant={v} loading>Guardando</Button>
            <Button variant={v} icon="Plus">Con icono</Button>
          </StateRow>
        ))}
        <StateRow label="Tamaños"><Button size="sm" variant="primary">Small 28</Button><Button size="md" variant="primary">Medium 32</Button><Button size="lg" variant="primary">Large 40</Button></StateRow>
      </Spec>
      <Spec title="Icon Button" desc="Siempre con aria-label y tooltip">
        {(["quiet", "secondary", "primary", "danger"] as const).map((v) => (
          <StateRow key={v} label={v}>
            <IconButton variant={v} icon="Pencil" label="Editar" />
            <IconButton variant={v} icon="Pencil" label="Editar" state="hover" />
            <IconButton variant={v} icon="Pencil" label="Editar" state="focus" />
            <IconButton variant={v} icon="Pencil" label="Editar" disabled />
            <IconButton variant={v} icon="Pencil" label="Editar" loading />
          </StateRow>
        ))}
        <StateRow label="Con contador"><IconButton icon="Bell" label="Notificaciones" badge={4} /><IconButton icon="Bell" label="Notificaciones" badge={12} /></StateRow>
      </Spec>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Spec title="Input">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Default" htmlFor="c-i1" help="Texto de ayuda"><Input id="c-i1" placeholder="Placeholder" /></Field>
            <Field label="Hover" htmlFor="c-i2"><Input id="c-i2" state="hover" defaultValue="Constructora Ejemplo" /></Field>
            <Field label="Focus" htmlFor="c-i3"><Input id="c-i3" state="focus" defaultValue="LP-DEMO-0042" /></Field>
            <Field label="Disabled" htmlFor="c-i4"><Input id="c-i4" disabled defaultValue="No editable" /></Field>
            <Field label="Error" htmlFor="c-i5" required error="Usa sólo números, con punto para decimales."><Input id="c-i5" status="error" defaultValue="4.860.250,00" /></Field>
            <Field label="Success" htmlFor="c-i6" success="Validado contra EEFF 2025"><Input id="c-i6" status="success" prefix="S/" numeric defaultValue="38,450,000.00" /></Field>
            <Field label="Loading" htmlFor="c-i7"><Input id="c-i7" loading defaultValue="Consultando ID…" /></Field>
            <Field label="Read-only" htmlFor="c-i8"><Input id="c-i8" readOnly defaultValue="SOL-2026-0147" className="t-ref" /></Field>
            <Field label="Monto con prefijo" htmlFor="c-i9"><Input id="c-i9" prefix="US$" numeric placeholder="0.00" /></Field>
            <Field label="Con sufijo" htmlFor="c-i10"><Input id="c-i10" numeric defaultValue="365" suffix={<span className="t-help">días</span>} /></Field>
          </div>
        </Spec>
        <div className="flex flex-col gap-4">
          <Spec title="Textarea">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Con contador" htmlFor="c-t1"><Textarea id="c-t1" maxLength={120} showCount value={txt} onChange={(e) => setTxt(e.target.value)} /></Field>
              <Field label="Error" htmlFor="c-t2" error="Escribe al menos 10 caracteres."><Textarea id="c-t2" status="error" defaultValue="Ok" /></Field>
            </div>
          </Spec>
          <Spec title="Select (nativo)">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Default" htmlFor="c-s1"><Select id="c-s1" placeholder="Selecciona…" options={[{ value: "a", label: "Fiel cumplimiento" }]} /></Field>
              <Field label="Error" htmlFor="c-s2" error="Requerido"><Select id="c-s2" status="error" placeholder="Selecciona…" options={[]} /></Field>
              <Field label="Disabled" htmlFor="c-s3"><Select id="c-s3" disabled options={[{ value: "a", label: "PEN" }]} /></Field>
            </div>
          </Spec>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Spec title="Combobox" desc="Búsqueda + teclado (↑ ↓ Enter Esc)">
          <div className="flex flex-col gap-4">
            <Field label="Tomador" htmlFor="c-cb1"><Combobox id="c-cb1" value={combo} onChange={setCombo} options={TOMADORES.map((t) => ({ value: t.id, label: t.name, meta: t.doc }))} /></Field>
            <Field label="Error" htmlFor="c-cb2" error="Selecciona un tomador."><Combobox id="c-cb2" value={null} onChange={() => {}} options={[]} status="error" /></Field>
            <Field label="Disabled" htmlFor="c-cb3"><Combobox id="c-cb3" value={null} onChange={() => {}} options={[]} disabled /></Field>
          </div>
        </Spec>
        <Spec title="Date Picker" desc="Entrada manual dd/mm/aaaa o calendario">
          <div className="flex flex-col gap-4">
            <Field label="Inicio de vigencia" htmlFor="c-dp1"><DatePicker id="c-dp1" value={d} onChange={setD} /></Field>
            <Field label="Error" htmlFor="c-dp2" error="La fecha de fin debe ser posterior al inicio."><DatePicker id="c-dp2" value="2026-10-01" onChange={() => {}} status="error" /></Field>
            <Field label="Disabled" htmlFor="c-dp3"><DatePicker id="c-dp3" value="" onChange={() => {}} disabled /></Field>
          </div>
        </Spec>
        <Spec title="Search">
          <div className="flex flex-col gap-4">
            <SearchInput value="" onChange={() => {}} placeholder="Buscar solicitud" shortcut="Ctrl K" />
            <SearchInput value={q} onChange={setQ} placeholder="Buscar" />
            <SearchInput value="Constructora" onChange={() => {}} loading placeholder="Buscar" />
          </div>
        </Spec>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Spec title="Checkbox">
          <div className="flex flex-col gap-2.5">
            <Checkbox label="Default" /><Checkbox label="Checked" defaultChecked /><Checkbox label="Indeterminate" indeterminate /><Checkbox label="Hover" state="hover" />
            <Checkbox label="Focus" state="focus" /><Checkbox label="Disabled" disabled /><Checkbox label="Disabled checked" disabled defaultChecked /><Checkbox label="Error" invalid description="Confirma la declaración." />
          </div>
        </Spec>
        <Spec title="Radio">
          <div className="flex flex-col gap-2.5">
            <Radio name="r-demo" label="Default" /><Radio name="r-demo" label="Checked" defaultChecked /><Radio name="r-x" label="Hover" state="hover" /><Radio name="r-y" label="Focus" state="focus" />
            <Radio name="r-z" label="Disabled" disabled /><Radio name="r-w" label="Disabled checked" disabled defaultChecked /><Radio name="r-v" label="Error" invalid />
          </div>
        </Spec>
        <Spec title="Switch">
          <div className="flex flex-col gap-3">
            <Switch checked={sw} onChange={setSw} label="Interactivo" description="Notificarme por correo" />
            <Switch checked={false} label="Off" /><Switch checked label="On" /><Switch checked state="focus" label="Focus" />
            <Switch checked={false} disabled label="Disabled" /><Switch checked loading label="Guardando preferencia" />
          </div>
        </Spec>
      </div>
      <Spec title="File Upload" desc="Arrastrar, validar formato y tamaño, progreso, error">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div><p className="t-help text-fg-muted mb-1.5">Default (interactivo)</p><FileUpload /></div>
          <div><p className="t-help text-fg-muted mb-1.5">Compacto</p><FileUpload compact /></div>
          <div><p className="t-help text-fg-muted mb-1.5">Disabled</p><FileUpload compact disabled /></div>
        </div>
      </Spec>
    </Section>
  );
}

/* ---------- Datos ---------- */
type Row = { id: string; ref: string; name: string; monto: number; st: keyof typeof SOLICITUD_STATUS };
function Datos() {
  const [sort, setSort] = useState<Sort>({ id: "monto", dir: "desc" });
  const [sel, setSel] = useState<Set<string>>(new Set(["2"]));
  const [tab, setTab] = useState("a");
  const [page, setPage] = useState(3);
  const [fv, setFv] = useState<string[]>(["observada"]);
  const base: Row[] = [
    { id: "1", ref: "SOL-2026-0151", name: "Energía Demo Renovable S.A.C.", monto: 2480000, st: "aprobacion" },
    { id: "2", ref: "SOL-2026-0147", name: "Constructora Ejemplo Andina S.A.C.", monto: 4860250, st: "observada" },
    { id: "3", ref: "SOL-2026-0139", name: "Ingeniería Ficticia del Sur S.A.", monto: 905500.5, st: "evaluacion" },
    { id: "4", ref: "SOL-2026-0131", name: "Consorcio Vial Demo Norte", monto: 12400000, st: "emitida" },
  ];
  const rows = [...base].sort((a, b) => { if (!sort) return 0; const k = sort.id as keyof Row; return (a[k] < b[k] ? -1 : 1) * (sort.dir === "asc" ? 1 : -1); });
  const cols: Column<Row>[] = [
    { id: "ref", header: "N.º", sortable: true, cell: (r) => <span className="t-ref text-fg-link">{r.ref}</span> },
    { id: "name", header: "Tomador", sortable: true, cell: (r) => r.name },
    { id: "monto", header: "Suma asegurada", sortable: true, align: "right", cell: (r) => <Amount value={r.monto} currency="PEN" /> },
    { id: "st", header: "Estado", cell: (r) => <StatusBadge def={SOLICITUD_STATUS[r.st]} /> },
  ];
  const vocab = (title: string, desc: string, map: Record<string, StatusDef>, variant: "soft" | "outline" = "soft") => (
    <div className="flex flex-col gap-2">
      <p className="t-label">{title} <span className="t-help text-fg-muted font-normal">· {desc}</span></p>
      <div className="flex flex-wrap gap-2">{Object.values(map).map((d) => <StatusBadge key={d.label} def={d} variant={variant} />)}</div>
    </div>
  );
  return (
    <Section id="datos" eyebrow="Componentes" title="Datos" intro="Tablas como herramienta principal: cabecera fija, ordenamiento de tres estados, selección con acciones en lote, densidad conmutable, cifras alineadas a la derecha y filas que abren el detalle.">
      <Spec title="Data Table · Sort · Selección" desc="Ordenamiento: asc → desc → sin orden" flush>
        <DataTable columns={cols} rows={rows} sort={sort} onSort={setSort} selectable selected={sel} onSelect={setSel} />
      </Spec>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Spec title="Data Table · Cargando" flush><DataTable columns={cols} rows={[]} loading /></Spec>
        <Spec title="Data Table · Vacío" flush><DataTable columns={cols} rows={[]} empty={<EmptyState compact icon="SearchX" title="Ninguna solicitud coincide" body="Prueba quitando algún filtro." action={<Button size="sm">Limpiar filtros</Button>} />} /></Spec>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Spec title="Filter" desc="Chip inactivo · activo · con menú">
          <div className="flex flex-wrap gap-2 items-start">
            <FilterChip label="Tipo" />
            <FilterChip label="Moneda" value="PEN" active onClear={() => {}} />
            <FilterMenu label="Estado" value={fv} onChange={setFv} options={Object.entries(SOLICITUD_STATUS).map(([k, v]) => ({ value: k, label: v.label }))} />
          </div>
        </Spec>
        <Spec title="Pagination"><Pagination page={page} pageSize={20} total={187} onPage={setPage} onPageSize={() => {}} /></Spec>
      </div>
      <Spec title="Status Badge" desc="Un vocabulario por objeto de negocio; forma distinta para el instrumento">
        <div className="flex flex-col gap-4">
          {vocab("Solicitud", "proceso comercial", SOLICITUD_STATUS)}
          {vocab("Instrumento", "contorno + escudo", INSTRUMENT_STATUS, "outline")}
          {vocab("Actividad de emisión", "trabajo operacional", ACTIVITY_STATUS)}
          {vocab("Documento", "ciclo documental", DOC_STATUS)}
          <div className="flex flex-col gap-2"><p className="t-label">Variantes de forma</p><div className="flex flex-wrap gap-3 items-center"><StatusBadge def={SOLICITUD_STATUS.aprobacion} /><StatusBadge def={SOLICITUD_STATUS.aprobacion} size="sm" /><StatusBadge def={SOLICITUD_STATUS.aprobacion} variant="dot" /><StatusBadge def={SOLICITUD_STATUS.aprobacion} variant="solid" /><StatusBadge def={SOLICITUD_STATUS.aprobacion} variant="outline" /></div></div>
        </div>
      </Spec>
      <Spec title="Summary Cards" desc="Default · interactiva · hover · cargando">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <SummaryCard icon="Inbox" label="Solicitudes en trámite" value={38} delta="+5" hint="esta semana" />
          <SummaryCard icon="BadgeCheck" label="Emitidas · octubre" value={42} delta="+9 %" deltaTone="up" hint="vs. setiembre" series={[14, 18, 11, 21, 17, 24, 19, 23]} onClick={() => {}} />
          <SummaryCard icon="ListChecks" label="Pendientes" value={6} delta="1 vencida" deltaTone="warning" onClick={() => {}} state="hover" />
          <SummaryCard icon="Scale" label="Suma asegurada vigente" value="" loading />
        </div>
      </Spec>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Spec title="Tabs" desc="Línea (navegación de secciones) · segmentado (vistas)">
          <div className="flex flex-col gap-4">
            <Tabs value={tab} onChange={setTab} tabs={[{ id: "a", label: "Resumen" }, { id: "b", label: "Documentación", count: 6, alert: true }, { id: "c", label: "Historial", count: 8 }, { id: "d", label: "Reaseguro", disabled: true }]} />
            <Tabs variant="segmented" value={tab} onChange={setTab} tabs={[{ id: "a", label: "Mapa", icon: "Workflow" }, { id: "b", label: "Lista", icon: "List" }, { id: "c", label: "Calendario", icon: "Calendar" }]} />
          </div>
        </Spec>
        <Spec title="Description List">
          <DescriptionList columns={2} items={[
            { label: "Tomador", value: "Constructora Ejemplo Andina S.A.C.", hint: "ID-DEMO-1047" },
            { label: "Suma asegurada", value: <Amount value={4860250} currency="PEN" /> },
            { label: "Tasa (demo)", value: "1.15 % anual", changed: true },
            { label: "Grupo económico", value: null },
          ]} />
        </Spec>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Spec title="Timeline"><Timeline items={HISTORIAL_0147.slice(0, 4).map((e) => ({ ...e, ref: undefined }))} /></Spec>
        <Spec title="Activity Log" desc="Vista de auditoría" flush><div className="p-2"><ActivityLog items={HISTORIAL_0147.slice(0, 5)} /></div></Spec>
      </div>
    </Section>
  );
}

/* ---------- Interacciones ---------- */
function Interacciones() {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <Section id="interacciones" eyebrow="Componentes" title="Interacciones" intro="Overlays con foco atrapado, cierre con Esc y retorno del foco al disparador. Las vistas estáticas muestran la anatomía; los botones abren la versión real.">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setModal(true)} icon="AppWindow">Abrir modal</Button>
        <Button onClick={() => setDrawer(true)} icon="PanelRight">Abrir drawer</Button>
        <Button onClick={() => setConfirm(true)} icon="TriangleAlert" variant="danger">Abrir confirmación destructiva</Button>
        <Button onClick={() => toast.push({ tone: "success", title: "Solicitud registrada", body: "SOL-2026-0161 quedó en estado Recibida.", action: { label: "Abrir expediente", onClick: () => {} } })}>Toast éxito</Button>
        <Button onClick={() => toast.push({ tone: "danger", title: "No se pudo guardar", body: "El servicio no respondió. Tus cambios siguen en el formulario." })}>Toast error</Button>
        <Button onClick={() => toast.push({ tone: "warning", title: "Sesión por expirar", body: "Se cerrará en 5 minutos por inactividad." })}>Toast advertencia</Button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Spec title="Modal" desc="Anatomía · sm 420 / md 560 / lg 760 / xl 960">
          <div className="bg-overlay rounded-control p-5 flex justify-center">
            <Modal inline open onClose={() => {}} size="sm" title="Reasignar responsable" description="La solicitud pasará a la bandeja del nuevo responsable."
              footer={<><Button>Cancelar</Button><Button variant="primary">Reasignar</Button></>}>
              <Field label="Nuevo responsable" htmlFor="m-sel"><Select id="m-sel" options={[{ value: "1", label: "María Quispe" }]} /></Field>
            </Modal>
          </div>
        </Spec>
        <Spec title="Confirmation Dialog" desc="Destructiva con fundamento obligatorio">
          <div className="bg-overlay rounded-control p-5 flex justify-center">
            <ConfirmDialog inline open onClose={() => {}} onConfirm={() => {}} tone="danger" requireComment title="Desistir SOL-2026-0147" confirmLabel="Desistir solicitud"
              body="La solicitud se cerrará. El historial se conserva." commentLabel="Motivo" />
          </div>
        </Spec>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Spec title="Drawer" desc="Detalle sin perder contexto">
          <div className="h-[300px]"><Drawer inline open onClose={() => {}} title="SOL-2026-0147" subtitle="Vista rápida"><DescriptionList columns={1} items={[{ label: "Tomador", value: "Constructora Ejemplo Andina S.A.C." }, { label: "Suma asegurada", value: <Amount value={4860250} currency="PEN" /> }]} /></Drawer></div>
        </Spec>
        <Spec title="Dropdown" desc="Teclado: ↑ ↓ Inicio Fin Enter Esc">
          <div className="flex flex-col gap-3 items-start min-h-[300px]">
            <Dropdown align="start" items={[
              { label: "Abrir expediente", icon: "FolderOpen", shortcut: "Enter" },
              { label: "Vista rápida", icon: "PanelRight" },
              { label: "Copiar N.º", icon: "Copy" },
              { label: "Exportar (sin permiso)", icon: "Download", disabled: true },
              { separator: true },
              { label: "Desistir solicitud", icon: "CircleSlash", danger: true },
            ]} trigger={(p) => <Button {...p} iconRight="ChevronDown">Acciones</Button>} />
            <p className="t-help text-fg-muted">Ítems: default, con atajo, deshabilitado, separador y destructivo.</p>
          </div>
        </Spec>
        <Spec title="Tooltip y Toast">
          <div className="flex flex-col gap-10 items-start pt-8">
            <Tooltip content="Prioridad alta: atender antes del 16/10" forceOpen align="start"><span className="inline-flex"><Tag tone="danger" icon="Flag">Prioridad alta</Tag></span></Tooltip>
            <ToastView inline t={{ id: "x", tone: "success", title: "Decisión registrada", body: "SOL-2026-0147 · favorable con condiciones." }} onClose={() => {}} />
          </div>
        </Spec>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Spec title="Empty State"><EmptyState compact icon="Inbox" title="No tienes solicitudes en esta vista" body="Cuando se te asigne una solicitud aparecerá aquí." action={<Button size="sm" variant="primary" icon="Plus">Nueva solicitud</Button>} /></Spec>
        <Spec title="Skeleton Loading">
          <div className="flex flex-col gap-3" aria-hidden="true">
            <Skeleton className="h-4 w-40" /><div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="flex flex-col gap-1.5"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-24" /></div>)}</div>
            <Skeleton className="h-3.5" /><Skeleton className="h-3.5 w-[80%]" /><Skeleton className="h-3.5 w-[60%]" />
          </div>
        </Spec>
        <Spec title="Error State"><ErrorState compact code="DEMO-504" onRetry={() => {}} /></Spec>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Modal de ejemplo" description="Se cierra con Esc, con el botón o haciendo clic fuera."
        footer={<><Button onClick={() => setModal(false)}>Cancelar</Button><Button variant="primary" onClick={() => { setModal(false); toast.push({ tone: "success", title: "Guardado" }); }}>Guardar</Button></>}>
        <Field label="Comentario" htmlFor="mx-c"><Textarea id="mx-c" data-autofocus /></Field>
      </Modal>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Drawer de ejemplo" subtitle="Panel lateral de 480 px" footer={<Button onClick={() => setDrawer(false)}>Cerrar</Button>}>
        <p className="t-body text-fg-muted">Para vistas rápidas, metadatos de documentos y detalle de actividades sin abandonar la lista.</p>
      </Drawer>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} tone="danger" requireComment title="Eliminar borrador" confirmLabel="Eliminar borrador"
        body="Se eliminará el borrador SOL-2026-0161. No se puede deshacer." onConfirm={() => toast.push({ tone: "success", title: "Borrador eliminado" })} />
    </Section>
  );
}

/* ---------- Patrones ---------- */
function Patrones() {
  const { go } = useApp();
  return (
    <Section id="patrones" eyebrow="Componentes" title="Patrones de negocio" intro="Composiciones recurrentes. Cada patrón está implementado en una pantalla del prototipo; el enlace lleva al uso real.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { t: "Formularios extensos agrupados", d: "Secciones con índice navegable (no wizard), validación por campo y resumen de errores con enlaces al campo. Borrador guardable incompleto.", go: () => go("bandeja"), where: "Bandeja → Nueva solicitud · Expediente → Evaluación" },
          { t: "Expedientes con múltiples secciones", d: "Cabecera con datos clave fijos, pestañas por dominio y riel contextual con tareas, alertas y estado del instrumento.", go: () => go("expediente", { id: "SOL-2026-0147" }), where: "Expediente SOL-2026-0147" },
          { t: "Documentos adjuntos", d: "Estado por documento, versión, observación visible, acciones según estado (validar, observar, reemplazar, solicitar).", go: () => go("expediente", { id: "SOL-2026-0147" }), where: "Expediente → Documentación" },
          { t: "Historial de eventos", d: "Línea de tiempo para lectura y registro de auditoría tabular, filtrables por tipo de evento.", go: () => go("expediente", { id: "SOL-2026-0147" }), where: "Expediente → Historial" },
          { t: "Aprobaciones", d: "Decisión con sentido, fundamento obligatorio y contexto a la vista. Facultades y niveles se dejan explícitamente sin definir.", go: () => go("emision"), where: "Expediente → Registrar decisión · Emisión → Decisiones" },
          { t: "Estados de operaciones", d: "Vocabularios separados para solicitud, instrumento, actividad y documento; el workspace de emisión muestra avance sin confundirlo con el estado del instrumento.", go: () => go("emision"), where: "Workspace de emisión" },
        ].map((p) => (
          <div key={p.t} className="bg-surface border border-line rounded-card p-4 flex flex-col gap-2">
            <p className="t-sub">{p.t}</p>
            <p className="t-body text-fg-muted">{p.d}</p>
            <button onClick={p.go} className="self-start t-label text-fg-link hv:underline inline-flex items-center gap-1 mt-1 min-h-6">{p.where}<Icon name="ArrowRight" size={14} /></button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Spec title="Comparación de información" flush>
          <div className="overflow-x-auto"><table className="w-full t-table min-w-[420px]">
            <thead><tr className="text-left text-fg-muted bg-subtle"><th className="font-medium h-9 pl-4 border-b border-line">Condición</th><th className="font-medium border-b border-line px-3">Solicitado</th><th className="font-medium border-b border-line px-3">Propuesto</th><th className="border-b border-line pr-4" /></tr></thead>
            <tbody>
              {COMPARACION_0147.slice(1, 4).map((r) => (
                <tr key={r.campo} className={cn(r.cambia && "bg-warning-soft/50")}>
                  <td className="pl-4 py-2 border-b border-line font-medium">{r.campo}</td>
                  <td className={cn("px-3 py-2 border-b border-line", r.cambia && "line-through text-fg-muted")}>{r.solicitado}</td>
                  <td className={cn("px-3 py-2 border-b border-line", r.cambia && "font-medium")}>{r.propuesto}</td>
                  <td className="pr-4 py-2 border-b border-line text-right">{r.cambia && <Tag tone="warning" icon="ArrowLeftRight">Cambia</Tag>}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Spec>
        <Spec title="Alertas de validación" desc="Resumen + campo + aviso contextual">
          <div className="flex flex-col gap-3">
            <InlineAlert tone="danger" title="Revisa 2 campos antes de registrar"><ul className="mt-1"><li><u>Suma asegurada</u>: usa sólo números.</li><li><u>Fin de vigencia</u>: debe ser posterior al inicio.</li></ul></InlineAlert>
            <InlineAlert tone="warning" title="Documento por vencer">La vigencia de poderes vence en 5 días.</InlineAlert>
            <InlineAlert tone="success" title="Validación completa">Todos los documentos obligatorios fueron validados.</InlineAlert>
            <InlineAlert tone="info" onClose={() => {}}>Esta solicitud se creó desde el portal de corredores.</InlineAlert>
          </div>
        </Spec>
      </div>
    </Section>
  );
}

/* ---------- Decisiones y pendientes ---------- */
function Decisiones() {
  const B = [
    { t: "Decisiones aplicadas en V1.2", tone: "success" as const, icon: "CircleCheck", items: [
      "Corporate Refined es la única identidad activa. Las variantes Modern Premium y Minimal Executive se retiraron del producto; su definición queda en docs/historico.",
      "Fuente única de tokens (tokens.json) con cuatro capas: primitivos, semánticos, componente y tema. tokens.css y tokens.ts se generan.",
      "Radio base 8 px: controles y tarjetas 8, overlays 12, badges y checkbox 4. Bordes de 1 px y tres sombras discretas por rol.",
      "Densidad Balanced por defecto: controles de 36 px, filas de 48 px, paneles de 20 px. Compact queda definida y se activa con data-caucion-density.",
      "Tema claro, oscuro o según el sistema; preferencia persistente; script previo al CSS para evitar el parpadeo.",
      "Text Secondary ajustado a #5B6B80 para cumplir AA sobre el fondo aprobado; #64748B se conserva como primitivo.",
      "Iconos Lucide empaquetados localmente: sin dependencia de CDN en tiempo de ejecución.",
      "Bajo 768 px los objetivos táctiles crecen a 40–44 px; tamaños tipográficos en rem.",
    ] },
    { t: "Supuestos", tone: "info" as const, icon: "Lightbulb", items: [
      "Locale es-PE: miles con coma, decimales con punto; monedas PEN y USD.",
      "El sidebar se expande por defecto desde 1200 px; por debajo arranca colapsado.",
      "La densidad Compact no se expone al usuario en V1.2.",
    ] },
    { t: "Pendiente de validación", tone: "warning" as const, icon: "CircleHelp", items: [
      "Aprobación del ajuste de Text Secondary (#5B6B80) por parte de marca.",
      "Pruebas en dispositivos físicos, Safari y Firefox, y con lectores de pantalla (NVDA, VoiceOver).",
      "Alojar IBM Plex localmente (p. ej. @fontsource) para no depender de Google Fonts en producción.",
      "Catálogo definitivo de estados, facultades de aprobación y KPI (heredado de V1).",
    ] },
    { t: "Dependencias de identidad corporativa", tone: "neutral" as const, icon: "Palette", items: [
      "Nombre definitivo del producto y logotipo (el monograma es provisional).",
      "Validación de marca de los valores del tema oscuro.",
      "Licencia y aprobación de IBM Plex (OFL) por el área de marca.",
    ] },
  ];
  return (
    <Section id="decisiones" eyebrow="Validación" title="Decisiones y pendientes" intro="Qué se aplicó en V1.2, qué se asumió y qué requiere validación antes de dar por cerrado el Design System.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {B.map((b) => (
          <div key={b.t} className="bg-surface border border-line rounded-card shadow-card">
            <div className="px-4 py-2.5 border-b border-line flex items-center gap-2"><StatusBadge def={{ label: b.t, tone: b.tone, icon: b.icon }} /><span className="t-help text-fg-muted ml-auto tnum">{b.items.length}</span></div>
            <ul className="px-4 py-3 flex flex-col gap-2">
              {b.items.map((i) => <li key={i} className="t-body flex gap-2"><span className="text-fg-subtle mt-[1px]" aria-hidden="true">–</span><span>{i}</span></li>)}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
