"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DESCRICAO_MAX_LENGTH, OBSERVACOES_MAX_LENGTH } from "./constants";

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

  if (!tipo) fieldErrors.tipo = "Selecione o tipo.";

  if (!descricao) {
    fieldErrors.descricao = "Descrição é obrigatória.";
  } else if (descricao.length > DESCRICAO_MAX_LENGTH) {
    fieldErrors.descricao = `Máximo de ${DESCRICAO_MAX_LENGTH} caracteres.`;
  }

  if (!valorRaw || isNaN(valor) || valor <= 0) fieldErrors.valor = "Informe um valor válido.";
  if (!data) fieldErrors.data = "Data é obrigatória.";

  if (observacoes && observacoes.length > OBSERVACOES_MAX_LENGTH) {
    fieldErrors.observacoes = `Máximo de ${OBSERVACOES_MAX_LENGTH} caracteres.`;
  }

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

  const { error } = await supabase.from("transacoes").insert({
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
    return { error: "Erro ao registrar transação. Tente novamente." };
  }

  redirect("/financeiro?success=Transa%C3%A7%C3%A3o+registrada");
}

export async function atualizarTransacao(
  _prev: TransacaoFormState,
  formData: FormData
): Promise<TransacaoFormState> {
  const id = formData.get("id") as string;
  const { fieldErrors, ...fields } = validarCamposTransacao(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

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
    })
    .eq("id", id);

  if (error) {
    return { error: "Erro ao atualizar transação. Tente novamente." };
  }

  redirect(`/financeiro/${id}?success=Transa%C3%A7%C3%A3o+atualizada`);
}

export async function excluirTransacao(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("transacoes").delete().eq("id", id);

  if (error) {
    throw new Error("Erro ao excluir transação.");
  }

  redirect("/financeiro?success=Transa%C3%A7%C3%A3o+exclu%C3%ADda");
}
