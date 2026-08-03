import { updateItem } from '../db'
import type { Item } from '../types'

export default function ShoppingView({ items }: { items: Item[] }) {
  const list = items.filter((i) => i.shopping === 1)
  const suggested = items.filter((i) => i.shopping === 0 && i.quantity === 0)

  async function bought(item: Item) {
    await updateItem(item.id, { shopping: 0, quantity: item.quantity > 0 ? item.quantity : 1 })
  }

  if (list.length === 0 && suggested.length === 0) {
    return (
      <div className="mt-24 text-center text-zinc-500">
        <div className="mb-2 text-4xl">🛒</div>
        <p>Lista della spesa vuota.</p>
        <p className="text-sm">Tocca il carrello su un prodotto per aggiungerlo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {list.length > 0 && (
        <ul className="space-y-2">
          {list.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3">
              <button
                className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-emerald-500 text-transparent active:bg-emerald-500/20"
                onClick={() => void bought(item)}
                aria-label={`Comprato: ${item.name}`}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-zinc-100">{item.name}</div>
                <div className="text-xs text-zinc-500">
                  {item.category}
                  {item.quantity === 0 && ' · esaurito a casa'}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {suggested.length > 0 && (
        <div>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Esauriti — da ricomprare?
          </h3>
          <ul className="space-y-2">
            {suggested.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-zinc-900/60 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-zinc-300">{item.name}</div>
                  <div className="text-xs text-zinc-600">{item.category}</div>
                </div>
                <button
                  className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-400 active:bg-emerald-500/25"
                  onClick={() => void updateItem(item.id, { shopping: 1 })}
                >
                  + Spesa
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
