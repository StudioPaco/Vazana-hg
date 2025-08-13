import type React from "react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth-custom"
import Navigation from "@/components/layout/navigation"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Vazana Studio - וזאנה סטודיו",
  description: "Business Management System - מערכת ניהול עסקי",
  generator: "v0.dev",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let user = null
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value
    if (token) {
      user = await verifyToken(token)
    }
  } catch (error) {
    // User not authenticated, will show login page
    user = null
  }

  return (
    <html lang="he" dir="rtl" className="font-hebrew">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alef:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Futura:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-neutral-50">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {user ? (
            <div className="flex h-screen bg-neutral-50">
              <Navigation user={user} />
              <main className="flex-1 overflow-auto">{children}</main>
            </div>
          ) : (
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}
