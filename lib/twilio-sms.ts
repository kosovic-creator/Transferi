import twilio from "twilio"

type SendTransferReceivedSmsInput = {
  transferId: string
  relacija: "APARTMAN_AERODROM" | "AERODROM_APARTMAN"
  datum: Date
  vrijeme: Date
  korisnik: string
  brojLetaNapomena: string
}

const DRIVER_SMS_NUMBER = "+38267135355"

export type SmsSendResult =
  | {
    status: "sent"
    sid: string
    to: string
    twilioStatus: string
    errorCode?: number | null
    errorMessage?: string | null
  }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string }

const TERMINAL_FAILURE_STATUSES = new Set(["failed", "undelivered", "canceled"])
const TERMINAL_SUCCESS_STATUSES = new Set(["delivered"])

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function formatDateDisplay(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0")
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const year = date.getUTCFullYear()

  return `${day}.${month}.${year}`
}

function formatTimeDisplay(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")

  return `${hours}:${minutes}`
}

function relacijaToValue(relacija: "APARTMAN_AERODROM" | "AERODROM_APARTMAN"): string {
  if (relacija === "APARTMAN_AERODROM") {
    return "apartman-aerodrom"
  }

  return "aerodrom-apartman"
}

function compactText(value: string, maxLen: number): string {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLen) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, maxLen - 1))}…`
}

function normalizePhoneNumber(rawValue: string): string {
  const compact = rawValue.replace(/[\s()-]/g, "")

  if (compact.startsWith("00")) {
    return `+${compact.slice(2)}`
  }

  return compact
}

export async function sendTransferReceivedSms(
  input: SendTransferReceivedSmsInput
): Promise<SmsSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !from) {
    return {
      status: "skipped",
      reason: "Twilio varijable nisu kompletno podešene.",
    }
  }

  const to = normalizePhoneNumber(DRIVER_SMS_NUMBER)

  if (!to.startsWith("+")) {
    return {
      status: "failed",
      error: "Broj telefona mora biti u međunarodnom formatu (npr. +382...).",
    }
  }

  const client = twilio(accountSid, authToken)
  const korisnikShort = compactText(input.korisnik, 22)
  const letShort = compactText(input.brojLetaNapomena, 18)
  const relacijaShort = relacijaToValue(input.relacija)
    .replace("apartman-aerodrom", "A->AP")
    .replace("aerodrom-apartman", "AP->A")

  // Keep body concise to avoid Twilio trial segment-length rejection (error 30044).
  const body = `Transfer ${formatDateDisplay(input.datum)} ${formatTimeDisplay(input.vrijeme)} | ${relacijaShort} | Kor:${korisnikShort} | Let:${letShort}`

  try {
    const message = await client.messages.create({
      to,
      from,
      body,
    })

    let latestStatus = String(message.status ?? "unknown")
    let latestErrorCode: number | null | undefined = message.errorCode
    let latestErrorMessage: string | null | undefined = message.errorMessage

    // Twilio often returns queued/accepted initially; poll briefly for a more final state.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (
        TERMINAL_FAILURE_STATUSES.has(latestStatus) ||
        TERMINAL_SUCCESS_STATUSES.has(latestStatus)
      ) {
        break
      }

      await sleep(1000)
      const refreshed = await client.messages(message.sid).fetch()
      latestStatus = String(refreshed.status ?? latestStatus)
      latestErrorCode = refreshed.errorCode
      latestErrorMessage = refreshed.errorMessage
    }

    if (TERMINAL_FAILURE_STATUSES.has(latestStatus)) {
      const code = latestErrorCode ? ` (kod ${latestErrorCode})` : ""
      const details = latestErrorMessage ? ` - ${latestErrorMessage}` : ""
      return {
        status: "failed",
        error: `Twilio status: ${latestStatus}${code}${details}`,
      }
    }

    return {
      status: "sent",
      sid: message.sid,
      to,
      twilioStatus: latestStatus,
      errorCode: latestErrorCode,
      errorMessage: latestErrorMessage,
    }
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Nepoznata greška pri slanju SMS-a.",
    }
  }
}

export async function sendTransferUpdatedSms(
  input: SendTransferReceivedSmsInput
): Promise<SmsSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !from) {
    return {
      status: "skipped",
      reason: "Twilio varijable nisu kompletno podešene.",
    }
  }

  const to = normalizePhoneNumber(DRIVER_SMS_NUMBER)

  if (!to.startsWith("+")) {
    return {
      status: "failed",
      error: "Broj telefona mora biti u međunarodnom formatu (npr. +382...).",
    }
  }

  const client = twilio(accountSid, authToken)
  const korisnikShort = compactText(input.korisnik, 22)
  const letShort = compactText(input.brojLetaNapomena, 18)
  const relacijaShort = relacijaToValue(input.relacija)
    .replace("apartman-aerodrom", "A->AP")
    .replace("aerodrom-apartman", "AP->A")

  const body = `IZMJENA: ${formatDateDisplay(input.datum)} ${formatTimeDisplay(input.vrijeme)} | ${relacijaShort} | Kor:${korisnikShort} | Let:${letShort}`

  try {
    const message = await client.messages.create({
      to,
      from,
      body,
    })

    let latestStatus = String(message.status ?? "unknown")
    let latestErrorCode: number | null | undefined = message.errorCode
    let latestErrorMessage: string | null | undefined = message.errorMessage

    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (
        TERMINAL_FAILURE_STATUSES.has(latestStatus) ||
        TERMINAL_SUCCESS_STATUSES.has(latestStatus)
      ) {
        break
      }

      await sleep(1000)
      const refreshed = await client.messages(message.sid).fetch()
      latestStatus = String(refreshed.status ?? latestStatus)
      latestErrorCode = refreshed.errorCode
      latestErrorMessage = refreshed.errorMessage
    }

    if (TERMINAL_FAILURE_STATUSES.has(latestStatus)) {
      const code = latestErrorCode ? ` (kod ${latestErrorCode})` : ""
      const details = latestErrorMessage ? ` - ${latestErrorMessage}` : ""
      return {
        status: "failed",
        error: `Twilio status: ${latestStatus}${code}${details}`,
      }
    }

    return {
      status: "sent",
      sid: message.sid,
      to,
      twilioStatus: latestStatus,
      errorCode: latestErrorCode,
      errorMessage: latestErrorMessage,
    }
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Nepoznata greška pri slanju SMS-a.",
    }
  }
}

export async function sendTransferDeletedSms(
  input: SendTransferReceivedSmsInput
): Promise<SmsSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !from) {
    return {
      status: "skipped",
      reason: "Twilio varijable nisu kompletno podešene.",
    }
  }

  const to = normalizePhoneNumber(DRIVER_SMS_NUMBER)

  if (!to.startsWith("+")) {
    return {
      status: "failed",
      error: "Broj telefona mora biti u međunarodnom formatu (npr. +382...).",
    }
  }

  const client = twilio(accountSid, authToken)
  const korisnikShort = compactText(input.korisnik, 22)
  const letShort = compactText(input.brojLetaNapomena, 18)
  const relacijaShort = relacijaToValue(input.relacija)
    .replace("apartman-aerodrom", "A->AP")
    .replace("aerodrom-apartman", "AP->A")

  const body = `OBRISAN: ${formatDateDisplay(input.datum)} ${formatTimeDisplay(input.vrijeme)} | ${relacijaShort} | Kor:${korisnikShort} | Let:${letShort}`

  try {
    const message = await client.messages.create({
      to,
      from,
      body,
    })

    let latestStatus = String(message.status ?? "unknown")
    let latestErrorCode: number | null | undefined = message.errorCode
    let latestErrorMessage: string | null | undefined = message.errorMessage

    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (
        TERMINAL_FAILURE_STATUSES.has(latestStatus) ||
        TERMINAL_SUCCESS_STATUSES.has(latestStatus)
      ) {
        break
      }

      await sleep(1000)
      const refreshed = await client.messages(message.sid).fetch()
      latestStatus = String(refreshed.status ?? latestStatus)
      latestErrorCode = refreshed.errorCode
      latestErrorMessage = refreshed.errorMessage
    }

    if (TERMINAL_FAILURE_STATUSES.has(latestStatus)) {
      const code = latestErrorCode ? ` (kod ${latestErrorCode})` : ""
      const details = latestErrorMessage ? ` - ${latestErrorMessage}` : ""
      return {
        status: "failed",
        error: `Twilio status: ${latestStatus}${code}${details}`,
      }
    }

    return {
      status: "sent",
      sid: message.sid,
      to,
      twilioStatus: latestStatus,
      errorCode: latestErrorCode,
      errorMessage: latestErrorMessage,
    }
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Nepoznata greška pri slanju SMS-a.",
    }
  }
}
