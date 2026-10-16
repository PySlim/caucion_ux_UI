import type { Currency } from "../lib/format";
import type { Tone, StatusDef, ActivityStatus, DocStatus, InstrumentStatus } from "./status";
import { ACTIVITY_STATUS, INSTRUMENT_STATUS, DOC_STATUS } from "./status";

export type TipoCaucion =
  | "Fiel cumplimiento"
  | "Adelanto directo"
  | "Adelanto de materiales"
  | "Seriedad de oferta"
  | "Garantía aduanera"
  | "Buen uso de anticipo";

/** Estados de la operación de emisión (caso de negocio) */
export type EmisionStatus =
  | "en_evaluacion"
  | "observada"
  | "en_aprobacion"
  | "lista_emision"
  | "emitida"
  | "bloqueada";

export const EMISION_STATUS: Record<EmisionStatus, StatusDef> = {
  en_evaluacion: { label: "En evaluación",     tone: "info",    icon: "ScanSearch",  hint: "Evaluaciones técnicas, legales o financieras en curso" },
  observada:     { label: "Con observaciones", tone: "warning", icon: "CircleAlert", hint: "Devuelta para subsanación o aclaración" },
  en_aprobacion: { label: "En aprobación",     tone: "review",  icon: "Stamp",       hint: "Evaluaciones concluidas, esperando aprobación colegiada" },
  lista_emision: { label: "Lista para emitir", tone: "accent",  icon: "Check",       hint: "Todas las condiciones cumplidas. Lista para emisión de póliza" },
  emitida:       { label: "Póliza emitida",    tone: "brand",   icon: "BadgeCheck",  hint: "Instrumento y póliza emitidos satisfactoriamente" },
  bloqueada:     { label: "Bloqueada",         tone: "neutral", icon: "Lock",        hint: "Bloqueada por dependencias o garantías críticas pendientes" },
};

/** Frentes de evaluación obligatorios */
export type FrenteEvaluacion = "Comercial" | "Financiera" | "Técnica" | "Legal" | "Riesgos" | "Suscripción";

export type EstadoEvaluacion = "aprobada" | "en_revision" | "observada" | "pendiente" | "rechazada";

export const EVALUACION_STATUS: Record<EstadoEvaluacion, StatusDef> = {
  aprobada:    { label: "Favorable / Aprobada", tone: "success", icon: "CircleCheck" },
  en_revision: { label: "En revisión",          tone: "review",  icon: "Eye" },
  observada:   { label: "Con observaciones",    tone: "warning", icon: "CircleAlert" },
  pendiente:   { label: "Pendiente",            tone: "neutral", icon: "Clock3" },
  rechazada:   { label: "Desfavorable",         tone: "danger",  icon: "CircleX" },
};

/** Evaluador por frente */
export interface EvaluacionFrenteItem {
  id: string;
  frente: FrenteEvaluacion;
  responsable: string;
  estado: EstadoEvaluacion;
  dictamen: string;
  fecha: string;
  condiciones?: string[];
  observaciones?: string[];
}

/** Documento contractual o de soporte para la emisión */
export interface DocumentoEmision {
  id: string;
  nombre: string;
  categoria: "Contractual" | "Legal" | "Financiero" | "Garantía" | "Técnico";
  obligatorio: boolean;
  status: DocStatus;
  version: number;
  size: string;
  subidoPor: string;
  fecha: string;
  nota?: string;
}

/** Tarea / Actividad del Workflow operacional */
export interface ActividadWorkflow {
  id: string;
  name: string;
  lane: string;
  col: number;
  frente: FrenteEvaluacion;
  status: ActivityStatus;
  owner: string;
  deps: string[];
  detail: string;
  since: string;
  slaHoras: number;
  slaEstado: "en_plazo" | "por_vencer" | "excedido";
  prioridad: "normal" | "alta";
  returns?: number;
  observaciones?: string[];
}

/** Decisión humana registrada */
export interface DecisionHumana {
  id: string;
  titulo: string;
  actividadId: string;
  frente: FrenteEvaluacion;
  solicitadaPor: string;
  responsable: string;
  cuando: string;
  contexto: string;
  estado: "pendiente" | "aprobada" | "devuelta" | "rechazada";
  fundamentacion?: string;
  condiciones?: string[];
}

/** Evento inmutable de auditoría */
export interface EventoAuditoria {
  id: string;
  who: string;
  action: string;
  ref: string;
  when: string;
  kind: "create" | "update" | "decision" | "document" | "return" | "issue" | "comment" | "system";
}

/** Póliza generada */
export interface PolizaEmitida {
  numero: string;
  fechaEmision: string;
  emitidoPor: string;
  hashVerificacion: string;
  tasaAnual: number;
  primaNeta: number;
  moneda: Currency;
  codigoVerificacionQR: string;
}

/** Caso de negocio principal: Operación de Emisión */
export interface OperacionEmision {
  id: string; // e.g. EMI-2026-0089
  solicitudId: string; // e.g. SOL-2026-0131
  tomadorNombre: string;
  tomadorDoc: string; // RUC
  tomadorGrupo?: string;
  beneficiarioNombre: string;
  beneficiarioDoc: string; // RUC
  tipo: TipoCaucion;
  currency: Currency;
  monto: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
  plazoDias: number;
  contratoSubyacente: string;
  objeto: string;
  canal: string;
  tasaAnual: number;
  primaNetaEstimada: number;
  owner: string;
  prioridad: "normal" | "alta";
  fechaSolicitud: string;
  fechaLimite: string;
  status: EmisionStatus;
  instrumentStatus: InstrumentStatus;
  workflowVersion: string;
  // Componentes de la instancia de workflow del caso:
  actividades: ActividadWorkflow[];
  evaluaciones: EvaluacionFrenteItem[];
  documentos: DocumentoEmision[];
  decisiones: DecisionHumana[];
  eventos: EventoAuditoria[];
  polizaEmitida?: PolizaEmitida;
}
