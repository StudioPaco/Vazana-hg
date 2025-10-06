import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/layout/sidebar-navigation"
import { ThemeProvider as CustomThemeProvider } from "@/lib/theme-context"
import { LanguageProvider } from "@/lib/language-context"
import { LoadingProvider } from "@/components/layout/loading-overlay"
import AppWrapper from "@/components/layout/app-wrapper"

export const metadata: Metadata = {
  title: "Vazana Studio - וזאנה סטודיו",
  description: "Business Management System - מערכת ניהול עסקי",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="he" dir="rtl" className="font-hebrew" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alef:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Futura:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-neutral-50" suppressHydrationWarning>
        <LanguageProvider>
          <CustomThemeProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
              <LoadingProvider>
                <SidebarProvider>
                  <AppWrapper>{children}</AppWrapper>
                </SidebarProvider>
              </LoadingProvider>
            </ThemeProvider>
          </CustomThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
