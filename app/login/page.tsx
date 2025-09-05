"use client"

import { AuthButtons } from "@/components/auth-buttons"

export default function LoginPage() {
  return (
    <div className="container mx-auto px-6 py-24 max-w-xl">
      <h1 className="text-3xl font-bold mb-4">Sign in</h1>
      <p className="text-muted-foreground mb-8">Log in to save your training history and sync across devices.</p>
      <div className="border rounded-xl p-6 bg-card">
        <AuthButtons />
      </div>
    </div>
  )
}
