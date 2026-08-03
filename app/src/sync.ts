import { useEffect, useState } from 'react'
import { db } from './db'
import { apiUrl } from './settings'
import type { Item } from './types'

export type SyncState = 'idle' | 'syncing' | 'online' | 'offline'

export interface SyncStatus {
  state: SyncState
  lastSync: number | null
}

type Listener = (status: SyncStatus) => void

let status: SyncStatus = { state: 'idle', lastSync: null }
const listeners = new Set<Listener>()

function setStatus(next: Partial<SyncStatus>) {
  status = { ...status, ...next }
  listeners.forEach((l) => l(status))
}

db.meta.get('lastSync').then((entry) => {
  if (entry) setStatus({ lastSync: entry.value })
})

let syncing = false

export async function syncNow(): Promise<boolean> {
  if (syncing) return false
  syncing = true
  setStatus({ state: 'syncing' })
  try {
    const since = (await db.meta.get('lastSync'))?.value ?? 0
    const dirty = await db.items.where('dirty').equals(1).toArray()
    const res = await fetch(apiUrl('/api/sync'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        since,
        changes: dirty.map(({ dirty: _d, ...item }) => item),
      }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: { now: number; changes: Item[] } = await res.json()

    await db.transaction('rw', db.items, db.meta, async () => {
      for (const remote of data.changes) {
        const local = await db.items.get(remote.id)
        if (!local || remote.updatedAt >= local.updatedAt) {
          await db.items.put({ ...remote, dirty: 0 })
        }
      }
      // pulisci il flag dirty solo se nel frattempo l'elemento non è cambiato di nuovo
      for (const sent of dirty) {
        const current = await db.items.get(sent.id)
        if (current && current.updatedAt === sent.updatedAt) {
          await db.items.update(sent.id, { dirty: 0 })
        }
      }
      await db.meta.put({ key: 'lastSync', value: data.now })
    })

    setStatus({ state: 'online', lastSync: data.now })
    return true
  } catch {
    setStatus({ state: 'offline' })
    return false
  } finally {
    syncing = false
  }
}

export function useSyncStatus(): SyncStatus {
  const [current, setCurrent] = useState(status)
  useEffect(() => {
    const listener: Listener = (s) => setCurrent(s)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])
  return current
}

// Sync ritardato e raggruppato: chiamato dopo ogni modifica locale
let syncTimer: ReturnType<typeof setTimeout> | undefined

export function scheduleSync(delayMs = 1500) {
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => void syncNow(), delayMs)
}

// Sincronizza in automatico: all'avvio, dopo ogni modifica, quando l'app torna
// in primo piano, quando torna la rete e comunque ogni 30 secondi se visibile
export function startAutoSync() {
  void syncNow()
  window.addEventListener('online', () => void syncNow())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow()
  })
  setInterval(() => {
    if (document.visibilityState === 'visible') void syncNow()
  }, 30_000)
}
