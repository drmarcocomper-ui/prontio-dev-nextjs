"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tratarErroSupabase } from "@/lib/supabase-errors";
import { getClinicaAtual, getClinicasDoUsuario, isGestor } from "@/lib/clinica";
import { rateLimit } from "@/lib/rate-limit";
import { emailValido as validarEmail } from "@/lib/validators";
import { uuidValido } from "@/lib/validators";
import { EMAIL_MAX, SENHA_MIN, SENHA_MAX, PAPEIS_VALIDOS, type UsuarioFormState } from "./types";

/**
 * Criar usuário (auth + vínculo com clínica)
 */
export async function criarUsuario(
  _prev: UsuarioFormState,
  formData: FormData
): Promise<UsuarioFormState> {
  const email = (formData.get("email") as string)?.trim();
  const senha = (formData.get("senha") as string) ?? "";
  const papel = (formData.get("papel") as string)?.trim();
  const clinicaId = (formData.get("clinica_id") as string)?.trim();

  if (!email) return { error: "E-mail é obrigatório." };
  if (email.length > EMAIL_MAX) return { error: `E-mail excede ${EMAIL_MAX} caracteres.` };
  const emailErros: Record<string, string> = {};
  validarEmail(emailErros, "email", email);
  if (emailErros.email) return { error: emailErros.email };

  if (!senha || senha.length < SENHA_MIN) {
    return { error: `A senha deve ter pelo menos ${SENHA_MIN} caracteres.` };
  }
  if (senha.length > SENHA_MAX) {
    return { error: `A senha deve ter no máximo ${SENHA_MAX} caracteres.` };
  }

  if (!PAPEIS_VALIDOS.includes(papel as typeof PAPEIS_VALIDOS[number])) {
    return { error: "Papel inválido." };
  }

  if (!clinicaId) return { error: "Selecione uma clínica." };
  if (!uuidValido(clinicaId)) return { error: "Clínica inválida." };

  const ctx = await getClinicaAtual();
  if (!ctx || !isGestor(ctx.papel)) {
    return { error: "Sem permissão para criar usuários." };
  }

  // Verificar se o usuário tem acesso à clínica informada
  const clinicas = await getClinicasDoUsuario();
  if (!clinicas.some((c) => c.id === clinicaId)) {
    return { error: "Você não tem acesso a esta clínica." };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminSupabase = createAdminClient();

  let userId: string;
  let isNewUser = false;

  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message?.includes("already been registered") || createError.message?.includes("already exists")) {
      // Usuário já existe no Auth — buscar o ID para vincular à clínica
      const { data: authUsers } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
      const existing = authUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (!existing) {
        return { error: "Usuário existente não encontrado. Tente novamente." };
      }
      userId = existing.id;
    } else {
      return { error: "Erro ao criar usuário. Tente novamente." };
    }
  } else {
    userId = newUser.user.id;
    isNewUser = true;
  }

  const { error: vinculoError } = await adminSupabase
    .from("usuarios_clinicas")
    .insert({
      user_id: userId,
      clinica_id: clinicaId,
      papel,
    });

  if (vinculoError) {
    // Cleanup: delete orphaned auth user only if we just created it
    if (isNewUser) {
      await adminSupabase.auth.admin.deleteUser(userId);
    }
    if (vinculoError.code === "23505") {
      return { error: "Este usuário já está vinculado a esta clínica." };
    }
    return { error: tratarErroSupabase(vinculoError, "criar", "vínculo do usuário") };
  }

  revalidatePath("/usuarios");
  revalidatePath("/configuracoes");
  return { success: true };
}

/**
 * Atualizar usuário (papel) via formulário de edição
 */
export async function atualizarUsuario(
  _prev: UsuarioFormState,
  formData: FormData
): Promise<UsuarioFormState> {
  const vinculoId = (formData.get("vinculo_id") as string)?.trim();
  const userId = (formData.get("user_id") as string)?.trim();
  const papel = (formData.get("papel") as string)?.trim();

  if (!vinculoId) return { error: "Vínculo não identificado." };
  if (!uuidValido(vinculoId)) return { error: "Vínculo inválido." };

  if (!PAPEIS_VALIDOS.includes(papel as typeof PAPEIS_VALIDOS[number])) {
    return { error: "Papel inválido." };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isGestor(ctx.papel)) {
    return { error: "Sem permissão para editar usuários." };
  }

  if (userId && !uuidValido(userId)) return { error: "Usuário inválido." };
  if (userId === ctx.userId) {
    return { error: "Você não pode editar seu próprio vínculo." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("usuarios_clinicas")
    .update({ papel })
    .eq("id", vinculoId)
    .eq("clinica_id", ctx.clinicaId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "usuário") };
  }

  revalidatePath("/usuarios");
  revalidatePath("/configuracoes");
  return { success: true };
}

