export type ItemLocation = 'dispensa' | 'frigo' | 'freezer'

export interface Item {
  id: string
  name: string
  category: string
  location: ItemLocation
  quantity: number
  unit: string
  expiry: string | null
  notes: string
  shopping: 0 | 1
  updatedAt: number
  deleted: 0 | 1
  dirty: 0 | 1
}

export const LOCATIONS: { value: ItemLocation; label: string; emoji: string }[] = [
  { value: 'dispensa', label: 'Dispensa', emoji: '🗄️' },
  { value: 'frigo', label: 'Frigo', emoji: '🧊' },
  { value: 'freezer', label: 'Freezer', emoji: '❄️' },
]

export const CATEGORIES = [
  '🍎 Frutta',
  '🥦 Verdura',
  '🥩 Carne',
  '🐟 Pesce',
  '🧀 Latticini',
  '🍝 Pasta e riso',
  '🍞 Pane e forno',
  '🥫 Conserve',
  '🫒 Condimenti',
  '☕ Colazione',
  '🍪 Snack',
  '🥤 Bevande',
  '📦 Altro',
]

export const UNITS = ['pz', 'g', 'kg', 'ml', 'l', 'conf.']
