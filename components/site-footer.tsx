export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="glass-shell glass-shell-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/35 bg-[rgb(255_252_246_/_0.68)] shadow-[0_-8px_24px_rgb(79_58_33_/_0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgb(255_252_246_/_0.62)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-sm">
        <p>Transferi aplikacija</p>
        <p>© {year} Sva prava zadržava, Draško Kosović.</p>
      </div>
    </footer>
  )
}