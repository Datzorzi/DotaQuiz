import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Ability, DataIndex, Hero, Item, Patch } from '../types'
import { DICTS, LANG_CODES, type Dict } from '../i18n/strings'
import { load, save } from '../lib/util'

interface Store {
  lang: string
  setLang: (l: string) => void
  t: Dict
  status: 'loading' | 'ready' | 'error'
  reload: () => void
  index: DataIndex | null
  heroes: Hero[]
  abilities: Ability[]
  items: Item[]
  heroByKey: Map<string, Hero>
  abilityByKey: Map<string, Ability>
  /** Habilidades reais de herói (sem talentos e sem entradas órfãs). */
  heroAbilities: Ability[]
  /** Itens compráveis, sem consumíveis baratos e sem lixo de loja. */
  realItems: Item[]
  loadPatches: () => Promise<Patch[]>
}

const Ctx = createContext<Store | null>(null)

const BASE = import.meta.env.BASE_URL

function detectLang(): string {
  const saved = load<string | null>('lang', null)
  if (saved && LANG_CODES.includes(saved)) return saved
  const nav = navigator.languages ?? [navigator.language]
  for (const l of nav) {
    if (LANG_CODES.includes(l)) return l
    const base = l.split('-')[0]
    const hit = LANG_CODES.find((c) => c.split('-')[0] === base)
    if (hit) return hit
  }
  return 'pt-BR'
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}data/${path}`)
  if (!res.ok) throw new Error(`${res.status} em ${path}`)
  return (await res.json()) as T
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(detectLang)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [index, setIndex] = useState<DataIndex | null>(null)
  const [heroes, setHeroes] = useState<Hero[]>([])
  const [abilities, setAbilities] = useState<Ability[]>([])
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    Promise.all([
      getJson<DataIndex>('index.json'),
      getJson<Hero[]>(`${lang}/heroes.json`),
      getJson<Ability[]>(`${lang}/abilities.json`),
      getJson<Item[]>(`${lang}/items.json`),
    ])
      .then(([idx, h, a, i]) => {
        if (cancelled) return
        setIndex(idx)
        setHeroes(h)
        setAbilities(a)
        setItems(i)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [lang, attempt])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<Store>(() => {
    const heroByKey = new Map(heroes.map((h) => [h.key, h]))
    const abilityByKey = new Map(abilities.map((a) => [a.key, a]))

    // Para os jogos só interessam habilidades que pertencem a um herói e têm
    // ícone -- o resto é habilidade de creep, de item e sobras da engine.
    const heroAbilities = abilities.filter((a) => a.hero && a.img && heroByKey.has(a.hero))

    // Itens de verdade: tem preço e não é consumível de 50 de ouro, para o
    // jogo de ícone não virar "adivinhe o Tango".
    const realItems = items.filter((i) => i.img && (i.cost ?? 0) >= 200)

    return {
      lang,
      setLang: (l: string) => {
        setLangState(l)
        save('lang', l)
      },
      t: DICTS[lang] ?? DICTS['pt-BR'],
      status,
      reload: () => setAttempt((n) => n + 1),
      index,
      heroes,
      abilities,
      items,
      heroByKey,
      abilityByKey,
      heroAbilities,
      realItems,
      loadPatches: () => getJson<Patch[]>('patches.json'),
    }
  }, [lang, status, index, heroes, abilities, items])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore fora do AppProvider')
  return v
}

/** Atalho: só os textos da interface. */
export function useT(): Dict {
  return useStore().t
}
