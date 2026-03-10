"use client"

import Link from "next/link"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { ChatAdminToggle } from "@/components/chat-admin-toggle"

const navItems = [
//   { href: "/", label: "Početna" },
  { href: "/transferi/dodaj", label: "Dodaj transfer" },
  { href: "/transferi/arhiva", label: "Arhiva" },
]

export function SiteNavbar() {
  const pathname = usePathname()

  useEffect(() => {
    const root = document.documentElement

    const updateScrollState = () => {
      root.classList.toggle("scrolled-shell", window.scrollY > 8)
    }

    updateScrollState()
    window.addEventListener("scroll", updateScrollState, { passive: true })

    return () => {
      window.removeEventListener("scroll", updateScrollState)
      root.classList.remove("scrolled-shell")
    }
  }, [])

  function isActive(href: string): boolean {
    if (href === "/") {
      return pathname === "/"
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="glass-shell glass-shell-top sticky top-0 z-30 border-b border-white/35 bg-[rgb(255_252_246_/_0.68)] shadow-[0_8px_24px_rgb(79_58_33_/_0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgb(255_252_246_/_0.62)]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-wide sm:text-base">
          Transferi
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <ChatAdminToggle />
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-md px-2 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                isActive(item.href)
                ? "bg-[rgb(62_45_30_/_0.92)] text-[rgb(255_248_238)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}