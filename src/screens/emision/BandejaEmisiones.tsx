import React, { useMemo, useState } from "react";
import { Button, SearchInput, Select } from "../../components/ui/controls";
import { DataTable, StatusBadge, Amount, Avatar, Tabs, Tag, type Column, type Sort } from "../../components/ui/data";
import { EMISION_STATUS, type OperacionEmision, type EmisionStatus } from "../../domain/emision";
import { date, relative } from "../../lib/format";
import { Icon } from "../../lib/icon";
import { cn } from "../../lib/cn";

type FilterTab = "todas" | "lista_emision" | "en_evaluacion" | "observada" | "emitida";

interface Props {
  operaciones: OperacionEmision[];
  onSelectOperacion: (id: string) => void;
  onResetDemo: () => void;
}

export function BandejaEmisiones({ operaciones, onSelectOperacion, onResetDemo }: Props) {
  const [tab, setTab] = useState<FilterTab>("todas");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [monedaFilter, setMonedaFilter] = useState<string>("todas");
  const [sort, setSort] = useState<Sort>({ id: "fechaSolicitud", dir: "desc" });

  // Debounce para búsqueda
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Contadores para métricas
  const total = operaciones.length;
  const listas = operaciones.filter((o) => o.status === "lista_emision").length;
  const evaluacion = operaciones.filter((o) => o.status === "en_evaluacion" || o.status === "en_aprobacion").length;
  const observadas = operaciones.filter((o) => o.status === "observada").length;
  const emitidas = operaciones.filter((o) => o.status === "emitida").length;

  const filtered = useMemo(() => {
    let rows = operaciones;

    // Filtro por pestaña
    if (tab === "lista_emision") rows = rows.filter((o) => o.status === "lista_emision");
    else if (tab === "en_evaluacion") rows = rows.filter((o) => o.status === "en_evaluacion" || o.status === "en_aprobacion");
    else if (tab === "observada") rows = rows.filter((o) => o.status === "observada");
    else if (tab === "emitida") rows = rows.filter((o) => o.status === "emitida");

    // Filtro por tipo
    if (tipoFilter !== "todos") {
      rows = rows.filter((o) => o.tipo === tipoFilter);
    }

    // Filtro por moneda
    if (monedaFilter !== "todas") {
      rows = rows.filter((o) => o.currency === monedaFilter);
    }

    // Búsqueda de texto
    const term = debounced.trim().toLowerCase();
    if (term) {
      rows = rows.filter(
        (o) =>
          o.id.toLowerCase().includes(term) ||
          o.tomadorNombre.toLowerCase().includes(term) ||
          o.beneficiarioNombre.toLowerCase().includes(term) ||
          o.tipo.toLowerCase().includes(term) ||
          o.owner.toLowerCase().includes(term) ||
          (o.contratoSubyacente && o.contratoSubyacente.toLowerCase().includes(term))
      );
    }

    // Ordenamiento
    if (sort) {
      rows = [...rows].sort((a, b) => {
        let valA: any = a[sort.id as keyof OperacionEmision];
        let valB: any = b[sort.id as keyof OperacionEmision];
        if (sort.id === "tomador") {
          valA = a.tomadorNombre;
          valB = b.tomadorNombre;
        } else if (sort.id === "monto") {
          valA = a.monto;
          valB = b.monto;
        }
        if (valA < valB) return sort.dir === "asc" ? -1 : 1;
        if (valA > valB) return sort.dir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [operaciones, tab, tipoFilter, monedaFilter, debounced, sort]);

  const columns: Column<OperacionEmision>[] = [
    {
      id: "id",
      header: "Operación",
      sortable: true,
      cell: (o) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <button
            className="t-ref text-fg-link hv:underline font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              onSelectOperacion(o.id);
            }}
          >
            {o.id}
          </button>
          {o.prioridad === "alta" && (
            <Icon name="Flag" size={13} className="text-danger" label="Prioridad alta" />
          )}
        </span>
      ),
    },
    {
      id: "tomador",
      header: "Contratante · Beneficiario",
      sortable: true,
      minWidth: 240,
      cell: (o) => (
        <div className="min-w-0 max-w-[280px]">
          <p className="truncate font-medium text-fg" title={o.tomadorNombre}>
            {o.tomadorNombre}
          </p>
          <p className="truncate t-help text-fg-muted" title={o.beneficiarioNombre}>
            a favor de {o.beneficiarioNombre}
          </p>
          <p className="t-help text-fg-subtle truncate">{o.contratoSubyacente}</p>
        </div>
      ),
    },
    {
      id: "tipo",
      header: "Tipo de caución",
      sortable: true,
      cell: (o) => <Tag tone="neutral">{o.tipo}</Tag>,
    },
    {
      id: "monto",
      header: "Suma asegurada",
      align: "right",
      sortable: true,
      cell: (o) => (
        <div className="text-right">
          <span className="font-semibold block">
            <Amount value={o.monto} currency={o.currency} />
          </span>
          <span className="block t-help text-fg-muted">{o.plazoDias} días</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Estado operacional",
      sortable: true,
      cell: (o) => <StatusBadge def={EMISION_STATUS[o.status]} size="sm" />,
    },
    {
      id: "owner",
      header: "Responsable",
      cell: (o) => (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Avatar name={o.owner} size={20} />
          <span className="t-body text-fg">{o.owner}</span>
        </span>
      ),
      hideBelow: "lg",
    },
    {
      id: "fechaSolicitud",
      header: "Solicitud",
      align: "right",
      sortable: true,
      cell: (o) => (
        <div className="text-right">
          <span className="t-body font-mono text-fg">{date(o.fechaSolicitud)}</span>
          <span className="block t-help text-fg-muted">{relative(o.fechaSolicitud + "T12:00:00")}</span>
        </div>
      ),
      hideBelow: "xl",
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (o) => (
        <Button
          size="sm"
          variant={o.status === "lista_emision" ? "primary" : "secondary"}
          iconRight="ArrowRight"
          onClick={(e) => {
            e.stopPropagation();
            onSelectOperacion(o.id);
          }}
        >
          {o.status === "lista_emision" ? "Emitir" : "Expediente"}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Tarjetas resumen de métricas operacionales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-card bg-surface border border-line flex flex-col gap-1">
          <span className="t-help text-fg-muted flex items-center justify-between">
            <span>En evaluación</span>
            <Icon name="ScanSearch" size={15} className="text-info" />
          </span>
          <span className="t-amount-lg font-bold text-fg">{evaluacion}</span>
          <span className="t-help text-fg-subtle">Frentes activos</span>
        </div>

        <div className="p-3.5 rounded-card bg-surface border border-line flex flex-col gap-1">
          <span className="t-help text-fg-muted flex items-center justify-between">
            <span>Listas para emitir</span>
            <Icon name="Check" size={15} className="text-accent-fg" />
          </span>
          <span className="t-amount-lg font-bold text-accent-fg">{listas}</span>
          <span className="t-help text-accent-fg">Listas para póliza</span>
        </div>

        <div className="p-3.5 rounded-card bg-surface border border-line flex flex-col gap-1">
          <span className="t-help text-fg-muted flex items-center justify-between">
            <span>Con observaciones</span>
            <Icon name="CircleAlert" size={15} className="text-warning" />
          </span>
          <span className="t-amount-lg font-bold text-warning">{observadas}</span>
          <span className="t-help text-fg-subtle">En subsanación</span>
        </div>

        <div className="p-3.5 rounded-card bg-surface border border-line flex flex-col gap-1">
          <span className="t-help text-fg-muted flex items-center justify-between">
            <span>Pólizas emitidas</span>
            <Icon name="BadgeCheck" size={15} className="text-success" />
          </span>
          <span className="t-amount-lg font-bold text-success">{emitidas}</span>
          <span className="t-help text-fg-subtle">Certificadas</span>
        </div>
      </div>

      {/* Barra de control: Búsqueda, filtros y tabs */}
      <div className="bg-surface border border-line rounded-card overflow-hidden">
        <div className="p-4 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <SearchInput
              placeholder="Buscar por código, contratante, beneficiario o contrato..."
              value={q}
              onChange={setQ}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              options={[
                { value: "todos", label: "Todos los tipos" },
                { value: "Fiel cumplimiento", label: "Fiel cumplimiento" },
                { value: "Adelanto directo", label: "Adelanto directo" },
                { value: "Adelanto de materiales", label: "Adelanto de materiales" },
                { value: "Seriedad de oferta", label: "Seriedad de oferta" },
              ]}
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              size="sm"
              className="w-44"
              aria-label="Filtrar por tipo"
            />

            <Select
              options={[
                { value: "todas", label: "Moneda: Todas" },
                { value: "PEN", label: "Soles (PEN)" },
                { value: "USD", label: "Dólares (USD)" },
              ]}
              value={monedaFilter}
              onChange={(e) => setMonedaFilter(e.target.value)}
              size="sm"
              className="w-36"
              aria-label="Filtrar por moneda"
            />

            <Button size="sm" variant="secondary" icon="RotateCcw" onClick={onResetDemo} title="Restablecer datos demo al estado inicial">
              Restablecer demo
            </Button>
          </div>
        </div>

        {/* Pestañas de estado rápido */}
        <div className="px-4 pt-2.5 pb-2 border-b border-line bg-subtle">
          <Tabs
            ariaLabel="Filtrar por estado"
            value={tab}
            onChange={(v) => setTab(v as FilterTab)}
            variant="segmented"
            size="sm"
            tabs={[
              { id: "todas", label: `Todas (${total})` },
              { id: "lista_emision", label: `Listas para emitir (${listas})` },
              { id: "en_evaluacion", label: `En evaluación (${evaluacion})` },
              { id: "observada", label: `Con observaciones (${observadas})` },
              { id: "emitida", label: `Emitidas (${emitidas})` },
            ]}
          />
        </div>

        {/* Tabla Desktop (≥ 1024px) */}
        <div className="hidden lg:block">
          <DataTable
            columns={columns}
            rows={filtered}
            sort={sort}
            onSort={setSort}
            onRowClick={(o) => onSelectOperacion(o.id)}
            caption="Bandeja de operaciones de emisión"
          />
        </div>

        {/* Vista Móvil / Tablet en Tarjetas (< 1024px) */}
        <div className="lg:hidden p-3 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-fg-muted t-body">
              No se encontraron operaciones con los filtros seleccionados.
            </div>
          ) : (
            filtered.map((o) => (
              <div
                key={o.id}
                onClick={() => onSelectOperacion(o.id)}
                className="p-3.5 rounded-control border border-line bg-surface hv:border-line-strong active:bg-subtle cursor-pointer flex flex-col gap-2.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="t-ref text-fg-link font-semibold">{o.id}</span>
                  <StatusBadge def={EMISION_STATUS[o.status]} size="sm" />
                </div>

                <div>
                  <h4 className="t-body font-medium text-fg truncate">{o.tomadorNombre}</h4>
                  <p className="t-help text-fg-muted truncate">a favor de {o.beneficiarioNombre}</p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
                  <div className="flex flex-col">
                    <span className="t-help text-fg-muted">{o.tipo}</span>
                    <span className="font-semibold text-fg">
                      <Amount value={o.monto} currency={o.currency} />
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={o.status === "lista_emision" ? "primary" : "secondary"}
                    iconRight="ArrowRight"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOperacion(o.id);
                    }}
                  >
                    {o.status === "lista_emision" ? "Emitir" : "Ver caso"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
