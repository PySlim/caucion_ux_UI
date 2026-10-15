# CAUCIÓN Design System V1.2 — Corporate Refined

Identidad única y aprobada. La referencia viva está en la aplicación: **Visual Lab** (menú Sistema).

## 1. Identidad

Confianza institucional, solidez financiera, claridad y precisión. El azul marino ancla la identidad y la
navegación; el azul de acción se reserva para lo que el usuario puede hacer; el turquesa marca la
ubicación activa. Superficies claras, bordes de 1 px, sombras discretas, radio base de 8 px.

## 2. Arquitectura de tokens

Fuente única: `src/tokens/tokens.json`. `scripts/build-tokens.mjs` genera `tokens.css` y `tokens.ts`.

| Capa | Prefijo | Ejemplo | Quién la usa |
|---|---|---|---|
| 1 · Primitivos | `--p-*` | `--p-color-navy-900: #142B49` | Sólo las otras capas |
| 2 · Semánticos | `--bg-*`, `--fg-*`, `--border-*`, `--action*`, estados | `--bg-surface` | Componentes (vía Tailwind) |
| 3 · Componente | `--radius-*`, `--shadow-*`, medidas | `--radius-control: var(--p-radius-md)` | Componentes |
| 4 · Tema | `[data-caucion-theme="light" \| "dark"]` | `--bg-nav: var(--p-color-ink-950)` en oscuro | Resolución de la capa 2 |

Densidad: `[data-caucion-density="balanced" | "compact"]`; bajo 768 px se aplican medidas táctiles.

En Tailwind se eliminaron la paleta, los radios y las sombras por defecto: sólo existen clases de rol
(`bg-surface`, `text-fg-muted`, `rounded-control`, `shadow-card`…).

## 3. Color

Paleta aprobada: Primary #142B49 · Action #2563EB · Accent #0D9488 · Background #F3F6FA · Surface #FFFFFF ·
Text Primary #1E293B · Text Secondary #64748B · Border #E2E8F0.

Ajustes por WCAG 2.2 AA (los valores aprobados se conservan como primitivos):

| Uso | Aprobado | Aplicado | Motivo |
|---|---|---|---|
| Texto secundario | #64748B | #5B6B80 | 4.39:1 sobre #F3F6FA; aplicado 5.02:1 |
| Texto de acento | #0D9488 | #0F766E | 3.74:1 sobre blanco; aplicado 5.47:1 (el turquesa queda para elementos no textuales) |
| Borde de controles | #E2E8F0 | #8392A6 | 1.4.11 exige 3:1; #E2E8F0 queda para divisores |
| Indicador de ubicación | #0D9488 | #2DD4BF | 2.42:1 sobre el ítem activo; aplicado ≥ 3:1 |

El tema oscuro no invierte el claro: usa superficies "ink" azuladas, acción #2F6AE0 con texto blanco,
estados aclarados (#4ADE80, #F5B14C, #F87171) y texto oscuro sobre fondos de estado sólidos.
44 pares verificados por tema (`npm run check:contrast`).

## 4. Tipografía

IBM Plex Sans (interfaz) e IBM Plex Mono (referencias), con respaldo Segoe UI, system-ui, Arial.
Tamaños en rem. Cifras tabulares en importes y columnas.

| Rol | Clase | Tamaño / interlínea | Peso |
|---|---|---|---|
| Encabezado de módulo | `t-module` | 12/16 · mayúsculas | 600 |
| Título de página | `t-page` | 22/28 (20/26 en móvil) | 600 |
| Sección | `t-section` | 16/24 | 600 |
| Panel | `t-sub` | 14/20 | 600 |
| Cuerpo y formularios | `t-body` | 14/20 | 400 |
| Etiqueta | `t-label` | 13/18 | 500 |
| Tabla | `t-table` | 13/18 | 400 |
| Ayuda | `t-help` | 12/16 | 400 |
| Estado | `t-caption` | 12/16 | 500 |
| Cifra destacada | `t-amount-lg` | 24/32 · tabular | 600 |
| Cifra en línea | `t-amount` | 14/20 · tabular | 500 |
| Referencia | `t-ref` | 12.5 · Plex Mono | 400 |

## 5. Forma

Radios: xs 2 · sm 4 · **md 8 (base)** · lg 12 · xl 16 · full.
Por rol: controles 8, tarjetas 8, overlays 12, badges 4, checkbox 4, tooltip 4. Bordes de 1 px.
Sombras: `shadow-card`, `shadow-popover`, `shadow-modal` (más opacas en oscuro).

## 6. Densidad Balanced

Controles 32/36/44 px (sm/md/lg), filas 48 px (40 compactas), ítems de navegación 40 px, pestañas 44 px,
padding de panel 20 px, separación de secciones 24 px. Compact queda definida (`data-caucion-density="compact"`).
Bajo 768 px: controles 36/40/44 px y navegación de 44 px.

## 7. Temas

Claro, oscuro o "Según el sistema". Sin preferencia guardada se sigue `prefers-color-scheme`. La
preferencia se guarda en `localStorage` (`caucion.theme`). Un script en `<head>` aplica el tema antes
del CSS para evitar el parpadeo. Conmutación desde el botón del topbar o el menú de usuario.

## 8. Responsive

| Ancho | Comportamiento |
|---|---|
| < 768 | Sidebar como drawer modal (foco atrapado, Esc, retorno de foco); objetivos táctiles de 40–44 px; modales a pantalla completa; bandeja en tarjetas; emisión por frentes apilados |
| 768–1023 | Sidebar colapsado con tooltips; bandeja en tarjetas; formularios en una columna (dos o tres desde 1024 px) |
| 1024–1199 | Bandeja en tabla; sidebar colapsado por defecto |
| ≥ 1200 | Sidebar expandido por defecto (se recuerda la elección) |
| ≥ 1280 | Riel contextual del expediente a la derecha |
| ≥ 1440 | Todas las columnas de la bandeja visibles; por debajo, Tipo y Actualizado se integran en otras celdas |

Tablas: desplazamiento horizontal interno, nunca global. Popovers y menús se reubican dentro del viewport.

## 9. Componentes

Estado real de cada componente (variantes, estados y pendientes) en Visual Lab → "Estado de componentes".
Con pendientes en V1.2: Select (nativo), Tabs (sin aria-controls), Data Table (vista en tarjetas sólo en
bandeja), Dropdown (sin búsqueda por tipeo), Tooltip (sin reubicación automática), Toast (no pausa).

## 10. Accesibilidad

Foco visible de 2 px con separación de 2 px; blanco sobre la navegación. Navegación completa por teclado
(Ctrl K, [, flechas, Esc). Overlays con foco atrapado y retorno de foco. Controles con nombre accesible.
Objetivos de 24 px como mínimo (enlaces dentro de texto exceptuados, WCAG 2.5.8). Reflow correcto al 200 %.
Movimiento anulado con `prefers-reduced-motion`.
