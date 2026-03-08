import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { sendWebPush } from "@/lib/web-push"
import { combineDateAndTimeUtc } from "@/actions/transfer-utils"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

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
    let sentForTransfer = 0

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
        if (isPushSubscriptionExpired(error)) {
          await prisma.pushSubscription.delete({ where: { endpoint: subscription.endpoint } })
        }
      }
    }

    let alarmMarkedAt: Date | null = null

    if (subscriptions.length === 0) {
      transfersPendingRetry += 1
    } else if (sentForTransfer === 0) {
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
  }

  return NextResponse.json({
    ok: true,
    transferTimeZone,
    dueTransfersCount: dueTransfers.length,
    processedTransfers,
    transfersMarkedAsSent,
    transfersPendingRetry,
    sentNotifications,
  })
}

export async function POST(request: Request) {
    return GET(request)
}
