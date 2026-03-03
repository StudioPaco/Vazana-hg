import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/layout/sidebar-navigation"
import { ThemeProvider as CustomThemeProvider } from "@/lib/theme-context"
import { LanguageProvider } from "@/lib/language-context"
import { LoadingProvider } from "@/components/layout/loading-overlay"
import AppWrapper from "@/components/layout/app-wrapper"
import GlobalAlertProvider from "@/components/layout/global-alert-provider"

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
      <body className="antialiased bg-background text-foreground" suppressHydrationWarning>
        <LanguageProvider>
          <CustomThemeProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
              <LoadingProvider>
                <SidebarProvider>
                  <GlobalAlertProvider>
                    <AppWrapper>{children}</AppWrapper>
                  </GlobalAlertProvider>
                </SidebarProvider>
              </LoadingProvider>
            </ThemeProvider>
          </CustomThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
