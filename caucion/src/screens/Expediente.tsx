import React, { useEffect, useMemo, useState } from "react";
import { PageHeader, PageBody } from "../shell/AppShell";
import { useApp } from "../shell/AppContext";
import { Button, IconButton, Checkbox, Field, Select, Input, Textarea, Radio, FileUpload, Switch } from "../components/ui/controls";
import { Panel, Tabs, StatusBadge, Amount, DescriptionList, Timeline, ActivityLog, InlineAlert, Tag, Avatar, ProgressBar, EmptyState, Skeleton } from "../components/ui/data";
import { Dropdown, Drawer, Modal, ConfirmDialog, useToast, Tooltip } from "../components/ui/overlays";
import { SOLICITUD_STATUS, DOC_STATUS, INSTRUMENT_STATUS } from "../domain/status";
import { tomador, asegurado, userById, DOCS_0147, TAREAS_0147, HISTORIAL_0147, COMPARACION_0147, CURRENT_USER, type Doc, type Tarea, type Evento, type Solicitud } from "../data/mock";
import { date, dateTime, relative, daysUntil, money } from "../lib/format";
import { Icon } from "../lib/icon";
import { cn } from "../lib/cn";

type TabId = "resumen" | "participantes" | "economica" | "documentos" | "evaluacion" | "historial";

