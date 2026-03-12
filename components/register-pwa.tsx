"use client"

import { useEffect } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

// Module-level variable — captured as early as possible, before InstallAppButton mounts
let _deferredPrompt: BeforeInstallPromptEvent | null = null
const _listeners: Array<(e: BeforeInstallPromptEvent | null) => void> = []

export function getDeferredPrompt() {
  return _deferredPrompt
}

export function setDeferredPrompt(e: BeforeInstallPromptEvent | null) {
  _deferredPrompt = e
  _listeners.forEach((fn) => fn(e))
}

export function subscribeDeferredPrompt(
  fn: (e: BeforeInstallPromptEvent | null) => void
) {
  _listeners.push(fn)
  return () => {
    const i = _listeners.indexOf(fn)
    if (i !== -1) _listeners.splice(i, 1)
  }
}

export function RegisterPWA() {
  useEffect(() => {
    // Register SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }

    // Capture beforeinstallprompt as early as possible
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  return null
}
