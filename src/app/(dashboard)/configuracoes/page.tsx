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
import { UsuariosTab } from "./usuarios-tab";
import { type UsuarioListItem } from "@/app/(dashboard)/usuarios/types";
import type { HorarioProfissional } from "@/app/(dashboard)/agenda/utils";

export const metadata: Metadata = { title: "Configurações" };

const USUARIOS_PAGE_SIZE = 20;

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; pagina?: string; papel?: string }>;
}) {
  const { tab, q, pagina, papel: papelFilter } = await searchParams;

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
        const { data: authUsers } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
        const emailMap = new Map(
          (authUsers?.users ?? [])
            .filter((u) => userIds.includes(u.id))
            .map((u) => [u.id, u.email])
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

  // Load usuarios for "usuarios" tab
  let usuariosItems: UsuarioListItem[] = [];
  let usuariosTotalItems = 0;
  let usuariosCurrentPage = 1;
  let usuariosError = false;
  let usuariosClinicas: { id: string; nome: string }[] = [];
  if (currentTab === "usuarios" && ctx) {
    const clinicasUser = await getClinicasDoUsuario();
    usuariosClinicas = clinicasUser.map((c) => ({ id: c.id, nome: c.nome }));
    usuariosCurrentPage = Math.max(1, Number(pagina) || 1);

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createAdminClient();

    let userIdFilter: string[] | null = null;

    // If searching, first find matching users by email
    if (q) {
      const { data: authUsers } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
      if (authUsers?.users) {
        const escaped = q.toLowerCase();
        const matched = authUsers.users.filter((u) => u.email?.toLowerCase().includes(escaped));
        userIdFilter = matched.map((u) => u.id);
      }
    }

    if (!q || (userIdFilter && userIdFilter.length > 0)) {
      let queryBuilder = supabase
        .from("usuarios_clinicas")
        .select("id, user_id, papel, clinica_id, created_at, clinicas(nome)", { count: "exact" })
        .eq("clinica_id", ctx.clinicaId);

      if (userIdFilter) {
        queryBuilder = queryBuilder.in("user_id", userIdFilter);
      }

      if (papelFilter) {
        queryBuilder = queryBuilder.eq("papel", papelFilter);
      }

      queryBuilder = queryBuilder.order("created_at", { ascending: true });

      const from = (usuariosCurrentPage - 1) * USUARIOS_PAGE_SIZE;
      const to = from + USUARIOS_PAGE_SIZE - 1;
      queryBuilder = queryBuilder.range(from, to);

      const { data: vinculosData, count, error } = await queryBuilder;

      if (error) {
        usuariosError = true;
      } else {
        // Enrich with emails from auth
        const userIds = (vinculosData ?? []).map((v: { user_id: string }) => v.user_id);
        let emailMap: Record<string, string> = {};

        if (userIds.length > 0) {
          const { data: authUsers } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
          if (authUsers?.users) {
            emailMap = Object.fromEntries(
              authUsers.users
                .filter((u) => userIds.includes(u.id))
                .map((u) => [u.id, u.email ?? ""])
            );
          }
        }

        usuariosItems = ((vinculosData ?? []) as unknown as {
          id: string;
          user_id: string;
          papel: string;
          clinica_id: string;
          created_at: string;
          clinicas: { nome: string };
        }[]).map((v) => ({
          vinculo_id: v.id,
          user_id: v.user_id,
          email: emailMap[v.user_id] ?? "",
          papel: v.papel as UsuarioListItem["papel"],
          clinica_id: v.clinica_id,
          clinica_nome: v.clinicas?.nome ?? "",
          created_at: v.created_at,
        }));

        usuariosTotalItems = count ?? 0;
      }
    }
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
        {currentTab === "usuarios" && ctx && !usuariosError && (
          <UsuariosTab
            items={usuariosItems}
            totalItems={usuariosTotalItems}
            currentPage={usuariosCurrentPage}
            q={q}
            papel={papelFilter}
            currentUserId={ctx.userId}
            clinicas={usuariosClinicas}
          />
        )}
        {currentTab === "usuarios" && ctx && usuariosError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Não foi possível carregar os dados. Tente recarregar a página.
          </div>
        )}
        {currentTab === "usuarios" && !ctx && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Contexto de clínica não encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
