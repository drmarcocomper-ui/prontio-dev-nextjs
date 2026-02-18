"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { getClinicaAtual, getClinicasDoUsuario, isGestor, isProfissional, type Papel } from "@/lib/clinica";
import { invalidarCacheHorario } from "@/app/(dashboard)/agenda/utils";
import { emailValido as validarEmail, uuidValido } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import {
  NOME_CONSULTORIO_MAX,
  ENDERECO_MAX,
  CIDADE_MAX,
  NOME_PROFISSIONAL_MAX,
  ESPECIALIDADE_MAX,
  CRM_MAX,
  RQE_MAX,
  EMAIL_MAX,
  SENHA_MIN,
  SENHA_MAX,
} from "./constants";
import { ESTADOS_UF, CONVENIO_LABELS, type ConvenioTipo } from "../pacientes/types";

export type ConfigFormState = {
  success?: boolean;
  error?: string;
};

const HORARIO_KEYS = new Set([
  "duracao_consulta", "intervalo_inicio", "intervalo_fim",
  ...["seg", "ter", "qua", "qui", "sex", "sab"].flatMap(d => [`horario_${d}_inicio`, `horario_${d}_fim`]),
]);

const VALORES_KEYS = new Set(
  (Object.keys(CONVENIO_LABELS) as ConvenioTipo[])
    .filter((k) => k !== "cortesia")
    .map((k) => `valor_convenio_${k}`),
);

const PROFISSIONAL_KEYS = new Set([
  "nome_profissional", "especialidade", "crm", "rqe", "email_profissional", "cor_primaria",
]);

const FIELD_LIMITS: Record<string, number> = {
  nome_consultorio: NOME_CONSULTORIO_MAX,
  endereco_consultorio: ENDERECO_MAX,
  cidade_consultorio: CIDADE_MAX,
  nome_profissional: NOME_PROFISSIONAL_MAX,
  especialidade: ESPECIALIDADE_MAX,
  crm: CRM_MAX,
  rqe: RQE_MAX,
  email_profissional: EMAIL_MAX,
};

/**
 * Salvar dados do consultório (tabela clinicas)
 */
