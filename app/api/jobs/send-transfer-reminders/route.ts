import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { sendWebPush } from "@/lib/web-push"
import { combineDateAndTimeUtc } from "@/actions/transfer-utils"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getLocalNowDateAndTime(timeZone: string): { date: Date; time: Date } {
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

    const parts = formatter.formatToParts(new Date())
    const part = (type: Intl.DateTimeFormatPartTypes): string =>
        parts.find((p) => p.type === type)?.value ?? "00"

    const dateIso = `${part("year")}-${part("month")}-${part("day")}`
    const timeIso = `${part("hour")}:${part("minute")}:${part("second")}`

    return {
        date: new Date(`${dateIso}T00:00:00.000Z`),
        time: new Date(`1970-01-01T${timeIso}.000Z`),
    }
}

function isAuthorized(request: Request, cronSecret: string): boolean {
    const authorization = request.headers.get("authorization")
    if (authorization === `Bearer ${cronSecret}`) {
        return true
    }

    const url = new URL(request.url)
    const querySecret = url.searchParams.get("secret")
    return querySecret === cronSecret
}

function relacijaToLabel(relacija: "APARTMAN_AERODROM" | "AERODROM_APARTMAN"): string {
  if (relacija === "APARTMAN_AERODROM") {
    return "apartman-aerodrom"
  }

  return "aerodrom-apartman"
}

function isPushSubscriptionExpired(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const withStatus = error as Error & { statusCode?: number }
  return withStatus.statusCode === 404 || withStatus.statusCode === 410
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET nije postavljen." }, { status: 500 })
  }

    if (!isAuthorized(request, cronSecret)) {
    return NextResponse.json({ error: "Nedozvoljen pristup." }, { status: 401 })
  }

    const transferTimeZone = process.env.TRANSFER_TIMEZONE ?? "Europe/Podgorica"
    const localNow = getLocalNowDateAndTime(transferTimeZone)

  // Salji podsjetnik u prozoru oko 60 minuta prije transfera.
  const now = new Date()
  const reminderLeadMs = 60 * 60 * 1000
  const toleranceMs = 5 * 60 * 1000
  const windowStart = new Date(now.getTime() + reminderLeadMs - toleranceMs)
  const windowEnd = new Date(now.getTime() + reminderLeadMs + toleranceMs)

  const candidates = await prisma.transfer.findMany({
    where: {
      alarmEnabled: true,
      alarmSentAt: null,
    },
    orderBy: [{ datum: "asc" }, { vrijeme: "asc" }, { id: "asc" }],
    take: 500,
  })

  const dueTransfers: typeof candidates = []

  for (const transfer of candidates) {
    const correctedDatumVrijemeUtc = combineDateAndTimeUtc(
      transfer.datum,
      transfer.vrijeme,
      transferTimeZone
    )

    if (transfer.datumVrijemeUtc.getTime() !== correctedDatumVrijemeUtc.getTime()) {
      await prisma.transfer.update({
        where: { id: transfer.id },
        data: { datumVrijemeUtc: correctedDatumVrijemeUtc },
      })
    }

    if (
      correctedDatumVrijemeUtc.getTime() >= windowStart.getTime() &&
      correctedDatumVrijemeUtc.getTime() <= windowEnd.getTime()
    ) {
      dueTransfers.push({
        ...transfer,
        datumVrijemeUtc: correctedDatumVrijemeUtc,
      })
    }
  }

  let sentNotifications = 0
  let processedTransfers = 0
  let transfersMarkedAsSent = 0
  let transfersPendingRetry = 0
    const debugLog: Array<{
        transferId: string
        korisnik: string | null
        relacija: string
        datum: string
        vrijeme: string
        matchedBy: "userKey" | "fallback-all"
        subscriptionCount: number
        sentNotifications: number
        failedNotifications: number
        removedExpiredSubscriptions: number
      alarmMarkedAt: string | null
      retryReason: string | null
    }> = []

  for (const transfer of dueTransfers) {
    const userKey = transfer.korisnik?.trim()
      const subscriptionsForUser = await prisma.pushSubscription.findMany({
          where: userKey
              ? {
                  userKey: {
                      equals: userKey,
                      mode: "insensitive",
                  },
              }
              : undefined,
    })
      const subscriptions =
          subscriptionsForUser.length > 0
              ? subscriptionsForUser
              : await prisma.pushSubscription.findMany()
      const matchedBy = subscriptionsForUser.length > 0 ? "userKey" : "fallback-all"
      let sentForTransfer = 0
      let failedForTransfer = 0
      let removedExpiredForTransfer = 0

    const payload = {
      title: "Podsjetnik za transfer",
      body: `${relacijaToLabel(transfer.relacija)} za 1 sat - u ${transfer.vrijeme
        .toISOString()
        .slice(11, 16)}`,
      url: `/transferi/${transfer.id}`,
      transferId: transfer.id,
    }

    for (const subscription of subscriptions) {
      try {
        await sendWebPush(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dhKey,
              auth: subscription.authKey,
            },
          },
          payload
        )
        sentNotifications += 1
          sentForTransfer += 1
      } catch (error) {
          failedForTransfer += 1
        if (isPushSubscriptionExpired(error)) {
          await prisma.pushSubscription.delete({ where: { endpoint: subscription.endpoint } })
            removedExpiredForTransfer += 1
        }
      }
    }

    let alarmMarkedAt: Date | null = null
    let retryReason: string | null = null

    if (subscriptions.length === 0) {
      retryReason = "Nema aktivnih push pretplata."
      transfersPendingRetry += 1
    } else if (sentForTransfer === 0) {
      retryReason = "Svi pokušaji slanja su neuspješni."
      transfersPendingRetry += 1
    } else {
      alarmMarkedAt = new Date()
      await prisma.transfer.update({
        where: { id: transfer.id },
        data: { alarmSentAt: alarmMarkedAt },
      })
      transfersMarkedAsSent += 1
    }

    processedTransfers += 1
      debugLog.push({
          transferId: transfer.id,
          korisnik: transfer.korisnik,
          relacija: relacijaToLabel(transfer.relacija),
          datum: transfer.datum.toISOString().slice(0, 10),
          vrijeme: transfer.vrijeme.toISOString().slice(11, 19),
          matchedBy,
          subscriptionCount: subscriptions.length,
          sentNotifications: sentForTransfer,
          failedNotifications: failedForTransfer,
          removedExpiredSubscriptions: removedExpiredForTransfer,
        alarmMarkedAt: alarmMarkedAt?.toISOString() ?? null,
        retryReason,
      })
  }

  return NextResponse.json({
    ok: true,
      transferTimeZone,
      localNow: {
          date: localNow.date.toISOString().slice(0, 10),
          time: localNow.time.toISOString().slice(11, 19),
      },
    reminderWindow: "1 hour before transfer",
    reminderWindowStartUtc: windowStart.toISOString(),
    reminderWindowEndUtc: windowEnd.toISOString(),
      dueTransfersCount: dueTransfers.length,
    processedTransfers,
    transfersMarkedAsSent,
    transfersPendingRetry,
    sentNotifications,
      debugLog,
  })
}

export async function POST(request: Request) {
    return GET(request)
}
