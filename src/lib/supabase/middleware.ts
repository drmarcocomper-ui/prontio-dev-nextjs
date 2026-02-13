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
    // Auto-set cookie de clínica se não existe
    const clinicaCookie = request.cookies.get("prontio_clinica_id")?.value;

    if (!clinicaCookie) {
      const { data: vinculo } = await supabase
        .from("usuarios_clinicas")
        .select("clinica_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (vinculo) {
        supabaseResponse.cookies.set("prontio_clinica_id", vinculo.clinica_id, {
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365,
        });
      }
    }

    // Proteção por papel: secretária não acessa rotas do médico
    const pathname = request.nextUrl.pathname;
    const isMedicoOnlyRoute = MEDICO_ONLY_ROUTES.some((r) => pathname.startsWith(r));

    if (isMedicoOnlyRoute) {
      const currentClinicaId = clinicaCookie || (await (async () => {
        const { data } = await supabase
          .from("usuarios_clinicas")
          .select("clinica_id")
          .eq("user_id", user.id)
          .limit(1)
          .single();
        return data?.clinica_id;
      })());

      if (currentClinicaId) {
        const { data: vinculo } = await supabase
          .from("usuarios_clinicas")
          .select("papel")
          .eq("user_id", user.id)
          .eq("clinica_id", currentClinicaId)
          .single();

        if (vinculo?.papel === "secretaria") {
          const url = request.nextUrl.clone();
          url.pathname = "/agenda";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return supabaseResponse;
}