export async function salvarConsultorio(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { error: "Nome do consultório é obrigatório." };
  if (nome.length > NOME_CONSULTORIO_MAX) return { error: `Nome excede ${NOME_CONSULTORIO_MAX} caracteres.` };

  const cnpj = (formData.get("cnpj") as string)?.replace(/\D/g, "") || null;
  const telefone = (formData.get("telefone") as string)?.replace(/\D/g, "") || null;
  const telefone2 = (formData.get("telefone2") as string)?.replace(/\D/g, "") || null;
  const telefone3 = (formData.get("telefone3") as string)?.replace(/\D/g, "") || null;
  const endereco = (formData.get("endereco") as string)?.trim() || null;
  const cidade = (formData.get("cidade") as string)?.trim() || null;
  const estado = (formData.get("estado") as string)?.trim().toUpperCase() || null;

  if (cnpj && cnpj.length !== 14) return { error: "CNPJ deve ter 14 dígitos." };
  for (const [label, val] of [["Telefone 1", telefone], ["Telefone 2", telefone2], ["Telefone 3", telefone3]] as const) {
    if (val && (val.length < 8 || val.length > 11)) return { error: `${label} deve ter entre 8 e 11 dígitos.` };
  }
  if (endereco && endereco.length > ENDERECO_MAX) return { error: `Endereço excede ${ENDERECO_MAX} caracteres.` };
  if (cidade && cidade.length > CIDADE_MAX) return { error: `Cidade excede ${CIDADE_MAX} caracteres.` };
  if (estado && !ESTADOS_UF.includes(estado)) return { error: "Estado inválido." };

  if (!isGestor(ctx.papel)) {
    return { error: "Sem permissão para editar o consultório." };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("clinicas")
    .update({ nome, cnpj, telefone, telefone2, telefone3, endereco, cidade, estado, updated_at: new Date().toISOString() })
    .eq("id", ctx.clinicaId);

  if (error) {
    return { error: tratarErroSupabase(error, "salvar", "consultório") };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Salvar horários de atendimento (configuracoes com clinica_id)
 */
export async function salvarHorarios(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };
  if (!isGestor(ctx.papel)) return { error: "Sem permissão para editar horários." };

  const entries: { chave: string; valor: string; clinica_id: string }[] = [];

  formData.forEach((value, key) => {
    if (key.startsWith("config_")) {
      const configKey = key.replace("config_", "");
      if (!HORARIO_KEYS.has(configKey)) return;
      entries.push({ chave: configKey, valor: (value as string).trim(), clinica_id: ctx.clinicaId });
    }
  });

  if (entries.length === 0) return { success: true };

  // Validar que horário de início é anterior ao fim
  const DIAS = ["seg", "ter", "qua", "qui", "sex", "sab"];
  const DIA_LABELS: Record<string, string> = { seg: "segunda", ter: "terça", qua: "quarta", qui: "quinta", sex: "sexta", sab: "sábado" };
  const getValue = (chave: string) => entries.find(e => e.chave === chave)?.valor;

  for (const dia of DIAS) {
    const inicio = getValue(`horario_${dia}_inicio`);
    const fim = getValue(`horario_${dia}_fim`);
    if (inicio && fim && inicio >= fim) {
      return { error: `Horário de término deve ser posterior ao início (${DIA_LABELS[dia]}).` };
    }
  }

  const intervaloInicio = getValue("intervalo_inicio");
  const intervaloFim = getValue("intervalo_fim");
  if (intervaloInicio && intervaloFim && intervaloInicio >= intervaloFim) {
    return { error: "Horário de término do intervalo deve ser posterior ao início." };
  }

  const supabase = await createClient();

  // Delete existing horario configs for this clinic, then insert fresh
  const chaves = entries.map(e => e.chave);
  const { error: deleteError } = await supabase
    .from("configuracoes")
    .delete()
    .eq("clinica_id", ctx.clinicaId)
    .in("chave", chaves);

  if (deleteError) {
    return { error: tratarErroSupabase(deleteError, "salvar", "horários") };
  }

  const { error } = await supabase.from("configuracoes").insert(entries);

  if (error) {
    return { error: tratarErroSupabase(error, "salvar", "horários") };
  }

  await invalidarCacheHorario(ctx.clinicaId);
  revalidatePath("/configuracoes");
  return { success: true };
}

/**
 * Salvar horários de atendimento do profissional (horarios_profissional)
 */
export async function salvarHorariosProfissional(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };

  if (!isProfissional(ctx.papel)) {
    return { error: "Sem permissão para configurar horários de profissional." };
  }

  const duracao = parseInt(formData.get("duracao_consulta") as string, 10);
  if (isNaN(duracao) || duracao < 5 || duracao > 240) {
    return { error: "Duração deve ser entre 5 e 240 minutos." };
  }

  const DIAS_KEYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const rows: {
    clinica_id: string;
    user_id: string;
    dia_semana: number;
    ativo: boolean;
    hora_inicio: string | null;
    hora_fim: string | null;
    intervalo_inicio: string | null;
    intervalo_fim: string | null;
    duracao_consulta: number;
  }[] = [];

  const TIME_RE = /^\d{2}:\d{2}$/;

  for (let i = 0; i < 7; i++) {
    const key = DIAS_KEYS[i];
    const ativo = formData.get(`ativo_${key}`) === "true";
    const hora_inicio = (formData.get(`hora_inicio_${key}`) as string) || null;
    const hora_fim = (formData.get(`hora_fim_${key}`) as string) || null;
    const intervalo_inicio = (formData.get(`intervalo_inicio_${key}`) as string) || null;
    const intervalo_fim = (formData.get(`intervalo_fim_${key}`) as string) || null;

    if (ativo) {
      if (!hora_inicio || !hora_fim) {
        return { error: `Horário de início e fim são obrigatórios para ${key}.` };
      }
      if (!TIME_RE.test(hora_inicio) || !TIME_RE.test(hora_fim)) {
        return { error: `Formato de horário inválido para ${key}.` };
      }
      if (hora_fim <= hora_inicio) {
        return { error: `Horário de término deve ser posterior ao início (${key}).` };
      }
      if (intervalo_inicio && !TIME_RE.test(intervalo_inicio)) {
        return { error: `Formato de intervalo inválido para ${key}.` };
      }
      if (intervalo_fim && !TIME_RE.test(intervalo_fim)) {
        return { error: `Formato de intervalo inválido para ${key}.` };
      }
      if (intervalo_inicio && intervalo_fim && intervalo_fim <= intervalo_inicio) {
        return { error: `Intervalo inválido para ${key}.` };
      }
    }

    rows.push({
      clinica_id: ctx.clinicaId,
      user_id: ctx.userId,
      dia_semana: i,
      ativo,
      hora_inicio: ativo ? hora_inicio : null,
      hora_fim: ativo ? hora_fim : null,
      intervalo_inicio: ativo ? intervalo_inicio : null,
      intervalo_fim: ativo ? intervalo_fim : null,
      duracao_consulta: duracao,
    });
  }

  const supabase = await createClient();

  const { error } = await supabase.from("horarios_profissional").upsert(rows, {
    onConflict: "clinica_id,user_id,dia_semana",
  });

  if (error) {
    return { error: tratarErroSupabase(error, "salvar", "horários do profissional") };
  }

  invalidarCacheHorario(ctx.clinicaId, ctx.userId);
  revalidatePath("/configuracoes");
  revalidatePath("/agenda");
  return { success: true };
}

/**
 * Salvar valores de consulta por convênio (configuracoes com clinica_id)
 */
export async function salvarValores(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Clínica não selecionada." };
  if (!isGestor(ctx.papel)) return { error: "Sem permissão para editar valores." };

  const entries: { chave: string; valor: string; clinica_id: string }[] = [];

  formData.forEach((value, key) => {
    if (key.startsWith("config_")) {
      const configKey = key.replace("config_", "");
      if (!VALORES_KEYS.has(configKey)) return;
      const val = (value as string).trim();
      if (!val) return;

      // Converter "350,00" → "350.00"
      const numeric = parseFloat(val.replace(/\./g, "").replace(",", "."));
      if (isNaN(numeric) || numeric < 0) return;

      entries.push({ chave: configKey, valor: numeric.toFixed(2), clinica_id: ctx.clinicaId });
    }
  });

  const supabase = await createClient();

  // Delete all existing valor_convenio configs for this clinic
  const allKeys = [...VALORES_KEYS];
  const { error: deleteError } = await supabase
    .from("configuracoes")
    .delete()
    .eq("clinica_id", ctx.clinicaId)
    .in("chave", allKeys);

  if (deleteError) {
    return { error: tratarErroSupabase(deleteError, "salvar", "valores") };
  }

  if (entries.length > 0) {
    const { error } = await supabase.from("configuracoes").insert(entries);

    if (error) {
      return { error: tratarErroSupabase(error, "salvar", "valores") };
    }
  }

  revalidatePath("/configuracoes");
  return { success: true };
}

/**
 * Salvar dados do profissional (configuracoes com user_id)
 */
export async function salvarProfissional(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx) return { error: "Contexto não encontrado." };

  const entries: { chave: string; valor: string; user_id: string }[] = [];
  let validationError: string | null = null;

  formData.forEach((value, key) => {
    if (validationError) return;
    if (key.startsWith("config_")) {
      const configKey = key.replace("config_", "");
      if (!PROFISSIONAL_KEYS.has(configKey)) return;
      const val = (value as string).trim();
      const limit = FIELD_LIMITS[configKey];
      if (limit && val.length > limit) {
        validationError = `Campo excede ${limit} caracteres.`;
        return;
      }
      if (configKey === "email_profissional" && val) {
        const erros: Record<string, string> = {};
        validarEmail(erros, "email", val);
        if (erros.email) {
          validationError = erros.email;
          return;
        }
      }
      entries.push({ chave: configKey, valor: val, user_id: ctx.userId });
    }
  });

  if (validationError) return { error: validationError };
  if (entries.length === 0) return { success: true };

  const supabase = await createClient();

  // Delete existing profissional configs for this user, then insert fresh
  const chaves = entries.map(e => e.chave);
  const { error: deleteError } = await supabase
    .from("configuracoes")
    .delete()
    .eq("user_id", ctx.userId)
    .in("chave", chaves);

  if (deleteError) {
    return { error: tratarErroSupabase(deleteError, "salvar", "profissional") };
  }

  const { error } = await supabase.from("configuracoes").insert(entries);

  if (error) {
    return { error: tratarErroSupabase(error, "salvar", "profissional") };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function alterarSenha(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const currentPassword = formData.get("current_password") as string;
  const newPassword = formData.get("new_password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!currentPassword) {
    return { error: "Informe a senha atual." };
  }

  if (!newPassword || newPassword.length < SENHA_MIN) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }

  if (newPassword.length > SENHA_MAX) {
    return { error: `A senha deve ter no máximo ${SENHA_MAX} caracteres.` };
  }

  if (newPassword !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  const supabase = await createClient();

  // Verificar senha atual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "Usuário não autenticado." };
  }

  const { success: allowed } = rateLimit({ key: `alterar_senha:${user.id}` });
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    return { error: "Senha atual incorreta." };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: "Erro ao alterar senha. Tente novamente." };
  }

  return { success: true };
}

