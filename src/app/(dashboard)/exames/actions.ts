"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, dataNaoFutura, valorPermitido, uuidValido } from "@/lib/validators";
import { EXAMES_MAX_LENGTH, INDICACAO_MAX_LENGTH, OBSERVACOES_MAX_LENGTH, TIPO_LABELS } from "./types";
import { getMedicoId } from "@/lib/clinica";

export type ExameFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validarCamposExame(formData: FormData) {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const data = formData.get("data") as string;
  const tipo = (formData.get("tipo") as string) || null;
  const exames = (formData.get("exames") as string)?.trim() || null;
  const indicacao_clinica = (formData.get("indicacao_clinica") as string)?.trim() || null;
  const operadora = (formData.get("operadora") as string)?.trim() || null;
  const numero_carteirinha = (formData.get("numero_carteirinha") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  campoObrigatorio(fieldErrors, "paciente_id", paciente_id, "Selecione um paciente.");

  if (campoObrigatorio(fieldErrors, "data", data, "Data é obrigatória.")) {
    dataNaoFutura(fieldErrors, "data", data);
  }

  campoObrigatorio(fieldErrors, "tipo", tipo, "Selecione o tipo da solicitação.");
  valorPermitido(fieldErrors, "tipo", tipo, Object.keys(TIPO_LABELS));
  campoObrigatorio(fieldErrors, "exames", exames, "Exames é obrigatório.");
  tamanhoMaximo(fieldErrors, "exames", exames, EXAMES_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "indicacao_clinica", indicacao_clinica, INDICACAO_MAX_LENGTH);
  tamanhoMaximo(fieldErrors, "observacoes", observacoes, OBSERVACOES_MAX_LENGTH);

  if (tipo === "convenio") {
    campoObrigatorio(fieldErrors, "operadora", operadora, "Operadora é obrigatória para convênio.");
  }

  return { paciente_id, data, tipo, exames, indicacao_clinica, operadora, numero_carteirinha, observacoes, fieldErrors };
}

export async function criarExame(
  _prev: ExameFormState,
  formData: FormData
): Promise<ExameFormState> {
  const { fieldErrors, ...fields } = validarCamposExame(formData);

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
    .from("solicitacoes_exames")
    .insert({
      paciente_id: fields.paciente_id,
      medico_id: medicoId,
      data: fields.data,
      tipo: fields.tipo,
      exames: fields.exames,
      indicacao_clinica: fields.indicacao_clinica,
      operadora: fields.operadora,
      numero_carteirinha: fields.numero_carteirinha,
      observacoes: fields.observacoes,
    })
    .select("id")
    .single();

  if (error) {
    return { error: tratarErroSupabase(error, "criar", "solicitação de exame") };
  }

  revalidatePath("/exames");
  revalidatePath("/");
  redirect(`/exames/${inserted.id}?success=Solicitação+registrada`);
}

export async function atualizarExame(
  _prev: ExameFormState,
  formData: FormData
): Promise<ExameFormState> {
  const id = formData.get("id") as string;
  if (!uuidValido(id)) {
    return { error: "ID inválido." };
  }

  const { fieldErrors, ...fields } = validarCamposExame(formData);

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
    .from("solicitacoes_exames")
    .update({
      paciente_id: fields.paciente_id,
      data: fields.data,
      tipo: fields.tipo,
      exames: fields.exames,
      indicacao_clinica: fields.indicacao_clinica,
      operadora: fields.operadora,
      numero_carteirinha: fields.numero_carteirinha,
      observacoes: fields.observacoes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("medico_id", medicoId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "solicitação de exame") };
  }

  revalidatePath("/exames");
  revalidatePath("/");
  redirect(`/exames/${id}?success=Solicitação+atualizada`);
}

export async function excluirExame(id: string): Promise<void> {
  if (!uuidValido(id)) {
    throw new Error("ID inválido.");
  }

  const supabase = await createClient();
  const medicoId = await getMedicoId();

  const { data: exame } = await supabase
    .from("solicitacoes_exames")
    .select("paciente_id")
    .eq("id", id)
    .eq("medico_id", medicoId)
    .single();

  const pacienteId = exame?.paciente_id;

  const { error } = await supabase.from("solicitacoes_exames").delete().eq("id", id).eq("medico_id", medicoId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "solicitação de exame"));
  }

  revalidatePath("/exames");
  revalidatePath("/");
  if (pacienteId) {
    revalidatePath(`/pacientes/${pacienteId}`);
    redirect(`/pacientes/${pacienteId}?success=Solicitação+exclu%C3%ADda`);
  }
  redirect("/exames?success=Solicitação+exclu%C3%ADda");
}
