import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import SignUpForm from "@/components/auth/sign-up-form"

export const dynamic = "force-dynamic"

export default async function SignUpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFCC00]/10 to-[#00DAC0]/10 px-4 py-12 sm:px-6 lg:px-8">
      <SignUpForm />
    </div>
  )
}
