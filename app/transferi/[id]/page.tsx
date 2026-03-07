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
  const today = formatDateInputValue(new Date())

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

          <div className="grid gap-1">
            <span className="text-sm font-medium">Vrijeme</span>
            <div className="flex gap-2">
              <select
                id="sat"
                defaultValue={defaultHour}
                className="h-10 rounded-md border bg-background px-3 text-sm flex-1"
              >
                <option value="">Sat</option>
                {hours.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
              <span className="flex items-center">:</span>
              <select
                id="minuta"
                defaultValue={defaultMinute}
                className="h-10 rounded-md border bg-background px-3 text-sm flex-1"
              >
                <option value="">Min</option>
                {minutes.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input type="hidden" name="vrijeme" id="vrijeme-hidden" defaultValue={timeValue} />
            </div>
          </div>
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

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="alarmEnabled"
            defaultChecked={transfer.alarmEnabled}
            className="h-4 w-4 rounded border"
          />
          <span>Uključi alarm notifikaciju za ovaj transfer</span>
        </label>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
        >
          Sačuvaj izmjene
        </button>
      </form>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const form = document.querySelector('form');
              const satSelect = document.getElementById('sat');
              const minutaSelect = document.getElementById('minuta');
              const vrijemeHidden = document.getElementById('vrijeme-hidden');

              function updateVrijeme() {
                const sat = satSelect.value.padStart(2, '0');
                const minuta = minutaSelect.value.padStart(2, '0');
                if (sat && minuta) {
                  vrijemeHidden.value = sat + ':' + minuta;
                }
              }

              satSelect.addEventListener('change', updateVrijeme);
              minutaSelect.addEventListener('change', updateVrijeme);

              form.addEventListener('submit', function(e) {
                if (!satSelect.value || !minutaSelect.value) {
                  e.preventDefault();
                  alert('Molimo odaberite i sat i minuta');
                  return false;
                }
                updateVrijeme();
              });
            })();
          `,
        }}
      />
    </main>
  )
}
