import React, { useState } from "react";
import { Modal, useToast } from "../../components/ui/overlays";
import { Button } from "../../components/ui/controls";
import { StatusBadge, Tag, Amount } from "../../components/ui/data";
import { Icon } from "../../lib/icon";
import { date, dateTime } from "../../lib/format";
import type { OperacionEmision, PolizaEmitida } from "../../domain/emision";
import { INSTRUMENT_STATUS } from "../../domain/status";

interface Props {
  open: boolean;
  onClose: () => void;
  operacion: OperacionEmision;
  onConfirmEmitir: () => PolizaEmitida;
}

export function ModalEmitirPoliza({ open, onClose, operacion, onConfirmEmitir }: Props) {
  const toast = useToast();
  const [issuedResult, setIssuedResult] = useState<PolizaEmitida | null>(
    operacion.polizaEmitida ?? null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si la operación ya estaba emitida previamente, mostrar la vista de éxito
  React.useEffect(() => {
    if (open) {
      if (operacion.status === "emitida" && operacion.polizaEmitida) {
        setIssuedResult(operacion.polizaEmitida);
      } else {
        setIssuedResult(null);
      }
      setIsSubmitting(false);
    }
  }, [open, operacion]);

  if (!open) return null;

  const handleEmitir = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const poliza = onConfirmEmitir();
      setIssuedResult(poliza);
      setIsSubmitting(false);
      toast.push({
        tone: "success",
        title: "Póliza de caución emitida exitosamente",
        body: `N.º de póliza: ${poliza.numero} · Registro inmutable en auditoría.`,
      });
    }, 600);
  };

  const handleDownload = () => {
    toast.push({
      tone: "info",
      title: "Descarga generada (simulación)",
      body: `Archivo «${issuedResult?.numero ?? "POLIZA"}.pdf» generado para fines demostrativos.`,
    });
  };

  const handlePrint = () => {
    toast.push({
      tone: "info",
      title: "Impresión de copia certificada",
      body: "Comprobante con código de verificación QR listo para envío.",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={issuedResult ? "Póliza de Caución Emitida" : "Confirmación de Emisión de Póliza"}
      size="lg"
    >
      {issuedResult ? (
        /* VISTA DE PÓLIZA EMITIDA SATISFACTORIAMENTE */
        <div className="flex flex-col gap-5">
          {/* Banner de éxito */}
          <div className="p-4 rounded-card bg-success-soft border border-success flex items-start gap-3.5">
            <span className="h-10 w-10 rounded-full bg-success text-fg-on-status flex items-center justify-center shrink-0">
              <Icon name="BadgeCheck" size={24} />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="t-sub text-success font-semibold">Instrumento Emitido Satisfactoriamente</h3>
              <p className="t-body text-fg mt-0.5">
                Se ha generado la póliza oficial de caución bajo el régimen de contratación aplicable. La numeración y el hash criptográfico han sido certificados en la bitácora de auditoría.
              </p>
            </div>
          </div>

          {/* Carátula de la póliza */}
          <div className="p-5 rounded-card border-2 border-line bg-surface shadow-card flex flex-col gap-4 relative overflow-hidden">
            {/* Marca de agua institucional demo */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-5 pointer-events-none select-none text-9xl font-bold font-mono">
              CAUCIÓN
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
              <div>
                <span className="t-help uppercase text-fg-muted tracking-wider block">Certificado Oficial de Caución</span>
                <span className="t-amount-lg text-fg font-mono font-bold tracking-tight">{issuedResult.numero}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge def={INSTRUMENT_STATUS.emitido} />
                <Tag tone="neutral">{operacion.tipo}</Tag>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="t-help text-fg-muted block">Tomador (Contratista / Afianzado)</span>
                <span className="t-label text-fg block font-medium">{operacion.tomadorNombre}</span>
                <span className="t-help text-fg-muted font-mono">{operacion.tomadorDoc}</span>
              </div>
              <div>
                <span className="t-help text-fg-muted block">Asegurado (Entidad Beneficiaria)</span>
                <span className="t-label text-fg block font-medium">{operacion.beneficiarioNombre}</span>
                <span className="t-help text-fg-muted font-mono">{operacion.beneficiarioDoc}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-control bg-subtle border border-line grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="t-help text-fg-muted block">Suma Asegurada</span>
                <span className="font-bold block">
                  <Amount value={operacion.monto} currency={operacion.currency} />
                </span>
              </div>
              <div>
                <span className="t-help text-fg-muted block">Tasa Técnica Anual</span>
                <span className="t-amount text-fg font-medium">{issuedResult.tasaAnual.toFixed(2)} %</span>
              </div>
              <div>
                <span className="t-help text-fg-muted block">Prima Neta</span>
                <span className="font-medium block">
                  <Amount value={issuedResult.primaNeta} currency={operacion.currency} />
                </span>
              </div>
              <div>
                <span className="t-help text-fg-muted block">Vigencia</span>
                <span className="t-help text-fg font-mono block">
                  {date(operacion.vigenciaDesde)} al {date(operacion.vigenciaHasta)}
                </span>
              </div>
            </div>

            {/* Código de verificación y QR demo */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-line">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 bg-muted border border-line-strong rounded-control flex flex-col items-center justify-center p-1 text-center font-mono text-[9px] select-none text-fg-muted">
                  <Icon name="Workflow" size={24} className="text-fg mb-1" />
                  QR DEMO
                </div>
                <div className="flex flex-col">
                  <span className="t-help text-fg-muted">Código de verificación institucional:</span>
                  <span className="t-ref text-xs font-mono font-medium text-fg">{issuedResult.codigoVerificacionQR}</span>
                  <span className="t-help text-fg-subtle text-[11px] font-mono truncate max-w-[280px]">
                    Hash: {issuedResult.hashVerificacion.slice(0, 24)}...
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="t-help text-fg-muted block">Fecha de emisión:</span>
                <span className="t-caption text-fg font-mono">{dateTime(issuedResult.fechaEmision)}</span>
                <span className="t-help text-fg-muted block text-xs">Emitido por: {issuedResult.emitidoPor}</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
            <Button variant="secondary" icon="Download" onClick={handleDownload}>
              Descargar póliza (PDF demo)
            </Button>
            <Button variant="secondary" icon="FileCheck2" onClick={handlePrint}>
              Imprimir copia certificada
            </Button>
            <Button variant="primary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      ) : (
        /* VISTA DE CONFIRMACIÓN ANTES DE EMITIR */
        <div className="flex flex-col gap-4">
          <div className="p-3.5 rounded-control bg-subtle border border-line">
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-line">
              <span className="t-ref text-base font-semibold text-fg">{operacion.id}</span>
              <Tag tone="accent" icon="Check">Listo para emisión</Tag>
            </div>
            <p className="t-body text-fg">
              Estás a punto de emitir la póliza definitiva de caución. Por favor verifica que las partes, la suma afianzada y las condiciones técnicas coincidan con el contrato subyacente.
            </p>
          </div>

          {/* Resumen ejecutivo de la póliza */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-3 rounded-control border border-line bg-surface">
              <span className="t-help text-fg-muted block mb-1">Partes del contrato</span>
              <p className="t-label text-fg font-medium truncate">{operacion.tomadorNombre}</p>
              <p className="t-help text-fg-muted">Tomador · {operacion.tomadorDoc}</p>
              <div className="my-2 border-t border-line" />
              <p className="t-label text-fg font-medium truncate">{operacion.beneficiarioNombre}</p>
              <p className="t-help text-fg-muted">Beneficiario · {operacion.beneficiarioDoc}</p>
            </div>

            <div className="p-3 rounded-control border border-line bg-surface flex flex-col justify-between">
              <div>
                <span className="t-help text-fg-muted block mb-1">Condiciones financieras</span>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="t-body text-fg-muted">Suma asegurada:</span>
                  <span className="font-bold text-fg">
                    <Amount value={operacion.monto} currency={operacion.currency} />
                  </span>
                </div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="t-body text-fg-muted">Tasa anual:</span>
                  <span className="t-amount text-fg">{operacion.tasaAnual.toFixed(2)} %</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="t-body text-fg-muted">Prima neta calculada:</span>
                  <span className="font-semibold text-fg">
                    <Amount value={operacion.primaNetaEstimada} currency={operacion.currency} />
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-line flex items-center justify-between text-xs text-fg-muted">
                <span>Vigencia: {operacion.plazoDias} días</span>
                <span className="font-mono">{date(operacion.vigenciaDesde)} al {date(operacion.vigenciaHasta)}</span>
              </div>
            </div>
          </div>

          {/* Cláusulas obligatorias de la fianza */}
          <div className="p-3 rounded-control bg-subtle border border-line flex flex-col gap-1.5 text-xs">
            <span className="font-semibold text-fg flex items-center gap-1.5">
              <Icon name="ShieldCheck" size={14} className="text-success" />
              Cláusulas de Garantía conforme a Ley de Contrataciones del Estado (Perú)
            </span>
            <ul className="list-disc pl-4 text-fg-muted space-y-0.5">
              <li>Carácter solidario, incondicional, irrevocable y de realización automática al solo requerimiento.</li>
              <li>Plazo de honramiento: 3 días hábiles contados a partir de la notificación formal de ejecución.</li>
              <li>Sujeta a la regulación de la Superintendencia de Banca, Seguros y AFP (SBS).</li>
            </ul>
          </div>

          {/* Botones de confirmación */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-line mt-1">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              icon="FileCheck2"
              loading={isSubmitting}
              onClick={handleEmitir}
            >
              Confirmar y emitir póliza
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
