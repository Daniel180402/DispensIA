import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { existsSync, readFileSync } from 'node:fs'
import { createServer as createHttpsServer } from 'node:https'
import { join, relative } from 'node:path'
import { applyChanges, changesSince, listItems } from './db.js'
import { OllamaError, suggestRecipes } from './recipes.js'

const PORT = Number(process.env.PORT ?? 3000)
const HTTPS_PORT = Number(process.env.HTTPS_PORT ?? 3443)
const STATIC_DIR = process.env.STATIC_DIR ?? join(process.cwd(), '..', 'app', 'dist')
const CERT_DIR = process.env.CERT_DIR ?? join(process.cwd(), 'certs')

const app = new Hono()

app.use(logger())
app.use('/api/*', cors())

app.get('/api/health', (c) => c.json({ ok: true, name: 'DispensIA', now: Date.now() }))

app.get('/api/items', (c) => c.json(listItems()))

app.post('/api/sync', async (c) => {
  let body: { since?: unknown; changes?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'JSON non valido' }, 400)
  }
  const since = Number(body.since)
  const changes = Array.isArray(body.changes) ? body.changes : []
  const applied = applyChanges(changes)
  return c.json({
    now: Date.now(),
    applied,
    changes: changesSince(Number.isFinite(since) && since > 0 ? since : 0),
  })
})

app.post('/api/recipes', async (c) => {
  const items = listItems().filter((i) => i.quantity > 0)
  if (items.length === 0) {
    return c.json({ error: 'La dispensa è vuota, aggiungi qualche prodotto prima' }, 400)
  }
  try {
    const result = await suggestRecipes(items)
    return c.json({ ...result, generatedAt: Date.now() })
  } catch (err) {
    console.error('Errore ricette:', err)
    if (err instanceof OllamaError) {
      return c.json({ error: err.message }, err.status === 503 ? 503 : 502)
    }
    return c.json({ error: 'Errore nella generazione delle ricette, riprova' }, 502)
  }
})

// PWA statica (build di Vite) con fallback SPA
if (existsSync(STATIC_DIR)) {
  const root = relative(process.cwd(), STATIC_DIR) || '.'
  app.use('*', serveStatic({ root }))
  app.get('*', serveStatic({ path: join(root, 'index.html') }))
}

serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`DispensIA HTTP su http://0.0.0.0:${info.port}`)
})

// HTTPS opzionale (necessario per la PWA offline sui telefoni): metti cert.pem e key.pem in certs/
const certPath = join(CERT_DIR, 'cert.pem')
const keyPath = join(CERT_DIR, 'key.pem')
if (existsSync(certPath) && existsSync(keyPath)) {
  serve(
    {
      fetch: app.fetch,
      port: HTTPS_PORT,
      hostname: '0.0.0.0',
      createServer: createHttpsServer,
      serverOptions: {
        cert: readFileSync(certPath),
        key: readFileSync(keyPath),
      },
    },
    (info) => {
      console.log(`DispensIA HTTPS su https://0.0.0.0:${info.port}`)
    }
  )
} else {
  console.log('Nessun certificato in certs/ — HTTPS disattivato (vedi README per abilitarlo)')
}
