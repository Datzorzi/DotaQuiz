const CDN = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/'

/** Os JSON guardam so o caminho relativo; o host da CDN entra aqui. */
export const img = (p: string | null | undefined): string => (p ? CDN + p : '')

// --- aleatoriedade ----------------------------------------------------------

/** PRNG deterministico (mulberry32) -- serve pro desafio diario. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Data local no formato AAAA-MM-DD -- a chave do desafio do dia. */
export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function shuffle<T>(arr: readonly T[], rnd: () => number = Math.random): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pick<T>(arr: readonly T[], rnd: () => number = Math.random): T {
  return arr[Math.floor(rnd() * arr.length)]
}

/** N itens distintos, opcionalmente excluindo alguns. */
export function sample<T>(arr: readonly T[], n: number, exclude: readonly T[] = [], rnd = Math.random): T[] {
  const pool = arr.filter((x) => !exclude.includes(x))
  return shuffle(pool, rnd).slice(0, n)
}

// --- texto ------------------------------------------------------------------

/** Minusculo, sem acento e sem pontuacao: pra comparar respostas digitadas. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Esconde o nome da resposta dentro de um texto de lore. Sem isso o jogo de
 * lore se entrega sozinho -- a bio do Axe cita "Mogul Khan" e "Axe".
 */
export function maskAnswer(text: string, answers: readonly string[]): string {
  let out = text
  const parts = new Set<string>()
  for (const a of answers) {
    parts.add(a)
    // Nomes compostos vazam pelo pedaco: "Anti-Mage" -> "Anti", "Mage".
    for (const w of a.split(/[\s\-']+/)) if (w.length > 3) parts.add(w)
  }
  for (const p of [...parts].sort((x, y) => y.length - x.length)) {
    const esc = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out.replace(new RegExp(esc, 'gi'), '█'.repeat(Math.min(p.length, 9)))
  }
  return out
}

export function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  const cut = s.slice(0, n)
  const sp = cut.lastIndexOf(' ')
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut) + '…'
}

/** Valores de habilidade vem como "12" ou ["12","13","14"]. */
export function joinValues(v: string | string[] | number | number[] | null): string {
  if (v == null) return ''
  return Array.isArray(v) ? v.join(' / ') : String(v)
}

export const ATTR_COLOR: Record<string, string> = {
  str: 'text-str',
  agi: 'text-agi',
  int: 'text-int',
  all: 'text-uni',
}

// --- localStorage -----------------------------------------------------------

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`dotaquiz:${key}`)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(`dotaquiz:${key}`, JSON.stringify(value))
  } catch {
    /* modo privado / storage cheio: o jogo continua, so nao lembra */
  }
}
