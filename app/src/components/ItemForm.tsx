import { useState } from 'react'
import { createItem, removeItem, updateItem, type ItemDraft } from '../db'
import { CATEGORIES, LOCATIONS, UNITS, type Item, type ItemLocation } from '../types'

interface Props {
  item: Item | null
  onClose: () => void
}

export default function ItemForm({ item, onClose }: Props) {
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState(item?.category ?? CATEGORIES[CATEGORIES.length - 1])
  const [location, setLocation] = useState<ItemLocation>(item?.location ?? 'dispensa')
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1))
  const [unit, setUnit] = useState(item?.unit ?? 'pz')
  const [expiry, setExpiry] = useState(item?.expiry ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')

  async function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    const draft: ItemDraft = {
      name: trimmed,
      category,
      location,
      quantity: Math.max(0, Number(quantity) || 0),
      unit,
      expiry: expiry || null,
      notes: notes.trim(),
    }
    if (item) await updateItem(item.id, draft)
    else await createItem(draft)
    onClose()
  }

  async function remove() {
    if (!item) return
    await removeItem(item.id)
    onClose()
  }

  const inputCls =
    'w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-zinc-100 outline-none focus:border-emerald-500'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-zinc-950 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          {item ? 'Modifica prodotto' : 'Nuovo prodotto'}
        </h2>

        <div className="space-y-3">
          <input
            className={inputCls}
            placeholder="Nome (es. Passata di pomodoro)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus={!item}
          />

          <div className="grid grid-cols-2 gap-3">
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                className={inputCls}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <select className={inputCls} value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex rounded-xl bg-zinc-900 p-1">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.value}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  location === loc.value ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
                onClick={() => setLocation(loc.value)}
              >
                {loc.emoji} {loc.label}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-zinc-500">Data di scadenza (opzionale)</span>
            <input className={inputCls} type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </label>

          <input
            className={inputCls}
            placeholder="Note (opzionale)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="mt-5 flex gap-3">
          {item && (
            <button
              className="rounded-xl bg-red-500/15 px-4 py-3 font-medium text-red-400 active:bg-red-500/25"
              onClick={() => void remove()}
            >
              Elimina
            </button>
          )}
          <button
            className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white active:bg-emerald-500 disabled:opacity-40"
            disabled={!name.trim()}
            onClick={() => void save()}
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  )
}
