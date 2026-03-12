"use client"

import { toast } from "sonner"
import { usePwaInstall } from "@/components/use-pwa-install"

export function SiteFooter() {
  const year = new Date().getFullYear()
  const { canInstall, installed, ios, promptInstall } = usePwaInstall()

  async function handleInstallClick() {
    if (ios) {
      toast("Safari > Share > Add to Home Screen")
      return
    }

    const result = await promptInstall()

    if (result === "unavailable") {
      toast("Chrome > meni sa tri tačke > Install Transferi ili Install page as app")
    }
  }

  return (
    <footer className="glass-shell glass-shell-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/35 bg-[rgb(255_252_246/0.68)] shadow-[0_-8px_24px_rgb(79_58_33/0.08)] backdrop-blur-xl supports-backdrop-filter:bg-[rgb(255_252_246/0.62)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-sm">
        <div className="flex items-center gap-3">
          <p>Transferi aplikacija</p>
          {!installed ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className="rounded-full border border-[rgb(62_45_30/0.12)] px-3 py-1 text-[11px] font-medium text-[rgb(62_45_30)] transition hover:bg-[rgb(62_45_30/0.06)] sm:text-xs"
            >
              {ios ? "Kako instalirati" : canInstall ? "Instaliraj aplikaciju" : "Kako instalirati"}
            </button>
          ) : null}
        </div>
        <p>© {year} Sva prava zadržava, Draško Kosović.</p>
      </div>
    </footer>
  )
}