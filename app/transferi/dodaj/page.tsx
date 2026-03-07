"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"

import { createTransfer } from "@/actions/transferi"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

function SubmitButton() {
	const { pending } = useFormStatus()

	return (
		<Button type="submit" disabled={pending} className="w-full sm:w-auto">
			{pending ? "Spremam..." : "Sačuvaj transfer"}
		</Button>
	)
}

export default function DodajTransferPage() {
	const router = useRouter()
	const [relacija, setRelacija] = useState("")
	const [datum, setDatum] = useState<Date | undefined>()
	const [isCalendarOpen, setIsCalendarOpen] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const today = useMemo(() => {
		const now = new Date()
		now.setHours(0, 0, 0, 0)
		return now
	}, [])

	const datumString = useMemo(() => {
		if (!datum) {
			return ""
		}

		return format(datum, "yyyy-MM-dd")
	}, [datum])

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-10">
			<div className="mb-8 space-y-2">
				<h1 className="text-2xl font-semibold">Novi transfer</h1>
				<p className="text-sm text-muted-foreground">
					Unesi relaciju, datum, vrijeme i ostale detalje transfera.
				</p>
			</div>

			<form
				className="space-y-5 rounded-xl border bg-card p-4 sm:p-6"
				action={async (formData) => {
					setError(null)

					try {
						await createTransfer(formData)
						toast.success("Transfer je uspjesno dodat.")
						setRelacija("")
						setDatum(undefined)
						setTimeout(() => {
							router.push("/transferi")
						}, 800)
					} catch (e) {
						const message =
							e instanceof Error ? e.message : "Greška pri čuvanju transfera."
						setError(message)
						toast.error(message)
					}
				}}
			>
				<input type="hidden" name="relacija" value={relacija} required />
				<input type="hidden" name="datum" value={datumString} required />

				<div className="space-y-2">
					<label className="text-sm font-medium">Relacija</label>
					<Select value={relacija} onValueChange={(value) => setRelacija(value ?? "")}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Izaberi relaciju" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="apartman-aerodrom">
								apartman-aerodrom
							</SelectItem>
							<SelectItem value="aerodrom-apartman">
								aerodrom-apartman
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium">Ostale relacije (opciono)</label>
					<Input name="ostaleRelacije" placeholder="Npr. grad-hotel" />
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium">Datum</label>
					<div className="flex flex-col gap-2 sm:flex-row">
						<Input
							value={datum ? format(datum, "dd.MM.yyyy") : ""}
							readOnly
							placeholder="Izaberi datum"
						/>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsCalendarOpen(true)}
						>
							Otvori kalendar
						</Button>
					</div>
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium">Vrijeme</label>
					<Input name="vrijeme" type="time" required />
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium">Iznos</label>
					<Input name="iznos" type="number" min="0" step="0.01" defaultValue="20" />
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium">Korisnik (opciono)</label>
					<Input name="korisnik" placeholder="Ime korisnika" />
				</div>

				{error ? <p className="text-sm text-red-600">{error}</p> : null}

				<SubmitButton />
			</form>

			<Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Izaberi datum transfera</DialogTitle>
						<DialogDescription>
							Odabrani datum će biti sačuvan u polje datum.
						</DialogDescription>
					</DialogHeader>

					<Calendar
						mode="single"
						selected={datum}
						disabled={{ before: today }}
						onSelect={(selected) => {
							setDatum(selected)
							if (selected) {
								setIsCalendarOpen(false)
							}
						}}
						className="mx-auto"
					/>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setIsCalendarOpen(false)}>
							Zatvori
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	)
}
