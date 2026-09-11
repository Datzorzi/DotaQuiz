export type Attr = 'str' | 'agi' | 'int' | 'all'

export interface Hero {
  id: number
  key: string
  name: string
  enName: string
  /** Nome + apelidos oficiais da Valve no idioma ("Axe", "X", "machado"). */
  aliases: string[]
  attr: Attr
  attack: 'Melee' | 'Ranged'
  roles: string[]
  legs: number | null
  ms: number
  range: number
  bat: number
  armor: number
  mr: number
  dmg: [number, number]
  hp: number
  mp: number
  str: [number, number]
  agi: [number, number]
  int: [number, number]
  vision: [number, number]
  img: string
  icon: string
  hype: string | null
  bio: string | null
  abilities: string[]
  talents: { level: number; text: string }[]
}

export interface Ability {
  key: string
  hero: string | null
  name: string
  enName: string
  desc: string | null
  lore: string | null
  behavior: string | null
  dmgType: string | null
  pierces: string | null
  dispellable: string | null
  cd: number | number[] | null
  mc: number | number[] | null
  img: string | null
  attrib: { header: string; value: string | string[] }[]
}

export interface Item {
  id: number
  key: string
  name: string
  enName: string
  desc: string | null
  lore: string | null
  cost: number | null
  qual: string | null
  cd: number | number[] | null
  mc: number | number[] | false | null
  neutral: number | null
  components: string[] | null
  img: string | null
  attrib: { key: string; value: string | string[] }[]
}

export interface Patch {
  name: string
  date: string
  general: string[]
  heroes: Record<string, Record<string, string[]> | string[]>
  items: Record<string, string[]>
}

export interface DataIndex {
  generated: string
  patch: string
  patchDate: string
  langs: string[]
}
