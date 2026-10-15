import React, { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";
import { Icon } from "../../lib/icon";
import { Button, IconButton, Textarea, Field } from "./controls";

/* ---------- utilidades de foco ---------- */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function useFocusTrap(open: boolean, ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const t = setTimeout(() => {
      const auto = el?.querySelector<HTMLElement>("[data-autofocus]");
      (auto ?? el?.querySelector<HTMLElement>(FOCUSABLE))?.focus();
    }, 10);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab" && el) {
        const f = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [open]);
}

/** Mantiene un popover dentro del viewport desplazándolo horizontalmente si desborda. */
export function useViewportClamp(open: boolean, ref: React.RefObject<HTMLElement | null>, margin = 8) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    el.style.translate = "";
    const r = el.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    let dx = 0;
    if (r.right > vw - margin) dx = vw - margin - r.right;
    if (r.left + dx < margin) dx = margin - r.left;
    if (dx) el.style.translate = `${Math.round(dx)}px 0`;
  }, [open]);
}

function Portal({ children }: { children: React.ReactNode }) {
  const host = document.getElementById("overlay-root") ?? document.body;
  return createPortal(children, host);
}

/* ============================== Modal ============================== */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
  dismissable?: boolean;
  inline?: boolean; // para el catálogo: render sin portal ni backdrop fijo
}
export function Modal({ open, onClose, title, description, size = "md", children, footer, dismissable = true, inline }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tid = useId();
  const did = useId();
  useFocusTrap(open && !inline, ref, () => dismissable && onClose());
  if (!open) return null;
  const w = { sm: "max-w-[var(--modal-w-sm)]", md: "max-w-[var(--modal-w-md)]", lg: "max-w-[var(--modal-w-lg)]", xl: "max-w-[var(--modal-w-xl)]" }[size];
  const panel = (
    <div ref={ref} role="dialog" aria-modal={!inline} aria-labelledby={tid} aria-describedby={description ? did : undefined}
      className={cn("relative w-full bg-surface rounded-overlay shadow-modal flex flex-col rise", w,
        inline ? "max-h-none" : "max-h-[calc(100dvh-48px)] max-sm:max-w-none max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none")}>
      <header className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-line shrink-0" style={{ paddingTop: inline ? undefined : "max(16px, env(safe-area-inset-top, 0px))" }}>
        <div className="flex-1 min-w-0">
          <h2 id={tid} className="t-section">{title}</h2>
          {description && <p id={did} className="t-body text-fg-muted mt-0.5">{description}</p>}
        </div>
        {dismissable && <IconButton icon="X" label="Cerrar" onClick={onClose} className="-mr-1.5 -mt-0.5" />}
      </header>
      <div className="px-5 py-4 overflow-auto flex-1 min-h-0">{children}</div>
      {footer && <footer className="px-5 py-3 border-t border-line flex flex-wrap items-center justify-end gap-2 bg-subtle rounded-b-overlay max-sm:rounded-none shrink-0 max-sm:flex-col-reverse max-sm:items-stretch" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}>{footer}</footer>}
    </div>
  );
  if (inline) return panel;
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-overlay" onClick={() => dismissable && onClose()} aria-hidden="true" />
        {panel}
      </div>
    </Portal>
  );
}

