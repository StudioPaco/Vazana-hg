const { createClient } = require("@supabase/supabase-js")

async function createRootUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase environment variables")
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Create the root user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "amitkorach@gmail.com",
      password: "10203040",
      email_confirm: true,
      user_metadata: {
        role: "admin",
        name: "Amit Korach",
      },
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return
    }

    console.log("Root user created successfully:", authData.user.email)

    // Insert user record in the users table
    const { error: dbError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: "amitkorach@gmail.com",
      name: "Amit Korach",
      role: "admin",
      status: "active",
    })

    if (dbError) {
      console.error("Error creating user record:", dbError)
      return
    }

    console.log("Root user setup completed successfully!")
  } catch (error) {
    console.error("Unexpected error:", error)
  }
}

createRootUser()
