# DispensIA 🫙

La tua dispensa, sempre in tasca. PWA **offline-first** per gestire dispensa, frigo e freezer di casa, con sincronizzazione self-hosted su Docker: tutti i telefoni della rete di casa condividono la stessa dispensa.

## Come funziona

- **A casa (WiFi)**: l'app sincronizza in automatico con il server Docker — all'avvio, quando torna in primo piano e quando torna la rete. C'è anche il pulsante di sync manuale in alto a destra.
- **Fuori casa (es. al supermercato)**: l'app funziona completamente offline — i dati vivono in IndexedDB sul telefono. Le modifiche fatte offline si sincronizzano appena torni a casa.
- **Conflitti**: risolti con *last-write-wins* per prodotto — vince la modifica più recente.

## Funzionalità

- 📦 Prodotti organizzati per **categoria** e **posizione** (dispensa / frigo / freezer)
- ⏰ **Date di scadenza** con badge (scaduto, scade oggi, scade tra N giorni)
- 🛒 **Lista della spesa** integrata + suggerimenti automatici per i prodotti esauriti
- ➕ Quantità modificabili al volo con − / +
- 🔍 Ricerca e filtri
- 📱 Installabile come app su **iOS e Android** (Aggiungi a schermata Home)
- 🌙 Dark mode

## Stack

| Parte | Tecnologie |
| --- | --- |
| App | React 19 · TypeScript · Vite · Tailwind CSS v4 · Dexie (IndexedDB) · vite-plugin-pwa (Workbox) |
| Server | Node 22 · Hono · SQLite (better-sqlite3) |
| Deploy | Docker · docker-compose |

## Avvio con Docker

```bash
docker compose up -d --build
```

Il server è su `http://<ip-del-tuo-computer>:8080` (i dati restano nel volume `dispensia-data`).

## Installare l'app sui telefoni

> ⚠️ **Serve HTTPS**: i service worker (la parte che fa funzionare l'app offline) richiedono un contesto sicuro. Su `http://192.168.x.x` l'app funziona ma **non** offline. Vedi sotto.

1. Genera i certificati con [mkcert](https://github.com/FiloSottile/mkcert) sul computer che ospita Docker:

   ```bash
   brew install mkcert
   mkcert -install
   mkdir -p certs
   mkcert -cert-file certs/cert.pem -key-file certs/key.pem <ip-del-computer> localhost
   docker compose restart
   ```

2. Installa la CA di mkcert sul telefono (una volta sola): trovi il file con `mkcert -CAROOT` → invia `rootCA.pem` al telefono.
   - **iOS**: apri il file → Impostazioni → Profilo scaricato → Installa → poi Impostazioni → Generali → Info → Impostazioni certificati → attiva la fiducia completa.
   - **Android**: Impostazioni → Sicurezza → Installa certificato → Certificato CA.
3. Sul telefono apri `https://<ip-del-computer>:8443`.
4. **iOS**: Condividi → *Aggiungi a schermata Home*. **Android**: Chrome propone *Installa app*.

Fatto: l'app è sulla home, funziona offline e si sincronizza da sola quando sei a casa.

## Sviluppo

```bash
npm install
npm run dev:server   # API su :3000
npm run dev:app      # Vite su :5173 (proxy /api → :3000)
```

## API

| Endpoint | Descrizione |
| --- | --- |
| `GET /api/health` | Stato del server |
| `GET /api/items` | Tutti i prodotti non eliminati |
| `POST /api/sync` | Sync bidirezionale: `{ since, changes[] }` → `{ now, applied, changes[] }` |

## Roadmap

- [ ] Ricette suggerite con l'IA in base a cosa c'è in dispensa (la "IA" del nome 😉)
- [ ] Scansione codici a barre
- [ ] Notifiche per i prodotti in scadenza
