export default function Loading() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div className="px-4 py-3 rounded-md bg-background border shadow-sm flex items-center gap-3">
        <svg className="animate-spin text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  )
}
