"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { INPUT_CLASS, FieldError, FormError } from "@/components/form-utils";
import { maskPhone } from "@/lib/masks";
import { CONVENIO_LABELS } from "@/app/(dashboard)/pacientes/types";
import { criarPacienteRapido } from "@/app/(dashboard)/pacientes/actions";

interface QuickPatientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string, nome: string) => void;
  defaultNome: string;
}

export function QuickPatientModal({
  open,
  onClose,
  onCreated,
  defaultNome,
}: QuickPatientModalProps) {
  const [nome, setNome] = useState(defaultNome);
  const [telefone, setTelefone] = useState("");
  const [convenio, setConvenio] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const nomeRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setNome(defaultNome);
      setTelefone("");
      setConvenio("");
      setError("");
      setFieldErrors({});
    }
  }, [open, defaultNome]);

  useEffect(() => {
    if (!open) return;

    nomeRef.current?.focus();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const modal = modalRef.current;
      if (!modal) return;
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await criarPacienteRapido({ nome, telefone, convenio });
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        setError("");
      } else if (result.error) {
        setError(result.error);
        setFieldErrors({});
      } else if (result.id) {
        onCreated(result.id, result.nome);
      }
    });
  }

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-patient-modal-title"
    >
      <div
        ref={modalRef}
        className="mx-4 w-full max-w-md animate-scale-in rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="quick-patient-modal-title" className="text-lg font-semibold text-gray-900">
          Cadastro rápido de paciente
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Preencha os dados básicos para continuar o agendamento.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <FormError message={error} />

          <div>
            <label htmlFor="quick-nome" className="block text-sm font-medium text-gray-700">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              ref={nomeRef}
              id="quick-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={255}
              className={INPUT_CLASS}
            />
            <FieldError message={fieldErrors.nome} />
          </div>

          <div>
            <label htmlFor="quick-telefone" className="block text-sm font-medium text-gray-700">
              Telefone
            </label>
            <input
              id="quick-telefone"
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              className={INPUT_CLASS}
            />
            <FieldError message={fieldErrors.telefone} />
          </div>

          <div>
            <label htmlFor="quick-convenio" className="block text-sm font-medium text-gray-700">
              Convênio
            </label>
            <select
              id="quick-convenio"
              value={convenio}
              onChange={(e) => setConvenio(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Selecione...</option>
              {Object.entries(CONVENIO_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <FieldError message={fieldErrors.convenio} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {isPending && (
                <div aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
