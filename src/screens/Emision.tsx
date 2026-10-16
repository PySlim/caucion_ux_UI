import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, PageBody } from "../shell/AppShell";
import { useApp } from "../shell/AppContext";
import { Button } from "../components/ui/controls";
import { StatusBadge, Tag, Amount, InlineAlert } from "../components/ui/data";
import { Tooltip, useToast } from "../components/ui/overlays";
import { Icon } from "../lib/icon";
import { cn } from "../lib/cn";
import {
  EMISION_STATUS,
  type OperacionEmision,
  type ActividadWorkflow,
  type EvaluacionFrenteItem,
  type PolizaEmitida,
} from "../domain/emision";
import {
  ACTIVITY_STATUS,
  INSTRUMENT_STATUS,
  TONE_CLASSES,
  type ActivityStatus,
} from "../domain/status";
import {
  loadEmisiones,
  saveEmisiones,
  resetEmisiones,
} from "../data/mock-emision";
import { BandejaEmisiones } from "./emision/BandejaEmisiones";
import { ExpedienteEmision } from "./emision/ExpedienteEmision";
import { WorkspaceSeguimiento } from "./emision/WorkspaceSeguimiento";
import { ModalDecision, type DecisionKind } from "./emision/ModalDecision";
import { ModalEmitirPoliza } from "./emision/ModalEmitirPoliza";

