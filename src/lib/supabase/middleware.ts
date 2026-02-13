import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas restritas ao médico — secretária não pode acessar
const MEDICO_ONLY_ROUTES = [
  "/prontuarios",
  "/receitas",
  "/financeiro",
  "/relatorios",
  "/configuracoes",
];

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
      !request.nextUrl.pathname.startsWith("/auth")
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
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const clinicaCookie = request.cookies.get("prontio_clinica_id")?.value;
    const pathname = request.nextUrl.pathname;
    const isMedicoOnlyRoute = MEDICO_ONLY_ROUTES.some((r) => pathname.startsWith(r));

    // Uma única query quando precisamos do vínculo (cookie ausente ou rota protegida)
    if (!clinicaCookie || isMedicoOnlyRoute) {
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
            maxAge: 60 * 60 * 24 * 365,
          });
        }

        if (isMedicoOnlyRoute && vinculo.papel === "secretaria") {
          const url = request.nextUrl.clone();
          url.pathname = "/agenda";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return supabaseResponse;
}
