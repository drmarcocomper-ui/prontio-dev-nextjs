import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { ToastHandler } from "@/components/toast-handler";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { createClient } from "@/lib/supabase/server";
import { getClinicaAtual, getClinicasDoUsuario } from "@/lib/clinica";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Load clinic context, clinics list, and current user
  const [clinicaAtual, clinicas, { data: { user } }] = await Promise.all([
    getClinicaAtual(),
    getClinicasDoUsuario(),
    supabase.auth.getUser(),
  ]);

  // Query configuracoes separately so we can filter by user_id
  const { data: rows } = await supabase
    .from("configuracoes")
    .select("chave, valor")
    .in("chave", ["nome_profissional"])
    .eq("user_id", user?.id ?? "");

  const config: Record<string, string> = {};
  (rows ?? []).forEach((r: { chave: string; valor: string }) => {
    config[r.chave] = r.valor;
  });

  const profissionalNome = config.nome_profissional || "";
  const userEmail = user?.email || "";

  return (
    <div className="flex h-screen flex-col bg-gray-50 font-[family-name:var(--font-geist-sans)] md:flex-row print:block print:h-auto print:bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-sky-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Ir para conteúdo principal
      </a>
      <div className="print:hidden">
        <Sidebar
          profissionalNome={profissionalNome}
          userEmail={userEmail}
          clinicas={clinicas}
          clinicaAtualId={clinicaAtual?.clinicaId ?? ""}
          papel={clinicaAtual?.papel ?? "profissional_saude"}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <KeyboardShortcuts />
      <Suspense>
        <ToastHandler />
      </Suspense>
    </div>
  );
}
