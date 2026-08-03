# DispensIA

Offline-first PWA to keep track of what you have in your pantry, fridge and freezer. It runs self-hosted on Docker, and every phone on your home WiFi shares the same pantry.

## How it works

When you are at home the app syncs automatically with the Docker server: on startup, when it comes back to the foreground and when the connection comes back. There is also a manual sync button in the header.

When you are out (for example at the supermarket) the app keeps working without any connection, since all data lives in IndexedDB on the phone. Anything you change while offline gets synced as soon as you are back home.

If two phones edit the same product, the most recent change wins (last-write-wins per item).

## Features

- Products organized by category and location (pantry, fridge, freezer)
- Expiry dates with badges (expired, expires today, expires in N days)
- Built-in shopping list, with suggestions for products that ran out
- Quick quantity changes with the +/- buttons
- Search and filters
- Installable on iOS and Android from the browser (Add to Home Screen)
- Dark mode

## Stack

| Part | Tech |
| --- | --- |
| App | React 19, TypeScript, Vite, Tailwind CSS v4, Dexie (IndexedDB), vite-plugin-pwa (Workbox) |
| Android | Capacitor 7 |
| Server | Node 22, Hono, SQLite (better-sqlite3) |
| Deploy | Docker, docker-compose |

## Run with Docker

```bash
docker compose up -d --build
```

The server listens on `http://<your-computer-ip>:8080` and data is stored in the `dispensia-data` volume.

## Install the app on your phones

Note: service workers (the part that makes the app work offline) require HTTPS. On `http://192.168.x.x` the app works, but not offline. Here is the setup:

1. Generate the certificates with [mkcert](https://github.com/FiloSottile/mkcert) on the computer running Docker:

   ```bash
   brew install mkcert
   mkcert -install
   mkdir -p certs
   mkcert -cert-file certs/cert.pem -key-file certs/key.pem <computer-ip> localhost
   docker compose restart
   ```

2. Install the mkcert CA on the phone (only once). Find it with `mkcert -CAROOT` and send `rootCA.pem` to the phone.
   - iOS: open the file, then Settings > Downloaded profile > Install, then Settings > General > About > Certificate Trust Settings and enable full trust.
   - Android: Settings > Security > Install certificate > CA certificate.
3. On the phone open `https://<computer-ip>:8443`.
4. iOS: Share > Add to Home Screen. Android: Chrome will offer to install the app.

That's it: the app is on your home screen, works offline and syncs by itself when you are at home.

## Android APK

If you prefer a native Android app instead of the PWA (no certificates needed, offline out of the box), you can build the APK with Capacitor. You need Android Studio installed.

```bash
npm install
npm run build -w app
cd app
npx cap sync android
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug
```

The APK ends up in `app/android/app/build/outputs/apk/debug/app-debug.apk`. Copy it to the phone, install it, then open the settings (gear icon) and set the server address, for example `http://192.168.1.10:8080`.

## Development

```bash
npm install
npm run dev:server   # API on :3000
npm run dev:app      # Vite on :5173 (proxy /api to :3000)
```

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/health` | Server status |
| `GET /api/items` | All non-deleted products |
| `POST /api/sync` | Two-way sync: `{ since, changes[] }` returns `{ now, applied, changes[] }` |

## Roadmap

- AI recipe suggestions based on what's in the pantry (the "IA" in the name)
- Barcode scanning
- Notifications for products about to expire

---

# Italiano

PWA offline-first per tenere traccia di quello che hai in dispensa, in frigo e nel freezer. Gira self-hosted su Docker e tutti i telefoni sulla WiFi di casa condividono la stessa dispensa.

## Come funziona

Quando sei a casa l'app sincronizza in automatico con il server Docker: all'avvio, quando torna in primo piano e quando torna la connessione. C'è anche un pulsante di sync manuale nell'header.

Quando sei fuori (per esempio al supermercato) l'app continua a funzionare senza connessione, perché i dati vivono in IndexedDB sul telefono. Le modifiche fatte offline si sincronizzano appena torni a casa.

Se due telefoni modificano lo stesso prodotto, vince la modifica più recente (last-write-wins per prodotto).

## Funzionalità

- Prodotti organizzati per categoria e posizione (dispensa, frigo, freezer)
- Date di scadenza con badge (scaduto, scade oggi, scade tra N giorni)
- Lista della spesa integrata, con suggerimenti per i prodotti esauriti
- Quantità modificabili al volo con i pulsanti +/-
- Ricerca e filtri
- Installabile su iOS e Android dal browser (Aggiungi a schermata Home)
- Dark mode

## Avvio con Docker

```bash
docker compose up -d --build
```

Il server ascolta su `http://<ip-del-tuo-computer>:8080` e i dati restano nel volume `dispensia-data`.

## Installare l'app sui telefoni

Nota: i service worker (la parte che fa funzionare l'app offline) richiedono HTTPS. Su `http://192.168.x.x` l'app funziona, ma non offline. Ecco la procedura:

1. Genera i certificati con [mkcert](https://github.com/FiloSottile/mkcert) sul computer che ospita Docker:

   ```bash
   brew install mkcert
   mkcert -install
   mkdir -p certs
   mkcert -cert-file certs/cert.pem -key-file certs/key.pem <ip-del-computer> localhost
   docker compose restart
   ```

2. Installa la CA di mkcert sul telefono (una volta sola). La trovi con `mkcert -CAROOT`, poi invia `rootCA.pem` al telefono.
   - iOS: apri il file, poi Impostazioni > Profilo scaricato > Installa, poi Impostazioni > Generali > Info > Impostazioni certificati e attiva la fiducia completa.
   - Android: Impostazioni > Sicurezza > Installa certificato > Certificato CA.
3. Sul telefono apri `https://<ip-del-computer>:8443`.
4. iOS: Condividi > Aggiungi a schermata Home. Android: Chrome propone di installare l'app.

Fatto: l'app è sulla home, funziona offline e si sincronizza da sola quando sei a casa.

## APK Android

Se preferisci un'app Android nativa al posto della PWA (niente certificati, offline senza configurazione), puoi compilare l'APK con Capacitor. Serve Android Studio installato.

```bash
npm install
npm run build -w app
cd app
npx cap sync android
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug
```

L'APK finisce in `app/android/app/build/outputs/apk/debug/app-debug.apk`. Copialo sul telefono, installalo, poi apri le impostazioni (icona ingranaggio) e imposta l'indirizzo del server, per esempio `http://192.168.1.10:8080`.

## Sviluppo

```bash
npm install
npm run dev:server   # API su :3000
npm run dev:app      # Vite su :5173 (proxy /api verso :3000)
```

## Roadmap

- Ricette suggerite dall'IA in base a cosa c'è in dispensa (la "IA" del nome)
- Scansione dei codici a barre
- Notifiche per i prodotti in scadenza