export function Expediente() {
  const { routeParam, solicitudes, go, updateSolicitud } = useApp();
  const toast = useToast();
  const s = solicitudes.find((x) => x.id === routeParam) ?? solicitudes.find((x) => x.id === "SOL-2026-0147")!;
  const isHero = s.id === "SOL-2026-0147";
  const [tab, setTab] = useState<TabId>("resumen");
  const [docs, setDocs] = useState<Doc[]>(DOCS_0147);
  const [tasks, setTasks] = useState<Tarea[]>(TAREAS_0147);
  const [hist, setHist] = useState<Evento[]>(isHero ? HISTORIAL_0147 : HISTORIAL_0147.slice(4).map((e) => ({ ...e, ref: s.id })));
  const [decision, setDecision] = useState(false);
  const [docOpen, setDocOpen] = useState<Doc | null>(null);
  const [observar, setObservar] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [railOpen, setRailOpen] = useState(true);

  useEffect(() => { setLoading(true); setTab("resumen"); const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, [s.id]);

  const t = tomador(s.tomadorId), a = asegurado(s.aseguradoId);
  const log = (action: string, kind: Evento["kind"]) =>
    setHist((h) => [{ id: Math.random().toString(36), who: CURRENT_USER.name, action, ref: s.id, when: "2026-10-15T11:30:00", kind }, ...h]);
  const docIssues = docs.filter((d) => d.status === "observado" || d.status === "vencido" || d.status === "pendiente");
  const openTasks = tasks.filter((k) => !k.done);
  const plazo = Math.round((new Date(s.vigenciaHasta).getTime() - new Date(s.vigenciaDesde).getTime()) / 86400000);

  const validations = [
    ...docs.filter((d) => d.status === "vencido").map((d) => ({ tone: "danger" as const, text: `${d.name}: documento vencido.`, tab: "documentos" as TabId })),
    ...docs.filter((d) => d.status === "observado").map((d) => ({ tone: "danger" as const, text: `${d.name}: ${d.note}`, tab: "documentos" as TabId })),
    ...docs.filter((d) => d.status === "pendiente").map((d) => ({ tone: "warning" as const, text: `${d.name} aún no fue cargado.`, tab: "documentos" as TabId })),
    { tone: "warning" as const, text: "Exposición del grupo económico al 86 % del umbral demo.", tab: "economica" as TabId },
  ];

  return (
    <>
      <PageHeader
        back={{ label: "Bandeja de solicitudes", onClick: () => go("bandeja") }}
        module="Expediente de solicitud"
        title={
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="t-ref text-xl font-semibold tracking-tight">{s.id}</span>
            <StatusBadge def={SOLICITUD_STATUS[s.status]} />
            {s.prioridad === "alta" && <Tag tone="danger" icon="Flag">Prioridad alta</Tag>}
            <StatusBadge def={INSTRUMENT_STATUS.no_emitido} variant="outline" size="sm" className="hidden md:inline-flex" />
          </span>
        }
        description={<><span className="text-fg font-medium">{t.name}</span> a favor de <span className="text-fg font-medium">{a.name}</span></>}
        actions={<>
          <Button variant="secondary" icon="MessageSquarePlus" onClick={() => { log("agregó un comentario interno (demo)", "comment"); toast.push({ tone: "success", title: "Comentario agregado", body: "Visible en Historial." }); }}>Comentar</Button>
          <Dropdown items={[
            { label: "Solicitar información al cliente", icon: "MailQuestion", onSelect: () => { log("solicitó información al cliente", "update"); toast.push({ tone: "info", title: "Solicitud de información registrada", body: "Notificación simulada al ejecutivo comercial." }); } },
            { label: "Reasignar responsable", icon: "UserRoundPlus" },
            { label: "Abrir workspace de emisión", icon: "FileStack", onSelect: () => go("emision") },
            { label: "Comparar con solicitud anterior", icon: "GitCompareArrows", onSelect: () => setTab("economica") },
            { separator: true },
            { label: "Desistir solicitud", icon: "CircleSlash", danger: true },
          ]} trigger={(p) => <Button {...p} variant="secondary" iconRight="ChevronDown">Más acciones</Button>} />
          <Button variant="primary" icon="Gavel" onClick={() => setDecision(true)}>Registrar decisión</Button>
        </>}
        meta={
          <dl className="flex flex-wrap gap-x-7 gap-y-2 mt-1">
            {[
              { k: "Tipo", v: s.tipo },
              { k: "Suma asegurada", v: <Amount value={s.monto} currency={s.currency} /> },
              { k: "Vigencia", v: <span className="tnum">{date(s.vigenciaDesde)} – {date(s.vigenciaHasta)} <span className="text-fg-muted">({plazo} d)</span></span> },
              { k: "Responsable", v: <span className="inline-flex items-center gap-1.5"><Avatar name={userById(s.ownerId).name} size={20} />{userById(s.ownerId).name}</span> },
              { k: "Atención", v: s.vence ? <span className={cn("tnum", daysUntil(s.vence) <= 0 ? "text-danger font-medium" : "")}>{date(s.vence)}{daysUntil(s.vence) === 1 ? " · mañana" : daysUntil(s.vence) === 0 ? " · hoy" : ""}</span> : "—" },
            ].map((m) => (
              <div key={m.k} className="flex flex-col">
                <dt className="t-help text-fg-muted">{m.k}</dt>
                <dd className="t-label text-fg">{m.v}</dd>
              </div>
            ))}
          </dl>
        }
      >
        <Tabs ariaLabel="Secciones del expediente" value={tab} onChange={(v) => setTab(v as TabId)} className="-mb-3 -mx-1"
          tabs={[
            { id: "resumen", label: "Resumen", icon: "LayoutList" },
            { id: "participantes", label: "Participantes", icon: "Users", count: 4 },
            { id: "economica", label: "Información económica", icon: "Banknote" },
            { id: "documentos", label: "Documentación", icon: "Paperclip", count: docs.length, alert: docIssues.some((d) => d.status !== "pendiente") },
            { id: "evaluacion", label: "Evaluación", icon: "ScanSearch" },
            { id: "historial", label: "Historial", icon: "History", count: hist.length },
          ]} />
      </PageHeader>

      <PageBody>
        {!isHero && (
          <InlineAlert tone="neutral" title="Expediente ilustrativo">
            Los datos de cabecera corresponden a {s.id}; las secciones internas reutilizan el contenido de ejemplo de SOL-2026-0147.
          </InlineAlert>
        )}
        <div className="flex flex-col xl:flex-row gap-[var(--section-gap)] xl:items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-[var(--section-gap)]" role="tabpanel" aria-label={tab}>
            {loading ? <LoadingPanels /> : (
              <>
                {tab === "resumen" && <Resumen s={s} docs={docs} hist={hist} goTab={setTab} />}
                {tab === "participantes" && <Participantes s={s} />}
                {tab === "economica" && <Economica s={s} />}
                {tab === "documentos" && (
                  <Documentos docs={docs} onOpen={setDocOpen}
                    onValidate={(d) => { setDocs((ds) => ds.map((x) => (x.id === d.id ? { ...x, status: "validado" } : x))); log(`validó el documento «${d.name}»`, "document"); toast.push({ tone: "success", title: "Documento validado", body: d.name }); }}
                    onObservar={setObservar}
                    onUploaded={(name) => { setDocs((ds) => [{ id: Math.random().toString(36), name, category: "Sin clasificar", status: "en_revision", size: "—", uploaded: "2026-10-15T11:30:00", by: CURRENT_USER.name, version: 1 }, ...ds]); log(`adjuntó «${name}»`, "document"); }} />
                )}
                {tab === "evaluacion" && <Evaluacion onSaved={() => { log("guardó la evaluación de suscripción (borrador)", "update"); toast.push({ tone: "success", title: "Evaluación guardada", body: "Se guardó como borrador. Aún no constituye una decisión." }); }} onDecide={() => setDecision(true)} />}
                {tab === "historial" && <Historial hist={hist} />}
              </>
            )}
          </div>

          {/* Riel contextual */}
          <aside className={cn("grid grid-cols-1 md:grid-cols-2 xl:flex xl:flex-col gap-[var(--section-gap)] items-start shrink-0 transition-[width] min-w-0", railOpen ? "w-full xl:w-[320px]" : "w-full xl:w-10")} aria-label="Contexto del expediente">
            {railOpen ? (
              <>
                <Panel title="Tareas pendientes" subtitle={`${openTasks.length} abiertas`} actions={<IconButton icon="PanelRightClose" label="Ocultar panel lateral" size="sm" className="hidden xl:inline-flex" onClick={() => setRailOpen(false)} />} bodyClass="p-0">
                  <ul className="divide-y divide-line">
                    {tasks.map((k) => {
                      const d = daysUntil(k.due);
                      return (
                        <li key={k.id} className="px-4 py-2.5 flex gap-2.5">
                          <Checkbox aria-label={k.title} checked={k.done} onChange={() => {
                            setTasks((ts) => ts.map((x) => (x.id === k.id ? { ...x, done: !x.done } : x)));
                            if (!k.done) { log(`completó la tarea «${k.title}»`, "update"); toast.push({ tone: "success", title: "Tarea completada", body: k.title }); }
                          }} />
                          <div className="min-w-0 flex-1">
                            <p className={cn("t-body", k.done && "line-through text-fg-muted")}>{k.title}</p>
                            <p className="t-help text-fg-muted flex flex-wrap items-center gap-x-2">
                              <span>{k.owner}</span>
                              <span className={cn("tnum", !k.done && d < 0 && "text-danger font-medium", !k.done && d === 0 && "text-warning font-medium")}>
                                {k.done ? "Hecha" : d < 0 ? `Vencida ${date(k.due)}` : d === 0 ? "Vence hoy" : `Vence ${date(k.due)}`}
                              </span>
                              {k.blocking && !k.done && <span className="text-danger inline-flex items-center gap-0.5"><Icon name="Lock" size={11} />Bloqueante</span>}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
                <Panel title="Alertas de validación" subtitle={`${validations.length}`} bodyClass="p-3 flex flex-col gap-2">
                  {validations.map((v, i) => (
                    <button key={i} onClick={() => setTab(v.tab)} className={cn("text-left flex gap-2 px-2.5 py-2 rounded-control border t-body hv:bg-subtle", v.tone === "danger" ? "border-danger/30" : "border-warning/30")}>
                      <Icon name={v.tone === "danger" ? "CircleAlert" : "TriangleAlert"} size={15} className={cn("mt-0.5", v.tone === "danger" ? "text-danger" : "text-warning")} />
                      <span className="flex-1">{v.text}</span>
                      <Icon name="ChevronRight" size={14} className="text-fg-subtle mt-0.5" />
                    </button>
                  ))}
                </Panel>
                <Panel title="Emisión" bodyClass="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="t-help text-fg-muted">Estado del instrumento</span>
                    <StatusBadge def={INSTRUMENT_STATUS.no_emitido} variant="outline" size="sm" />
                  </div>
                  <p className="t-body text-fg-muted">El estado del instrumento es independiente del estado de la solicitud.</p>
                  <Button variant="secondary" size="sm" icon="FileStack" onClick={() => go("emision")}>Ver workspace de emisión</Button>
                </Panel>
              </>
            ) : (
              <IconButton icon="PanelRightOpen" label="Mostrar panel lateral" variant="secondary" onClick={() => setRailOpen(true)} />
            )}
          </aside>
        </div>
      </PageBody>

      <DecisionModal open={decision} onClose={() => setDecision(false)} s={s}
        onDecide={(kind, comment) => {
          const map = { aprobar: "aprobada", condiciones: "aprobada", devolver: "observada", rechazar: "rechazada", elevar: "aprobacion" } as const;
          const label = { aprobar: "decisión favorable", condiciones: "decisión favorable con condiciones", devolver: "devolución para subsanación", rechazar: "decisión desfavorable", elevar: "derivación a otra instancia" }[kind];
          updateSolicitud(s.id, { status: map[kind] });
          log(`registró ${label}: «${comment}»`, kind === "devolver" ? "return" : "decision");
          toast.push({ tone: kind === "rechazar" ? "warning" : "success", title: "Decisión registrada", body: `${s.id}: ${label}. Quedó en el historial.` });
        }} />

      <DocDrawer d={docOpen} onClose={() => setDocOpen(null)} />
      <ConfirmDialog open={!!observar} onClose={() => setObservar(null)} requireComment commentLabel="Observación para el cliente" title="Observar documento" confirmLabel="Registrar observación"
        body={<>Se devolverá <strong className="font-medium">{observar?.name}</strong> para subsanación y se notificará al ejecutivo responsable.</>}
        onConfirm={(c) => { if (observar) { setDocs((ds) => ds.map((x) => (x.id === observar.id ? { ...x, status: "observado", note: c } : x))); log(`observó «${observar.name}»: ${c}`, "return"); toast.push({ tone: "warning", title: "Documento observado", body: observar.name }); } }} />
    </>
  );
}

function LoadingPanels() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Cargando expediente">
      {[0, 1].map((i) => (
        <div key={i} className="bg-surface border border-line rounded-card p-4 flex flex-col gap-4">
          <Skeleton className="h-4 w-40" />
          <div className="grid grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, j) => <div key={j} className="flex flex-col gap-1.5"><Skeleton className="h-3 w-20" /><Skeleton className="h-4 w-36" /></div>)}</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Resumen ------------------------------ */
function Resumen({ s, docs, hist, goTab }: { s: Solicitud; docs: Doc[]; hist: Evento[]; goTab: (t: TabId) => void }) {
  const t = tomador(s.tomadorId), a = asegurado(s.aseguradoId);
  const ret = hist.find((h) => h.kind === "return");
  const byStatus = (k: Doc["status"]) => docs.filter((d) => d.status === k).length;
  return (
    <>
      {s.status === "observada" && ret && (
        <InlineAlert tone="warning" title="Devuelta para subsanación"
          action={<><Button size="sm" variant="secondary" onClick={() => goTab("documentos")}>Ver documentos observados</Button><Button size="sm" variant="quiet" onClick={() => goTab("historial")}>Ver historial</Button></>}>
          {ret.who} · {dateTime(ret.when)}: {ret.action.replace(/^devolvió la solicitud para subsanación: /, "")}
        </InlineAlert>
      )}
      <Panel title="Información general" id="p-general" actions={<Button size="sm" variant="tertiary" icon="Pencil">Editar</Button>}>
        <DescriptionList items={[
          { label: "Tipo de caución", value: s.tipo },
          { label: "Canal de ingreso", value: s.canal },
          { label: "Fecha de registro", value: <span className="tnum">{date(s.creada)}</span> },
          { label: "Contrato subyacente", value: "LP-DEMO-0042-2026", mono: true },
          { label: "Objeto", value: "Ejecución de obra de mejoramiento vial — tramo ficticio", span: 2 },
          { label: "Tomador", value: t.name, hint: t.doc },
          { label: "Beneficiario", value: a.name, hint: a.doc },
          { label: "Grupo económico", value: t.group ?? "—" },
        ]} />
      </Panel>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Información económica" actions={<Button size="sm" variant="tertiary" onClick={() => goTab("economica")}>Detalle</Button>}>
          <div className="flex flex-col gap-4">
            <div>
              <p className="t-help text-fg-muted">Suma asegurada</p>
              <Amount value={s.monto} currency={s.currency} size="lg" />
            </div>
            <DescriptionList columns={2} items={[
              { label: "Tasa propuesta (demo)", value: <span className="tnum">1.15 % anual</span>, changed: true },
              { label: "Prima estimada (demo)", value: <Amount value={Math.round(s.monto * 0.0115 * 100) / 100} currency={s.currency} size="sm" /> },
            ]} />
          </div>
        </Panel>
        <Panel title="Documentación" subtitle={`${docs.length} documentos`} actions={<Button size="sm" variant="tertiary" onClick={() => goTab("documentos")}>Gestionar</Button>}>
          <div className="flex flex-col gap-3">
            <div className="flex h-2 rounded-full overflow-hidden bg-muted" aria-hidden="true">
              {(["validado", "en_revision", "pendiente", "observado", "vencido"] as const).map((k) => (
                <span key={k} className={cn("h-full", { validado: "bg-success", en_revision: "bg-info", pendiente: "bg-warning", observado: "bg-danger", vencido: "bg-danger opacity-60" }[k])} style={{ width: `${(byStatus(k) / docs.length) * 100}%` }} />
              ))}
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {(["validado", "en_revision", "pendiente", "observado", "vencido"] as const).map((k) => (
                <li key={k} className="flex items-center justify-between t-body">
                  <StatusBadge def={DOC_STATUS[k]} variant="dot" />
                  <span className="tnum font-medium">{byStatus(k)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>
      <Panel title="Actividad reciente" actions={<Button size="sm" variant="tertiary" onClick={() => goTab("historial")}>Ver todo</Button>}>
        <Timeline items={hist.slice(0, 4).map((e) => ({ ...e, ref: undefined }))} />
      </Panel>
    </>
  );
}

/* ------------------------------ Participantes ------------------------------ */
function Participantes({ s }: { s: Solicitud }) {
  const t = tomador(s.tomadorId), a = asegurado(s.aseguradoId);
  const rows = [
    { role: "Tomador", icon: "Building2", name: t.name, doc: t.doc, extra: t.group ? `Grupo: ${t.group}` : "Sin grupo económico", contact: "Representante: Rosa Valdivia (ficticio)", tone: "info" as const },
    { role: "Beneficiario (asegurado)", icon: "Landmark", name: a.name, doc: a.doc, extra: "Entidad contratante", contact: "Área de contrataciones (ficticio)", tone: "accent" as const },
    { role: "Intermediario", icon: "Handshake", name: "Corredores Ejemplo Asociados S.A.C.", doc: "ID-DEMO-B310", extra: "Canal: Corredor", contact: "Ejecutiva: Paula Medina (ficticio)", tone: "neutral" as const },
    { role: "Contragarante", icon: "ShieldPlus", name: "Fiador solidario: Martín Ccori (ficticio)", doc: "ID-DEMO-P882", extra: "Fianza solidaria · en subsanación", contact: "Firma observada", tone: "warning" as const },
  ];
  return (
    <Panel title="Participantes" subtitle="Roles vinculados a la solicitud" actions={<Button size="sm" variant="secondary" icon="UserPlus">Vincular participante</Button>} bodyClass="p-0">
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.role} className="px-4 py-3.5 grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-x-6 gap-y-1 items-start">
            <div className="flex items-center gap-2">
              <Tag tone={r.tone} icon={r.icon}>{r.role}</Tag>
            </div>
            <div className="min-w-0">
              <p className="t-sub">{r.name}</p>
              <p className="t-help text-fg-muted"><span className="t-ref">{r.doc}</span> · {r.extra}</p>
              <p className="t-help text-fg-muted">{r.contact}</p>
            </div>
            <div className="flex gap-1">
              <IconButton icon="ExternalLink" label={`Abrir ficha de ${r.name}`} size="sm" />
              <IconButton icon="Ellipsis" label={`Más acciones para ${r.name}`} size="sm" />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ------------------------------ Económica + Comparación ------------------------------ */
function Economica({ s }: { s: Solicitud }) {
  const [onlyChanges, setOnlyChanges] = useState(false);
  const rows = COMPARACION_0147.filter((r) => !onlyChanges || r.cambia);
  const prima = Math.round(s.monto * 0.0115 * 100) / 100;
  return (
    <>
      <Panel title="Información económica" subtitle="Valores demostrativos">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { k: "Suma asegurada", v: <Amount value={s.monto} currency={s.currency} size="lg" /> },
            { k: "Prima estimada (demo)", v: <Amount value={prima} currency={s.currency} size="lg" /> },
            { k: "Plazo", v: <span className="t-amount-lg">{Math.round((new Date(s.vigenciaHasta).getTime() - new Date(s.vigenciaDesde).getTime()) / 86400000)}<span className="text-sm text-fg-muted font-medium ml-1">días</span></span> },
          ].map((m) => (
            <div key={m.k} className="border border-line rounded-card px-4 py-3 bg-subtle">
              <p className="t-help text-fg-muted">{m.k}</p>
              {m.v}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Comparación: solicitado vs. propuesto" subtitle="Condiciones sujetas a decisión"
        actions={<Switch checked={onlyChanges} onChange={setOnlyChanges} label="Sólo diferencias" />} bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full t-table">
            <thead>
              <tr className="bg-subtle text-fg-muted text-left">
                <th className="font-medium h-9 pl-4 pr-3 border-b border-line w-[28%]">Condición</th>
                <th className="font-medium h-9 px-3 border-b border-line">Solicitado por el cliente</th>
                <th className="font-medium h-9 px-3 border-b border-line">Propuesto por suscripción</th>
                <th className="font-medium h-9 pr-4 border-b border-line w-[110px] text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.campo} className={cn(r.cambia && "bg-warning-soft/50")}>
                  <td className="pl-4 pr-3 py-2.5 border-b border-line font-medium">{r.campo}</td>
                  <td className={cn("px-3 py-2.5 border-b border-line tnum", r.cambia && "text-fg-muted line-through decoration-fg-subtle")}>{r.solicitado}</td>
                  <td className={cn("px-3 py-2.5 border-b border-line tnum", r.cambia && "font-medium")}>{r.propuesto}</td>
                  <td className="pr-4 py-2.5 border-b border-line text-right">{r.cambia ? <Tag tone="warning" icon="ArrowLeftRight">Cambia</Tag> : <span className="t-help text-fg-muted">Igual</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Capacidad y exposición del grupo" subtitle="Umbral configurado sólo para el prototipo">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap justify-between gap-2 t-body">
            <span>Grupo Ejemplo Andino · exposición vigente + esta solicitud</span>
            <span className="tnum font-medium">S/ 41,280,250.00 <span className="text-fg-muted font-normal">de S/ 48,000,000.00</span></span>
          </div>
          <ProgressBar value={86} tone="warning" label="Exposición del grupo: 86 % del umbral demo" />
          <div className="flex justify-between t-help text-fg-muted tnum"><span>0 %</span><span className="text-warning font-medium">86 %</span><span>100 %</span></div>
          <InlineAlert tone="neutral">Los umbrales, cúmulos y facultades reales están pendientes de definición de negocio. Este bloque sólo ilustra cómo se presentaría la información.</InlineAlert>
        </div>
      </Panel>
    </>
  );
}

/* ------------------------------ Documentación ------------------------------ */
function Documentos({ docs, onOpen, onValidate, onObservar, onUploaded }: { docs: Doc[]; onOpen: (d: Doc) => void; onValidate: (d: Doc) => void; onObservar: (d: Doc) => void; onUploaded: (name: string) => void }) {
  const [filter, setFilter] = useState("todos");
  const shown = docs.filter((d) => filter === "todos" || (filter === "atencion" ? ["observado", "vencido", "pendiente"].includes(d.status) : d.status === filter));
  return (
    <>
      <Panel title="Adjuntar documentos">
        <FileUpload onUploaded={(f) => onUploaded(f.name)} />
      </Panel>
      <Panel title="Documentos del expediente" bodyClass="p-0"
        actions={<Tabs variant="segmented" size="sm" ariaLabel="Filtrar documentos" value={filter} onChange={setFilter}
          tabs={[{ id: "todos", label: `Todos (${docs.length})` }, { id: "atencion", label: `Requieren atención (${docs.filter((d) => ["observado", "vencido", "pendiente"].includes(d.status)).length})` }, { id: "validado", label: "Validados" }]} />}>
        {shown.length === 0 ? <EmptyState compact icon="FileCheck2" title="Nada pendiente" body="Todos los documentos de esta vista están validados." /> : (
          <ul className="divide-y divide-line">
            {shown.map((d) => (
              <li key={d.id} className="px-4 py-3 flex flex-wrap md:flex-nowrap items-start gap-3">
                <span className={cn("h-9 w-9 rounded-control flex items-center justify-center shrink-0 border border-line", d.status === "pendiente" ? "bg-subtle text-fg-subtle border-dashed" : "bg-muted text-fg-muted")}>
                  <Icon name={d.name.endsWith(".xlsx") ? "FileSpreadsheet" : d.name.endsWith(".docx") ? "FileText" : "FileType2"} size={18} />
                </span>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex flex-wrap items-center gap-2">
                    {d.status === "pendiente" ? <span className="t-label">{d.name}</span> : <button className="t-label text-fg hv:text-fg-link hv:underline text-left" onClick={() => onOpen(d)}>{d.name}</button>}
                    {d.version > 1 && <Tag>v{d.version}</Tag>}
                  </div>
                  <p className="t-help text-fg-muted">{d.category}{d.uploaded ? ` · ${d.size} · ${d.by} · ${relative(d.uploaded)}` : " · aún no recibido"}</p>
                  {d.note && <p className={cn("t-help mt-1 flex gap-1", d.status === "observado" || d.status === "vencido" ? "text-danger" : "text-fg-muted")}><Icon name="MessageSquareWarning" size={13} className="mt-px" />{d.note}</p>}
                </div>
                <StatusBadge def={DOC_STATUS[d.status]} />
                <div className="flex items-center gap-1 ml-auto">
                  {d.status === "en_revision" && <>
                    <Button size="sm" variant="secondary" icon="Check" onClick={() => onValidate(d)}>Validar</Button>
                    <Button size="sm" variant="quiet" onClick={() => onObservar(d)}>Observar</Button>
                  </>}
                  {(d.status === "observado" || d.status === "vencido") && <Button size="sm" variant="secondary" icon="Upload">Reemplazar</Button>}
                  {d.status === "pendiente" && <Button size="sm" variant="secondary" icon="Send">Solicitar</Button>}
                  {d.status !== "pendiente" && <IconButton icon="Eye" label={`Ver ${d.name}`} size="sm" onClick={() => onOpen(d)} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

function DocDrawer({ d, onClose }: { d: Doc | null; onClose: () => void }) {
  if (!d) return null;
  return (
    <Drawer open onClose={onClose} width={560} title={d.name} subtitle={<span className="flex items-center gap-2 mt-1"><StatusBadge def={DOC_STATUS[d.status]} size="sm" />{d.category} · versión {d.version}</span>}
      footer={<><Button variant="secondary" icon="Download">Descargar</Button><Button variant="primary" onClick={onClose}>Cerrar</Button></>}>
      <div className="flex flex-col gap-5">
        <div className="aspect-[3/4] max-h-[420px] w-full max-w-full bg-muted border border-line rounded-card flex flex-col items-center justify-center gap-2 text-fg-muted">
          <Icon name="FileSearch" size={28} />
          <p className="t-body">Vista previa del documento</p>
          <p className="t-help">No disponible en el prototipo</p>
        </div>
        <DescriptionList columns={2} items={[
          { label: "Cargado por", value: d.by },
          { label: "Fecha de carga", value: d.uploaded ? dateTime(d.uploaded) : "—" },
          { label: "Tamaño", value: d.size },
          { label: "Versión", value: `v${d.version}` },
          { label: "Observación", value: d.note ?? "—", span: 2 },
        ]} />
        {d.version > 1 && (
          <div>
            <h3 className="t-sub mb-2">Versiones</h3>
            <ul className="t-body flex flex-col gap-1.5">
              <li className="flex justify-between"><span>v2 · actual</span><span className="text-fg-muted tnum">09/10/2026 15:40</span></li>
              <li className="flex justify-between text-fg-muted"><span>v1 · reemplazada</span><span className="tnum">08/10/2026 09:16</span></li>
            </ul>
          </div>
        )}
      </div>
    </Drawer>
  );
}

/* ------------------------------ Evaluación (formulario extenso agrupado + aprobaciones) ------------------------------ */
function Evaluacion({ onSaved, onDecide }: { onSaved: () => void; onDecide: () => void }) {
  const [f, setF] = useState({ clasif: "", ventas: "38,450,000.00", patrimonio: "", experiencia: "12", obras: "", reco: "", conclusion: "", cg: { pagare: true, fianza: true, deposito: false } });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState({ fin: true, exp: true, cg: true, concl: true });
  const save = async () => {
    const e: Record<string, string> = {};
    if (!f.clasif) e.clasif = "Selecciona una clasificación.";
    if (!f.patrimonio) e.patrimonio = "Ingresa el patrimonio neto del último ejercicio.";
    if (!f.reco) e.reco = "Elige una recomendación.";
    if (f.conclusion.trim().length < 20) e.conclusion = "Resume la conclusión en al menos 20 caracteres.";
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true); await new Promise((r) => setTimeout(r, 800)); setBusy(false); onSaved();
  };
  const tog = (id: keyof typeof open) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  return (
    <>
      <Panel title="Aprobaciones requeridas" subtitle="Ilustrativo · facultades por definir" bodyClass="p-0">
        <ul className="divide-y divide-line">
          {[
            { k: "Evaluación de suscripción", who: "Ana Torres · Analista", st: "En curso", tone: "info" as const, icon: "CircleDot" },
            { k: "Decisión de suscripción", who: "Instancia por definir (negocio)", st: "Pendiente", tone: "review" as const, icon: "Gavel" },
            { k: "Validación de contragarantías", who: "María Quispe · Garantías", st: "Bloqueada por subsanación", tone: "neutral" as const, icon: "Lock" },
          ].map((r, i) => (
            <li key={i} className="px-4 py-3 flex flex-wrap items-center gap-3">
              <span className="h-6 w-6 rounded-full bg-muted text-fg-muted t-caption flex items-center justify-center tnum" aria-hidden="true">{i + 1}</span>
              <div className="flex-1 min-w-[180px]"><p className="t-label">{r.k}</p><p className="t-help text-fg-muted">{r.who}</p></div>
              <StatusBadge def={{ label: r.st, tone: r.tone, icon: r.icon }} />
              {i === 1 && <Button size="sm" variant="primary" icon="Gavel" onClick={onDecide}>Registrar decisión</Button>}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Evaluación de suscripción" subtitle="Borrador · formulario ilustrativo"
        actions={<span className="t-help text-fg-muted hidden md:inline">Guardado automático: hace 3 min (simulado)</span>} bodyClass="p-0">
        {Object.keys(err).length > 0 && <div className="p-4 pb-0"><InlineAlert tone="danger" title="Completa los campos marcados para guardar la evaluación." /></div>}
        <FormSection open={open.fin} onToggle={() => tog("fin")} title="Análisis financiero" desc="Último ejercicio auditado disponible" done={!!f.clasif && !!f.patrimonio}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Field label="Clasificación interna" htmlFor="ev-clasif" required error={err.clasif} help="Escala demostrativa, no aprobada.">
              <Select id="ev-clasif" value={f.clasif} placeholder="Selecciona…" status={err.clasif ? "error" : "default"} onChange={(e) => setF({ ...f, clasif: e.target.value })}
                options={[{ value: "a", label: "Nivel A (demo)" }, { value: "b", label: "Nivel B (demo)" }, { value: "c", label: "Nivel C (demo)" }]} />
            </Field>
            <Field label="Ventas anuales" htmlFor="ev-ventas" success="Tomado de EEFF 2025 (v2)">
              <Input id="ev-ventas" prefix="S/" numeric value={f.ventas} readOnly status="success" />
            </Field>
            <Field label="Patrimonio neto" htmlFor="ev-patr" required error={err.patrimonio}>
              <Input id="ev-patr" prefix="S/" numeric placeholder="0.00" value={f.patrimonio} status={err.patrimonio ? "error" : "default"} onChange={(e) => setF({ ...f, patrimonio: e.target.value })} />
            </Field>
          </div>
        </FormSection>
        <FormSection open={open.exp} onToggle={() => tog("exp")} title="Experiencia y capacidad técnica" done={!!f.experiencia}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Field label="Años de experiencia" htmlFor="ev-exp"><Input id="ev-exp" numeric value={f.experiencia} onChange={(e) => setF({ ...f, experiencia: e.target.value })} suffix={<span className="t-help">años</span>} /></Field>
            <Field label="Obras similares ejecutadas" htmlFor="ev-obras" optional><Input id="ev-obras" numeric value={f.obras} onChange={(e) => setF({ ...f, obras: e.target.value })} /></Field>
            <Field label="Contrato en ejecución" htmlFor="ev-ejec" help="Dato no disponible en el prototipo"><Input id="ev-ejec" disabled placeholder="Integración pendiente" /></Field>
          </div>
        </FormSection>
        <FormSection open={open.cg} onToggle={() => tog("cg")} title="Contragarantías propuestas" done>
          <div className="flex flex-col gap-2.5">
            <Checkbox label="Pagaré" description="Suscrito por el tomador" checked={f.cg.pagare} onChange={() => setF({ ...f, cg: { ...f.cg, pagare: !f.cg.pagare } })} />
            <Checkbox label="Fianza solidaria" description="En subsanación (firma observada)" checked={f.cg.fianza} onChange={() => setF({ ...f, cg: { ...f.cg, fianza: !f.cg.fianza } })} />
            <Checkbox label="Depósito en garantía" checked={f.cg.deposito} onChange={() => setF({ ...f, cg: { ...f.cg, deposito: !f.cg.deposito } })} />
            <Checkbox label="Hipoteca" description="No aplicable a este tipo (supuesto de diseño)" disabled />
          </div>
        </FormSection>
        <FormSection open={open.concl} onToggle={() => tog("concl")} title="Conclusión y recomendación" done={!!f.reco && f.conclusion.length >= 20}>
          <div className="flex flex-col gap-4">
            <Field label="Recomendación" required error={err.reco}>
              <div role="radiogroup" aria-label="Recomendación" className="flex flex-col gap-2">
                {[
                  { v: "fav", l: "Favorable" },
                  { v: "cond", l: "Favorable con condiciones" },
                  { v: "desf", l: "Desfavorable" },
                ].map((o) => <Radio key={o.v} name="ev-reco" label={o.l} checked={f.reco === o.v} invalid={!!err.reco} onChange={() => setF({ ...f, reco: o.v })} />)}
              </div>
            </Field>
            <Field label="Conclusión" htmlFor="ev-concl" required error={err.conclusion} help="Se mostrará a quien registre la decisión.">
              <Textarea id="ev-concl" maxLength={800} showCount value={f.conclusion} status={err.conclusion ? "error" : "default"} onChange={(e) => setF({ ...f, conclusion: e.target.value })} />
            </Field>
          </div>
        </FormSection>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-line bg-subtle rounded-b-card">
          <Button variant="secondary">Descartar cambios</Button>
          <Button variant="primary" icon="Save" loading={busy} onClick={save}>Guardar evaluación</Button>
        </div>
      </Panel>
    </>
  );
}

function FormSection({ open, onToggle, title, desc, children, done }: { open: boolean; onToggle: () => void; title: string; desc?: string; children: React.ReactNode; done?: boolean }) {
  return (
    <section className="border-b border-line last:border-0">
      <button type="button" aria-expanded={open} onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left hv:bg-subtle">
        <Icon name={open ? "ChevronDown" : "ChevronRight"} size={16} className="text-fg-muted" />
        <span className="flex-1"><span className="t-sub block">{title}</span>{desc && <span className="t-help text-fg-muted">{desc}</span>}</span>
        {done ? <Tag tone="success" icon="Check">Completo</Tag> : <Tag tone="neutral">Incompleto</Tag>}
      </button>
      {open && <div className="px-4 pb-5 pt-1 pl-11">{children}</div>}
    </section>
  );
}

/* ------------------------------ Historial ------------------------------ */
function Historial({ hist }: { hist: Evento[] }) {
  const [mode, setMode] = useState("timeline");
  const [kinds, setKinds] = useState<string[]>([]);
  const KINDS = [
    { id: "decision", label: "Decisiones" }, { id: "return", label: "Devoluciones" }, { id: "document", label: "Documentos" }, { id: "update", label: "Cambios" }, { id: "comment", label: "Comentarios" }, { id: "system", label: "Sistema" },
  ];
  const shown = hist.filter((h) => !kinds.length || kinds.includes(h.kind));
  return (
    <Panel title="Historial de eventos" subtitle="Inmutable · registro de trazabilidad"
      actions={<Tabs variant="segmented" size="sm" ariaLabel="Modo de historial" value={mode} onChange={setMode} tabs={[{ id: "timeline", label: "Línea de tiempo", icon: "GitCommitVertical" }, { id: "audit", label: "Registro de auditoría", icon: "Table2" }]} />}>
      <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Filtrar por tipo de evento">
        {KINDS.map((k) => {
          const on = kinds.includes(k.id);
          return (
            <button key={k.id} type="button" aria-pressed={on} onClick={() => setKinds((s) => (on ? s.filter((x) => x !== k.id) : [...s, k.id]))}
              className={cn("h-7 px-2.5 rounded-control border t-label transition-colors", on ? "bg-action-soft border-action text-action-fg" : "border-line-strong text-fg-muted hv:bg-muted hv:text-fg")}>
              {k.label} <span className="tnum opacity-70">{hist.filter((h) => h.kind === k.id).length}</span>
            </button>
          );
        })}
      </div>
      {shown.length === 0 ? <EmptyState compact icon="History" title="Sin eventos de este tipo" body="Quita filtros para ver todo el historial." /> :
        mode === "timeline" ? <Timeline items={shown.map((e) => ({ ...e, ref: undefined }))} /> : <ActivityLog items={shown} />}
    </Panel>
  );
}

/* ------------------------------ Modal de decisión ------------------------------ */
type DecisionKind = "aprobar" | "condiciones" | "devolver" | "rechazar" | "elevar";
function DecisionModal({ open, onClose, onDecide, s }: { open: boolean; onClose: () => void; onDecide: (k: DecisionKind, c: string) => void; s: Solicitud }) {
  const [k, setK] = useState<DecisionKind | "">("");
  const [c, setC] = useState("");
  const [cond, setCond] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setK(""); setC(""); setCond(""); setErr({}); } }, [open]);
  const OPTS: { v: DecisionKind; l: string; d: string; tone: string }[] = [
    { v: "aprobar", l: "Favorable", d: "Continúa a emisión sin condiciones adicionales.", tone: "text-success" },
    { v: "condiciones", l: "Favorable con condiciones", d: "Registra condiciones que deberán cumplirse.", tone: "text-success" },
    { v: "devolver", l: "Devolver para subsanación", d: "Regresa al cliente/ejecutivo con observaciones.", tone: "text-warning" },
    { v: "elevar", l: "Derivar a otra instancia", d: "Cuando la decisión excede tus facultades (por definir).", tone: "text-review" },
    { v: "rechazar", l: "Desfavorable", d: "Cierra la solicitud con decisión negativa.", tone: "text-danger" },
  ];
  const submit = async () => {
    const e: Record<string, string> = {};
    if (!k) e.k = "Elige el sentido de la decisión.";
    if (c.trim().length < 10) e.c = "Fundamenta la decisión (mínimo 10 caracteres).";
    if (k === "condiciones" && cond.trim().length < 5) e.cond = "Detalla al menos una condición.";
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true); await new Promise((r) => setTimeout(r, 800)); setBusy(false);
    onDecide(k as DecisionKind, c.trim()); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} size="lg" title={`Registrar decisión · ${s.id}`} description="La decisión queda firmada con tu usuario, fecha y hora, y no puede editarse después (supuesto de diseño)."
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button><Button variant={k === "rechazar" ? "danger" : "primary"} icon="Gavel" loading={busy} onClick={submit}>Registrar decisión</Button></>}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        <div className="flex flex-col gap-4">
          <Field label="Sentido de la decisión" required error={err.k}>
            <div role="radiogroup" aria-label="Sentido de la decisión" className="flex flex-col gap-1.5">
              {OPTS.map((o) => (
                <label key={o.v} className={cn("flex gap-3 px-3 py-2.5 rounded-control border cursor-pointer transition-colors", k === o.v ? "border-action bg-action-soft" : "border-line hv:bg-subtle", err.k && !k && "border-danger/50")}>
                  <Radio name="dec" checked={k === o.v} onChange={() => setK(o.v)} aria-label={o.l} />
                  <span><span className={cn("t-label block", k === o.v && o.tone)}>{o.l}</span><span className="t-help text-fg-muted">{o.d}</span></span>
                </label>
              ))}
            </div>
          </Field>
          {k === "condiciones" && (
            <Field label="Condiciones" htmlFor="dec-cond" required error={err.cond}>
              <Textarea id="dec-cond" value={cond} onChange={(e) => setCond(e.target.value)} placeholder="Ej.: Constituir fianza solidaria con firma legalizada antes de emitir." status={err.cond ? "error" : "default"} />
            </Field>
          )}
          <Field label="Fundamento" htmlFor="dec-c" required error={err.c} help="Visible en el historial y en el registro de auditoría.">
            <Textarea id="dec-c" value={c} maxLength={1000} showCount onChange={(e) => setC(e.target.value)} status={err.c ? "error" : "default"} />
          </Field>
        </div>
        <aside className="flex flex-col gap-3 bg-subtle border border-line rounded-card p-4 h-fit">
          <p className="t-module text-fg-muted">Contexto de la decisión</p>
          <DescriptionList columns={1} items={[
            { label: "Suma asegurada", value: <Amount value={s.monto} currency={s.currency} /> },
            { label: "Recomendación del analista", value: "Favorable con condiciones (borrador)" },
            { label: "Documentos con observación", value: <span className="text-danger">2</span> },
            { label: "Exposición del grupo", value: "86 % del umbral demo" },
          ]} />
        </aside>
      </div>
    </Modal>
  );
}
