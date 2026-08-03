import { useState } from 'react'
import { getServerUrl, setServerUrl } from '../settings'
import { syncNow } from '../sync'

export default function SettingsSheet({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState(getServerUrl())
  const [testResult, setTestResult] = useState<string | null>(null)

  function save() {
    setServerUrl(url)
    void syncNow()
    onClose()
  }

  async function test() {
    setTestResult('Provo…')
    try {
      const base = url.trim().replace(/\/+$/, '')
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(4000) })
      const data = await res.json()
      setTestResult(data?.ok ? 'Server raggiungibile ✓' : 'Risposta inattesa dal server')
    } catch {
      setTestResult('Server non raggiungibile')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-zinc-950 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
        <h2 className="mb-1 text-lg font-semibold text-zinc-100">Impostazioni</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Indirizzo del server di casa. Lascia vuoto se usi l'app dal browser (stesso indirizzo del
          server).
        </p>

        <input
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-500"
          placeholder="http://192.168.1.10:8080"
          type="url"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setTestResult(null)
          }}
        />

        {testResult && <p className="mt-2 text-sm text-zinc-400">{testResult}</p>}

        <div className="mt-5 flex gap-3">
          <button
            className="rounded-xl bg-zinc-800 px-4 py-3 font-medium text-zinc-300 active:bg-zinc-700"
            onClick={() => void test()}
          >
            Prova connessione
          </button>
          <button
            className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white active:bg-emerald-500"
            onClick={save}
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  )
}
