import React, { useEffect, useState } from "react";
import { PageHeader, PageBody, DemoStateMenu, type DemoState } from "../shell/AppShell";
import { useApp } from "../shell/AppContext";
import { Button, IconButton } from "../components/ui/controls";
import { Panel, SummaryCard, StatusBadge, Timeline, EmptyState, ErrorState, Skeleton, Tabs, MiniBars } from "../components/ui/data";
import { useToast } from "../components/ui/overlays";
import { SOLICITUD_STATUS, TONE_CLASSES, type SolicitudStatus } from "../domain/status";
import { PENDIENTES, ALERTAS, ACTIVIDAD, EMITIDAS_SEMANA, EMITIDAS_SEMANA_LABELS, CURRENT_USER } from "../data/mock";
import { date, relative, daysUntil, dateLong, NOW } from "../lib/format";
import { Icon } from "../lib/icon";
import { cn } from "../lib/cn";

export function Dashboard() {
  const { go, solicitudes, openSearch } = useApp();
  const toast = useToast();
  const [demo, setDemo] = useState<DemoState>("ready");
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState(ALERTAS);
  const [pendTab, setPendTab] = useState("mias");
  useEffect(() => { const t = setTimeout(() => setLoading(false), 700); return () => clearTimeout(t); }, []);
  const isLoading = loading || demo === "loading";

  const enTramite: SolicitudStatus[] = ["recibida", "evaluacion", "observada", "aprobacion", "aprobada"];
  const dist = enTramite.map((k) => ({ k, n: solicitudes.filter((s) => s.status === k).length }));
  const totalTramite = dist.reduce((a, b) => a + b.n, 0);
  const vencidas = PENDIENTES.filter((p) => daysUntil(p.vence) < 0).length;
  const hoy = PENDIENTES.filter((p) => daysUntil(p.vence) === 0).length;

  const QUICK = [
    { label: "Nueva solicitud", icon: "FilePlus2", onClick: () => go("bandeja"), hint: "Registrar necesidad del cliente" },
    { label: "Consultar caución", icon: "Search", onClick: openSearch, hint: "Por número, tomador o beneficiario" },
    { label: "Mis observadas", icon: "CircleAlert", onClick: () => go("bandeja"), hint: "Solicitudes en subsanación" },
    { label: "Workspace de emisión", icon: "FileStack", onClick: () => go("emision"), hint: "EMI-2026-0089 en curso" },
    { label: "Registrar endoso", icon: "FilePen", onClick: () => toast.push({ tone: "info", title: "Módulo de endosos en V2", body: "No incluido en este prototipo." }), hint: "Modificación de instrumento" },
  ];

  return (
    <>
      <PageHeader
        module="Inicio operacional"
        title={`Buenos días, ${CURRENT_USER.name.split(" ")[0]}`}
        description={<span>{dateLong(NOW).replace(/^./, (c) => c.toUpperCase())} · Resumen de tu operación y de lo que requiere atención hoy. Indicadores demostrativos.</span>}
        actions={<>
          <DemoStateMenu value={demo} onChange={setDemo} />
          <Button variant="secondary" icon="RotateCw" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 700); }}>Actualizar</Button>
          <Button variant="primary" icon="Plus" onClick={() => go("bandeja")}>Nueva solicitud</Button>
        </>}
      />
      <PageBody>
        {demo === "error" ? (
          <div className="bg-surface border border-line rounded-card"><ErrorState code="DEMO-503-DASH" onRetry={() => setDemo("ready")} /></div>
        ) : (
          <>
            {/* Accesos directos */}
            <nav aria-label="Accesos directos" className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
              {QUICK.map((q) => (
                <button key={q.label} onClick={q.onClick}
                  className="group flex items-center gap-3 px-3 py-2.5 bg-surface border border-line rounded-card text-left hv:border-action hv:bg-action-soft transition-colors min-w-0">
                  <span className="h-8 w-8 rounded-control bg-muted text-fg-muted flex items-center justify-center shrink-0 group-hover:bg-surface group-hover:text-action-fg"><Icon name={q.icon} size={16} /></span>
                  <span className="min-w-0">
                    <span className="t-label block truncate">{q.label}</span>
                    <span className="t-help text-fg-muted block truncate">{q.hint}</span>
                  </span>
                </button>
              ))}
            </nav>

            {/* Resumen */}
            <section aria-label="Resumen de operaciones" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <SummaryCard loading={isLoading} icon="Inbox" label="Solicitudes en trámite" value={demo === "empty" ? 0 : totalTramite} delta="+5" deltaTone="neutral" hint="ingresadas esta semana" onClick={() => go("bandeja")} />
              <SummaryCard loading={isLoading} icon="BadgeCheck" label="Cauciones emitidas · octubre" value={demo === "empty" ? 0 : 42} delta="+9 %" deltaTone="up" hint="vs. mismo periodo de setiembre" series={demo === "empty" ? undefined : EMITIDAS_SEMANA} />
              <SummaryCard loading={isLoading} icon="ListChecks" label="Pendientes de tu atención" value={demo === "empty" ? 0 : PENDIENTES.length} delta={demo === "empty" ? undefined : `${vencidas} vencida${vencidas === 1 ? "" : "s"}`} deltaTone="warning" hint={demo === "empty" ? "Nada pendiente" : `${hoy} vencen hoy`} />
              <SummaryCard loading={isLoading} icon="Scale" label="Suma asegurada vigente" value={demo === "empty" ? "0" : "184.6"} unit="M PEN" hint="Cartera demo, sin definición de KPI" />
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
              <div className="flex flex-col gap-5 min-w-0">
                {/* Pendientes */}
                <Panel title="Operaciones pendientes de atención" flush
                  actions={<Tabs variant="segmented" size="sm" ariaLabel="Ámbito de pendientes" value={pendTab} onChange={setPendTab} tabs={[{ id: "mias", label: "Asignadas a mí" }, { id: "equipo", label: "Mi equipo" }]} />}>
                  {isLoading ? (
                    <div className="p-4 flex flex-col gap-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex gap-3 items-center"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-20" /></div>)}</div>
                  ) : demo === "empty" ? (
                    <EmptyState compact icon="CircleCheckBig" title="Estás al día" body="No tienes operaciones pendientes. Las nuevas asignaciones aparecerán aquí." />
                  ) : (
                    <ul className="divide-y divide-line">
                      {(pendTab === "mias" ? PENDIENTES : [...PENDIENTES].reverse()).map((p) => {
                        const d = daysUntil(p.vence);
                        const tipo = { decision: { i: "Gavel", l: "Decisión" }, revision: { i: "Eye", l: "Revisión" }, documento: { i: "Paperclip", l: "Documento" }, subsanacion: { i: "Undo2", l: "Subsanación" } }[p.tipo];
                        return (
                          <li key={p.id}>
                            <button onClick={() => (p.ref.startsWith("EMI") ? go("emision") : go("expediente", { id: p.ref }))}
                              className="w-full text-left px-4 py-2.5 grid grid-cols-[auto_1fr_auto] md:grid-cols-[110px_1fr_150px_120px] items-center gap-x-4 gap-y-0.5 hv:bg-subtle">
                              <span className="inline-flex items-center gap-1.5 t-caption text-fg-muted"><Icon name={tipo.i} size={14} />{tipo.l}</span>
                              <span className="min-w-0">
                                <span className="block t-body truncate">{p.tarea}</span>
                                <span className="block t-help text-fg-muted truncate"><span className="t-ref text-fg-link">{p.ref}</span> · {p.tomador}</span>
                              </span>
                              <span className={cn("hidden md:inline t-caption tnum", d < 0 ? "text-danger" : d === 0 ? "text-warning" : "text-fg-muted")}>
                                <Icon name={d < 0 ? "CircleAlert" : "Clock3"} size={13} className="inline -mt-0.5 mr-1" />
                                {d < 0 ? `Vencida · ${date(p.vence)}` : d === 0 ? "Vence hoy" : d === 1 ? "Vence mañana" : `Vence ${date(p.vence)}`}
                              </span>
                              <span className="justify-self-end inline-flex items-center gap-1 t-label text-action-fg">Atender <Icon name="ArrowRight" size={14} /></span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Panel>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Solicitudes en trámite por estado */}
                  <Panel title="Solicitudes en trámite" subtitle="por estado" actions={<Button size="sm" variant="tertiary" onClick={() => go("bandeja")}>Ir a bandeja</Button>}>
                    {isLoading ? <div className="flex flex-col gap-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-5" />)}</div> : (
                      <ul className="flex flex-col gap-2.5">
                        {dist.map(({ k, n }) => {
                          const max = Math.max(...dist.map((d) => d.n), 1);
                          return (
                            <li key={k} className="grid grid-cols-[120px_1fr_32px] items-center gap-3">
                              <StatusBadge def={SOLICITUD_STATUS[k]} variant="dot" />
                              <span className="h-2.5 rounded-badge bg-muted overflow-hidden">
                                <span className={cn("block h-full rounded-badge", TONE_CLASSES[SOLICITUD_STATUS[k].tone].dot)} style={{ width: `${demo === "empty" ? 0 : (n / max) * 100}%` }} />
                              </span>
                              <span className="text-right tnum t-label">{demo === "empty" ? 0 : n}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Panel>
                  {/* Emitidas por semana */}
                  <Panel title="Cauciones emitidas" subtitle="por semana · demo">
                    {isLoading ? <Skeleton className="h-[132px]" /> : <WeeklyChart data={demo === "empty" ? EMITIDAS_SEMANA.map(() => 0) : EMITIDAS_SEMANA} labels={EMITIDAS_SEMANA_LABELS} />}
                  </Panel>
                </div>
              </div>

              <div className="flex flex-col gap-5 min-w-0">
                <Panel title="Alertas" subtitle={`${alertas.length} activas`} flush>
                  {isLoading ? <div className="p-4 flex flex-col gap-3"><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : alertas.length === 0 || demo === "empty" ? (
                    <EmptyState compact icon="BellOff" title="Sin alertas activas" />
                  ) : (
                    <ul className="divide-y divide-line">
                      {alertas.map((a) => (
                        <li key={a.id} className="relative pl-4 pr-2 py-3 flex gap-3">
                          <span className={cn("absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full", a.severity === "danger" ? "bg-danger" : a.severity === "warning" ? "bg-warning" : "bg-info")} aria-hidden="true" />
                          <Icon name={a.severity === "danger" ? "CircleAlert" : a.severity === "warning" ? "TriangleAlert" : "Info"} size={16}
                            className={cn("mt-0.5 shrink-0", a.severity === "danger" ? "text-danger" : a.severity === "warning" ? "text-warning" : "text-info")} label={a.severity === "danger" ? "Crítica" : a.severity === "warning" ? "Advertencia" : "Información"} />
                          <div className="min-w-0 flex-1">
                            <p className="t-label">{a.title}</p>
                            <p className="t-help text-fg-muted mt-0.5">{a.detail}</p>
                            <p className="t-help text-fg-subtle mt-1 flex gap-2">
                              <span>{relative(a.when)}</span>
                              {a.ref && <button className="t-ref text-fg-link hv:underline min-h-6 inline-flex items-center" onClick={() => a.ref!.startsWith("SOL") ? go("expediente", { id: a.ref }) : a.ref!.startsWith("EMI") ? go("emision") : undefined}>{a.ref}</button>}
                            </p>
                          </div>
                          <IconButton icon="X" size="sm" label={`Descartar alerta: ${a.title}`} onClick={() => { setAlertas((s) => s.filter((x) => x.id !== a.id)); toast.push({ tone: "info", title: "Alerta descartada", action: { label: "Deshacer", onClick: () => setAlertas((s) => [a, ...s]) } }); }} />
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
                <Panel title="Actividad reciente" subtitle="tu equipo">
                  {isLoading ? <div className="flex flex-col gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="flex gap-3"><Skeleton className="h-7 w-7 rounded-full" /><div className="flex-1 flex flex-col gap-1.5"><Skeleton className="h-3.5 w-[80%]" /><Skeleton className="h-3 w-24" /></div></div>)}</div>
                    : demo === "empty" ? <EmptyState compact icon="Activity" title="Sin actividad reciente" />
                    : <Timeline dense items={ACTIVIDAD} onRef={(r) => r.startsWith("SOL") ? go("expediente", { id: r }) : r.startsWith("EMI") ? go("emision") : undefined} />}
                </Panel>
              </div>
            </div>
          </>
        )}
      </PageBody>
    </>
  );
}

function WeeklyChart({ data, labels }: { data: number[]; labels: string[] }) {
  const W = 420, H = 150, pl = 28, pb = 22, pt = 10;
  const max = Math.max(30, ...data);
  const ticks = [0, 10, 20, 30];
  const bw = (W - pl) / data.length;
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Cauciones emitidas por semana: ${data.map((d, i) => `${labels[i]} ${d}`).join(", ")}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pl} x2={W} y1={y(t)} y2={y(t)} stroke="var(--border-default)" strokeWidth={1} />
          <text x={pl - 6} y={y(t) + 4} textAnchor="end" fontSize="10.5" fill="var(--fg-muted)" style={{ fontVariantNumeric: "tabular-nums" }}>{t}</text>
        </g>
      ))}
      {data.map((v, i) => {
        const last = i === data.length - 1;
        const x = pl + i * bw + bw * 0.22;
        return (
          <g key={i}>
            <rect x={x} y={y(v)} width={bw * 0.56} height={Math.max(0, y(0) - y(v))} rx={2} fill={last ? "var(--action)" : "var(--border-strong)"} opacity={last ? 1 : 0.55}>
              <title>{`${labels[i]}: ${v}`}</title>
            </rect>
            {last && <text x={x + bw * 0.28} y={y(v) - 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--fg-default)">{v}</text>}
            <text x={x + bw * 0.28} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--fg-muted)">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}
