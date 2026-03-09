This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Push alarm podsjetnici

Aplikacija podržava mobilne push podsjetnike koji šalju notifikaciju u vrijeme transfera.

### Brzi početak

1. Generiši VAPID ključeve:
   ```bash
   npm run generate-vapid
   ```

2. Popuni `.env` sa potrebnim varijablama (vidi `.env.example`)

3. Primijeni migraciju:
   ```bash
   npx prisma migrate deploy
   ```

4. Deploy na Vercel (automatski postavlja cron iz `vercel.json`)

**Detaljno objašnjenje setup-a:** [SETUP_ALARMI.md](./SETUP_ALARMI.md)

### Admin-only podešavanje push pretplate

Push setup vise nije na javnoj pocetnoj strani. Dostupan je samo na:

`/admin/push?key=...`

Dodaj u `.env`:

```bash
ADMIN_PUSH_SETUP_KEY=drasko
```

Zatim otvori:

`/admin/push?key=tvoj_kljuc`

Napomena: samo admin treba da ukljuci push na ovoj stranici.

## Online chat podrska (Crisp)

Aplikacija podrzava online chat widget za komunikaciju sa potencijalnim korisnicima.

### Aktivacija

1. Kreiraj nalog na [Crisp](https://crisp.chat) i kopiraj Website ID.
2. Dodaj varijable u `.env`:

```bash
NEXT_PUBLIC_CRISP_WEBSITE_ID=your_crisp_website_id
NEXT_PUBLIC_CHAT_ALLOWED_ROUTES=/,/transferi/*
NEXT_PUBLIC_CHAT_OPERATOR_NAME=Marko (Transferi)
NEXT_PUBLIC_CHAT_INITIAL_MESSAGE=Pozdrav! Ja sam Marko. Kako mogu da pomognem?
NEXT_PUBLIC_SUPPORT_PHONE=+38267123456
NEXT_PUBLIC_WHATSAPP_NUMBER=38267123456
```

3. Restartuj razvojni server (`npm run dev`).

Ako `NEXT_PUBLIC_CRISP_WEBSITE_ID` nije postavljen, chat widget se ne prikazuje.

### Podesavanja

- `NEXT_PUBLIC_CHAT_ALLOWED_ROUTES`: ruta/rute gdje se chat prikazuje, odvojene zarezom.
- Primjeri: `/` (samo pocetna), `/transferi/*` (sve ispod transferi), `/,/transferi/dodaj`.
- `NEXT_PUBLIC_CHAT_OPERATOR_NAME`: ime koje se koristi u chat kontekstu i porukama.
- `NEXT_PUBLIC_CHAT_INITIAL_MESSAGE`: inicijalni tekst na srpskom koji se priprema korisniku.
- `NEXT_PUBLIC_SUPPORT_PHONE` i `NEXT_PUBLIC_WHATSAPP_NUMBER`: fallback dugmad `Pozovi / WhatsApp` kada Crisp prijavi da operater nije online.

### Admin toggle u UI

- U navbaru na `/transferi` stranicama postoji dugme `Chat: ukljucen/iskljucen`.
- Klik menja globalno stanje chata u bazi, bez izmjene `.env` fajla.
- Potrebno je primijeniti novu migraciju prije koriscenja:

```bash
npx prisma migrate deploy
```
