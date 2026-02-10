import { createClient } from "@/lib/supabase/server";
import { Tabs } from "./tabs";
import { ConsultorioForm } from "./consultorio-form";
import { ProfissionalForm } from "./profissional-form";
import { HorariosForm } from "./horarios-form";
import { ContaForm } from "./conta-form";

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const currentTab = tab || "consultorio";

  const supabase = await createClient();

  // Load all settings as key-value
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <Tabs />

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {currentTab === "consultorio" && (
          <ConsultorioForm defaults={config} />
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
      </div>
    </div>
  );
}
