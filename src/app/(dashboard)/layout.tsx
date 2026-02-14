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

  // Load clinic context, clinics list, professional name, and user email
  const [clinicaAtual, clinicas, { data: rows }, { data: { user } }] = await Promise.all([
    getClinicaAtual(),
    getClinicasDoUsuario(),
    supabase
      .from("configuracoes")
      .select("chave, valor")
      .in("chave", ["profissional_nome"]),
    supabase.auth.getUser(),
  ]);

  const config: Record<string, string> = {};
  (rows ?? []).forEach((r: { chave: string; valor: string }) => {
    config[r.chave] = r.valor;
  });

  const profissionalNome = config.profissional_nome || "";
  const userEmail = user?.email || "";

  return (
    <div className="flex h-screen flex-col bg-gray-50 font-[family-name:var(--font-geist-sans)] md:flex-row">
      <Sidebar
        profissionalNome={profissionalNome}
        userEmail={userEmail}
        clinicas={clinicas}
        clinicaAtualId={clinicaAtual?.clinicaId ?? ""}
        papel={clinicaAtual?.papel ?? "profissional_saude"}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <KeyboardShortcuts />
      <Suspense>
        <ToastHandler />
      </Suspense>
    </div>
  );
}
