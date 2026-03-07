# Setup za Push Alarme

Ovaj dokument objašnjava kako aktivirati push alarm notifikacije na mobilnom telefonu za transfere.

## 1. Priprema environment varijabli

### Generiši VAPID ključeve

```bash
node scripts/generate-vapid-keys.js
```

Skript će ispisati `VAPID_PUBLIC_KEY` i `VAPID_PRIVATE_KEY`.

### Generiši CRON_SECRET

Koristi random string generator (minimum 32 karaktera):

```bash
openssl rand -base64 32
```

### Popuni `.env` fajl

Kopiraj `.env.example` u `.env` i popuni sve varijable:

```bash
cp .env.example .env
```

Uredi `.env`:

```env
DATABASE_URL="postgresql://..."
CRON_SECRET="<random-string-iz-openssl>"
VAPID_SUBJECT="mailto:tvoj-email@example.com"
VAPID_PUBLIC_KEY="<public-key-iz-generatora>"
VAPID_PRIVATE_KEY="<private-key-iz-generatora>"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="<isti-kao-VAPID_PUBLIC_KEY>"
```

**Napomena:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` mora biti identičan kao `VAPID_PUBLIC_KEY`.

## 2. Primijeni migraciju u bazi

```bash
npx prisma migrate deploy
```

Ovo će dodati:
- Polja `datumVrijemeUtc`, `alarmEnabled`, `alarmSentAt` u `Transfer` i `ArhivaTransfera`
- Novu tabelu `PushSubscription`

## 3. Deploy na Vercel

```bash
vercel --prod
```

Vercel će automatski prepoznati `vercel.json` i postaviti cron job koji poziva:
```
GET /api/jobs/send-transfer-reminders
```
svakog minuta.

**Važno:** U Vercel dashboard-u dodaj sve env varijable iz `.env` fajla (osim `DATABASE_URL` ako koristiš Vercel Postgres integration).

## 4. Testiranje alarma

### Na telefonu (iOS ili Android)

1. Otvori aplikaciju u browseru (Chrome/Safari).
2. Idi na početnu stranicu.
3. U sekciji "Alarm na telefonu" unesi **korisnika** (isto ime kao što koristiš u transferu).
4. Klikni **Uključi**.
5. Dozvoli notifikacije kada browser traži dozvolu.
6. Poruka: "Podsetnici su uključeni za ovaj telefon."

### Kreiraj transfer sa alarmom

1. Dodaj novi transfer.
2. Postavi vreme na +2 minuta od trenutka (npr. ako je 14:30, postavi 14:32).
3. Uključi checkbox "Uključi alarm notifikaciju za ovaj transfer".
4. Sačuvaj.

### Provera da li radi

1. Čekaj da dođe vreme transfera.
2. Notifikacija treba da stigne na telefon sa zvukom.
3. Klikom na notifikaciju otvoriće se transfer u browseru.

## 5. Napomene za produkciju

### iOS Safari
- Web Push na iOS radi samo ako je aplikacija instalirana kao PWA ("Add to Home Screen").
- Korisnik mora dozvoliti notifikacije u iOS Settings > Safari > Notifications.

### Android Chrome
- Radi odmah bez instalacije PWA-a.
- Korisnik mora dozvoliti notifikacije u browseru.

### Backup opcija
Ako push ne radi za nekog korisnika, možeš implementirati:
- Email podsetnik kao fallback
- SMS podsetnik
- Export u kalendar sa alarmom

### Debug cron endpoint lokalno

Možeš ručno testirati endpoint:

```bash
curl -X GET http://localhost:3000/api/jobs/send-transfer-reminders \
  -H "Authorization: Bearer <CRON_SECRET>"
```
a
Odgovor bi trebao biti:
```json
{
  "ok": true,
  "processedTransfers": 1,
  "sentNotifications": 1
}
```

## 6. Troubleshooting

### Notifikacija ne stiže
- Proveri da li je `alarmEnabled` true u bazi za taj transfer.
- Proveri da li je `datumVrijemeUtc` <= trenutno vreme (UTC).
- Proveri da li je `alarmSentAt` NULL.
- Proveri da li postoji PushSubscription za tog korisnika.

### Browser ne podržava notifikacije
- Prikaži poruku "Ovaj browser ne podržava push notifikacije".
- Predloži Chrome/Safari/Firefox.

### VAPID greška
- Proveri da su VAPID ključevi tačni.
- Proveri da je `VAPID_SUBJECT` email adresa sa `mailto:` prefiksom.

### Cron ne pokreće endpoint
- Proveri Vercel logs: `vercel logs --follow`
- Proveri da je `vercel.json` commitovan u repo.
- Proveri da je cron schedule validan (cron sintaksa).

## 7. Opcioni koraci

### PWA Manifest (za iOS i Android instalaciju)

Dodaj `public/manifest.json`:

```json
{
  "name": "Transferi App",
  "short_name": "Transferi",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e293b",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Dodaj u `app/layout.tsx` head:

```tsx
<link rel="manifest" href="/manifest.json" />
```

### Dodaj badge ikonu

Kreиraj `public/badge-icon.png` (96x96px) za notifikacije.

Ažuriraj `public/sw.js`:

```js
badge: "/badge-icon.png",
icon: "/icon-192.png",
```
