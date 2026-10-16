import React, { useState } from "react";
import { Panel, Tabs, StatusBadge, Timeline, Tag, Avatar, DataTable, DescriptionList, type Column } from "../../components/ui/data";
import { Button, Checkbox } from "../../components/ui/controls";
import { Icon } from "../../lib/icon";
import { cn } from "../../lib/cn";
import { date, relative } from "../../lib/format";
import type { OperacionEmision, ActividadWorkflow } from "../../domain/emision";
import { ACTIVITY_STATUS, TONE_CLASSES, type ActivityStatus } from "../../domain/status";
import { LANES } from "../../data/mock";

// Mapeo de filas relativas para la visualización del mapa
const ROW_MAP: Record<string, number> = {
  A1: 0,
  A2: 1,
  A3: 1,
  A4: 2,
  A6: 2,
  A9: 2,
  A5: 3,
  A7: 3,
  A8: 4,
  A10: 5,
  A11: 6,
  A12: 7,
};

interface Props {
  operacion: OperacionEmision;
  selectedActId: string;
  onSelectActId: (id: string) => void;
  onUpdateActividadStatus: (id: string, status: ActivityStatus) => void;
  onOpenDecisionModal: (act: ActividadWorkflow, kind: "aprobar" | "devolver" | "subsanar" | "observar") => void;
}

