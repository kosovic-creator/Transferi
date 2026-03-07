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

    if (type === "deleted") {
      toast.success("Transfer je uspjesno obrisan.")
    }

    if (type === "create-error") {
      toast.error("Neuspjesno dodavanje transfera.")
    }

    if (type === "update-error") {
      toast.error("Neuspjesna izmjena transfera.")
    }

    if (type === "delete-error") {
      toast.error("Neuspjesno brisanje transfera.")
    }

    lastShown.current = type
  }, [type])

  return null
}
