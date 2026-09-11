import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { img, load, save } from '../lib/util'
import { makeQuiz, type Difficulty, type Question } from './questions'
import { Button, Choice, Panel, ScoreBar, SectionTitle } from '../components/ui'

const ROUND = 10

export default function Quiz() {
  const { t, heroes, heroAbilities, realItems } = useStore()
  const [difficulty, setDifficulty] = useState<Difficulty>(() => load<Difficulty>('quiz-diff', 'normal'))
  const [run, setRun] = useState(0)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => load('quiz-best', 0))

  const questions = useMemo(
    () => makeQuiz({ heroes, heroAbilities, items: realItems, t, difficulty }, ROUND),
    // `run` força um baralho novo a cada partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [heroes, heroAbilities, realItems, t, difficulty, run]
  )

  const q: Question | undefined = questions[i]
  const done = i >= questions.length

  useEffect(() => {
    if (done && score > best) {
      setBest(score)
      save('quiz-best', score)
    }
  }, [done, score, best])

  const answer = useCallback(
    (id: string) => {
      if (picked || !q) return
      setPicked(id)
      if (id === q.answerId) setScore((s) => s + 1)
    },
    [picked, q]
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

  // Teclado: 1-4 responde, Enter/espaço avança.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!q) return
      const n = Number(e.key)
      if (n >= 1 && n <= q.options.length && !picked) answer(q.options[n - 1].id)
      else if ((e.key === 'Enter' || e.key === ' ') && picked) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [q, picked, answer])

  if (done) {
    return (
      <div>
        <SectionTitle>{t.common.finish}</SectionTitle>
        <Panel className="mx-auto max-w-md p-8 text-center">
          <div className="font-display text-5xl text-gold-bright">
            {score}
            <span className="text-2xl text-parch-faint">/{questions.length}</span>
          </div>
          <p className="mt-2 text-sm text-parch-dim">{t.common.yourScore(score, questions.length)}</p>
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

  if (!q) return null

  return (
    <div>
      <SectionTitle>{t.games.quiz.name}</SectionTitle>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
        <ScoreBar score={score} best={best} progress={[i + 1, questions.length]} />
      </div>

      <div className="mb-6 flex justify-center gap-1">
        {(['easy', 'normal', 'hard'] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setDifficulty(d)
              save('quiz-diff', d)
              restart()
            }}
            className={`rounded-lg px-3 py-1 text-xs transition-colors ${
              difficulty === d ? 'bg-gold text-ink-900 font-semibold' : 'border border-line text-parch-dim hover:text-parch'
            }`}
          >
            {t.common[d]}
          </button>
        ))}
      </div>

      <Panel className="p-6">
        <h3 className="text-center font-display text-lg text-parch sm:text-xl">{q.prompt}</h3>

        {q.art && (
          <div className="mt-5 flex justify-center">
            <img
              src={img(q.art.img)}
              alt=""
              className={`h-24 ${q.art.rounded ? 'w-24 rounded-lg' : 'w-auto rounded'} border border-line object-cover`}
            />
          </div>
        )}

        {q.body && (
          <p className="mx-auto mt-5 max-w-xl whitespace-pre-line rounded-lg border border-line/60 bg-ink-800/60 p-4 text-center text-sm leading-relaxed text-parch-dim">
            {q.body}
          </p>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {q.options.map((o, idx) => {
            const state = !picked
              ? 'idle'
              : o.id === q.answerId
                ? 'right'
                : o.id === picked
                  ? 'wrong'
                  : 'dimmed'
            return (
              <Choice key={o.id} onClick={() => answer(o.id)} state={state}>
                <span className="flex items-center gap-3">
                  <span className="w-4 shrink-0 text-xs text-parch-faint tabular-nums">{idx + 1}</span>
                  {o.img && (
                    <img src={img(o.img)} alt="" className="h-8 w-12 shrink-0 rounded object-cover" />
                  )}
                  <span>{o.label}</span>
                </span>
              </Choice>
            )
          })}
        </div>

        {picked && (
          <div className="anim-pop mt-6 text-center">
            <p
              className={`font-display text-lg ${picked === q.answerId ? 'text-hit' : 'text-str'}`}
            >
              {picked === q.answerId ? t.common.correct : t.common.wrong}
            </p>
            {q.footnote && (
              <p className="mx-auto mt-2 max-w-xl text-xs italic leading-relaxed text-parch-faint">
                {q.footnote}
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
