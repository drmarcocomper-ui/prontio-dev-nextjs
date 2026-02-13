"use client";

import { useActionState, useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FieldError, FormError, INPUT_CLASS } from "@/components/form-utils";
import { criarReceita, atualizarReceita, type ReceitaFormState } from "../actions";
import { PatientSearch } from "@/app/(dashboard)/agenda/novo/patient-search";
import {
  type ReceitaDefaults,
  MEDICAMENTOS_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
  TIPO_LABELS,
} from "../types";

interface Template {
  id: string;
  nome: string;
  medicamentos: string;
}

const TEMPLATES_KEY = "prontio_receita_templates";

function loadTemplates(): Template[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates: Template[]) {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    // ignore
  }
}

export function ReceitaForm({
  defaults,
  cancelHref,
}: {
  defaults?: ReceitaDefaults;
  cancelHref?: string;
}) {
  const isEditing = !!defaults?.id;
  const today = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; })();

  const action = isEditing ? atualizarReceita : criarReceita;

  const [state, formAction, isPending] = useActionState<ReceitaFormState, FormData>(
    action,
    {}
  );

  const cancel = cancelHref ?? (isEditing ? `/receitas/${defaults?.id}` : "/receitas");
  const medRef = useRef<HTMLTextAreaElement>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  const applyTemplate = useCallback((t: Template) => {
    if (medRef.current) {
      medRef.current.value = t.medicamentos;
      medRef.current.focus();
    }
  }, []);

  function handleSaveTemplate() {
    const med = medRef.current?.value?.trim();
    if (!med || !templateName.trim()) return;

    const newTemplate: Template = {
      id: Date.now().toString(),
      nome: templateName.trim(),
      medicamentos: med,
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

  return (
    <form action={formAction} className="space-y-6" aria-busy={isPending}>
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
          <FieldError message={state.fieldErrors?.paciente_id} />
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
          />
          <FieldError message={state.fieldErrors?.data} />
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
          Tipo da receita <span className="text-red-500">*</span>
        </label>
        <select id="tipo" name="tipo" required disabled={isPending} defaultValue={defaults?.tipo ?? ""} className={INPUT_CLASS}>
          <option value="">Selecione</option>
          {Object.entries(TIPO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.tipo} />
      </div>

      {/* Medicamentos */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="medicamentos" className="block text-sm font-medium text-gray-700">
            Medicamentos <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {templates.length > 0 && (
              <select
                onChange={(e) => {
                  const t = templates.find((t) => t.id === e.target.value);
                  if (t) applyTemplate(t);
                  e.target.value = "";
                }}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 shadow-sm"
                aria-label="Usar template"
                defaultValue=""
              >
                <option value="" disabled>Usar template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => setShowSaveTemplate(!showSaveTemplate)}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              {showSaveTemplate ? "Cancelar" : "Salvar como template"}
            </button>
          </div>
        </div>

        {showSaveTemplate && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nome do template..."
              className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={handleSaveTemplate}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
            >
              Salvar
            </button>
          </div>
        )}

        {templates.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
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
          ref={medRef}
          id="medicamentos"
          name="medicamentos"
          rows={8}
          required
          disabled={isPending}
          maxLength={MEDICAMENTOS_MAX_LENGTH}
          placeholder="Liste os medicamentos, dosagens e posologias..."
          defaultValue={defaults?.medicamentos ?? ""}
          className={`${INPUT_CLASS} mt-1`}
        />
        <FieldError message={state.fieldErrors?.medicamentos} />
      </div>

      {/* Observações */}
      <div>
        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={2}
          disabled={isPending}
          maxLength={OBSERVACOES_MAX_LENGTH}
          defaultValue={defaults?.observacoes ?? ""}
          className={INPUT_CLASS}
        />
        <FieldError message={state.fieldErrors?.observacoes} />
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
          {isEditing ? "Salvar alterações" : "Salvar receita"}
        </button>
      </div>
    </form>
  );
}
