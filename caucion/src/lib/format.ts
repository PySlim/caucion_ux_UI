// Formatos de presentación. Locale es-PE (separador de miles "," y decimal ".").
// Supuesto de diseño: monedas PEN y USD; la definición real de monedas es pendiente.

export type Currency = "PEN" | "USD";

const nf2 = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });

export const CURRENCY_SYMBOL: Record<Currency, string> = { PEN: "S/", USD: "US$" };

export function money(n: number, decimals = 2): string {
  return decimals === 0 ? nf0.format(n) : nf2.format(n);
}

/** Importe compacto para tarjetas: 184.6 M */
export function moneyCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toLocaleString("es-PE", { maximumFractionDigits: 1 }) + " M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toLocaleString("es-PE", { maximumFractionDigits: 0 }) + " mil";
  return money(n, 0);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** dd/mm/aaaa — formato de fecha operacional */
export function date(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function dateTime(iso: string): string {
  const d = new Date(iso);
  return `${date(iso.slice(0, 10))} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
export function dateShort(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
export function dateLong(d: Date): string {
  return d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Fecha de referencia fija del prototipo, para que los relativos sean estables */
export const NOW = new Date("2026-10-15T11:30:00");

export function relative(iso: string): string {
  const diff = (NOW.getTime() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return "ahora";
  if (diff < 60) return `hace ${Math.round(diff)} min`;
  if (diff < 60 * 24) return `hace ${Math.round(diff / 60)} h`;
  const days = Math.round(diff / 1440);
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  return date(iso.slice(0, 10));
}

export function daysUntil(iso: string): number {
  const d = new Date(iso + "T23:59:00");
  return Math.floor((d.getTime() - NOW.getTime()) / 86400000);
}

export function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}
