import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { sendWebPush } from "@/lib/web-push"

export const runtime = "nodejs"

type SendNowRequest = {
  userKey?: string
  relacija?: string
  datum?: string
  vrijeme?: string
}

function isPushSubscriptionExpired(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const withStatus = error as Error & { statusCode?: number }
  return withStatus.statusCode === 404 || withStatus.statusCode === 410
}

export async function POST(request: Request) {
  const body = (await request.json()) as SendNowRequest
  const userKey = body.userKey?.trim()

  const subscriptions = userKey
    ? await prisma.pushSubscription.findMany({
      where: {
        userKey: {
          equals: userKey,
          mode: "insensitive",
        },
      },
    })
    : await prisma.pushSubscription.findMany()

  if (subscriptions.length === 0) {
    return NextResponse.json(
      {
        error: userKey
          ? "Nema aktivnih push pretplata za ovog korisnika."
          : "Nema aktivnih push pretplata za slanje notifikacije.",
      },
      { status: 404 }
    )
  }

  const when = [body.datum?.trim(), body.vrijeme?.trim()].filter(Boolean).join(" ")
  const details = [body.relacija?.trim(), when].filter(Boolean).join(" | ")

  const payload = {
    title: "Transfer push test",
    body: details ? `Odmah poslata notifikacija: ${details}` : "Odmah poslata push notifikacija.",
    url: "/",
    sentAt: new Date().toISOString(),
  }

  let sentCount = 0
  let failedCount = 0
  let removedExpiredCount = 0
  const failureReasons = new Map<string, number>()

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
      sentCount += 1
    } catch (error) {
      failedCount += 1

      const errorMessage = error instanceof Error ? error.message : "Nepoznata greška pri slanju."
      failureReasons.set(errorMessage, (failureReasons.get(errorMessage) ?? 0) + 1)

      if (isPushSubscriptionExpired(error)) {
        await prisma.pushSubscription.delete({ where: { endpoint: subscription.endpoint } })
        removedExpiredCount += 1
      }
    }
  }

  if (sentCount === 0 && failedCount > 0) {
    return NextResponse.json(
      {
        error: "Push slanje nije uspjelo ni za jednu pretplatu.",
        sentCount,
        failedCount,
        removedExpiredCount,
        matchedSubscriptions: subscriptions.length,
        matchedBy: userKey ? "userKey" : "fallback-all",
        failureReasons: Array.from(failureReasons.entries()).map(([reason, count]) => ({
          reason,
          count,
        })),
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    ok: true,
    sentCount,
    failedCount,
    removedExpiredCount,
    matchedSubscriptions: subscriptions.length,
    matchedBy: userKey ? "userKey" : "fallback-all",
  })
}
