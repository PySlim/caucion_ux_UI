# CAUCIÓN V1.1 — Refinamiento visual

Sin cambios en flujos, reglas, modelos de dominio ni organización de módulos.

## Archivos nuevos
- `src/tokens/palettes.json` — primitivos de las variantes A/B/C, claro y oscuro (fuente única).
- `src/tokens/palettes.generated.css` — generado por `build.mjs`; no editar a mano.
- `src/tokens/contrast-pairs.json` — 39 pares de contraste verificados por variante y tema.
- `src/theme/appearance.ts` — ejes de apariencia (variante, tema, radios, sombras, densidad), persistencia.
- `src/screens/VisualLab.tsx` — laboratorio: variantes, formas, comparación A·B·C, contraste, vista previa responsiva.
- `src/components/patterns/Specimen.tsx` — espécimen con los componentes de producción.
- `scripts/check-contrast.mjs` — `node scripts/check-contrast.mjs` falla si algún par no cumple AA.

## Archivos modificados
- `src/tokens/tokens.css` — capa semántica por tema; radios, sombras y densidad como tokens por atributo.
- `src/styles/app.css` — tipografía por tokens de variante; nuevos colores semánticos; placeholder AA.
- `build.mjs` — genera palettes CSS; fuentes Manrope y Public Sans; ids para la vista previa; corrección de preview.html.
- `src/App.tsx`, `src/shell/AppContext.tsx` — estado de apariencia y modo embebido (vista previa).
- `src/shell/AppShell.tsx` — `NavButton` reutilizable; drawer móvil accesible; tokens de navegación.
- `src/components/ui/controls.tsx` — alturas por token; áreas táctiles; colores sobre estado.
- `src/components/ui/data.tsx` — paneles, tabs, tabla y paginación por tokens.
- `src/components/ui/overlays.tsx` — modal a pantalla completa en móvil; menús y popovers dentro del viewport; toasts adaptables.
- `src/components/patterns/FilterMenu.tsx` — popover contenido en el viewport.
- `src/domain/status.ts` — tonos sólidos con `--fg-on-status`; tono "brand" legible en oscuro.
- `src/screens/Bandeja.tsx` — vista de tarjetas < 1024 px; columnas secundarias integradas en celdas < 1440 px.
- `src/screens/Expediente.tsx` — riel contextual visible en todos los anchos.
- `src/screens/Emision.tsx` — frentes apilados < 768 px.
- `src/screens/Dashboard.tsx`, `src/screens/NuevaSolicitud.tsx`, `src/screens/Catalogo.tsx` — ajustes responsive; sección Visual Lab; decisiones V1.1.

## Verificación
- Contraste: 234/234 pares AA (3 variantes × 2 temas × 39 pares), por script.
- Responsive: Chromium headless (Playwright) a 360, 390, 768, 1024, 1280 y 1440 px; 3 variantes × 2 temas × 5 pantallas.
  Sin desbordamiento horizontal del documento ni del área de trabajo; tablas y diagramas desplazan dentro de su contenedor.
- No verificado: fuentes web e iconos Lucide (CDN bloqueado en el entorno de prueba), dispositivos físicos, Safari/Firefox, lectores de pantalla.
