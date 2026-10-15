// Tema y densidad del Design System V1.2. Corporate Refined es la única identidad.
// La preferencia se guarda en este navegador; sin preferencia se sigue prefers-color-scheme.
export type ThemeName = "light" | "dark";
export type ThemePref = ThemeName | "system";
export type Density = "balanced" | "compact";

export const THEME_KEY = "caucion.theme";
export const DEFAULT_DENSITY: Density = "balanced";

const mq = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null);
export const systemTheme = (): ThemeName => (mq()?.matches ? "dark" : "light");
export const resolveTheme = (p: ThemePref): ThemeName => (p === "system" ? systemTheme() : p);

export function loadThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return "system";
}
export function saveThemePref(p: ThemePref) {
  try { p === "system" ? localStorage.removeItem(THEME_KEY) : localStorage.setItem(THEME_KEY, p); } catch {}
}
/** Escucha cambios del sistema (sólo relevante con preferencia "system"). */
export function onSystemThemeChange(cb: (t: ThemeName) => void): () => void {
  const m = mq();
  if (!m) return () => {};
  const h = () => cb(m.matches ? "dark" : "light");
  m.addEventListener?.("change", h);
  return () => m.removeEventListener?.("change", h);
}
/** Atributos para cualquier contenedor que necesite un tema propio (p. ej. comparación en el Visual Lab). */
export function themeAttrs(theme: ThemeName, density: Density = DEFAULT_DENSITY): Record<string, string> {
  return { "data-caucion-theme": theme, "data-caucion-density": density };
}
export function applyTheme(el: HTMLElement, theme: ThemeName, density: Density = DEFAULT_DENSITY) {
  el.setAttribute("data-caucion-theme", theme);
  el.setAttribute("data-caucion-density", density);
}
/** Script mínimo que se inserta en <head> antes del CSS para evitar el parpadeo de tema. */
export const NO_FLASH_SCRIPT =
  `(function(){var d='light';try{var p=localStorage.getItem('${THEME_KEY}');d=(p==='light'||p==='dark')?p:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}var r=document.documentElement;r.setAttribute('data-caucion-theme',d);r.setAttribute('data-caucion-density','${DEFAULT_DENSITY}')})();`;
