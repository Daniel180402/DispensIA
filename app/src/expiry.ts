export function daysToExpiry(expiry: string | null): number | null {
  if (!expiry) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(`${expiry}T00:00:00`)
  return Math.round((date.getTime() - today.getTime()) / 86_400_000)
}

export function expiryBadge(expiry: string | null): { label: string; className: string } | null {
  const days = daysToExpiry(expiry)
  if (days === null) return null
  if (days < 0) return { label: 'Scaduto', className: 'bg-red-500/15 text-red-400' }
  if (days === 0) return { label: 'Scade oggi', className: 'bg-red-500/15 text-red-400' }
  if (days <= 3) return { label: `Scade tra ${days}g`, className: 'bg-amber-500/15 text-amber-400' }
  if (days <= 7) return { label: `${days} giorni`, className: 'bg-zinc-500/15 text-zinc-400' }
  return null
}
