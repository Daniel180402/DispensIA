import type { Item } from './db.js'

export interface Recipe {
  name: string
  description: string
  time_minutes: number
  difficulty: 'facile' | 'media' | 'difficile'
  ingredients_available: string[]
  ingredients_missing: string[]
  steps: string[]
}

const OLLAMA_URL = (process.env.OLLAMA_URL ?? 'http://localhost:11434').replace(/\/+$/, '')
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b'

// Schema JSON passato a Ollama come "format": vincola l'output del modello
const RECIPES_SCHEMA = {
  type: 'object',
  required: ['recipes'],
  properties: {
    recipes: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        required: [
          'name',
          'description',
          'time_minutes',
          'difficulty',
          'ingredients_available',
          'ingredients_missing',
          'steps',
        ],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          time_minutes: { type: 'integer' },
          difficulty: { type: 'string', enum: ['facile', 'media', 'difficile'] },
          ingredients_available: { type: 'array', items: { type: 'string' } },
          ingredients_missing: { type: 'array', items: { type: 'string' } },
          steps: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
}

const SYSTEM = `Sei lo chef di casa di DispensIA. Ti viene fornita la lista di quello che c'è in dispensa,
in frigo e nel freezer. Proponi 3 ricette realistiche e gustose che usino il più possibile gli ingredienti
disponibili. Dai priorità agli ingredienti vicini alla scadenza. Puoi assumere che sale, pepe, olio e acqua
ci siano sempre. Se per una ricetta manca qualche ingrediente secondario, elencalo in ingredients_missing
(pochi elementi, solo cose facili da comprare). Scrivi tutto in italiano, con passi chiari e concisi.`

export class OllamaError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
  }
}

export async function suggestRecipes(items: Item[]): Promise<{ recipes: Recipe[] }> {
  const pantry = items
    .map((i) => {
      const expiry = i.expiry ? `, scade il ${i.expiry}` : ''
      return `- ${i.name} (${i.quantity} ${i.unit}, ${i.location}${expiry})`
    })
    .join('\n')

  let res: Response
  try {
    res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: RECIPES_SCHEMA,
        options: { temperature: 0.7 },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Ecco cosa ho in casa oggi:\n${pantry}\n\nCosa posso cucinare?` },
        ],
      }),
      signal: AbortSignal.timeout(300_000),
    })
  } catch {
    throw new OllamaError(
      `Ollama non raggiungibile su ${OLLAMA_URL}: assicurati che il servizio sia attivo`,
      503
    )
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    if (body?.error?.includes('not found')) {
      throw new OllamaError(
        `Modello ${OLLAMA_MODEL} non scaricato: esegui "ollama pull ${OLLAMA_MODEL}"`,
        503
      )
    }
    throw new OllamaError(body?.error ?? `Ollama ha risposto ${res.status}`, 502)
  }

  const data = (await res.json()) as { message?: { content?: string } }
  if (!data.message?.content) throw new OllamaError('Risposta vuota dal modello', 502)
  return JSON.parse(data.message.content) as { recipes: Recipe[] }
}
