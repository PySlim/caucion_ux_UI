# CAUCIÓN — Design System V1.2 (Corporate Refined)

Design System oficial y prototipo navegable de CAUCIÓN, plataforma de seguros de caución y garantías.
Todos los datos son ficticios. No incluye backend.

## Requisitos

- Node.js 20 o superior y npm 10.
- Para `npm run test:ui`: navegador Chromium de Playwright (`npx playwright install chromium`).

## Instalación

```bash
npm install
```

> El `package-lock.json` se generó sin acceso al registro de npm: contiene las versiones exactas e
> integridad de 11 paquetes verificados. En la primera instalación usa **`npm install`** (no `npm ci`)
> para que npm complete los tipos de React y el binario de esbuild de tu plataforma; después versiona
> el lockfile resultante y usa `npm ci` en adelante.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Compila en modo desarrollo, recompila al guardar y sirve `http://localhost:5173` (recarga manual). |
| `npm run build` | Genera `dist/index.html` (documento completo) y `dist/caucion.html` (contenido para el host de artifacts). |
| `npm run tokens` | Regenera `src/tokens/generated/tokens.css` y `tokens.ts` desde `src/tokens/tokens.json`. |
| `npm run typecheck` | TypeScript estricto sobre `src/` (requiere `@types/react`, instalado por `npm install`). |
| `npm run check:contrast` | Verifica 44 pares de contraste WCAG 2.2 AA en tema claro y oscuro. |
| `npm run check:icons` | Verifica que cada icono usado exista en `src/lib/icon-registry.ts`. |
| `npm run test:ui` | Playwright: 6 anchos × 2 temas × 5 pantallas, anchos intermedios, zoom 200 %, foco, teclado y tema. Escribe `docs/REPORTE-VALIDACION.md`. |
| `npm run verify` | Todo lo anterior en orden. |

`dist/index.html` es autocontenido (CSS, JS e iconos embebidos). Sólo carga IBM Plex desde Google Fonts;
sin conexión usa la pila de respaldo (Segoe UI, system-ui, Arial).

## Estructura

```
src/
  tokens/tokens.json         FUENTE ÚNICA: primitivos, semánticos, componente, tema, densidad, tipografía
  tokens/generated/          tokens.css y tokens.ts (generados; no editar)
  tokens/contrast-pairs.json Pares de contraste que se verifican
  theme/theme.ts             Preferencia de tema (claro, oscuro, sistema) y densidad
  styles/app.css             Tailwind v4: sólo roles semánticos y de componente; roles tipográficos
  components/ui/             controls · data · overlays
  components/patterns/       FilterMenu · Specimen (Visual Lab)
  shell/                     AppShell (sidebar, topbar, workspace), navegación, búsqueda
  screens/                   Dashboard · Bandeja · Expediente · Emision · Catalogo (Visual Lab) · NuevaSolicitud
  data/mock.ts               Datos simulados
  lib/                       Formatos es-PE, contraste, iconos (Lucide vía react-icons/lu)
scripts/                     build-tokens, check-contrast, check-icons, dev, test-ui
docs/                        DESIGN-SYSTEM.md, VALIDACION-V1.2.md, REPORTE-VALIDACION.md, histórico
```

## Cambiar la identidad

Edita `src/tokens/tokens.json` y ejecuta `npm run build`. Los componentes sólo consumen tokens
semánticos y de componente, por lo que no hay que tocarlos.

Ver `docs/DESIGN-SYSTEM.md` (identidad y reglas), `CHANGELOG-V1.2.md` (cambios) y
`docs/VALIDACION-V1.2.md` (qué se probó y qué no).
