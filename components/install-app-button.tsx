"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  getDeferredPrompt,
  setDeferredPrompt,
  subscribeDeferredPrompt,
} from "@/components/register-pwa"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone
}

export function InstallAppButton() {
  const [deferredPrompt, setLocalPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => getDeferredPrompt()
  )
  const [isInstalled, setIsInstalled] = useState(false)

  const ios = useMemo(() => isIosDevice(), [])

  useEffect(() => {
    setIsInstalled(isStandaloneDisplayMode())

    // Sync with the module-level prompt (in case event fired before this component mounted)
    setLocalPrompt(getDeferredPrompt())

    const unsub = subscribeDeferredPrompt((e) => {
      setLocalPrompt(e as BeforeInstallPromptEvent | null)
    })

    function handleAppInstalled() {
      setIsInstalled(true)
      setDeferredPrompt(null)
      toast.success("Aplikacija je instalirana")
    }

    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      unsub()
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        toast.success("Install prompt je potvrden")
      }

      setDeferredPrompt(null)
      setLocalPrompt(null)
      return
    }

    if (ios) {
      toast("Safari > Share > Add to Home Screen")
      return
    }

    toast("Install nije dostupan u ovom browseru")
  }

  if (isInstalled) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleInstallClick}
      className="text-xs"
      title="Instaliraj aplikaciju"
    >
      Install app
    </Button>
  )
}