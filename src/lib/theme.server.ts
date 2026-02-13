import { createClient } from "@/lib/supabase/server";
import { DEFAULT_THEME, VALID_THEMES, type ThemeName } from "./theme";

export async function getTheme(): Promise<ThemeName> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("configuracoes")
      .select("valor")
      .eq("chave", "cor_primaria")
      .single();

    if (data?.valor && VALID_THEMES.has(data.valor)) {
      return data.valor as ThemeName;
    }
  } catch {
    // Fallback to default on any error (e.g. not authenticated)
  }
  return DEFAULT_THEME;
}
