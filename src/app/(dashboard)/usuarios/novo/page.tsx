import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { getClinicasDoUsuario } from "@/lib/clinica";
import { UsuarioForm } from "./usuario-form";

export const metadata: Metadata = { title: "Novo Usuário" };

export default async function NovoUsuarioPage() {
  const clinicas = await getClinicasDoUsuario();

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Usuários", href: "/configuracoes?tab=usuarios" },
          { label: "Novo usuário" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Novo usuário
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <UsuarioForm clinicas={clinicas} />
      </div>
    </div>
  );
}