/* ============================== Drawer ============================== */
export function Drawer({ open, onClose, title, subtitle, children, footer, width = 480, inline }: {
  open: boolean; onClose: () => void; title: React.ReactNode; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; width?: number; inline?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tid = useId();
  useFocusTrap(open && !inline, ref, onClose);
  if (!open) return null;
  const panel = (
    <aside ref={ref} role="dialog" aria-modal={!inline} aria-labelledby={tid}
      style={{ width: inline ? "100%" : `min(${width}px, 100vw)` }}
      className={cn("bg-surface flex flex-col", inline ? "border border-line rounded-overlay shadow-popover h-full" : "absolute right-0 top-0 h-full shadow-modal slide-in")}>
      <header className="flex items-start gap-3 px-5 py-4 border-b border-line">
        <div className="flex-1 min-w-0">
          <h2 id={tid} className="t-section">{title}</h2>
          {subtitle && <div className="t-body text-fg-muted mt-0.5">{subtitle}</div>}
        </div>
        <IconButton icon="X" label="Cerrar panel" onClick={onClose} className="-mr-1.5" />
      </header>
      <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
      {footer && <footer className="px-5 py-3 border-t border-line flex items-center justify-end gap-2">{footer}</footer>}
    </aside>
  );
  if (inline) return panel;
  return (
    <Portal>
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-overlay" onClick={onClose} aria-hidden="true" />
        {panel}
      </div>
    </Portal>
  );
}

/* ============================== Dropdown (menú) ============================== */
export interface MenuItem {
  label?: string; icon?: string; onSelect?: () => void; danger?: boolean; disabled?: boolean; shortcut?: string; separator?: boolean; hint?: string; checked?: boolean;
}
export function Dropdown({ trigger, items, align = "end", width = 220, header }: {
  trigger: (p: { onClick: () => void; "aria-expanded": boolean; "aria-haspopup": "menu"; ref: React.Ref<any> }) => React.ReactNode;
  items: MenuItem[]; align?: "start" | "end"; width?: number; header?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const trig = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useViewportClamp(open, menu);
  const actionable = items.map((it, i) => (!it.separator && !it.disabled ? i : -1)).filter((i) => i >= 0);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    setActive(actionable[0] ?? -1);
    setTimeout(() => menu.current?.focus(), 0);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const close = () => { setOpen(false); trig.current?.focus(); };
  const onKey = (e: React.KeyboardEvent) => {
    const pos = actionable.indexOf(active);
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(actionable[(pos + 1) % actionable.length]); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(actionable[(pos - 1 + actionable.length) % actionable.length]); }
    else if (e.key === "Home") { e.preventDefault(); setActive(actionable[0]); }
    else if (e.key === "End") { e.preventDefault(); setActive(actionable[actionable.length - 1]); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); const it = items[active]; if (it) { close(); it.onSelect?.(); } }
    else if (e.key === "Escape" || e.key === "Tab") { close(); }
  };

  return (
    <div ref={wrap} className="relative inline-flex">
      {trigger({ onClick: () => setOpen((o) => !o), "aria-expanded": open, "aria-haspopup": "menu", ref: trig })}
      {open && (
        <div ref={menu} role="menu" tabIndex={-1} onKeyDown={onKey}
          aria-activedescendant={active >= 0 ? `mi-${active}` : undefined}
          style={{ width: `min(${width}px, calc(100vw - 16px))` }}
          className={cn("absolute z-40 top-full mt-1 bg-surface border border-line rounded-overlay shadow-popover py-1 outline-none rise", align === "end" ? "right-0" : "left-0")}>
          {header}
          {items.map((it, i) =>
            it.separator ? (
              <div key={i} role="separator" className="my-1 border-t border-line" />
            ) : (
              <div key={i} id={`mi-${i}`} role="menuitem" aria-disabled={it.disabled || undefined}
                onMouseEnter={() => !it.disabled && setActive(i)}
                onClick={() => { if (it.disabled) return; close(); it.onSelect?.(); }}
                className={cn("mx-1 px-2 min-h-[var(--menu-item-h)] py-1 flex items-center gap-2 rounded-control text-base cursor-pointer",
                  it.disabled ? "text-fg-subtle cursor-not-allowed" : it.danger ? "text-danger" : "text-fg",
                  i === active && !it.disabled && (it.danger ? "bg-danger-soft" : "bg-muted"))}>
                {it.icon ? <Icon name={it.icon} size={16} className={it.danger ? "" : "text-fg-muted"} /> : it.checked !== undefined ? <span className="w-4" /> : null}
                <span className="flex-1 min-w-0 truncate">{it.label}</span>
                {it.checked && <Icon name="Check" size={16} className="text-action-fg" />}
                {it.shortcut && <kbd className="t-ref text-2xs text-fg-muted">{it.shortcut}</kbd>}
                {it.hint && <span className="t-help text-fg-muted">{it.hint}</span>}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/* ============================== Tooltip ============================== */
export function Tooltip({ content, children, side = "top", align = "center", forceOpen }: { content: React.ReactNode; children: React.ReactElement; side?: "top" | "bottom" | "right"; align?: "center" | "start"; forceOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const show = open || forceOpen;
  const h = align === "start" ? "left-0" : "left-1/2 -translate-x-1/2";
  const pos = { top: `bottom-full mb-1.5 ${h}`, bottom: `top-full mt-1.5 ${h}`, right: "left-full ml-2 top-1/2 -translate-y-1/2" }[side];
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      {React.cloneElement(children as React.ReactElement<any>, { "aria-describedby": show ? id : undefined })}
      {show && (
        <span role="tooltip" id={id} className={cn("absolute z-50 pointer-events-none whitespace-nowrap max-sm:whitespace-normal max-sm:w-max max-sm:max-w-[240px] px-2 py-1 rounded-control bg-inverse text-fg-on-inverse t-help shadow-popover", pos)}>
          {content}
        </span>
      )}
    </span>
  );
}

/* ============================== Toast ============================== */
export type ToastTone = "success" | "danger" | "warning" | "info";
export interface ToastData { id: string; tone: ToastTone; title: string; body?: string; action?: { label: string; onClick: () => void } }
const ToastCtx = createContext<{ push: (t: Omit<ToastData, "id">) => void }>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastView({ t, onClose, inline }: { t: ToastData; onClose: () => void; inline?: boolean }) {
  const icon = { success: "CircleCheck", danger: "CircleX", warning: "TriangleAlert", info: "Info" }[t.tone];
  const col = { success: "text-success", danger: "text-danger", warning: "text-warning", info: "text-info" }[t.tone];
  const bar = { success: "bg-success", danger: "bg-danger", warning: "bg-warning", info: "bg-info" }[t.tone];
  return (
    <div role={t.tone === "danger" ? "alert" : "status"} className={cn("relative bg-surface", inline ? "w-full max-w-[var(--toast-w)]" : "w-[var(--toast-w)] max-w-[calc(100vw-32px)]", "border border-line rounded-overlay shadow-popover pl-4 pr-2 py-3 flex gap-3 overflow-hidden", !inline && "slide-in")}>
      <span className={cn("absolute left-0 top-0 bottom-0 w-1", bar)} aria-hidden="true" />
      <Icon name={icon} size={18} className={cn("mt-px", col)} />
      <div className="flex-1 min-w-0">
        <p className="t-sub">{t.title}</p>
        {t.body && <p className="t-body text-fg-muted mt-0.5">{t.body}</p>}
        {t.action && <button className="mt-1.5 t-label text-fg-link hv:underline" onClick={() => { t.action!.onClick(); onClose(); }}>{t.action.label}</button>}
      </div>
      <IconButton icon="X" label="Cerrar notificación" size="sm" onClick={onClose} />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const push = useCallback((t: Omit<ToastData, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((s) => [...s.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), t.tone === "danger" ? 9000 : 5500);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed z-[60] bottom-4 right-4 max-sm:left-4 flex flex-col gap-2 items-end max-sm:items-stretch" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", paddingRight: "env(safe-area-inset-right, 0px)" }} aria-live="polite">
        {toasts.map((t) => <ToastView key={t.id} t={t} onClose={() => setToasts((s) => s.filter((x) => x.id !== t.id))} />)}
      </div>
    </ToastCtx.Provider>
  );
}

/* ============================== ConfirmDialog ============================== */
export interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => void | Promise<void>;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  tone?: "default" | "danger";
  requireComment?: boolean;
  commentLabel?: string;
  inline?: boolean;
}
export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel, tone = "default", requireComment, commentLabel = "Comentario", inline }: ConfirmProps) {
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setComment(""); setErr(""); setBusy(false); } }, [open]);
  const submit = async () => {
    if (requireComment && comment.trim().length < 10) { setErr("Escribe al menos 10 caracteres para dejar trazabilidad de la decisión."); return; }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    await onConfirm(comment);
    setBusy(false);
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" inline={inline}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} loading={busy} onClick={submit}>{confirmLabel}</Button>
      </>}>
      <div className="flex gap-3">
        <span className={cn("h-8 w-8 shrink-0 rounded-full flex items-center justify-center", tone === "danger" ? "bg-danger-soft text-danger" : "bg-action-soft text-action-fg")}>
          <Icon name={tone === "danger" ? "TriangleAlert" : "Info"} size={16} />
        </span>
        <div className="flex-1 flex flex-col gap-3 t-body">
          <div>{body}</div>
          {requireComment && (
            <Field label={commentLabel} htmlFor="confirm-comment" required error={err} help="Queda registrado en el historial del expediente.">
              <Textarea id="confirm-comment" data-autofocus value={comment} maxLength={500} showCount status={err ? "error" : "default"}
                onChange={(e) => { setComment(e.target.value); if (err) setErr(""); }} />
            </Field>
          )}
        </div>
      </div>
    </Modal>
  );
}
