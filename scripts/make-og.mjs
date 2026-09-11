#!/usr/bin/env node
// Gera public/og.png -- a imagem que aparece quando alguém cola o link do site
// no WhatsApp, Discord ou Twitter. Monta um card 1200x630 com retratos do
// próprio jogo e tira print com o Chromium.
//
//   node scripts/make-og.mjs
//
// Só precisa rodar de novo se o visual do card mudar; a imagem fica commitada.

import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const CDN = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/'
const OUT = path.resolve('public/og.png')

const heroes = JSON.parse(await fs.readFile('public/data/pt-BR/heroes.json', 'utf8'))
const index = JSON.parse(await fs.readFile('public/data/index.json', 'utf8'))

// Uma fileira fixa de retratos reconhecíveis, pra o card não sair diferente a
// cada geração.
const PICKS = ['axe', 'invoker', 'juggernaut', 'lina', 'pudge', 'crystal_maiden', 'phantom_assassin', 'sven']
const strip = PICKS.map((k) => heroes.find((h) => h.key === k)).filter(Boolean)

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden; position: relative;
    background: #07080a; color: #e9e3d5; font-family: Inter, sans-serif;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  /* Faixa de retratos no rodapé. Espalhar as artes por toda a tela parece
     bom em teoria, mas a 150px de largura por 630 de altura o recorte fica
     tão estreito que nenhum herói é reconhecível -- vira borrão. */
  .strip {
    position: absolute; left: 0; right: 0; bottom: 0; height: 168px;
    display: flex; opacity: .62;
    -webkit-mask-image: linear-gradient(to top, #000 30%, transparent);
  }
  .strip img { flex: 1; height: 100%; object-fit: cover; }
  .veil {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 70% 55% at 50% 42%, rgba(200,150,47,.16), transparent 70%),
      linear-gradient(180deg, #07080a 38%, rgba(7,8,10,.55) 70%, rgba(7,8,10,.25));
  }
  .inner { position: relative; text-align: center; padding: 0 60px; }
  h1 { font-family: Cinzel, serif; font-size: 104px; font-weight: 700; letter-spacing: .02em; line-height: 1; }
  h1 span { color: #c8962f; }
  p.tag { margin-top: 20px; font-size: 30px; color: #c3ccd6; }
  p.sub { margin-top: 12px; font-size: 21px; color: #88919b; }
  .badge {
    margin-top: 30px; display: inline-block; padding: 9px 22px; border-radius: 999px;
    border: 1px solid rgba(200,150,47,.45); background: rgba(200,150,47,.12);
    color: #f0c96b; font-size: 19px; letter-spacing: .04em;
  }
  .rule { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #c8962f, transparent); }
</style></head>
<body>
  <div class="strip">${strip.map((h) => `<img src="${CDN}${h.img}">`).join('')}</div>
  <div class="veil"></div>
  <div class="rule" style="top:0"></div>
  <div class="inner" style="margin-bottom:70px">
    <h1>Dota<span>quiz</span></h1>
    <p class="tag">Jogos para quem vive o mundo de Dota</p>
    <p class="sub">Dotle &middot; Quiz &middot; Lore &middot; Ícones &middot; Patches</p>
    <div class="badge">Dados oficiais &middot; patch ${index.patch}</div>
  </div>
  <div class="rule" style="bottom:0"></div>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: OUT })
await browser.close()

const { size } = await fs.stat(OUT)
console.log(`og.png gerado (${(size / 1024).toFixed(0)} KB) com ${strip.length} retratos, patch ${index.patch}`)
