import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import type { Hero } from '../types'
import { hashString, load, normalize, save, seededRandom, todayKey } from '../lib/util'
import { Button, Panel, Portrait, SectionTitle } from '../components/ui'

const MAX_GUESSES = 8

type Verdict = 'hit' | 'near' | 'miss'
type Dir = 'up' | 'down' | null

interface Cell {
  verdict: Verdict
  arrow: Dir
  label: string
}

const CELL_BG: Record<Verdict, string> = {
  hit: 'bg-hit/80 border-hit',
  near: 'bg-near/70 border-near',
  miss: 'bg-miss border-line',
}

/** Compara um palpite com a resposta, coluna por coluna. */
function compare(guess: Hero, answer: Hero, t: ReturnType<typeof useStore>['t']): Cell[] {
  const num = (g: number, a: number, tolerance: number, unit = ''): Cell => ({
    verdict: g === a ? 'hit' : Math.abs(g - a) <= tolerance ? 'near' : 'miss',
    arrow: g === a ? null : g < a ? 'up' : 'down',
    label: `${g}${unit}`,
  })

  const roles = new Set(answer.roles)
  const shared = guess.roles.filter((r) => roles.has(r))
  const rolesExact = shared.length === guess.roles.length && shared.length === answer.roles.length

  return [
    {
      verdict: guess.attr === answer.attr ? 'hit' : 'miss',
      arrow: null,
      label: t.attrs[guess.attr],
    },
    {
      verdict: guess.attack === answer.attack ? 'hit' : 'miss',
      arrow: null,
      label: t.attack[guess.attack],
    },
    {
      verdict: rolesExact ? 'hit' : shared.length ? 'near' : 'miss',
      arrow: null,
      label: guess.roles.map((r) => t.roles[r as keyof typeof t.roles] ?? r).join(', ') || '—',
    },
    num(guess.legs ?? 0, answer.legs ?? 0, 0),
    num(guess.range, answer.range, 75),
    num(guess.ms, answer.ms, 15),
  ]
}

function Arrow({ dir }: { dir: Dir }) {
  if (!dir) return null
  return (
    <span className="ml-1 text-xs opacity-80" aria-label={dir === 'up' ? 'maior' : 'menor'}>
      {dir === 'up' ? '▲' : '▼'}
    </span>
  )
}