/**
 * Criar nova clínica
 */
export async function criarClinica(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { error: "Nome é obrigatório." };
  if (nome.length > NOME_CONSULTORIO_MAX) return { error: `Nome excede ${NOME_CONSULTORIO_MAX} caracteres.` };

  const ctx = await getClinicaAtual();
  if (!ctx || !isGestor(ctx.papel)) {
    return { error: "Sem permissão para criar clínicas." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Usuário não autenticado." };

  // Create clinic
  const { data: clinica, error: clinicaError } = await supabase
    .from("clinicas")
    .insert({ nome })
    .select("id")
    .single();

  if (clinicaError) {
    return { error: tratarErroSupabase(clinicaError, "criar", "clínica") };
  }

  // Create user-clinic link — preserve current user's role
  const papel = ctx.papel === "superadmin" ? "superadmin" : "gestor";
  const { error: vinculoError } = await supabase
    .from("usuarios_clinicas")
    .insert({
      user_id: user.id,
      clinica_id: clinica.id,
      papel,
    });

  if (vinculoError) {
    return { error: tratarErroSupabase(vinculoError, "criar", "vínculo") };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Editar nome de uma clínica
 */
export async function editarClinica(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx || !isGestor(ctx.papel)) {
    return { error: "Sem permissão para editar clínicas." };
  }

  const clinicaId = formData.get("clinica_id") as string;
  if (!uuidValido(clinicaId)) return { error: "Clínica não identificada." };

  // Verificar se o usuário tem acesso à clínica
  const clinicas = await getClinicasDoUsuario();
  if (!clinicas.some((c) => c.id === clinicaId)) {
    return { error: "Você não tem acesso a esta clínica." };
  }

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { error: "Nome é obrigatório." };
  if (nome.length > NOME_CONSULTORIO_MAX) return { error: `Nome excede ${NOME_CONSULTORIO_MAX} caracteres.` };

  const supabase = await createClient();

  const { error } = await supabase
    .from("clinicas")
    .update({ nome, updated_at: new Date().toISOString() })
    .eq("id", clinicaId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "clínica") };
  }

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
  return { success: true };
}

/**
 * Alternar status ativo/inativo de uma clínica
 */
export async function alternarStatusClinica(id: string): Promise<void> {
  if (!uuidValido(id)) throw new Error("ID inválido.");

  const ctx = await getClinicaAtual();
  if (!ctx || !isGestor(ctx.papel)) {
    throw new Error("Sem permissão para alterar status de clínicas.");
  }

  // Verificar se o usuário tem acesso à clínica
  const clinicas = await getClinicasDoUsuario();
  if (!clinicas.some((c) => c.id === id)) {
    throw new Error("Você não tem acesso a esta clínica.");
  }

  const supabase = await createClient();

  const { data: clinica, error: fetchError } = await supabase
    .from("clinicas")
    .select("ativo")
    .eq("id", id)
    .single();

  if (fetchError || !clinica) {
    throw new Error("Clínica não encontrada.");
  }

  const { error } = await supabase
    .from("clinicas")
    .update({ ativo: !clinica.ativo, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(tratarErroSupabase(error, "atualizar", "clínica"));
  }

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
}

/**
 * Excluir uma clínica
 */
export async function excluirClinica(id: string): Promise<void> {
  if (!uuidValido(id)) throw new Error("ID inválido.");

  const ctx = await getClinicaAtual();
  if (!ctx || !isGestor(ctx.papel)) {
    throw new Error("Sem permissão para excluir clínicas.");
  }

  if (id === ctx.clinicaId) {
    throw new Error("Não é possível excluir a clínica ativa.");
  }

  // Verificar se o usuário tem acesso à clínica
  const clinicas = await getClinicasDoUsuario();
  if (!clinicas.some((c) => c.id === id)) {
    throw new Error("Você não tem acesso a esta clínica.");
  }

  const supabase = await createClient();

  // Verificar se há dados vinculados antes de excluir
  const { count } = await supabase
    .from("agendamentos")
    .select("*", { count: "exact", head: true })
    .eq("clinica_id", id);

  if (count && count > 0) {
    throw new Error("Não é possível excluir uma clínica com agendamentos. Desative-a em vez disso.");
  }

  const { error } = await supabase
    .from("clinicas")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "clínica"));
  }

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");
}

