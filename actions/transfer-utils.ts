import { prisma } from "@/lib/prisma"

export type RelacijaValue = "APARTMAN_AERODROM" | "AERODROM_APARTMAN"
export type TransferRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.transfer.findFirst>>
>
export type ArhivaRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.arhivaTransfera.findFirst>>
>

export function parseDateOnly(value: Date | string): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("Neispravan datum.")
    }
    return value
  }

  const trimmed = value.trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T00:00:00.000Z`)
    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    throw new Error("Neispravan datum format.")
  }

  return date
}

export function parseTimeOnly(value: Date | string): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("Neispravno vrijeme.")
    }
    return value
  }

  const trimmed = value.trim()

  if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const withSeconds = trimmed.length === 5 ? `${trimmed}:00` : trimmed
    const time = new Date(`1970-01-01T${withSeconds}.000Z`)
    if (!Number.isNaN(time.getTime())) {
      return time
    }
  }

  const time = new Date(trimmed)
  if (Number.isNaN(time.getTime())) {
    throw new Error("Neispravan format vremena.")
  }

  return time
}

export function parseRelacija(rawValue: string): RelacijaValue {
  if (rawValue === "APARTMAN_AERODROM" || rawValue === "apartman-aerodrom") {
    return "APARTMAN_AERODROM"
  }

  if (rawValue === "AERODROM_APARTMAN" || rawValue === "aerodrom-apartman") {
    return "AERODROM_APARTMAN"
  }

  throw new Error("Neispravna relacija.")
}

export function sanitizeString(value?: string | null): string | null {
  if (value == null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function getRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Polje \"${key}\" je obavezno.`)
  }

  return value.trim()
}

export function getOptionalString(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== "string") {
    return null
  }

  return sanitizeString(value)
}

export function getOptionalNumber(formData: FormData, key: string): number | undefined {
  const value = formData.get(key)

  if (typeof value !== "string" || !value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    throw new Error(`Polje \"${key}\" mora biti broj.`)
  }

  return parsed
}
