"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, dataNaoFutura, valorPermitido, uuidValido } from "@/lib/validators";
import { MEDICAMENTOS_MAX_LENGTH, OBSERVACOES_MAX_LENGTH, TIPO_LABELS } from "./types";
import { getMedicoId } from "@/lib/clinica";

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
  valorPermitido(fieldErrors, "tipo", tipo, Object.keys(TIPO_LABELS));
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
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return { error: "Não foi possível identificar o médico responsável." };
  }

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("id")
    .eq("id", fields.paciente_id)
    .eq("medico_id", medicoId)
    .single();

  if (!paciente) {
    return { fieldErrors: { paciente_id: "Paciente não encontrado." } };
  }

  const { data: inserted, error } = await supabase
    .from("receitas")
    .insert({
      paciente_id: fields.paciente_id,
      medico_id: medicoId,
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
  revalidatePath("/");
  redirect(`/receitas/${inserted.id}?success=Receita+registrada`);
}

export async function atualizarReceita(
  _prev: ReceitaFormState,
  formData: FormData
): Promise<ReceitaFormState> {
  const id = formData.get("id") as string;
  if (!uuidValido(id)) {
    return { error: "ID inválido." };
  }

  const { fieldErrors, ...fields } = validarCamposReceita(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    return { error: "Não foi possível identificar o médico responsável." };
  }

  const { data: paciente } = await supabase
    .from("pacientes")
    .select("id")
    .eq("id", fields.paciente_id)
    .eq("medico_id", medicoId)
    .single();

  if (!paciente) {
    return { fieldErrors: { paciente_id: "Paciente não encontrado." } };
  }

  const { error } = await supabase
    .from("receitas")
    .update({
      paciente_id: fields.paciente_id,
      data: fields.data,
      tipo: fields.tipo,
      medicamentos: fields.medicamentos,
      observacoes: fields.observacoes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("medico_id", medicoId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "receita") };
  }

  revalidatePath("/receitas");
  revalidatePath("/");
  redirect(`/receitas/${id}?success=Receita+atualizada`);
}

export async function excluirReceita(id: string): Promise<void> {
  if (!uuidValido(id)) {
    throw new Error("ID inválido.");
  }

  const supabase = await createClient();
  const medicoId = await getMedicoId();

  // Buscar paciente_id antes de deletar para redirecionar corretamente
  const { data: receita } = await supabase
    .from("receitas")
    .select("paciente_id")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();

  const pacienteId = receita?.paciente_id;

  const { error } = await supabase.from("receitas").delete().eq("id", id).eq("medico_id", medicoId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "receita"));
  }

  revalidatePath("/receitas");
  revalidatePath("/");
  if (pacienteId) {
    revalidatePath(`/pacientes/${pacienteId}`);
    redirect(`/pacientes/${pacienteId}?success=Receita+exclu%C3%ADda`);
  }
  redirect("/receitas?success=Receita+exclu%C3%ADda");
}
