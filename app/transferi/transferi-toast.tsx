"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

type TransferiToastProps = {
  type?: string
}

export function TransferiToast({ type }: TransferiToastProps) {
  const lastShown = useRef<string | null>(null)

  useEffect(() => {
    if (!type || lastShown.current === type) {
      return
    }

    if (type === "created") {
      toast.success("Transfer je uspjesno dodat.")
    }

    if (type === "updated") {
      toast.success("Transfer je uspjesno izmijenjen.")
    }

    if (type === "executed") {
      toast.success("Transfer je označen kao izvršen i premješten u arhivu.")
    }

    if (type === "deleted") {
      toast.success("Transfer je trajno obrisan.")
    }

    if (type === "restored") {
      toast.success("Transfer je uspjesno vracen iz arhive.")
    }

    if (type === "create-error") {
      toast.error("Neuspjesno dodavanje transfera.")
    }

    if (type === "update-error") {
      toast.error("Neuspjesna izmjena transfera.")
    }

    if (type === "execute-error") {
      toast.error("Neuspjelo izvršavanje transfera.")
    }

    if (type === "delete-error") {
      toast.error("Neuspjesno trajno brisanje transfera.")
    }

    if (type === "restore-error") {
      toast.error("Neuspjelo vracanje transfera iz arhive.")
    }

    lastShown.current = type
  }, [type])

  return null
}
