export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Nema interneta</h1>
      <p className="text-muted-foreground">
        Izgleda da ste trenutno offline. Cim se konekcija vrati, stranica ce ponovo
        ucitati svjeze podatke.
      </p>
    </main>
  );
}
