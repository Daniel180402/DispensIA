import { useState } from 'react'
import { apiUrl } from '../settings'

interface Recipe {
  name: string
  description: string
  time_minutes: number
  difficulty: 'facile' | 'media' | 'difficile'
  ingredients_available: string[]
  ingredients_missing: string[]
  steps: string[]
}

interface RecipesResult {
  recipes: Recipe[]
  generatedAt: number
}

const CACHE_KEY = 'dispensia-recipes'

function loadCached(): RecipesResult | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as RecipesResult) : null
  } catch {
    return null
  }
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl bg-zinc-900 p-4">
      <button className="w-full text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-zinc-100">{recipe.name}</h3>
          <span className="shrink-0 text-zinc-500">{open ? '▴' : '▾'}</span>
        </div>
        <p className="mt-1 text-sm text-zinc-400">{recipe.description}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-400">
            ⏱ {recipe.time_minutes} min
          </span>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-400">
            {recipe.difficulty}
          </span>
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-zinc-800 pt-3">
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Hai già
            </h4>
            <p className="text-sm text-zinc-300">{recipe.ingredients_available.join(', ')}</p>
          </div>
          {recipe.ingredients_missing.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-400">
                Da comprare
              </h4>
              <p className="text-sm text-zinc-300">{recipe.ingredients_missing.join(', ')}</p>
            </div>
          )}
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Preparazione
            </h4>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-zinc-300">
              {recipe.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RecipesView() {
  const [result, setResult] = useState<RecipesResult | null>(loadCached)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(apiUrl('/api/recipes'), {
        method: 'POST',
        signal: AbortSignal.timeout(300_000),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Errore del server')
        return
      }
      setResult(data as RecipesResult)
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch {
      setError('Server non raggiungibile: le ricette si generano quando sei a casa, sulla tua rete.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        className="w-full rounded-2xl bg-emerald-600 py-3.5 font-semibold text-white active:bg-emerald-500 disabled:opacity-50"
        disabled={loading}
        onClick={() => void generate()}
      >
        {loading ? 'Lo chef ci sta pensando…' : '🍳 Cosa cucino oggi?'}
      </button>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      {result && (
        <>
          <p className="px-1 text-xs text-zinc-600">
            Suggerite il{' '}
            {new Date(result.generatedAt).toLocaleString('it-IT', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            in base alla tua dispensa
          </p>
          {result.recipes.map((recipe) => (
            <RecipeCard key={recipe.name} recipe={recipe} />
          ))}
        </>
      )}

      {!result && !loading && !error && (
        <div className="mt-20 text-center text-zinc-500">
          <div className="mb-2 text-4xl">🍳</div>
          <p>Tocca il pulsante e l'IA ti suggerisce</p>
          <p>cosa cucinare con quello che hai in casa.</p>
        </div>
      )}
    </div>
  )
}