export function WorkspaceSeguimiento({
  operacion,
  selectedActId,
  onSelectActId,
  onUpdateActividadStatus,
  onOpenDecisionModal,
}: Props) {
  const [view, setView] = useState<"mapa" | "lista">("mapa");
  const [laneFilter, setLaneFilter] = useState<string>("todos");

  const acts = operacion.actividades;
  const current = acts.find((a) => a.id === selectedActId) ?? acts[0];
  const byId = (id: string) => acts.find((a) => a.id === id);

  const dependents = acts.filter((a) => a.deps.includes(current.id));
  const blockers = (a: ActividadWorkflow) =>
    a.deps.filter((d) => {
      const act = byId(d);
      return act && act.status !== "completada";
    });

  const related = new Set([current.id, ...current.deps, ...dependents.map((d) => d.id)]);

  const slaLabels = {
    en_plazo: { label: "En plazo SLA", tone: "success" as const },
    por_vencer: { label: "Por vencer SLA", tone: "warning" as const },
    excedido: { label: "SLA excedido", tone: "danger" as const },
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
        {/* Panel del Workflow (Mapa o Lista) */}
        <Panel
          title="Seguimiento operacional transversal"
          subtitle={`${acts.filter((a) => a.status === "completada").length} de ${acts.length} actividades completadas`}
          flush
          actions={
            <div className="flex items-center gap-2">
              <Tabs
                variant="segmented"
                size="sm"
                ariaLabel="Vista del workflow"
                value={view}
                onChange={(v) => setView(v as "mapa" | "lista")}
                tabs={[
                  { id: "mapa", label: "Mapa interactivo", icon: "Workflow" },
                  { id: "lista", label: "Vista tabular", icon: "List" },
                ]}
              />
            </div>
          }
        >
          {view === "mapa" ? (
            <div className="p-4">
              <Legend />

              {/* Vista en Grid para Desktop (≥ 1024px) */}
              <div className="hidden lg:block overflow-x-auto">
                <div
                  className="min-w-[680px] grid grid-cols-4 gap-x-3"
                  role="grid"
                  aria-label="Mapa de actividades por frente de trabajo"
                >
                  {LANES.map((lane) => (
                    <div
                      key={lane}
                      role="columnheader"
                      className="t-module text-fg-muted pb-2 mb-2 border-b border-line truncate"
                    >
                      {lane}
                    </div>
                  ))}

                  {Array.from({ length: 8 }).map((_, r) => (
                    <React.Fragment key={r}>
                      {LANES.map((lane) => {
                        const a = acts.find((x) => x.lane === lane && (ROW_MAP[x.id] ?? 0) === r);
                        return (
                          <div
                            key={lane}
                            role="gridcell"
                            className={cn(
                              "py-1.5 relative",
                              "bg-[linear-gradient(to_right,transparent_calc(50%-0.5px),var(--border-default)_calc(50%-0.5px),var(--border-default)_calc(50%+0.5px),transparent_calc(50%+0.5px))] bg-no-repeat"
                            )}
                            style={{ backgroundSize: a ? "0 0" : "100% 100%" }}
                          >
                            {a && (
                              <WorkflowNode
                                a={a}
                                selected={selectedActId === a.id}
                                related={related.has(a.id)}
                                dim={!related.has(a.id)}
                                blockersCount={blockers(a).length}
                                onClick={() => onSelectActId(a.id)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Vista móvil apilada por frentes (< 1024px) */}
              <div className="lg:hidden flex flex-col gap-4">
                {LANES.map((lane) => (
                  <section key={lane} aria-label={lane}>
                    <h3 className="t-module text-fg-muted pb-1.5 mb-2 border-b border-line">{lane}</h3>
                    <div className="flex flex-col gap-2">
                      {acts
                        .filter((x) => x.lane === lane)
                        .sort((x, y) => (ROW_MAP[x.id] ?? 0) - (ROW_MAP[y.id] ?? 0))
                        .map((a) => (
                          <WorkflowNode
                            key={a.id}
                            a={a}
                            selected={selectedActId === a.id}
                            related={related.has(a.id)}
                            dim={false}
                            blockersCount={blockers(a).length}
                            onClick={() => onSelectActId(a.id)}
                          />
                        ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <ActivityTable
              acts={acts}
              sel={selectedActId}
              onSel={onSelectActId}
              laneFilter={laneFilter}
              setLaneFilter={setLaneFilter}
            />
          )}
        </Panel>

        {/* Panel lateral de la actividad seleccionada */}
        <Panel title="Detalle de actividad seleccionada" className="xl:sticky xl:top-4" bodyClass="p-0">
          <div className="p-4 flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="t-help text-fg-muted font-medium">{current.lane}</span>
                <span className="t-ref text-xs text-fg-muted font-mono">{current.id}</span>
              </div>
              <h3 className="t-section text-fg">{current.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <StatusBadge def={ACTIVITY_STATUS[current.status]} />
                {current.returns ? (
                  <Tag tone="warning" icon="Undo2">
                    {current.returns} {current.returns === 1 ? "retorno" : "retornos"}
                  </Tag>
                ) : null}
                <Tag tone={slaLabels[current.slaEstado].tone}>
                  {slaLabels[current.slaEstado].label} ({current.slaHoras}h)
                </Tag>
              </div>
            </div>

            <p className="t-body text-fg">{current.detail}</p>

            {current.observaciones && current.observaciones.length > 0 && (
              <div className="p-2.5 rounded-control bg-warning-soft border border-warning text-xs">
                <strong className="text-warning block mb-1 flex items-center gap-1">
                  <Icon name="CircleAlert" size={12} />
                  Observación registrada:
                </strong>
                <ul className="list-disc pl-4 text-warning space-y-0.5">
                  {current.observaciones.map((obs, i) => (
                    <li key={i}>{obs}</li>
                  ))}
                </ul>
              </div>
            )}

            <DescriptionList
              columns={2}
              items={[
                {
                  label: "Responsable",
                  value: (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Avatar name={current.owner} size={20} />
                      {current.owner}
                    </span>
                  ),
                },
                {
                  label: "Frente de trabajo",
                  value: <span>{current.frente}</span>,
                },
                {
                  label: "Prioridad",
                  value: (
                    <span className={current.prioridad === "alta" ? "text-danger font-semibold" : ""}>
                      {current.prioridad === "alta" ? "Alta" : "Normal"}
                    </span>
                  ),
                },
                {
                  label: "Último cambio",
                  value: current.since ? relative(current.since) : "—",
                },
              ]}
            />

            {/* Dependencias previas */}
            <div>
              <p className="t-label mb-1.5 flex items-center justify-between">
                <span>Depende de (prerrequisitos)</span>
                {blockers(current).length > 0 && (
                  <span className="t-help text-danger font-medium flex items-center gap-1">
                    <Icon name="Lock" size={12} />
                    {blockers(current).length} bloqueos activos
                  </span>
                )}
              </p>
              {current.deps.length === 0 ? (
                <p className="t-help text-fg-muted">Sin dependencias (Actividad raíz de entrada)</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {current.deps.map((d) => {
                    const x = byId(d);
                    if (!x) return null;
                    const isDone = x.status === "completada";
                    return (
                      <li key={d}>
                        <button
                          type="button"
                          onClick={() => onSelectActId(d)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-control text-left transition-colors border",
                            isDone ? "bg-subtle border-line hv:bg-muted" : "bg-danger-soft border-danger"
                          )}
                        >
                          <Icon
                            name={ACTIVITY_STATUS[x.status].icon}
                            size={14}
                            className={TONE_CLASSES[ACTIVITY_STATUS[x.status].tone].fg}
                          />
                          <span className="flex-1 t-body truncate font-medium text-fg">{x.name}</span>
                          <span className={cn("t-help font-medium", isDone ? "text-success" : "text-danger")}>
                            {isDone ? "Completada" : ACTIVITY_STATUS[x.status].label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Actividades que habilita */}
            {dependents.length > 0 && (
              <div>
                <p className="t-label mb-1.5">Habilita a (posteriores)</p>
                <div className="flex flex-wrap gap-1.5">
                  {dependents.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => onSelectActId(d.id)}
                      className="h-6 px-2.5 rounded-badge bg-muted text-fg t-caption hv:bg-line border border-line"
                    >
                      {d.id}: {d.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción contextual sobre la actividad */}
          <div className="px-4 py-3 border-t border-line bg-subtle rounded-b-card flex flex-wrap gap-2">
            {current.status === "esperando_decision" && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  icon="Gavel"
                  onClick={() => onOpenDecisionModal(current, "aprobar")}
                >
                  Registrar decisión
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon="Undo2"
                  onClick={() => onOpenDecisionModal(current, "devolver")}
                >
                  Devolver
                </Button>
              </>
            )}

            {current.status === "devuelta" && (
              <Button
                size="sm"
                variant="primary"
                icon="RotateCcw"
                onClick={() => onOpenDecisionModal(current, "subsanar")}
              >
                Registrar subsanación
              </Button>
            )}

            {current.status === "en_revision" && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  icon="Check"
                  onClick={() => onUpdateActividadStatus(current.id, "completada")}
                >
                  Aprobar revisión
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon="CircleAlert"
                  onClick={() => onOpenDecisionModal(current, "observar")}
                >
                  Observar
                </Button>
              </>
            )}

            {current.status === "pendiente_info" && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  icon="Check"
                  onClick={() => onUpdateActividadStatus(current.id, "en_revision")}
                >
                  Marcar información recibida
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon="MailQuestion"
                  onClick={() => onOpenDecisionModal(current, "observar")}
                >
                  Reiterar requerimiento
                </Button>
              </>
            )}

            {current.status === "en_curso" && (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  icon="Check"
                  onClick={() => onUpdateActividadStatus(current.id, "completada")}
                >
                  Marcar completada
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon="Undo2"
                  onClick={() => onOpenDecisionModal(current, "devolver")}
                >
                  Devolver
                </Button>
              </>
            )}

            {current.status === "bloqueada" && (
              <p className="t-help text-fg-muted flex items-center gap-1.5">
                <Icon name="Lock" size={14} className="text-danger" />
                <span>
                  Bloqueada hasta completar:{" "}
                  <strong>{blockers(current).map((b) => byId(b)?.name).join(", ")}</strong>
                </span>
              </p>
            )}

            {current.status === "completada" && (
              <Button
                size="sm"
                variant="secondary"
                icon="RotateCcw"
                onClick={() => onUpdateActividadStatus(current.id, "en_curso")}
              >
                Reabrir para reevaluación
              </Button>
            )}

            {current.status === "no_iniciada" && (
              <Button
                size="sm"
                variant="secondary"
                icon="Play"
                onClick={() => onUpdateActividadStatus(current.id, "en_curso")}
              >
                Iniciar actividad
              </Button>
            )}
          </div>
        </Panel>
      </div>

      {/* Bloque inferior de decisiones y eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <Panel
          title="Decisiones humanas del caso"
          subtitle={`${operacion.decisiones.length} registradas`}
          actions={
            <Button
              size="sm"
              variant="secondary"
              icon="Gavel"
              onClick={() => onOpenDecisionModal(current, "aprobar")}
            >
              Nueva decisión
            </Button>
          }
          flush
        >
          {operacion.decisiones.length === 0 ? (
            <p className="p-4 t-body text-fg-muted">No hay decisiones registradas aún.</p>
          ) : (
            <ul className="divide-y divide-line">
              {operacion.decisiones.map((d) => (
                <li key={d.id} className="p-3.5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Icon name="Gavel" size={16} className="text-review mt-0.5 shrink-0" />
                      <div>
                        <p className="t-label font-medium text-fg">{d.titulo}</p>
                        <p className="t-help text-fg-muted">{d.contexto}</p>
                        {d.fundamentacion && (
                          <p className="t-help text-fg mt-1 p-2 bg-subtle rounded-control border border-line">
                            {d.fundamentacion}
                          </p>
                        )}
                      </div>
                    </div>
                    <Tag tone={d.estado === "aprobada" ? "success" : d.estado === "devuelta" ? "warning" : "review"}>
                      {d.estado.toUpperCase()}
                    </Tag>
                  </div>
                  <div className="flex items-center justify-between text-xs text-fg-muted pt-1 border-t border-line">
                    <span>Responsable: {d.responsable}</span>
                    <span className="font-mono">{relative(d.cuando)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Bitácora inmutable de eventos y auditoría" flush>
          <div className="p-4">
            <Timeline
              dense
              items={operacion.eventos.slice(0, 6).map((e) => ({
                ...e,
                ref: undefined,
                action: (
                  <span>
                    {e.action}{" "}
                    {byId(e.ref) && (
                      <button
                        type="button"
                        className="t-help text-fg-link hv:underline font-mono"
                        onClick={() => onSelectActId(e.ref)}
                      >
                        · {byId(e.ref)?.name}
                      </button>
                    )}
                  </span>
                ),
              }))}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Legend() {
  const items: ActivityStatus[] = [
    "completada",
    "en_curso",
    "en_revision",
    "esperando_decision",
    "pendiente_info",
    "devuelta",
    "bloqueada",
    "no_iniciada",
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4" aria-label="Leyenda de estados">
      {items.map((k) => (
        <li key={k} className={cn("inline-flex items-center gap-1.5 t-help", TONE_CLASSES[ACTIVITY_STATUS[k].tone].fg)}>
          <Icon name={ACTIVITY_STATUS[k].icon} size={13} strokeWidth={2} />
          <span className="text-fg-muted">{ACTIVITY_STATUS[k].label}</span>
        </li>
      ))}
    </ul>
  );
}

function WorkflowNode({
  a,
  selected,
  related,
  dim,
  blockersCount,
  onClick,
}: {
  a: ActividadWorkflow;
  selected: boolean;
  related: boolean;
  dim: boolean;
  blockersCount: number;
  onClick: () => void;
}) {
  const def = ACTIVITY_STATUS[a.status];
  const t = TONE_CLASSES[def.tone];
  const dashed = a.status === "no_iniciada" || a.status === "bloqueada";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${a.name}. ${def.label}. Responsable ${a.owner}.`}
      className={cn(
        "w-full text-left rounded-control border bg-surface px-2.5 py-2 flex flex-col gap-1 transition-[opacity,box-shadow,border-color] relative",
        dashed ? "border-dashed border-line-strong" : "border-line",
        selected
          ? "border-action shadow-[0_0_0_2px_var(--action)]"
          : related
          ? "shadow-popover border-line-strong"
          : "hv:border-line-strong",
        dim && "opacity-70 hv:opacity-100"
      )}
    >
      <span className={cn("absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full", t.dot)} aria-hidden="true" />
      <span className="flex items-start gap-1.5">
        <Icon name={def.icon} size={14} strokeWidth={2} className={cn("mt-0.5 shrink-0", t.fg)} />
        <span className="t-label flex-1 font-medium">{a.name}</span>
      </span>
      <span className="flex items-center gap-2 t-help text-fg-muted pl-5">
        <span className="flex-1 min-w-0 truncate">{def.label}</span>
        {a.returns ? (
          <span className="inline-flex items-center gap-0.5 text-warning font-mono" title={`${a.returns} retornos`}>
            <Icon name="Undo2" size={12} />
            {a.returns}
          </span>
        ) : null}
        {blockersCount > 0 && a.status !== "completada" ? (
          <span
            className="inline-flex items-center gap-0.5 text-danger font-mono"
            title={`${blockersCount} dependencias abiertas`}
          >
            <Icon name="Link2" size={12} />
            {blockersCount}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function ActivityTable({
  acts,
  sel,
  onSel,
  laneFilter,
  setLaneFilter,
}: {
  acts: ActividadWorkflow[];
  sel: string;
  onSel: (id: string) => void;
  laneFilter: string;
  setLaneFilter: (s: string) => void;
}) {
  const byId = (id: string) => acts.find((a) => a.id === id);

  const cols: Column<ActividadWorkflow>[] = [
    {
      id: "name",
      header: "Actividad",
      cell: (a) => (
        <div>
          <span className="font-medium text-fg block">{a.name}</span>
          <span className="t-help text-fg-muted font-mono">{a.id} · Frente: {a.frente}</span>
        </div>
      ),
    },
    {
      id: "lane",
      header: "Frente operacional",
      cell: (a) => <span className="text-fg-muted whitespace-nowrap">{a.lane}</span>,
      hideBelow: "lg",
    },
    {
      id: "status",
      header: "Estado",
      cell: (a) => <StatusBadge def={ACTIVITY_STATUS[a.status]} size="sm" />,
    },
    {
      id: "owner",
      header: "Responsable",
      cell: (a) => <span className="whitespace-nowrap font-medium text-fg">{a.owner}</span>,
      hideBelow: "xl",
    },
    {
      id: "deps",
      header: "Depende de",
      cell: (a) =>
        a.deps.length ? (
          <span className="t-help text-fg-muted">
            {a.deps.map((d) => byId(d)?.name ?? d).join(", ")}
          </span>
        ) : (
          <span className="text-fg-subtle">—</span>
        ),
    },
    {
      id: "since",
      header: "Último cambio",
      align: "right",
      cell: (a) => (
        <span className="text-fg-muted whitespace-nowrap font-mono">{a.since ? relative(a.since) : "—"}</span>
      ),
    },
  ];

  const rows = acts.filter((a) => laneFilter === "todos" || a.lane === laneFilter);

  return (
    <div>
      <div className="px-4 py-2.5 border-b border-line bg-subtle">
        <Tabs
          variant="segmented"
          size="sm"
          ariaLabel="Filtrar por frente"
          value={laneFilter}
          onChange={setLaneFilter}
          tabs={[{ id: "todos", label: "Todos los frentes" }, ...LANES.map((l) => ({ id: l, label: l }))]}
        />
      </div>
      <DataTable
        columns={cols}
        rows={rows}
        onRowClick={(a) => onSel(a.id)}
        activeRowId={sel}
        density="compact"
        caption="Actividades de emisión"
      />
    </div>
  );
}
