// Cálculo de contraste WCAG 2.x (luminancia relativa)
function lum(hex: string) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
export function verdict(ratio: number, kind: "text" | "ui" | "surface" | "decorative") {
  if (kind === "decorative") return { label: "Decorativo", tone: "neutral" as const };
  if (kind === "ui") return ratio >= 3 ? { label: "AA componentes (≥3)", tone: "success" as const } : { label: "Falla 3:1", tone: "danger" as const };
  if (ratio >= 7) return { label: "AAA", tone: "success" as const };
  if (ratio >= 4.5) return { label: "AA", tone: "success" as const };
  if (ratio >= 3) return { label: "Sólo texto grande", tone: "warning" as const };
  return { label: "Falla AA", tone: "danger" as const };
}
