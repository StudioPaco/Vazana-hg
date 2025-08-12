// Utility to help set up the root user in Supabase Auth
import { createClient } from "@/lib/supabase/server"

export async function setupRootUser() {
  const supabase = createClient()

  try {
    // Check if root user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail("amitkorach@gmail.com")

    if (existingUser.user) {
      console.log("Root user already exists in Supabase Auth")
      return { success: true, message: "Root user already exists" }
    }

    // Create root user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: "amitkorach@gmail.com",
      password: "10203040",
      email_confirm: true,
      user_metadata: {
        full_name: "Amit Korach (Root Admin)",
        role: "admin",
      },
    })

    if (error) {
      console.error("Error creating root user:", error)
      return { success: false, error: error.message }
    }

    console.log("Root user created successfully:", data.user?.email)
    return { success: true, message: "Root user created successfully" }
  } catch (error) {
    console.error("Setup root user error:", error)
    return { success: false, error: "Failed to setup root user" }
  }
}
