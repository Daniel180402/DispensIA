import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

export interface Item {
  id: string
  name: string
  category: string
  location: 'dispensa' | 'frigo' | 'freezer'
  quantity: number
  unit: string
  expiry: string | null
  notes: string
  shopping: 0 | 1
  updatedAt: number
  deleted: 0 | 1
}

const dataDir = process.env.DATA_DIR ?? join(process.cwd(), 'data')
mkdirSync(dataDir, { recursive: true })

const db = new Database(join(dataDir, 'dispensia.db'))
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    category  TEXT NOT NULL DEFAULT 'Altro',
    location  TEXT NOT NULL DEFAULT 'dispensa',
    quantity  REAL NOT NULL DEFAULT 1,
    unit      TEXT NOT NULL DEFAULT 'pz',
    expiry    TEXT,
    notes     TEXT NOT NULL DEFAULT '',
    shopping  INTEGER NOT NULL DEFAULT 0,
    updatedAt INTEGER NOT NULL,
    deleted   INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_items_updatedAt ON items (updatedAt);
`)

// Last-write-wins: un aggiornamento vince solo se più recente di quello salvato
const upsertStmt = db.prepare(`
  INSERT INTO items (id, name, category, location, quantity, unit, expiry, notes, shopping, updatedAt, deleted)
  VALUES (@id, @name, @category, @location, @quantity, @unit, @expiry, @notes, @shopping, @updatedAt, @deleted)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    category = excluded.category,
    location = excluded.location,
    quantity = excluded.quantity,
    unit = excluded.unit,
    expiry = excluded.expiry,
    notes = excluded.notes,
    shopping = excluded.shopping,
    updatedAt = excluded.updatedAt,
    deleted = excluded.deleted
  WHERE excluded.updatedAt > items.updatedAt
`)

const changesSinceStmt = db.prepare('SELECT * FROM items WHERE updatedAt > ?')
const listStmt = db.prepare('SELECT * FROM items WHERE deleted = 0 ORDER BY name')

const LOCATIONS = new Set(['dispensa', 'frigo', 'freezer'])

function sanitize(raw: unknown): Item | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || !r.id || typeof r.name !== 'string') return null
  const updatedAt = Number(r.updatedAt)
  if (!Number.isFinite(updatedAt) || updatedAt <= 0) return null
  return {
    id: r.id.slice(0, 64),
    name: r.name.slice(0, 200),
    category: typeof r.category === 'string' ? r.category.slice(0, 100) : 'Altro',
    location: LOCATIONS.has(r.location as string) ? (r.location as Item['location']) : 'dispensa',
    quantity: Number.isFinite(Number(r.quantity)) ? Math.max(0, Number(r.quantity)) : 1,
    unit: typeof r.unit === 'string' ? r.unit.slice(0, 20) : 'pz',
    expiry: typeof r.expiry === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.expiry) ? r.expiry : null,
    notes: typeof r.notes === 'string' ? r.notes.slice(0, 1000) : '',
    shopping: r.shopping ? 1 : 0,
    updatedAt,
    deleted: r.deleted ? 1 : 0,
  }
}

const applyTx = db.transaction((items: Item[]) => {
  let applied = 0
  for (const item of items) applied += upsertStmt.run(item).changes
  return applied
})

export function applyChanges(rawChanges: unknown[]): number {
  const valid = rawChanges.map(sanitize).filter((i): i is Item => i !== null)
  return applyTx(valid)
}

export function changesSince(since: number): Item[] {
  return changesSinceStmt.all(since) as Item[]
}

export function listItems(): Item[] {
  return listStmt.all() as Item[]
}
