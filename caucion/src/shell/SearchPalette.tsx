import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "./AppContext";
import { ALL_NAV } from "./nav";
import { tomador, asegurado } from "../data/mock";
import { SOLICITUD_STATUS } from "../domain/status";
import { StatusBadge } from "../components/ui/data";
import { Icon } from "../lib/icon";
import { cn } from "../lib/cn";

/** Búsqueda global (Ctrl K): solicitudes, instrumentos y módulos. */
export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { solicitudes, go } = useApp();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setQ(""); setActive(0); setTimeout(() => input.current?.focus(), 10); } }, [open]);

  const results = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const sol = solicitudes
      .filter((s) => !ql || [s.id, tomador(s.tomadorId).name, asegurado(s.aseguradoId).name, tomador(s.tomadorId).doc].join(" ").toLowerCase().includes(ql))
      .slice(0, ql ? 6 : 4)
      .map((s) => ({ kind: "sol" as const, id: s.id, title: s.id, sub: `${tomador(s.tomadorId).name} → ${asegurado(s.aseguradoId).name}`, s, run: () => go("expediente", { id: s.id }) }));
    const emi = !ql || "emi-2026-0089 consorcio vial".includes(ql) ? [{ kind: "emi" as const, id: "EMI-2026-0089", title: "EMI-2026-0089", sub: "Workspace de emisión · Consorcio Vial Demo Norte", run: () => go("emision") }] : [];
    const nav = ALL_NAV.filter((n) => !ql || n.label.toLowerCase().includes(ql)).slice(0, ql ? 5 : 3)
      .map((n) => ({ kind: "nav" as const, id: n.id, title: n.label, sub: n.group ?? "Inicio", icon: n.icon, run: () => go(n.id) }));
    return [...sol, ...emi, ...nav];
  }, [q, solicitudes]);

  if (!open) return null;
  const run = (i: number) => { results[i]?.run(); onClose(); };
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-center items-start pt-[12vh] px-4" role="dialog" aria-modal="true" aria-label="Búsqueda global"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
        if (e.key === "Enter") { e.preventDefault(); run(active); }
      }}>
      <div className="absolute inset-0 bg-overlay" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-[640px] bg-surface rounded-overlay shadow-modal overflow-hidden rise">
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-line">
          <Icon name="Search" size={18} className="text-fg-muted" />
          <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} placeholder="Buscar por N.º de solicitud, tomador, beneficiario o módulo"
            className="flex-1 bg-transparent outline-none text-md placeholder:text-fg-subtle" aria-label="Buscar" role="combobox" aria-expanded="true" aria-controls="gs-list"
            aria-activedescendant={results[active] ? `gs-${active}` : undefined} />
          <kbd className="t-ref text-2xs px-1.5 rounded-badge border border-line text-fg-muted">Esc</kbd>
        </div>
        <ul id="gs-list" role="listbox" className="max-h-[55vh] overflow-auto py-2">
          {results.length === 0 && <li className="px-4 py-8 text-center t-body text-fg-muted">Sin resultados para «{q}». Prueba con el N.º completo, p. ej. SOL-2026-0147.</li>}
          {results.map((r, i) => {
            const head = i === 0 || results[i - 1].kind !== r.kind;
            return (
              <React.Fragment key={r.kind + r.id}>
                {head && <li role="presentation" className="px-4 pt-2 pb-1 t-module text-fg-muted">{{ sol: "Solicitudes", emi: "Emisiones", nav: "Módulos" }[r.kind]}</li>}
                <li id={`gs-${i}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => run(i)}
                  className={cn("mx-2 px-2.5 py-2 rounded-control flex items-center gap-3 cursor-pointer", i === active && "bg-muted")}>
                  <span className="h-8 w-8 rounded-control bg-subtle border border-line flex items-center justify-center text-fg-muted shrink-0">
                    <Icon name={r.kind === "nav" ? (r as any).icon : r.kind === "emi" ? "FileStack" : "FileText"} size={16} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={cn("block truncate", r.kind === "nav" ? "t-label" : "t-ref font-medium")}>{r.title}</span>
                    <span className="block t-help text-fg-muted truncate">{r.sub}</span>
                  </span>
                  {r.kind === "sol" && <StatusBadge def={SOLICITUD_STATUS[(r as any).s.status as keyof typeof SOLICITUD_STATUS]} size="sm" />}
                  {i === active && <Icon name="CornerDownLeft" size={14} className="text-fg-muted" />}
                </li>
              </React.Fragment>
            );
          })}
        </ul>
        <div className="px-4 py-2 border-t border-line bg-subtle t-help text-fg-muted flex gap-4">
          <span><kbd className="t-ref">↑ ↓</kbd> moverse</span><span><kbd className="t-ref">Enter</kbd> abrir</span><span className="ml-auto">Datos ficticios</span>
        </div>
      </div>
    </div>,
    document.getElementById("overlay-root") ?? document.body,
  );
}
