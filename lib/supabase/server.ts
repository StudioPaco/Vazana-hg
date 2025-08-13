import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createClient() {
  const cookieStore = cookies()

  return createSupabaseServerClient(
    "https://udxvtbwqmfwzghmubfdi.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeHZ0YndxbWZ3emdobXViZmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5OTAzOTcsImV4cCI6MjA3MDU2NjM5N30.dR8ZCA_0oImrPjrWU3QSviEG9fTpDSGXr677acX_OCg",
    {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

// Export createServerClient as an alias to createClient for compatibility
export const createServerClient = createClient
