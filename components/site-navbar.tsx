"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
//   { href: "/", label: "Početna" },
  { href: "/transferi/dodaj", label: "Dodaj transfer" },
  { href: "/transferi/arhiva", label: "Arhiva" },
]

export function SiteNavbar() {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === "/") {
      return pathname === "/"
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-wide sm:text-base">
          Transferi
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-md px-2 py-1 text-xs font-medium transition sm:px-3 sm:text-sm ${
                isActive(item.href)
                  ? "bg-slate-900 text-white"
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