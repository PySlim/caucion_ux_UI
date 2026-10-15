import React, { useId, useRef } from "react";
import { cn } from "../../lib/cn";
import { Icon } from "../../lib/icon";
import { CURRENCY_SYMBOL, money, type Currency, initials, relative, dateTime } from "../../lib/format";
import { TONE_CLASSES, type StatusDef, type Tone } from "../../domain/status";
import { Button, IconButton, Select, Checkbox } from "./controls";

/* ============================== StatusBadge ============================== */
/**
 * Tres formas para tres vocabularios, evitando confundirlos:
 *  - "soft"  → estado de proceso (solicitud, actividad, documento)
 *  - "outline" con icono de escudo → estado del instrumento
 *  - "dot"   → versión compacta para tablas densas o leyendas
 */
export function StatusBadge({ def, variant = "soft", size = "md", className }: { def: StatusDef; variant?: "soft" | "outline" | "dot" | "solid"; size?: "sm" | "md"; className?: string }) {
  const t = TONE_CLASSES[def.tone];
  const s = size === "sm" ? "h-5 px-1.5 text-2xs gap-1" : "h-6 px-2 text-xs gap-1.5";
  if (variant === "dot")
    return (
      <span className={cn("inline-flex items-center gap-1.5 t-caption whitespace-nowrap", className)}>
        <span className={cn("h-2 w-2 rounded-full", t.dot)} aria-hidden="true" />
        {def.label}
      </span>
    );
  return (
    <span title={def.hint} className={cn("inline-flex items-center rounded-badge font-medium whitespace-nowrap leading-none", s,
      variant === "soft" && t.soft,
      variant === "solid" && t.solid,
      variant === "outline" && cn("border bg-surface", t.border, t.fg), className)}>
      <Icon name={def.icon} size={size === "sm" ? 12 : 13} strokeWidth={2} />
      {def.label}
    </span>
  );
}

export function Tag({ children, tone = "neutral", icon, onRemove }: { children: React.ReactNode; tone?: Tone; icon?: string; onRemove?: () => void }) {
  return (
    <span className={cn("inline-flex items-center gap-1 h-6 pl-2 rounded-badge t-caption", onRemove ? "pr-0.5" : "pr-2", TONE_CLASSES[tone].soft)}>
      {icon && <Icon name={icon} size={12} />}
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Quitar" className="h-5 w-5 inline-flex items-center justify-center rounded-badge hv:bg-line">
          <Icon name="X" size={12} />
        </button>
      )}
    </span>
  );
}

/* ============================== Amount ============================== */
/** Importe con código de moneda separado: cifras siempre alineadas a la derecha. */
export function Amount({ value, currency, size = "md", muted, symbol }: { value: number; currency: Currency; size?: "sm" | "md" | "lg"; muted?: boolean; symbol?: boolean }) {
  const [int, dec] = money(value).split(".");
  if (size === "lg")
    return (
      <span className="inline-flex flex-wrap items-baseline gap-x-1.5 t-amount-lg">
        <span className="text-sm font-medium text-fg-muted">{symbol ? CURRENCY_SYMBOL[currency] : currency}</span>
        <span>{int}<span className="text-fg-muted text-lg">.{dec}</span></span>
      </span>
    );
  return (
    <span className={cn("inline-flex items-baseline justify-end gap-1.5 tnum whitespace-nowrap", size === "sm" ? "text-sm" : "t-amount", muted && "text-fg-muted")}>
      <span className="text-2xs font-medium text-fg-muted tracking-wide">{symbol ? CURRENCY_SYMBOL[currency] : currency}</span>
      <span>{int}.{dec}</span>
    </span>
  );
}

/* ============================== Avatar ============================== */
export function Avatar({ name, size = 24, tone }: { name: string; size?: number; tone?: "nav" | "default" }) {
  return (
    <span title={name} aria-label={name} role="img"
      className={cn("inline-flex items-center justify-center rounded-full font-semibold shrink-0 select-none",
        tone === "nav" ? "bg-nav-active text-fg-on-nav" : "bg-muted text-fg-muted border border-line")}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.4) }}>
      {initials(name)}
    </span>
  );
}

