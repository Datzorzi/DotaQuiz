import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { img, load, pick, sample, save, shuffle } from '../lib/util'
import { Button, Choice, Panel, ScoreBar, SectionTitle } from '../components/ui'
import type { Option } from './questions'

const ROUND = 10

type Mode = 'ability' | 'item' | 'hero'

interface IconRound {
  mode: Mode
  prompt: string
  art: string
  options: Option[]
  answerId: string
  caption: string
  /** Ponto focal do zoom no modo herói, em % da imagem. */
  focal: [number, number]
}

/** Um ponto estável por herói: a mesma arte sempre recorta do mesmo lugar. */
function focalOf(key: string): [number, number] {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return [25 + (h % 50), 20 + ((h >> 8) % 55)]
}

export default function Icons() {
  const { t, heroes, heroAbilities, realItems, heroByKey } = useStore()
  const [mode, setMode] = useState<Mode | 'mix'>(() => load<Mode | 'mix'>('icons-mode', 'mix'))
  const [run, setRun] = useState(0)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => load('icons-best', 0))

  const rounds = useMemo<IconRound[]>(() => {
    const make = (): IconRound | null => {
      const m: Mode = mode === 'mix' ? pick(['ability', 'item', 'hero'] as const) : mode

      if (m === 'ability') {
        const ab = pick(heroAbilities.filter((a) => a.img))
        const hero = heroByKey.get(ab.hero!)
        if (!hero) return null
        const wrong = sample(heroes, 3, [hero])
        return {
          mode: m,
          prompt: t.icons.prompt.ability,
          art: ab.img!,
          options: shuffle([hero, ...wrong]).map((h) => ({ id: h.key, label: h.name, img: h.img })),
          answerId: hero.key,
          caption: `${hero.name} — ${ab.name}`,
          focal: [50, 50],
        }
      }

      if (m === 'item') {
        const item = pick(realItems)
        const wrong = sample(realItems, 3, [item])
        return {
          mode: m,
          prompt: t.icons.prompt.item,
          art: item.img!,
          options: shuffle([item, ...wrong]).map((x) => ({ id: x.key, label: x.name })),
          answerId: item.key,
          caption: `${item.name}${item.cost ? ` — ${item.cost} 🪙` : ''}`,
          focal: [50, 50],
        }
      }

      const hero = pick(heroes)
      const wrong = sample(heroes, 3, [hero])
      return {
        mode: m,
        prompt: t.icons.prompt.hero,
        art: hero.img,
        options: shuffle([hero, ...wrong]).map((h) => ({ id: h.key, label: h.name })),
        answerId: hero.key,
        caption: hero.name,
        focal: focalOf(hero.key),
      }
    }

    const out: IconRound[] = []
    const seen = new Set<string>()
    let guard = 0
    while (out.length < ROUND && guard++ < ROUND * 40) {
      const r = make()
      if (!r || seen.has(r.art)) continue
      seen.add(r.art)
      out.push(r)
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroes, heroAbilities, realItems, heroByKey, t, mode, run])

  const r = rounds[i]
  const done = i >= rounds.length

  useEffect(() => {
    if (done && score > best) {
      setBest(score)
      save('icons-best', score)
    }
  }, [done, score, best])

  const answer = useCallback(
    (id: string) => {
      if (picked || !r) return
      setPicked(id)
      if (id === r.answerId) setScore((s) => s + 1)
    },
    [picked, r]
  )

  function next() {
    setPicked(null)
    setI((n) => n + 1)
  }

  function restart() {
    setPicked(null)
    setI(0)
    setScore(0)
    setRun((n) => n + 1)
  }

  if (done) {
    return (
      <div>
        <SectionTitle>{t.common.finish}</SectionTitle>
        <Panel className="mx-auto max-w-md p-8 text-center">
          <div className="font-display text-5xl text-gold-bright">
            {score}
            <span className="text-2xl text-parch-faint">/{rounds.length}</span>
          </div>
          <p className="mt-1 text-xs text-parch-faint">
            {t.common.best}: {Math.max(best, score)}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={restart}>{t.common.playAgain}</Button>
            <Link to="/">
              <Button variant="ghost">{t.common.back}</Button>
            </Link>
          </div>
        </Panel>
      </div>
    )
  }

  if (!r) return null

  // Os retratos da Valve são arte opaca, sem transparência: filtro de brilho
  // só produz um retângulo preto. O que esconde de verdade é o zoom -- um
  // pedaço do retrato, que abre pro retrato inteiro quando a pessoa responde.
  const zoomed = r.mode === 'hero' && !picked

  return (
    <div>
      <SectionTitle sub={t.games.icons.desc}>{t.games.icons.name}</SectionTitle>

      <div className="mb-4 flex flex-wrap justify-center gap-1">
        {(['mix', 'ability', 'item', 'hero'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m)
              save('icons-mode', m)
              restart()
            }}
            className={`rounded-lg px-3 py-1 text-xs transition-colors ${
              mode === m ? 'bg-gold text-ink-900 font-semibold' : 'border border-line text-parch-dim hover:text-parch'
            }`}
          >
            {m === 'mix' ? t.patch.all : t.icons.mode[m]}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <ScoreBar score={score} best={best} progress={[i + 1, rounds.length]} />
      </div>

      <Panel className="p-6">
        <h3 className="text-center font-display text-lg text-parch">{r.prompt}</h3>

        <div className="mt-5 flex justify-center">
          <div
            className={`anim-pop overflow-hidden rounded-lg border border-line ${
              r.mode === 'hero' ? 'h-32 w-56' : 'h-28 w-28'
            }`}
          >
            <img
              key={r.art}
              src={img(r.art)}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500"
              style={
                zoomed
                  ? { transform: 'scale(3.4)', transformOrigin: `${r.focal[0]}% ${r.focal[1]}%` }
                  : undefined
              }
            />
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {r.options.map((o) => {
            const state = !picked
              ? 'idle'
              : o.id === r.answerId
                ? 'right'
                : o.id === picked
                  ? 'wrong'
                  : 'dimmed'
            return (
              <Choice key={o.id} onClick={() => answer(o.id)} state={state}>
                <span className="flex items-center gap-3">
                  {o.img && <img src={img(o.img)} alt="" className="h-8 w-12 shrink-0 rounded object-cover" />}
                  <span>{o.label}</span>
                </span>
              </Choice>
            )
          })}
        </div>

        {picked && (
          <div className="anim-pop mt-6 text-center">
            <p className={`font-display text-lg ${picked === r.answerId ? 'text-hit' : 'text-str'}`}>
              {picked === r.answerId ? t.common.correct : t.common.wrong}
            </p>
            <p className="mt-1 text-sm text-gold-bright">{r.caption}</p>
            <Button className="mt-4" onClick={next}>
              {t.common.next}
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}
