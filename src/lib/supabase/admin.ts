import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não está configurada. Verifique suas variáveis de ambiente."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Busca o ID de um usuário no Auth pelo email (paginado).
 * Retorna null se não encontrado.
 */
export async function getUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const target = email.toLowerCase();
  let page = 1;
  const perPage = 50;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage });
    const users = data?.users ?? [];
    if (users.length === 0) return null;

    const found = users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found.id;
    if (users.length < perPage) return null;
    page++;
  }
}

/**
 * Dado um conjunto de user_ids, retorna um mapa user_id → email.
 * Faz paginação interna e para assim que todos os IDs forem resolvidos.
 */
export async function getAuthEmailMap(
  admin: SupabaseClient,
  userIds: string[],
): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};

  const idSet = new Set(userIds);
  const result: Record<string, string> = {};
  let page = 1;
  const perPage = 50;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage });
    const users = data?.users ?? [];
    if (users.length === 0) break;

    for (const u of users) {
      if (idSet.has(u.id)) {
        result[u.id] = u.email ?? "";
        idSet.delete(u.id);
      }
    }

    if (idSet.size === 0 || users.length < perPage) break;
    page++;
  }

  return result;
}
