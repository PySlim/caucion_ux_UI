// Vocabularios de estado. DEMOSTRATIVOS: ningún estado aquí constituye una
// definición de negocio aprobada. Cada vocabulario se diferencia por forma
// (icono + estilo) además de color, para no depender sólo del color.

export type Tone = "neutral" | "info" | "warning" | "review" | "success" | "danger" | "brand" | "accent";

export interface StatusDef { label: string; tone: Tone; icon: string; hint?: string }

/** Estado de la SOLICITUD (gestión comercial). No es el estado del instrumento. */
export type SolicitudStatus =
  | "borrador" | "recibida" | "evaluacion" | "observada" | "aprobacion" | "aprobada" | "rechazada" | "emitida" | "desistida";

export const SOLICITUD_STATUS: Record<SolicitudStatus, StatusDef> = {
  borrador:   { label: "Borrador",          tone: "neutral", icon: "PencilLine",   hint: "Captura incompleta, aún no enviada" },
  recibida:   { label: "Recibida",          tone: "info",    icon: "Inbox",        hint: "Ingresada, pendiente de asignación" },
  evaluacion: { label: "En evaluación",     tone: "info",    icon: "ScanSearch",   hint: "En análisis de riesgo / suscripción" },
  observada:  { label: "Observada",         tone: "warning", icon: "CircleAlert",  hint: "Devuelta para subsanación" },
  aprobacion: { label: "En aprobación",     tone: "review",  icon: "Stamp",        hint: "Esperando decisión humana" },
  aprobada:   { label: "Aprobada",          tone: "success", icon: "CircleCheck",  hint: "Decisión favorable registrada" },
  rechazada:  { label: "Rechazada",         tone: "danger",  icon: "CircleX",      hint: "Decisión desfavorable registrada" },
  emitida:    { label: "Emitida",           tone: "brand",   icon: "BadgeCheck",   hint: "Instrumento generado" },
  desistida:  { label: "Desistida",         tone: "neutral", icon: "CircleSlash",  hint: "Cerrada a pedido del cliente" },
};

/** Estado del INSTRUMENTO (la caución en sí). Vocabulario independiente. */
export type InstrumentStatus = "no_emitido" | "emitido" | "vigente" | "por_vencer" | "vencido" | "cancelado";
export const INSTRUMENT_STATUS: Record<InstrumentStatus, StatusDef> = {
  no_emitido: { label: "No emitido",  tone: "neutral", icon: "File" },
  emitido:    { label: "Emitido",     tone: "brand",   icon: "FileCheck2" },
  vigente:    { label: "Vigente",     tone: "success", icon: "ShieldCheck" },
  por_vencer: { label: "Por vencer",  tone: "warning", icon: "ShieldAlert" },
  vencido:    { label: "Vencido",     tone: "danger",  icon: "ShieldX" },
  cancelado:  { label: "Cancelado",   tone: "neutral", icon: "ShieldOff" },
};

/** Estado de una ACTIVIDAD dentro del workspace de emisión. */
export type ActivityStatus =
  | "no_iniciada" | "en_curso" | "pendiente_info" | "en_revision" | "devuelta" | "bloqueada" | "esperando_decision" | "completada";
export const ACTIVITY_STATUS: Record<ActivityStatus, StatusDef> = {
  no_iniciada:        { label: "No iniciada",               tone: "neutral", icon: "CircleDashed" },
  en_curso:           { label: "En curso",                  tone: "info",    icon: "CircleDot" },
  pendiente_info:     { label: "Pendiente de información",  tone: "warning", icon: "FileQuestion" },
  en_revision:        { label: "En revisión",               tone: "review",  icon: "Eye" },
  devuelta:           { label: "Devuelta para subsanación", tone: "danger",  icon: "Undo2" },
  bloqueada:          { label: "Bloqueada por dependencia", tone: "neutral", icon: "Lock" },
  esperando_decision: { label: "Esperando decisión",        tone: "review",  icon: "Gavel" },
  completada:         { label: "Completada",                tone: "success", icon: "CircleCheck" },
};

/** Estado de un DOCUMENTO del expediente. */
export type DocStatus = "validado" | "pendiente" | "en_revision" | "observado" | "vencido";
export const DOC_STATUS: Record<DocStatus, StatusDef> = {
  validado:    { label: "Validado",    tone: "success", icon: "CircleCheck" },
  pendiente:   { label: "Pendiente",   tone: "warning", icon: "Clock3" },
  en_revision: { label: "En revisión", tone: "info",    icon: "Eye" },
  observado:   { label: "Observado",   tone: "danger",  icon: "CircleAlert" },
  vencido:     { label: "Vencido",     tone: "danger",  icon: "CalendarX2" },
};

export const TONE_CLASSES: Record<Tone, { soft: string; solid: string; fg: string; dot: string; border: string }> = {
  neutral: { soft: "bg-neutral-soft text-fg-muted",   solid: "bg-neutral text-fg-on-status",      fg: "text-fg-muted", dot: "bg-neutral", border: "border-line-strong" },
  info:    { soft: "bg-info-soft text-info",          solid: "bg-info text-fg-on-status",         fg: "text-info",     dot: "bg-info",    border: "border-info" },
  warning: { soft: "bg-warning-soft text-warning",    solid: "bg-warning text-fg-on-status",      fg: "text-warning",  dot: "bg-warning", border: "border-warning" },
  review:  { soft: "bg-review-soft text-review",      solid: "bg-review text-fg-on-status",       fg: "text-review",   dot: "bg-review",  border: "border-review" },
  success: { soft: "bg-success-soft text-success",    solid: "bg-success text-fg-on-status",      fg: "text-success",  dot: "bg-success", border: "border-success" },
  danger:  { soft: "bg-danger-soft text-danger",      solid: "bg-danger text-fg-on-status",       fg: "text-danger",   dot: "bg-danger",  border: "border-danger" },
  brand:   { soft: "bg-inverse text-fg-on-inverse",   solid: "bg-inverse text-fg-on-inverse",      fg: "text-fg-brand", dot: "bg-fg-brand", border: "border-fg-brand" },
  accent:  { soft: "bg-accent-soft text-accent-fg",   solid: "bg-accent-fg text-fg-on-status",       fg: "text-accent-fg",dot: "bg-accent",  border: "border-accent" },
};
