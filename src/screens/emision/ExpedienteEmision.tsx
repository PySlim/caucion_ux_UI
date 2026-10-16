import React, { useState } from "react";
import { Panel, StatusBadge, Amount, DescriptionList, Tag, Timeline, ProgressBar } from "../../components/ui/data";
import { Button } from "../../components/ui/controls";
import { Icon } from "../../lib/icon";
import { date, dateTime, relative, money } from "../../lib/format";
import type { OperacionEmision, DocumentoEmision, EvaluacionFrenteItem, FrenteEvaluacion } from "../../domain/emision";
import { EVALUACION_STATUS } from "../../domain/emision";
import { DOC_STATUS, ACTIVITY_STATUS, INSTRUMENT_STATUS } from "../../domain/status";

interface Props {
  operacion: OperacionEmision;
  onOpenDecisionModal: (opts?: { evaluacion?: EvaluacionFrenteItem }) => void;
  onValidateDoc: (docId: string) => void;
  onObserveDoc: (docId: string) => void;
  onGoToSeguimiento: () => void;
}

export function ExpedienteEmision({
  operacion,
  onOpenDecisionModal,
  onValidateDoc,
  onObserveDoc,
  onGoToSeguimiento,
}: Props) {
  const [subTab, setSubTab] = useState<"resumen" | "partes" | "caucion" | "documentos" | "evaluaciones" | "decisiones">("resumen");

  const docsValidados = operacion.documentos.filter((d) => d.status === "validado").length;
  const docsPendientes = operacion.documentos.filter((d) => d.status === "pendiente").length;
  const docsObservados = operacion.documentos.filter((d) => d.status === "observado").length;

  const evsAprobadas = operacion.evaluaciones.filter((e) => e.estado === "aprobada").length;
  const evsPendientes = operacion.evaluaciones.filter((e) => e.estado !== "aprobada").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-navegación interna del expediente */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-surface border border-line rounded-control">
        {[
          { id: "resumen", label: "Resumen ejecutivo", icon: "LayoutList" },
          { id: "partes", label: "Partes contratantes", icon: "Users" },
          { id: "caucion", label: "Datos de la caución", icon: "Banknote" },
          { id: "documentos", label: `Documentos (${docsValidados}/${operacion.documentos.length})`, icon: "Paperclip" },
          { id: "evaluaciones", label: `Evaluaciones por frente (${evsAprobadas}/6)`, icon: "ScanSearch" },
          { id: "decisiones", label: `Decisiones (${operacion.decisiones.length})`, icon: "Gavel" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id as any)}
            className={`px-3 py-1.5 rounded-control text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
              subTab === t.id
                ? "bg-action text-fg-on-action shadow-sm"
                : "text-fg-muted hv:text-fg hv:bg-muted"
            }`}
          >
            <Icon name={t.icon} size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* CONTENIDO SEGÚN SUB-PESTAÑA */}
      {subTab === "resumen" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Panel Principal */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Panel title="Resumen del caso de emisión">
              <div className="flex flex-col gap-4">
                <div className="p-3.5 rounded-control bg-subtle border border-line flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="t-help uppercase text-fg-muted tracking-wider">Objeto del afianzamiento</span>
                    <Tag tone="neutral">{operacion.tipo}</Tag>
                  </div>
                  <h3 className="t-sub text-fg font-semibold">{operacion.objeto}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-fg-muted font-mono pt-1 border-t border-line">
                    <span>Contrato subyacente: <strong className="text-fg">{operacion.contratoSubyacente}</strong></span>
                    <span>Canal: <strong className="text-fg">{operacion.canal}</strong></span>
                  </div>
                </div>

                <DescriptionList
                  columns={2}
                  items={[
                    { label: "Tomador / Contratista", value: <span className="font-medium text-fg">{operacion.tomadorNombre}</span> },
                    { label: "RUC / Documento", value: <span className="font-mono">{operacion.tomadorDoc}</span> },
                    { label: "Beneficiario / Asegurado", value: <span className="font-medium text-fg">{operacion.beneficiarioNombre}</span> },
                    { label: "RUC Beneficiario", value: <span className="font-mono">{operacion.beneficiarioDoc}</span> },
                    {
                      label: "Suma Asegurada",
                      value: (
                        <span className="font-bold text-base">
                          <Amount value={operacion.monto} currency={operacion.currency} />
                        </span>
                      ),
                    },
                    { label: "Plazo de Cobertura", value: <span className="font-mono">{operacion.plazoDias} días calendario</span> },
                    { label: "Vigencia", value: <span className="font-mono text-xs">{date(operacion.vigenciaDesde)} al {date(operacion.vigenciaHasta)}</span> },
                    {
                      label: "Tasa anual / Prima estimada",
                      value: (
                        <span>
                          {operacion.tasaAnual.toFixed(2)} % · <strong><Amount value={operacion.primaNetaEstimada} currency={operacion.currency} size="sm" /></strong>
                        </span>
                      ),
                    },
                  ]}
                />
              </div>
            </Panel>

            {/* Estado de frentes de evaluación */}
            <Panel
              title="Frentes de evaluación"
              actions={
                <Button size="sm" variant="secondary" icon="ScanSearch" onClick={() => setSubTab("evaluaciones")}>
                  Ver detalle
                </Button>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {operacion.evaluaciones.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-control border border-line bg-surface flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="t-label font-medium text-fg">{ev.frente}</span>
                      <StatusBadge def={EVALUACION_STATUS[ev.estado]} size="sm" />
                    </div>
                    <p className="t-help text-fg-muted line-clamp-2">{ev.dictamen}</p>
                    <span className="t-help text-fg-subtle text-[11px] font-mono">{ev.responsable}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Riel Lateral de Progreso */}
          <div className="flex flex-col gap-5">
            <Panel title="Avance y elegibilidad">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="t-help text-fg-muted">Documentos validados</span>
                    <span className="t-caption font-bold text-fg">{docsValidados} de {operacion.documentos.length}</span>
                  </div>
                  <ProgressBar value={docsValidados} max={operacion.documentos.length} label="Documentos validados" />
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="t-help text-fg-muted">Evaluaciones aprobadas</span>
                    <span className="t-caption font-bold text-fg">{evsAprobadas} de 6</span>
                  </div>
                  <ProgressBar value={evsAprobadas} max={6} label="Evaluaciones aprobadas" />
                </div>

                <div className="p-3 rounded-control bg-subtle border border-line flex flex-col gap-2">
                  <span className="t-help font-semibold text-fg">Condiciones para emisión:</span>
                  <ul className="text-xs space-y-1 text-fg-muted">
                    <li className="flex items-center gap-1.5">
                      <Icon name={docsObservados > 0 ? "CircleAlert" : docsPendientes > 0 ? "Clock3" : "Check"} size={13} className={docsObservados > 0 ? "text-danger" : docsPendientes > 0 ? "text-warning" : "text-success"} />
                      <span>{docsObservados > 0 ? `${docsObservados} doc(s) observados` : docsPendientes > 0 ? `${docsPendientes} doc(s) pendientes` : "Documentación 100% validada"}</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Icon name={evsPendientes > 0 ? "Clock3" : "Check"} size={13} className={evsPendientes > 0 ? "text-warning" : "text-success"} />
                      <span>{evsPendientes > 0 ? `${evsPendientes} frentes con revisión pendiente` : "Todos los frentes aprobados"}</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Icon name={operacion.status === "lista_emision" || operacion.status === "emitida" ? "Check" : "Clock3"} size={13} className={operacion.status === "lista_emision" || operacion.status === "emitida" ? "text-success" : "text-review"} />
                      <span>{operacion.status === "emitida" ? "Póliza ya emitida" : operacion.status === "lista_emision" ? "Habilitado para emitir" : "Aprobación colegiada requerida"}</span>
                    </li>
                  </ul>
                </div>

                <Button variant="primary" icon="Workflow" onClick={onGoToSeguimiento}>
                  Ir al mapa de seguimiento
                </Button>
              </div>
            </Panel>

            <Panel title="Eventos recientes">
              <Timeline dense items={operacion.eventos.slice(0, 5).map((e) => ({ ...e, ref: undefined }))} />
            </Panel>
          </div>
        </div>
      )}

      {/* SUB-PESTAÑA: PARTES CONTRATANTES */}
      {subTab === "partes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Panel title="Tomador (Contratista / Afianzado)">
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-control bg-subtle border border-line">
                <span className="t-help text-fg-muted block">Razón Social</span>
                <span className="t-sub font-semibold text-fg">{operacion.tomadorNombre}</span>
                <span className="t-help font-mono text-fg-muted block mt-0.5">{operacion.tomadorDoc}</span>
              </div>
              <DescriptionList
                columns={1}
                items={[
                  { label: "Grupo Económico", value: operacion.tomadorGrupo ?? "Empresa independiente" },
                  { label: "Tipo de Persona", value: "Jurídica · Régimen General" },
                  { label: "Actividad Principal", value: "Construcción de obras de ingeniería civil" },
                  { label: "Representante Legal", value: "Ing. Carlos Mendoza Paredes (Poder inscrito en SUNARP)" },
                  { label: "Domicilio Fiscal", value: "Av. Las Camelias 820, San Isidro, Lima" },
                ]}
              />
            </div>
          </Panel>

          <Panel title="Beneficiario (Asegurado / Entidad Contratante)">
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-control bg-subtle border border-line">
                <span className="t-help text-fg-muted block">Entidad Contratante</span>
                <span className="t-sub font-semibold text-fg">{operacion.beneficiarioNombre}</span>
                <span className="t-help font-mono text-fg-muted block mt-0.5">{operacion.beneficiarioDoc}</span>
              </div>
              <DescriptionList
                columns={1}
                items={[
                  { label: "Nivel de Gobierno", value: "Sector Público Nacional (Régimen OSCE)" },
                  { label: "Sector", value: "Transportes y Comunicaciones" },
                  { label: "Funcionario Autorizado", value: "Director General de Administración y Finanzas" },
                  { label: "Normativa Aplicable", value: "TUO de la Ley N.° 30225 de Contrataciones del Estado" },
                  { label: "Dirección de Notificación", value: "Jr. Zorritos 1203, Lima" },
                ]}
              />
            </div>
          </Panel>
        </div>
      )}

      {/* SUB-PESTAÑA: DATOS DE LA CAUCIÓN */}
      {subTab === "caucion" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Panel title="Condiciones del instrumento de caución">
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-control bg-subtle border border-line">
                  <span className="t-help uppercase text-fg-muted tracking-wider block mb-1">Tipo de garantía</span>
                  <span className="t-section text-fg font-semibold">{operacion.tipo}</span>
                  <p className="t-body text-fg-muted mt-1">
                    Garantiza el estricto cumplimiento de todas las obligaciones contractuales asumidas por el tomador frente a la entidad contratante, conforme al contrato subyacente.
                  </p>
                </div>

                <DescriptionList
                  columns={2}
                  items={[
                    {
                      label: "Suma Asegurada",
                      value: (
                        <span className="font-bold text-lg">
                          <Amount value={operacion.monto} currency={operacion.currency} size="lg" />
                        </span>
                      ),
                    },
                    { label: "Moneda de la Operación", value: <span>{operacion.currency === "PEN" ? "Soles (PEN)" : "Dólares Americanos (USD)"}</span> },
                    { label: "Vigencia Desde", value: <span className="font-mono">{date(operacion.vigenciaDesde)}</span> },
                    { label: "Vigencia Hasta", value: <span className="font-mono">{date(operacion.vigenciaHasta)}</span> },
                    { label: "Plazo Total", value: <span className="font-mono">{operacion.plazoDias} días calendario</span> },
                    { label: "Tasa Técnica Anual", value: <span className="font-mono font-medium">{operacion.tasaAnual.toFixed(2)} %</span> },
                    {
                      label: "Prima Neta Estimada",
                      value: (
                        <span className="font-mono font-semibold">
                          <Amount value={operacion.primaNetaEstimada} currency={operacion.currency} />
                        </span>
                      ),
                    },
                    { label: "Contrato Principal", value: <span className="font-mono">{operacion.contratoSubyacente}</span> },
                  ]}
                />
              </div>
            </Panel>
          </div>

          <Panel title="Cláusulas técnicas obligatorias">
            <div className="flex flex-col gap-3 text-xs text-fg">
              <div className="p-2.5 rounded-control bg-subtle border border-line">
                <strong className="block text-fg mb-0.5">Carácter Solidario e Incondicional</strong>
                <p className="text-fg-muted">La compañía aseguradora renuncia al beneficio de excusión y división.</p>
              </div>
              <div className="p-2.5 rounded-control bg-subtle border border-line">
                <strong className="block text-fg mb-0.5">Realización Automática</strong>
                <p className="text-fg-muted">Pago dentro de los 3 días útiles siguientes al requerimiento notarial del beneficiario.</p>
              </div>
              <div className="p-2.5 rounded-control bg-subtle border border-line">
                <strong className="block text-fg mb-0.5">Irrevocabilidad</strong>
                <p className="text-fg-muted">La garantía no puede ser cancelada ni devuelta sin conformidad expresa del asegurado.</p>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* SUB-PESTAÑA: DOCUMENTOS */}
      {subTab === "documentos" && (
        <Panel
          title="Documentación contractual y de respaldo"
          subtitle={`${docsValidados} de ${operacion.documentos.length} validados`}
        >
          <div className="flex flex-col gap-3">
            <div className="divide-y divide-line border border-line rounded-control overflow-hidden">
              {operacion.documentos.map((d) => (
                <div key={d.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface hv:bg-subtle">
                  <div className="flex items-start gap-3">
                    <span className="h-8 w-8 rounded-control bg-muted text-fg flex items-center justify-center shrink-0">
                      <Icon name="Paperclip" size={16} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="t-body font-medium text-fg">{d.nombre}</span>
                        {d.obligatorio && <Tag tone="danger">Obligatorio</Tag>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 t-help text-fg-muted mt-0.5">
                        <span>Categoría: {d.categoria}</span>
                        <span>Tamaño: {d.size}</span>
                        {d.version > 0 && <span>Versión: v{d.version}</span>}
                        {d.fecha && <span>Subido: {date(d.fecha.slice(0, 10))}</span>}
                      </div>
                      {d.nota && (
                        <p className="t-help text-danger mt-1 flex items-center gap-1">
                          <Icon name="CircleAlert" size={12} />
                          {d.nota}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <StatusBadge def={DOC_STATUS[d.status]} size="sm" />
                    {d.status !== "validado" && (
                      <Button size="sm" variant="secondary" icon="Check" onClick={() => onValidateDoc(d.id)}>
                        Validar
                      </Button>
                    )}
                    {d.status !== "observado" && (
                      <Button size="sm" variant="secondary" icon="CircleAlert" onClick={() => onObserveDoc(d.id)}>
                        Observar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {/* SUB-PESTAÑA: EVALUACIONES */}
      {subTab === "evaluaciones" && (
        <Panel
          title="Frentes de evaluación de la emisión"
          actions={
            <Button variant="primary" icon="Gavel" onClick={() => onOpenDecisionModal()}>
              Registrar decisión colegiada
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {operacion.evaluaciones.map((ev) => (
              <div key={ev.id} className="p-4 rounded-control border border-line bg-surface flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-line">
                    <div className="flex items-center gap-2">
                      <span className="t-sub font-semibold text-fg">Frente {ev.frente}</span>
                    </div>
                    <StatusBadge def={EVALUACION_STATUS[ev.estado]} size="sm" />
                  </div>
                  <p className="t-body text-fg">{ev.dictamen}</p>

                  {ev.condiciones && ev.condiciones.length > 0 && (
                    <div className="mt-2 p-2 rounded-control bg-subtle border border-line text-xs">
                      <span className="font-semibold text-fg block mb-0.5">Condiciones estipuladas:</span>
                      <ul className="list-disc pl-4 text-fg-muted">
                        {ev.condiciones.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {ev.observaciones && ev.observaciones.length > 0 && (
                    <div className="mt-2 p-2 rounded-control bg-danger-soft border border-danger text-xs">
                      <span className="font-semibold text-danger block mb-0.5">Observaciones por subsanar:</span>
                      <ul className="list-disc pl-4 text-danger">
                        {ev.observaciones.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-line text-xs text-fg-muted">
                  <span className="font-mono">Evaluador: {ev.responsable}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon="Gavel"
                    onClick={() => onOpenDecisionModal({ evaluacion: ev })}
                  >
                    Actualizar dictamen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* SUB-PESTAÑA: DECISIONES */}
      {subTab === "decisiones" && (
        <Panel
          title="Registro formal de decisiones humanas"
          actions={
            <Button variant="primary" icon="Gavel" onClick={() => onOpenDecisionModal()}>
              Nueva decisión
            </Button>
          }
        >
          {operacion.decisiones.length === 0 ? (
            <div className="text-center py-8 text-fg-muted">
              No hay decisiones registradas aún para este caso de emisión.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {operacion.decisiones.map((d) => (
                <div key={d.id} className="p-4 rounded-control border border-line bg-surface flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon name="Gavel" size={16} className="text-review" />
                      <span className="t-sub font-semibold text-fg">{d.titulo}</span>
                    </div>
                    <Tag tone={d.estado === "aprobada" ? "success" : d.estado === "devuelta" ? "warning" : "review"}>
                      {d.estado.toUpperCase()}
                    </Tag>
                  </div>
                  <p className="t-body text-fg">{d.contexto}</p>
                  {d.fundamentacion && (
                    <p className="t-help text-fg-muted bg-subtle p-2.5 rounded-control border border-line">
                      <strong>Fundamentación registrada:</strong> {d.fundamentacion}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-fg-muted pt-2 border-t border-line">
                    <span>Responsable: {d.responsable}</span>
                    <span className="font-mono">{dateTime(d.cuando)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
