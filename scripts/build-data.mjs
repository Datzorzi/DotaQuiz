#!/usr/bin/env node
// Pipeline de dados do Dotaquiz.
//
// Junta duas fontes e cospe JSON estatico em public/data/, pra o site rodar
// inteiro no GitHub Pages sem backend:
//
//   1. odota/dotaconstants -> numeros (stats, custo, cooldown, talentos,
//      patch notes). Atualizado a cada patch.
//   2. dotabuff/d2vpkr     -> os arquivos de localizacao oficiais da Valve,
//      que trazem nome, descricao, lore e apelidos em 26 idiomas.
//
// Uso:
//   node scripts/build-data.mjs                 # idiomas padrao
//   node scripts/build-data.mjs --langs=pt-BR   # so um
//   node scripts/build-data.mjs --all           # os 26
//   node scripts/build-data.mjs --fresh         # ignora o cache local

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseKeyValues, stripGenderTag, toPlainText, splitEnglishHint } from './lib/kv.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'data')
const CACHE = path.join(ROOT, '.cache')

const DC = 'https://raw.githubusercontent.com/odota/dotaconstants/master/build'
const VALVE = 'https://raw.githubusercontent.com/dotabuff/d2vpkr/master/dota/resource/localization'

// Nosso codigo de idioma -> sufixo do arquivo da Valve.
const LANGS = {
  'en': 'english',
  'pt-BR': 'brazilian',
  'es': 'spanish',
  'es-419': 'latam',
  'ru': 'russian',
  'zh-CN': 'schinese',
  'zh-TW': 'tchinese',
  'ko': 'koreana',
  'ja': 'japanese',
  'de': 'german',
  'fr': 'french',
  'it': 'italian',
  'pl': 'polish',
  'tr': 'turkish',
  'uk': 'ukrainian',
  'cs': 'czech',
  'nl': 'dutch',
  'sv': 'swedish',
  'da': 'danish',
  'fi': 'finnish',
  'no': 'norwegian',
  'hu': 'hungarian',
  'ro': 'romanian',
  'bg': 'bulgarian',
  'el': 'greek',
  'th': 'thai',
  'vi': 'vietnamese',
  'pt': 'portuguese',
}

const DEFAULT_LANGS = ['pt-BR', 'en']
const PATCH_HISTORY = 25 // quantos patches recentes exportar

// --- download com cache -----------------------------------------------------

const args = process.argv.slice(2)
const FRESH = args.includes('--fresh')

