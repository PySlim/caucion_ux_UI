import React, { useState } from "react";
import { cn } from "../../lib/cn";
import { Icon } from "../../lib/icon";
import { themeAttrs, type ThemeName } from "../../theme/theme";
import { Button, IconButton, Field, Input, Select, Checkbox, Switch } from "../ui/controls";
import { SummaryCard, Tabs, StatusBadge, DataTable, Amount, Avatar, type Column } from "../ui/data";
import { NavButton, Logo } from "../../shell/AppShell";
import { SOLICITUD_STATUS, INSTRUMENT_STATUS, ACTIVITY_STATUS, type SolicitudStatus } from "../../domain/status";

/**
 * Espécimen del Visual Lab: los MISMOS componentes de producción dentro de un
 * contenedor con su propio tema. Sólo cambian los tokens del tema.
 */
export function SpecimenFrame({ theme, children, className, label }: { theme: ThemeName; children: React.ReactNode; className?: string; label?: string }) {
  return (
    <div {...themeAttrs(theme)} aria-label={label} role={label ? "group" : undefined}
      className={cn("bg-canvas text-fg border border-line rounded-overlay min-w-0 overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function SpecShell({ narrow }: { narrow?: boolean }) {
  return (
    <div className="flex min-h-[208px] @container/shell">
      <div className={cn("on-nav bg-nav text-fg-on-nav flex flex-col shrink-0", narrow ? "w-[118px]" : "w-[150px] @2xl:w-[200px]")}>
        <div className="h-12 flex items-center gap-2 px-3 border-b border-line-nav">
          <Logo size={22} />
          <span className="t-wordmark text-xs">CAUCIÓN</span>
        </div>
        <div className="flex flex-col gap-px p-1.5">
          <NavButton icon="LayoutDashboard" label="Inicio" />
          <NavButton icon="Inbox" label="Solicitudes" active badge={9} />
          <NavButton icon="FileStack" label="Emisiones" state="hover" />
          <NavButton icon="ShieldCheck" label="Cauciones" tag={narrow ? undefined : "V2"} />
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-12 bg-surface border-b border-line flex items-center gap-2 px-3">
          <span className="t-label truncate flex-1 min-w-0"><span className="text-fg-muted">Operación / </span>Solicitudes</span>
          {!narrow && (
            <span className="hidden @2xl:flex items-center gap-2 h-[var(--control-h-sm)] w-40 px-2 rounded-control border border-line-strong bg-subtle text-fg-muted t-help">
              <Icon name="Search" size={14} /> Buscar…
            </span>
          )}
          <IconButton icon="Bell" label="Notificaciones" badge={4} size="sm" />
          <Avatar name="Ana Torres" size={24} />
        </div>
        <div className="p-3 flex flex-col gap-1">
          <p className="t-module text-accent-fg">Operación · Gestión comercial</p>
          <p className="t-page">Bandeja de solicitudes</p>
          <p className="t-help text-fg-muted">41 solicitudes · 9 observadas</p>
        </div>
      </div>
    </div>
  );
}

export function SpecButtons() {
  return (
    <div className="p-3 flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" icon="Plus">Nueva solicitud</Button>
        <Button variant="secondary">Exportar</Button>
        <Button variant="tertiary">Ver detalle</Button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Button variant="primary" state="hover">Hover</Button>
        <Button variant="secondary" state="focus">Foco</Button>
        <Button variant="primary" disabled>Deshabilitado</Button>
        <Button variant="danger" size="sm">Desistir</Button>
        <IconButton icon="Ellipsis" label="Más acciones" variant="secondary" />
      </div>
    </div>
  );
}

export function SpecCards() {
  return (
    <div className="p-3 grid grid-cols-1 @md:grid-cols-2 gap-2.5">
      <SummaryCard icon="Inbox" label="En trámite" value={28} delta="+5" hint="esta semana" />
      <SummaryCard icon="BadgeCheck" label="Emitidas · oct." value={42} delta="+9 %" deltaTone="up" series={[14, 18, 11, 21, 17, 24, 19, 23]} />
    </div>
  );
}

export function SpecInputs({ id }: { id: string }) {
  const [sw, setSw] = useState(true);
  return (
    <div className="p-3 grid grid-cols-1 @md:grid-cols-2 gap-3">
      <Field label="Suma asegurada" htmlFor={`${id}-m`} required help="Con 2 decimales">
        <Input id={`${id}-m`} prefix="S/" numeric defaultValue="4,860,250.00" />
      </Field>
      <Field label="N.º de contrato" htmlFor={`${id}-c`} required error="Ingresa la referencia.">
        <Input id={`${id}-c`} status="error" />
      </Field>
      <Field label="Tipo de caución" htmlFor={`${id}-t`}>
        <Select id={`${id}-t`} options={[{ value: "f", label: "Fiel cumplimiento" }]} />
      </Field>
      <div className="flex flex-col gap-2 justify-end pb-1">
        <Checkbox label="Prioridad alta" defaultChecked />
        <Switch checked={sw} onChange={setSw} label="Notificar al ejecutivo" />
      </div>
    </div>
  );
}

export function SpecTabs() {
  const [t, setT] = useState("doc");
  const [v, setV] = useState("mapa");
  return (
    <div className="p-3 flex flex-col gap-3">
      <Tabs value={t} onChange={setT} ariaLabel="Secciones" tabs={[{ id: "res", label: "Resumen" }, { id: "doc", label: "Documentos", count: 6, alert: true }, { id: "his", label: "Historial", count: 8 }]} />
      <Tabs variant="segmented" value={v} onChange={setV} ariaLabel="Vista" tabs={[{ id: "mapa", label: "Mapa" }, { id: "lista", label: "Lista" }]} />
    </div>
  );
}

export function SpecBadges() {
  const keys: SolicitudStatus[] = ["recibida", "evaluacion", "observada", "aprobacion", "aprobada", "rechazada", "emitida"];
  return (
    <div className="p-3 flex flex-wrap gap-1.5">
      {keys.map((k) => <StatusBadge key={k} def={SOLICITUD_STATUS[k]} />)}
      <StatusBadge def={INSTRUMENT_STATUS.vigente} variant="outline" />
      <StatusBadge def={ACTIVITY_STATUS.devuelta} />
    </div>
  );
}

type Row = { id: string; ref: string; name: string; monto: number; st: SolicitudStatus };
const ROWS: Row[] = [
  { id: "1", ref: "SOL-2026-0147", name: "Constructora Ejemplo Andina S.A.C.", monto: 4860250, st: "observada" },
  { id: "2", ref: "SOL-2026-0151", name: "Energía Demo Renovable S.A.C.", monto: 2480000, st: "aprobacion" },
  { id: "3", ref: "SOL-2026-0131", name: "Consorcio Vial Demo Norte", monto: 12400000, st: "emitida" },
];
export function SpecTable() {
  const [sel, setSel] = useState<Set<string>>(new Set(["2"]));
  const cols: Column<Row>[] = [
    { id: "ref", header: "N.º", cell: (r) => <span className="t-ref text-fg-link whitespace-nowrap">{r.ref}</span> },
    { id: "name", header: "Tomador", cell: (r) => <span className="block max-w-[180px] truncate">{r.name}</span> },
    { id: "monto", header: "Suma asegurada", align: "right", cell: (r) => <Amount value={r.monto} currency="PEN" /> },
    { id: "st", header: "Estado", cell: (r) => <StatusBadge def={SOLICITUD_STATUS[r.st]} size="sm" /> },
  ];
  return (
    <div className="bg-surface">
      <DataTable columns={cols} rows={ROWS} selectable selected={sel} onSelect={setSel} density="compact" sort={{ id: "monto", dir: "desc" }} />
    </div>
  );
}

/** Espécimen completo: mini-aplicación con todos los grupos de componentes. */
export function SpecimenFull({ id }: { id: string }) {
  return (
    <div className="flex flex-col @container">
      <SpecShell />
      <div className="grid grid-cols-1 @4xl:grid-cols-2 border-t border-line">
        <div className="flex flex-col divide-y divide-line border-b @4xl:border-b-0 @4xl:border-r border-line min-w-0">
          <SpecButtons /><SpecInputs id={id} /><SpecTabs />
        </div>
        <div className="flex flex-col divide-y divide-line min-w-0">
          <SpecCards /><SpecBadges /><div className="p-3 min-w-0"><div className="border border-line rounded-card overflow-hidden"><SpecTable /></div></div>
        </div>
      </div>
    </div>
  );
}
