"use client"

import { useFormStatus } from "react-dom"
import { Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

function ExecuteSubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button type="submit" disabled={pending} className="h-9">
            {pending ? "Izvršavanje..." : "Potvrdi izvršenje"}
        </Button>
    )
}

type ExecuteTransferDialogProps = {
    id: string
    datum: string
    vrijeme: string
    relacija: string
    action: (formData: FormData) => Promise<void>
}

export function ExecuteTransferDialog({
    id,
    datum,
    vrijeme,
    relacija,
    action,
}: ExecuteTransferDialogProps) {
    return (
        <Dialog>
            <DialogTrigger render={<Button className="h-9 w-9 p-0" aria-label="Izvrši transfer" title="Izvrši transfer" />}>
                <Square className="h-4 w-4" />
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Potvrda izvršenja transfera</DialogTitle>
                    <DialogDescription>
                        Da li želiš označiti transfer {relacija} ({datum} u {vrijeme}) kao izvršen?
                        Transfer će biti uklonjen iz aktivne liste i premješten u arhivu.
                    </DialogDescription>
                </DialogHeader>

                <form action={action} className="space-y-4">
                    <input type="hidden" name="id" value={id} />

                    <DialogFooter>
                        <DialogClose render={<Button type="button" variant="outline" />}>Otkaži</DialogClose>
                        <ExecuteSubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
