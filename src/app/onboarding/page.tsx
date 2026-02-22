import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StepIndicator } from "./step-indicator";
import { StepClinicaForm } from "./step-clinica-form";
import { StepProfissionalForm } from "./step-profissional-form";
import { StepHorariosForm } from "./step-horarios-form";
import { StepPlanoForm } from "./step-plano-form";

export const metadata: Metadata = { title: "Configurar consultório" };

const STEP_TITLES: Record<number, string> = {
  1: "Dados do consultório",
  2: "Perfil profissional",
  3: "Horários de atendimento",
  4: "Escolha seu plano",
};

const STEP_DESCRIPTIONS: Record<number, string> = {
  1: "Informe os dados básicos do seu consultório para começar.",
  2: "Configure seu perfil profissional. Você pode pular e configurar depois.",
  3: "Defina seus horários de atendimento. Você pode pular e configurar depois.",
  4: "Selecione o plano que melhor atende às suas necessidades.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { step: stepParam } = await searchParams;
  let step = parseInt(stepParam || "1", 10);
  if (![1, 2, 3, 4].includes(step)) step = 1;

  // Check if user already has a clinic
  const { data: vinculo } = await supabase
    .from("usuarios_clinicas")
    .select("clinica_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  // No clinic yet — force step 1
  if (!vinculo && step !== 1) {
    redirect("/onboarding?step=1");
  }

  // Has clinic and on step 1 — skip to step 2
  if (vinculo && step === 1) {
    redirect("/onboarding?step=2");
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-8 font-[family-name:var(--font-geist-sans)] sm:py-12">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
          P
        </div>
        <span className="text-xl font-bold tracking-tight text-gray-900">Prontio</span>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <StepIndicator currentStep={step} />
      </div>

      {/* Card */}
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{STEP_TITLES[step]}</h1>
          <p className="mt-1 text-sm text-gray-500">{STEP_DESCRIPTIONS[step]}</p>
        </div>

        {step === 1 && <StepClinicaForm />}
        {step === 2 && <StepProfissionalForm />}
        {step === 3 && <StepHorariosForm />}
        {step === 4 && <StepPlanoForm />}
      </div>
    </div>
  );
}
