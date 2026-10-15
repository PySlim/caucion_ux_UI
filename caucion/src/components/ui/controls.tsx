import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import { Icon } from "../../lib/icon";

/* Estado forzado sólo para el catálogo (muestra hover/focus sin interacción). */
export type ForcedState = "hover" | "focus" | undefined;
const forced = (s: ForcedState) => (s === "hover" ? "is-hover" : s === "focus" ? "is-focus" : "");

/* ============================== Spinner ============================== */
export function Spinner({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cn("spin", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ============================== Button ============================== */
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

const BTN_BASE =
  "relative inline-flex items-center justify-center gap-1.5 rounded-control font-medium whitespace-nowrap select-none transition-colors duration-100 " +
  "disabled:cursor-not-allowed aria-disabled:cursor-not-allowed";
const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-action text-fg-on-action hv:bg-action-hover active:bg-action-active disabled:bg-muted disabled:text-fg-subtle",
  secondary: "bg-surface text-fg border border-line-strong hv:bg-muted active:bg-line disabled:bg-surface disabled:text-fg-subtle disabled:border-line",
  tertiary: "text-action-fg hv:bg-action-soft active:bg-selected disabled:text-fg-subtle",
  danger: "bg-danger text-fg-on-status hv:bg-danger-hover disabled:bg-muted disabled:text-fg-subtle",
  quiet: "text-fg-muted hv:bg-muted hv:text-fg disabled:text-fg-subtle",
};
const BTN_SIZE: Record<ButtonSize, string> = {
  sm: "h-[var(--control-h-sm)] px-2.5 text-sm",
  md: "h-[var(--control-h-md)] px-3 text-sm",
  lg: "h-[var(--control-h-lg)] px-4 text-base",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  state?: ForcedState;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", icon, iconRight, loading, state, className, children, disabled, type = "button", ...rest },
  ref,
) {
  const iconSize = size === "lg" ? 18 : 16;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BTN_BASE, BTN_VARIANT[variant], BTN_SIZE[size], forced(state), loading && "cursor-progress", className)}
      {...rest}
    >
      {loading ? <Spinner size={iconSize - 2} /> : icon ? <Icon name={icon} size={iconSize} /> : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} size={iconSize} /> : null}
    </button>
  );
});

/* ============================== IconButton ============================== */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  label: string; // obligatorio: accesibilidad + tooltip nativo
  variant?: "quiet" | "secondary" | "primary" | "danger" | "nav";
  size?: "sm" | "md" | "lg";
  state?: ForcedState;
  badge?: number;
  loading?: boolean;
}
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = "quiet", size = "md", state, badge, loading, className, disabled, ...rest },
  ref,
) {
  const dims = size === "sm" ? "h-[var(--control-h-sm)] w-[var(--control-h-sm)]" : size === "lg" ? "h-[var(--control-h-lg)] w-[var(--control-h-lg)]" : "h-[var(--control-h-md)] w-[var(--control-h-md)]";
  const v = {
    quiet: "text-fg-muted hv:bg-muted hv:text-fg disabled:text-fg-subtle",
    secondary: "bg-surface border border-line-strong text-fg hv:bg-muted disabled:text-fg-subtle disabled:border-line",
    primary: "bg-action text-fg-on-action hv:bg-action-hover disabled:bg-muted disabled:text-fg-subtle",
    danger: "text-danger hv:bg-danger-soft disabled:text-fg-subtle",
    nav: "text-fg-on-nav-muted hv:bg-nav-hover hv:text-fg-on-nav",
  }[variant];
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      className={cn("relative inline-flex items-center justify-center rounded-control transition-colors", dims, v, forced(state), className)}
      {...rest}
    >
      {loading ? <Spinner /> : <Icon name={icon} size={size === "lg" ? 20 : 16} />}
      {badge ? (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-danger text-fg-on-status text-2xs leading-4 font-semibold tnum">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
});

/* ============================== Field ============================== */
export type FieldStatus = "default" | "error" | "success" | "warning";
export interface FieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  help?: string;
  error?: string;
  success?: string;
  className?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}
