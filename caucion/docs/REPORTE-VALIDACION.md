# Reporte de validación — CAUCIÓN Design System V1.2

Generado por `npm run test:ui` el 2026-10-15T19:27:25.819Z. Chromium (Playwright) sobre `dist/index.html`, red externa bloqueada (prueba sin CDN).

## Matriz responsiva (5 pantallas por celda)

| Ancho | Claro | Oscuro |
|---|---|---|
| 360 px | ✔ 5/5 | ✔ 5/5 |
| 390 px | ✔ 5/5 | ✔ 5/5 |
| 768 px | ✔ 5/5 | ✔ 5/5 |
| 1024 px | ✔ 5/5 | ✔ 5/5 |
| 1280 px | ✔ 5/5 | ✔ 5/5 |
| 1440 px | ✔ 5/5 | ✔ 5/5 |

Criterios por combinación: sin desbordamiento horizontal del documento ni del área de trabajo, ningún elemento fuera del viewport salvo dentro de un contenedor con desplazamiento propio, todos los controles con nombre accesible, ningún texto recortado sin elipsis y tema aplicado correcto.

## Anchos intermedios

30/30 combinaciones correctas (480, 600, 900, 1100, 1366 y 1920 px, tema claro, 5 pantallas).

## Zoom 200 % (reflow)

20/20 combinaciones correctas (1280 y 1440 px al 200 %, ambos temas, 5 pantallas).

## Interacción, foco y tema

| Prueba | Resultado | Detalle |
|---|---|---|
| Sin preferencia guardada se respeta prefers-color-scheme (oscuro) | ✔ Aprobada | tema=dark, guardado=null |
| Tema aplicado antes de cargar la aplicación (sin parpadeo) | ✔ Aprobada | atributo en DOMContentLoaded=dark |
| Conmutación global desde el topbar | ✔ Aprobada | tema=light, guardado=light |
| Preferencia persistente tras recargar | ✔ Aprobada | tema=light |
| Opción «Según el sistema» vuelve a seguir al sistema | ✔ Aprobada | tema=dark |
| Drawer móvil: el foco entra en la navegación | ✔ Aprobada |  |
| Drawer móvil: Tab queda atrapado dentro | ✔ Aprobada |  |
| Drawer móvil: Esc cierra y devuelve el foco al botón de menú | ✔ Aprobada | foco=Abrir navegación |
| Modal a 390 px dentro del viewport con validación visible | ✔ Aprobada | {"inView":true,"alert":true,"focusIn":true} |
| Modal: Esc cierra y devuelve el foco al disparador | ✔ Aprobada | foco=Nueva solicitud |
| Menú a 390 px dentro del viewport y navegable con flechas | ✔ Aprobada | activo mi-0 → mi-1 |
| Tabs: ← → cambian de pestaña | ✔ Aprobada | seleccionada=Participantes4 |
| Foco visible (contorno de 2 px) | ✔ Aprobada | solid 2px |
| Sidebar colapsable con teclado ( [ ) | ✔ Aprobada | ancho=64 |
| Sidebar navegable con flechas | ✔ Aprobada | foco=Solicitudes |
| Visual Lab: iframe con ancho real (390 → 1440 px) y cambio de tema | ✔ Aprobada | ancho 390 → 1440, tema dark |

## Objetivos táctiles menores de 24 px (< 768 px)

Ninguno fuera de enlaces dentro de texto (excepción WCAG 2.5.8).

## Recursos externos solicitados

- fonts.googleapis.com
