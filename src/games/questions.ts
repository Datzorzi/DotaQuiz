// Gerador de perguntas do quiz.
//
// Nada e escrito a mao: cada pergunta e montada na hora a partir dos dados do
// patch. Isso significa que o quiz nunca repete e nunca fica desatualizado --
// quando a Valve mexe num numero, a pergunta muda junto.

import type { Ability, Hero, Item } from '../types'
import type { Dict } from '../i18n/strings'
import { maskAnswer, pick, sample, shuffle, truncate } from '../lib/util'

export type Difficulty = 'easy' | 'normal' | 'hard'

export interface Option {
  id: string
  label: string
  /** Caminho de imagem na CDN, quando a alternativa e visual. */
  img?: string
}

export interface Question {
  kind: string
  prompt: string
  /** Texto longo mostrado num bloco separado (descricao, lore, talento). */
  body?: string
  /** Imagem grande acima das alternativas. */
  art?: { img: string; rounded?: boolean }
  options: Option[]
  answerId: string
  /** Curiosidade revelada depois de responder. */
  footnote?: string
}

export interface Pool {
  heroes: Hero[]
  heroAbilities: Ability[]
  items: Item[]
  t: Dict
  difficulty: Difficulty
}

type Gen = (p: Pool) => Question | null

const heroOption = (h: Hero): Option => ({ id: h.key, label: h.name, img: h.img })

// --- geradores --------------------------------------------------------------
//
// Cada gerador devolve null quando os dados nao dao uma pergunta justa (empate,
// resposta ambigua, texto faltando). Quem chama simplesmente tenta outra.

const whoHasAbility: Gen = ({ heroes, heroAbilities, t, difficulty }) => {
  const ability = pick(heroAbilities.filter((a) => a.img))
  const hero = heroes.find((h) => h.key === ability.hero)
  if (!hero) return null
  const pool = difficulty === 'hard' ? heroes.filter((h) => h.attr === hero.attr) : heroes
  const wrong = sample(pool.length >= 4 ? pool : heroes, 3, [hero])
  return {
    kind: 'whoHasAbility',
    prompt: t.quiz.q.whoHasAbility,
    art: { img: ability.img!, rounded: true },
    body: ability.name,
    options: shuffle([hero, ...wrong]).map(heroOption),
    answerId: hero.key,
    footnote: ability.lore ?? undefined,
  }
}

const whichAbility: Gen = ({ heroes, heroAbilities, t }) => {
  const ability = pick(heroAbilities.filter((a) => a.desc && a.desc.length > 40))
  const hero = heroes.find((h) => h.key === ability.hero)
  if (!hero) return null
  const wrong = sample(heroAbilities.filter((a) => a.hero !== ability.hero), 3, [])
  return {
    kind: 'whichAbility',
    prompt: t.quiz.q.whichAbility,
    // Sem a mascara a descricao entrega o nome do heroi e da propria skill.
    body: maskAnswer(truncate(ability.desc!, 260), [ability.name, ability.enName, hero.name, hero.enName]),
    options: shuffle([ability, ...wrong]).map((a) => ({ id: a.key, label: a.name, img: a.img ?? undefined })),
    answerId: ability.key,
    footnote: `${hero.name} — ${ability.name}`,
  }
}

const heroAttr: Gen = ({ heroes, t }) => {
  const hero = pick(heroes)
  const attrs: Hero['attr'][] = ['str', 'agi', 'int', 'all']
  return {
    kind: 'heroAttr',
    prompt: t.quiz.q.heroAttr(hero.name),
    art: { img: hero.img },
    options: attrs.map((a) => ({ id: a, label: t.attrs[a] })),
    answerId: hero.attr,
    footnote: hero.hype ?? undefined,
  }
}

const itemCost: Gen = ({ items, t, difficulty }) => {
  const pool = items.filter((i) => (i.cost ?? 0) > 0)
  const item = pick(pool)
  const costs = new Set<number>([item.cost!])
  const spread = difficulty === 'hard' ? 0.18 : 0.6
  let guard = 0
  while (costs.size < 4 && guard++ < 60) {
    const delta = (Math.random() * 2 - 1) * spread * item.cost!
    const c = Math.max(50, Math.round((item.cost! + delta) / 25) * 25)
    if (c !== item.cost) costs.add(c)
  }
  return {
    kind: 'itemCost',
    prompt: t.quiz.q.itemCost(item.name),
    art: { img: item.img!, rounded: true },
    options: shuffle([...costs]).map((c) => ({ id: String(c), label: `${c} 🪙` })),
    answerId: String(item.cost),
    footnote: item.lore ?? undefined,
  }
}

