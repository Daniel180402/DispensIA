import Dexie, { type EntityTable } from 'dexie'
import type { Item, ItemLocation } from './types'

interface MetaEntry {
  key: string
  value: number
}

export const db = new Dexie('dispensia') as Dexie & {
  items: EntityTable<Item, 'id'>
  meta: EntityTable<MetaEntry, 'key'>
}

db.version(1).stores({
  items: 'id, name, updatedAt, dirty, shopping',
  meta: 'key',
})

export interface ItemDraft {
  name: string
  category: string
  location: ItemLocation
  quantity: number
  unit: string
  expiry: string | null
  notes: string
}

export async function createItem(draft: ItemDraft): Promise<string> {
  const id = crypto.randomUUID()
  await db.items.add({
    ...draft,
    id,
    shopping: 0,
    updatedAt: Date.now(),
    deleted: 0,
    dirty: 1,
  })
  return id
}

export async function updateItem(id: string, patch: Partial<Item>): Promise<void> {
  await db.items.update(id, { ...patch, updatedAt: Date.now(), dirty: 1 })
}

export async function removeItem(id: string): Promise<void> {
  // soft delete: la cancellazione deve propagarsi agli altri telefoni
  await db.items.update(id, { deleted: 1, updatedAt: Date.now(), dirty: 1 })
}

export async function changeQuantity(item: Item, delta: number): Promise<void> {
  const quantity = Math.max(0, Math.round((item.quantity + delta) * 100) / 100)
  await updateItem(item.id, { quantity })
}

export async function toggleShopping(item: Item): Promise<void> {
  await updateItem(item.id, { shopping: item.shopping ? 0 : 1 })
}
