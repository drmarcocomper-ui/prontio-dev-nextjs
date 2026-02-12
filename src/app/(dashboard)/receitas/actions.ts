"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, dataNaoFutura } from "@/lib/validators";
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

  campoObrigatorio(fieldErrors, "paciente_id", paciente_id, "Selecione um paciente.");

  if (campoObrigatorio(fieldErrors, "data", data, "Data é obrigatória.")) {
    dataNaoFutura(fieldErrors, "data", data);
  }

  campoObrigatorio(fieldErrors, "tipo", tipo, "Selecione o tipo da receita.");
  campoObrigatorio(fieldErrors, "medicamentos", medicamentos, "Medicamentos é obrigatório.");
  tamanhoMaximo(fieldErrors, "medicamentos", medicamentos, MEDICAMENTOS_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "observacoes", observacoes, OBSERVACOES_MAX_LENGTH);

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
    return { error: tratarErroSupabase(error, "criar", "receita") };
  }

  revalidatePath("/receitas");
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
    return { error: tratarErroSupabase(error, "atualizar", "receita") };
  }

  revalidatePath("/receitas");
  redirect(`/receitas/${id}?success=Receita+atualizada`);
}

export async function excluirReceita(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("receitas").delete().eq("id", id);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "receita"));
  }

  revalidatePath("/receitas");
  redirect("/receitas?success=Receita+exclu%C3%ADda");
}
