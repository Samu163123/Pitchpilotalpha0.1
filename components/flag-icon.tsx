"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import type { LanguageCode } from "@/lib/store"
import { countryCodeFor, languageOptions } from "@/lib/i18n"

interface FlagIconProps {
  code: LanguageCode
  size?: number // width in px (height inferred as 2/3 of width)
  className?: string
}

export function FlagIcon({ code, size = 24, className }: FlagIconProps) {
  const [localFailed, setLocalFailed] = useState(false)
  const [cdnFailed, setCdnFailed] = useState(false)
  const cc = countryCodeFor(code)
  const width = size
  const height = Math.round((size * 2) / 3)
  const emoji = useMemo(() => languageOptions.find(o => o.code === code)?.flag ?? "🏳️", [code])

  // If both local and CDN fail, render emoji fallback
  if (localFailed && cdnFailed) {
    return <span className={className} style={{ fontSize: Math.round(size * 0.8) }}>{emoji}</span>
  }

  const src = !localFailed
    ? `/flags/${cc}.svg`
    : `https://flagcdn.com/w${Math.max(20, Math.min(48, size))}/${cc}.png`

  return (
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      className={className}
      onError={() => {
        if (!localFailed) setLocalFailed(true)
        else setCdnFailed(true)
      }}
    />
  )
}
