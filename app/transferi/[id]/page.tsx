import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { updateTransfer } from "@/actions/transferi"
import { prisma } from "@/lib/prisma"
import EditTransferForm from "@/components/edit-transfer-form"

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

function generateHoursOptions() {
  return Array.from({ length: 24 }, (_, i) => {
    const value = String(i).padStart(2, "0")
    return { value, label: value }
  })
}

function generateMinutesOptions() {
  return Array.from({ length: 60 }, (_, i) => {
    const value = String(i).padStart(2, "0")
    return { value, label: value }
  })
}

function relacijaToValue(relacija: "APARTMAN_AERODROM" | "AERODROM_APARTMAN"): string {
  if (relacija === "APARTMAN_AERODROM") {
    return "apartman-aerodrom"
  }

  return "aerodrom-apartman"
}

export default async function TransferEditPage({ params }: TransferEditPageProps) {
  const { id } = await params

  const transfer = await prisma.transfer.findUnique({ where: { id } })

  if (!transfer) {
    notFound()
  }

  const timeValue = formatTimeInputValue(transfer.vrijeme)
  const [defaultHour, defaultMinute] = timeValue.split(":")
  const hours = generateHoursOptions()
  const minutes = generateMinutesOptions()

  async function handleUpdate(formData: FormData) {
    "use server"

    try {
      await updateTransfer(formData)
    } catch {
      redirect("/?toast=update-error")
    }

    redirect("/?toast=updated")
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Izmijeni transfer</h1>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
        >
          Nazad na listu
        </Link>
      </div>

      <EditTransferForm
        action={handleUpdate}
        transferId={transfer.id}
        relacija={relacijaToValue(transfer.relacija)}
        brojLetaNapomena={transfer.brojLetaNapomena ?? ""}
        datum={formatDateInputValue(transfer.datum)}
        defaultHour={defaultHour}
        defaultMinute={defaultMinute}
        hours={hours}
        minutes={minutes}
        iznos={transfer.iznos}
        korisnik={transfer.korisnik ?? ""}
        brojTelefona={transfer.brojTelefona ?? ""}
      />
    </main>
  )
}
