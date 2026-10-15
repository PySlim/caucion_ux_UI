import React, { useEffect, useMemo, useState } from "react";
import { PageHeader, PageBody, DemoStateMenu, type DemoState } from "../shell/AppShell";
import { useApp } from "../shell/AppContext";
import { Button, IconButton, SearchInput, Checkbox } from "../components/ui/controls";
import { DataTable, StatusBadge, Amount, Avatar, Tabs, Pagination, EmptyState, ErrorState, DescriptionList, Timeline, type Column, type Sort, InlineAlert } from "../components/ui/data";
import { Dropdown, Drawer, ConfirmDialog, useToast } from "../components/ui/overlays";
import { FilterMenu } from "../components/patterns/FilterMenu";
import { SOLICITUD_STATUS, TONE_CLASSES, type SolicitudStatus } from "../domain/status";
import { tomador, asegurado, userById, USERS, TIPOS, CURRENT_USER, HISTORIAL_0147, type Solicitud } from "../data/mock";
import { date, relative, daysUntil } from "../lib/format";
import { Icon } from "../lib/icon";
import { cn } from "../lib/cn";
import { NuevaSolicitudModal } from "./NuevaSolicitud";

type View = "todas" | "mias" | "observadas" | "aprobacion" | "borradores";
const ACTIVE: SolicitudStatus[] = ["recibida", "evaluacion", "observada", "aprobacion", "aprobada"];

