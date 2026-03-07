import Link from "next/link"
import { redirect } from "next/navigation"

import {
  type ArhivaQueryParams,
  type ArhivaQueryOptions,
  getArhivaTransferaQuery,
  restoreTransferFromArhiva,
} from "@/actions/arhiva-transfera"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

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

type ArhivaPageProps = {
  searchParams: Promise<ArhivaQueryParams & {
    status?: string
  }>
}

function sanitizeReturnTo(path: string): string {
  if (!path.startsWith("/transferi/arhiva")) {
    return "/transferi/arhiva"
  }

  return path
}

function withPage(url: URLSearchParams, page: number): string {
  const next = new URLSearchParams(url)
  next.set("page", String(page))
  return `/transferi/arhiva?${next.toString()}`
}

function toArhivaQueryOptions(params: ArhivaQueryParams): ArhivaQueryOptions {
  const page = Number(params.page ?? "1")
  const pageSize = Number(params.pageSize ?? "10")

  return {
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 10,
    korisnik: params.korisnik ?? "",
    relacija: params.relacija ?? "",
    datumOd: params.datumOd ?? "",
    datumDo: params.datumDo ?? "",
    datumSort: params.datumSort === "asc" ? "asc" : "desc",
    vrijemeSort: params.vrijemeSort === "asc" ? "asc" : "desc",
  }
}

export default async function ArhivaTransferaPage({ searchParams }: ArhivaPageProps) {
  const params = await searchParams
  const options: ArhivaQueryOptions = toArhivaQueryOptions(params)

  const { query, queryError } = await (async () => {
    try {
      const data = await getArhivaTransferaQuery(options)
      return { query: data, queryError: null as string | null }
    } catch (error) {
      return {
        query: {
          items: [],
          total: 0,
          page: options.page ?? 1,
          pageSize: options.pageSize ?? 10,
          totalPages: 1,
        },
        queryError:
          error instanceof Error ? error.message : "Greška pri učitavanju arhive.",
      }
    }
  })()

  const korisnik = options.korisnik ?? ""
  const relacija = options.relacija ?? ""
  const datumOd = options.datumOd ?? ""
  const datumDo = options.datumDo ?? ""
  const datumSort = options.datumSort ?? "desc"
  const vrijemeSort = options.vrijemeSort ?? "desc"

  const baseParams = new URLSearchParams()
  if (korisnik) baseParams.set("korisnik", korisnik)
  if (relacija) baseParams.set("relacija", relacija)
  if (datumOd) baseParams.set("datumOd", datumOd)
  if (datumDo) baseParams.set("datumDo", datumDo)
  baseParams.set("datumSort", datumSort)
  baseParams.set("vrijemeSort", vrijemeSort)
  baseParams.set("pageSize", String(query.pageSize))

  const returnTo = withPage(baseParams, query.page)

  async function handleRestore(formData: FormData) {
    "use server"

    const targetRaw = formData.get("returnTo")
    const target =
      typeof targetRaw === "string" ? sanitizeReturnTo(targetRaw) : "/transferi/arhiva"

    try {
      await restoreTransferFromArhiva(formData)
      const separator = target.includes("?") ? "&" : "?"
      redirect(`${target}${separator}status=restored`)
    } catch {
      const separator = target.includes("?") ? "&" : "?"
      redirect(`${target}${separator}status=restore-error`)
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Arhiva transfera</h1>
        <Link
                  href="/"
          className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
        >
          Nazad na transferi
        </Link>
      </div>

      {params.status === "restored" ? (
        <p className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Transfer je uspjesno vracen iz arhive.
        </p>
      ) : null}

      {params.status === "restore-error" ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Neuspjelo vracanje transfera iz arhive.
        </p>
      ) : null}

      {queryError ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {queryError}
        </p>
      ) : null}

      <form className="mb-4 grid gap-3 rounded-xl border p-3 sm:grid-cols-2 lg:grid-cols-4" method="get">
        <input type="hidden" name="page" value="1" />

        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Korisnik</span>
          <input
            name="korisnik"
            defaultValue={korisnik}
            placeholder="Pretraga korisnika"
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Relacija</span>
          <select
            name="relacija"
            defaultValue={relacija}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Sve</option>
            <option value="apartman-aerodrom">apartman-aerodrom</option>
            <option value="aerodrom-apartman">aerodrom-apartman</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Datum od</span>
          <input
            type="date"
            name="datumOd"
            defaultValue={datumOd}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Datum do</span>
          <input
            type="date"
            name="datumDo"
            defaultValue={datumDo}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Sort datum</span>
          <select
            name="datumSort"
            defaultValue={datumSort}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="desc">Najnoviji datum</option>
            <option value="asc">Najstariji datum</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Sort vrijeme</span>
          <select
            name="vrijemeSort"
            defaultValue={vrijemeSort}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="desc">Kasnije vrijeme</option>
            <option value="asc">Ranije vrijeme</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Po stranici</span>
          <select
            name="pageSize"
            defaultValue={String(query.pageSize)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            Primijeni
          </button>
          <Link
            href="/transferi/arhiva"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            Reset
          </Link>
        </div>
      </form>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Vrijeme</TableHead>
              <TableHead>Relacija</TableHead>
              <TableHead>Ostale relacije</TableHead>
              <TableHead>Iznos</TableHead>
              <TableHead>Korisnik</TableHead>
              <TableHead className="text-right">Akcija</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Arhiva je prazna.
                </TableCell>
              </TableRow>
            ) : (
              query.items.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>{formatDateDisplay(transfer.datum)}</TableCell>
                  <TableCell>{formatTimeDisplay(transfer.vrijeme)}</TableCell>
                  <TableCell>{relacijaToValue(transfer.relacija)}</TableCell>
                  <TableCell>{transfer.ostaleRelacije ?? "-"}</TableCell>
                  <TableCell>{transfer.iznos.toFixed(2)}</TableCell>
                  <TableCell>{transfer.korisnik ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <form action={handleRestore} className="inline-flex">
                      <input type="hidden" name="id" value={transfer.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
                      >
                        Vrati iz arhive
                      </button>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Ukupno: {query.total} | Stranica {query.page} od {query.totalPages}
        </p>

        <div className="flex items-center gap-2">
          <Link
            href={withPage(baseParams, Math.max(1, query.page - 1))}
            aria-disabled={query.page <= 1}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            Prethodna
          </Link>
          <Link
            href={withPage(baseParams, Math.min(query.totalPages, query.page + 1))}
            aria-disabled={query.page >= query.totalPages}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            Sljedeca
          </Link>
        </div>
      </div>
    </main>
  )
}
