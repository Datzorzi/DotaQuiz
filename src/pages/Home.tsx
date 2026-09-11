import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { img } from '../lib/util'
import { useMemo } from 'react'

const GAMES = [
  { id: 'dotle', to: '/dotle', accent: 'from-gold/20' },
  { id: 'quiz', to: '/quiz', accent: 'from-int/20' },
  { id: 'lore', to: '/lore', accent: 'from-uni/20' },
  { id: 'icons', to: '/icones', accent: 'from-agi/20' },
] as const

export default function Home() {
  const { t, heroes, index } = useStore()

  // Uma fileira de retratos como plano de fundo do cabeçalho -- muda a cada
  // visita, então a home nunca parece a mesma duas vezes.
  const strip = useMemo(() => {
    const picked: typeof heroes = []
    const used = new Set<number>()
    while (picked.length < 14 && used.size < heroes.length) {
      const i = Math.floor(Math.random() * heroes.length)
      if (used.has(i)) continue
      used.add(i)
      picked.push(heroes[i])
    }
    return picked
  }, [heroes])

  return (
    <div>
      <section className="relative mb-12 overflow-hidden rounded-2xl border border-line py-14 text-center">
        <div className="absolute inset-0 flex opacity-20" aria-hidden>
          {strip.map((h) => (
            <img key={h.key} src={img(h.img)} alt="" className="h-full flex-1 object-cover" />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/85 to-ink-900/60" aria-hidden />
        <div className="relative px-4">
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">
            Dota<span className="text-gold">quiz</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-parch-dim sm:text-base">{t.home.tagline}</p>
          <p className="mx-auto mt-2 max-w-xl text-xs text-parch-faint">{t.home.blurb}</p>
          {index && (
            <p className="mt-5 inline-block rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs text-gold-bright">
              {t.home.dataFrom(index.patch)}
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {GAMES.map((g) => {
          const info = t.games[g.id]
          return (
            <Link
              key={g.id}
              to={g.to}
              className={`panel gilded group relative overflow-hidden bg-gradient-to-br ${g.accent} to-transparent p-6 transition-colors hover:border-gold/60`}
            >
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-parch-faint">{info.tag}</span>
              <h2 className="mt-1 font-display text-2xl text-parch group-hover:text-gold-bright">{info.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-parch-dim">{info.desc}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-gold">
                {t.home.play} <span aria-hidden>→</span>
              </span>
            </Link>
          )
        })}
      </div>

      <p className="mt-8 text-center text-xs text-parch-faint">{t.home.langNote}</p>
    </div>
  )
}
