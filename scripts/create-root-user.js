const bcrypt = require("bcryptjs")
const { createClient } = require("@supabase/supabase-js")

async function createRootUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables")
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Hash the password
    const passwordHash = await bcrypt.hash("10203040", 10)

    // Insert or update root user
    const { data, error } = await supabase.from("user_profiles").upsert(
      {
        username: "root",
        password_hash: passwordHash,
        full_name: "Root Administrator",
        role: "admin",
        is_active: true,
      },
      {
        onConflict: "username",
      },
    )

    if (error) {
      console.error("Error creating root user:", error)
    } else {
      console.log("Root user created successfully")
    }
  } catch (err) {
    console.error("Script error:", err)
  }
}

createRootUser()