// ============================================
// Catálogo de Exames
// ============================================

const NOME_EXAME_MAX = 255;
const CODIGO_TUSS_MAX = 50;

/**
 * Criar exame no catálogo
 */
export async function criarCatalogoExame(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx || !isSuperAdmin(ctx.papel)) {
    return { error: "Sem permissão." };
  }

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { error: "Nome é obrigatório." };
  if (nome.length > NOME_EXAME_MAX) return { error: `Nome excede ${NOME_EXAME_MAX} caracteres.` };

  const codigo_tuss = (formData.get("codigo_tuss") as string)?.trim() || null;
  if (codigo_tuss && codigo_tuss.length > CODIGO_TUSS_MAX) return { error: `Código TUSS excede ${CODIGO_TUSS_MAX} caracteres.` };

  const supabase = await createClient();

  const { error } = await supabase
    .from("catalogo_exames")
    .insert({ nome, codigo_tuss });

  if (error) {
    return { error: tratarErroSupabase(error, "criar", "exame") };
  }

  revalidatePath("/configuracoes");
  return { success: true };
}

/**
 * Atualizar exame no catálogo
 */
export async function atualizarCatalogoExame(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx || !isSuperAdmin(ctx.papel)) {
    return { error: "Sem permissão." };
  }

  const id = formData.get("id") as string;
  if (!uuidValido(id)) return { error: "Exame não identificado." };

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { error: "Nome é obrigatório." };
  if (nome.length > NOME_EXAME_MAX) return { error: `Nome excede ${NOME_EXAME_MAX} caracteres.` };

  const codigo_tuss = (formData.get("codigo_tuss") as string)?.trim() || null;
  if (codigo_tuss && codigo_tuss.length > CODIGO_TUSS_MAX) return { error: `Código TUSS excede ${CODIGO_TUSS_MAX} caracteres.` };

  const supabase = await createClient();

  const { error } = await supabase
    .from("catalogo_exames")
    .update({ nome, codigo_tuss })
    .eq("id", id);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "exame") };
  }

  revalidatePath("/configuracoes");
  return { success: true };
}

