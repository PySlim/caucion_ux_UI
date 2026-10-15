// ============================================================================
// DATOS FICTICIOS — generados para el prototipo. No corresponden a personas,
// empresas, entidades ni operaciones reales. Montos, plazos e indicadores son
// demostrativos y no representan políticas, límites ni reglas de negocio.
// ============================================================================
import type { Currency } from "../lib/format";
import type { SolicitudStatus, ActivityStatus, DocStatus } from "../domain/status";

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(20261015);
const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];

export interface User { id: string; name: string; role: string }
export const USERS: User[] = [
  { id: "u1", name: "Ana Torres", role: "Analista de suscripción" },
  { id: "u2", name: "Luis Paredes", role: "Ejecutivo comercial" },
  { id: "u3", name: "María Quispe", role: "Analista de garantías" },
  { id: "u4", name: "Jorge Salas", role: "Jefe de suscripción" },
  { id: "u5", name: "Carla Ríos", role: "Analista de emisión" },
  { id: "u6", name: "Diego Ñahui", role: "Ejecutivo comercial" },
];
export const CURRENT_USER = USERS[0];
export const userById = (id: string) => USERS.find((u) => u.id === id)!;

export interface Party { id: string; name: string; doc: string; group?: string }
export const TOMADORES: Party[] = [
  { id: "t01", name: "Constructora Ejemplo Andina S.A.C.", doc: "ID-DEMO-1047", group: "Grupo Ejemplo Andino" },
  { id: "t02", name: "Ingeniería Ficticia del Sur S.A.", doc: "ID-DEMO-2210" },
  { id: "t03", name: "Consorcio Vial Demo Norte", doc: "ID-DEMO-3384", group: "Consorcio" },
  { id: "t04", name: "Servicios Técnicos Muestra S.R.L.", doc: "ID-DEMO-4401" },
  { id: "t05", name: "Edificaciones Prototipo S.A.C.", doc: "ID-DEMO-5129", group: "Grupo Ejemplo Andino" },
  { id: "t06", name: "Saneamiento Ilustrativo E.I.R.L.", doc: "ID-DEMO-6075" },
  { id: "t07", name: "Logística Ficticia Pacífico S.A.", doc: "ID-DEMO-7316" },
  { id: "t08", name: "Energía Demo Renovable S.A.C.", doc: "ID-DEMO-8842" },
  { id: "t09", name: "Montajes Ejemplo Industrial S.A.", doc: "ID-DEMO-9013" },
  { id: "t10", name: "Consorcio Hospitalario Demo", doc: "ID-DEMO-1188", group: "Consorcio" },
  { id: "t11", name: "Tecnologías Muestra Andinas S.A.C.", doc: "ID-DEMO-1265" },
  { id: "t12", name: "Obras Civiles Prototipo S.R.L.", doc: "ID-DEMO-1342" },
];
export const ASEGURADOS: Party[] = [
  { id: "a1", name: "Entidad Contratante Demo A", doc: "ID-DEMO-E001" },
  { id: "a2", name: "Gobierno Regional Ejemplo", doc: "ID-DEMO-E002" },
  { id: "a3", name: "Municipalidad Ficticia Centro", doc: "ID-DEMO-E003" },
  { id: "a4", name: "Proyecto Especial Ilustrativo", doc: "ID-DEMO-E004" },
  { id: "a5", name: "Empresa Privada Muestra S.A.", doc: "ID-DEMO-E005" },
  { id: "a6", name: "Autoridad Portuaria Demo", doc: "ID-DEMO-E006" },
];

/** Tipos de caución: denominaciones genéricas de mercado, usadas sólo como ejemplo. */
export const TIPOS = [
  "Fiel cumplimiento",
  "Adelanto directo",
  "Adelanto de materiales",
  "Seriedad de oferta",
  "Garantía aduanera",
  "Buen uso de anticipo",
] as const;
export type Tipo = (typeof TIPOS)[number];

export const CANALES = ["Directo", "Corredor", "Plataforma"] as const;

export interface Solicitud {
  id: string;
  tomadorId: string;
  aseguradoId: string;
  tipo: Tipo;
  currency: Currency;
  monto: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
  status: SolicitudStatus;
  ownerId: string;
  canal: (typeof CANALES)[number];
  creada: string;
  actualizada: string;
  vence?: string; // fecha objetivo de atención (demo)
  prioridad: "normal" | "alta";
}

const STATUS_POOL: SolicitudStatus[] = [
  "recibida", "recibida", "evaluacion", "evaluacion", "evaluacion", "observada", "observada",
  "aprobacion", "aprobacion", "aprobada", "emitida", "emitida", "emitida", "rechazada", "borrador", "desistida",
];