/**
 * Atualizar papel de um vínculo
 */
export async function atualizarPapel(
  _prev: UsuarioFormState,
  formData: FormData
): Promise<UsuarioFormState> {
  const vinculoId = (formData.get("vinculo_id") as string)?.trim();
  const userId = (formData.get("user_id") as string)?.trim();
  const novoPapel = (formData.get("papel") as string)?.trim();

  if (!vinculoId) return { error: "Vínculo não identificado." };
  if (!uuidValido(vinculoId)) return { error: "Vínculo inválido." };

  if (!PAPEIS_VALIDOS.includes(novoPapel as typeof PAPEIS_VALIDOS[number])) {
    return { error: "Papel inválido." };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isGestor(ctx.papel)) {
    return { error: "Sem permissão para alterar papéis." };
  }

  if (userId && !uuidValido(userId)) return { error: "Usuário inválido." };
  if (userId === ctx.userId) {
    return { error: "Você não pode alterar seu próprio papel." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("usuarios_clinicas")
    .update({ papel: novoPapel })
    .eq("id", vinculoId)
    .eq("clinica_id", ctx.clinicaId);

  if (error) {
    return { error: tratarErroSupabase(error, "atualizar", "papel do usuário") };
  }

  revalidatePath("/usuarios");
  revalidatePath("/configuracoes");
  return { success: true };
}

/**
 * Resetar senha de um usuário
 */
export async function resetarSenha(
  _prev: UsuarioFormState,
  formData: FormData
): Promise<UsuarioFormState> {
  const userId = (formData.get("user_id") as string)?.trim();
  const novaSenha = (formData.get("senha") as string) ?? "";

  if (!userId) return { error: "Usuário não identificado." };
  if (!uuidValido(userId)) return { error: "Usuário inválido." };

  if (!novaSenha || novaSenha.length < SENHA_MIN) {
    return { error: `A senha deve ter pelo menos ${SENHA_MIN} caracteres.` };
  }
  if (novaSenha.length > SENHA_MAX) {
    return { error: `A senha deve ter no máximo ${SENHA_MAX} caracteres.` };
  }

  const ctx = await getClinicaAtual();
  if (!ctx || !isGestor(ctx.papel)) {
    return { error: "Sem permissão para resetar senhas." };
  }

  if (userId === ctx.userId) {
    return { error: "Use a aba Conta nas Configurações para alterar sua própria senha." };
  }

  const { success: allowed } = rateLimit({
    key: `reset_senha:${ctx.userId}`,
    windowMs: 60 * 60 * 1000, // 1 hora
  });
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde 1 hora antes de tentar novamente." };
  }

  // Verificar que o usuário-alvo pertence à clínica do caller
  const supabase = await createClient();
  const { data: vinculo } = await supabase
    .from("usuarios_clinicas")
    .select("id")
    .eq("user_id", userId)
    .eq("clinica_id", ctx.clinicaId)
    .single();

  if (!vinculo) {
    return { error: "Usuário não encontrado nesta clínica." };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    password: novaSenha,
  });

  if (error) {
    return { error: "Erro ao resetar senha. Tente novamente." };
  }

  return { success: true };
}

/**
 * Remover vínculo de um usuário com a clínica
 */
export async function removerVinculo(vinculoId: string): Promise<void> {
  if (!vinculoId) throw new Error("Vínculo não identificado.");
  if (!uuidValido(vinculoId)) throw new Error("Vínculo inválido.");

  const ctx = await getClinicaAtual();
  if (!ctx || !isGestor(ctx.papel)) {
    throw new Error("Sem permissão para remover vínculos.");
  }

  // Buscar vínculo para verificar auto-remoção (scoped pela clínica atual)
  const supabase = await createClient();
  const { data: vinculo } = await supabase
    .from("usuarios_clinicas")
    .select("user_id")
    .eq("id", vinculoId)
    .eq("clinica_id", ctx.clinicaId)
    .single();

  if (!vinculo) {
    throw new Error("Vínculo não encontrado nesta clínica.");
  }

  if (vinculo.user_id === ctx.userId) {
    throw new Error("Você não pode remover seu próprio vínculo.");
  }

  const { error } = await supabase
    .from("usuarios_clinicas")
    .delete()
    .eq("id", vinculoId)
    .eq("clinica_id", ctx.clinicaId);

  if (error) {
    throw new Error(tratarErroSupabase(error, "excluir", "vínculo do usuário"));
  }

  revalidatePath("/usuarios");
  revalidatePath("/configuracoes");
}
