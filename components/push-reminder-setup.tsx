"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

function isIosSafari(): boolean {
  const ua = navigator.userAgent.toLowerCase()
  const isIos = /iphone|ipad|ipod/.test(ua)
  const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua)
  return isIos && isSafari
}

function isStandaloneMode(): boolean {
  const standaloneMatch = window.matchMedia("(display-mode: standalone)").matches
  const standaloneNavigator =
    typeof (navigator as Navigator & { standalone?: boolean }).standalone === "boolean"
      ? Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
      : false

  return standaloneMatch || standaloneNavigator
}

function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)

  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i)
  }

  return output.buffer
}

export function PushReminderSetup() {
  const [userKey, setUserKey] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function enablePush() {
    try {
      setBusy(true)
      setStatus(null)

      const trimmedUserKey = userKey.trim()

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("Ovaj browser ne podržava push notifikacije.")
        return
      }

      if (isIosSafari() && !isStandaloneMode()) {
        setStatus(
          "Na iPhone-u prvo instaliraj aplikaciju (Share -> Add to Home Screen), pa iz otvorene ikone klikni Uključi."
        )
        return
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        setStatus("Nedostaje NEXT_PUBLIC_VAPID_PUBLIC_KEY u konfiguraciji.")
        return
      }

      const permission = await Notification.requestPermission()

      if (permission !== "granted") {
        setStatus("Notifikacije nisu dozvoljene.")
        return
      }

      await navigator.serviceWorker.register("/sw.js")
      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()

      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToArrayBuffer(vapidPublicKey),
        }))

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userKey: trimmedUserKey,
          subscription,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error ?? "Neuspjela prijava na push servis.")
      }

      setStatus("Podsetnici su uključeni za ovaj telefon. Testiraj sada slanje iz forme.")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Greška pri uključivanju podsetnika.")
    } finally {
      setBusy(false)
    }
  }

  async function disablePush() {
    try {
      setBusy(true)
      setStatus(null)

      const registration = await navigator.serviceWorker.getRegistration("/sw.js")
      const subscription = registration
        ? await registration.pushManager.getSubscription()
        : null

      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        await subscription.unsubscribe()
      }

      setStatus("Podsetnici su isključeni na ovom telefonu.")
    } catch {
      setStatus("Greška pri isključivanju podsetnika.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm">
      <h2 className="text-base font-semibold">Alarm na telefonu</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Uključi podsjetnike za ovaj telefon. Korisnik je opcion (za ciljanje po imenu).
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        iPhone: push radi iz instalirane Home Screen aplikacije, ne iz običnog Safari taba.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Korisnik</span>
          <Input
            value={userKey}
            onChange={(event) => setUserKey(event.target.value)}
            placeholder="Opcionalno: isto ime kao u transferu"

          />
        </label>

        <Button
          type="button"
          onClick={enablePush}
          disabled={busy}

        >
          Uključi
        </Button>

        <Button
          type="button"
          onClick={disablePush}
          disabled={busy}

        >
          Isključi
        </Button>
      </div>

      {status ? <p className="mt-3 text-sm text-muted-foreground">{status}</p> : null}
    </section>
  )
}
