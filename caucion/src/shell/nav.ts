// Mapa de navegación. Escalable por módulos: agregar un módulo = agregar una entrada.
// Los módulos marcados `v1: false` existen en la arquitectura pero no en este prototipo.
export type RouteId =
  | "dashboard" | "bandeja" | "expediente" | "emision" | "catalogo"
  | "cauciones" | "endosos" | "suscripcion" | "capacidad" | "contragarantias" | "reaseguro"
  | "clientes" | "aprobaciones" | "auditoria" | "reportes";

export interface NavItem { id: RouteId; label: string; icon: string; badge?: number; v1: boolean; parent?: RouteId; description?: string }
export interface NavGroup { label?: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  { items: [{ id: "dashboard", label: "Inicio operacional", icon: "LayoutDashboard", v1: true }] },
  {
    label: "Operación",
    items: [
      { id: "bandeja", label: "Solicitudes", icon: "Inbox", badge: 9, v1: true },
      { id: "emision", label: "Emisiones", icon: "FileStack", v1: true },
      { id: "cauciones", label: "Cauciones", icon: "ShieldCheck", v1: false, description: "Seguimiento y administración de instrumentos emitidos." },
      { id: "endosos", label: "Endosos y renovaciones", icon: "FilePen", v1: false, description: "Modificaciones, renovaciones y cancelaciones." },
    ],
  },
  {
    label: "Riesgo",
    items: [
      { id: "suscripcion", label: "Evaluación y suscripción", icon: "ScanSearch", v1: false, description: "Análisis de riesgo y decisiones de suscripción." },
      { id: "capacidad", label: "Capacidad y exposición", icon: "Gauge", v1: false, description: "Cúmulos por cliente y grupo económico." },
      { id: "contragarantias", label: "Contragarantías", icon: "Landmark", v1: false, description: "Garantías de respaldo y su vigencia." },
      { id: "reaseguro", label: "Reaseguro", icon: "Network", v1: false, description: "Colocaciones y cesiones." },
    ],
  },
  {
    label: "Relación",
    items: [{ id: "clientes", label: "Clientes y participantes", icon: "Building2", v1: false, description: "Empresas, grupos económicos, beneficiarios e intermediarios." }],
  },
  {
    label: "Control",
    items: [
      { id: "aprobaciones", label: "Aprobaciones", icon: "Stamp", badge: 3, v1: false, description: "Decisiones pendientes asignadas a tu rol." },
      { id: "auditoria", label: "Auditoría", icon: "History", v1: false, description: "Trazabilidad de eventos y decisiones." },
      { id: "reportes", label: "Reportes y consultas", icon: "ChartColumn", v1: false, description: "Consultas operativas y exportaciones." },
    ],
  },
  { label: "Sistema", items: [{ id: "catalogo", label: "Visual Lab", icon: "Palette", v1: true }] },
];

export const ALL_NAV = NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));
export const navItem = (id: RouteId) => ALL_NAV.find((n) => n.id === id);
