# Validación V1.2 — qué se probó y qué no

Entorno de verificación: contenedor Linux, Node 22, Chromium (Playwright 1.56), sin acceso al registro de
npm ni a CDNs. El detalle automático está en `docs/REPORTE-VALIDACION.md` (`npm run test:ui`).

## Ejecutadas y aprobadas

| Área | Prueba | Resultado |
|---|---|---|
| Técnica | Build (`npm run build`) en una copia limpia del proyecto, con dependencias copiadas como carpetas reales | Aprobada |
| Técnica | Servidor de desarrollo (`npm run dev`): sirve la app y recompila al guardar | Aprobada |
| Técnica | Sin rutas absolutas del entorno en el código (`/opt/…`, `/home/…`) | Aprobada |
| Técnica | Consola sin errores ni advertencias en 60 combinaciones de ancho, tema y pantalla | Aprobada |
| Técnica | Recursos: la app funciona con la red bloqueada; sólo intenta cargar `fonts.googleapis.com` (con respaldo) | Aprobada |
| Técnica | Iconos: 127 registrados, todos los usos resueltos (`check:icons`) | Aprobada |
| Visual | Contraste WCAG 2.2 AA: 88/88 pares (44 por tema) | Aprobada |
| Visual | Ningún color hexadecimal, radio, sombra ni tamaño tipográfico arbitrario en componentes (revisión con grep) | Aprobada |
| Responsive | 360, 390, 768, 1024, 1280, 1440 px × claro y oscuro × 5 pantallas (60 combinaciones): sin desbordamiento global, sin elementos fuera del viewport, sin textos recortados | 60/60 |
| Responsive | Anchos intermedios 480, 600, 900, 1100, 1366, 1920 px × 5 pantallas | 30/30 |
| Accesibilidad | Zoom 200 % (reflow a 640 y 720 px) × 2 temas × 5 pantallas | 20/20 |
| Accesibilidad | Todos los controles con nombre accesible (60 combinaciones) | Aprobada |
| Accesibilidad | Objetivos ≥ 24 px bajo 768 px, salvo enlaces dentro de texto | Aprobada |
| Accesibilidad | Foco visible de 2 px; tabs con ← →; sidebar con flechas y `[` | Aprobada |
| Accesibilidad | Drawer móvil: foco entra, Tab atrapado, Esc cierra y devuelve el foco | Aprobada |
| Accesibilidad | Modal a 390 px: dentro del viewport, validación visible, Esc y retorno de foco | Aprobada |
| Accesibilidad | Menú a 390 px dentro del viewport y navegable con flechas | Aprobada |
| Tema | `prefers-color-scheme` sin preferencia, conmutación, persistencia, opción "Según el sistema", tema aplicado antes de montar la app | Aprobada |
| Visual Lab | Vista previa en iframe con ancho real (390 → 1440 px) y cambio de tema | Aprobada |
| Visual | Revisión de capturas de 360, 390, 768, 1024, 1280 y 1440 px en ambos temas | Aprobada, con ajustes aplicados |

## Ejecutadas y fallidas (corregidas antes de la entrega)

| Prueba | Fallo | Corrección |
|---|---|---|
| Nombre accesible | El selector de archivos oculto no tenía nombre | `aria-label` añadido |
| Objetivos táctiles | Switch de 20 px de alto; referencias de 16 px en el inicio y el Visual Lab | Switch con área de 44×24 px; referencias de 24 px |
| Desbordamiento | Barras de espaciado del Visual Lab a 360 px | Ancho máximo al contenedor |
| Responsive | Cabecera de frente recortada en el mapa de emisión a 768 px | Frentes apilados bajo 1024 px |
| Iconos | Icono "X" sin registrar | Registrado; el verificador ahora detecta nombres de una letra |

## No ejecutadas

| Prueba | Motivo |
|---|---|
| Instalación limpia con `npm install` / `npm ci` | Sin acceso al registro de npm. El lockfile tiene 11 paquetes con integridad verificada; npm completará `@types/react`, `@types/react-dom` y el binario de esbuild de cada plataforma. |
| `npm run typecheck` con tipos reales de React | `@types/react` no disponible. Se ejecutó una comprobación parcial con declaraciones mínimas de React: sin errores propios; el único aviso (`strokeWidth` en los iconos) depende de los tipos reales de SVG que aportará `@types/react`. |
| Fuentes IBM Plex reales | Google Fonts bloqueado en el entorno: las capturas usan la fuente de respaldo. Revisar anchos de texto con Plex cargada. |
| Safari, Firefox, Edge | Sólo Chromium disponible. |
| Dispositivos físicos y pantallas táctiles reales | No disponibles. |
| Lectores de pantalla (NVDA, JAWS, VoiceOver) | No disponibles; se verificaron roles, nombres y foco por DOM. |
| Ampliación sólo de texto (preferencia de tamaño de fuente del navegador) | No emulable en Playwright; los tamaños están en rem. |
| Visor de artifacts de claude.ai | La vista previa en iframe se verificó en Chromium local; el visor puede bloquear marcos anidados (la app lo avisa). |

## Pendientes recomendados para V1.3

1. Ejecutar `npm install`, versionar el lockfile completo y correr `npm run verify` en CI.
2. Alojar IBM Plex localmente (`@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono`).
3. Cerrar los pendientes de componentes: `aria-controls` en Tabs, búsqueda por tipeo en Dropdown,
   reubicación automática de Tooltip, pausa de Toast, vista en tarjetas genérica para Data Table.
4. Auditoría con lector de pantalla y en Safari iOS / Chrome Android.
5. Validar con marca el ajuste de Text Secondary (#5B6B80) y los valores del tema oscuro.
