"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguageStore } from "@/lib/store"
import { languageOptions, flagUrlFor } from "@/lib/i18n"
import Image from "next/image"

export function LanguageSwitcher() {
  const lang = useLanguageStore((s) => s.language)
  const setLanguage = useLanguageStore((s) => s.setLanguage)
  const setHasChosenLanguage = useLanguageStore((s) => s.setHasChosenLanguage)
  const [open, setOpen] = useState(false)

  const current = useMemo(() => languageOptions.find((o) => o.code === lang) || languageOptions[0], [lang])

  const handleSelect = (code: string) => {
    setLanguage(code as any)
    setHasChosenLanguage(true)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 px-3 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm"
        >
          <span className="mr-2 inline-flex" aria-hidden>
            <Image
              src={flagUrlFor(lang, 24)}
              alt=""
              width={18}
              height={12}
              className="rounded-sm ring-1 ring-black/10 dark:ring-white/10"
            />
          </span>
          <span className="text-sm font-medium hidden sm:inline">{current.label.split(' ')[0]}</span>
          <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-2 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-xl rounded-lg"
        sideOffset={8}
      >
        <div className="max-h-96 overflow-y-auto">
          <div className="grid gap-1">
            {languageOptions.map((opt) => (
              <button
                key={opt.code}
                onClick={() => handleSelect(opt.code)}
                className={`flex items-center gap-3 w-full p-3 rounded-md text-left transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  lang === opt.code 
                    ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' 
                    : 'hover:shadow-sm'
                }`}
              >
                <span className="flex-shrink-0 inline-flex" aria-hidden>
                  <Image
                    src={flagUrlFor(opt.code as any, 32)}
                    alt=""
                    width={24}
                    height={16}
                    className="rounded-sm ring-1 ring-black/10 dark:ring-white/10"
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {opt.label}
                  </div>
                  {opt.note && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {opt.note}
                    </div>
                  )}
                </div>
                {lang === opt.code && (
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