export function Bandeja() {
  const { solicitudes, go, addSolicitud, updateSolicitud } = useApp();
  const toast = useToast();
  const [view, setView] = useState<View>("todas");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [searching, setSearching] = useState(false);
  const [fStatus, setFStatus] = useState<string[]>([]);
  const [fTipo, setFTipo] = useState<string[]>([]);
  const [fOwner, setFOwner] = useState<string[]>([]);
  const [fMoneda, setFMoneda] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>({ id: "actualizada", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [demo, setDemo] = useState<DemoState>("ready");
  const [quick, setQuick] = useState<Solicitud | null>(null);
  const [nueva, setNueva] = useState(false);
  const [desistir, setDesistir] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState(true);

  // Carga inicial simulada
  useEffect(() => { const t = setTimeout(() => setLoading(false), 650); return () => clearTimeout(t); }, []);
  // Búsqueda con retardo simulado
  useEffect(() => {
    if (q === debounced) return;
    setSearching(true);
    const t = setTimeout(() => { setDebounced(q); setSearching(false); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [view, fStatus, fTipo, fOwner, fMoneda, pageSize]);

  const byView = (s: Solicitud, v: View) =>
    v === "todas" ? s.status !== "borrador" :
    v === "mias" ? s.ownerId === CURRENT_USER.id && ACTIVE.includes(s.status) :
    v === "observadas" ? s.status === "observada" :
    v === "aprobacion" ? s.status === "aprobacion" :
    s.status === "borrador";

  const filtered = useMemo(() => {
    const ql = debounced.trim().toLowerCase();
    let rows = solicitudes.filter((s) => byView(s, view));
    if (fStatus.length) rows = rows.filter((s) => fStatus.includes(s.status));
    if (fTipo.length) rows = rows.filter((s) => fTipo.includes(s.tipo));
    if (fOwner.length) rows = rows.filter((s) => fOwner.includes(s.ownerId));
    if (fMoneda.length) rows = rows.filter((s) => fMoneda.includes(s.currency));
    if (ql) rows = rows.filter((s) => [s.id, tomador(s.tomadorId).name, tomador(s.tomadorId).doc, asegurado(s.aseguradoId).name, s.tipo].join(" ").toLowerCase().includes(ql));
    if (sort) {
      const get = (s: Solicitud): any =>
        sort.id === "id" ? s.id : sort.id === "tomador" ? tomador(s.tomadorId).name : sort.id === "monto" ? s.monto : sort.id === "vigencia" ? s.vigenciaDesde :
        sort.id === "estado" ? SOLICITUD_STATUS[s.status].label : sort.id === "tipo" ? s.tipo : s.actualizada;
      rows = [...rows].sort((a, b) => (get(a) < get(b) ? -1 : get(a) > get(b) ? 1 : 0) * (sort.dir === "asc" ? 1 : -1));
    }
    return rows;
  }, [solicitudes, view, fStatus, fTipo, fOwner, fMoneda, debounced, sort]);

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const count = (v: View) => solicitudes.filter((s) => byView(s, v)).length;
  const anyFilter = fStatus.length + fTipo.length + fOwner.length + fMoneda.length > 0 || !!debounced;
  const clearAll = () => { setFStatus([]); setFTipo([]); setFOwner([]); setFMoneda([]); setQ(""); setDebounced(""); };
  const base = solicitudes.filter((s) => byView(s, view));
  const countBy = (pred: (s: Solicitud) => boolean) => base.filter(pred).length;

  const columns: Column<Solicitud>[] = [
    {
      id: "id", header: "N.º solicitud", sortable: true,
      cell: (s) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <button className="t-ref text-fg-link hv:underline underline-offset-2 font-medium" onClick={() => go("expediente", { id: s.id })}>{s.id}</button>
          {s.prioridad === "alta" && <Icon name="Flag" size={13} className="text-danger" label="Prioridad alta" />}
        </span>
      ),
    },
    {
      id: "tomador", header: "Tomador · Beneficiario", sortable: true, minWidth: 220,
      cell: (s) => (
        <div className="min-w-0 max-w-[250px]">
          <p className="truncate font-medium text-fg" title={tomador(s.tomadorId).name}>{tomador(s.tomadorId).name}</p>
          <p className="truncate t-help text-fg-muted" title={asegurado(s.aseguradoId).name}>a favor de {asegurado(s.aseguradoId).name}</p>
          <p className="2xl:hidden t-help text-fg-muted truncate">{s.tipo}</p>
        </div>
      ),
    },
    { id: "tipo", header: "Tipo", sortable: true, hideBelow: "2xl", cell: (s) => <span className="block min-w-[88px]">{s.tipo}</span> },
    { id: "monto", header: "Suma asegurada", sortable: true, align: "right", cell: (s) => <Amount value={s.monto} currency={s.currency} /> },
    {
      id: "vigencia", header: "Vigencia", sortable: true, width: 120, hideBelow: "lg",
      cell: (s) => (
        <div className="tnum leading-tight whitespace-nowrap">
          <p>{date(s.vigenciaDesde)}</p>
          <p className="t-help text-fg-muted">al {date(s.vigenciaHasta)}</p>
        </div>
      ),
    },
    { id: "estado", header: "Estado", sortable: true, cell: (s) => {
      const d = s.vence ? daysUntil(s.vence) : 99;
      const open = ACTIVE.includes(s.status);
      return (
        <div className="flex flex-col items-start gap-0.5">
          <StatusBadge def={SOLICITUD_STATUS[s.status]} size={density === "compact" ? "sm" : "md"} />
          <span className="2xl:hidden t-help text-fg-muted whitespace-nowrap">
            {relative(s.actualizada)}
            {open && d <= 1 && <span className={cn("font-medium", d < 0 ? "text-danger" : "text-warning")}> · {d < 0 ? "vencida" : d === 0 ? "hoy" : "mañana"}</span>}
          </span>
        </div>
      );
    } },
    {
      id: "owner", header: "Resp.", width: 56, align: "center",
      cell: (s) => <Avatar name={userById(s.ownerId).name} size={24} />,
    },
    {
      id: "actualizada", header: "Actualizado", sortable: true, width: 104, align: "right", hideBelow: "2xl",
      cell: (s) => {
        const d = s.vence ? daysUntil(s.vence) : 99;
        const open = ACTIVE.includes(s.status);
        return (
          <div className="leading-tight whitespace-nowrap">
            <p className="text-fg-muted">{relative(s.actualizada)}</p>
            {open && d <= 1 && <p className={cn("t-caption", d < 0 ? "text-danger" : "text-warning")}>{d < 0 ? `Atención vencida` : d === 0 ? "Atender hoy" : "Atender mañana"}</p>}
          </div>
        );
      },
    },
  ];

  const emptyNode = (
                anyFilter || demo === "empty" ? (
                  <EmptyState icon="SearchX" title="Ninguna solicitud coincide"
                    body={debounced ? `No hay resultados para «${debounced}» con los filtros actuales.` : "Prueba quitando algún filtro o cambiando de vista."}
                    action={<Button onClick={() => { clearAll(); setDemo("ready"); }}>Limpiar filtros</Button>} />
                ) : (
                  <EmptyState icon="Inbox" title="No tienes solicitudes en esta vista" body="Cuando se te asigne una solicitud aparecerá aquí." action={<Button variant="primary" icon="Plus" onClick={() => setNueva(true)}>Nueva solicitud</Button>} />
                )
  );

  const nextId = `SOL-2026-${String(161 + solicitudes.length - 46).padStart(4, "0")}`;

  return (
    <>
      <PageHeader
        module="Operación · Gestión comercial"
        title="Bandeja de solicitudes"
        description="Solicitudes de caución en curso. Abre una solicitud para trabajar su expediente; usa las vistas para enfocarte en lo que requiere tu atención."
        actions={<>
          <DemoStateMenu value={demo} onChange={setDemo} />
          <Button variant="secondary" icon="Download" onClick={() => toast.push({ tone: "info", title: "Exportación en preparación", body: `${filtered.length} registros. Te avisaremos cuando el archivo esté listo (simulado).` })}>Exportar</Button>
          <Button variant="primary" icon="Plus" onClick={() => setNueva(true)}>Nueva solicitud</Button>
        </>}
      >
        <Tabs ariaLabel="Vistas de la bandeja" value={view} onChange={(v) => { setView(v as View); setSelected(new Set()); }} className="-mb-3 -mx-1"
          tabs={[
            { id: "todas", label: "Todas", count: count("todas") },
            { id: "mias", label: "Asignadas a mí", count: count("mias") },
            { id: "observadas", label: "Observadas", count: count("observadas"), alert: count("observadas") > 0 },
            { id: "aprobacion", label: "En aprobación", count: count("aprobacion") },
            { id: "borradores", label: "Borradores", count: count("borradores") },
          ]} />
      </PageHeader>

      <PageBody>
        <section className="bg-surface border border-line rounded-card shadow-card min-w-0" aria-label="Listado de solicitudes">
          {/* Barra de herramientas */}
          {selected.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 px-4 min-h-14 py-2 bg-selected border-b border-line rounded-t-card">
              <span className="t-label text-fg tnum mr-2">{selected.size} {selected.size === 1 ? "seleccionada" : "seleccionadas"}</span>
              <Dropdown align="start" items={USERS.map((u) => ({ label: u.name, hint: u.role.split(" ")[0], onSelect: () => {
                selected.forEach((id) => updateSolicitud(id, { ownerId: u.id }));
                toast.push({ tone: "success", title: `${selected.size} solicitudes reasignadas`, body: `Responsable: ${u.name}.` });
                setSelected(new Set());
              } }))}
                trigger={(p) => <Button {...p} size="sm" icon="UserRoundPlus" iconRight="ChevronDown">Asignar a</Button>} />
              <Button size="sm" icon="Download" onClick={() => toast.push({ tone: "info", title: "Exportación en preparación", body: `${selected.size} registros seleccionados (simulado).` })}>Exportar selección</Button>
              <Button size="sm" variant="quiet" onClick={() => setSelected(new Set())}>Quitar selección</Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-line">
              <SearchInput id="bandeja-search" className="w-full sm:w-[300px]" value={q} onChange={setQ} loading={searching} placeholder="Buscar por N.º, tomador, beneficiario o ID" />
              <FilterMenu label="Estado" value={fStatus} onChange={setFStatus}
                options={(Object.keys(SOLICITUD_STATUS) as SolicitudStatus[]).filter((k) => k !== "borrador").map((k) => ({ value: k, label: SOLICITUD_STATUS[k].label, count: countBy((s) => s.status === k), adornment: <span className={cn("h-2 w-2 rounded-full", TONE_CLASSES[SOLICITUD_STATUS[k].tone].dot)} /> }))} />
              <FilterMenu label="Tipo" value={fTipo} onChange={setFTipo} options={TIPOS.map((t) => ({ value: t, label: t, count: countBy((s) => s.tipo === t) }))} width={280} />
              <FilterMenu label="Responsable" value={fOwner} onChange={setFOwner} searchable options={USERS.map((u) => ({ value: u.id, label: u.name, count: countBy((s) => s.ownerId === u.id) }))} />
              <FilterMenu label="Moneda" value={fMoneda} onChange={setFMoneda} options={[{ value: "PEN", label: "PEN · Soles", count: countBy((s) => s.currency === "PEN") }, { value: "USD", label: "USD · Dólares", count: countBy((s) => s.currency === "USD") }]} width={220} />
              {anyFilter && <Button size="sm" variant="tertiary" onClick={clearAll}>Limpiar todo</Button>}
              <div className="flex-1 hidden lg:block" />
              <Tabs variant="segmented" size="sm" ariaLabel="Densidad de filas" className="hidden lg:inline-flex" value={density} onChange={(v) => setDensity(v as any)}
                tabs={[{ id: "comfortable", label: "Cómoda", icon: "Rows3" }, { id: "compact", label: "Compacta", icon: "Rows4" }]} />
            </div>
          )}

          {demo === "error" ? (
            <ErrorState code="DEMO-504-BNDJ" onRetry={() => { setDemo("ready"); setLoading(true); setTimeout(() => setLoading(false), 700); }} />
          ) : (
            <>
            <div className="lg:hidden">
              <CardList rows={demo === "empty" ? [] : pageRows} loading={loading || demo === "loading"} empty={emptyNode}
                selected={selected} onSelect={setSelected} onOpen={(id) => go("expediente", { id })} onQuick={setQuick} />
            </div>
            <div className="hidden lg:block">
            <DataTable
              caption="Solicitudes de caución"
              columns={columns}
              rows={demo === "empty" ? [] : pageRows}
              loading={loading || demo === "loading"}
              sort={sort}
              onSort={setSort}
              density={density}
              selectable
              selected={selected}
              onSelect={setSelected}
              onRowClick={(r) => go("expediente", { id: r.id })}
              activeRowId={quick?.id}
              rowActions={(r) => (
                <Dropdown items={[
                  { label: "Abrir expediente", icon: "FolderOpen", onSelect: () => go("expediente", { id: r.id }) },
                  { label: "Vista rápida", icon: "PanelRight", onSelect: () => setQuick(r) },
                  { label: "Copiar N.º", icon: "Copy", onSelect: () => { navigator.clipboard?.writeText(r.id).catch(() => {}); toast.push({ tone: "success", title: `${r.id} copiado` }); } },
                  { separator: true },
                  { label: "Desistir solicitud", icon: "CircleSlash", danger: true, disabled: !ACTIVE.includes(r.status), onSelect: () => setDesistir(r) },
                ]}
                  trigger={(p) => <IconButton {...p} icon="Ellipsis" label={`Acciones de ${r.id}`} size="sm" className="opacity-70 group-hover:opacity-100" />} />
              )}
              empty={emptyNode}
            />
            </div>
            </>
          )}
          {demo !== "error" && !loading && demo !== "loading" && filtered.length > 0 && demo !== "empty" && (
            <div className="px-4 py-2.5 border-t border-line">
              <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
            </div>
          )}
        </section>
      </PageBody>

      <QuickView s={quick} onClose={() => setQuick(null)} onOpen={(id) => { setQuick(null); go("expediente", { id }); }} />

      <NuevaSolicitudModal open={nueva} onClose={() => setNueva(false)} nextId={nextId}
        onCreate={(s, draft) => {
          addSolicitud(s);
          if (draft) setView("borradores"); else setView("todas");
          setSort({ id: "actualizada", dir: "desc" });
          toast.push({ tone: "success", title: draft ? `Borrador ${s.id} guardado` : `Solicitud ${s.id} registrada`, body: draft ? "Puedes completarlo más tarde desde Borradores." : "Quedó en estado Recibida y asignada a ti.", action: { label: "Abrir expediente", onClick: () => go("expediente", { id: s.id }) } });
        }} />

      <ConfirmDialog open={!!desistir} onClose={() => setDesistir(null)} tone="danger" requireComment commentLabel="Motivo del desistimiento"
        title={`Desistir ${desistir?.id ?? ""}`}
        body={<>La solicitud se cerrará y dejará de aparecer en las vistas activas. El historial se conserva. <span className="text-fg-muted">Esta acción es reversible sólo por un supervisor (supuesto de diseño).</span></>}
        confirmLabel="Desistir solicitud"
        onConfirm={() => { if (desistir) { updateSolicitud(desistir.id, { status: "desistida" }); toast.push({ tone: "success", title: `${desistir.id} desistida`, body: "Motivo registrado en el historial." }); } }} />
    </>
  );
}

/** Vista compacta alternativa (< 1024 px): conserva N.º, estado, partes, monto, vigencia, responsable y atención. */
function CardList({ rows, loading, empty, selected, onSelect, onOpen, onQuick }: {
  rows: Solicitud[]; loading: boolean; empty: React.ReactNode; selected: Set<string>; onSelect: (s: Set<string>) => void; onOpen: (id: string) => void; onQuick: (s: Solicitud) => void;
}) {
  if (loading) return (
    <ul className="divide-y divide-line" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="px-4 py-3 flex flex-col gap-2"><span className="skeleton block h-4 w-32" /><span className="skeleton block h-3.5 w-[80%]" /><span className="skeleton block h-3.5 w-40" /></li>
      ))}
    </ul>
  );
  if (!rows.length) return <>{empty}</>;
  return (
    <ul className="divide-y divide-line" aria-label="Solicitudes">
      {rows.map((s) => {
        const sel = selected.has(s.id);
        const d = s.vence ? daysUntil(s.vence) : 99;
        const open = ACTIVE.includes(s.status);
        return (
          <li key={s.id} className={cn("px-4 py-3 flex gap-3", sel && "bg-selected")}>
            <Checkbox aria-label={`Seleccionar ${s.id}`} checked={sel} className="self-start -mt-0.5"
              onChange={() => { const n = new Set(selected); sel ? n.delete(s.id) : n.add(s.id); onSelect(n); }} />
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <button className="t-ref text-fg-link font-medium hv:underline min-h-6" onClick={() => onOpen(s.id)}>{s.id}</button>
                <StatusBadge def={SOLICITUD_STATUS[s.status]} size="sm" />
              </div>
              <button className="text-left min-w-0" onClick={() => onOpen(s.id)}>
                <span className="block t-label text-fg">{tomador(s.tomadorId).name}</span>
                <span className="block t-help text-fg-muted">a favor de {asegurado(s.aseguradoId).name} · {s.tipo}</span>
              </button>
              <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                <Amount value={s.monto} currency={s.currency} />
                <span className="t-help text-fg-muted tnum">{date(s.vigenciaDesde)} – {date(s.vigenciaHasta)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 t-help text-fg-muted">
                <span className="inline-flex items-center gap-1.5"><Avatar name={userById(s.ownerId).name} size={20} />{userById(s.ownerId).name}</span>
                <span>{relative(s.actualizada)}</span>
                {s.prioridad === "alta" && <span className="text-danger inline-flex items-center gap-1"><Icon name="Flag" size={12} />Prioridad alta</span>}
                {open && d <= 1 && <span className={cn("font-medium", d < 0 ? "text-danger" : "text-warning")}>{d < 0 ? "Atención vencida" : d === 0 ? "Atender hoy" : "Atender mañana"}</span>}
              </div>
            </div>
            <IconButton icon="PanelRight" label={`Vista rápida de ${s.id}`} size="sm" onClick={() => onQuick(s)} />
          </li>
        );
      })}
    </ul>
  );
}

function QuickView({ s, onClose, onOpen }: { s: Solicitud | null; onClose: () => void; onOpen: (id: string) => void }) {
  if (!s) return null;
  const t = tomador(s.tomadorId), a = asegurado(s.aseguradoId);
  return (
    <Drawer open={!!s} onClose={onClose} width={460}
      title={<span className="t-ref text-md font-semibold">{s.id}</span>}
      subtitle={<span className="flex items-center gap-2 mt-1"><StatusBadge def={SOLICITUD_STATUS[s.status]} /> <span>{s.tipo}</span></span>}
      footer={<><Button variant="secondary" onClick={onClose}>Cerrar</Button><Button variant="primary" icon="FolderOpen" onClick={() => onOpen(s.id)}>Abrir expediente</Button></>}>
      <div className="flex flex-col gap-5">
        <div className="bg-subtle border border-line rounded-card px-4 py-3">
          <p className="t-help text-fg-muted">Suma asegurada</p>
          <Amount value={s.monto} currency={s.currency} size="lg" />
        </div>
        <DescriptionList columns={2} items={[
          { label: "Tomador", value: t.name, hint: t.doc, span: 2 },
          { label: "Beneficiario", value: a.name, span: 2 },
          { label: "Inicio de vigencia", value: <span className="tnum">{date(s.vigenciaDesde)}</span> },
          { label: "Fin de vigencia", value: <span className="tnum">{date(s.vigenciaHasta)}</span> },
          { label: "Responsable", value: userById(s.ownerId).name },
          { label: "Canal", value: s.canal },
        ]} />
        {s.status === "observada" && <InlineAlert tone="warning" title="Observada">Tiene documentos devueltos para subsanación.</InlineAlert>}
        <div>
          <h3 className="t-sub mb-3">Últimos eventos</h3>
          <Timeline dense items={(s.id === "SOL-2026-0147" ? HISTORIAL_0147 : HISTORIAL_0147.slice(5)).slice(0, 3).map((e) => ({ ...e, ref: undefined }))} />
        </div>
      </div>
    </Drawer>
  );
}