/**
 * Excluir exame do catálogo
 */
export async function excluirCatalogoExame(id: string): Promise<void> {
  if (!uuidValido(id)) throw new Error("ID inválido.");

  const ctx = await getClinicaAtual();
  if (!ctx || !isSuperAdmin(ctx.papel)) {
    throw new Error("Sem permissão.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("catalogo_exames")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "exame"));
  }

  revalidatePath("/configuracoes");
}

// ============================================
// Medicamentos
// ============================================

function isSuperAdmin(papel: Papel): boolean {
  return papel === "superadmin";
}

const NOME_MEDICAMENTO_MAX = 255;
const POSOLOGIA_MAX = 500;
const QUANTIDADE_MAX = 100;
const VIA_MAX = 100;

/**
 * Criar medicamento
 */
export async function criarMedicamento(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx || !isSuperAdmin(ctx.papel)) {
    return { error: "Sem permissão." };
  }

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { error: "Nome é obrigatório." };
  if (nome.length > NOME_MEDICAMENTO_MAX) return { error: `Nome excede ${NOME_MEDICAMENTO_MAX} caracteres.` };

  const posologia = (formData.get("posologia") as string)?.trim() || null;
  const quantidade = (formData.get("quantidade") as string)?.trim() || null;
  const via_administracao = (formData.get("via_administracao") as string)?.trim() || null;

  if (posologia && posologia.length > POSOLOGIA_MAX) return { error: `Posologia excede ${POSOLOGIA_MAX} caracteres.` };
  if (quantidade && quantidade.length > QUANTIDADE_MAX) return { error: `Quantidade excede ${QUANTIDADE_MAX} caracteres.` };
  if (via_administracao && via_administracao.length > VIA_MAX) return { error: `Via excede ${VIA_MAX} caracteres.` };

  const supabase = await createClient();

  const { error } = await supabase
    .from("medicamentos")
    .insert({ nome, posologia, quantidade, via_administracao });

  if (error) {
    return { error: tratarErroSupabase(error, "criar", "medicamento") };
  }

  revalidatePath("/configuracoes");
  return { success: true };
}

