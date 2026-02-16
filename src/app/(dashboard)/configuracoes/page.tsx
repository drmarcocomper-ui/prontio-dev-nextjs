import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getClinicaAtual, getClinicasDoUsuario, isProfissional } from "@/lib/clinica";
import { Tabs } from "./tabs";
import { isValidTab, getDefaultTab } from "./tab-utils";
import { ConsultorioForm } from "./consultorio-form";
import { ProfissionalForm } from "./profissional-form";
import { HorariosForm } from "./horarios-form";
import { ContaForm } from "./conta-form";
import { AparenciaForm } from "./aparencia-form";
import { DadosForm } from "./dados-form";
import { ClinicasForm } from "./clinicas-form";
import { ValoresForm } from "./valores-form";
import { MedicamentosForm, type Medicamento } from "./medicamentos-form";
import { CatalogoExamesForm, type CatalogoExame } from "./catalogo-exames-form";
import { HorariosProfissionalForm } from "./horarios-profissional-form";
import type { HorarioProfissional } from "@/app/(dashboard)/agenda/utils";

export const metadata: Metadata = { title: "Configurações" };

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

  // Load clinic data for "clinica" tab
  let clinicaData = { nome: "", cnpj: null as string | null, telefone: null as string | null, telefone2: null as string | null, telefone3: null as string | null, endereco: null as string | null, cidade: null as string | null, estado: null as string | null };
  if (currentTab === "clinica" && ctx?.clinicaId) {
    const { data: clinica } = await supabase
      .from("clinicas")
      .select("nome, cnpj, telefone, telefone2, telefone3, endereco, cidade, estado")
      .eq("id", ctx.clinicaId)
      .single();

    if (clinica) {
      clinicaData = clinica as typeof clinicaData;
    }
  }

  // Load config for tabs that need it (clinica: horarios+valores, minha-conta: profissional+aparencia)
  const config: Record<string, string> = {};
  if (currentTab === "clinica" || currentTab === "minha-conta") {
    const { data: rows } = await supabase
      .from("configuracoes")
      .select("chave, valor");

    (rows ?? []).forEach((r: { chave: string; valor: string }) => {
      config[r.chave] = r.valor;
    });
  }

  // Get user email for "minha-conta" tab
  let userEmail = "";
  if (currentTab === "minha-conta") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? "";
  }

  // Load clinics data for "gestao" tab
  let clinicasList: { id: string; nome: string; ativo: boolean }[] = [];
  let vinculos: { id: string; user_id: string; papel: string; email?: string }[] = [];
  if (currentTab === "gestao") {
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
        const userIds = [...new Set(vinculosData.map((v: { user_id: string }) => v.user_id))];
        const userResults = await Promise.all(
          userIds.map((uid) => adminSupabase.auth.admin.getUserById(uid))
        );
        const emailMap = new Map(
          userResults
            .filter((r) => r.data?.user)
            .map((r) => [r.data.user!.id, r.data.user!.email])
        );
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

  // Load medicamentos for "medicamentos" tab (catálogo global)
  let medicamentosList: Medicamento[] = [];
  if (currentTab === "medicamentos") {
    const { data } = await supabase
      .from("medicamentos")
      .select("id, nome, posologia, quantidade, via_administracao")
      .order("nome");

    medicamentosList = (data ?? []) as Medicamento[];
  }

  // Load catalogo_exames for "exames" tab
  let examesList: CatalogoExame[] = [];
  if (currentTab === "exames") {
    const { data } = await supabase
      .from("catalogo_exames")
      .select("id, nome, codigo_tuss")
      .order("nome");

    examesList = (data ?? []) as CatalogoExame[];
  }

  // Load horarios_profissional for "minha-conta" tab
  let horariosProfissional: HorarioProfissional[] = [];
  if (currentTab === "minha-conta" && isProfissional(papel) && ctx) {
    const { data } = await supabase
      .from("horarios_profissional")
      .select("dia_semana, ativo, hora_inicio, hora_fim, intervalo_inicio, intervalo_fim, duracao_consulta")
      .eq("clinica_id", ctx.clinicaId)
      .eq("user_id", ctx.userId)
      .order("dia_semana");

    horariosProfissional = (data ?? []) as HorarioProfissional[];
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <Tabs papel={papel} />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        {currentTab === "clinica" && (
          <>
            <ConsultorioForm clinica={clinicaData} />
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Horários Padrão da Clínica</h2>
              <p className="text-sm text-gray-500 mb-4">
                Utilizado quando o profissional não configurou horários próprios.
              </p>
              <HorariosForm defaults={config} />
            </div>
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Valores</h2>
              <ValoresForm defaults={config} />
            </div>
          </>
        )}
        {currentTab === "minha-conta" && (
          <>
            <ContaForm email={userEmail} />
            {isProfissional(papel) && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Dados Profissionais</h2>
                <ProfissionalForm defaults={config} />
              </div>
            )}
            {isProfissional(papel) && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Meus Horários</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Configure seus horários de atendimento por dia da semana. Quando não configurado, o sistema usa os horários padrão da clínica.
                </p>
                <HorariosProfissionalForm defaults={horariosProfissional} />
              </div>
            )}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Aparência</h2>
              <AparenciaForm defaults={config} />
            </div>
          </>
        )}
        {currentTab === "medicamentos" && (
          <MedicamentosForm medicamentos={medicamentosList} />
        )}
        {currentTab === "exames" && (
          <CatalogoExamesForm exames={examesList} />
        )}
        {currentTab === "gestao" && (
          <>
            <ClinicasForm
              clinicas={clinicasList}
              vinculos={vinculos}
            />
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Dados e Backup</h2>
              <DadosForm />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
