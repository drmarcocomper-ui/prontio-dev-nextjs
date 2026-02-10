"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type TransacaoFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function criarTransacao(
  _prev: TransacaoFormState,
  formData: FormData
): Promise<TransacaoFormState> {
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
  if (!descricao) fieldErrors.descricao = "Descrição é obrigatória.";
  if (!valorRaw || isNaN(valor) || valor <= 0) fieldErrors.valor = "Informe um valor válido.";
  if (!data) fieldErrors.data = "Data é obrigatória.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("transacoes").insert({
    tipo,
    categoria,
    descricao,
    valor,
    data,
    paciente_id,
    forma_pagamento,
    status,
    observacoes,
  });

  if (error) {
    return { error: "Erro ao registrar transação. Tente novamente." };
  }

  redirect("/financeiro");
}

export async function excluirTransacao(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("transacoes").delete().eq("id", id);

  if (error) {
    throw new Error("Erro ao excluir transação.");
  }

  redirect("/financeiro");
}
