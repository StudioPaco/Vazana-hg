import { getCurrentSession } from "@/lib/auth-custom"
import { redirect } from "next/navigation"
import SignUpForm from "@/components/auth/sign-up-form"

export default async function SignUpPage() {
  // Check if user is already logged in
  const session = await getCurrentSession()

  // If user is logged in, redirect to home page
  if (session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFCC00]/10 to-[#00DAC0]/10 px-4 py-12 sm:px-6 lg:px-8">
      <SignUpForm />
    </div>
  )
}
