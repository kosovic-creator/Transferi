import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { updateTransfer } from "@/actions/transferi"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type TransferEditPageProps = {
  params: Promise<{ id: string }>
}

function formatDateInputValue(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0")
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const year = date.getUTCFullYear()

  return `${year}-${month}-${day}`
}

function formatTimeInputValue(date: Date): string {
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

export default async function TransferEditPage({ params }: TransferEditPageProps) {
  const { id } = await params
  const today = formatDateInputValue(new Date())

  const transfer = await prisma.transfer.findUnique({ where: { id } })

  if (!transfer) {
    notFound()
  }

  async function handleUpdate(formData: FormData) {
    "use server"

    try {
      await updateTransfer(formData)
      redirect("/transferi?toast=updated")
    } catch {
      redirect("/transferi?toast=update-error")
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Izmijeni transfer</h1>
        <Link
          href="/transferi"
          className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
        >
          Nazad na listu
        </Link>
      </div>

      <form action={handleUpdate} className="grid gap-4 rounded-xl border bg-card p-4 sm:p-6">
        <input type="hidden" name="id" value={transfer.id} />

        <label className="grid gap-1">
          <span className="text-sm font-medium">Relacija</span>
          <select
            name="relacija"
            defaultValue={relacijaToValue(transfer.relacija)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="apartman-aerodrom">apartman-aerodrom</option>
            <option value="aerodrom-apartman">aerodrom-apartman</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Ostale relacije</span>
          <input
            name="ostaleRelacije"
            defaultValue={transfer.ostaleRelacije ?? ""}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Datum</span>
            <input
              type="date"
              name="datum"
              min={today}
              defaultValue={formatDateInputValue(transfer.datum)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Vrijeme</span>
            <input
              type="time"
              name="vrijeme"
              defaultValue={formatTimeInputValue(transfer.vrijeme)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Iznos</span>
            <input
              type="number"
              name="iznos"
              min="0"
              step="0.01"
              defaultValue={transfer.iznos}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Korisnik</span>
            <input
              name="korisnik"
              defaultValue={transfer.korisnik ?? ""}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            />
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
        >
          Sačuvaj izmjene
        </button>
      </form>
    </main>
  )
}
