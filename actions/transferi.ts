"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import {
  combineDateAndTimeUtc,
  type TransferRecord,
  getOptionalNumber,
  getOptionalString,
  getRequiredString,
  parseDateOnly,
  parseRelacija,
  parseTimeOnly,
} from "@/actions/transfer-utils"
import { sendTransferReceivedSms, type SmsSendResult } from "@/lib/twilio-sms"

function addMinutesToTime(time: Date, minutes: number): Date {
  return new Date(time.getTime() + minutes * 60 * 1000)
}

async function assertNoTransferOverlap(
  datum: Date,
  vrijeme: Date,
  excludeId?: string
): Promise<void> {
  const from = addMinutesToTime(vrijeme, -60)
  const to = addMinutesToTime(vrijeme, 60)

  const existing = await prisma.transfer.findFirst({
    where: {
      datum,
      vrijeme: {
        gte: from,
        lte: to,
      },
      ...(excludeId
        ? {
          id: {
            not: excludeId,
          },
        }
        : {}),
    },
    orderBy: [{ vrijeme: "asc" }, { id: "asc" }],
  })

  if (!existing) {
    return
  }

  const existingTime = existing.vrijeme.toISOString().slice(11, 16)
  throw new Error(
    `Postoji preklapanje transfera (+/- 1 sat) sa postojećim terminom u ${existingTime}.`
  )
}

export async function getTransferi(): Promise<TransferRecord[]> {
  return prisma.transfer.findMany({
    orderBy: [{ datum: "desc" }, { vrijeme: "desc" }, { id: "desc" }],
  })
}

export async function getTransferById(
  formData: FormData
): Promise<TransferRecord | null> {
  const id = getRequiredString(formData, "id")

  return prisma.transfer.findUnique({ where: { id } })
}

export async function createTransfer(formData: FormData): Promise<TransferRecord> {
  const transferTimeZone = process.env.TRANSFER_TIMEZONE ?? "Europe/Podgorica"
  const relacija = parseRelacija(getRequiredString(formData, "relacija"))
  const datum = parseDateOnly(getRequiredString(formData, "datum"))
  const vrijeme = parseTimeOnly(getRequiredString(formData, "vrijeme"))
  const datumVrijemeUtc = combineDateAndTimeUtc(datum, vrijeme, transferTimeZone)
  const alarmEnabled = formData.get("alarmEnabled") === "on"

  await assertNoTransferOverlap(datum, vrijeme)

  const transfer = await prisma.transfer.create({
    data: {
      relacija,
      ostaleRelacije: getOptionalString(formData, "ostaleRelacije"),
      iznos: getOptionalNumber(formData, "iznos"),
      datum,
      vrijeme,
      datumVrijemeUtc,
      alarmEnabled,
      korisnik: getOptionalString(formData, "korisnik"),
      brojTelefona: getOptionalString(formData, "brojTelefona"),
    },
  })

  revalidatePath("/transferi")
  revalidatePath("/")
  revalidatePath("/transferi/dodaj")

  return transfer
}

type CreateTransferResult =
  | { ok: true; transfer: TransferRecord; sms: SmsSendResult }
  | { ok: false; error: string }

export async function createTransferSafe(formData: FormData): Promise<CreateTransferResult> {
  try {
    const transfer = await createTransfer(formData)
    let sms: SmsSendResult = {
      status: "skipped",
      reason: "Broj telefona nije unesen.",
    }

    if (transfer.brojTelefona) {
      sms = await sendTransferReceivedSms({
        to: transfer.brojTelefona,
        transferId: transfer.id,
        relacija: transfer.relacija,
        datum: transfer.datum,
        vrijeme: transfer.vrijeme,
      })
    }

    return { ok: true, transfer, sms }
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Greška pri čuvanju transfera."

    return { ok: false, error: message }
  }
}

export async function updateTransfer(formData: FormData): Promise<TransferRecord> {
  const transferTimeZone = process.env.TRANSFER_TIMEZONE ?? "Europe/Podgorica"
  const id = getRequiredString(formData, "id")

  const rawRelacija = formData.get("relacija")
  const rawDatum = formData.get("datum")
  const rawVrijeme = formData.get("vrijeme")
  const rawSat = formData.get("sat")
  const rawMinuta = formData.get("minuta")
  const alarmEnabled = formData.get("alarmEnabled") === "on"

  const current = await prisma.transfer.findUnique({ where: { id } })

  if (!current) {
    throw new Error("Transfer nije pronađen.")
  }

  const nextDatum =
    typeof rawDatum === "string" && rawDatum.trim()
      ? parseDateOnly(rawDatum.trim())
      : current.datum
  const explicitVrijeme =
    typeof rawVrijeme === "string" && rawVrijeme.trim()
      ? rawVrijeme.trim()
      : null

  const sat = typeof rawSat === "string" ? rawSat.trim() : ""
  const minuta = typeof rawMinuta === "string" ? rawMinuta.trim() : ""
  const vrijemeFromParts = sat && minuta ? `${sat}:${minuta}` : null

  const nextVrijeme = vrijemeFromParts
    ? parseTimeOnly(vrijemeFromParts)
    : explicitVrijeme
      ? parseTimeOnly(explicitVrijeme)
      : current.vrijeme

  const datumVrijemeUtc = combineDateAndTimeUtc(nextDatum, nextVrijeme, transferTimeZone)

  await assertNoTransferOverlap(nextDatum, nextVrijeme, id)

  const shouldResetAlarmSentAt =
    current.datumVrijemeUtc.getTime() !== datumVrijemeUtc.getTime() ||
    current.alarmEnabled !== alarmEnabled

  const transfer = await prisma.transfer.update({
    where: { id },
    data: {
      relacija:
        typeof rawRelacija === "string" && rawRelacija.trim()
          ? parseRelacija(rawRelacija.trim())
          : undefined,
      ostaleRelacije: formData.has("ostaleRelacije")
        ? getOptionalString(formData, "ostaleRelacije")
        : undefined,
      iznos: getOptionalNumber(formData, "iznos"),
      datum: nextDatum,
      vrijeme: nextVrijeme,
      datumVrijemeUtc,
      alarmEnabled,
      alarmSentAt: shouldResetAlarmSentAt ? null : undefined,
      korisnik: formData.has("korisnik")
        ? getOptionalString(formData, "korisnik")
        : undefined,
      brojTelefona: formData.has("brojTelefona")
        ? getOptionalString(formData, "brojTelefona")
        : undefined,
    },
  })

  revalidatePath("/transferi")
  revalidatePath("/")
  revalidatePath("/transferi/arhiva")

  return transfer
}

export async function deleteTransfer(formData: FormData): Promise<TransferRecord> {
  const id = getRequiredString(formData, "id")

  const transfer = await prisma.$transaction(async (tx) => {
    const deleted = await tx.transfer.delete({ where: { id } })

    await tx.arhivaTransfera.create({
      data: {
        id: deleted.id,
        relacija: deleted.relacija,
        ostaleRelacije: deleted.ostaleRelacije,
        iznos: deleted.iznos,
        datum: deleted.datum,
        vrijeme: deleted.vrijeme,
        datumVrijemeUtc: deleted.datumVrijemeUtc,
        alarmEnabled: deleted.alarmEnabled,
        alarmSentAt: deleted.alarmSentAt,
        korisnik: deleted.korisnik,
        brojTelefona: deleted.brojTelefona,
      },
    })

    return deleted
  })

  revalidatePath("/transferi")
  revalidatePath("/")
  revalidatePath("/transferi/arhiva")

  return transfer
}
