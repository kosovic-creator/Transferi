"use client"

import { useEffect } from "react"
import { usePwaInstall } from "@/components/use-pwa-install"

export function InstallBanner() {
  const { canInstall, dismissInstall, ios, promptInstall, shouldShowBanner } =
    usePwaInstall()

    useEffect(() => {
        if (!shouldShowBanner) return

        const timeoutId = window.setTimeout(() => {
            dismissInstall()
        }, 7000)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [dismissInstall, shouldShowBanner])

  if (!shouldShowBanner) return null

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-24 z-50 sm:inset-x-auto sm:right-4 sm:w-auto">
      <div className="pointer-events-auto rounded-2xl border border-[rgb(62_45_30/0.12)] bg-[rgb(255_252_246/0.92)] px-4 py-3 shadow-[0_14px_40px_rgb(79_58_33/0.08)] backdrop-blur-xl sm:max-w-xs">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(62_45_30/0.08)] text-[rgb(62_45_30)]">
            +
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[rgb(62_45_30)]">Instaliraj Transferi</p>
            {ios ? (
              <p className="mt-1 text-xs leading-5 text-[rgb(99_78_51)]">
                Otvori u Safariju, pa izaberi Share i Add to Home Screen.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-5 text-[rgb(99_78_51)]">
                Dodaj aplikaciju na uređaj za brži pristup i pun ekran.
              </p>
            )}

            <div className="mt-3 flex items-center gap-2">
              {canInstall ? (
                <button
                  type="button"
                  onClick={promptInstall}
                  className="rounded-full bg-[rgb(62_45_30)] px-3 py-1.5 text-xs font-semibold text-[rgb(255_248_238)] transition hover:bg-[rgb(83_63_42)]"
                >
                  Instaliraj
                </button>
              ) : null}
              <button
                type="button"
                onClick={dismissInstall}
                aria-label="Zatvori"
                className="rounded-full border border-[rgb(62_45_30/0.12)] px-3 py-1.5 text-xs font-medium text-[rgb(99_78_51)] transition hover:bg-[rgb(62_45_30/0.06)]"
              >
                Kasnije
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
