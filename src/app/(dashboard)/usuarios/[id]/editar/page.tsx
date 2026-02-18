import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClinicaAtual, isGestor } from "@/lib/clinica";
import { Breadcrumb } from "@/components/breadcrumb";
import { UsuarioForm } from "../../novo/usuario-form";
import { type UsuarioDefaults } from "../../types";
import { UUID_RE } from "@/lib/validators";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID_RE.test(id)) return { title: "Editar Usuário" };

  const ctx = await getClinicaAtual();
  if (!ctx || !isGestor(ctx.papel)) return { title: "Editar Usuário" };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminSupabase = createAdminClient();
  const { data: vinculo } = await adminSupabase
    .from("usuarios_clinicas")
    .select("user_id")
    .eq("id", id)
    .eq("clinica_id", ctx.clinicaId)
    .single();

  if (!vinculo) return { title: "Editar Usuário" };
  const { data: authUser } = await adminSupabase.auth.admin.getUserById(vinculo.user_id);

  return {
    title: authUser?.user?.email
      ? `Editar - ${authUser.user.email}`
      : "Editar Usuário",
  };
}

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ctx = await getClinicaAtual();
  if (!ctx || !isGestor(ctx.papel)) {
    notFound();
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminSupabase = createAdminClient();

  const { data: vinculo } = await adminSupabase
    .from("usuarios_clinicas")
    .select("id, user_id, papel, clinica_id, clinicas(nome)")
    .eq("id", id)
    .eq("clinica_id", ctx.clinicaId)
    .single();

  if (!vinculo) {
    notFound();
  }

  const v = vinculo as unknown as {
    id: string;
    user_id: string;
    papel: string;
    clinica_id: string;
    clinicas: { nome: string };
  };
  const { data: authUser } = await adminSupabase.auth.admin.getUserById(v.user_id);

  const email = authUser?.user?.email ?? "";

  const defaults: UsuarioDefaults = {
    vinculo_id: v.id,
    user_id: v.user_id,
    email,
    papel: v.papel,
    clinica_id: v.clinica_id,
    clinica_nome: v.clinicas?.nome ?? "",
  };

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <div>
        <Breadcrumb items={[
          { label: "Usuários", href: "/configuracoes?tab=usuarios" },
          { label: email || "Usuário" },
          { label: "Editar" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar usuário
        </h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <UsuarioForm clinicas={[]} defaults={defaults} />
      </div>
    </div>
  );
}
