import Link from "next/link"
import { redirect } from "next/navigation"

import { deleteTransfer, getTransferi } from "@/actions/transferi"
import { DeleteTransferDialog } from "@/app/transferi/delete-transfer-dialog"
import { TransferiToast } from "@/app/transferi/transferi-toast"

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

type HomePageProps = {
  searchParams: Promise<{ toast?: string }>
}

export default async function Home({ searchParams }: HomePageProps) {
  const { toast } = await searchParams
  const transferi = await getTransferi()

  async function handleDelete(formData: FormData) {
    "use server"

    try {
      await deleteTransfer(formData)
    } catch {
      redirect("/?toast=delete-error")
    }
    redirect("/?toast=deleted")
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100/60">
      <TransferiToast type={toast} />

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-6 rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Transferi</h1>
              <p className="text-sm text-muted-foreground">
                Pregled, izmjena i brisanje transfera na jednom mjestu.
              </p>
            </div>

           <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                href="/transferi/dodaj"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Dodaj transfer
              </Link>

              <Link
                href="/transferi/arhiva"
                className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium hover:bg-muted"
              >
                Arhiva
              </Link>
            </div>
           </div>
        </div>

        {transferi.length === 0 ? (
          <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            Nema unesenih transfera.
          </div>
        ) : null}

        <div className="grid gap-3 md:hidden">
          {transferi.map((transfer) => (
            <article key={transfer.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{relacijaToValue(transfer.relacija)}</p>
                  <p className="text-sm font-medium text-muted-foreground">
                    Datum: <span className="text-foreground">{formatDateDisplay(transfer.datum)}</span>
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    Vrijeme: <span className="text-foreground">{formatTimeDisplay(transfer.vrijeme)}</span>
                  </p>
                </div>
                <p className="text-sm font-medium">{transfer.iznos.toFixed(2)} EUR</p>
              </div>

              <p className="mb-3 text-sm text-muted-foreground">
                Korisnik: <span className="font-medium text-foreground">{transfer.korisnik ?? "-"}</span>
              </p>

              <p className="mb-3 text-sm text-muted-foreground">
                Broj leta / odakle dolazi:{" "}
                <span className="font-medium text-foreground">{transfer.brojLetaNapomena ?? "-"}</span>
              </p>

              <p className="mb-3 text-sm text-muted-foreground">
                Telefon korisnika: <span className="font-medium text-foreground">{transfer.brojTelefona ?? "-"}</span>
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/transferi/${transfer.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
                >
                  Izmijeni
                </Link>

                <DeleteTransferDialog
                  id={transfer.id}
                  datum={formatDateDisplay(transfer.datum)}
                  vrijeme={formatTimeDisplay(transfer.vrijeme)}
                  relacija={relacijaToValue(transfer.relacija)}
                  action={handleDelete}
                />
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-sm md:block">
          <table className="w-full min-w-225 border-collapse text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">Datum</th>
                <th className="px-3 py-2">Vrijeme</th>
                <th className="px-3 py-2">Relacija</th>
                <th className="px-3 py-2">Iznos</th>
                <th className="px-3 py-2">Korisnik</th>
                <th className="px-3 py-2">Broj leta / odakle dolazi</th>
                <th className="px-3 py-2">Telefon korisnika</th>
                <th className="px-3 py-2">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {transferi.map((transfer) => (
                <tr key={transfer.id} className="border-t align-top">
                  <td className="px-3 py-2">{formatDateDisplay(transfer.datum)}</td>
                  <td className="px-3 py-2">{formatTimeDisplay(transfer.vrijeme)}</td>
                  <td className="px-3 py-2">{relacijaToValue(transfer.relacija)}</td>
                  <td className="px-3 py-2">{transfer.iznos.toFixed(2)}</td>
                  <td className="px-3 py-2">{transfer.korisnik ?? "-"}</td>
                  <td className="px-3 py-2">{transfer.brojLetaNapomena ?? "-"}</td>
                  <td className="px-3 py-2">{transfer.brojTelefona ?? "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-start gap-2">
                      <Link
                        href={`/transferi/${transfer.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-muted"
                      >
                        Izmijeni
                      </Link>

                      <DeleteTransferDialog
                        id={transfer.id}
                        datum={formatDateDisplay(transfer.datum)}
                        vrijeme={formatTimeDisplay(transfer.vrijeme)}
                        relacija={relacijaToValue(transfer.relacija)}
                        action={handleDelete}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
