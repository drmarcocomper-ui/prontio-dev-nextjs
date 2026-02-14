"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { campoObrigatorio, tamanhoMaximo, valorPermitido, uuidValido } from "@/lib/validators";
import { DESCRICAO_MAX_LENGTH, OBSERVACOES_MAX_LENGTH, VALOR_MAX, PAGAMENTO_LABELS, STATUS_LABELS } from "./constants";
import { getClinicaAtual, getMedicoId } from "@/lib/clinica";

export type TransacaoFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validarCamposTransacao(formData: FormData) {
  const tipo = formData.get("tipo") as string;
  const categoria = (formData.get("categoria") as string) || null;
  const descricao = (formData.get("descricao") as string)?.trim();
  const valorRaw = (formData.get("valor") as string)?.replace(/\./g, "").replace(",", ".");
  const valor = parseFloat(valorRaw);
  const data = formData.get("data") as string;
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const forma_pagamento = (formData.get("forma_pagamento") as string) || null;
  const status = (formData.get("status") as string) || "pago";
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  campoObrigatorio(fieldErrors, "tipo", tipo, "Selecione o tipo.");
  valorPermitido(fieldErrors, "tipo", tipo, ["receita", "despesa"]);
  campoObrigatorio(fieldErrors, "descricao", descricao, "Descrição é obrigatória.");
  tamanhoMaximo(fieldErrors, "descricao", descricao, DESCRICAO_MAX_LENGTH);

  if (!valorRaw || isNaN(valor) || valor <= 0) {
    fieldErrors.valor = "Informe um valor válido.";
  } else if (valor > VALOR_MAX) {
    fieldErrors.valor = `Valor máximo é R$ ${VALOR_MAX.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`;
  }
  campoObrigatorio(fieldErrors, "data", data, "Data é obrigatória.");
  if (paciente_id && !uuidValido(paciente_id)) {
    fieldErrors.paciente_id = "Paciente inválido.";
  }
  valorPermitido(fieldErrors, "forma_pagamento", forma_pagamento, Object.keys(PAGAMENTO_LABELS));
  valorPermitido(fieldErrors, "status", status, Object.keys(STATUS_LABELS));
  tamanhoMaximo(fieldErrors, "observacoes", observacoes, OBSERVACOES_MAX_LENGTH);

  return { tipo, categoria, descricao, valor, data, paciente_id, forma_pagamento, status, observacoes, fieldErrors };
}

export async function criarTransacao(
  _prev: TransacaoFormState,
  formData: FormData
): Promise<TransacaoFormState> {
  const { fieldErrors, ...fields } = validarCamposTransacao(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };

  if (fields.paciente_id) {
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
  }

  const { error } = await supabase.from("transacoes").insert({
    clinica_id: ctx.clinicaId,
    tipo: fields.tipo,
    categoria: fields.categoria,
    descricao: fields.descricao,
    valor: fields.valor,
    data: fields.data,
    paciente_id: fields.paciente_id,
    forma_pagamento: fields.forma_pagamento,
    status: fields.status,
    observacoes: fields.observacoes,
  });

  if (error) {
    return { error: tratarErroSupabase(error, "criar", "transação") };
  }

  revalidatePath("/financeiro");
  revalidatePath("/");
  revalidatePath("/relatorios/financeiro");
  redirect("/financeiro?success=Transa%C3%A7%C3%A3o+registrada");
}

export async function atualizarTransacao(
  _prev: TransacaoFormState,
  formData: FormData
): Promise<TransacaoFormState> {
  const id = formData.get("id") as string;
  if (!uuidValido(id)) {
    return { error: "ID inválido." };
  }

  const { fieldErrors, ...fields } = validarCamposTransacao(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };

  if (fields.paciente_id) {
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
  }

  const { error } = await supabase
    .from("transacoes")
    .update({
      tipo: fields.tipo,
      categoria: fields.categoria,
      descricao: fields.descricao,
      valor: fields.valor,
      data: fields.data,
      paciente_id: fields.paciente_id,
      forma_pagamento: fields.forma_pagamento,
      status: fields.status,
      observacoes: fields.observacoes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinica_id", ctx.clinicaId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "transação") };
  }

  revalidatePath("/financeiro");
  revalidatePath("/");
  revalidatePath("/relatorios/financeiro");
  redirect(`/financeiro/${id}?success=Transa%C3%A7%C3%A3o+atualizada`);
}

export async function excluirTransacao(id: string): Promise<void> {
  if (!uuidValido(id)) {
    throw new Error("ID inválido.");
  }

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  if (!ctx) throw new Error("Clínica não selecionada.");

  const { error } = await supabase.from("transacoes").delete().eq("id", id).eq("clinica_id", ctx.clinicaId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "transação"));
  }

  revalidatePath("/financeiro");
  revalidatePath("/");
  revalidatePath("/relatorios/financeiro");
  redirect("/financeiro?success=Transa%C3%A7%C3%A3o+exclu%C3%ADda");
}
