import Anthropic from '@anthropic-ai/sdk'
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

const RECIPES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['recipes'],
  properties: {
    recipes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
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
} as const

const SYSTEM = `Sei lo chef di casa di DispensIA. Ti viene fornita la lista di quello che c'è in dispensa,
in frigo e nel freezer. Proponi 3 ricette realistiche e gustose che usino il più possibile gli ingredienti
disponibili. Dai priorità agli ingredienti vicini alla scadenza. Puoi assumere che sale, pepe, olio e acqua
ci siano sempre. Se per una ricetta manca qualche ingrediente secondario, elencalo in ingredients_missing
(pochi elementi, solo cose facili da comprare). Scrivi tutto in italiano, con passi chiari e concisi.`

export async function suggestRecipes(items: Item[]): Promise<{ recipes: Recipe[] }> {
  const client = new Anthropic()

  const pantry = items
    .map((i) => {
      const expiry = i.expiry ? `, scade il ${i.expiry}` : ''
      return `- ${i.name} (${i.quantity} ${i.unit}, ${i.location}${expiry})`
    })
    .join('\n')

  const response = await client.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 8000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: RECIPES_SCHEMA },
    },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Ecco cosa ho in casa oggi:\n${pantry}\n\nCosa posso cucinare?`,
      },
    ],
  } as Parameters<typeof client.beta.messages.create>[0])

  if (response.stop_reason === 'refusal') {
    throw new Error('Richiesta rifiutata dal modello')
  }

  const text = response.content.find((b) => b.type === 'text')?.text
  if (!text) throw new Error('Risposta vuota dal modello')
  return JSON.parse(text) as { recipes: Recipe[] }
}
