import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { AssinaturaClient } from "./assinatura-client";

export const metadata = { title: "Assinatura" };

export default async function AssinaturaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const clinicaId = cookieStore.get("prontio_clinica_id")?.value;

  if (!clinicaId) {
    redirect("/onboarding");
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: clinica } = await admin
    .from("clinicas")
    .select("id, subscription_status, trial_ends_at")
    .eq("id", clinicaId)
    .single();

  if (!clinica) {
    redirect("/onboarding");
  }

  const status = clinica.subscription_status;
  const trialEndsAt = clinica.trial_ends_at ? new Date(clinica.trial_ends_at) : null;
  const now = new Date();
  const trialAtivo = trialEndsAt && trialEndsAt > now;

  // Se ativo ou em trial válido → volta ao dashboard
  if (status === "active" || status === "trialing" || trialAtivo) {
    redirect("/");
  }

  // Determinar estado para a UI
  let estado: "trial_expirado" | "past_due" | "canceled" = "trial_expirado";
  if (status === "past_due") {
    estado = "past_due";
  } else if (status === "canceled") {
    estado = "canceled";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-lg font-bold text-white">
            P
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Prontio</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <AssinaturaClient estado={estado} clinicaId={clinicaId} />
        </div>
      </div>
    </div>
  );
}
