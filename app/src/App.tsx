import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import ItemCard from './components/ItemCard'
import ItemForm from './components/ItemForm'
import SettingsSheet from './components/SettingsSheet'
import ShoppingView from './components/ShoppingView'
import { db } from './db'
import { syncNow, useSyncStatus } from './sync'
import { LOCATIONS, type Item, type ItemLocation } from './types'

type Tab = 'pantry' | 'shopping'

function SyncPill() {
  const { state, lastSync } = useSyncStatus()
  const dot =
    state === 'online' ? 'bg-emerald-400' : state === 'syncing' ? 'animate-pulse bg-amber-400' : 'bg-zinc-500'
  const label =
    state === 'online'
      ? 'Sincronizzato'
      : state === 'syncing'
        ? 'Sincronizzo…'
        : lastSync
          ? `Offline · ${new Date(lastSync).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
          : 'Offline'
  return (
    <button
      className="flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 active:bg-zinc-800"
      onClick={() => void syncNow()}
      title="Tocca per sincronizzare"
    >
      <span className={`size-2 rounded-full ${dot}`} />
      {label}
    </button>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('pantry')
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState<ItemLocation | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const items = (useLiveQuery(() => db.items.orderBy('name').toArray(), []) ?? []).filter(
    (i) => i.deleted === 0
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(
      (i) =>
        (!locationFilter || i.location === locationFilter) &&
        (!q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    )
  }, [items, search, locationFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>()
    for (const item of filtered) {
      const group = map.get(item.category) ?? []
      group.push(item)
      map.set(item.category, group)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'it'))
  }, [filtered])

  const shoppingCount = items.filter((i) => i.shopping === 1).length

  function openEdit(item: Item) {
    setEditing(item)
    setFormOpen(true)
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 bg-zinc-950/80 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            Dispens<span className="text-emerald-400">IA</span>
          </h1>
          <div className="flex items-center gap-2">
            <SyncPill />
            <button
              className="grid size-8 place-items-center rounded-full bg-zinc-900 text-sm active:bg-zinc-800"
              onClick={() => setSettingsOpen(true)}
              aria-label="Impostazioni"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-40">
        {tab === 'pantry' ? (
          <>
            <input
              className="mb-3 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-500"
              placeholder="Cerca…"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="mb-4 flex gap-2 overflow-x-auto">
              <button
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                  locationFilter === null ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-400'
                }`}
                onClick={() => setLocationFilter(null)}
              >
                Tutti
              </button>
              {LOCATIONS.map((loc) => (
                <button
                  key={loc.value}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                    locationFilter === loc.value ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-400'
                  }`}
                  onClick={() => setLocationFilter(loc.value === locationFilter ? null : loc.value)}
                >
                  {loc.emoji} {loc.label}
                </button>
              ))}
            </div>

            {grouped.length === 0 ? (
              <div className="mt-24 text-center text-zinc-500">
                <div className="mb-2 text-4xl">🥫</div>
                <p>{items.length === 0 ? 'La dispensa è vuota.' : 'Nessun risultato.'}</p>
                {items.length === 0 && <p className="text-sm">Tocca + per aggiungere il primo prodotto.</p>}
              </div>
            ) : (
              grouped.map(([category, group]) => (
                <section key={category} className="mb-5">
                  <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {category}
                  </h2>
                  <div className="space-y-2">
                    {group.map((item) => (
                      <ItemCard key={item.id} item={item} onEdit={openEdit} />
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        ) : (
          <ShoppingView items={items} />
        )}
      </main>

      <button
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-5 z-20 grid size-14 place-items-center rounded-full bg-emerald-600 text-3xl font-light text-white shadow-lg shadow-emerald-600/30 active:bg-emerald-500"
        onClick={() => {
          setEditing(null)
          setFormOpen(true)
        }}
        aria-label="Aggiungi prodotto"
      >
        +
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-900 bg-zinc-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-lg">
          <button
            className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-medium ${
              tab === 'pantry' ? 'text-emerald-400' : 'text-zinc-500'
            }`}
            onClick={() => setTab('pantry')}
          >
            <span className="text-xl">🥫</span> Dispensa
          </button>
          <button
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-medium ${
              tab === 'shopping' ? 'text-emerald-400' : 'text-zinc-500'
            }`}
            onClick={() => setTab('shopping')}
          >
            <span className="relative text-xl">
              🛒
              {shoppingCount > 0 && (
                <span className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                  {shoppingCount}
                </span>
              )}
            </span>
            Spesa
          </button>
        </div>
      </nav>

      {formOpen && <ItemForm item={editing} onClose={() => setFormOpen(false)} />}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
