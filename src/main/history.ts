import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

// query -> result path -> picks
type History = Record<string, Record<string, { count: number; last: number }>>

const HALF_LIFE = 30 * 24 * 60 * 60 * 1000

const file = () => path.join(app.getPath('userData'), 'search-history.json')

let cache: History | null = null

const load = (): History => {
  if (cache) return cache
  try {
    cache = JSON.parse(fs.readFileSync(file(), 'utf8')) as History
  } catch {
    cache = {}
  }
  return cache
}

const save = (history: History) => {
  cache = history
  fs.mkdirSync(path.dirname(file()), { recursive: true })
  fs.writeFileSync(file(), JSON.stringify(history))
}

const normalize = (query: string) => query.trim().toLowerCase()

export const recordPick = (query: string, target: string) => {
  const q = normalize(query)
  if (!q) return
  const history = load()
  const targets = history[q] ?? {}
  const entry = targets[target] ?? { count: 0, last: 0 }
  targets[target] = { count: entry.count + 1, last: Date.now() }
  history[q] = targets
  save(history)
}

// Exact-query picks count fully; picks made after typing a longer query (e.g. "spo" when typing "sp") count half.
export const boosts = (query: string) => {
  const q = normalize(query)
  const now = Date.now()
  const result = new Map<string, number>()
  if (!q) return result
  for (const [key, targets] of Object.entries(load())) {
    if (!key.startsWith(q)) continue
    const weight = key === q ? 1 : 0.5
    for (const [target, { count, last }] of Object.entries(targets)) {
      const value = weight * count * 0.5 ** ((now - last) / HALF_LIFE)
      result.set(target, (result.get(target) ?? 0) + value)
    }
  }
  return result
}

export const clearPick = (query: string, target: string) => {
  const q = normalize(query)
  const history = load()
  for (const [key, targets] of Object.entries(history)) {
    if (!key.startsWith(q)) continue
    delete targets[target]
    if (Object.keys(targets).length === 0) delete history[key]
  }
  save(history)
}
