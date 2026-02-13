import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getClinicaAtual, getClinicasDoUsuario } from "@/lib/clinica";
import { Tabs } from "./tabs";
import { ConsultorioForm } from "./consultorio-form";
import { ProfissionalForm } from "./profissional-form";
import { HorariosForm } from "./horarios-form";
import { ContaForm } from "./conta-form";
import { AparenciaForm } from "./aparencia-form";
import { DadosForm } from "./dados-form";
import { ClinicasForm } from "./clinicas-form";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const currentTab = tab || "consultorio";

  const supabase = await createClient();
  const ctx = await getClinicaAtual();
  const papel = ctx?.papel ?? "medico";

  // Load clinic data for consultório tab
  const { data: clinica } = ctx?.clinicaId
    ? await supabase
        .from("clinicas")
        .select("nome, cnpj, telefone, endereco, cidade, estado")
        .eq("id", ctx.clinicaId)
        .single()
    : { data: null };

  const clinicaData = (clinica as { nome: string; cnpj: string | null; telefone: string | null; endereco: string | null; cidade: string | null; estado: string | null } | null) ?? {
    nome: "",
    cnpj: null,
    telefone: null,
    endereco: null,
    cidade: null,
    estado: null,
  };

  // Load scoped settings (horários by clinica_id, profissional by user_id)
  const { data: rows } = await supabase
    .from("configuracoes")
    .select("chave, valor");

  const config: Record<string, string> = {};
  (rows ?? []).forEach((r: { chave: string; valor: string }) => {
    config[r.chave] = r.valor;
  });

  // Get user email for "conta" tab
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Load clinics list for "clinicas" tab
  const clinicas = await getClinicasDoUsuario();

  // Load vinculos for clinicas tab
  const clinicaIds = clinicas.map((c) => c.id);
  const { data: vinculos } = clinicaIds.length > 0
    ? await supabase
        .from("usuarios_clinicas")
        .select("id:clinica_id, user_id, papel")
        .in("clinica_id", clinicaIds)
    : { data: null };

  const clinicasList = clinicas.map((c) => ({ id: c.id, nome: c.nome }));

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
          <ContaForm email={user?.email ?? ""} />
        )}
        {currentTab === "aparencia" && (
          <AparenciaForm defaults={config} />
        )}
        {currentTab === "clinicas" && (
          <ClinicasForm
            clinicas={clinicasList}
            vinculos={(vinculos ?? []) as unknown as { id: string; user_id: string; papel: string }[]}
          />
        )}
        {currentTab === "dados" && (
          <DadosForm />
        )}
      </div>
    </div>
  );
}
