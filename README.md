# Dotaquiz

Jogos para quem gosta do mundo de Dota 2: herói, item, habilidade, lore e patch.
Site estático, sem backend, hospedado no GitHub Pages.

Nada aqui é digitado à mão — todo o conteúdo é gerado a partir das fontes
oficiais e se atualiza sozinho quando sai patch novo.

## Os jogos

| Jogo | O que é |
|---|---|
| **Dotle** | Adivinhe o herói do dia pelos atributos. Um desafio diário igual para todo mundo, mais treino livre. |
| **Quiz** | Perguntas montadas na hora a partir dos dados do patch: stats, habilidades, itens, talentos, custos. Três dificuldades. |
| **Lore** | Um trecho da lore oficial com o nome censurado. De quem é? Cada dica aberta vale menos ponto. |
| **Ícones** | Habilidade, item ou um pedaço ampliado do retrato. Reconhece só pela arte? |
| **Patches** | As últimas 25 versões, o que mudou em cada herói e item. |

## De onde vêm os dados

| Fonte | O que traz |
|---|---|
| [odota/dotaconstants](https://github.com/odota/dotaconstants) | Números: stats de herói, custo e cooldown de item, talentos, patch notes |
| [dotabuff/d2vpkr](https://github.com/dotabuff/d2vpkr) | Os arquivos de localização **oficiais da Valve** — nome, descrição, lore e até os apelidos de herói, em 26 idiomas |
| CDN da Valve | Retratos, ícones de habilidade e de item |

O pipeline junta as duas e escreve JSON estático em `public/data/`. Por isso o
site funciona sem servidor e a tradução é a mesma que aparece dentro do jogo.

## Rodando

```bash
npm install
npm run data      # gera public/data/ (pt-BR e inglês)
npm run dev
```

Precisa de Node 22 ou mais novo.

### Dados

```bash
npm run data                              # idiomas padrão (pt-BR, en)
node scripts/build-data.mjs --langs=es,ru # outros idiomas
node scripts/build-data.mjs --all         # os 26 que a Valve publica
node scripts/build-data.mjs --fresh       # ignora o cache em .cache/
```

Para adicionar um idioma ao site, gere os dados dele e acrescente o dicionário
de interface em `src/i18n/strings.ts`.

### Conferindo no navegador

```bash
npm run dev            # num terminal
npm run smoke          # noutro: abre o site, joga uma rodada de cada jogo
```

O smoke test passa por todas as telas, responde uma pergunta em cada jogo,
troca de idioma e falha se algum dado sumir, alguma imagem quebrar ou algo
estourar no console. Os prints ficam em `.smoke/`.

## Publicando

Dois workflows cuidam disso:

- **`deploy.yml`** — a cada push na `main`, compila e publica no GitHub Pages.
- **`update-data.yml`** — todo dia roda o pipeline contra as fontes; se veio
  patch novo, commita os dados, e esse commit dispara o deploy.

No repositório, em *Settings → Pages*, deixe **Source: GitHub Actions**.

Com domínio próprio, coloque o domínio em *Settings → Pages*, crie o arquivo
`public/CNAME` com ele dentro e troque `BASE_PATH` para `/` no `deploy.yml`.

## Estrutura

```
scripts/
  build-data.mjs     pipeline: fontes oficiais -> public/data/
  lib/kv.mjs         parser do formato KeyValues da Valve
  smoke.mjs          teste de navegador
src/
  data/store.tsx     carrega os dados e controla o idioma
  i18n/strings.ts    textos da interface (pt-BR, en)
  games/             Dotle, Quiz, Lore, Ícones + gerador de perguntas
  pages/             home, patches, sobre
  components/        peças de UI compartilhadas
```

---

Projeto de fã. Dota 2 é marca registrada da Valve Corporation.
