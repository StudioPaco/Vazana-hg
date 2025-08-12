import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createRootUser() {
  try {
    console.log("Creating root user...")

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "amitkorach@gmail.com",
      password: "10203040",
      email_confirm: true,
    })

    if (authError) {
      console.error("Auth error:", authError)
      return
    }

    console.log("✅ Auth user created:", authData.user?.email)

    // Create user profile
    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: authData.user!.id,
      email: "amitkorach@gmail.com",
      full_name: "Amit Korach",
      role: "admin",
      is_active: true,
      permissions: {
        manage_users: true,
        manage_clients: true,
        manage_jobs: true,
        manage_invoices: true,
        manage_settings: true,
        view_reports: true,
      },
    })

    if (profileError) {
      console.error("Profile error:", profileError)
      return
    }

    console.log("✅ Root user profile created successfully")
    console.log("🎉 You can now login with: amitkorach@gmail.com / 10203040")
  } catch (error) {
    console.error("Setup error:", error)
  }
}

createRootUser()
