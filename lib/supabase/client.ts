import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = "https://udxvtbwqmfwzghmubfdi.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeHZ0YndxbWZ3emdobXViZmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5OTAzOTcsImV4cCI6MjA3MDU2NjM5N30.dR8ZCA_0oImrPjrWU3QSviEG9fTpDSGXr677acX_OCg"

// Create the Supabase client instance
const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Export the client instance (for backward compatibility)
export { supabase }

// Export a createClient function (for entity classes)
export function createClient() {
  return supabase
}

// Default export
export default supabase