function iso(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(base: string, n: number) { const d = new Date(base + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d); }

export const SOLICITUDES: Solicitud[] = Array.from({ length: 46 }, (_, i) => {
  const n = 160 - i;
  const creada = addDays("2026-10-15", -Math.floor(i * 1.3 + r() * 3));
  const desde = addDays(creada, 7 + Math.floor(r() * 25));
  const plazo = pick([90, 120, 180, 270, 365, 540, 730]);
  const currency: Currency = r() > 0.72 ? "USD" : "PEN";
  const raw = currency === "USD" ? 40_000 + r() * 2_400_000 : 120_000 + r() * 9_500_000;
  const monto = Math.round(raw / 50) * 50 + (r() > 0.5 ? 0.0 : 0.5) * 0;
  const hrs = Math.floor(r() * 70);
  const upd = new Date("2026-10-15T11:30:00"); upd.setHours(upd.getHours() - hrs - i * 3);
  return {
    id: `SOL-2026-${String(n).padStart(4, "0")}`,
    tomadorId: pick(TOMADORES).id,
    aseguradoId: pick(ASEGURADOS).id,
    tipo: pick([...TIPOS]),
    currency,
    monto,
    vigenciaDesde: desde,
    vigenciaHasta: addDays(desde, plazo),
    status: i === 13 ? "observada" : pick(STATUS_POOL),
    ownerId: pick(USERS.slice(0, 6)).id,
    canal: pick([...CANALES]),
    creada,
    actualizada: upd.toISOString(),
    vence: addDays("2026-10-15", Math.floor(r() * 9) - 2),
    prioridad: r() > 0.82 ? "alta" : "normal",
  };
});

// La solicitud protagonista del expediente
const hero = SOLICITUDES.find((s) => s.id === "SOL-2026-0147")!;
Object.assign(hero, {
  tomadorId: "t01", aseguradoId: "a2", tipo: "Fiel cumplimiento", currency: "PEN", monto: 4_860_250.0,
  vigenciaDesde: "2026-11-02", vigenciaHasta: "2027-11-01", status: "observada", ownerId: "u1",
  canal: "Corredor", prioridad: "alta", vence: "2026-10-16",
} satisfies Partial<Solicitud>);

export const tomador = (id: string) => TOMADORES.find((t) => t.id === id)!;
export const asegurado = (id: string) => ASEGURADOS.find((t) => t.id === id)!;

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export interface Pendiente { id: string; ref: string; tarea: string; tomador: string; vence: string; tipo: "decision" | "revision" | "documento" | "subsanacion" }
export const PENDIENTES: Pendiente[] = [
  { id: "p1", ref: "SOL-2026-0147", tarea: "Revisar subsanación de documentos financieros", tomador: "Constructora Ejemplo Andina S.A.C.", vence: "2026-10-14", tipo: "subsanacion" },
  { id: "p2", ref: "SOL-2026-0151", tarea: "Registrar decisión de suscripción", tomador: "Energía Demo Renovable S.A.C.", vence: "2026-10-15", tipo: "decision" },
  { id: "p3", ref: "EMI-2026-0089", tarea: "Validar texto del instrumento", tomador: "Consorcio Vial Demo Norte", vence: "2026-10-15", tipo: "revision" },
  { id: "p4", ref: "SOL-2026-0144", tarea: "Solicitar carta de contragarantía", tomador: "Servicios Técnicos Muestra S.R.L.", vence: "2026-10-16", tipo: "documento" },
  { id: "p5", ref: "SOL-2026-0139", tarea: "Revisar estados financieros 2025", tomador: "Ingeniería Ficticia del Sur S.A.", vence: "2026-10-19", tipo: "revision" },
  { id: "p6", ref: "SOL-2026-0136", tarea: "Registrar decisión de comité (demo)", tomador: "Consorcio Hospitalario Demo", vence: "2026-10-20", tipo: "decision" },
];

export interface Alerta { id: string; severity: "danger" | "warning" | "info"; title: string; detail: string; ref?: string; when: string }
export const ALERTAS: Alerta[] = [
  { id: "al1", severity: "danger", title: "Documento vencido en expediente", detail: "Vigencia de poderes del representante legal venció el 10/10/2026.", ref: "SOL-2026-0147", when: "2026-10-15T08:10:00" },
  { id: "al2", severity: "warning", title: "Exposición del grupo cerca del umbral demo", detail: "Grupo Ejemplo Andino alcanza 86 % del umbral configurado para el prototipo.", ref: "Grupo Ejemplo Andino", when: "2026-10-15T07:45:00" },
  { id: "al3", severity: "warning", title: "Cauciones por vencer en 30 días", detail: "12 instrumentos vigentes vencen antes del 14/11/2026.", when: "2026-10-15T06:00:00" },
  { id: "al4", severity: "info", title: "Respuesta de reaseguro recibida", detail: "Cotización facultativa disponible para revisión.", ref: "EMI-2026-0089", when: "2026-10-14T17:22:00" },
];

export interface Evento { id: string; who: string; action: string; ref: string; when: string; kind: "create" | "update" | "decision" | "document" | "return" | "issue" | "comment" | "system" }
export const ACTIVIDAD: Evento[] = [
  { id: "e1", who: "Carla Ríos", action: "generó borrador del instrumento", ref: "EMI-2026-0089", when: "2026-10-15T11:02:00", kind: "issue" },
  { id: "e2", who: "Ana Torres", action: "devolvió para subsanación", ref: "SOL-2026-0147", when: "2026-10-15T10:41:00", kind: "return" },
  { id: "e3", who: "Luis Paredes", action: "creó la solicitud", ref: "SOL-2026-0160", when: "2026-10-15T10:15:00", kind: "create" },
  { id: "e4", who: "Jorge Salas", action: "registró decisión favorable", ref: "SOL-2026-0142", when: "2026-10-15T09:30:00", kind: "decision" },
  { id: "e5", who: "María Quispe", action: "validó contragarantía", ref: "SOL-2026-0138", when: "2026-10-15T09:02:00", kind: "document" },
  { id: "e6", who: "Sistema", action: "notificó vencimiento próximo", ref: "CAU-2025-003915", when: "2026-10-15T06:00:00", kind: "system" },
  { id: "e7", who: "Diego Ñahui", action: "adjuntó 3 documentos", ref: "SOL-2026-0157", when: "2026-10-14T18:40:00", kind: "document" },
];

/** Serie demostrativa: cauciones emitidas por semana (8 semanas) */
export const EMITIDAS_SEMANA = [14, 18, 11, 21, 17, 24, 19, 23];
export const EMITIDAS_SEMANA_LABELS = ["24 ago", "31 ago", "7 set", "14 set", "21 set", "28 set", "5 oct", "12 oct"];

// ---------------------------------------------------------------------------
// Expediente SOL-2026-0147
// ---------------------------------------------------------------------------
export interface Doc { id: string; name: string; category: string; status: DocStatus; size: string; uploaded: string; by: string; note?: string; version: number }
export const DOCS_0147: Doc[] = [
  { id: "d1", name: "Solicitud firmada.pdf", category: "Solicitud", status: "validado", size: "412 KB", uploaded: "2026-10-08T09:12:00", by: "Luis Paredes", version: 1 },
  { id: "d2", name: "Bases del proceso de contratación.pdf", category: "Contrato subyacente", status: "validado", size: "3,2 MB", uploaded: "2026-10-08T09:14:00", by: "Luis Paredes", version: 1 },
  { id: "d3", name: "Estados financieros auditados 2025.pdf", category: "Financiero", status: "observado", size: "1,8 MB", uploaded: "2026-10-09T15:40:00", by: "Corredor (portal demo)", version: 2, note: "Falta dictamen del auditor y notas a los EEFF." },
  { id: "d4", name: "Vigencia de poderes.pdf", category: "Legal", status: "vencido", size: "220 KB", uploaded: "2026-10-08T09:20:00", by: "Luis Paredes", version: 1, note: "Emitida hace más del plazo de antigüedad configurado en el prototipo." },
  { id: "d5", name: "Carta de contragarantía (borrador).docx", category: "Contragarantía", status: "en_revision", size: "96 KB", uploaded: "2026-10-13T11:05:00", by: "María Quispe", version: 1 },
  { id: "d6", name: "Flujo de caja proyectado.xlsx", category: "Financiero", status: "pendiente", size: "—", uploaded: "", by: "—", version: 0 },
];

export interface Tarea { id: string; title: string; owner: string; due: string; done: boolean; blocking?: boolean }
export const TAREAS_0147: Tarea[] = [
  { id: "k1", title: "Recibir EEFF con dictamen del auditor", owner: "Luis Paredes", due: "2026-10-16", done: false, blocking: true },
  { id: "k2", title: "Actualizar vigencia de poderes", owner: "Luis Paredes", due: "2026-10-16", done: false, blocking: true },
  { id: "k3", title: "Revisar borrador de contragarantía", owner: "María Quispe", due: "2026-10-17", done: false },
  { id: "k4", title: "Consultar capacidad disponible del grupo", owner: "Ana Torres", due: "2026-10-15", done: true },
  { id: "k5", title: "Verificar bases del proceso", owner: "Ana Torres", due: "2026-10-12", done: true },
];

export const HISTORIAL_0147: Evento[] = [
  { id: "h1", who: "Ana Torres", action: "devolvió la solicitud para subsanación: EEFF sin dictamen; poderes vencidos", ref: "SOL-2026-0147", when: "2026-10-15T10:41:00", kind: "return" },
  { id: "h2", who: "Ana Torres", action: "consultó capacidad disponible del Grupo Ejemplo Andino", ref: "SOL-2026-0147", when: "2026-10-15T09:55:00", kind: "update" },
  { id: "h3", who: "María Quispe", action: "cargó borrador de carta de contragarantía (v1)", ref: "SOL-2026-0147", when: "2026-10-13T11:05:00", kind: "document" },
  { id: "h4", who: "Ana Torres", action: "comentó: «Se requiere flujo de caja proyectado a 12 meses»", ref: "SOL-2026-0147", when: "2026-10-12T16:20:00", kind: "comment" },
  { id: "h5", who: "Sistema", action: "asignó la solicitud a Ana Torres (regla de reparto demo)", ref: "SOL-2026-0147", when: "2026-10-09T15:42:00", kind: "system" },
  { id: "h6", who: "Corredor (portal demo)", action: "reemplazó Estados financieros 2025 (v1 → v2)", ref: "SOL-2026-0147", when: "2026-10-09T15:40:00", kind: "document" },
  { id: "h7", who: "Luis Paredes", action: "cambió suma asegurada de S/ 4,500,000.00 a S/ 4,860,250.00", ref: "SOL-2026-0147", when: "2026-10-08T17:03:00", kind: "update" },
  { id: "h8", who: "Luis Paredes", action: "creó la solicitud desde canal Corredor", ref: "SOL-2026-0147", when: "2026-10-08T09:10:00", kind: "create" },
];

/** Comparación: solicitado vs. propuesto por suscripción (valores demo) */
export const COMPARACION_0147 = [
  { campo: "Suma asegurada", solicitado: "S/ 4,860,250.00", propuesto: "S/ 4,860,250.00", cambia: false },
  { campo: "Vigencia", solicitado: "02/11/2026 – 01/11/2027", propuesto: "02/11/2026 – 01/11/2027", cambia: false },
  { campo: "Tasa (demo)", solicitado: "0.90 % anual", propuesto: "1.15 % anual", cambia: true },
  { campo: "Contragarantía", solicitado: "Pagaré", propuesto: "Pagaré + fianza solidaria", cambia: true },
  { campo: "Cobertura de reaseguro", solicitado: "—", propuesto: "Por evaluar", cambia: true },
];

// ---------------------------------------------------------------------------
// Workspace de emisión EMI-2026-0089
// Las actividades son ILUSTRATIVAS: no equivalen a las 12 etapas del VS-03.
// ---------------------------------------------------------------------------
export interface Actividad {
  id: string; name: string; lane: string; col: number; status: ActivityStatus; owner: string;
  deps: string[]; detail: string; since: string; returns?: number;
}
export const LANES = ["Comercial", "Riesgo y suscripción", "Garantías y reaseguro", "Documentación y emisión"] as const;

export const ACTIVIDADES: Actividad[] = [
  { id: "A1", name: "Captura de la necesidad", lane: "Comercial", col: 0, status: "completada", owner: "Luis Paredes", deps: [], detail: "Datos del tomador, beneficiario y contrato subyacente registrados.", since: "2026-10-01T10:00:00" },
  { id: "A2", name: "Validación de datos del cliente", lane: "Comercial", col: 1, status: "completada", owner: "Luis Paredes", deps: ["A1"], detail: "Identidad y representación verificadas (demo).", since: "2026-10-02T12:00:00" },
  { id: "A3", name: "Evaluación de riesgo", lane: "Riesgo y suscripción", col: 1, status: "completada", owner: "Ana Torres", deps: ["A1"], detail: "Análisis financiero y de experiencia completado.", since: "2026-10-06T16:00:00", returns: 1 },
  { id: "A4", name: "Revisión de capacidad y exposición", lane: "Riesgo y suscripción", col: 2, status: "completada", owner: "Ana Torres", deps: ["A3"], detail: "Exposición del grupo consultada. Resultado registrado.", since: "2026-10-08T09:30:00" },
  { id: "A5", name: "Decisión de suscripción", lane: "Riesgo y suscripción", col: 3, status: "completada", owner: "Jorge Salas", deps: ["A4", "A6"], detail: "Decisión humana registrada con condiciones.", since: "2026-10-12T11:00:00" },
  { id: "A6", name: "Constitución de contragarantías", lane: "Garantías y reaseguro", col: 2, status: "devuelta", owner: "María Quispe", deps: ["A3"], detail: "Fianza solidaria observada: firma no coincide con registro. Devuelta al cliente para subsanación.", since: "2026-10-14T15:10:00", returns: 2 },
  { id: "A7", name: "Colocación de reaseguro", lane: "Garantías y reaseguro", col: 3, status: "en_revision", owner: "María Quispe", deps: ["A4"], detail: "Cotización facultativa recibida; en revisión.", since: "2026-10-14T17:22:00" },
  { id: "A8", name: "Redacción del instrumento", lane: "Documentación y emisión", col: 3, status: "en_curso", owner: "Carla Ríos", deps: ["A5"], detail: "Borrador generado con plantilla demo. Pendiente validar cláusulas.", since: "2026-10-15T11:02:00" },
  { id: "A9", name: "Documentación contractual", lane: "Documentación y emisión", col: 2, status: "pendiente_info", owner: "Carla Ríos", deps: ["A2"], detail: "Falta adenda del contrato subyacente firmada por el beneficiario.", since: "2026-10-13T10:00:00" },
  { id: "A10", name: "Aprobación de emisión", lane: "Riesgo y suscripción", col: 4, status: "esperando_decision", owner: "Jorge Salas", deps: ["A6", "A7", "A8"], detail: "Requiere decisión humana. Nivel de aprobación: pendiente de definición de negocio.", since: "2026-10-15T09:00:00" },
  { id: "A11", name: "Emisión y numeración", lane: "Documentación y emisión", col: 4, status: "bloqueada", owner: "Carla Ríos", deps: ["A10", "A9"], detail: "Bloqueada hasta resolver dependencias.", since: "2026-10-15T09:00:00" },
  { id: "A12", name: "Entrega y activación de efectividad", lane: "Comercial", col: 5, status: "no_iniciada", owner: "Luis Paredes", deps: ["A11"], detail: "Entrega al tomador y beneficiario; activación de efectividad.", since: "" },
];

export interface Decision { id: string; title: string; activity: string; requestedBy: string; when: string; context: string }
export const DECISIONES: Decision[] = [
  { id: "dc1", title: "Aprobar emisión con condiciones", activity: "A10", requestedBy: "Carla Ríos", when: "2026-10-15T09:00:00", context: "Contragarantía en subsanación. Reaseguro en revisión." },
  { id: "dc2", title: "Aceptar cotización facultativa de reaseguro", activity: "A7", requestedBy: "María Quispe", when: "2026-10-14T17:30:00", context: "Una cotización recibida (demo)." },
];

export const INFO_PENDIENTE = [
  { id: "ip1", label: "Adenda del contrato subyacente firmada", owner: "Beneficiario", activity: "A9", done: false },
  { id: "ip2", label: "Fianza solidaria con firma legalizada", owner: "Tomador", activity: "A6", done: false },
  { id: "ip3", label: "Confirmación de cotización de reaseguro", owner: "Reasegurador (demo)", activity: "A7", done: false },
  { id: "ip4", label: "Datos de entrega del beneficiario", owner: "Ejecutivo comercial", activity: "A12", done: true },
];

export const EVENTOS_EMISION: Evento[] = [
  { id: "x1", who: "Carla Ríos", action: "generó borrador del instrumento (plantilla demo v3)", ref: "A8", when: "2026-10-15T11:02:00", kind: "issue" },
  { id: "x2", who: "Sistema", action: "solicitó decisión de aprobación de emisión", ref: "A10", when: "2026-10-15T09:00:00", kind: "system" },
  { id: "x3", who: "Reasegurador (demo)", action: "envió cotización facultativa", ref: "A7", when: "2026-10-14T17:22:00", kind: "document" },
  { id: "x4", who: "María Quispe", action: "devolvió fianza solidaria para subsanación (2.ª vez)", ref: "A6", when: "2026-10-14T15:10:00", kind: "return" },
  { id: "x5", who: "Jorge Salas", action: "registró decisión de suscripción favorable con condiciones", ref: "A5", when: "2026-10-12T11:00:00", kind: "decision" },
  { id: "x6", who: "Ana Torres", action: "reabrió evaluación de riesgo por nueva información", ref: "A3", when: "2026-10-05T10:00:00", kind: "return" },
];
