"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Building2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { signIn } from "@/lib/auth-actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-[#FFCC00] hover:bg-[#E6B800] text-[#1A1A1A] py-6 text-lg font-medium rounded-lg h-[60px]"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign In"
      )}
    </Button>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(signIn, null)

  // Handle successful login by redirecting
  useEffect(() => {
    if (state?.success) {
      router.push("/")
    }
  }, [state, router])

  return (
    <Card className="w-full max-w-md shadow-xl border-gray-200">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto w-12 h-12 bg-[#FFCC00] rounded-lg flex items-center justify-center">
          <Building2 className="h-6 w-6 text-[#1A1A1A]" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold text-[#1A1A1A]">ברוכים הבאים</CardTitle>
          <CardDescription className="text-lg text-gray-600">התחברות לוזאנה סטודיו</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-right">
              {state.error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A] text-right">
                אימייל
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                required
                className="h-12 text-base border-gray-300 focus:border-[#00DAC0] text-right"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-[#1A1A1A] text-right">
                סיסמה
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="h-12 text-base border-gray-300 focus:border-[#00DAC0]"
                dir="ltr"
              />
            </div>
          </div>

          <SubmitButton />

          <div className="text-center text-gray-600">
            אין לך חשבון?{" "}
            <Link href="/auth/sign-up" className="text-[#00DAC0] hover:text-[#00C4B4] font-medium">
              הרשמה
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
