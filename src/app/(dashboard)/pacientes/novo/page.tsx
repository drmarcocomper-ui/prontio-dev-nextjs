import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { PacienteForm } from "./paciente-form";

export const metadata: Metadata = { title: "Novo Paciente" };

export default function NovoPacientePage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[
          { label: "Pacientes", href: "/pacientes" },
          { label: "Novo paciente" },
        ]} />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Novo paciente
        </h1>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <PacienteForm />
      </div>
    </div>
  );
}
