import React, { useState } from "react";
import { Modal } from "../../components/ui/overlays";
import { Button, Field, Input, Textarea, Select } from "../../components/ui/controls";
import { StatusBadge, Tag } from "../../components/ui/data";
import type { ActividadWorkflow, EvaluacionFrenteItem, FrenteEvaluacion } from "../../domain/emision";
import { EVALUACION_STATUS } from "../../domain/emision";
import { ACTIVITY_STATUS } from "../../domain/status";

export type DecisionKind = "aprobar" | "subsanar" | "observar" | "devolver" | "rechazar";

interface Props {
  open: boolean;
  onClose: () => void;
  actividad?: ActividadWorkflow | null;
  evaluacion?: EvaluacionFrenteItem | null;
  initialKind?: DecisionKind;
  onConfirm: (payload: {
    kind: DecisionKind;
    fundamentacion: string;
    condicion?: string;
    frente?: FrenteEvaluacion;
  }) => void;
}

export function ModalDecision({ open, onClose, actividad, evaluacion, initialKind = "aprobar", onConfirm }: Props) {
  const [kind, setKind] = useState<DecisionKind>(initialKind);
  const [fundamentacion, setFundamentacion] = useState("");
  const [condicion, setCondicion] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sincronizar tipo inicial cuando se abre
  React.useEffect(() => {
    setKind(initialKind);
    setFundamentacion("");
    setCondicion("");
    setError(null);
  }, [open, initialKind]);

  if (!open) return null;

  const targetName = actividad ? actividad.name : evaluacion ? `Evaluación ${evaluacion.frente}` : "Actividad de emisión";
  const frente = actividad?.frente ?? evaluacion?.frente;

  const titles: Record<DecisionKind, string> = {
    aprobar: "Registrar decisión de aprobación",
    subsanar: "Solicitar subsanación de requerimientos",
    observar: "Registrar observación técnica / legal",
    devolver: "Devolver actividad para corrección",
    rechazar: "Registrar dictamen desfavorable / rechazo",
  };

  const actionLabels: Record<DecisionKind, string> = {
    aprobar: "Aprobar",
    subsanar: "Solicitar subsanación",
    observar: "Registrar observación",
    devolver: "Devolver para corrección",
    rechazar: "Rechazar",
  };

  const variantButton: Record<DecisionKind, "primary" | "danger" | "secondary"> = {
    aprobar: "primary",
    subsanar: "primary",
    observar: "secondary",
    devolver: "danger",
    rechazar: "danger",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundamentacion.trim()) {
      setError("La fundamentación o motivo es obligatoria para garantizar la trazabilidad.");
      return;
    }
    onConfirm({
      kind,
      fundamentacion: fundamentacion.trim(),
      condicion: condicion.trim() || undefined,
      frente,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titles[kind]}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Contexto del elemento */}
        <div className="p-3 rounded-control bg-subtle border border-line flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="t-help text-fg-muted uppercase tracking-wider">{frente ? `Frente: ${frente}` : "Operación de emisión"}</span>
            {actividad && <StatusBadge def={ACTIVITY_STATUS[actividad.status]} size="sm" />}
            {evaluacion && <Tag tone="info">{evaluacion.frente}</Tag>}
          </div>
          <h4 className="t-sub text-fg font-medium">{targetName}</h4>
          {actividad?.detail && <p className="t-help text-fg-muted">{actividad.detail}</p>}
        </div>

        {/* Selector de tipo de acción */}
        <Field label="Tipo de decisión a registrar">
          <Select
            options={[
              { value: "aprobar", label: "Aprobar (Dictamen favorable)" },
              { value: "subsanar", label: "Solicitar subsanación (Devolver al cliente / canal)" },
              { value: "observar", label: "Registrar observación (Sin rechazar)" },
              { value: "devolver", label: "Devolver actividad (Revisión interna)" },
              { value: "rechazar", label: "Rechazar (Dictamen desfavorable)" },
            ]}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as DecisionKind);
              setError(null);
            }}
          />
        </Field>

        {/* Campo de Fundamentación */}
        <Field
          label={kind === "devolver" || kind === "rechazar" || kind === "subsanar" ? "Motivo detallado del requerimiento *" : "Fundamento de la decisión *"}
          help="Quedará registrado formalmente en la bitácora inmutable de auditoría del caso."
          error={error ?? undefined}
        >
          <Textarea
            rows={3}
            placeholder={
              kind === "aprobar"
                ? "Ej. Se verificaron las contragarantías y la capacidad crediticia es suficiente..."
                : kind === "subsanar"
                ? "Ej. Falta legalización notarial en el pagaré de respaldo..."
                : "Describe los fundamentos técnicos o legales..."
            }
            value={fundamentacion}
            onChange={(e) => {
              setFundamentacion(e.target.value);
              if (error) setError(null);
            }}
            required
          />
        </Field>

        {/* Condición adicional si es aprobación */}
        {kind === "aprobar" && (
          <Field label="Condición resolutoria o de cumplimiento (opcional)" help="Condiciones previas o posteriores a la entrega del instrumento.">
            <Input
              type="text"
              placeholder="Ej. Retención del 5% en primeras valorizaciones de obra..."
              value={condicion}
              onChange={(e) => setCondicion(e.target.value)}
            />
          </Field>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-line mt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant={variantButton[kind]} icon={kind === "aprobar" ? "Check" : kind === "devolver" ? "Undo2" : "Gavel"}>
            {actionLabels[kind]}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