/* ============================== Panel ============================== */
export function Panel({ title, subtitle, actions, children, className, bodyClass, id, flush }: {
  title?: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; bodyClass?: string; id?: string; flush?: boolean;
}) {
  return (
    <section id={id} className={cn("bg-surface border border-line rounded-card shadow-card min-w-0", className)} aria-labelledby={title && id ? `${id}-h` : undefined}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 px-[var(--panel-pad)] py-2 min-h-[var(--panel-head-h)] border-b border-line">
          <div className="flex-1 min-w-0 flex items-baseline gap-2">
            {title && <h2 id={id ? `${id}-h` : undefined} className="t-sub truncate">{title}</h2>}
            {subtitle && <span className="t-help text-fg-muted truncate">{subtitle}</span>}
          </div>
          {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={cn(!flush && "p-[var(--panel-pad)]", bodyClass)}>{children}</div>
    </section>
  );
}

/* ============================== SummaryCard ============================== */
export function SummaryCard({ label, value, unit, delta, deltaTone = "neutral", hint, icon, onClick, series, loading, demo = true, state }: {
  label: string; value: React.ReactNode; unit?: string; delta?: string; deltaTone?: "up" | "down" | "neutral" | "warning";
  hint?: string; icon?: string; onClick?: () => void; series?: number[]; loading?: boolean; demo?: boolean; state?: "hover" | "focus";
}) {
  const Tag = onClick ? "button" : "div";
  const dcol = { up: "text-success", down: "text-danger", neutral: "text-fg-muted", warning: "text-warning" }[deltaTone];
  return (
    <Tag onClick={onClick} type={onClick ? "button" : undefined}
      className={cn("text-left bg-surface border border-line rounded-card shadow-card px-[var(--panel-pad)] pt-3 pb-3.5 flex flex-col gap-1 min-w-0 transition-colors",
        onClick && "hv:border-line-strong hv:bg-subtle", state === "hover" && "is-hover border-line-strong bg-subtle", state === "focus" && "is-focus")}>
      <div className="flex items-center gap-2 text-fg-muted">
        {icon && <Icon name={icon} size={15} />}
        <span className="t-label flex-1 truncate">{label}</span>
        {demo && <span className="t-help text-fg-subtle" title="Indicador demostrativo, sin definición de KPI aprobada">demo</span>}
      </div>
      {loading ? (
        <div className="flex flex-col gap-2 pt-1"><span className="skeleton h-7 w-28" /><span className="skeleton h-3 w-36" /></div>
      ) : (
        <>
          <div className="flex items-end justify-between gap-3">
            <span className="t-amount-lg text-fg">{value}{unit && <span className="text-sm font-medium text-fg-muted ml-1">{unit}</span>}</span>
            {series && <MiniBars data={series} />}
          </div>
          {(delta || hint) && (
            <p className="t-help flex items-center gap-1.5">
              {delta && <span className={cn("font-medium tnum", dcol)}>{delta}</span>}
              {hint && <span className="text-fg-muted truncate">{hint}</span>}
            </p>
          )}
        </>
      )}
    </Tag>
  );
}

export function MiniBars({ data, height = 28, width = 84, labels }: { data: number[]; height?: number; width?: number; labels?: string[] }) {
  const max = Math.max(...data);
  const bw = width / data.length;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Serie: ${data.join(", ")}`} className="shrink-0">
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * (height - 2));
        const last = i === data.length - 1;
        return (
          <rect key={i} x={i * bw + 1} y={height - h} width={bw - 3} height={h} rx={1}
            fill={last ? "var(--action)" : "var(--border-strong)"} opacity={last ? 1 : 0.45}>
            <title>{labels?.[i] ? `${labels[i]}: ${v}` : v}</title>
          </rect>
        );
      })}
    </svg>
  );
}

/* ============================== Tabs ============================== */
export interface TabDef { id: string; label: string; count?: number; icon?: string; alert?: boolean; disabled?: boolean }
export function Tabs({ tabs, value, onChange, variant = "line", size = "md", className, ariaLabel }: {
  tabs: TabDef[]; value: string; onChange: (id: string) => void; variant?: "line" | "segmented"; size?: "sm" | "md"; className?: string; ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();
  const onKey = (e: React.KeyboardEvent) => {
    const enabled = tabs.filter((t) => !t.disabled);
    const i = enabled.findIndex((t) => t.id === value);
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % enabled.length;
    if (e.key === "ArrowLeft") n = (i - 1 + enabled.length) % enabled.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = enabled.length - 1;
    if (n >= 0) {
      e.preventDefault();
      onChange(enabled[n].id);
      setTimeout(() => ref.current?.querySelector<HTMLElement>(`[data-tab="${enabled[n].id}"]`)?.focus(), 0);
    }
  };
  if (variant === "segmented")
    return (
      <div ref={ref} role="tablist" aria-label={ariaLabel} onKeyDown={onKey} className={cn("inline-flex max-w-full overflow-x-auto p-0.5 bg-muted rounded-control border border-line", className)}>
        {tabs.map((t) => (
          <button key={t.id} data-tab={t.id} role="tab" type="button" id={`${uid}-${t.id}`} aria-selected={t.id === value} tabIndex={t.id === value ? 0 : -1} disabled={t.disabled}
            onClick={() => onChange(t.id)}
            className={cn("px-2.5 rounded-[calc(var(--radius-control)-2px)] t-label inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap", size === "sm" ? "h-[calc(var(--control-h-sm)-6px)]" : "h-[calc(var(--control-h-md)-6px)]",
              t.id === value ? "bg-surface text-fg shadow-card" : "text-fg-muted hv:text-fg", t.disabled && "text-fg-subtle")}>
            {t.icon && <Icon name={t.icon} size={14} />}{t.label}
          </button>
        ))}
      </div>
    );
  return (
    <div ref={ref} role="tablist" aria-label={ariaLabel} onKeyDown={onKey} className={cn("flex items-end gap-1 border-b border-line overflow-x-auto", className)}>
      {tabs.map((t) => {
        const sel = t.id === value;
        return (
          <button key={t.id} data-tab={t.id} role="tab" type="button" id={`${uid}-${t.id}`} aria-selected={sel} tabIndex={sel ? 0 : -1} disabled={t.disabled}
            onClick={() => onChange(t.id)}
            className={cn("relative px-3 inline-flex items-center gap-1.5 whitespace-nowrap t-label transition-colors -mb-px border-b-2",
              size === "sm" ? "h-[var(--control-h-md)]" : "h-[var(--tab-h)]",
              sel ? "text-fg border-action" : "text-fg-muted border-transparent hv:text-fg hv:border-line-strong",
              t.disabled && "text-fg-subtle hv:border-transparent")}>
            {t.icon && <Icon name={t.icon} size={15} />}
            {t.label}
            {t.count !== undefined && (
              <span className={cn("min-w-5 h-5 px-1.5 rounded-full text-2xs leading-5 font-semibold tnum", sel ? "bg-action-soft text-action-fg" : "bg-muted text-fg-muted")}>{t.count}</span>
            )}
            {t.alert && <span className="h-1.5 w-1.5 rounded-full bg-danger" aria-label="requiere atención" />}
          </button>
        );
      })}
    </div>
  );
}

/* ============================== DescriptionList ============================== */
export interface DLItem { label: string; value: React.ReactNode; hint?: string; span?: 1 | 2 | 3; mono?: boolean; changed?: boolean }
export function DescriptionList({ items, columns = 3, className }: { items: DLItem[]; columns?: 1 | 2 | 3 | 4; className?: string }) {
  const cols = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3", 4: "grid-cols-2 xl:grid-cols-4" }[columns];
  return (
    <dl className={cn("grid gap-x-6 gap-y-3.5", cols, className)}>
      {items.map((it, i) => (
        <div key={i} className={cn("min-w-0 flex flex-col gap-0.5", it.span === 2 && "sm:col-span-2", it.span === 3 && "sm:col-span-2 xl:col-span-3")}>
          <dt className="t-help text-fg-muted">
            {it.label}
            {it.changed && <span className="t-caption text-warning whitespace-nowrap"> · modificado</span>}
          </dt>
          <dd className={cn("text-base text-fg break-words", it.mono && "t-ref text-sm")}>{it.value ?? <span className="text-fg-subtle">—</span>}</dd>
          {it.hint && <span className="t-help text-fg-muted">{it.hint}</span>}
        </div>
      ))}
    </dl>
  );
}

/* ============================== Timeline / ActivityLog ============================== */
export const EVENT_ICON: Record<string, { icon: string; tone: Tone }> = {
  create: { icon: "FilePlus2", tone: "info" },
  update: { icon: "PencilLine", tone: "neutral" },
  decision: { icon: "Gavel", tone: "review" },
  document: { icon: "Paperclip", tone: "neutral" },
  return: { icon: "Undo2", tone: "warning" },
  issue: { icon: "FileCheck2", tone: "brand" },
  comment: { icon: "MessageSquare", tone: "neutral" },
  system: { icon: "Cpu", tone: "neutral" },
};

export interface TLItem { id: string; who: string; action: React.ReactNode; when: string; kind: string; ref?: string }
export function Timeline({ items, onRef, dense }: { items: TLItem[]; onRef?: (ref: string) => void; dense?: boolean }) {
  return (
    <ol className="relative flex flex-col">
      {items.map((e, i) => {
        const k = EVENT_ICON[e.kind] ?? EVENT_ICON.system;
        const t = TONE_CLASSES[k.tone];
        return (
          <li key={e.id} className={cn("relative flex gap-3", dense ? "pb-3" : "pb-4", i === items.length - 1 && "pb-0")}>
            {i < items.length - 1 && <span className="absolute left-[13px] top-7 bottom-0 w-px bg-line" aria-hidden="true" />}
            <span className={cn("relative z-[1] h-7 w-7 shrink-0 rounded-full flex items-center justify-center border-2 border-surface", t.soft)}>
              <Icon name={k.icon} size={13} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="t-body"><span className="font-medium">{e.who}</span> <span className="text-fg">{e.action}</span></p>
              <p className="t-help text-fg-muted flex flex-wrap gap-x-2">
                <time dateTime={e.when} title={dateTime(e.when)}>{relative(e.when)} · {dateTime(e.when).slice(11)}</time>
                {e.ref && (onRef ? <button className="t-ref text-fg-link hv:underline min-h-6 inline-flex items-center" onClick={() => onRef(e.ref!)}>{e.ref}</button> : <span className="t-ref">{e.ref}</span>)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** ActivityLog: registro tabular auditable (quién, qué, cuándo, dónde). */
export function ActivityLog({ items }: { items: TLItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full t-table">
        <thead>
          <tr className="text-left text-fg-muted border-b border-line">
            <th className="font-medium py-2 pr-3 w-[150px]">Fecha y hora</th>
            <th className="font-medium py-2 pr-3 w-[160px]">Usuario</th>
            <th className="font-medium py-2 pr-3 w-[110px]">Tipo</th>
            <th className="font-medium py-2 pr-3">Evento</th>
            <th className="font-medium py-2 w-[130px]">Referencia</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => {
            const k = EVENT_ICON[e.kind] ?? EVENT_ICON.system;
            const lbl = { create: "Creación", update: "Modificación", decision: "Decisión", document: "Documento", return: "Devolución", issue: "Emisión", comment: "Comentario", system: "Sistema" }[e.kind] ?? e.kind;
            return (
              <tr key={e.id} className="border-b border-line last:border-0 align-top">
                <td className="py-2 pr-3 tnum text-fg-muted whitespace-nowrap">{dateTime(e.when)}</td>
                <td className="py-2 pr-3">{e.who}</td>
                <td className="py-2 pr-3"><span className={cn("inline-flex items-center gap-1", TONE_CLASSES[k.tone].fg)}><Icon name={k.icon} size={13} />{lbl}</span></td>
                <td className="py-2 pr-3">{e.action}</td>
                <td className="py-2 t-ref text-fg-muted">{e.ref}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============================== Pagination ============================== */
export function Pagination({ page, pageSize, total, onPage, onPageSize, sizes = [10, 20, 50] }: {
  page: number; pageSize: number; total: number; onPage: (p: number) => void; onPageSize?: (n: number) => void; sizes?: number[];
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3 t-table text-fg-muted">
      <div className="flex items-center gap-2">
        <span className="tnum">{from}–{to} de {total}</span>
        {onPageSize && (
          <>
            <span aria-hidden="true">·</span>
            <label htmlFor="page-size" className="whitespace-nowrap">Filas por página</label>
            <Select id="page-size" size="sm" className="w-[68px]" value={String(pageSize)} onChange={(e) => onPageSize(+e.target.value)} options={sizes.map((s) => ({ value: String(s), label: String(s) }))} />
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        <IconButton icon="ChevronLeft" label="Página anterior" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} />
        {nums.map((n, i) =>
          n === "…" ? <span key={i} className="px-1">…</span> : (
            <button key={i} type="button" onClick={() => onPage(n)} aria-current={n === page ? "page" : undefined}
              className={cn("h-[var(--control-h-sm)] min-w-[var(--control-h-sm)] px-2 rounded-control tnum t-label", n === page ? "bg-action-soft text-action-fg" : "text-fg-muted hv:bg-muted hv:text-fg")}>
              {n}
            </button>
          ),
        )}
        <IconButton icon="ChevronRight" label="Página siguiente" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)} />
      </div>
    </nav>
  );
}

/* ============================== DataTable ============================== */
export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  width?: number | string;
  minWidth?: number;
  hideBelow?: "lg" | "xl" | "2xl";
  sticky?: boolean;
}
export type Sort = { id: string; dir: "asc" | "desc" } | null;

export function DataTable<T extends { id: string }>({
  columns, rows, sort, onSort, onRowClick, selectable, selected, onSelect, loading, density = "comfortable", zebra, empty, rowActions, caption, activeRowId,
}: {
  columns: Column<T>[]; rows: T[]; sort?: Sort; onSort?: (s: Sort) => void; onRowClick?: (r: T) => void;
  selectable?: boolean; selected?: Set<string>; onSelect?: (s: Set<string>) => void; loading?: boolean;
  density?: "compact" | "comfortable"; zebra?: boolean; empty?: React.ReactNode; rowActions?: (r: T) => React.ReactNode; caption?: string; activeRowId?: string;
}) {
  const rowH = density === "compact" ? "h-[var(--row-h-dense)]" : "h-[var(--row-h)]";
  const hide = (h?: string) => (h === "lg" ? "hidden lg:table-cell" : h === "xl" ? "hidden xl:table-cell" : h === "2xl" ? "hidden 2xl:table-cell" : "");
  const allSel = selectable && rows.length > 0 && rows.every((r) => selected?.has(r.id));
  const someSel = selectable && rows.some((r) => selected?.has(r.id));
  const toggleAll = () => {
    const s = new Set(selected);
    if (allSel) rows.forEach((r) => s.delete(r.id)); else rows.forEach((r) => s.add(r.id));
    onSelect?.(s);
  };
  const cycle = (id: string) => {
    if (!onSort) return;
    if (!sort || sort.id !== id) onSort({ id, dir: "asc" });
    else if (sort.dir === "asc") onSort({ id, dir: "desc" });
    else onSort(null);
  };
  return (
    <div className="overflow-x-auto">
      <table className="dt w-full t-table border-separate border-spacing-0" data-zebra={zebra ? "true" : "false"}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {selectable && (
              <th className="w-10 pl-4 bg-subtle border-b border-line" scope="col">
                <Checkbox aria-label="Seleccionar todas las filas visibles" checked={!!allSel} indeterminate={!allSel && !!someSel} onChange={toggleAll} />
              </th>
            )}
            {columns.map((c) => {
              const active = sort?.id === c.id;
              const ariaSort = active ? (sort!.dir === "asc" ? "ascending" : "descending") : c.sortable ? "none" : undefined;
              return (
                <th key={c.id} scope="col" aria-sort={ariaSort as any} style={{ width: c.width, minWidth: c.minWidth }}
                  className={cn("h-9 px-2.5 first:pl-4 bg-subtle border-b border-line font-medium text-fg-muted whitespace-nowrap select-none",
                    c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left", hide(c.hideBelow))}>
                  {c.sortable ? (
                    <button type="button" onClick={() => cycle(c.id)}
                      className={cn("inline-flex items-center gap-1 rounded-badge hv:text-fg -mx-1 px-1 h-6", active && "text-fg", c.align === "right" && "flex-row-reverse")}>
                      {c.header}
                      <Icon name={active ? (sort!.dir === "asc" ? "ArrowUp" : "ArrowDown") : "ArrowUpDown"} size={13} className={active ? "text-action-fg" : "opacity-50"} />
                    </button>
                  ) : c.header}
                </th>
              );
            })}
            {rowActions && <th className="w-12 bg-subtle border-b border-line" scope="col"><span className="sr-only">Acciones</span></th>}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className={rowH}>
                  {selectable && <td className="pl-4 border-b border-line"><span className="skeleton block h-4 w-4" /></td>}
                  {columns.map((c, j) => (
                    <td key={c.id} className={cn("px-2.5 first:pl-4 border-b border-line", hide(c.hideBelow))}>
                      <span className={cn("skeleton block h-3.5", c.align === "right" ? "ml-auto w-20" : j === 0 ? "w-24" : "w-[70%]")} />
                    </td>
                  ))}
                  {rowActions && <td className="border-b border-line" />}
                </tr>
              ))
            : rows.length === 0
            ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="p-0">{empty}</td>
                </tr>
              )
            : rows.map((r) => {
                const sel = selected?.has(r.id);
                return (
                  <tr key={r.id}
                    onClick={onRowClick ? (e) => { if ((e.target as HTMLElement).closest("button,a,input,label,[role=menu]")) return; onRowClick(r); } : undefined}
                    className={cn(rowH, "group transition-colors", onRowClick && "cursor-pointer",
                      sel || r.id === activeRowId ? "[&>td]:bg-selected" : "hv:[&>td]:bg-subtle")}>
                    {selectable && (
                      <td className="pl-4 border-b border-line">
                        <Checkbox aria-label={`Seleccionar ${r.id}`} checked={!!sel} onChange={() => { const s = new Set(selected); sel ? s.delete(r.id) : s.add(r.id); onSelect?.(s); }} />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.id} className={cn("px-2.5 first:pl-4 border-b border-line align-middle", c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left", hide(c.hideBelow))}>
                        {c.cell(r)}
                      </td>
                    ))}
                    {rowActions && <td className="pr-2 border-b border-line text-right">{rowActions(r)}</td>}
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}

/* ============================== FilterChip ============================== */
export function FilterChip({ label, value, active, onClick, onClear, open }: { label: string; value?: string; active?: boolean; onClick?: () => void; onClear?: () => void; open?: boolean }) {
  return (
    <span className={cn("inline-flex items-center h-[var(--control-h-sm)] rounded-control border t-label transition-colors",
      active ? "border-action bg-action-soft text-action-fg" : "border-line-strong bg-surface text-fg hv:bg-muted")}>
      <button type="button" onClick={onClick} aria-expanded={open} className="inline-flex items-center gap-1.5 h-full pl-2.5 pr-2">
        {!active && <Icon name="Plus" size={13} className="text-fg-muted" />}
        <span className={cn(active && "text-fg-muted")}>{label}</span>
        {value && <span className="font-semibold max-w-[160px] truncate">{value}</span>}
        <Icon name="ChevronDown" size={13} />
      </button>
      {active && onClear && (
        <button type="button" aria-label={`Quitar filtro ${label}`} onClick={onClear} className="h-full px-1.5 border-l border-action/40 hv:bg-selected rounded-r-control">
          <Icon name="X" size={13} />
        </button>
      )}
    </span>
  );
}

/* ============================== Feedback: InlineAlert / Empty / Error / Skeleton ============================== */
export function InlineAlert({ tone = "info", title, children, action, onClose, className }: {
  tone?: "info" | "warning" | "danger" | "success" | "neutral"; title?: string; children?: React.ReactNode; action?: React.ReactNode; onClose?: () => void; className?: string;
}) {
  const map = {
    info: { icon: "Info", c: "bg-info-soft border-info/30 text-info" },
    warning: { icon: "TriangleAlert", c: "bg-warning-soft border-warning/30 text-warning" },
    danger: { icon: "CircleAlert", c: "bg-danger-soft border-danger/30 text-danger" },
    success: { icon: "CircleCheck", c: "bg-success-soft border-success/30 text-success" },
    neutral: { icon: "Info", c: "bg-muted border-line text-fg-muted" },
  }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-2.5 px-3 py-2.5 rounded-control border", map.c, className)}>
      <Icon name={map.icon} size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 text-fg">
        {title && <p className="t-sub">{title}</p>}
        {children && <div className="t-body text-fg">{children}</div>}
        {action && <div className="mt-2 flex gap-2">{action}</div>}
      </div>
      {onClose && <IconButton icon="X" label="Descartar aviso" size="sm" onClick={onClose} className="-mr-1 -mt-0.5" />}
    </div>
  );
}

export function EmptyState({ icon = "Inbox", title, body, action, secondary, compact }: { icon?: string; title: string; body?: string; action?: React.ReactNode; secondary?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center text-center mx-auto max-w-[var(--modal-w-sm)]", compact ? "py-8 gap-2" : "py-14 gap-3")}>
      <span className="h-11 w-11 rounded-full bg-muted text-fg-muted flex items-center justify-center"><Icon name={icon} size={20} /></span>
      <div>
        <p className="t-sub">{title}</p>
        {body && <p className="t-body text-fg-muted mt-1">{body}</p>}
      </div>
      {(action || secondary) && <div className="flex gap-2 mt-1">{secondary}{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "No pudimos cargar la información", body, code, onRetry, compact }: { title?: string; body?: string; code?: string; onRetry?: () => void; compact?: boolean }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center text-center mx-auto max-w-[460px]", compact ? "py-8 gap-2" : "py-14 gap-3")}>
      <span className="h-11 w-11 rounded-full bg-danger-soft text-danger flex items-center justify-center"><Icon name="ServerCrash" size={20} /></span>
      <div>
        <p className="t-sub">{title}</p>
        <p className="t-body text-fg-muted mt-1">{body ?? "El servicio no respondió a tiempo. Tus filtros se conservaron; vuelve a intentarlo."}</p>
        {code && <p className="t-help text-fg-subtle mt-1.5 t-ref">Código de soporte: {code}</p>}
      </div>
      {onRetry && <Button icon="RotateCw" onClick={onRetry}>Reintentar</Button>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={cn("skeleton block", className)} aria-hidden="true" />;
}

export function ProgressBar({ value, max = 100, tone = "action", label }: { value: number; max?: number; tone?: "action" | "success" | "warning"; label: string }) {
  const c = { action: "bg-action", success: "bg-success", warning: "bg-warning" }[tone];
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className={cn("h-full rounded-full", c)} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}
