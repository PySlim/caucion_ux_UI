import React from "react";
import { ICONS } from "./icon-registry";

/**
 * Iconografía Lucide empaquetada localmente (react-icons/lu): sin CDN ni carga diferida.
 * Regla: el icono acompaña a una etiqueta; si va solo, requiere aria-label + tooltip.
 */
export interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export function Icon({ name, size = 16, strokeWidth = 1.75, className, label }: IconProps) {
  const C = ICONS[name];
  if (!C) {
    if (typeof console !== "undefined") console.warn(`[Icon] "${name}" no está en icon-registry.ts`);
    return <span aria-hidden="true" style={{ display: "inline-block", width: size, height: size, flexShrink: 0 }} />;
  }
  return (
    <C
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      style={{ flexShrink: 0 }}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      data-icon={name}
    />
  );
}
