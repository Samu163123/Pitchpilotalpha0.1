"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useLanguageStore } from "@/lib/store"
import { languageOptions, useI18n, flagUrlFor } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import Image from "next/image"

export function LanguageOnboarding() {
  const supabase = getSupabaseBrowserClient()
  const { t } = useI18n()
  const hasChosen = useLanguageStore((s) => s.hasChosenLanguage)
  const setHasChosen = useLanguageStore((s) => s.setHasChosenLanguage)
  const lang = useLanguageStore((s) => s.language)
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const [open, setOpen] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setIsAuthed(!!data.session)
      if (data.session && !hasChosen) setOpen(true)
    })
    const sub = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthed(!!session)
      if (session && !hasChosen) setOpen(true)
    })
    return () => { mounted = false; sub.data.subscription.unsubscribe() }
  }, [supabase, hasChosen])

  if (!isAuthed) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle>{t("choose_language")}</DialogTitle>
          <DialogDescription>{t("choose_language_desc")}</DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto mt-4 p-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {languageOptions.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLanguage(opt.code)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                  lang === opt.code 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md' 
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="flex-shrink-0 inline-flex" aria-hidden>
                  <Image
                    src={flagUrlFor(opt.code as any, 40)}
                    alt=""
                    width={28}
                    height={20}
                    className="rounded-sm ring-1 ring-black/10 dark:ring-white/10"
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {opt.label}
                  </div>
                  {opt.note && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                      {opt.note}
                    </div>
                  )}
                </div>
                {lang === opt.code && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
          <Button
            onClick={() => {
              setHasChosen(true)
              setOpen(false)
            }}
          >
            {t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
