import { changeQuantity, toggleShopping } from '../db'
import { expiryBadge } from '../expiry'
import type { Item } from '../types'

export default function ItemCard({ item, onEdit }: { item: Item; onEdit: (item: Item) => void }) {
  const badge = expiryBadge(item.expiry)

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3">
      <button className="min-w-0 flex-1 text-left" onClick={() => onEdit(item)}>
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-zinc-100">{item.name}</span>
          {badge && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-zinc-500">
          {item.category}
          {item.notes && ` · ${item.notes}`}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1 rounded-full bg-zinc-800 px-1 py-1">
        <button
          className="grid size-7 place-items-center rounded-full text-lg text-zinc-300 active:bg-zinc-700"
          onClick={() => void changeQuantity(item, -1)}
          aria-label="Diminuisci"
        >
          −
        </button>
        <span className="min-w-10 text-center text-sm tabular-nums text-zinc-100">
          {item.quantity} {item.unit}
        </span>
        <button
          className="grid size-7 place-items-center rounded-full text-lg text-zinc-300 active:bg-zinc-700"
          onClick={() => void changeQuantity(item, 1)}
          aria-label="Aumenta"
        >
          +
        </button>
      </div>

      <button
        className={`grid size-9 shrink-0 place-items-center rounded-full text-base ${
          item.shopping ? 'bg-emerald-500/20' : 'bg-zinc-800'
        }`}
        onClick={() => void toggleShopping(item)}
        aria-label={item.shopping ? 'Togli dalla spesa' : 'Aggiungi alla spesa'}
        title={item.shopping ? 'Nella lista della spesa' : 'Aggiungi alla lista della spesa'}
      >
        <span className={item.shopping ? '' : 'opacity-40 grayscale'}>🛒</span>
      </button>
    </div>
  )
}
