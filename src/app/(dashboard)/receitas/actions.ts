"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MEDICAMENTOS_MAX_LENGTH, OBSERVACOES_MAX_LENGTH } from "./types";

export type ReceitaFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validarCamposReceita(formData: FormData) {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = formData.get("data") as string;
  const tipo = (formData.get("tipo") as string) || null;
  const medicamentos = (formData.get("medicamentos") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (!paciente_id) fieldErrors.paciente_id = "Selecione um paciente.";

  if (!data) {
    fieldErrors.data = "Data é obrigatória.";
  } else {
    const today = new Date().toISOString().split("T")[0];
    if (data > today) {
      fieldErrors.data = "A data não pode ser no futuro.";
    }
  }

  if (!tipo) fieldErrors.tipo = "Selecione o tipo da receita.";

  if (!medicamentos) {
    fieldErrors.medicamentos = "Medicamentos é obrigatório.";
  } else if (medicamentos.length > MEDICAMENTOS_MAX_LENGTH) {
    fieldErrors.medicamentos = `Máximo de ${MEDICAMENTOS_MAX_LENGTH} caracteres.`;
  }

  if (observacoes && observacoes.length > OBSERVACOES_MAX_LENGTH) {
    fieldErrors.observacoes = `Máximo de ${OBSERVACOES_MAX_LENGTH} caracteres.`;
  }

  return { paciente_id, data, tipo, medicamentos, observacoes, fieldErrors };
}

export async function criarReceita(
  _prev: ReceitaFormState,
  formData: FormData
): Promise<ReceitaFormState> {
  const { fieldErrors, ...fields } = validarCamposReceita(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { data: inserted, error } = await supabase
    .from("receitas")
    .insert({
      paciente_id: fields.paciente_id,
      data: fields.data,
      tipo: fields.tipo,
      medicamentos: fields.medicamentos,
      observacoes: fields.observacoes,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Erro ao salvar receita. Tente novamente." };
  }

  redirect(`/receitas/${inserted.id}?success=Receita+registrada`);
}

export async function atualizarReceita(
  _prev: ReceitaFormState,
  formData: FormData
): Promise<ReceitaFormState> {
  const id = formData.get("id") as string;
  const { fieldErrors, ...fields } = validarCamposReceita(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("receitas")
    .update({
      paciente_id: fields.paciente_id,
      data: fields.data,
      tipo: fields.tipo,
      medicamentos: fields.medicamentos,
      observacoes: fields.observacoes,
    })
    .eq("id", id);

  if (error) {
    return { error: "Erro ao atualizar receita. Tente novamente." };
  }

  redirect(`/receitas/${id}?success=Receita+atualizada`);
}

export async function excluirReceita(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("receitas").delete().eq("id", id);

  if (error) {
    throw new Error("Erro ao excluir receita.");
  }

  redirect("/receitas?success=Receita+exclu%C3%ADda");
}
