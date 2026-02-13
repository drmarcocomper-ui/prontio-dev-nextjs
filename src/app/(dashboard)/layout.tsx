import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { ToastHandler } from "@/components/toast-handler";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Load professional name and email for sidebar
  const [{ data: rows }, { data: { user } }] = await Promise.all([
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
      <Sidebar profissionalNome={profissionalNome} userEmail={userEmail} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <Suspense>
        <ToastHandler />
      </Suspense>
    </div>
  );
}
