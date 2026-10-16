import React, { useEffect, useRef, useState } from "react";
import { FilterChip } from "../ui/data";
import { Checkbox, Button, SearchInput } from "../ui/controls";
import { cn } from "../../lib/cn";
import { useViewportClamp } from "../ui/overlays";

export interface FilterOption { value: string; label: string; count?: number; adornment?: React.ReactNode }

/** Filtro multi-selección: chip + popover con búsqueda, contadores y aplicar/limpiar. */
export function FilterMenu({ label, options, value, onChange, searchable, width = 260 }: {
  label: string; options: FilterOption[]; value: string[]; onChange: (v: string[]) => void; searchable?: boolean; width?: number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);
  const [q, setQ] = useState("");
  const wrap = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  useViewportClamp(open, pop);
  useEffect(() => { if (open) { setDraft(value); setQ(""); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open]);

  const shown = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  const summary = value.length === 0 ? undefined : value.length === 1 ? options.find((o) => o.value === value[0])?.label : `${value.length} seleccionados`;

  return (
    <div ref={wrap} className="relative">
      <FilterChip label={label} value={summary} active={value.length > 0} open={open} onClick={() => setOpen((o) => !o)} onClear={() => onChange([])} />
      {open && (
        <div ref={pop} role="dialog" aria-label={`Filtrar por ${label}`} style={{ width: `min(${width}px, calc(100vw - 16px))` }}
          className="absolute z-30 left-0 mt-1 bg-surface border border-line rounded-overlay shadow-popover rise">
          {searchable && <div className="p-2 border-b border-line"><SearchInput size="sm" value={q} onChange={setQ} placeholder={`Buscar ${label.toLowerCase()}`} /></div>}
          <div className="max-h-72 overflow-auto py-1.5 px-1">
            {shown.map((o) => (
              <div key={o.value} className="flex items-center justify-between gap-2 px-2 py-1 rounded-control hv:bg-muted">
                <Checkbox
                  label={<span className="inline-flex items-center gap-2">{o.adornment}{o.label}</span>}
                  checked={draft.includes(o.value)}
                  onChange={() => setDraft((d) => (d.includes(o.value) ? d.filter((x) => x !== o.value) : [...d, o.value]))}
                />
                {o.count !== undefined && <span className={cn("t-help tnum", o.count ? "text-fg-muted" : "text-fg-subtle")}>{o.count}</span>}
              </div>
            ))}
            {shown.length === 0 && <p className="px-2 py-2 t-help text-fg-muted">Sin coincidencias</p>}
          </div>
          <div className="flex justify-between gap-2 p-2 border-t border-line bg-subtle rounded-b-overlay">
            <Button size="sm" variant="quiet" onClick={() => setDraft([])} disabled={draft.length === 0}>Limpiar</Button>
            <Button size="sm" variant="primary" onClick={() => { onChange(draft); setOpen(false); }}>Aplicar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
