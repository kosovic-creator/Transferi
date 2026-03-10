export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-sm">
        <p>Transferi aplikacija</p>
        <p>© {year} Sva prava zadržava, Draško Kosović.</p>
      </div>
    </footer>
  )
}