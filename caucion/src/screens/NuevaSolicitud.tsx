import React, { useEffect, useRef, useState } from "react";
import { Modal } from "../components/ui/overlays";
import { Button, Field, Input, Select, Combobox, DatePicker, Radio, Textarea, FileUpload, Checkbox } from "../components/ui/controls";
import { InlineAlert, Tabs } from "../components/ui/data";
import { TOMADORES, ASEGURADOS, TIPOS, CANALES, CURRENT_USER, type Solicitud } from "../data/mock";
import { cn } from "../lib/cn";
import { Icon } from "../lib/icon";

interface FormState {
  tomador: string | null; beneficiario: string | null; tipo: string; canal: string; moneda: "PEN" | "USD";
  monto: string; desde: string; hasta: string; proceso: string; objeto: string; confirm: boolean;
}
const EMPTY: FormState = { tomador: null, beneficiario: null, tipo: "", canal: "Directo", moneda: "PEN", monto: "", desde: "", hasta: "", proceso: "", objeto: "", confirm: false };
type Errors = Partial<Record<keyof FormState, string>>;

const SECTIONS = [
  { id: "sec-partes", label: "Participantes", fields: ["tomador", "beneficiario"] },
  { id: "sec-caucion", label: "Caución solicitada", fields: ["tipo", "canal", "monto", "desde", "hasta"] },
  { id: "sec-contrato", label: "Contrato subyacente", fields: ["proceso", "objeto"] },
  { id: "sec-docs", label: "Documentos", fields: [] },
];
const FIELD_LABEL: Record<string, string> = {
  tomador: "Tomador", beneficiario: "Beneficiario", tipo: "Tipo de caución", monto: "Suma asegurada", desde: "Inicio de vigencia", hasta: "Fin de vigencia", proceso: "N.º de proceso o contrato", objeto: "Objeto del contrato", confirm: "Declaración",
};

function parseAmount(s: string) { const n = Number(s.replace(/,/g, "")); return isFinite(n) ? n : NaN; }

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.tomador) e.tomador = "Selecciona el tomador de la caución.";
  if (!f.beneficiario) e.beneficiario = "Selecciona la entidad beneficiaria.";
  if (f.tomador && f.beneficiario && f.tomador === f.beneficiario) e.beneficiario = "El beneficiario debe ser distinto del tomador.";
  if (!f.tipo) e.tipo = "Elige el tipo de caución.";
  const m = parseAmount(f.monto);
  if (!f.monto) e.monto = "Ingresa la suma asegurada.";
  else if (isNaN(m) || m <= 0) e.monto = "Usa sólo números, con punto para decimales. Ej.: 1250000.00";
  if (!f.desde) e.desde = "Indica la fecha de inicio (dd/mm/aaaa).";
  if (!f.hasta) e.hasta = "Indica la fecha de fin (dd/mm/aaaa).";
  else if (f.desde && f.hasta <= f.desde) e.hasta = "La fecha de fin debe ser posterior al inicio.";
  if (!f.proceso.trim()) e.proceso = "Ingresa la referencia del contrato o proceso.";
  if (!f.confirm) e.confirm = "Confirma la declaración para registrar la solicitud.";
  return e;
}