export default function Dotle() {
  const { t, heroes } = useStore()
  const [mode, setMode] = useState<'daily' | 'free'>('daily')
  const [guesses, setGuesses] = useState<Hero[]>([])
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const [freeSeed, setFreeSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const day = todayKey()

  const answer = useMemo(() => {
    const seed = mode === 'daily' ? hashString(`dotle:${day}`) : freeSeed
    const rnd = seededRandom(seed)
    return heroes[Math.floor(rnd() * heroes.length)]
  }, [heroes, mode, day, freeSeed])

  // O desafio do dia continua de onde parou se a pessoa recarregar a página.
  useEffect(() => {
    if (mode !== 'daily') {
      setGuesses([])
      return
    }
    const saved = load<{ day: string; keys: string[] }>('dotle-daily', { day: '', keys: [] })
    if (saved.day === day) {
      const byKey = new Map(heroes.map((h) => [h.key, h]))
      setGuesses(saved.keys.map((k) => byKey.get(k)).filter((h): h is Hero => !!h))
    } else {
      setGuesses([])
    }
  }, [mode, day, heroes])

  useEffect(() => {
    if (mode === 'daily') save('dotle-daily', { day, keys: guesses.map((g) => g.key) })
  }, [guesses, mode, day])

  const solved = guesses.some((g) => g.key === answer.key)
  const over = solved || guesses.length >= MAX_GUESSES

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = normalize(query)
    const taken = new Set(guesses.map((g) => g.key))
    return heroes
      .filter((h) => !taken.has(h.key) && h.aliases.some((a) => normalize(a).includes(q)))
      .slice(0, 7)
  }, [query, heroes, guesses])

  function submit(hero: Hero) {
    if (over) return
    setGuesses((g) => [...g, hero])
    setQuery('')
    setHighlight(0)
    inputRef.current?.focus()
  }

  function shareText(): string {
    const grid = guesses
      .map((g) =>
        compare(g, answer, t)
          .map((c) => (c.verdict === 'hit' ? '🟩' : c.verdict === 'near' ? '🟨' : '⬛'))
          .join('')
      )
      .join('\n')
    const head = `Dotaquiz · Dotle ${day} — ${solved ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`}`
    return `${head}\n${grid}`
  }

  const cols = [t.dotle.cols.attr, t.dotle.cols.attack, t.dotle.cols.roles, t.dotle.cols.legs, t.dotle.cols.range, t.dotle.cols.ms]

  return (
    <div>
      <SectionTitle sub={t.games.dotle.desc}>{t.games.dotle.name}</SectionTitle>

      <div className="mb-6 flex justify-center gap-2">
        {(['daily', 'free'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
              mode === m ? 'bg-gold text-ink-900 font-semibold' : 'border border-line text-parch-dim hover:text-parch'
            }`}
          >
            {m === 'daily' ? t.dotle.daily : t.dotle.free}
          </button>
        ))}
      </div>

      {!over && (
        <div className="relative mx-auto mb-2 max-w-md">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setHighlight(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setHighlight((h) => Math.min(h + 1, suggestions.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setHighlight((h) => Math.max(h - 1, 0))
              } else if (e.key === 'Enter' && suggestions[highlight]) {
                e.preventDefault()
                submit(suggestions[highlight])
              }
            }}
            placeholder={t.dotle.placeholder}
            autoComplete="off"
            className="w-full rounded-lg border border-line bg-ink-700 px-4 py-3 text-sm outline-none placeholder:text-parch-faint focus:border-gold"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-line bg-ink-800 shadow-xl">
              {suggestions.map((h, i) => (
                <li key={h.key}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => submit(h)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
                      i === highlight ? 'bg-ink-600 text-gold-bright' : 'hover:bg-ink-700'
                    }`}
                  >
                    <Portrait hero={h} size="xs" />
                    <span>{h.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-center text-xs text-parch-faint">
            {t.dotle.guesses(guesses.length + 1, MAX_GUESSES)}
          </p>
        </div>
      )}

      {guesses.length > 0 && (
        <div className="overflow-x-auto">
          <div className="mx-auto min-w-[42rem] max-w-3xl">
            <div className="mb-1 grid grid-cols-[6rem_repeat(6,1fr)] gap-1 text-center text-[0.6rem] uppercase tracking-wider text-parch-faint">
              <div>{t.dotle.cols.hero}</div>
              {cols.map((c) => (
                <div key={c}>{c}</div>
              ))}
            </div>
            {guesses.map((g, row) => (
              <div key={g.key} className="mb-1 grid grid-cols-[6rem_repeat(6,1fr)] gap-1">
                <div className="flex items-center justify-center rounded border border-line bg-ink-700 p-1">
                  <Portrait hero={g} size="sm" />
                </div>
                {compare(g, answer, t).map((c, i) => (
                  <div
                    key={i}
                    className={`anim-flip flex min-h-14 items-center justify-center rounded border px-1 text-center text-[0.7rem] leading-tight ${CELL_BG[c.verdict]}`}
                    style={{ animationDelay: `${row === guesses.length - 1 ? i * 70 : 0}ms` }}
                  >
                    <span>
                      {c.label}
                      <Arrow dir={c.arrow} />
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {over && (
        <Panel className="mx-auto mt-6 max-w-md p-6 text-center">
          <Portrait hero={answer} size="lg" />
          <h3 className="mt-3 font-display text-xl text-gold-bright">{answer.name}</h3>
          <p className="mt-1 text-sm text-parch-dim">
            {solved ? t.dotle.won(guesses.length) : t.dotle.lost(answer.name)}
          </p>
          {answer.hype && <p className="mt-3 text-xs leading-relaxed text-parch-faint">{answer.hype}</p>}
          <div className="mt-5 flex justify-center gap-2">
            {mode === 'daily' ? (
              <Button
                onClick={() => {
                  navigator.clipboard?.writeText(shareText())
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1600)
                }}
              >
                {copied ? t.common.copied : t.common.share}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setFreeSeed(Math.floor(Math.random() * 1e9))
                  setGuesses([])
                  setQuery('')
                }}
              >
                {t.common.playAgain}
              </Button>
            )}
            <Link to="/">
              <Button variant="ghost">{t.common.back}</Button>
            </Link>
          </div>
        </Panel>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-parch-faint">
        <span className="flex items-center gap-1.5">
          <i className="h-3 w-3 rounded-sm bg-hit/80" /> {t.dotle.legend.hit}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-3 w-3 rounded-sm bg-near/70" /> {t.dotle.legend.near}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-3 w-3 rounded-sm bg-miss" /> {t.dotle.legend.miss}
        </span>
        <span>▲ {t.dotle.legend.higher}</span>
        <span>▼ {t.dotle.legend.lower}</span>
      </div>
    </div>
  )
}
