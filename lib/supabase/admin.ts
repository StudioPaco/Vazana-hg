import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Admin Supabase client — uses SUPABASE_SERVICE_ROLE_KEY.
 * ONLY use this for server-side admin operations (e.g. auth.admin.createUser).
 * Never expose to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. " +
      "Get the service_role key from Supabase Dashboard → Settings → API."
    )
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