const whichItemLore: Gen = ({ items, t }) => {
  const pool = items.filter((i) => i.lore && i.lore.length > 30)
  if (pool.length < 4) return null
  const item = pick(pool)
  const wrong = sample(pool, 3, [item])
  return {
    kind: 'whichItemLore',
    prompt: t.quiz.q.whichItemLore,
    body: maskAnswer(truncate(item.lore!, 240), [item.name, item.enName]),
    options: shuffle([item, ...wrong]).map((i) => ({ id: i.key, label: i.name, img: i.img ?? undefined })),
    answerId: item.key,
  }
}

function superlative(
  key: 'fastest' | 'toughest' | 'longestRange',
  value: (h: Hero) => number,
  unit: string
): Gen {
  return ({ heroes, t, difficulty }) => {
    // No modo nerd os quatro candidatos ficam colados no mesmo valor, então
    // não dá pra ir no chute do "esse aí parece rápido".
    const anchor = pick(heroes)
    const picked =
      difficulty === 'hard'
        ? sample(
            heroes
              .slice()
              .sort((a, b) => Math.abs(value(a) - value(anchor)) - Math.abs(value(b) - value(anchor)))
              .slice(0, 10),
            4
          )
        : sample(heroes, 4)
    if (picked.length < 4) return null
    const best = picked.reduce((a, b) => (value(b) > value(a) ? b : a))
    // Empate deixaria a pergunta sem resposta unica.
    if (picked.filter((h) => value(h) === value(best)).length > 1) return null
    return {
      kind: key,
      prompt: t.quiz.q[key],
      options: picked.map(heroOption),
      answerId: best.key,
      footnote: picked
        .slice()
        .sort((a, b) => value(b) - value(a))
        .map((h) => `${h.name}: ${value(h)}${unit}`)
        .join(' · '),
    }
  }
}

const whoseTalent: Gen = ({ heroes, t, difficulty }) => {
  const withTalents = heroes.filter((h) => h.talents.length)
  const hero = pick(withTalents)
  const talent = pick(hero.talents)
  if (/[{}]/.test(talent.text)) return null // sobrou placeholder da fonte
  const pool = difficulty === 'hard' ? withTalents.filter((h) => h.attr === hero.attr) : withTalents
  const wrong = sample(pool.length >= 4 ? pool : withTalents, 3, [hero])
  return {
    kind: 'whoseTalent',
    prompt: t.quiz.q.whoseTalent,
    body: `${t.quiz.level(talent.level * 5 + 5)} — ${maskAnswer(talent.text, [hero.name, hero.enName])}`,
    options: shuffle([hero, ...wrong]).map(heroOption),
    answerId: hero.key,
  }
}

const abilityOfHero: Gen = ({ heroes, heroAbilities, t }) => {
  const hero = pick(heroes.filter((h) => h.abilities.length))
  const mine = heroAbilities.filter((a) => a.hero === hero.key)
  if (!mine.length) return null
  const right = pick(mine)
  const wrong = sample(heroAbilities.filter((a) => a.hero !== hero.key), 3, [])
  return {
    kind: 'abilityOfHero',
    prompt: t.quiz.q.abilityOfHero(hero.name),
    art: { img: hero.img },
    options: shuffle([right, ...wrong]).map((a) => ({ id: a.key, label: a.name, img: a.img ?? undefined })),
    answerId: right.key,
  }
}

const whichHeroRoles: Gen = ({ heroes, t }) => {
  const hero = pick(heroes.filter((h) => h.roles.length >= 2))
  const signature = hero.roles.join('|')
  // Só vale se a combinação de papéis for única, senão há mais de uma resposta.
  if (heroes.filter((h) => h.roles.join('|') === signature).length !== 1) return null
  const wrong = sample(heroes, 3, [hero])
  return {
    kind: 'whichHeroRoles',
    prompt: t.quiz.q.whichHeroRoles(
      hero.roles.map((r) => t.roles[r as keyof typeof t.roles] ?? r).join(', ')
    ),
    options: shuffle([hero, ...wrong]).map(heroOption),
    answerId: hero.key,
  }
}

const GENERATORS: Gen[] = [
  whoHasAbility,
  whoHasAbility, // peso maior: e a pergunta mais divertida
  whichAbility,
  heroAttr,
  itemCost,
  whichItemLore,
  superlative('fastest', (h) => h.ms, ''),
  superlative('toughest', (h) => h.str[0], ''),
  superlative('longestRange', (h) => h.range, ''),
  whoseTalent,
  abilityOfHero,
  whichHeroRoles,
]

/** Gera N perguntas distintas. Tenta de novo quando um gerador desiste. */
export function makeQuiz(pool: Pool, count: number): Question[] {
  const out: Question[] = []
  const seen = new Set<string>()
  let guard = 0
  while (out.length < count && guard++ < count * 40) {
    const q = pick(GENERATORS)(pool)
    if (!q) continue
    const id = `${q.kind}:${q.answerId}`
    if (seen.has(id)) continue
    seen.add(id)
    out.push(q)
  }
  return out
}
