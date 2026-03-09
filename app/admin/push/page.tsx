import { PushReminderSetup } from "@/components/push-reminder-setup"

type AdminPushPageProps = {
  searchParams: Promise<{ key?: string }>
}

export default async function AdminPushPage({ searchParams }: AdminPushPageProps) {
  const { key } = await searchParams
  const expectedKey = process.env.ADMIN_PUSH_SETUP_KEY?.trim()
  const providedKey = key?.trim()

  const isAllowed = Boolean(
    expectedKey && providedKey && providedKey.length > 0 && providedKey === expectedKey
  )

  if (!isAllowed) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-10">
        <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
          <h1 className="text-xl font-semibold">Admin Push Setup</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pristup nije dozvoljen. Otvori ovu stranu sa validnim ključem.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Primjer: /admin/push?key=ADMIN_PUSH_SETUP_KEY
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-10">
      <div className="mb-4 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
        <h1 className="text-xl font-semibold">Admin Push Setup</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ovdje uključi push na svom telefonu. Korisnici ne treba da koriste ovu stranu.
        </p>
      </div>

      <PushReminderSetup />
    </main>
  )
}
