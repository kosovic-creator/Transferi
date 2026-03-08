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

function getZonedParts(date: Date, timeZone: string): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
} {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((p) => p.type === type)?.value
    return Number(value ?? "0")
  }

  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
    hour: part("hour"),
    minute: part("minute"),
    second: part("second"),
  }
}

export function combineDateAndTimeUtc(
  datum: Date,
  vrijeme: Date,
  timeZone = "UTC"
): Date {
  if (Number.isNaN(datum.getTime()) || Number.isNaN(vrijeme.getTime())) {
    throw new Error("Neispravan datum ili vrijeme.")
  }

  const year = datum.getUTCFullYear()
  const month = datum.getUTCMonth() + 1
  const day = datum.getUTCDate()
  const hour = vrijeme.getUTCHours()
  const minute = vrijeme.getUTCMinutes()
  const second = vrijeme.getUTCSeconds()

  if (timeZone === "UTC") {
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  }

  // Convert local wall-clock date/time in given timezone to a UTC instant.
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, second)
  let utcGuess = targetAsUtc

  for (let i = 0; i < 4; i += 1) {
    const zoned = getZonedParts(new Date(utcGuess), timeZone)
    const zonedAsUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second
    )
    const delta = targetAsUtc - zonedAsUtc

    if (delta === 0) {
      break
    }

    utcGuess += delta
  }

  return new Date(utcGuess)
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