async function grab(url, name) {
  const file = path.join(CACHE, name)
  if (!FRESH) {
    try {
      const cached = await fs.readFile(file, 'utf8')
      return cached
    } catch { /* sem cache, baixa */ }
  }
  process.stdout.write(`  baixando ${name} ... `)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} em ${url}`)
  const text = await res.text()
  await fs.mkdir(CACHE, { recursive: true })
  await fs.writeFile(file, text)
  console.log(`${(text.length / 1024 / 1024).toFixed(1)} MB`)
  return text
}

const grabJson = async (name) => JSON.parse(await grab(`${DC}/${name}.json`, `dc_${name}.json`))
const grabLoc = async (kind, valveLang) =>
  parseKeyValues(await grab(`${VALVE}/${kind}_${valveLang}.txt`, `${kind}_${valveLang}.txt`))

// --- helpers ----------------------------------------------------------------

const heroKey = (npc) => npc.replace(/^npc_dota_hero_/, '')
// As imagens ficam na CDN da Valve. Guardamos so o caminho; o app poe o host.
const cdnPath = (p) => (p ? p.replace(/^\/apps\/dota2\/images\/dota_react\//, '').replace(/\?.*$/, '') : null)

function localized(loc, key) {
  const v = loc[key.toLowerCase()]
  return v ? toPlainText(v) : null
}

function localizedSplit(loc, key) {
  const v = localized(loc, key)
  return v ? splitEnglishHint(v) : { text: null, enName: null }
}

// --- construcao por idioma --------------------------------------------------

// Os textos de talento traduzidos vem com placeholders da engine
// ("+{s:bonus_speed_bonus}% de vel. de mov."). O numero em si so aparece ja
// resolvido no nome em ingles do dotaconstants ("+8% Movement Speed"), entao
// puxamos os numeros de la, na ordem, e preenchemos o template traduzido.
const PLACEHOLDER = /\{[sv]:[a-z0-9_]+\}|%[a-z0-9_]+%/gi

function resolveTalent(text, dcAbilities, talentName) {
  const fallback = (dcAbilities[talentName] || {}).dname || null
  if (!text) return fallback || talentName
  const slots = text.match(PLACEHOLDER)
  if (!slots) return text
  if (!fallback) return text.replace(PLACEHOLDER, '?')

  // "12/13/14" conta como um valor so; "2.5" tambem.
  const numbers = fallback.match(/\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*/g) || []
  if (numbers.length < slots.length) return fallback // traducao nao bate: usa o ingles

  let i = 0
  return text.replace(PLACEHOLDER, () => numbers[i++].replace(/\s+/g, ''))
}

function buildHeroes(dcHeroes, dcHeroAbilities, dcAbilities, ab, dota, lore) {
  return Object.values(dcHeroes)
    .map((h) => {
      const key = heroKey(h.name)
      const info = dcHeroAbilities[h.name] || {}

      // "Axe;X;machado" -> apelidos oficiais no idioma. Usamos pra aceitar
      // resposta certa escrita de varios jeitos.
      const aliasRaw = dota[`npc_dota_hero_${key}__name_alias`.toLowerCase()]
      const aliases = aliasRaw ? aliasRaw.split(';').map((s) => s.trim()).filter(Boolean) : []

      const name = stripGenderTag(ab[`npc_dota_hero_${key}:n`.toLowerCase()]) || h.localized_name

      return {
        id: h.id,
        key,
        name,
        enName: h.localized_name,
        aliases: [...new Set([name, h.localized_name, ...aliases])],
        attr: h.primary_attr,
        attack: h.attack_type,
        roles: h.roles || [],
        legs: h.legs,
        complexity: null,
        ms: h.move_speed,
        range: h.attack_range,
        bat: h.attack_rate,
        armor: h.base_armor,
        mr: h.base_mr,
        dmg: [h.base_attack_min, h.base_attack_max],
        hp: h.base_health,
        mp: h.base_mana,
        str: [h.base_str, h.str_gain],
        agi: [h.base_agi, h.agi_gain],
        int: [h.base_int, h.int_gain],
        vision: [h.day_vision, h.night_vision],
        img: cdnPath(h.img),
        icon: cdnPath(h.icon),
        hype: localized(dota, `npc_dota_hero_${key}_hype`),
        bio: localized(lore, `npc_dota_hero_${key}_bio`),
        abilities: (info.abilities || []).filter((a) => a && a !== 'generic_hidden'),
        talents: (info.talents || []).map((t) => ({
          level: t.level,
          text: resolveTalent(
            localized(ab, `DOTA_Tooltip_ability_${t.name}`) || t.name,
            dcAbilities,
            t.name
          ),
        })),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function buildAbilities(dcAbilities, dcHeroAbilities, ab) {
  // Mapa habilidade -> heroi dono, pra saber de quem e cada icone.
  const owner = {}
  for (const [npc, info] of Object.entries(dcHeroAbilities)) {
    for (const a of info.abilities || []) owner[a] = heroKey(npc)
  }

  const out = []
  for (const [key, a] of Object.entries(dcAbilities)) {
    if (!a || !a.dname || key === 'generic_hidden') continue
    if (key.startsWith('special_bonus_')) continue
    const { text, enName } = localizedSplit(ab, `DOTA_Tooltip_ability_${key}_Description`)
    out.push({
      key,
      hero: owner[key] || null,
      name: localized(ab, `DOTA_Tooltip_ability_${key}`) || a.dname,
      enName: enName || a.dname,
      desc: text || a.desc || null,
      lore: localized(ab, `DOTA_Tooltip_ability_${key}_Lore`) || a.lore || null,
      behavior: a.behavior || null,
      dmgType: a.dmg_type || null,
      pierces: a.bkbpierce || null,
      dispellable: a.dispellable || null,
      cd: a.cd ?? null,
      mc: a.mc ?? null,
      img: cdnPath(a.img),
      attrib: (a.attrib || []).map((at) => ({
        // Cabecalho traduzido quando a Valve tem ("RAIO:"), senao o ingles.
        header: localized(ab, `DOTA_Tooltip_ability_${key}_${at.key}`) || at.header || at.key,
        value: at.value,
      })),
    })
  }
  return out
}

function buildItems(dcItems, ab) {
  const out = []
  for (const [key, it] of Object.entries(dcItems)) {
    if (!it || !it.dname) continue
    if (key.startsWith('recipe_')) continue
    const { text, enName } = localizedSplit(ab, `DOTA_Tooltip_ability_item_${key}_Description`)
    out.push({
      id: it.id,
      key,
      name: localized(ab, `DOTA_Tooltip_ability_item_${key}`) || it.dname,
      enName: enName || it.dname,
      desc: text || (it.abilities || []).map((x) => x.description).join('\n\n') || null,
      lore: localized(ab, `DOTA_Tooltip_ability_item_${key}_Lore`) || it.lore || null,
      cost: it.cost ?? null,
      qual: it.qual || null,
      cd: it.cd ?? null,
      mc: it.mc ?? null,
      neutral: it.tier != null ? it.tier : null,
      components: it.components || null,
      img: cdnPath(it.img),
      attrib: (it.attrib || []).map((at) => ({ key: at.key, value: at.value })),
    })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

function buildPatches(dcPatch, dcPatchnotes) {
  // Os patch notes da Valve so existem em ingles, entao esse arquivo e
  // compartilhado entre os idiomas.
  const recent = dcPatch.slice(-PATCH_HISTORY).reverse()
  return recent.map((p) => {
    const notes = dcPatchnotes[p.name.replace(/\./g, '_')] || {}
    return {
      name: p.name,
      date: p.date,
      general: notes.general || [],
      heroes: notes.heroes || {},
      items: notes.items || {},
    }
  })
}

// --- main -------------------------------------------------------------------

async function main() {
  let langs = DEFAULT_LANGS
  if (args.includes('--all')) langs = Object.keys(LANGS)
  const pick = args.find((a) => a.startsWith('--langs='))
  if (pick) langs = pick.slice('--langs='.length).split(',').map((s) => s.trim())

  const unknown = langs.filter((l) => !LANGS[l])
  if (unknown.length) throw new Error(`idioma desconhecido: ${unknown.join(', ')}`)

  console.log(`\nDotaquiz :: gerando dados para ${langs.join(', ')}\n`)
  console.log('Fontes base (dotaconstants):')
  const [dcHeroes, dcItems, dcAbilities, dcHeroAbilities, dcPatch, dcPatchnotes] = await Promise.all([
    grabJson('heroes'),
    grabJson('items'),
    grabJson('abilities'),
    grabJson('hero_abilities'),
    grabJson('patch'),
    grabJson('patchnotes'),
  ])

  const patch = dcPatch[dcPatch.length - 1]
  await fs.mkdir(OUT, { recursive: true })

  const patches = buildPatches(dcPatch, dcPatchnotes)
  await write(path.join(OUT, 'patches.json'), patches)

  const built = []
  for (const lang of langs) {
    const valve = LANGS[lang]
    console.log(`\nIdioma ${lang} (${valve}):`)
    const [ab, dota, lore] = await Promise.all([
      grabLoc('abilities', valve),
      grabLoc('dota', valve),
      grabLoc('hero_lore', valve),
    ])

    const dir = path.join(OUT, lang)
    await fs.mkdir(dir, { recursive: true })

    const heroes = buildHeroes(dcHeroes, dcHeroAbilities, dcAbilities, ab, dota, lore)
    const abilities = buildAbilities(dcAbilities, dcHeroAbilities, ab)
    const items = buildItems(dcItems, ab)

    await write(path.join(dir, 'heroes.json'), heroes)
    await write(path.join(dir, 'abilities.json'), abilities)
    await write(path.join(dir, 'items.json'), items)

    const traduzidos = heroes.filter((h) => h.bio).length
    console.log(
      `  ${heroes.length} herois (${traduzidos} com lore), ` +
      `${abilities.length} habilidades, ${items.length} itens`
    )
    built.push(lang)
  }

  await write(path.join(OUT, 'index.json'), {
    generated: new Date().toISOString(),
    patch: patch.name,
    patchDate: patch.date,
    langs: built,
    counts: { patches: patches.length },
  })

  console.log(`\nPronto. Patch ${patch.name}. Arquivos em public/data/\n`)
}

async function write(file, data) {
  await fs.writeFile(file, JSON.stringify(data))
  const kb = ((await fs.stat(file)).size / 1024).toFixed(0)
  console.log(`  -> ${path.relative(ROOT, file)} (${kb} KB)`)
}

main().catch((e) => {
  console.error('\nFalhou:', e.message)
  process.exit(1)
})
