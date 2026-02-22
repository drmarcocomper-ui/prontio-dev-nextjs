"use client";

import { useActionState, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { FieldError, FormError, INPUT_CLASS, ariaProps } from "@/components/form-utils";
import { criarProntuario, atualizarProntuario, type ProntuarioFormState } from "../actions";
import { type ProntuarioDefaults, TEXTO_MAX_LENGTH, TIPO_LABELS } from "../types";
import { todayLocal } from "@/lib/date";
import { PatientSearch } from "@/app/(dashboard)/agenda/novo/patient-search";
import { useFormDraft } from "@/hooks/use-form-draft";

import type { AnamneseTemplate } from "./anamnese-seeds";

function getTemplatesKey(userId?: string) {
  return userId ? `prontio_anamnese_templates_${userId}` : "prontio_anamnese_templates";
}

function getSeededKey(userId?: string) {
  return userId ? `prontio_anamnese_seeded_${userId}` : "prontio_anamnese_seeded";
}

function loadTemplates(key: string): AnamneseTemplate[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTemplates(key: string, templates: AnamneseTemplate[]) {
  try {
    localStorage.setItem(key, JSON.stringify(templates));
  } catch {
    // ignore
  }
}

export function ProntuarioForm({
  defaults,
  cancelHref,
  userId,
  seedTemplates,
}: {
  defaults?: ProntuarioDefaults;
  cancelHref?: string;
  userId?: string;
  seedTemplates?: AnamneseTemplate[];
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

  const templatesKey = getTemplatesKey(userId);
  const seededKey = getSeededKey(userId);

  const [templates, setTemplates] = useState<AnamneseTemplate[]>(() => {
    const existing = loadTemplates(templatesKey);
    if (existing.length > 0) return existing;

    if (seedTemplates && seedTemplates.length > 0) {
      try {
        const alreadySeeded = localStorage.getItem(seededKey);
        if (!alreadySeeded) {
          saveTemplates(templatesKey, seedTemplates);
          localStorage.setItem(seededKey, "1");
          return seedTemplates;
        }
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showManageTemplates, setShowManageTemplates] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTexto, setEditTexto] = useState("");

  const applyTemplate = useCallback((t: AnamneseTemplate) => {
    if (evolucaoRef.current) {
      const current = evolucaoRef.current.value;
      evolucaoRef.current.value = current
        ? `${current}\n${t.texto}`
        : t.texto;
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
    saveTemplates(templatesKey, updated);
    setTemplates(updated);
    setShowSaveTemplate(false);
    setTemplateName("");
  }

  function handleDeleteTemplate(id: string) {
    const updated = templates.filter((t) => t.id !== id);
    saveTemplates(templatesKey, updated);
    setTemplates(updated);
  }

  function handleStartEdit(t: AnamneseTemplate) {
    setEditingTemplateId(t.id);
    setEditName(t.nome);
    setEditTexto(t.texto);
  }

  function handleSaveEdit() {
    if (!editingTemplateId || !editName.trim() || !editTexto.trim()) return;
    const updated = templates.map((t) =>
      t.id === editingTemplateId ? { ...t, nome: editName.trim(), texto: editTexto.trim() } : t
    );
    saveTemplates(templatesKey, updated);
    setTemplates(updated);
    setEditingTemplateId(null);
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
          <div className="mt-2 flex items-center gap-2">
            <select
              data-testid="template-select"
              className={INPUT_CLASS}
              value=""
              onChange={(e) => {
                const t = templates.find((tpl) => tpl.id === e.target.value);
                if (t) applyTemplate(t);
                e.target.value = "";
              }}
            >
              <option value="">Selecione um template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowManageTemplates(!showManageTemplates)}
              className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              data-testid="manage-templates-btn"
            >
              Gerenciar
            </button>
          </div>
        )}

        {showManageTemplates && templates.length > 0 && (
          <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3" data-testid="manage-templates-list">
            <ul className="space-y-2">
              {templates.map((t) => (
                <li key={t.id}>
                  {editingTemplateId === t.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={50}
                        placeholder="Nome do template"
                        className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        data-testid={`edit-name-${t.id}`}
                      />
                      <textarea
                        value={editTexto}
                        onChange={(e) => setEditTexto(e.target.value)}
                        rows={3}
                        placeholder="Texto do template"
                        className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        data-testid={`edit-texto-${t.id}`}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                          data-testid={`edit-save-${t.id}`}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTemplateId(null)}
                          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{t.nome}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(t)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                          aria-label={`Editar template ${t.nome}`}
                          data-testid={`edit-btn-${t.id}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(t.id)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          aria-label={`Remover template ${t.nome}`}
                          data-testid={`delete-btn-${t.id}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
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
