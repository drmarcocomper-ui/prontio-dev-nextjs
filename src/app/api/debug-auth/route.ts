import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({
      step: "auth",
      error: authError?.message ?? "No user found",
      hint: "Auth cookies may not be persisting after login",
    });
  }

  const { data: clinicas, error: clinicasError } = await supabase
    .from("usuarios_clinicas")
    .select("clinica_id, papel, clinicas(id, nome)")
    .eq("user_id", user.id);

  if (clinicasError) {
    return NextResponse.json({
      step: "clinicas_query",
      userId: user.id,
      error: clinicasError.message,
      code: clinicasError.code,
      hint: "Query to usuarios_clinicas failed (possibly RLS)",
    });
  }

  if (!clinicas || clinicas.length === 0) {
    return NextResponse.json({
      step: "clinicas_empty",
      userId: user.id,
      hint: "User has no clinic links in usuarios_clinicas",
    });
  }

  return NextResponse.json({
    step: "ok",
    userId: user.id,
    email: user.email,
    clinicas,
  });
}
