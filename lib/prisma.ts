import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

declare global {
  var __prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL nije postavljen.")
}

function normalizeSslMode(urlString: string): string {
  try {
    const parsed = new URL(urlString)
    const sslMode = parsed.searchParams.get("sslmode")

    if (sslMode === "prefer" || sslMode === "require" || sslMode === "verify-ca") {
      // pg warns that these values will change semantics; use explicit secure mode.
      parsed.searchParams.set("sslmode", "verify-full")
      return parsed.toString()
    }

    return urlString
  } catch {
    return urlString
  }
}

const normalizedConnectionString = normalizeSslMode(connectionString)

const pool = new Pool({ connectionString: normalizedConnectionString })
const adapter = new PrismaPg(pool)

export const prisma = globalThis.__prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma
}
