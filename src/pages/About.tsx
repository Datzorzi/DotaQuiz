import { useStore } from '../data/store'
import { Panel, SectionTitle } from '../components/ui'

const SOURCES = [
  { label: 'odota/dotaconstants', href: 'https://github.com/odota/dotaconstants' },
  { label: 'dotabuff/d2vpkr (localização oficial da Valve)', href: 'https://github.com/dotabuff/d2vpkr' },
  { label: 'Dota 2', href: 'https://www.dota2.com' },
]

export default function About() {
  const { t, index, heroes, abilities, items } = useStore()

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle>{t.about.title}</SectionTitle>

      <Panel className="p-6">
        {t.about.body.map((p, i) => (
          <p key={i} className="mb-4 text-sm leading-relaxed text-parch-dim last:mb-0">
            {p}
          </p>
        ))}
      </Panel>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [heroes.length, t.patch.heroes],
          [abilities.length, t.games.icons.name],
          [items.length, t.patch.items],
          [index?.patch ?? '—', 'Patch'],
        ].map(([n, label]) => (
          <Panel key={String(label)} className="p-4 text-center">
            <div className="font-display text-2xl text-gold-bright tabular-nums">{n}</div>
            <div className="text-[0.65rem] uppercase tracking-widest text-parch-faint">{label}</div>
          </Panel>
        ))}
      </div>

      <Panel className="mt-6 p-6">
        <h3 className="mb-3 font-display text-sm uppercase tracking-widest text-gold">{t.about.sources}</h3>
        <ul className="space-y-2 text-sm">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-parch-dim underline decoration-line underline-offset-4 transition-colors hover:text-gold-bright"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        {index && (
          <p className="mt-4 text-xs text-parch-faint">
            {t.about.updated} {new Date(index.generated).toLocaleString()}
          </p>
        )}
      </Panel>
    </div>
  )
}
