// Indirizzo del server: vuoto = stessa origine (PWA servita dal server).
// Nell'app Android (Capacitor) va impostato l'IP del computer di casa.

const KEY = 'dispensia-server-url'

export function getServerUrl(): string {
  return localStorage.getItem(KEY) ?? ''
}

export function setServerUrl(url: string): void {
  const clean = url.trim().replace(/\/+$/, '')
  if (clean) localStorage.setItem(KEY, clean)
  else localStorage.removeItem(KEY)
}

export function apiUrl(path: string): string {
  return getServerUrl() + path
}
