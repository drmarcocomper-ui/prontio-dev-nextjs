import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getClinicaAtual, getClinicasDoUsuario } from "@/lib/clinica";
import { Tabs, isValidTab, getDefaultTab } from "./tabs";
import { ConsultorioForm } from "./consultorio-form";
import { ProfissionalForm } from "./profissional-form";
import { HorariosForm } from "./horarios-form";
import { ContaForm } from "./conta-form";
import { AparenciaForm } from "./aparencia-form";
import { DadosForm } from "./dados-form";
import { ClinicasForm } from "./clinicas-form";

export const metadata: Metadata = { title: "Configurações" };

const needsConfig = new Set(["profissional", "horarios", "aparencia"]);

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  const papel = ctx?.papel ?? "superadmin";

  const defaultTab = getDefaultTab(papel);
  const currentTab = tab && isValidTab(tab) ? tab : defaultTab;

  // Load clinic data only for consultório tab
  let clinicaData = { nome: "", cnpj: null as string | null, telefone: null as string | null, endereco: null as string | null, cidade: null as string | null, estado: null as string | null };
  if (currentTab === "consultorio" && ctx?.clinicaId) {
    const { data: clinica } = await supabase
      .from("clinicas")
      .select("nome, cnpj, telefone, endereco, cidade, estado")
      .eq("id", ctx.clinicaId)
      .single();

    if (clinica) {
      clinicaData = clinica as typeof clinicaData;
    }
  }

  // Load config only for tabs that need it
  let config: Record<string, string> = {};
  if (needsConfig.has(currentTab)) {
    const { data: rows } = await supabase
      .from("configuracoes")
      .select("chave, valor");

    (rows ?? []).forEach((r: { chave: string; valor: string }) => {
      config[r.chave] = r.valor;
    });
  }

  // Get user email only for "conta" tab
  let userEmail = "";
  if (currentTab === "conta") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? "";
  }

  // Load clinics data only for "clinicas" tab
  let clinicasList: { id: string; nome: string; ativo: boolean }[] = [];
  let vinculos: { id: string; user_id: string; papel: string; email?: string }[] = [];
  if (currentTab === "clinicas") {
    const clinicas = await getClinicasDoUsuario();
    const clinicaIds = clinicas.map((c) => c.id);

    if (clinicaIds.length > 0) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const adminSupabase = createAdminClient();
      const { data: vinculosData } = await adminSupabase
        .from("usuarios_clinicas")
        .select("id:clinica_id, user_id, papel")
        .in("clinica_id", clinicaIds);

      if (vinculosData && vinculosData.length > 0) {
        const { data: { users } } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
        const emailMap = new Map(users.map((u) => [u.id, u.email]));
        vinculos = vinculosData.map((v: { id: string; user_id: string; papel: string }) => ({
          ...v,
          email: emailMap.get(v.user_id),
        }));
      }

      const { data: clinicasAtivo } = await supabase
        .from("clinicas")
        .select("id, ativo")
        .in("id", clinicaIds);

      const ativoMap = new Map(
        (clinicasAtivo ?? []).map((c: { id: string; ativo: boolean }) => [c.id, c.ativo])
      );

      clinicasList = clinicas.map((c) => ({
        id: c.id,
        nome: c.nome,
        ativo: ativoMap.get(c.id) ?? true,
      }));
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <Tabs papel={papel} />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        {currentTab === "consultorio" && (
          <ConsultorioForm clinica={clinicaData} />
        )}
        {currentTab === "profissional" && (
          <ProfissionalForm defaults={config} />
        )}
        {currentTab === "horarios" && (
          <HorariosForm defaults={config} />
        )}
        {currentTab === "conta" && (
          <ContaForm email={userEmail} />
        )}
        {currentTab === "aparencia" && (
          <AparenciaForm defaults={config} />
        )}
        {currentTab === "clinicas" && (
          <ClinicasForm
            clinicas={clinicasList}
            vinculos={vinculos}
          />
        )}
        {currentTab === "dados" && (
          <DadosForm />
        )}
      </div>
    </div>
  );
}
