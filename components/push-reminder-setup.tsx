"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"

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

      const registration = await navigator.serviceWorker.register("/sw.js")
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
        throw new Error("Neuspjela prijava na push servis.")
      }

      setStatus("Podsetnici su uključeni za ovaj telefon.")
    } catch {
      setStatus("Greška pri uključivanju podsetnika.")
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