export function Field({ label, htmlFor, required, optional, help, error, success, className, children, aside }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1 min-w-0", className)}>
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={htmlFor} className="t-label text-fg">
            {label}
            {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
            {optional && <span className="t-help text-fg-muted ml-1">(opcional)</span>}
          </label>
          {aside}
        </div>
      )}
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-msg` : undefined} className="t-help text-danger flex items-start gap-1" role="alert">
          <Icon name="CircleAlert" size={14} className="mt-px" /> {error}
        </p>
      ) : success ? (
        <p id={htmlFor ? `${htmlFor}-msg` : undefined} className="t-help text-success flex items-start gap-1">
          <Icon name="CircleCheck" size={14} className="mt-px" /> {success}
        </p>
      ) : help ? (
        <p id={htmlFor ? `${htmlFor}-msg` : undefined} className="t-help text-fg-muted">{help}</p>
      ) : null}
    </div>
  );
}

/* ============================== Input ============================== */
const CONTROL =
  "w-full bg-surface text-fg border rounded-control transition-[border-color,box-shadow] duration-100 " +
  "focus:outline-none focus:border-focus focus:shadow-[0_0_0_1px_var(--border-focus)] " +
  "disabled:bg-muted disabled:text-fg-subtle disabled:border-line disabled:cursor-not-allowed " +
  "read-only:bg-subtle";
const STATUS_BORDER: Record<FieldStatus, string> = {
  default: "border-line-strong hv:border-fg-muted",
  error: "border-danger shadow-[0_0_0_1px_var(--danger)]",
  success: "border-success",
  warning: "border-warning",
};

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  status?: FieldStatus;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  icon?: string;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  state?: ForcedState;
  numeric?: boolean;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { status = "default", prefix, suffix, icon, loading, size = "md", state, numeric, className, ...rest },
  ref,
) {
  const h = size === "sm" ? "h-[var(--control-h-sm)]" : size === "lg" ? "h-[var(--control-h-lg)]" : "h-[var(--control-h-md)]";
  const hasLeft = !!(prefix || icon);
  return (
    <div className={cn("relative flex items-center min-w-0", className)}>
      {icon && <Icon name={icon} size={16} className="absolute left-2.5 text-fg-muted pointer-events-none" />}
      {prefix && (
        <span className="absolute left-0 h-full flex items-center px-2.5 text-fg-muted t-label border-r border-line pointer-events-none tnum">
          {prefix}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={status === "error" || undefined}
        className={cn(
          CONTROL, STATUS_BORDER[status], h, "text-base px-2.5",
          state === "hover" && "border-fg-muted",
          state === "focus" && "border-focus shadow-[0_0_0_1px_var(--border-focus)]",
          icon && "pl-8",
          prefix && "pl-12",
          (suffix || loading || status === "error" || status === "success") && "pr-8",
          numeric && "text-right tnum",
        )}
        {...rest}
      />
      <span className="absolute right-2.5 flex items-center gap-1 text-fg-muted pointer-events-none">
        {loading ? <Spinner /> : status === "error" ? <Icon name="CircleAlert" size={16} className="text-danger" /> : status === "success" ? <Icon name="CircleCheck" size={16} className="text-success" /> : suffix}
      </span>
      {hasLeft ? null : null}
    </div>
  );
});

/* ============================== Textarea ============================== */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  status?: FieldStatus;
  showCount?: boolean;
  state?: ForcedState;
}
export function Textarea({ status = "default", showCount, maxLength, value, state, className, ...rest }: TextareaProps) {
  const len = typeof value === "string" ? value.length : 0;
  return (
    <div className="relative">
      <textarea
        value={value}
        maxLength={maxLength}
        aria-invalid={status === "error" || undefined}
        className={cn(CONTROL, STATUS_BORDER[status], "min-h-20 px-2.5 py-1.5 text-base resize-y block",
          state === "focus" && "border-focus shadow-[0_0_0_1px_var(--border-focus)]", state === "hover" && "border-fg-muted", className)}
        {...rest}
      />
      {showCount && maxLength ? (
        <span className={cn("absolute right-2 bottom-1.5 t-help tnum", len > maxLength * 0.9 ? "text-warning" : "text-fg-subtle")}>
          {len}/{maxLength}
        </span>
      ) : null}
    </div>
  );
}

/* ============================== Select (nativo) ============================== */
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  status?: FieldStatus;
  options: { value: string; label: string }[];
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  state?: ForcedState;
}
export function Select({ status = "default", options, placeholder, size = "md", state, className, ...rest }: SelectProps) {
  const h = size === "sm" ? "h-[var(--control-h-sm)]" : size === "lg" ? "h-[var(--control-h-lg)]" : "h-[var(--control-h-md)]";
  return (
    <div className={cn("relative min-w-0", className)}>
      <select
        aria-invalid={status === "error" || undefined}
        className={cn(CONTROL, STATUS_BORDER[status], h, "appearance-none pl-2.5 pr-8 text-base",
          state === "focus" && "border-focus shadow-[0_0_0_1px_var(--border-focus)]", state === "hover" && "border-fg-muted")}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Icon name="ChevronDown" size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
    </div>
  );
}

/* ============================== Combobox ============================== */
export interface ComboOption { value: string; label: string; meta?: string }
export interface ComboboxProps {
  id?: string;
  options: ComboOption[];
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  status?: FieldStatus;
  disabled?: boolean;
  emptyText?: string;
}
export function Combobox({ id, options, value, onChange, placeholder = "Buscar…", status = "default", disabled, emptyText = "Sin coincidencias" }: ComboboxProps) {
  const autoId = useId();
  const cid = id ?? autoId;
  const selected = options.find((o) => o.value === value) || null;
  const [query, setQuery] = useState(selected?.label ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(selected?.label ?? ""); }, [value]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) { setOpen(false); setQuery(selected?.label ?? ""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q === selected?.label.toLowerCase()) return options;
    return options.filter((o) => (o.label + " " + (o.meta ?? "")).toLowerCase().includes(q));
  }, [query, options, selected]);

  const choose = (o: ComboOption) => { onChange(o.value); setQuery(o.label); setOpen(false); };

  return (
    <div ref={wrap} className="relative min-w-0">
      <Input
        id={cid}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${cid}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && filtered[active] ? `${cid}-opt-${active}` : undefined}
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        status={status}
        icon="Search"
        autoComplete="off"
        suffix={<Icon name="ChevronsUpDown" size={14} />}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); if (!e.target.value) onChange(null); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && open && filtered[active]) { e.preventDefault(); choose(filtered[active]); }
          else if (e.key === "Escape") { setOpen(false); setQuery(selected?.label ?? ""); }
        }}
      />
      {open && !disabled && (
        <ul id={`${cid}-list`} role="listbox" className="absolute z-30 mt-1 w-full max-h-64 overflow-auto bg-surface border border-line rounded-overlay shadow-popover py-1 rise">
          {filtered.length === 0 && <li className="px-3 py-2 t-help text-fg-muted">{emptyText}</li>}
          {filtered.map((o, i) => (
            <li
              key={o.value}
              id={`${cid}-opt-${i}`}
              role="option"
              aria-selected={o.value === value}
              onMouseDown={(e) => { e.preventDefault(); choose(o); }}
              onMouseEnter={() => setActive(i)}
              className={cn("px-3 py-1.5 flex items-center justify-between gap-3 cursor-pointer", i === active && "bg-muted")}
            >
              <span className="min-w-0">
                <span className="block truncate text-base">{o.label}</span>
                {o.meta && <span className="block t-help text-fg-muted t-ref">{o.meta}</span>}
              </span>
              {o.value === value && <Icon name="Check" size={16} className="text-action-fg" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============================== DatePicker ============================== */
const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromDisplay = (s: string) => {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  return d.getMonth() === +m[2] - 1 ? toIso(d) : null;
};
const toDisplay = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "");

export interface DatePickerProps {
  id?: string;
  value: string; // ISO yyyy-mm-dd
  onChange: (iso: string) => void;
  status?: FieldStatus;
  disabled?: boolean;
  min?: string;
}
export function DatePicker({ id, value, onChange, status = "default", disabled, min }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(toDisplay(value));
  const base = value ? new Date(value + "T12:00:00") : new Date("2026-10-15T12:00:00");
  const [view, setView] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => setText(toDisplay(value)), [value]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const first = new Date(view.y, view.m, 1);
  const offset = (first.getDay() + 6) % 7; // semana inicia lunes
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => i - offset + 1);
  const today = "2026-10-15";
  const shift = (n: number) => setView((v) => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  return (
    <div ref={wrap} className="relative">
      <Input
        id={id}
        value={text}
        placeholder="dd/mm/aaaa"
        disabled={disabled}
        status={status}
        inputMode="numeric"
        onChange={(e) => { setText(e.target.value); const iso = fromDisplay(e.target.value); if (iso) onChange(iso); }}
        onBlur={() => { if (text && !fromDisplay(text)) setText(toDisplay(value)); }}
        onKeyDown={(e) => { if (e.key === "ArrowDown" && e.altKey) setOpen(true); if (e.key === "Escape") setOpen(false); }}
        className="tnum"
      />
      <button
        type="button"
        disabled={disabled}
        aria-label="Abrir calendario"
        title="Abrir calendario"
        onClick={() => setOpen((o) => !o)}
        className={cn("absolute top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-badge text-fg-muted hv:bg-muted", status === "error" || status === "success" ? "right-8" : "right-1")}
      >
        <Icon name="Calendar" size={16} />
      </button>
      {open && (
        <div role="dialog" aria-label="Seleccionar fecha" className="absolute z-30 mt-1 w-[min(288px,calc(100vw-32px))] bg-surface border border-line rounded-overlay shadow-popover p-3 rise"
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
          <div className="flex items-center justify-between mb-2">
            <IconButton icon="ChevronLeft" label="Mes anterior" size="sm" onClick={() => shift(-1)} />
            <span className="t-sub" aria-live="polite">{MONTHS_ES[view.m]} {view.y}</span>
            <IconButton icon="ChevronRight" label="Mes siguiente" size="sm" onClick={() => shift(1)} />
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center" role="grid">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i} className="t-caption text-fg-muted py-1" aria-hidden="true">{d}</span>)}
            {cells.map((n, i) => {
              if (n < 1 || n > days) return <span key={i} />;
              const iso = `${view.y}-${pad(view.m + 1)}-${pad(n)}`;
              const sel = iso === value;
              const dis = !!min && iso < min;
              return (
                <button key={i} type="button" disabled={dis}
                  onClick={() => { onChange(iso); setOpen(false); }}
                  aria-pressed={sel}
                  aria-label={`${n} de ${MONTHS_ES[view.m]} de ${view.y}`}
                  className={cn("h-[min(var(--control-h-md),40px)] rounded-control text-sm tnum transition-colors",
                    sel ? "bg-action text-fg-on-action" : "hv:bg-muted",
                    iso === today && !sel && "ring-1 ring-inset ring-line-strong font-semibold",
                    dis && "text-fg-subtle line-through hv:bg-transparent")}
                >{n}</button>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-line">
            <Button size="sm" variant="tertiary" onClick={() => { onChange(today); setView({ y: 2026, m: 9 }); setOpen(false); }}>Hoy</Button>
            <Button size="sm" variant="quiet" onClick={() => { onChange(""); setOpen(false); }}>Limpiar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== Checkbox / Radio / Switch ============================== */
interface ChoiceProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
  indeterminate?: boolean;
  invalid?: boolean;
  state?: ForcedState;
}
export function Checkbox({ label, description, indeterminate, invalid, state, className, id, ...rest }: ChoiceProps) {
  const ref = useRef<HTMLInputElement>(null);
  const auto = useId();
  const cid = id ?? auto;
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return (
    <label htmlFor={cid} className={cn("inline-flex items-start gap-2 select-none min-h-6", !label && !description && "min-w-6 items-center justify-center", rest.disabled ? "cursor-not-allowed text-fg-subtle" : "cursor-pointer", className)}>
      <span className={cn("relative inline-flex", (label || description) && "mt-0.5")}>
        <input ref={ref} id={cid} type="checkbox" aria-invalid={invalid || undefined}
          className={cn("peer appearance-none h-4 w-4 rounded-check border bg-surface transition-colors",
            invalid ? "border-danger" : "border-line-strong",
            "checked:bg-action checked:border-action indeterminate:bg-action indeterminate:border-action",
            "disabled:bg-muted disabled:border-line disabled:checked:bg-fg-subtle disabled:checked:border-fg-subtle",
            "hv:border-fg-muted focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
            state === "hover" && "border-fg-muted", state === "focus" && "outline-2 outline-focus outline-offset-2")}
          {...rest} />
        <Icon name={indeterminate ? "Minus" : "Check"} size={12} strokeWidth={3}
          className={cn("absolute inset-0 m-auto text-fg-on-action pointer-events-none opacity-0", indeterminate ? "peer-indeterminate:opacity-100" : "peer-checked:opacity-100")} />
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-base leading-5">{label}</span>}
          {description && <span className="t-help text-fg-muted">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Radio({ label, description, invalid, state, className, id, ...rest }: ChoiceProps) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <label htmlFor={cid} className={cn("inline-flex items-start gap-2 select-none min-h-6", !label && !description && "min-w-6 items-center justify-center", rest.disabled ? "cursor-not-allowed text-fg-subtle" : "cursor-pointer", className)}>
      <span className="relative inline-flex mt-0.5">
        <input id={cid} type="radio" aria-invalid={invalid || undefined}
          className={cn("peer appearance-none h-4 w-4 rounded-full border bg-surface transition-colors",
            invalid ? "border-danger" : "border-line-strong",
            "checked:border-action checked:border-[5px] disabled:bg-muted disabled:border-line disabled:checked:border-fg-subtle",
            "hv:border-fg-muted focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2",
            state === "hover" && "border-fg-muted", state === "focus" && "outline-2 outline-focus outline-offset-2")}
          {...rest} />
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-base leading-5">{label}</span>}
          {description && <span className="t-help text-fg-muted">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Switch({ checked, onChange, label, description, disabled, loading, state, id }: {
  checked: boolean; onChange?: (v: boolean) => void; label?: string; description?: string; disabled?: boolean; loading?: boolean; state?: ForcedState; id?: string;
}) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <div className="inline-flex items-start gap-2.5">
      <button
        id={cid}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        onClick={() => onChange?.(!checked)}
        className={cn("group/sw relative -my-0.5 h-6 w-11 shrink-0 inline-flex items-center justify-center rounded-full",
          disabled && "cursor-not-allowed", state === "focus" && "is-focus")}
      >
        <span aria-hidden="true" className={cn("relative h-5 w-9 rounded-full transition-colors border",
          checked ? "bg-action border-action group-hover/sw:bg-action-hover" : "bg-muted border-line-strong group-hover/sw:border-fg-muted",
          disabled && "opacity-50", state === "hover" && (checked ? "bg-action-hover" : "border-fg-muted"))}>
          <span className={cn("absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-surface shadow-card transition-[left] flex items-center justify-center",
            checked ? "left-[18px]" : "left-0.5")}>
            {loading && <Spinner size={10} className="text-action-fg" />}
          </span>
        </span>
      </button>
      {(label || description) && (
        <label htmlFor={cid} className="flex flex-col cursor-pointer">
          {label && <span className="text-base leading-5">{label}</span>}
          {description && <span className="t-help text-fg-muted">{description}</span>}
        </label>
      )}
    </div>
  );
}

/* ============================== Search ============================== */
export function SearchInput({ value, onChange, placeholder = "Buscar", shortcut, loading, className, id, size = "md", onKeyDown, inputRef }: {
  value: string; onChange: (v: string) => void; placeholder?: string; shortcut?: string; loading?: boolean; className?: string; id?: string; size?: "sm" | "md" | "lg";
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>; inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div className={cn("relative min-w-0", className)} role="search">
      <Input
        ref={inputRef}
        id={id}
        type="search"
        size={size}
        icon="Search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        loading={loading}
        className="[&_input::-webkit-search-cancel-button]:hidden"
        suffix={!value && shortcut ? <kbd className="t-ref text-2xs px-1 rounded-badge border border-line text-fg-muted">{shortcut}</kbd> : undefined}
      />
      {value && !loading && (
        <button type="button" aria-label="Limpiar búsqueda" title="Limpiar búsqueda" onClick={() => onChange("")}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-badge text-fg-muted hv:bg-muted hv:text-fg">
          <Icon name="X" size={14} />
        </button>
      )}
    </div>
  );
}

/* ============================== FileUpload ============================== */
export interface UploadItem { id: string; name: string; size: number; progress: number; error?: string }
export function FileUpload({ accept = ".pdf,.docx,.xlsx,.jpg,.png", maxMb = 15, onUploaded, compact, disabled }: {
  accept?: string; maxMb?: number; onUploaded?: (f: UploadItem) => void; compact?: boolean; disabled?: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const exts = accept.split(",").map((s) => s.trim().toLowerCase());

  const add = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
      const item: UploadItem = { id: Math.random().toString(36).slice(2), name: f.name, size: f.size, progress: 0 };
      if (!exts.includes(ext)) item.error = `Formato no admitido. Usa ${exts.join(", ")}.`;
      else if (f.size > maxMb * 1024 * 1024) item.error = `Supera ${maxMb} MB. Comprime el archivo o divídelo.`;
      setItems((s) => [item, ...s]);
      if (!item.error) {
        let p = 0;
        const t = setInterval(() => {
          p = Math.min(100, p + 18 + Math.random() * 20);
          setItems((s) => s.map((x) => (x.id === item.id ? { ...x, progress: p } : x)));
          if (p >= 100) { clearInterval(t); onUploaded?.({ ...item, progress: 100 }); }
        }, 220);
      }
    });
  };
  const fmt = (b: number) => (b > 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled) add(e.dataTransfer.files); }}
        className={cn("rounded-card border border-dashed flex items-center gap-3 transition-colors",
          compact ? "px-3 py-2.5" : "px-4 py-5 flex-col text-center",
          disabled ? "bg-muted border-line text-fg-subtle" : drag ? "border-action bg-action-soft" : "border-line-strong bg-subtle")}
      >
        <Icon name="Upload" size={compact ? 16 : 20} className={drag ? "text-action-fg" : "text-fg-muted"} />
        <div className={cn("t-body", compact && "flex-1")}>
          <span>{drag ? "Suelta para adjuntar" : "Arrastra archivos aquí o "}</span>
          {!drag && (
            <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="text-fg-link font-medium underline underline-offset-2 hv:no-underline">
              selecciónalos
            </button>
          )}
          <p className="t-help text-fg-muted mt-0.5">{exts.join(" · ").replace(/\./g, "").toUpperCase()} · máx. {maxMb} MB por archivo</p>
        </div>
        <input ref={input} type="file" multiple accept={accept} className="sr-only" tabIndex={-1} aria-label="Seleccionar archivos para adjuntar" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>
      {items.length > 0 && (
        <ul className="flex flex-col gap-1.5" aria-live="polite">
          {items.map((it) => (
            <li key={it.id} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-control border", it.error ? "border-danger bg-danger-soft" : "border-line bg-surface")}>
              <Icon name={it.error ? "FileX2" : it.progress >= 100 ? "FileCheck2" : "File"} size={16} className={it.error ? "text-danger" : it.progress >= 100 ? "text-success" : "text-fg-muted"} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <span className="truncate t-label">{it.name}</span>
                  <span className="t-help text-fg-muted tnum shrink-0">{it.error ? "Error" : it.progress >= 100 ? fmt(it.size) : Math.round(it.progress) + " %"}</span>
                </div>
                {it.error ? (
                  <p className="t-help text-danger">{it.error}</p>
                ) : it.progress < 100 ? (
                  <div className="h-1 mt-1 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={Math.round(it.progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Cargando ${it.name}`}>
                    <div className="h-full bg-action transition-[width]" style={{ width: it.progress + "%" }} />
                  </div>
                ) : (
                  <p className="t-help text-success">Cargado · pendiente de clasificación</p>
                )}
              </div>
              <IconButton icon="X" label={`Quitar ${it.name}`} size="sm" onClick={() => setItems((s) => s.filter((x) => x.id !== it.id))} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
