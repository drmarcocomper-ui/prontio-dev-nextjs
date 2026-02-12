"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  NOME_MAX_LENGTH, RG_MAX_LENGTH, EMAIL_MAX_LENGTH,
  ENDERECO_MAX_LENGTH, NUMERO_MAX_LENGTH, COMPLEMENTO_MAX_LENGTH,
  BAIRRO_MAX_LENGTH, CIDADE_MAX_LENGTH, CONVENIO_MAX_LENGTH,
  OBSERVACOES_MAX_LENGTH,
} from "./types";

export type PacienteFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validarCamposPaciente(formData: FormData) {
  const nome = (formData.get("nome") as string)?.trim();
  const cpf = (formData.get("cpf") as string)?.replace(/\D/g, "") || null;
  const rg = (formData.get("rg") as string)?.trim() || null;
  const data_nascimento = (formData.get("data_nascimento") as string) || null;
  const sexo = (formData.get("sexo") as string) || null;
  const estado_civil = (formData.get("estado_civil") as string) || null;
  const telefone = (formData.get("telefone") as string)?.replace(/\D/g, "") || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const cep = (formData.get("cep") as string)?.replace(/\D/g, "") || null;
  const endereco = (formData.get("endereco") as string)?.trim() || null;
  const numero = (formData.get("numero") as string)?.trim() || null;
  const complemento = (formData.get("complemento") as string)?.trim() || null;
  const bairro = (formData.get("bairro") as string)?.trim() || null;
  const cidade = (formData.get("cidade") as string)?.trim() || null;
  const estado = (formData.get("estado") as string) || null;
  const convenio = (formData.get("convenio") as string)?.trim() || null;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  const fieldErrors: Record<string, string> = {};

  if (!nome) {
    fieldErrors.nome = "Nome é obrigatório.";
  } else if (nome.length > NOME_MAX_LENGTH) {
    fieldErrors.nome = `Máximo de ${NOME_MAX_LENGTH} caracteres.`;
  }

  if (cpf && cpf.length !== 11) {
    fieldErrors.cpf = "CPF deve ter 11 dígitos.";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "E-mail inválido.";
  } else if (email && email.length > EMAIL_MAX_LENGTH) {
    fieldErrors.email = `Máximo de ${EMAIL_MAX_LENGTH} caracteres.`;
  }

  if (telefone && (telefone.length < 10 || telefone.length > 11)) {
    fieldErrors.telefone = "Telefone deve ter 10 ou 11 dígitos.";
  }

  if (cep && cep.length !== 8) {
    fieldErrors.cep = "CEP deve ter 8 dígitos.";
  }

  if (data_nascimento) {
    const today = new Date().toISOString().split("T")[0];
    if (data_nascimento > today) {
      fieldErrors.data_nascimento = "A data de nascimento não pode ser no futuro.";
    }
  }

  if (rg && rg.length > RG_MAX_LENGTH) {
    fieldErrors.rg = `Máximo de ${RG_MAX_LENGTH} caracteres.`;
  }
  if (endereco && endereco.length > ENDERECO_MAX_LENGTH) {
    fieldErrors.endereco = `Máximo de ${ENDERECO_MAX_LENGTH} caracteres.`;
  }
  if (numero && numero.length > NUMERO_MAX_LENGTH) {
    fieldErrors.numero = `Máximo de ${NUMERO_MAX_LENGTH} caracteres.`;
  }
  if (complemento && complemento.length > COMPLEMENTO_MAX_LENGTH) {
    fieldErrors.complemento = `Máximo de ${COMPLEMENTO_MAX_LENGTH} caracteres.`;
  }
  if (bairro && bairro.length > BAIRRO_MAX_LENGTH) {
    fieldErrors.bairro = `Máximo de ${BAIRRO_MAX_LENGTH} caracteres.`;
  }
  if (cidade && cidade.length > CIDADE_MAX_LENGTH) {
    fieldErrors.cidade = `Máximo de ${CIDADE_MAX_LENGTH} caracteres.`;
  }
  if (convenio && convenio.length > CONVENIO_MAX_LENGTH) {
    fieldErrors.convenio = `Máximo de ${CONVENIO_MAX_LENGTH} caracteres.`;
  }
  if (observacoes && observacoes.length > OBSERVACOES_MAX_LENGTH) {
    fieldErrors.observacoes = `Máximo de ${OBSERVACOES_MAX_LENGTH} caracteres.`;
  }

  return {
    nome, cpf, rg, data_nascimento, sexo, estado_civil,
    telefone, email, cep, endereco, numero, complemento,
    bairro, cidade, estado, convenio, observacoes,
    fieldErrors,
  };
}

export async function criarPaciente(
  _prev: PacienteFormState,
  formData: FormData
): Promise<PacienteFormState> {
  const {
    nome, cpf, rg, data_nascimento, sexo, estado_civil,
    telefone, email, cep, endereco, numero, complemento,
    bairro, cidade, estado, convenio, observacoes,
    fieldErrors,
  } = validarCamposPaciente(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("pacientes").insert({
    nome, cpf, rg, data_nascimento, sexo, estado_civil,
    telefone, email, cep, endereco, numero, complemento,
    bairro, cidade, estado, convenio, observacoes,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um paciente com este CPF." };
    }
    return { error: "Erro ao cadastrar paciente. Tente novamente." };
  }

  redirect("/pacientes?success=Paciente+cadastrado");
}

export async function atualizarPaciente(
  _prev: PacienteFormState,
  formData: FormData
): Promise<PacienteFormState> {
  const id = formData.get("id") as string;
  const {
    nome, cpf, rg, data_nascimento, sexo, estado_civil,
    telefone, email, cep, endereco, numero, complemento,
    bairro, cidade, estado, convenio, observacoes,
    fieldErrors,
  } = validarCamposPaciente(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("pacientes")
    .update({
      nome, cpf, rg, data_nascimento, sexo, estado_civil,
      telefone, email, cep, endereco, numero, complemento,
      bairro, cidade, estado, convenio, observacoes,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um paciente com este CPF." };
    }
    return { error: "Erro ao atualizar paciente. Tente novamente." };
  }

  redirect(`/pacientes/${id}?success=Paciente+atualizado`);
}

export async function excluirPaciente(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("pacientes").delete().eq("id", id);

  if (error) {
    throw new Error("Erro ao excluir paciente.");
  }

  redirect("/pacientes?success=Paciente+exclu%C3%ADdo");
}
