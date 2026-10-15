import React, { useMemo, useState } from "react";
import { PageHeader, PageBody } from "../shell/AppShell";
import { useApp } from "../shell/AppContext";
import { Button, IconButton, Checkbox } from "../components/ui/controls";
import { Panel, Tabs, StatusBadge, Timeline, InlineAlert, Tag, Avatar, DataTable, DescriptionList, type Column } from "../components/ui/data";
import { ConfirmDialog, Tooltip, useToast } from "../components/ui/overlays";
import { ACTIVITY_STATUS, INSTRUMENT_STATUS, TONE_CLASSES, type ActivityStatus } from "../domain/status";
import { ACTIVIDADES, LANES, DECISIONES, INFO_PENDIENTE, EVENTOS_EMISION, CURRENT_USER, type Actividad, type Evento } from "../data/mock";
import { relative, dateTime } from "../lib/format";
import { Icon } from "../lib/icon";
import { cn } from "../lib/cn";

// Fila relativa en el mapa (orden de dependencia, NO etapa del VS-03)
const ROW: Record<string, number> = { A1: 0, A2: 1, A3: 1, A4: 2, A6: 2, A9: 2, A5: 3, A7: 3, A8: 4, A10: 5, A11: 6, A12: 7 };

export function Emision() {
  const { go } = useApp();
  const toast = useToast();
  const [acts, setActs] = useState<Actividad[]>(ACTIVIDADES);
  const [sel, setSel] = useState<string>("A10");
  const [view, setView] = useState("mapa");
  const [events, setEvents] = useState<Evento[]>(EVENTOS_EMISION);
  const [info, setInfo] = useState(INFO_PENDIENTE);
  const [decisions, setDecisions] = useState(DECISIONES);
  const [confirm, setConfirm] = useState<null | { kind: "aprobar" | "devolver" | "subsanar" | "revisar"; act: Actividad; decisionId?: string }>(null);
  const [laneFilter, setLaneFilter] = useState<string>("todos");

  const byId = (id: string) => acts.find((a) => a.id === id)!;
  const current = byId(sel);
  const dependents = acts.filter((a) => a.deps.includes(sel));
  const done = acts.filter((a) => a.status === "completada").length;
  const counts = (Object.keys(ACTIVITY_STATUS) as ActivityStatus[]).map((k) => ({ k, n: acts.filter((a) => a.status === k).length })).filter((x) => x.n > 0);
  const blockers = (a: Actividad) => a.deps.filter((d) => byId(d).status !== "completada");
  const emitBlockers = ["A10", "A9", "A11"].map(byId).filter((a) => a.status !== "completada" && a.id !== "A11");

  const log = (action: string, ref: string, kind: Evento["kind"]) => setEvents((e) => [{ id: Math.random().toString(36), who: CURRENT_USER.name, action, ref, when: "2026-10-15T11:30:00", kind }, ...e]);
  const setStatus = (id: string, status: ActivityStatus) => setActs((as) => {
    let next = as.map((a) => (a.id === id ? { ...a, status, since: "2026-10-15T11:30:00" } : a));
    // Desbloqueo automático ilustrativo cuando todas las dependencias se completan
    next = next.map((a) => (a.status === "bloqueada" && a.deps.every((d) => next.find((x) => x.id === d)!.status === "completada") ? { ...a, status: "no_iniciada" } : a));
    return next;
  });

  const related = new Set([sel, ...current.deps, ...dependents.map((d) => d.id)]);

  return (
    <>
      <PageHeader
        back={{ label: "Solicitud SOL-2026-0131", onClick: () => go("expediente", { id: "SOL-2026-0131" }) }}
        module="Workspace de emisión"
        title={<span className="inline-flex flex-wrap items-center gap-3"><span className="t-ref text-xl font-semibold">EMI-2026-0089</span><Tag tone="neutral" icon="FileStack">Fiel cumplimiento</Tag></span>}
        description={<><span className="text-fg font-medium">Consorcio Vial Demo Norte</span> a favor de <span className="text-fg font-medium">Proyecto Especial Ilustrativo</span> · S/ 12,400,000.00 · 365 días</>}
        actions={<>
          <Button variant="secondary" icon="FileSearch" onClick={() => toast.push({ tone: "info", title: "Vista previa generada", body: "Borrador del instrumento con marca de agua «SIN VALOR» (simulado)." })}>Vista previa del instrumento</Button>
          <Tooltip content={emitBlockers.length ? `Pendiente: ${emitBlockers.map((b) => b.name).join(" · ")}` : "Listo para emitir"}>
            <Button variant="primary" icon="FileCheck2" aria-disabled={emitBlockers.length > 0} className={cn(emitBlockers.length > 0 && "bg-muted text-fg-subtle hv:bg-muted cursor-not-allowed")}
              onClick={() => emitBlockers.length ? toast.push({ tone: "warning", title: "Aún no se puede emitir", body: `Resuelve: ${emitBlockers.map((b) => b.name).join(", ")}.` }) : toast.push({ tone: "success", title: "Instrumento emitido (simulado)", body: "CAU-2026-004812" })}>
              Emitir instrumento
            </Button>
          </Tooltip>
        </>}
        meta={
          <div className="flex flex-wrap items-stretch gap-x-8 gap-y-3 mt-1">
            <div className="flex flex-col gap-1">
              <span className="t-help text-fg-muted">Estado del instrumento</span>
              <StatusBadge def={INSTRUMENT_STATUS.no_emitido} variant="outline" />
            </div>
            <div className="flex flex-col gap-1.5 min-w-[260px] flex-1 max-w-[460px]">
              <span className="t-help text-fg-muted flex justify-between"><span>Avance operacional</span><span className="tnum text-fg font-medium">{done} de {acts.length} actividades completadas</span></span>
              <div className="flex h-2 rounded-full overflow-hidden bg-muted gap-px" aria-hidden="true">
                {counts.map(({ k, n }) => <span key={k} className={TONE_CLASSES[ACTIVITY_STATUS[k].tone].dot} style={{ width: `${(n / acts.length) * 100}%` }} title={`${ACTIVITY_STATUS[k].label}: ${n}`} />)}
              </div>
            </div>
            <div className="flex gap-6">
              {[
                { l: "Decisiones pendientes", n: decisions.length, c: "text-review" },
                { l: "Devoluciones", n: acts.reduce((s, a) => s + (a.returns ?? 0), 0), c: "text-warning" },
                { l: "Bloqueadas", n: acts.filter((a) => a.status === "bloqueada").length, c: "text-fg-muted" },
              ].map((m) => (
                <div key={m.l} className="flex flex-col"><span className="t-help text-fg-muted">{m.l}</span><span className={cn("t-section tnum", m.c)}>{m.n}</span></div>
              ))}
            </div>
          </div>
        }
      />

      <PageBody>
        <InlineAlert tone="info" title="Actividades ilustrativas">
          El mapa muestra frentes de trabajo paralelos y sus dependencias. Las actividades no equivalen a las 12 etapas del VS-03 ni son estados del instrumento; su catálogo definitivo está pendiente de validación.
        </InlineAlert>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-[var(--section-gap)] items-start">
          <Panel title="Progreso operacional" flush
            actions={<div className="flex items-center gap-2">
              <Tabs variant="segmented" size="sm" ariaLabel="Vista" value={view} onChange={setView} tabs={[{ id: "mapa", label: "Mapa", icon: "Workflow" }, { id: "lista", label: "Lista", icon: "List" }]} />
            </div>}>
            {view === "mapa" ? (
              <div className="p-4">
                <Legend />
                <div className="hidden lg:block overflow-x-auto">
                  <div className="min-w-[680px] grid grid-cols-4 gap-x-3" role="grid" aria-label="Mapa de actividades por frente de trabajo">
                    {LANES.map((l) => (
                      <div key={l} role="columnheader" className="t-module text-fg-muted pb-2 mb-2 border-b border-line">{l}</div>
                    ))}
                    {Array.from({ length: 8 }).map((_, r) => (
                      <React.Fragment key={r}>
                        {LANES.map((lane) => {
                          const a = acts.find((x) => x.lane === lane && ROW[x.id] === r);
                          return (
                            <div key={lane} role="gridcell" className={cn("py-1.5 relative", "bg-[linear-gradient(to_right,transparent_calc(50%-0.5px),var(--border-default)_calc(50%-0.5px),var(--border-default)_calc(50%+0.5px),transparent_calc(50%+0.5px))] bg-no-repeat")}
                              style={{ backgroundSize: a ? "0 0" : "100% 100%" }}>
                              {a && <Node a={a} selected={sel === a.id} related={related.has(a.id)} dim={!related.has(a.id)} blockers={blockers(a).length} onClick={() => setSel(a.id)} />}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                {/* Vista compacta (< 1024 px): frentes apilados, mismo orden relativo y mismas dependencias resaltadas */}
                <div className="lg:hidden flex flex-col gap-4">
                  {LANES.map((lane) => (
                    <section key={lane} aria-label={lane}>
                      <h3 className="t-module text-fg-muted pb-1.5 mb-2 border-b border-line">{lane}</h3>
                      <div className="flex flex-col gap-2">
                        {acts.filter((x) => x.lane === lane).sort((x, y) => ROW[x.id] - ROW[y.id]).map((a) => (
                          <Node key={a.id} a={a} selected={sel === a.id} related={related.has(a.id)} dim={false} blockers={blockers(a).length} onClick={() => setSel(a.id)} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            ) : (
              <ActivityTable acts={acts} sel={sel} onSel={setSel} laneFilter={laneFilter} setLaneFilter={setLaneFilter} />
            )}
          </Panel>

          {/* Detalle de actividad seleccionada */}
          <Panel title="Actividad seleccionada" className="xl:sticky xl:top-4" bodyClass="p-0">
            <div className="p-4 flex flex-col gap-4">
              <div>
                <p className="t-help text-fg-muted">{current.lane}</p>
                <h3 className="t-section">{current.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <StatusBadge def={ACTIVITY_STATUS[current.status]} />
                  {current.returns ? <Tag tone="warning" icon="Undo2">{current.returns} {current.returns === 1 ? "retorno" : "retornos"}</Tag> : null}
                </div>
              </div>
              <p className="t-body">{current.detail}</p>
              <DescriptionList columns={2} items={[
                { label: "Responsable", value: <span className="inline-flex items-center gap-1.5"><Avatar name={current.owner} size={20} />{current.owner}</span> },
                { label: "Último cambio", value: current.since ? relative(current.since) : "—" },
              ]} />
              <div>
                <p className="t-label mb-1.5">Depende de</p>
                {current.deps.length === 0 ? <p className="t-help text-fg-muted">Sin dependencias</p> : (
                  <ul className="flex flex-col gap-1">
                    {current.deps.map((d) => { const x = byId(d); return (
                      <li key={d}><button onClick={() => setSel(d)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-control hv:bg-muted text-left">
                        <Icon name={ACTIVITY_STATUS[x.status].icon} size={14} className={TONE_CLASSES[ACTIVITY_STATUS[x.status].tone].fg} />
                        <span className="flex-1 t-body truncate">{x.name}</span>
                        <span className={cn("t-help", x.status === "completada" ? "text-success" : "text-fg-muted")}>{x.status === "completada" ? "Lista" : ACTIVITY_STATUS[x.status].label}</span>
                      </button></li>
                    ); })}
                  </ul>
                )}
              </div>
              {dependents.length > 0 && (
                <div>
                  <p className="t-label mb-1.5">Habilita a</p>
                  <div className="flex flex-wrap gap-1.5">{dependents.map((d) => <button key={d.id} onClick={() => setSel(d.id)} className="h-6 px-2 rounded-badge bg-muted t-caption hv:bg-line">{d.name}</button>)}</div>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-line bg-subtle rounded-b-card flex flex-wrap gap-2">
              {current.status === "devuelta" && <Button size="sm" variant="primary" icon="RotateCcw" onClick={() => setConfirm({ kind: "subsanar", act: current })}>Registrar subsanación</Button>}
              {current.status === "esperando_decision" && <>
                <Button size="sm" variant="primary" icon="Gavel" onClick={() => setConfirm({ kind: "aprobar", act: current, decisionId: "dc1" })}>Registrar decisión</Button>
                <Button size="sm" variant="secondary" icon="Undo2" onClick={() => setConfirm({ kind: "devolver", act: current })}>Devolver</Button>
              </>}
              {current.status === "en_revision" && <Button size="sm" variant="primary" icon="Check" onClick={() => setConfirm({ kind: "revisar", act: current })}>Completar revisión</Button>}
              {current.status === "pendiente_info" && <Button size="sm" variant="secondary" icon="MailQuestion" onClick={() => { log(`reiteró pedido de información en «${current.name}»`, current.id, "update"); toast.push({ tone: "info", title: "Recordatorio enviado (simulado)" }); }}>Reiterar pedido</Button>}
              {current.status === "en_curso" && <Button size="sm" variant="primary" icon="Check" onClick={() => { setStatus(current.id, "completada"); log(`completó «${current.name}»`, current.id, "update"); toast.push({ tone: "success", title: "Actividad completada", body: current.name }); }}>Marcar completada</Button>}
              {current.status === "bloqueada" && <p className="t-help text-fg-muted flex items-center gap-1.5"><Icon name="Lock" size={14} />Se habilita al completar: {blockers(current).map((b) => byId(b).name).join(", ")}</p>}
              {current.status === "completada" && <Button size="sm" variant="secondary" icon="RotateCcw" onClick={() => { setStatus(current.id, "en_curso"); log(`reabrió «${current.name}» para reevaluación`, current.id, "return"); toast.push({ tone: "warning", title: "Actividad reabierta", body: "Las dependientes conservan su estado; revisa su vigencia." }); }}>Reabrir</Button>}
              {current.status === "no_iniciada" && <Button size="sm" variant="secondary" icon="Play" onClick={() => setStatus(current.id, "en_curso")}>Iniciar</Button>}
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <Panel title="Decisiones humanas pendientes" subtitle={`${decisions.length}`} flush>
            {decisions.length === 0 ? <p className="p-4 t-body text-fg-muted">No hay decisiones pendientes.</p> : (
              <ul className="divide-y divide-line">
                {decisions.map((d) => (
                  <li key={d.id} className="px-4 py-3 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <Icon name="Gavel" size={16} className="text-review mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="t-label">{d.title}</p>
                        <p className="t-help text-fg-muted">{d.context}</p>
                        <p className="t-help text-fg-subtle mt-0.5">Solicitada por {d.requestedBy} · {relative(d.when)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pl-6">
                      <Button size="sm" variant="secondary" onClick={() => { setSel(d.activity); setConfirm({ kind: "aprobar", act: byId(d.activity), decisionId: d.id }); }}>Decidir</Button>
                      <Button size="sm" variant="quiet" onClick={() => setSel(d.activity)}>Ver actividad</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Información pendiente" subtitle={`${info.filter((i) => !i.done).length} por recibir`} flush>
            <ul className="divide-y divide-line">
              {info.map((i) => (
                <li key={i.id} className="px-4 py-2.5 flex items-start gap-2">
                  <Checkbox aria-label={i.label} checked={i.done} onChange={() => { setInfo((s) => s.map((x) => (x.id === i.id ? { ...x, done: !x.done } : x))); if (!i.done) { log(`marcó como recibido: ${i.label}`, i.activity, "document"); toast.push({ tone: "success", title: "Información recibida", body: i.label }); } }} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("t-body", i.done && "line-through text-fg-muted")}>{i.label}</p>
                    <p className="t-help text-fg-muted">Responsable: {i.owner} · <button className="text-fg-link hv:underline" onClick={() => setSel(i.activity)}>{byId(i.activity).name}</button></p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Eventos relevantes">
            <Timeline dense items={events.slice(0, 6).map((e) => ({ ...e, ref: undefined, action: <>{e.action} <button className="t-help text-fg-link hv:underline" onClick={() => setSel(e.ref)}>· {byId(e.ref)?.name}</button></> }))} />
          </Panel>
        </div>
      </PageBody>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} requireComment
        tone={confirm?.kind === "devolver" ? "danger" : "default"}
        title={{ aprobar: "Registrar decisión de aprobación", devolver: "Devolver para subsanación", subsanar: "Registrar subsanación", revisar: "Completar revisión" }[confirm?.kind ?? "aprobar"]}
        confirmLabel={{ aprobar: "Aprobar emisión", devolver: "Devolver", subsanar: "Registrar subsanación", revisar: "Completar revisión" }[confirm?.kind ?? "aprobar"]}
        commentLabel={confirm?.kind === "devolver" ? "Motivo de la devolución" : "Fundamento"}
        body={confirm ? <>Actividad: <strong className="font-medium">{confirm.act.name}</strong>. {confirm.kind === "aprobar" ? "La facultad de aprobación real está pendiente de definición; esta acción es ilustrativa." : confirm.kind === "subsanar" ? "La actividad volverá a revisión." : ""}</> : null}
        onConfirm={(c) => {
          if (!confirm) return;
          const a = confirm.act;
          if (confirm.kind === "aprobar") { setStatus(a.id, "completada"); setDecisions((ds) => ds.filter((d) => d.activity !== a.id)); log(`aprobó «${a.name}»: ${c}`, a.id, "decision"); toast.push({ tone: "success", title: "Decisión registrada", body: a.name }); }
          if (confirm.kind === "devolver") { setStatus(a.id, "devuelta"); setActs((as) => as.map((x) => (x.id === a.id ? { ...x, returns: (x.returns ?? 0) + 1 } : x))); log(`devolvió «${a.name}»: ${c}`, a.id, "return"); toast.push({ tone: "warning", title: "Actividad devuelta", body: a.name }); }
          if (confirm.kind === "subsanar") { setStatus(a.id, "en_revision"); log(`registró subsanación en «${a.name}»: ${c}`, a.id, "document"); toast.push({ tone: "success", title: "Subsanación registrada", body: "La actividad pasó a revisión." }); }
          if (confirm.kind === "revisar") { setStatus(a.id, "completada"); setDecisions((ds) => ds.filter((d) => d.activity !== a.id)); log(`completó la revisión de «${a.name}»`, a.id, "decision"); toast.push({ tone: "success", title: "Revisión completada", body: a.name }); }
        }} />
    </>
  );
}

function Legend() {
  const items: ActivityStatus[] = ["completada", "en_curso", "en_revision", "esperando_decision", "pendiente_info", "devuelta", "bloqueada", "no_iniciada"];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4" aria-label="Leyenda de estados">
      {items.map((k) => (
        <li key={k} className={cn("inline-flex items-center gap-1 t-help", TONE_CLASSES[ACTIVITY_STATUS[k].tone].fg)}>
          <Icon name={ACTIVITY_STATUS[k].icon} size={13} strokeWidth={2} />
          <span className="text-fg-muted">{ACTIVITY_STATUS[k].label}</span>
        </li>
      ))}
    </ul>
  );
}

function Node({ a, selected, related, dim, blockers, onClick }: { a: Actividad; selected: boolean; related: boolean; dim: boolean; blockers: number; onClick: () => void }) {
  const def = ACTIVITY_STATUS[a.status];
  const t = TONE_CLASSES[def.tone];
  const dashed = a.status === "no_iniciada" || a.status === "bloqueada";
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      aria-label={`${a.name}. ${def.label}. Responsable ${a.owner}.`}
      className={cn("w-full text-left rounded-control border bg-surface px-2.5 py-2 flex flex-col gap-1 transition-[opacity,box-shadow,border-color] relative",
        dashed ? "border-dashed border-line-strong" : "border-line",
        selected ? "border-action shadow-[0_0_0_2px_var(--action)]" : related ? "shadow-popover border-line-strong" : "hv:border-line-strong",
        dim && "opacity-70 hv:opacity-100")}>
      <span className={cn("absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full", t.dot)} aria-hidden="true" />
      <span className="flex items-start gap-1.5">
        <Icon name={def.icon} size={14} strokeWidth={2} className={cn("mt-0.5 shrink-0", t.fg)} />
        <span className="t-label flex-1">{a.name}</span>
      </span>
      <span className="flex items-center gap-2 t-help text-fg-muted pl-5">
        <span className="flex-1 min-w-0">{def.label}</span>
        {a.returns ? <span className="inline-flex items-center gap-0.5 text-warning" title={`${a.returns} retornos`}><Icon name="Undo2" size={12} />{a.returns}</span> : null}
        {blockers > 0 && a.status !== "completada" ? <span className="inline-flex items-center gap-0.5" title={`${blockers} dependencias abiertas`}><Icon name="Link2" size={12} />{blockers}</span> : null}
      </span>
    </button>
  );
}

function ActivityTable({ acts, sel, onSel, laneFilter, setLaneFilter }: { acts: Actividad[]; sel: string; onSel: (id: string) => void; laneFilter: string; setLaneFilter: (s: string) => void }) {
  const byId = (id: string) => acts.find((a) => a.id === id)!;
  const cols: Column<Actividad>[] = [
    { id: "name", header: "Actividad", cell: (a) => <span className="font-medium">{a.name}</span> },
    { id: "lane", header: "Frente", cell: (a) => <span className="text-fg-muted whitespace-nowrap">{a.lane}</span>, hideBelow: "lg" },
    { id: "status", header: "Estado", cell: (a) => <StatusBadge def={ACTIVITY_STATUS[a.status]} size="sm" /> },
    { id: "owner", header: "Responsable", cell: (a) => <span className="whitespace-nowrap">{a.owner}</span>, hideBelow: "xl" },
    { id: "deps", header: "Depende de", cell: (a) => a.deps.length ? <span className="t-help text-fg-muted">{a.deps.map((d) => byId(d).name).join(", ")}</span> : <span className="text-fg-subtle">—</span> },
    { id: "since", header: "Último cambio", align: "right", cell: (a) => <span className="text-fg-muted whitespace-nowrap">{a.since ? relative(a.since) : "—"}</span> },
  ];
  const rows = acts.filter((a) => laneFilter === "todos" || a.lane === laneFilter);
  return (
    <div>
      <div className="px-4 py-2.5 border-b border-line">
        <Tabs variant="segmented" size="sm" ariaLabel="Filtrar por frente" value={laneFilter} onChange={setLaneFilter}
          tabs={[{ id: "todos", label: "Todos" }, ...LANES.map((l) => ({ id: l, label: l }))]} />
      </div>
      <DataTable columns={cols} rows={rows} onRowClick={(a) => onSel(a.id)} activeRowId={sel} density="compact" caption="Actividades de emisión" />
    </div>
  );
}
