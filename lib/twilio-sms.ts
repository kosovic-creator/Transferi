import twilio from "twilio"

type SendTransferReceivedSmsInput = {
  to: string
  transferId: string
  relacija: "APARTMAN_AERODROM" | "AERODROM_APARTMAN"
  datum: Date
  vrijeme: Date
}

export type SmsSendResult =
  | { status: "sent"; sid: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string }

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

  const to = normalizePhoneNumber(input.to)

  if (!to.startsWith("+")) {
    return {
      status: "failed",
      error: "Broj telefona mora biti u međunarodnom formatu (npr. +382...).",
    }
  }

  const client = twilio(accountSid, authToken)
  const body = [
    "Tvoj zahtjev za transfer je uspjesno primljen.",
    `Relacija: ${relacijaToValue(input.relacija)}`,
    `Termin: ${formatDateDisplay(input.datum)} ${formatTimeDisplay(input.vrijeme)}`,
    `ID: ${input.transferId}`,
  ].join("\n")

  try {
    const message = await client.messages.create({
      to,
      from,
      body,
    })

    return { status: "sent", sid: message.sid }
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Nepoznata greška pri slanju SMS-a.",
    }
  }
}
