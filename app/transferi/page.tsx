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

type TransferiPageProps = {
	searchParams: Promise<{ toast?: string }>
}

export default async function TransferiPage({ searchParams }: TransferiPageProps) {
	const { toast } = await searchParams
	const transferi = await getTransferi()

	async function handleDelete(formData: FormData) {
		"use server"

		try {
			await deleteTransfer(formData)
		} catch {
			redirect("/transferi?toast=delete-error")
		}
		redirect("/transferi?toast=deleted")
	}

	return (
		<main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
			<TransferiToast type={toast} />

			<div className="mb-6 flex items-center justify-between gap-3">
				<h1 className="text-2xl font-semibold">Transferi</h1>
				<div className="flex items-center gap-2">
					<Link
						href="/transferi/arhiva"
						className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
					>
						Arhiva
					</Link>
					<Link
						href="/transferi/dodaj"
						className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted"
					>
						Dodaj transfer
					</Link>
				</div>
			</div>

			<div className="overflow-x-auto rounded-xl border">
				<table className="w-full min-w-[900px] border-collapse text-sm">
					<thead className="bg-muted/50 text-left">
						<tr>
							<th className="px-3 py-2">Datum</th>
							<th className="px-3 py-2">Vrijeme</th>
							<th className="px-3 py-2">Relacija</th>
							<th className="px-3 py-2">Iznos</th>
							<th className="px-3 py-2">Korisnik</th>
							<th className="px-3 py-2">Akcije</th>
						</tr>
					</thead>
					<tbody>
						{transferi.length === 0 ? (
							<tr>
								<td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
									Nema unesenih transfera.
								</td>
							</tr>
						) : (
							transferi.map((transfer) => (
								<tr key={transfer.id} className="border-t align-top">
									<td className="px-3 py-2">{formatDateDisplay(transfer.datum)}</td>
									<td className="px-3 py-2">{formatTimeDisplay(transfer.vrijeme)}</td>
									<td className="px-3 py-2">{relacijaToValue(transfer.relacija)}</td>
									<td className="px-3 py-2">{transfer.iznos.toFixed(2)}</td>
									<td className="px-3 py-2">{transfer.korisnik ?? "-"}</td>
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
							))
						)}
					</tbody>
				</table>
			</div>
		</main>
	)
}
