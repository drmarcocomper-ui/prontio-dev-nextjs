import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Mapa de rotas restritas → papéis que podem acessar
const RESTRICTED_ROUTES: Record<string, string[]> = {
  "/prontuarios": ["superadmin", "profissional_saude"],
  "/receitas": ["superadmin", "profissional_saude"],
  "/financeiro": ["superadmin", "gestor", "financeiro"],
  "/relatorios": ["superadmin", "gestor", "profissional_saude", "financeiro"],
  "/usuarios": ["superadmin", "gestor"],
  "/auditoria": ["superadmin", "gestor"],
  "/configuracoes": ["superadmin", "gestor", "profissional_saude"],
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Sem variáveis de ambiente configuradas, redireciona para /login
    if (
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/signup") &&
      !request.nextUrl.pathname.startsWith("/auth") &&
      !request.nextUrl.pathname.startsWith("/onboarding") &&
      !request.nextUrl.pathname.startsWith("/termos") &&
      !request.nextUrl.pathname.startsWith("/privacidade") &&
      !request.nextUrl.pathname.startsWith("/offline")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to
  // debug issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/signup") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/onboarding") &&
    !request.nextUrl.pathname.startsWith("/termos") &&
    !request.nextUrl.pathname.startsWith("/privacidade") &&
    !request.nextUrl.pathname.startsWith("/offline")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const clinicaCookie = request.cookies.get("prontio_clinica_id")?.value;
    const pathname = request.nextUrl.pathname;
    const onboardingCookie = request.cookies.get("prontio_onboarding")?.value;

    // Onboarding: cookie pending → force user to /onboarding
    if (onboardingCookie === "pending" && !pathname.startsWith("/onboarding")) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // User on /onboarding without pending cookie — check if they have a clinic
    if (pathname.startsWith("/onboarding") && onboardingCookie !== "pending") {
      const { data: vinculo } = await supabase
        .from("usuarios_clinicas")
        .select("clinica_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (vinculo) {
        // Has clinic and no pending cookie → done with onboarding
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
      // No clinic — let them proceed to /onboarding (step 1)
    }

    const restrictedEntry = Object.entries(RESTRICTED_ROUTES).find(([route]) => pathname.startsWith(route));

    // Uma única query quando precisamos do vínculo (cookie ausente ou rota protegida)
    if ((!clinicaCookie || restrictedEntry) && !pathname.startsWith("/onboarding")) {
      let query = supabase
        .from("usuarios_clinicas")
        .select("clinica_id, papel")
        .eq("user_id", user.id);

      if (clinicaCookie) {
        query = query.eq("clinica_id", clinicaCookie);
      }

      const { data: vinculo } = await query.limit(1).single();

      if (vinculo) {
        if (!clinicaCookie) {
          supabaseResponse.cookies.set("prontio_clinica_id", vinculo.clinica_id, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 365,
          });
        }

        if (restrictedEntry && !restrictedEntry[1].includes(vinculo.papel)) {
          const url = request.nextUrl.clone();
          url.pathname = "/";
          return NextResponse.redirect(url);
        }
      } else if (!clinicaCookie) {
        // No clinic at all — redirect to onboarding
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
