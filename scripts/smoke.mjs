#!/usr/bin/env node
// Smoke test: abre o site num Chromium headless, passa por cada jogo, joga
// uma rodada e tira print. Serve pra pegar o que o TypeScript nao pega --
// dado faltando, imagem quebrada, erro em runtime.
//
//   npm run dev            (noutro terminal)
//   node scripts/smoke.mjs [http://localhost:5173]

import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE = process.argv[2] || 'http://localhost:5173'
const SHOTS = path.resolve('.smoke')

const errors = []
let failures = 0

function step(name, ok, detail = '') {
  if (!ok) failures++
  console.log(`${ok ? '  ok  ' : ' FALHA'} ${name}${detail ? ` — ${detail}` : ''}`)
}

const run = async () => {
  await fs.mkdir(SHOTS, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(String(e)))

  const go = async (hash, waitFor) => {
    await page.goto(`${BASE}/#${hash}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector(waitFor, { timeout: 20000 })
  }

  const shot = (name) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false })

  // Home
  await go('/', 'text=Dotaquiz')
  const cards = await page.locator('a[href*="#/"]').count()
  step('home carregou', cards >= 4, `${cards} links de jogo`)
  await shot('1-home')

  // Dotle: digita um heroi e envia
  await go('/dotle', 'input')
  await page.fill('input', 'ax')
  await page.waitForSelector('ul button', { timeout: 5000 })
  await page.locator('ul button').first().click()
  await page.waitForTimeout(600)
  const rows = await page.locator('.anim-flip').count()
  step('dotle aceitou palpite', rows >= 6, `${rows} celulas comparadas`)
  await shot('2-dotle')

  // Quiz: responde a primeira alternativa
  await go('/quiz', 'button:has-text("1")')
  const prompt = await page.locator('h3').first().textContent()
  const opts = await page.locator('.grid button').count()
  step('quiz gerou pergunta', !!prompt && opts >= 4, `${opts} alternativas`)
  await page.locator('.grid button').first().click()
  await page.waitForTimeout(400)
  const feedback = await page.locator('text=/Certa!|Errou|Correct!|Wrong/').count()
  step('quiz deu feedback', feedback > 0)
  await shot('3-quiz')

  // Lore
  await go('/lore', 'blockquote')
  const quote = (await page.locator('blockquote').first().textContent()) ?? ''
  step('lore mostrou trecho', quote.length > 60, `${quote.length} chars`)
  step('lore mascarou a resposta', quote.includes('█'), 'procurando blocos censurados')
  await shot('4-lore')

  // Icones
  await go('/icones', 'img[src*="steamstatic"]')
  const art = await page.locator('.anim-pop img, img.anim-pop').count()
  step('icones mostrou arte', art > 0)
  await shot('5-icones')

  // Patches
  await go('/patch', 'text=/7\\.4/')
  await page.waitForTimeout(1500)
  const patchBtns = await page.locator('button:has-text("7.")').count()
  step('patches carregou', patchBtns >= 10, `${patchBtns} versoes`)
  await shot('6-patch')

  // Troca de idioma
  await go('/', 'text=Dotaquiz')
  await page.locator('button[title="English"]').click()
  await page.waitForTimeout(1200)
  const en = await page.locator('text=Deduction').count()
  step('idioma mudou para EN', en > 0)
  await shot('7-en')

  await page.locator('button[title*="Português"]').click()
  await page.waitForTimeout(1200)
  const pt = await page.locator('text=Dedução').count()
  step('idioma voltou para PT', pt > 0)

  // Imagens quebradas
  const broken = await page.evaluate(() =>
    [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src)
  )
  step('sem imagem quebrada', broken.length === 0, broken.slice(0, 3).join(', '))

  await browser.close()

  const real = errors.filter((e) => !/favicon|ERR_INTERNET_DISCONNECTED/i.test(e))
  step('sem erro no console', real.length === 0, real.slice(0, 3).join(' | '))

  console.log(`\nPrints em ${SHOTS}`)
  if (failures) {
    console.log(`\n${failures} verificacao(oes) falharam.`)
    process.exit(1)
  }
  console.log('\nTudo passou.')
}

run().catch((e) => {
  console.error('smoke quebrou:', e)
  process.exit(1)
})
