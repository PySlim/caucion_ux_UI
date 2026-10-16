# CAUCIÓN V1.2 — Consolidación de identidad y estabilización responsiva

Sin cambios en procesos, entidades, permisos, flujos de aprobación ni reglas de negocio.

## Decisiones técnicas

1. **Una sola identidad.** Se retiraron las variantes Modern Premium y Minimal Executive y los selectores
   de forma del Visual Lab. Su definición queda en `docs/historico/variantes-v1.1.json`.
2. **Fuente única de tokens.** `src/tokens/tokens.json` define cuatro capas (primitivos, semánticos,
   componente, tema) más densidad y tipografía. `scripts/build-tokens.mjs` genera `tokens.css` y
   `tokens.ts`; el build lo ejecuta siempre, así que no pueden desincronizarse.
3. **Radios por rol.** Las clases `rounded-xs/sm/md/lg` se sustituyeron por `rounded-badge/control/card/overlay`
   y las sombras por `shadow-card/popover/modal`. Tailwind ya no ofrece radios, sombras ni colores por defecto.
4. **Tipografía en rem** con roles generados desde tokens; tamaños arbitrarios (`text-[11px]`…) sustituidos por la escala.
5. **Tema**: claro, oscuro o sistema; persistente; script anti-parpadeo en `<head>`; botón en el topbar.
6. **Iconos locales**: Lucide vía `react-icons/lu` con un registro explícito (`src/lib/icon-registry.ts`).
   Elimina la dependencia del CDN en tiempo de ejecución y permite verificar iconos sin red.
7. **Proyecto normalizado**: `package.json`, lockfile, `tsconfig.json`, scripts `dev/build/typecheck/check/test`.
   Ninguna ruta absoluta del entorno de generación (`/opt/npm-tools` eliminado).
8. **Accesibilidad**: nombre accesible en el selector de archivos, `aria-describedby` en modales,
   objetivos de 24 px en switch y referencias, foco con tokens de grosor y separación.
9. **Responsive**: emisión por frentes apilados bajo 1024 px; barras de espaciado contenidas; menús,
   filtros y modales verificados en 360–1920 px y al 200 % de zoom.

## Archivos nuevos
- `src/tokens/tokens.json`, `src/tokens/generated/tokens.css`, `src/tokens/generated/tokens.ts`
- `src/theme/theme.ts`, `src/lib/icon-registry.ts`
- `scripts/build-tokens.mjs`, `scripts/lib/tokens.mjs`, `scripts/check-icons.mjs`, `scripts/dev.mjs`, `scripts/test-ui.mjs`
- `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`
- `docs/DESIGN-SYSTEM.md`, `docs/VALIDACION-V1.2.md`, `docs/REPORTE-VALIDACION.md` (generado), `docs/historico/`

## Archivos modificados
- `build.mjs` — imports de paquete, generación de tokens, anti-parpadeo, `dist/index.html`.
- `scripts/check-contrast.mjs`, `src/tokens/contrast-pairs.json` — tokens semánticos, 44 pares por tema.
- `src/styles/app.css` — mapeo a roles; tipografía por tokens; `t-wordmark`.
- `src/App.tsx`, `src/main.tsx`, `src/shell/AppContext.tsx` — preferencia de tema; arranque sin CDN.
- `src/shell/AppShell.tsx` — botón de tema, menú claro/oscuro/sistema, identidad V1.2.
- `src/shell/nav.ts`, `src/shell/SearchPalette.tsx` — "Visual Lab"; radios por rol.
- `src/components/ui/controls.tsx`, `data.tsx`, `overlays.tsx` — radios, sombras y tipografía por rol; switch de 24 px; accesibilidad.
- `src/components/patterns/FilterMenu.tsx`, `Specimen.tsx` — roles; espécimen por tema con container queries.
- `src/screens/Catalogo.tsx` — Visual Lab oficial: identidad, paleta, tokens, tipografía, forma, componentes, claro/oscuro, estado de componentes, vista previa responsiva.
- `src/screens/VisualLab.tsx` — comparación claro/oscuro, contraste, estado de componentes, vista previa en iframe con tema.
- `src/screens/Bandeja.tsx`, `Dashboard.tsx`, `Emision.tsx`, `Expediente.tsx`, `NuevaSolicitud.tsx` — sólo clases de rol y ajustes responsivos.

## Archivos eliminados
- `src/tokens/palettes.json`, `palettes.generated.css`, `tokens.css`, `tokens.ts` (sustituidos por `tokens.json` + generados)
- `src/theme/appearance.ts` (sustituido por `theme.ts`)
- `CHANGELOG-V1.1.md` (movido a `docs/historico/`)
