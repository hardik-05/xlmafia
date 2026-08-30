import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env, serviceRoleKey } from "@/lib/env";

/**
 * Service-role client — bypasses RLS. SERVER ONLY.
 * Used for: streaming private storage bytes through our API, and best-effort
 * cleanup of accounts that slipped past the domain check.
 */
export function createSupabaseAdminClient() {
  return createClient(env.supabaseUrl, serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
