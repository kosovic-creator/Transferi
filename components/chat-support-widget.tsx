"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { PhoneCallIcon, MessageCircleIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    $crisp?: unknown[][]
    CRISP_WEBSITE_ID?: string
  }
}

const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID?.trim()
const mandatoryChatRoutes = ["/", "/transferi/*"]
const chatAllowedRoutesRaw = process.env.NEXT_PUBLIC_CHAT_ALLOWED_ROUTES ?? ""
const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() ?? ""
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? ""
const operatorName =
  process.env.NEXT_PUBLIC_CHAT_OPERATOR_NAME?.trim() ?? "Transferi podrska"
const initialMessage =
  process.env.NEXT_PUBLIC_CHAT_INITIAL_MESSAGE?.trim() ??
  `Pozdrav! Ja sam ${operatorName}. Kako mogu da pomognem?`

function normalizeRouteMatchers(raw: string): string[] {
  return raw
    .split(",")
    .map((route) => route.trim())
    .filter(Boolean)
}

function matchesRoute(pathname: string, matcher: string): boolean {
  if (matcher === pathname) return true

  if (matcher.endsWith("/*")) {
    const base = matcher.slice(0, -1)
    return pathname.startsWith(base)
  }

  if (matcher.endsWith("*")) {
    const base = matcher.slice(0, -1)
    return pathname.startsWith(base)
  }

  return false
}

function normalizeWhatsappNumber(numberValue: string): string {
  return numberValue.replace(/\D/g, "")
}

function pushCrisp(command: unknown[]) {
  if (!window.$crisp) return
  window.$crisp.push(command)
}

export function ChatSupportWidget() {
  const pathname = usePathname()
  const [isGloballyEnabled, setIsGloballyEnabled] = useState<boolean>(true)
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const hasInitializedCrisp = useRef(false)
  const routeMatchers = useMemo(
    () => {
      const fromEnv = normalizeRouteMatchers(chatAllowedRoutesRaw)
      return Array.from(new Set([...mandatoryChatRoutes, ...fromEnv]))
    },
    []
  )

  const shouldRenderOnThisRoute = useMemo(() => {
    return routeMatchers.some((matcher) => matchesRoute(pathname, matcher))
  }, [pathname, routeMatchers])

  const shouldShowWidget = shouldRenderOnThisRoute && isGloballyEnabled

  const canShowFallback =
    shouldShowWidget && isOnline === false && (supportPhone || whatsappNumber)

  useEffect(() => {
    let cancelled = false

    async function loadChatStatus() {
      try {
        const response = await fetch("/api/chat/settings", {
          method: "GET",
          cache: "no-store",
        })

        if (!response.ok) return

        const data = (await response.json()) as { enabled?: boolean }

        if (!cancelled && typeof data.enabled === "boolean") {
          setIsGloballyEnabled(data.enabled)
        }
      } catch {
        // Keep chat enabled if status endpoint is temporarily unavailable.
      }
    }

    void loadChatStatus()

    return () => {
      cancelled = true
    }
  }, [pathname])

  useEffect(() => {
    function handleSettingsChanged(event: Event) {
      const customEvent = event as CustomEvent<{ enabled?: boolean }>
      const enabled = customEvent.detail?.enabled

      if (typeof enabled === "boolean") {
        setIsGloballyEnabled(enabled)
      }
    }

    window.addEventListener("chat-settings-changed", handleSettingsChanged)

    return () => {
      window.removeEventListener("chat-settings-changed", handleSettingsChanged)
    }
  }, [])

  useEffect(() => {
    if (!crispWebsiteId) return
    if (!shouldShowWidget) return

    window.$crisp = window.$crisp ?? []
    window.CRISP_WEBSITE_ID = crispWebsiteId

    if (!document.getElementById("crisp-sdk")) {
      const script = document.createElement("script")
      script.id = "crisp-sdk"
      script.src = "https://client.crisp.chat/l.js"
      script.async = true
      document.head.appendChild(script)
    }

    if (!hasInitializedCrisp.current) {
      hasInitializedCrisp.current = true

      pushCrisp(["config", "locale:code", ["sr"]])
      // Postavlja boju widgeta na crnu
      pushCrisp(["config", "color:theme", ["black"]])
      pushCrisp(["set", "session:data", [[["Operater", operatorName]]]])
      pushCrisp([
        "on",
        "website:availability:changed",
        (websiteAvailable: boolean) => {
          setIsOnline(Boolean(websiteAvailable))
        },
      ])

      if (initialMessage) {
        pushCrisp(["do", "message:compose", [initialMessage]])
      }
    }

    pushCrisp(["do", "chat:show"])
  }, [shouldShowWidget])

  useEffect(() => {
    if (!window.$crisp) return

    if (shouldShowWidget) {
      pushCrisp(["do", "chat:show"])
      return
    }

    pushCrisp(["do", "chat:hide"])
  }, [shouldShowWidget])

  if (!canShowFallback) return null

  const cleanWhatsappNumber = normalizeWhatsappNumber(whatsappNumber)
  const whatsappText = encodeURIComponent(
    "Zdravo, treba mi pomoc oko transfera."
  )
  const whatsappHref = cleanWhatsappNumber
    ? `https://wa.me/${cleanWhatsappNumber}?text=${whatsappText}`
    : ""

  return (
    <div className="fixed bottom-4 left-4 z-50 rounded-xl border bg-card/95 p-3 shadow-xl backdrop-blur-sm">
      <p className="mb-2 text-xs text-muted-foreground">Operater trenutno nije online</p>
      <div className="flex items-center gap-2">
        {supportPhone ? (
          <a
            href={`tel:${supportPhone}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <PhoneCallIcon />
            Pozovi
          </a>
        ) : null}
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            <MessageCircleIcon />
            WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  )
}