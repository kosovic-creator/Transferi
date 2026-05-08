"use client"

import { useState } from "react"

type Option = {
    value: string
    label: string
}

type EditTransferFormProps = {
    action: (formData: FormData) => void
    transferId: string
    relacija: string
    brojLetaNapomena: string
    datum: string
    defaultHour: string
    defaultMinute: string
    hours: Option[]
    minutes: Option[]
    iznos: number | null
    korisnik: string
    brojTelefona: string
}

export default function EditTransferForm({
    action,
    transferId,
    relacija,
    brojLetaNapomena,
    datum,
    defaultHour,
    defaultMinute,
    hours,
    minutes,
    iznos,
    korisnik,
    brojTelefona,
}: EditTransferFormProps) {
    const [selectedRelacija, setSelectedRelacija] = useState(relacija)
    const isApartmanAerodrom = selectedRelacija === "apartman-aerodrom"

    return (
        <form action={action} className="grid gap-4 rounded-xl border bg-card p-4 sm:p-6">
            <input type="hidden" name="id" value={transferId} />

            <label className="grid gap-1">
                <span className="text-sm font-medium">Relacija</span>
                <select
                    name="relacija"
                    value={selectedRelacija}
                    onChange={(event) => setSelectedRelacija(event.target.value)}
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                    <option value="apartman-aerodrom">apartman-aerodrom</option>
                    <option value="aerodrom-apartman">aerodrom-apartman</option>
                </select>
            </label>

            {!isApartmanAerodrom ? (
                <label className="grid gap-1">
                    <span className="text-sm font-medium">Broj leta ili odakle dolazi *</span>
                    <input
                        name="brojLetaNapomena"
                        defaultValue={brojLetaNapomena}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    />
                </label>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1">
                    <span className="text-sm font-medium">Datum</span>
                    <input
                        type="date"
                        name="datum"
                        defaultValue={datum}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    />
                </label>

                <div className="grid gap-1">
                    <span className="text-sm font-medium">Vrijeme</span>
                    <div className="flex gap-2">
                        <select
                            id="sat"
                            aria-label="Sat"
                            name="sat"
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
                            aria-label="Minuta"
                            name="minuta"
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
                        defaultValue={iznos ?? undefined}
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                    />
                </label>

                {!isApartmanAerodrom ? (
                    <label className="grid gap-1">
                        <span className="text-sm font-medium">Korisnik *</span>
                        <input
                            name="korisnik"
                            defaultValue={korisnik}
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                        />
                    </label>
                ) : null}

                <label className="grid gap-1 sm:col-span-2">
                    <span className="text-sm font-medium">Telefon korisnika (opciono)</span>
                    <input
                        name="brojTelefona"
                        defaultValue={brojTelefona}
                        placeholder="npr. +38269111222"
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
    )
}
