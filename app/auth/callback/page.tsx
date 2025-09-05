"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth callback error:', error)
        router.push('/sign-in?error=' + encodeURIComponent(error.message))
        return
      }

      if (data.session) {
        const redirectTo = searchParams?.get('redirect') || '/train/setup'
        router.push(redirectTo)
      } else {
        router.push('/sign-in')
      }
    }

    handleAuthCallback()
  }, [router, searchParams, supabase])

  return (
    <div className="container mx-auto px-6 py-24 max-w-md text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p>Completing sign in...</p>
    </div>
  )
}