export function Emision() {
  const { routeParam, go } = useApp();
  const toast = useToast();

  const [operaciones, setOperaciones] = useState<OperacionEmision[]>(() => loadEmisiones());
  // Si routeParam viene con un ID (e.g. EMI-2026-0089), abrimos ese caso
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (routeParam && routeParam !== "bandeja") return routeParam;
    return null;
  });

  const [mainTab, setMainTab] = useState<"workspace" | "expediente">("workspace");
  const [selectedActId, setSelectedActId] = useState<string>("A10");

  // Modales
  const [decisionModal, setDecisionModal] = useState<{
    open: boolean;
    actividad?: ActividadWorkflow | null;
    evaluacion?: EvaluacionFrenteItem | null;
    initialKind?: DecisionKind;
  }>({ open: false });

  const [emitirModalOpen, setEmitirModalOpen] = useState(false);

  // Sincronizar cambios en operaciones con localStorage
  useEffect(() => {
    saveEmisiones(operaciones);
  }, [operaciones]);

  // Sincronizar routeParam
  useEffect(() => {
    if (routeParam && routeParam !== "bandeja") {
      setActiveId(routeParam);
    } else if (routeParam === "bandeja") {
      setActiveId(null);
    }
  }, [routeParam]);

  const activeOp = useMemo(
    () => (activeId ? operaciones.find((o) => o.id === activeId) ?? null : null),
    [operaciones, activeId]
  );

  // Helper para actualizar la operación activa
  const updateCurrentOp = useCallback(
    (updater: (prev: OperacionEmision) => OperacionEmision) => {
      if (!activeId) return;
      setOperaciones((prev) =>
        prev.map((op) => (op.id === activeId ? updater(op) : op))
      );
    },
    [activeId]
  );

  // Restablecer demo a valores de fábrica
  const handleResetDemo = useCallback(() => {
    const initial = resetEmisiones();
    setOperaciones(initial);
    toast.push({
      tone: "info",
      title: "Datos de demostración restablecidos",
      body: "Todas las operaciones, actividades y estados volvieron a su semilla inicial.",
    });
  }, [toast]);

  // Selección de operación desde la bandeja
  const handleSelectOperacion = useCallback(
    (id: string) => {
      setActiveId(id);
      setSelectedActId("A10");
      go("emision", { id });
    },
    [go]
  );

  // Volver a la bandeja de emisiones
  const handleBackToBandeja = useCallback(() => {
    setActiveId(null);
    go("emision", { id: "bandeja" });
  }, [go]);

  // Cambiar estado de una actividad (con lógica de desbloqueo automático y actualización de caso)
  const handleUpdateActividadStatus = useCallback(
    (actId: string, nextStatus: ActivityStatus) => {
      updateCurrentOp((op) => {
        let acts = op.actividades.map((a) =>
          a.id === actId
            ? { ...a, status: nextStatus, since: new Date().toISOString() }
            : a
        );

        // Regla de desbloqueo automático: si una actividad bloqueada tiene todas sus dependencias completas
        acts = acts.map((a) => {
          if (
            a.status === "bloqueada" &&
            a.deps.length > 0 &&
            a.deps.every((d) => acts.find((x) => x.id === d)?.status === "completada")
          ) {
            return { ...a, status: "no_iniciada" };
          }
          return a;
        });

        // Verificar si se cumplen las condiciones para emisión
        const a10Done = acts.find((a) => a.id === "A10")?.status === "completada";
        const a9Done = acts.find((a) => a.id === "A9")?.status === "completada";
        const docsOk = op.documentos.every((d) => !d.obligatorio || d.status === "validado");

        let nextCaseStatus = op.status;
        if (op.status !== "emitida") {
          if (a10Done && a9Done && docsOk) {
            nextCaseStatus = "lista_emision";
          } else if (acts.some((a) => a.status === "devuelta")) {
            nextCaseStatus = "observada";
          } else if (acts.some((a) => a.status === "esperando_decision")) {
            nextCaseStatus = "en_aprobacion";
          } else {
            nextCaseStatus = "en_evaluacion";
          }
        }

        const actName = acts.find((a) => a.id === actId)?.name ?? actId;
        const newEvent = {
          id: Math.random().toString(36).substring(2, 9),
          who: "Usuario actual",
          action: `cambió el estado de «${actName}» a ${ACTIVITY_STATUS[nextStatus].label}`,
          ref: actId,
          when: new Date().toISOString(),
          kind: "update" as const,
        };

        return {
          ...op,
          actividades: acts,
          status: nextCaseStatus,
          eventos: [newEvent, ...op.eventos],
        };
      });

      toast.push({
        tone: "success",
        title: "Actividad actualizada",
        body: `Nuevo estado: ${ACTIVITY_STATUS[nextStatus].label}`,
      });
    },
    [updateCurrentOp, toast]
  );

  // Confirmar decisión humana desde el modal
  const handleConfirmDecision = useCallback(
    (payload: {
      kind: DecisionKind;
      fundamentacion: string;
      condicion?: string;
      frente?: any;
    }) => {
      const act = decisionModal.actividad;
      const ev = decisionModal.evaluacion;

      updateCurrentOp((op) => {
        let acts = [...op.actividades];
        let evs = [...op.evaluaciones];
        let decis = [...op.decisiones];
        let nextStatus = op.status;

        const timestamp = new Date().toISOString();

        if (act) {
          if (payload.kind === "aprobar") {
            acts = acts.map((a) =>
              a.id === act.id ? { ...a, status: "completada", since: timestamp } : a
            );
          } else if (payload.kind === "devolver" || payload.kind === "subsanar") {
            acts = acts.map((a) =>
              a.id === act.id
                ? {
                    ...a,
                    status: payload.kind === "devolver" ? "devuelta" : "en_revision",
                    returns: (a.returns ?? 0) + (payload.kind === "devolver" ? 1 : 0),
                    since: timestamp,
                  }
                : a
            );
          } else if (payload.kind === "observar") {
            acts = acts.map((a) =>
              a.id === act.id
                ? {
                    ...a,
                    observaciones: [payload.fundamentacion, ...(a.observaciones ?? [])],
                    since: timestamp,
                  }
                : a
            );
          }

          // Desbloquear dependientes si aplica
          acts = acts.map((a) => {
            if (
              a.status === "bloqueada" &&
              a.deps.length > 0 &&
              a.deps.every((d) => acts.find((x) => x.id === d)?.status === "completada")
            ) {
              return { ...a, status: "no_iniciada" };
            }
            return a;
          });

          // Registrar en la lista de decisiones
          decis = [
            {
              id: Math.random().toString(36).substring(2, 9),
              titulo: `Decisión sobre ${act.name}`,
              actividadId: act.id,
              frente: act.frente,
              solicitadaPor: act.owner,
              responsable: "Usuario actual",
              cuando: timestamp,
              contexto: `Decisión registrada bajo el frente ${act.frente}`,
              estado: payload.kind === "aprobar" ? "aprobada" : payload.kind === "devolver" ? "devuelta" : "pendiente",
              fundamentacion: payload.fundamentacion,
              condiciones: payload.condicion ? [payload.condicion] : undefined,
            },
            ...decis,
          ];
        }

        if (ev) {
          evs = evs.map((e) =>
            e.id === ev.id
              ? {
                  ...e,
                  estado:
                    payload.kind === "aprobar"
                      ? "aprobada"
                      : payload.kind === "devolver" || payload.kind === "observar"
                      ? "observada"
                      : payload.kind === "rechazar"
                      ? "rechazada"
                      : "en_revision",
                  dictamen: payload.fundamentacion,
                  fecha: timestamp,
                  condiciones: payload.condicion ? [payload.condicion] : e.condiciones,
                }
              : e
          );
        }

        // Evaluar si pasa a lista para emitir
        const a10Done = acts.find((a) => a.id === "A10")?.status === "completada";
        const a9Done = acts.find((a) => a.id === "A9")?.status === "completada";
        const allEvsDone = evs.every((e) => e.estado === "aprobada");

        if (op.status !== "emitida") {
          if (a10Done && a9Done) {
            nextStatus = "lista_emision";
          } else if (acts.some((a) => a.status === "devuelta")) {
            nextStatus = "observada";
          }
        }

        const actionText =
          payload.kind === "aprobar"
            ? `registró aprobación en «${act?.name ?? ev?.frente}»`
            : payload.kind === "devolver"
            ? `devolvió para subsanación: ${payload.fundamentacion}`
            : `registró observación en «${act?.name ?? ev?.frente}»`;

        const newEvent = {
          id: Math.random().toString(36).substring(2, 9),
          who: "Usuario actual",
          action: actionText,
          ref: act?.id ?? ev?.id ?? "caso",
          when: timestamp,
          kind: "decision" as const,
        };

        return {
          ...op,
          actividades: acts,
          evaluaciones: evs,
          decisiones: decis,
          status: nextStatus,
          eventos: [newEvent, ...op.eventos],
        };
      });

      toast.push({
        tone: payload.kind === "aprobar" ? "success" : payload.kind === "devolver" ? "warning" : "info",
        title: "Decisión registrada exitosamente",
        body: payload.fundamentacion.slice(0, 80) + "...",
      });
    },
    [decisionModal, updateCurrentOp, toast]
  );

  // Validar y observar documentos
  const handleValidateDoc = useCallback(
    (docId: string) => {
      updateCurrentOp((op) => {
        const doc = op.documentos.find((d) => d.id === docId);
        const docs = op.documentos.map((d) => (d.id === docId ? { ...d, status: "validado" as const } : d));
        const newEvent = {
          id: Math.random().toString(36).substring(2, 9),
          who: "Usuario actual",
          action: `validó el documento contractual «${doc?.nombre ?? docId}»`,
          ref: docId,
          when: new Date().toISOString(),
          kind: "document" as const,
        };
        return { ...op, documentos: docs, eventos: [newEvent, ...op.eventos] };
      });
      toast.push({ tone: "success", title: "Documento validado" });
    },
    [updateCurrentOp, toast]
  );

  const handleObserveDoc = useCallback(
    (docId: string) => {
      updateCurrentOp((op) => {
        const doc = op.documentos.find((d) => d.id === docId);
        const docs = op.documentos.map((d) =>
          d.id === docId ? { ...d, status: "observado" as const, nota: "Observado durante revisión de expediente." } : d
        );
        const newEvent = {
          id: Math.random().toString(36).substring(2, 9),
          who: "Usuario actual",
          action: `observó el documento «${doc?.nombre ?? docId}»`,
          ref: docId,
          when: new Date().toISOString(),
          kind: "document" as const,
        };
        return { ...op, documentos: docs, eventos: [newEvent, ...op.eventos] };
      });
      toast.push({ tone: "warning", title: "Documento marcado como observado" });
    },
    [updateCurrentOp, toast]
  );

  // Ejecutar emisión formal de la póliza
  const handleConfirmEmitirPoliza = useCallback((): PolizaEmitida => {
    if (!activeOp) throw new Error("No hay operación activa");

    const numero = `POL-CAU-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const poliza: PolizaEmitida = {
      numero,
      fechaEmision: new Date().toISOString(),
      emitidoPor: "Carla Ríos",
      hashVerificacion: hash,
      tasaAnual: activeOp.tasaAnual,
      primaNeta: activeOp.primaNetaEstimada,
      moneda: activeOp.currency,
      codigoVerificacionQR: `CAU-QR-${numero}-VERIFIED`,
    };

    updateCurrentOp((op) => {
      const timestamp = new Date().toISOString();
      const updatedActs = op.actividades.map((a) =>
        a.id === "A11"
          ? { ...a, status: "completada" as ActivityStatus, since: timestamp }
          : a.id === "A12"
          ? { ...a, status: "en_curso" as ActivityStatus, since: timestamp }
          : a
      );

      const newEvent = {
        id: Math.random().toString(36).substring(2, 9),
        who: "Carla Ríos",
        action: `emitió formalmente la póliza de caución ${numero}`,
        ref: "A11",
        when: timestamp,
        kind: "issue" as const,
      };

      return {
        ...op,
        actividades: updatedActs,
        status: "emitida",
        instrumentStatus: "emitido",
        polizaEmitida: poliza,
        eventos: [newEvent, ...op.eventos],
      };
    });

    return poliza;
  }, [activeOp, updateCurrentOp]);

  // Si no hay operación activa, renderizar la Bandeja de Emisiones
  if (!activeOp) {
    return (
      <>
        <PageHeader
          module="Módulo de Emisión de Cauciones"
          title="Bandeja de operaciones de emisión"
          description="Gestión integral de expedientes, frentes de evaluación y seguimiento operacional de instrumentos de caución."
          actions={
            <Button
              variant="secondary"
              icon="RotateCcw"
              onClick={handleResetDemo}
              title="Restablecer datos demo"
            >
              Restablecer datos demo
            </Button>
          }
        />
        <PageBody>
          <InlineAlert tone="info" title="Prototipo navegable del módulo de emisión">
            Explora las operaciones con diferentes estados, como <strong>EMI-2026-0091</strong> (lista para emitir) o <strong>EMI-2026-0089</strong> (con frentes paralelos y subsanación en curso). Haz clic en cualquier fila para ingresar a su expediente y seguimiento operacional.
          </InlineAlert>
          <BandejaEmisiones
            operaciones={operaciones}
            onSelectOperacion={handleSelectOperacion}
            onResetDemo={handleResetDemo}
          />
        </PageBody>
      </>
    );
  }

  // CÁLCULOS DE BLOQUEO PARA LA EMISIÓN
  const acts = activeOp.actividades;
  const byId = (id: string) => acts.find((a) => a.id === id);
  const doneCount = acts.filter((a) => a.status === "completada").length;

  // Actividades críticas que bloquean la emisión si no están completadas
  const emitBlockers = ["A6", "A7", "A8", "A9", "A10"]
    .map(byId)
    .filter((a) => a && a.status !== "completada");

  const isEligibleToEmit = emitBlockers.length === 0;

  return (
    <>
      <PageHeader
        back={{
          label: "Bandeja de operaciones",
          onClick: handleBackToBandeja,
        }}
        module="Workspace de emisión"
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            <span className="t-ref text-xl font-bold">{activeOp.id}</span>
            <Tag tone="neutral" icon="FileStack">{activeOp.tipo}</Tag>
            <StatusBadge def={EMISION_STATUS[activeOp.status]} />
          </span>
        }
        description={
          <>
            <span className="text-fg font-medium">{activeOp.tomadorNombre}</span> a favor de{" "}
            <span className="text-fg font-medium">{activeOp.beneficiarioNombre}</span> ·{" "}
            <Amount value={activeOp.monto} currency={activeOp.currency} /> · {activeOp.plazoDias} días
          </>
        }
        actions={
          <>
            <Button
              variant="secondary"
              icon="RotateCcw"
              onClick={handleResetDemo}
              title="Restablecer datos de demostración"
            >
              Restablecer demo
            </Button>

            <Button
              variant="secondary"
              icon="FileSearch"
              onClick={() =>
                toast.push({
                  tone: "info",
                  title: "Vista previa del instrumento",
                  body: `Borrador oficial del instrumento «${activeOp.id}» con marca de agua «SIN VALOR» generado.`,
                })
              }
            >
              Vista previa
            </Button>

            <Tooltip
              content={
                activeOp.status === "emitida"
                  ? "Póliza ya emitida (Haz clic para consultar certificado)"
                  : emitBlockers.length > 0
                  ? `Bloqueos pendientes: ${emitBlockers.map((b) => b?.name).join(" · ")}`
                  : "Todas las condiciones se cumplieron. Listo para emitir la póliza."
              }
            >
              <Button
                variant={activeOp.status === "emitida" ? "secondary" : "primary"}
                icon={activeOp.status === "emitida" ? "BadgeCheck" : "FileCheck2"}
                aria-disabled={!isEligibleToEmit && activeOp.status !== "emitida"}
                className={cn(
                  !isEligibleToEmit &&
                    activeOp.status !== "emitida" &&
                    "bg-muted text-fg-subtle cursor-not-allowed"
                )}
                onClick={() => {
                  if (activeOp.status === "emitida") {
                    setEmitirModalOpen(true);
                  } else if (isEligibleToEmit) {
                    setEmitirModalOpen(true);
                  } else {
                    toast.push({
                      tone: "warning",
                      title: "Aún no se puede emitir la póliza",
                      body: `Debes completar previamente: ${emitBlockers
                        .map((b) => b?.name)
                        .join(", ")}.`,
                    });
                  }
                }}
              >
                {activeOp.status === "emitida" ? "Ver póliza emitida" : "Emitir póliza"}
              </Button>
            </Tooltip>
          </>
        }
        meta={
          <div className="flex flex-wrap items-stretch gap-x-8 gap-y-3 mt-1">
            <div className="flex flex-col gap-1">
              <span className="t-help text-fg-muted">Estado del instrumento</span>
              <StatusBadge def={INSTRUMENT_STATUS[activeOp.instrumentStatus]} variant="outline" />
            </div>

            <div className="flex flex-col gap-1.5 min-w-[260px] flex-1 max-w-[460px]">
              <span className="t-help text-fg-muted flex justify-between">
                <span>Avance operacional transversal</span>
                <span className="tnum text-fg font-medium">
                  {doneCount} de {acts.length} actividades
                </span>
              </span>
              <div className="flex h-2 rounded-full overflow-hidden bg-muted gap-px" aria-hidden="true">
                {(Object.keys(ACTIVITY_STATUS) as ActivityStatus[]).map((k) => {
                  const count = acts.filter((a) => a.status === k).length;
                  if (count === 0) return null;
                  return (
                    <span
                      key={k}
                      className={TONE_CLASSES[ACTIVITY_STATUS[k].tone].dot}
                      style={{ width: `${(count / acts.length) * 100}%` }}
                      title={`${ACTIVITY_STATUS[k].label}: ${count}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex gap-6">
              {[
                { label: "Decisiones pendientes", n: activeOp.decisiones.filter((d) => d.estado === "pendiente").length, c: "text-review" },
                { label: "Devoluciones", n: acts.reduce((s, a) => s + (a.returns ?? 0), 0), c: "text-warning" },
                { label: "Bloqueadas", n: acts.filter((a) => a.status === "bloqueada").length, c: "text-fg-muted" },
              ].map((m) => (
                <div key={m.label} className="flex flex-col">
                  <span className="t-help text-fg-muted">{m.label}</span>
                  <span className={cn("t-section tnum", m.c)}>{m.n}</span>
                </div>
              ))}
            </div>
          </div>
        }
      />

      <PageBody>
        {/* Selector de vistas principales del caso */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMainTab("workspace")}
              className={`px-3 py-1.5 rounded-control text-sm font-semibold inline-flex items-center gap-1.5 transition-colors ${
                mainTab === "workspace"
                  ? "bg-action text-fg-on-action shadow-sm"
                  : "text-fg-muted hv:text-fg hv:bg-muted"
              }`}
            >
              <Icon name="Workflow" size={15} />
              Seguimiento operacional (Mapa & Lista)
            </button>
            <button
              type="button"
              onClick={() => setMainTab("expediente")}
              className={`px-3 py-1.5 rounded-control text-sm font-semibold inline-flex items-center gap-1.5 transition-colors ${
                mainTab === "expediente"
                  ? "bg-action text-fg-on-action shadow-sm"
                  : "text-fg-muted hv:text-fg hv:bg-muted"
              }`}
            >
              <Icon name="FolderOpen" size={15} />
              Expediente de emisión
            </button>
          </div>

          <span className="t-help text-fg-muted hidden sm:inline-block">
            Versión del workflow: <strong className="font-mono text-fg">{activeOp.workflowVersion}</strong>
          </span>
        </div>

        {mainTab === "workspace" ? (
          <WorkspaceSeguimiento
            operacion={activeOp}
            selectedActId={selectedActId}
            onSelectActId={setSelectedActId}
            onUpdateActividadStatus={handleUpdateActividadStatus}
            onOpenDecisionModal={(act, kind) =>
              setDecisionModal({ open: true, actividad: act, initialKind: kind })
            }
          />
        ) : (
          <ExpedienteEmision
            operacion={activeOp}
            onOpenDecisionModal={(opts) =>
              setDecisionModal({
                open: true,
                evaluacion: opts?.evaluacion ?? null,
                initialKind: "aprobar",
              })
            }
            onValidateDoc={handleValidateDoc}
            onObserveDoc={handleObserveDoc}
            onGoToSeguimiento={() => setMainTab("workspace")}
          />
        )}
      </PageBody>

      {/* Modal de decisión humana */}
      <ModalDecision
        open={decisionModal.open}
        onClose={() => setDecisionModal({ open: false })}
        actividad={decisionModal.actividad}
        evaluacion={decisionModal.evaluacion}
        initialKind={decisionModal.initialKind}
        onConfirm={handleConfirmDecision}
      />

      {/* Modal de confirmación y certificado de emisión de póliza */}
      <ModalEmitirPoliza
        open={emitirModalOpen}
        onClose={() => setEmitirModalOpen(false)}
        operacion={activeOp}
        onConfirmEmitir={handleConfirmEmitirPoliza}
      />
    </>
  );
}