/**
 * Atualizar medicamento
 */
export async function atualizarMedicamento(
  _prev: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const ctx = await getClinicaAtual();
  if (!ctx || !isSuperAdmin(ctx.papel)) {
    return { error: "Sem permissão." };
  }

  const id = formData.get("id") as string;
  if (!uuidValido(id)) return { error: "Medicamento não identificado." };

  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { error: "Nome é obrigatório." };
  if (nome.length > NOME_MEDICAMENTO_MAX) return { error: `Nome excede ${NOME_MEDICAMENTO_MAX} caracteres.` };

  const posologia = (formData.get("posologia") as string)?.trim() || null;
  const quantidade = (formData.get("quantidade") as string)?.trim() || null;
  const via_administracao = (formData.get("via_administracao") as string)?.trim() || null;

  if (posologia && posologia.length > POSOLOGIA_MAX) return { error: `Posologia excede ${POSOLOGIA_MAX} caracteres.` };
  if (quantidade && quantidade.length > QUANTIDADE_MAX) return { error: `Quantidade excede ${QUANTIDADE_MAX} caracteres.` };
  if (via_administracao && via_administracao.length > VIA_MAX) return { error: `Via excede ${VIA_MAX} caracteres.` };

  const supabase = await createClient();

  const { error } = await supabase
    .from("medicamentos")
    .update({ nome, posologia, quantidade, via_administracao })
    .eq("id", id);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "medicamento") };
  }

  revalidatePath("/configuracoes");
  return { success: true };
}

/**
 * Excluir medicamento
 */
export async function excluirMedicamento(id: string): Promise<void> {
  if (!uuidValido(id)) throw new Error("ID inválido.");

  const ctx = await getClinicaAtual();
  if (!ctx || !isSuperAdmin(ctx.papel)) {
    throw new Error("Sem permissão.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("medicamentos")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "medicamento"));
  }

  revalidatePath("/configuracoes");
}

