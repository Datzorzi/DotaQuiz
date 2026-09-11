import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../data/store'
import type { Patch } from '../types'
import { img, normalize } from '../lib/util'
import { Loading, Panel, SectionTitle } from '../components/ui'

/** As mudanças de um herói vêm como lista solta ou agrupadas por habilidade. */
function heroBlocks(
  entry: Record<string, string[]> | string[],
  abilityName: (key: string) => string | null,
  generalLabel: string
): { label: string | null; icon: string | null; lines: string[] }[] {
  if (Array.isArray(entry)) return [{ label: null, icon: null, lines: entry }]
  return Object.entries(entry).map(([k, lines]) => ({
    label: k === 'general' ? generalLabel : (abilityName(k) ?? k),
    icon: k === 'general' ? null : `abilities/${k}.png`,
    lines,
  }))
}

export default function PatchNotes() {
  const { t, loadPatches, heroByKey, abilityByKey, items } = useStore()
  const [patches, setPatches] = useState<Patch[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [sel, setSel] = useState(0)
  const [filter, setFilter] = useState('')

  // O arquivo de patches é grande; só carrega quando alguém abre esta página.
  useEffect(() => {
    let cancelled = false
    loadPatches()
      .then((p) => !cancelled && setPatches(p))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [loadPatches])

  const itemByKey = useMemo(() => new Map(items.map((i) => [i.key, i])), [items])
  const patch = patches?.[sel]

  const heroEntries = useMemo(() => {
    if (!patch) return []
    const q = normalize(filter)
    return Object.entries(patch.heroes)
      .filter(([key]) => key !== 'misc')
      .map(([key, entry]) => ({ key, hero: heroByKey.get(key), entry }))
      .filter((e) => e.hero && (!q || normalize(e.hero.name).includes(q) || normalize(e.key).includes(q)))
      .sort((a, b) => a.hero!.name.localeCompare(b.hero!.name))
  }, [patch, heroByKey, filter])

  if (failed) return <p className="py-24 text-center text-parch-dim">{t.common.error}</p>
  if (!patches) return <Loading label={t.common.loading} />
  if (!patch) return null

  const abilityName = (k: string) => abilityByKey.get(k)?.name ?? null

  return (
    <div>
      <SectionTitle sub={t.patch.subtitle}>{t.patch.title}</SectionTitle>

      <div className="mb-6 flex flex-wrap justify-center gap-1">
        {patches.map((p, k) => (
          <button
            key={p.name}
            type="button"
            onClick={() => setSel(k)}
            className={`rounded px-2.5 py-1 text-xs tabular-nums transition-colors ${
              k === sel ? 'bg-gold text-ink-900 font-semibold' : 'border border-line text-parch-dim hover:text-parch'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <p className="mb-6 text-center text-xs text-parch-faint">
        {new Date(patch.date).toLocaleDateString()} · {t.patch.englishOnly}
      </p>

      {patch.general.length > 0 && (
        <Panel className="mb-6 p-6">
          <h3 className="mb-3 font-display text-lg text-gold-bright">{t.patch.general}</h3>
          <ul className="space-y-1.5 text-sm leading-relaxed text-parch-dim">
            {patch.general.map((l, i) =>
              l === '<br>' ? (
                <li key={i} className="h-2 list-none" />
              ) : (
                <li key={i} className="border-l border-line pl-3">
                  {l}
                </li>
              )
            )}
          </ul>
        </Panel>
      )}

      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="font-display text-lg text-gold-bright">
          {t.patch.heroes} <span className="text-sm text-parch-faint">({heroEntries.length})</span>
        </h3>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t.patch.pickHero}
          className="w-48 rounded-lg border border-line bg-ink-700 px-3 py-1.5 text-xs outline-none placeholder:text-parch-faint focus:border-gold"
        />
      </div>

      <div className="mb-8 space-y-3">
        {heroEntries.map(({ key, hero, entry }) => (
          <Panel key={key} className="p-4">
            <div className="mb-3 flex items-center gap-3">
              <img src={img(hero!.img)} alt="" className="h-9 w-16 rounded object-cover" />
              <span className="font-display text-parch">{hero!.name}</span>
            </div>
            <div className="space-y-3">
              {heroBlocks(entry, abilityName, t.patch.general).map((b, i) => (
                <div key={i}>
                  {b.label && (
                    <div className="mb-1 flex items-center gap-2">
                      {b.icon && <img src={img(b.icon)} alt="" className="h-5 w-5 rounded" />}
                      <span className="text-xs font-semibold text-gold">{b.label}</span>
                    </div>
                  )}
                  <ul className="space-y-1 text-sm text-parch-dim">
                    {b.lines.map((l, k) => (
                      <li key={k} className="border-l border-line pl-3">
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Panel>
        ))}
        {heroEntries.length === 0 && (
          <p className="py-8 text-center text-sm text-parch-faint">{t.patch.noChanges}</p>
        )}
      </div>

      {Object.keys(patch.items).length > 0 && (
        <>
          <h3 className="mb-4 font-display text-lg text-gold-bright">{t.patch.items}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(patch.items).map(([key, lines]) => {
              const item = itemByKey.get(key)
              return (
                <Panel key={key} className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    {item?.img && <img src={img(item.img)} alt="" className="h-7 w-7 rounded" />}
                    <span className="text-sm font-semibold text-parch">{item?.name ?? key}</span>
                  </div>
                  <ul className="space-y-1 text-sm text-parch-dim">
                    {lines.map((l, k) => (
                      <li key={k} className="border-l border-line pl-3">
                        {l}
                      </li>
                    ))}
                  </ul>
                </Panel>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
