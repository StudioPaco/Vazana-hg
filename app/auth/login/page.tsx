import { getCurrentUser } from "@/lib/auth-custom"
import { redirect } from "next/navigation"
import LoginForm from "@/components/auth/login-form"

export default async function LoginPage() {
  // Check if user is already logged in using custom auth
  const user = await getCurrentUser()

  // If user is logged in, redirect to home page
  if (user) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-vazana-yellow/10 to-vazana-teal/10 px-4 py-12 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  )
}
