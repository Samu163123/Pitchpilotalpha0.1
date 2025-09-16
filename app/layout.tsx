import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppHeader } from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { LanguageOnboarding } from "@/components/language-onboarding"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PitchPilot - Practice sales. Anywhere. Anytime.",
  description: "AI-powered sales roleplay trainer to help you master your pitch and close more deals.",
  keywords: "sales training, roleplay, AI, practice, pitch, sales calls",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="min-h-screen flex flex-col">
            <AppHeader />
            <main className="flex-1">{children}</main>
            <AppFooter />
          </div>
          <Toaster />
          {/* First-time language selection modal (client component) */}
          <LanguageOnboarding />
        </ThemeProvider>
      </body>
    </html>
  )
}
