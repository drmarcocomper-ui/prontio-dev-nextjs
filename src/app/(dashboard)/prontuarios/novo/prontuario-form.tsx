"use client";

import { useActionState, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { FieldError, FormError, INPUT_CLASS, ariaProps } from "@/components/form-utils";
import { criarProntuario, atualizarProntuario, type ProntuarioFormState } from "../actions";
import { type ProntuarioDefaults, TEXTO_MAX_LENGTH, TIPO_LABELS } from "../types";
import { todayLocal } from "@/lib/date";
import { PatientSearch } from "@/app/(dashboard)/agenda/novo/patient-search";
import { useFormDraft } from "@/hooks/use-form-draft";

interface AnamneseTemplate {
  id: string;
  nome: string;
  texto: string;
}

const TEMPLATES_KEY = "prontio_anamnese_templates";

function loadTemplates(): AnamneseTemplate[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates: AnamneseTemplate[]) {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    // ignore
  }
}

export function ProntuarioForm({
  defaults,
  cancelHref,
}: {
  defaults?: ProntuarioDefaults;
  cancelHref?: string;
}) {
  const isEditing = !!defaults?.id;
  const today = todayLocal();
  const tipoFromAgenda = !isEditing && defaults?.tipo;

  const action = isEditing ? atualizarProntuario : criarProntuario;

  const [state, formAction, isPending] = useActionState<ProntuarioFormState, FormData>(
    action,
    {}
  );

  const cancel = cancelHref ?? (isEditing ? `/prontuarios/${defaults?.id}` : "/prontuarios");

  const formRef = useRef<HTMLFormElement>(null);
  const evolucaoRef = useRef<HTMLTextAreaElement>(null);
  const draftId = isEditing ? `prontuario-edit-${defaults?.id}` : "prontuario-novo";
  const { restoreDraft, hasDraft, clearDraft } = useFormDraft(draftId, formRef);
  const [showDraftBanner, setShowDraftBanner] = useState(() => !isEditing && hasDraft());

  const [templates, setTemplates] = useState<AnamneseTemplate[]>(() => loadTemplates());
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const applyTemplate = useCallback((t: AnamneseTemplate) => {
    if (evolucaoRef.current) {
      evolucaoRef.current.value = t.texto;
      evolucaoRef.current.focus();
    }
  }, []);

  function handleSaveTemplate() {
    const texto = evolucaoRef.current?.value?.trim();
    if (!texto || !templateName.trim()) return;

    const newTemplate: AnamneseTemplate = {
      id: Date.now().toString(),
      nome: templateName.trim(),
      texto,
    };
    const updated = [...templates, newTemplate];
    saveTemplates(updated);
    setTemplates(updated);
    setShowSaveTemplate(false);
    setTemplateName("");
  }

  function handleDeleteTemplate(id: string) {
    const updated = templates.filter((t) => t.id !== id);
    saveTemplates(updated);
    setTemplates(updated);
  }

  function handleRestore() {
    restoreDraft();
    setShowDraftBanner(false);
  }

  function handleDiscard() {
    clearDraft();
    setShowDraftBanner(false);
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6" aria-busy={isPending}>
      {showDraftBanner && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>Existe um rascunho salvo. Deseja restaurá-lo?</span>
          <div className="flex gap-2">
            <button type="button" onClick={handleRestore} className="font-semibold text-amber-700 hover:text-amber-900">
              Restaurar
            </button>
            <button type="button" onClick={handleDiscard} className="text-amber-600 hover:text-amber-800">
              Descartar
            </button>
          </div>
        </div>
      )}
      {isEditing && <input type="hidden" name="id" value={defaults.id} />}

      <FormError message={state.error} />

      {/* Paciente e Data */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Paciente <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <PatientSearch
              defaultPatientId={defaults?.paciente_id}
              defaultPatientName={defaults?.paciente_nome}
            />
          </div>
          <FieldError id="paciente_id-error" message={state.fieldErrors?.paciente_id} />
        </div>

        <div>
          <label htmlFor="data" className="block text-sm font-medium text-gray-700">
            Data <span className="text-red-500">*</span>
          </label>
          <input
            id="data"
            name="data"
            type="date"
            required
            disabled={isPending}
            max={today}
            defaultValue={defaults?.data ?? today}
            className={INPUT_CLASS}
            {...ariaProps("data", state.fieldErrors?.data)}
          />
          <FieldError id="data-error" message={state.fieldErrors?.data} />
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
          Tipo
        </label>
        {tipoFromAgenda ? (
          <>
            <select id="tipo" disabled defaultValue={defaults.tipo!} className={INPUT_CLASS} aria-describedby="tipo-error">
              {Object.entries(TIPO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input type="hidden" name="tipo" value={defaults.tipo!} />
          </>
        ) : (
          <select id="tipo" name="tipo" defaultValue={defaults?.tipo ?? ""} disabled={isPending} className={INPUT_CLASS} {...ariaProps("tipo", state.fieldErrors?.tipo)}>
            <option value="">Selecione</option>
            {Object.entries(TIPO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
        <FieldError id="tipo-error" message={state.fieldErrors?.tipo} />
      </div>

      {/* Evolução */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="queixa_principal" className="block text-sm font-medium text-gray-700">
            Evolução <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowSaveTemplate(!showSaveTemplate)}
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            {showSaveTemplate ? "Cancelar" : "Salvar como template"}
          </button>
        </div>

        {showSaveTemplate && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              maxLength={50}
              placeholder="Nome do template..."
              className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              data-testid="template-name-input"
            />
            <button
              type="button"
              onClick={handleSaveTemplate}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
              data-testid="template-save-btn"
            >
              Salvar
            </button>
          </div>
        )}

        {templates.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5" data-testid="template-pills">
            {templates.map((t) => (
              <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                <button type="button" onClick={() => applyTemplate(t)} className="hover:text-primary-600">
                  {t.nome}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTemplate(t.id)}
                  className="text-gray-400 hover:text-red-500"
                  aria-label={`Remover template ${t.nome}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <textarea
          ref={evolucaoRef}
          id="queixa_principal"
          name="queixa_principal"
          rows={8}
          maxLength={TEXTO_MAX_LENGTH}
          disabled={isPending}
          placeholder="Registre a evolução clínica do atendimento..."
          defaultValue={defaults?.queixa_principal ?? ""}
          className={`${INPUT_CLASS} mt-1`}
          {...ariaProps("queixa_principal", state.fieldErrors?.queixa_principal)}
        />
        <FieldError id="queixa_principal-error" message={state.fieldErrors?.queixa_principal} />
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-gray-200 pt-6">
        <Link
          href={cancel}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 w-full sm:w-auto text-center"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50 w-full sm:w-auto"
        >
          {isPending && (
            <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {isEditing ? "Salvar alterações" : "Salvar prontuário"}
        </button>
      </div>
    </form>
  );
}
