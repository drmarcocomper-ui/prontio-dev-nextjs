import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { getMedicoId } from "@/lib/clinica";
import { TransacaoForm } from "./transacao-form";

export const metadata: Metadata = { title: "Nova Transação" };

export default async function NovaTransacaoPage() {
  let medicoId: string;
  try {
    medicoId = await getMedicoId();
  } catch {
    redirect("/login");
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Financeiro", href: "/financeiro" },
          { label: "Nova transação" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Nova transação
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <TransacaoForm medicoId={medicoId} />
      </div>
    </div>
  );
}
