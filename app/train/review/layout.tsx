// Server layout for /train/review segment to control rendering behavior
export const dynamic = "force-dynamic"
export const revalidate = false

import type { ReactNode } from "react"

export default function ReviewLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
