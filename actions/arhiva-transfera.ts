"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import {
  type ArhivaRecord,
  type RelacijaValue,
  type TransferRecord,
  getRequiredString,
  parseDateOnly,
  parseRelacija,
} from "@/actions/transfer-utils"

export type ArhivaQueryOptions = {
  page?: number
  pageSize?: number
  korisnik?: string
  relacija?: string
  datumOd?: string
  datumDo?: string
  datumSort?: "asc" | "desc"
  vrijemeSort?: "asc" | "desc"
}

export type ArhivaQueryParams = {
  page?: string
  pageSize?: string
  korisnik?: string
  relacija?: string
  datumOd?: string
  datumDo?: string
  datumSort?: "asc" | "desc"
  vrijemeSort?: "asc" | "desc"
}

export type ArhivaQueryResult = {
  items: ArhivaRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ArhivaMonthlySummary = {
  totalTransfers: number
  totalIznos: number
}

type ArhivaWhere = {
  korisnik?: { contains: string; mode: "insensitive" }
  relacija?: RelacijaValue
  datum?: { gte?: Date; lte?: Date }
}

type NormalizedArhivaQuery = {
  page: number
  pageSize: number
  korisnik?: string
  relacija?: RelacijaValue
  datumOd?: Date
  datumDo?: Date
  datumSort: "asc" | "desc"
  vrijemeSort: "asc" | "desc"
}

function normalizeArhivaQuery(options: ArhivaQueryOptions): NormalizedArhivaQuery {
  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 10))
  const korisnik = options.korisnik?.trim() || undefined
  const relacijaRaw = options.relacija?.trim()
  const datumOd = options.datumOd?.trim() ? parseDateOnly(options.datumOd) : undefined
  const datumDo = options.datumDo?.trim() ? parseDateOnly(options.datumDo) : undefined

  if (datumOd && datumDo && datumOd.getTime() > datumDo.getTime()) {
    throw new Error("Neispravan period datuma: 'datumOd' mora biti manji ili jednak 'datumDo'.")
  }

  return {
    page,
    pageSize,
    korisnik,
    relacija: relacijaRaw ? parseRelacija(relacijaRaw) : undefined,
    datumOd,
    datumDo,
    datumSort: options.datumSort === "asc" ? "asc" : "desc",
    vrijemeSort: options.vrijemeSort === "asc" ? "asc" : "desc",
  }
}

function buildArhivaWhere(query: NormalizedArhivaQuery): ArhivaWhere {
  const where: ArhivaWhere = {}

  if (query.korisnik) {
    where.korisnik = {
      contains: query.korisnik,
      mode: "insensitive",
    }
  }

  if (query.relacija) {
    where.relacija = query.relacija
  }

  if (query.datumOd || query.datumDo) {
    where.datum = {}

    if (query.datumOd) {
      where.datum.gte = query.datumOd
    }

    if (query.datumDo) {
      where.datum.lte = query.datumDo
    }
  }

  return where
}

export async function getArhivaTransferaQuery(
  options: ArhivaQueryOptions
): Promise<ArhivaQueryResult> {
  const query = normalizeArhivaQuery(options)
  const where = buildArhivaWhere(query)

  const [items, total] = await prisma.$transaction([
    prisma.arhivaTransfera.findMany({
      where,
      orderBy: [{ datum: query.datumSort }, { vrijeme: query.vrijemeSort }, { id: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.arhivaTransfera.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize))

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages,
  }
}

export async function getArhivaCurrentMonthSummary(): Promise<ArhivaMonthlySummary> {
  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const startOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

  const aggregate = await prisma.arhivaTransfera.aggregate({
    _count: { _all: true },
    _sum: { iznos: true },
    where: {
      datum: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      },
    },
  })

  return {
    totalTransfers: aggregate._count._all,
    totalIznos: aggregate._sum.iznos ?? 0,
  }
}

export async function restoreTransferFromArhiva(
  formData: FormData
): Promise<TransferRecord> {
  const id = getRequiredString(formData, "id")

  const restored = await prisma.$transaction(async (tx) => {
    const archived = await tx.arhivaTransfera.findUnique({ where: { id } })

    if (!archived) {
      throw new Error("Transfer nije pronađen u arhivi.")
    }

    const existing = await tx.transfer.findUnique({ where: { id } })
    if (existing) {
      throw new Error("Transfer sa istim ID već postoji.")
    }

    const created = await tx.transfer.create({
      data: {
        id: archived.id,
        relacija: archived.relacija,
        ostaleRelacije: archived.ostaleRelacije,
        iznos: archived.iznos,
        datum: archived.datum,
        vrijeme: archived.vrijeme,
        datumVrijemeUtc: archived.datumVrijemeUtc,
        alarmEnabled: archived.alarmEnabled,
        alarmSentAt: archived.alarmSentAt,
        korisnik: archived.korisnik,
        brojTelefona: archived.brojTelefona,
      },
    })

    await tx.arhivaTransfera.delete({ where: { id } })

    return created
  })

  revalidatePath("/transferi")
  revalidatePath("/transferi/arhiva")

  return restored
}
