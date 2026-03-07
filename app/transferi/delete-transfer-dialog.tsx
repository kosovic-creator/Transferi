"use client"

import { useFormStatus } from "react-dom"

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

function DeleteSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending}
      className="h-9"
    >
      {pending ? "Brisanje..." : "Potvrdi brisanje"}
    </Button>
  )
}

type DeleteTransferDialogProps = {
  id: string
  datum: string
  vrijeme: string
  relacija: string
  action: (formData: FormData) => Promise<void>
}

export function DeleteTransferDialog({
  id,
  datum,
  vrijeme,
  relacija,
  action,
}: DeleteTransferDialogProps) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" className="h-9" />}>
        Obriši
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Potvrda brisanja</DialogTitle>
          <DialogDescription>
            Da li si siguran da želiš obrisati transfer {relacija} ({datum} u {vrijeme})?
            Ova akcija je nepovratna.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={id} />

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Otkaži</DialogClose>
            <DeleteSubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
