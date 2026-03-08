import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

type SubscribeRequest = {
  userKey?: string
  subscription?: {
    endpoint?: string
    keys?: {
      p256dh?: string
      auth?: string
    }
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as SubscribeRequest
  const userKey = body.userKey?.trim() || "global"
  const endpoint = body.subscription?.endpoint
  const p256dhKey = body.subscription?.keys?.p256dh
  const authKey = body.subscription?.keys?.auth

  if (!endpoint || !p256dhKey || !authKey) {
    return NextResponse.json({ error: "Neispravna push subscription vrijednost." }, { status: 400 })
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userKey,
      endpoint,
      p256dhKey,
      authKey,
    },
    update: {
      userKey,
      p256dhKey,
      authKey,
    },
  })

  return NextResponse.json({ ok: true })
}
