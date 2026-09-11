import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { img, load, maskAnswer, pick, sample, save, shuffle } from '../lib/util'
import { Button, Choice, Panel, ScoreBar, SectionTitle } from '../components/ui'
import type { Option } from './questions'

const ROUND = 10

interface LoreRound {
  /** Trechos em ordem: o primeiro aparece, os outros saem como dica. */
  passages: string[]
  sourceLabel: string
  prompt: string
  options: Option[]
  answerId: string
  reveal: { name: string; img: string; text: string }
}

/** Quebra um texto longo em pedaços de mais ou menos `size` caracteres,
 *  cortando em fim de frase pra cada trecho fazer sentido sozinho. */
function passages(text: string, size = 260): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const out: string[] = []
  let buf = ''
  for (const s of sentences) {
    if ((buf + s).length > size && buf) {
      out.push(buf.trim())
      buf = ''
    }
    buf += s + ' '
  }
  if (buf.trim()) out.push(buf.trim())
  return out.length ? out : [text]
}

export default function Lore() {
  const { t, heroes, heroAbilities, realItems } = useStore()
  const [run, setRun] = useState(0)
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(1)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => load('lore-best', 0))

  const rounds = useMemo<LoreRound[]>(() => {
    const make = (): LoreRound | null => {
      const kind = pick(['hero', 'hero', 'ability', 'item'] as const)

      if (kind === 'hero') {
        const pool = heroes.filter((h) => h.bio && h.bio.length > 200)
        if (pool.length < 4) return null
        const hero = pick(pool)
        const wrong = sample(pool, 3, [hero])
        const names = [hero.name, hero.enName, ...hero.aliases]
        // Um trecho curto demais (a última frase solta da bio) não dá pista
        // nenhuma e só irrita -- ficam de fora.
        const chunks = passages(hero.bio!).filter((p) => p.length >= 120)
        if (!chunks.length) return null
        return {
          passages: shuffle(chunks).slice(0, 4).map((p) => maskAnswer(p, names)),
          sourceLabel: t.lore.source.hero,
          prompt: t.lore.prompt,
          options: shuffle([hero, ...wrong]).map((h) => ({ id: h.key, label: h.name, img: h.img })),
          answerId: hero.key,
          reveal: { name: hero.name, img: hero.img, text: hero.hype ?? '' },
        }
      }

      if (kind === 'ability') {
        const pool = heroAbilities.filter((a) => a.lore && a.lore.length > 60)
        if (pool.length < 4) return null
        const ab = pick(pool)
        const hero = heroes.find((h) => h.key === ab.hero)
        if (!hero) return null
        const wrong = sample(heroes, 3, [hero])
        return {
          passages: [maskAnswer(ab.lore!, [ab.name, ab.enName, hero.name, hero.enName, ...hero.aliases])],
          sourceLabel: t.lore.source.ability,
          prompt: t.lore.prompt,
          options: shuffle([hero, ...wrong]).map((h) => ({ id: h.key, label: h.name, img: h.img })),
          answerId: hero.key,
          reveal: { name: `${hero.name} — ${ab.name}`, img: ab.img ?? hero.img, text: ab.desc ?? '' },
        }
      }

      const pool = realItems.filter((it) => it.lore && it.lore.length > 50)
      if (pool.length < 4) return null
      const item = pick(pool)
      const wrong = sample(pool, 3, [item])
      return {
        passages: [maskAnswer(item.lore!, [item.name, item.enName])],
        sourceLabel: t.lore.source.item,
        prompt: t.lore.promptItem,
        options: shuffle([item, ...wrong]).map((x) => ({ id: x.key, label: x.name, img: x.img ?? undefined })),
        answerId: item.key,
        reveal: { name: item.name, img: item.img ?? '', text: item.desc ?? '' },
      }
    }

    const out: LoreRound[] = []
    const seen = new Set<string>()
    let guard = 0
    while (out.length < ROUND && guard++ < ROUND * 40) {
      const r = make()
      if (!r || seen.has(r.answerId)) continue
      seen.add(r.answerId)
      out.push(r)
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroes, heroAbilities, realItems, t, run])

  const r = rounds[i]
  const done = i >= rounds.length

  useEffect(() => {
    if (done && score > best) {
      setBest(score)
      save('lore-best', score)
    }
  }, [done, score, best])

  const answer = useCallback(
    (id: string) => {
      if (picked || !r) return
      setPicked(id)
      // Quem acerta de primeira leva 2; com dica aberta, 1.
      if (id === r.answerId) setScore((s) => s + (shown === 1 ? 2 : 1))
    },
    [picked, r, shown]
  )

  function next() {
    setPicked(null)
    setShown(1)
    setI((n) => n + 1)
  }

  function restart() {
    setPicked(null)
    setShown(1)
    setI(0)
    setScore(0)
    setRun((n) => n + 1)
  }

  if (done) {
    const max = rounds.length * 2
    return (
      <div>
        <SectionTitle>{t.common.finish}</SectionTitle>
        <Panel className="mx-auto max-w-md p-8 text-center">
          <div className="font-display text-5xl text-gold-bright">
            {score}
            <span className="text-2xl text-parch-faint">/{max}</span>
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

  return (
    <div>
      <SectionTitle sub={t.games.lore.desc}>{t.games.lore.name}</SectionTitle>

      <div className="mb-6">
        <ScoreBar score={score} best={best} progress={[i + 1, rounds.length]} />
      </div>

      <Panel className="p-6">
        <p className="text-center text-[0.65rem] uppercase tracking-[0.2em] text-parch-faint">
          {r.sourceLabel}
        </p>
        <h3 className="mt-1 text-center font-display text-lg text-parch">{r.prompt}</h3>

        <div className="mx-auto mt-5 max-w-2xl space-y-3">
          {r.passages.slice(0, shown).map((p, k) => (
            <blockquote
              key={k}
              className="anim-pop rounded-lg border-l-2 border-gold/60 bg-ink-800/60 p-4 text-sm leading-relaxed text-parch-dim italic"
            >
              {p}
            </blockquote>
          ))}
        </div>

        {!picked && shown < r.passages.length && (
          <div className="mt-4 text-center">
            <Button variant="quiet" size="sm" onClick={() => setShown((s) => s + 1)}>
              + {t.lore.reveal}
            </Button>
          </div>
        )}

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
            <div className="mt-3 flex items-center justify-center gap-3">
              {r.reveal.img && (
                <img src={img(r.reveal.img)} alt="" className="h-12 w-20 rounded border border-line object-cover" />
              )}
              <span className="font-display text-gold-bright">{r.reveal.name}</span>
            </div>
            {r.reveal.text && (
              <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-parch-faint">
                {r.reveal.text}
              </p>
            )}
            <Button className="mt-4" onClick={next}>
              {t.common.next}
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}
