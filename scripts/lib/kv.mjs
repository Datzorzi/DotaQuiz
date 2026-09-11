// Parser do formato KeyValues da Valve (os arquivos de localizacao do Dota 2).
//
// Formato:
//   "lang" { "Language" "brazilian" "Tokens" { "chave" "valor" ... } }
//
// A estrutura aninhada nao interessa pra gente: o que queremos e o mapa plano
// de token -> texto. As chaves da Valve sao case-insensitive e a mesma chave
// aparece com caixas diferentes entre arquivos (DOTA_Tooltip_ability_... vs
// DOTA_Tooltip_Ability_...), entao normalizamos tudo pra minusculo.

const BACKSLASH = '\\'
const QUOTE = '"'

export function parseKeyValues(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1) // BOM
  const n = text.length
  const out = Object.create(null)
  let i = 0

  function skipTrivia() {
    while (i < n) {
      const c = text[i]
      if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { i++; continue }
      if (c === '/' && text[i + 1] === '/') {
        while (i < n && text[i] !== '\n') i++
        continue
      }
      break
    }
  }

  function readQuoted() {
    i++ // consome a aspa de abertura
    let buf = ''
    let start = i
    while (i < n) {
      const c = text[i]
      if (c === BACKSLASH) {
        buf += text.slice(start, i)
        const d = text[i + 1]
        buf += d === 'n' ? '\n' : d === 't' ? '\t' : d === 'r' ? '' : d
        i += 2
        start = i
        continue
      }
      if (c === QUOTE) {
        buf += text.slice(start, i)
        i++
        return buf
      }
      i++
    }
    return buf + text.slice(start)
  }

  // Achata qualquer nivel de aninhamento no mesmo mapa.
  function walk() {
    for (;;) {
      skipTrivia()
      if (i >= n) return
      const c = text[i]
      if (c === '}') { i++; return }
      if (c !== QUOTE) { i++; continue }
      const key = readQuoted()
      skipTrivia()
      if (i >= n) return
      if (text[i] === '{') { i++; walk(); continue }
      if (text[i] === QUOTE) {
        out[key.toLowerCase()] = readQuoted()
        continue
      }
      i++
    }
  }

  walk()
  return out
}

// --- limpeza de texto -------------------------------------------------------

// A Valve marca o genero do substantivo no comeco do valor: "#|m|#Axe".
export function stripGenderTag(s) {
  return s ? s.replace(/^#\|[a-z]\|#/i, '') : s
}

// Descricoes vem com markup de UI do jogo. Pra quiz e lore queremos texto puro.
export function toPlainText(s) {
  if (!s) return ''
  return s
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/%%/g, '%')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Nas traducoes, a Valve prefixa a descricao com o nome original em ingles
// ("Em ingles: Berserker's Call\n\n..."). Otimo como curiosidade, pessimo num
// jogo de adivinhar -- entrega a resposta. Separamos os dois.
const EN_PREFIX = /^(?:em\s+ingl[eê]s|in\s+english|en\s+ingl[eé]s)\s*:\s*(.+?)(?:\n+|$)/i

export function splitEnglishHint(plain) {
  const m = plain.match(EN_PREFIX)
  if (!m) return { text: plain, enName: null }
  return { text: plain.slice(m[0].length).trim(), enName: m[1].trim() }
}