export function NuevaSolicitudModal({ open, onClose, onCreate, nextId }: { open: boolean; onClose: () => void; onCreate: (s: Solicitud, draft: boolean) => void; nextId: string }) {
  const [f, setF] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);
  const [section, setSection] = useState("sec-partes");
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) { setF(EMPTY); setErrors({}); setSubmitted(false); setBusy(null); setSection("sec-partes"); } }, [open]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    const nf = { ...f, [k]: v };
    setF(nf);
    if (submitted) setErrors(validate(nf));
  };
  const go = (id: string) => { setSection(id); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const focusField = (k: string) => {
    const sec = SECTIONS.find((s) => s.fields.includes(k));
    if (sec) go(sec.id);
    setTimeout(() => document.getElementById(`ns-${k}`)?.focus(), 250);
  };

  const build = (status: Solicitud["status"]): Solicitud => ({
    id: nextId, tomadorId: f.tomador ?? "t01", aseguradoId: f.beneficiario ?? "a1", tipo: (f.tipo || TIPOS[0]) as any, currency: f.moneda,
    monto: parseAmount(f.monto) || 0, vigenciaDesde: f.desde || "2026-11-01", vigenciaHasta: f.hasta || "2027-10-31", status, ownerId: CURRENT_USER.id,
    canal: f.canal as any, creada: "2026-10-15", actualizada: "2026-10-15T11:30:00", vence: "2026-10-20", prioridad: "normal",
  });

  const submit = async () => {
    const e = validate(f);
    setErrors(e); setSubmitted(true);
    if (Object.keys(e).length) { body.current?.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setBusy("submit");
    await new Promise((r) => setTimeout(r, 900));
    onCreate(build("recibida"), false);
    onClose();
  };
  const saveDraft = async () => {
    if (!f.tomador) { setErrors({ tomador: "Para guardar un borrador basta con el tomador." }); setSubmitted(true); focusField("tomador"); return; }
    setBusy("draft");
    await new Promise((r) => setTimeout(r, 600));
    onCreate(build("borrador"), true);
    onClose();
  };

  const errList = Object.entries(errors).filter(([, v]) => v);
  const secHasError = (id: string) => SECTIONS.find((s) => s.id === id)!.fields.some((k) => (errors as any)[k]);
  const plazo = f.desde && f.hasta && f.hasta > f.desde ? Math.round((new Date(f.hasta).getTime() - new Date(f.desde).getTime()) / 86400000) : null;

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Nueva solicitud de caución"
      description={`Se registrará como ${nextId}. Los campos con * son obligatorios para enviar; un borrador puede guardarse incompleto.`}
      footer={<>
        <span className="mr-auto t-help text-fg-muted hidden lg:inline">Datos ficticios · no se envía información</span>
        <Button variant="secondary" onClick={onClose} disabled={!!busy} className="max-sm:hidden">Cancelar</Button>
        <Button variant="secondary" icon="Save" loading={busy === "draft"} disabled={!!busy && busy !== "draft"} onClick={saveDraft}>Guardar borrador</Button>
        <Button variant="primary" icon="Send" loading={busy === "submit"} disabled={!!busy && busy !== "submit"} onClick={submit}>Registrar solicitud</Button>
      </>}>
      <div className="flex gap-6 -mx-5 -my-4 max-sm:my-0">
        {/* Índice de secciones: navegación libre, no un wizard */}
        <nav aria-label="Secciones del formulario" className="hidden md:flex flex-col gap-0.5 w-[200px] shrink-0 border-r border-line py-4 pl-3 pr-2 bg-subtle">
          <p className="t-module text-fg-muted px-2 mb-1.5">Secciones</p>
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => go(s.id)} aria-current={section === s.id ? "true" : undefined}
              className={cn("h-8 px-2 rounded-control flex items-center gap-2 t-label text-left", section === s.id ? "bg-surface shadow-card text-fg" : "text-fg-muted hv:text-fg hv:bg-muted")}>
              <span className="flex-1">{s.label}</span>
              {secHasError(s.id) && <Icon name="CircleAlert" size={14} className="text-danger" label="Con errores" />}
            </button>
          ))}
        </nav>

        <div ref={body} className="flex-1 min-w-0 py-4 pr-5 pl-5 md:pl-0 flex flex-col gap-6 max-h-[62vh] max-sm:max-h-none overflow-auto max-sm:overflow-visible">
          {errList.length > 0 && (
            <InlineAlert tone="danger" title={`Revisa ${errList.length} ${errList.length === 1 ? "campo" : "campos"} antes de registrar`}>
              <ul className="mt-1 flex flex-col gap-0.5">
                {errList.map(([k, v]) => (
                  <li key={k}><button className="text-left underline underline-offset-2 hv:no-underline" onClick={() => focusField(k)}>{FIELD_LABEL[k]}</button>: <span className="text-fg-muted">{v}</span></li>
                ))}
              </ul>
            </InlineAlert>
          )}

          <fieldset id="sec-partes" className="flex flex-col gap-4 scroll-mt-2">
            <legend className="t-section mb-3 float-left w-full">Participantes</legend>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 clear-both">
              <Field label="Tomador" htmlFor="ns-tomador" required error={errors.tomador} help="Empresa o consorcio que contrata la caución.">
                <Combobox id="ns-tomador" options={TOMADORES.map((t) => ({ value: t.id, label: t.name, meta: t.doc + (t.group ? ` · ${t.group}` : "") }))} value={f.tomador} onChange={(v) => set("tomador", v)} status={errors.tomador ? "error" : "default"} placeholder="Buscar por nombre o ID" />
              </Field>
              <Field label="Beneficiario (asegurado)" htmlFor="ns-beneficiario" required error={errors.beneficiario} help="Entidad a favor de quien se emite.">
                <Combobox id="ns-beneficiario" options={ASEGURADOS.map((t) => ({ value: t.id, label: t.name, meta: t.doc }))} value={f.beneficiario} onChange={(v) => set("beneficiario", v)} status={errors.beneficiario ? "error" : "default"} placeholder="Buscar entidad" />
              </Field>
            </div>
          </fieldset>

          <fieldset id="sec-caucion" className="flex flex-col gap-4 scroll-mt-2 pt-5 border-t border-line">
            <legend className="t-section mb-3 float-left w-full">Caución solicitada</legend>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 clear-both">
              <Field label="Tipo de caución" htmlFor="ns-tipo" required error={errors.tipo}>
                <Select id="ns-tipo" value={f.tipo} onChange={(e) => set("tipo", e.target.value)} placeholder="Selecciona…" options={TIPOS.map((t) => ({ value: t, label: t }))} status={errors.tipo ? "error" : "default"} />
              </Field>
              <Field label="Canal de ingreso">
                <div role="radiogroup" aria-label="Canal de ingreso" className="flex flex-wrap gap-x-5 gap-y-1 h-8 items-center">
                  {CANALES.map((c) => <Radio key={c} name="ns-canal" label={c} checked={f.canal === c} onChange={() => set("canal", c)} />)}
                </div>
              </Field>
              <Field label="Suma asegurada" htmlFor="ns-monto" required error={errors.monto} help="Importe máximo garantizado. Se muestra con 2 decimales.">
                <div className="flex gap-2">
                  <Tabs variant="segmented" ariaLabel="Moneda" value={f.moneda} onChange={(v) => set("moneda", v as any)} tabs={[{ id: "PEN", label: "PEN" }, { id: "USD", label: "USD" }]} />
                  <Input id="ns-monto" numeric prefix={f.moneda === "PEN" ? "S/" : "US$"} value={f.monto} inputMode="decimal" placeholder="0.00" className="flex-1"
                    status={errors.monto ? "error" : "default"} aria-describedby="ns-monto-msg"
                    onChange={(e) => set("monto", e.target.value.replace(/[^\d.,]/g, ""))}
                    onBlur={() => { const n = parseAmount(f.monto); if (!isNaN(n) && f.monto) set("monto", n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); }} />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Inicio de vigencia" htmlFor="ns-desde" required error={errors.desde}>
                  <DatePicker id="ns-desde" value={f.desde} onChange={(v) => set("desde", v)} status={errors.desde ? "error" : "default"} min="2026-10-15" />
                </Field>
                <Field label="Fin de vigencia" htmlFor="ns-hasta" required error={errors.hasta} success={plazo ? `Plazo: ${plazo} días` : undefined}>
                  <DatePicker id="ns-hasta" value={f.hasta} onChange={(v) => set("hasta", v)} status={errors.hasta ? "error" : plazo ? "success" : "default"} min={f.desde || "2026-10-15"} />
                </Field>
              </div>
            </div>
          </fieldset>

          <fieldset id="sec-contrato" className="flex flex-col gap-4 scroll-mt-2 pt-5 border-t border-line">
            <legend className="t-section mb-3 float-left w-full">Contrato subyacente</legend>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 clear-both">
              <Field label="N.º de proceso o contrato" htmlFor="ns-proceso" required error={errors.proceso}>
                <Input id="ns-proceso" value={f.proceso} onChange={(e) => set("proceso", e.target.value)} placeholder="Ej.: LP-DEMO-0042-2026" status={errors.proceso ? "error" : "default"} className="t-ref" />
              </Field>
              <div className="hidden lg:block" />
              <Field label="Objeto del contrato" htmlFor="ns-objeto" optional className="lg:col-span-2" help="Descripción breve de la obligación garantizada.">
                <Textarea id="ns-objeto" value={f.objeto} maxLength={400} showCount onChange={(e) => set("objeto", e.target.value)} placeholder="Ej.: Ejecución de obra de mejoramiento vial (ficticio)" />
              </Field>
            </div>
          </fieldset>

          <fieldset id="sec-docs" className="flex flex-col gap-3 scroll-mt-2 pt-5 border-t border-line">
            <legend className="t-section mb-3 float-left w-full">Documentos <span className="t-help text-fg-muted font-normal">(opcional en el registro)</span></legend>
            <div className="clear-both flex flex-col gap-3">
              <FileUpload compact />
              <Checkbox id="ns-confirm" checked={f.confirm} invalid={!!errors.confirm} onChange={(e) => set("confirm", e.target.checked)}
                label="Confirmo que la información registrada corresponde a la solicitud recibida."
                description={errors.confirm ? undefined : "Texto de declaración ilustrativo; su redacción la define el área legal."} />
              {errors.confirm && <p className="t-help text-danger -mt-1 pl-6">{errors.confirm}</p>}
            </div>
          </fieldset>
        </div>
      </div>
    </Modal>
  );
}
