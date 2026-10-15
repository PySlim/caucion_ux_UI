import { createContext, useContext } from "react";
import type { RouteId } from "./nav";
import type { Solicitud } from "../data/mock";
import type { ThemeName, ThemePref, Density } from "../theme/theme";

export interface AppCtx {
  route: RouteId;
  go: (r: RouteId, opts?: { id?: string; tab?: string }) => void;
  routeParam?: string;
  solicitudes: Solicitud[];
  addSolicitud: (s: Solicitud) => void;
  updateSolicitud: (id: string, patch: Partial<Solicitud>) => void;
  openSearch: () => void;
  /** Tema efectivo aplicado */
  theme: ThemeName;
  /** Preferencia del usuario: claro, oscuro o según el sistema */
  themePref: ThemePref;
  setThemePref: (p: ThemePref) => void;
  density: Density;
  embedded: boolean;
}
export const AppContext = createContext<AppCtx>(null as unknown as AppCtx);
export const useApp = () => useContext(AppContext);
