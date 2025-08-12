import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import NewJob from "@/components/pages/new-job"

export default async function NewJobPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <NewJob />
}
