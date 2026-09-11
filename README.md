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

O pipeline é idempotente: ele compara o conteúdo antes de gravar e só mexe nos
arquivos que mudaram de verdade. Rodar duas vezes seguidas sem patch novo não
suja o repositório — é isso que faz o job diário ficar quieto quando não há
novidade.

### Card de compartilhamento

```bash
npm run og        # regenera public/og.png a partir dos retratos do jogo
```

Só precisa rodar se o visual do card mudar; a imagem fica commitada.

### Conferindo no navegador

```bash
npm run dev            # num terminal
npm run smoke          # noutro: abre o site, joga uma rodada de cada jogo
```

O smoke test passa por todas as telas, responde uma pergunta em cada jogo,
troca de idioma e falha se algum dado sumir, alguma imagem quebrar ou algo
estourar no console. Os prints ficam em `.smoke/`.

## Publicando

```bash
gh repo create Dotaquiz --public --source=. --push
```

Depois, em *Settings → Pages*, deixe **Source: GitHub Actions**. Pronto — o
primeiro push já publica.

### Como a atualização automática funciona

Um workflow só (`.github/workflows/deploy.yml`), com três gatilhos:

| Gatilho | O que faz |
|---|---|
| push na `main` | compila e publica com os dados que estão commitados |
| agendamento diário | busca nas fontes → commita se veio patch novo → compila e publica |
| execução manual | igual ao agendado; dá pra desligar a busca de dados na hora de disparar |

**Por que um workflow só e não dois.** O caminho óbvio seria um job que commita
os dados e um `deploy` reagindo a esse commit. Não funciona: push feito com o
`GITHUB_TOKEN` não dispara outro workflow — é a proteção do GitHub contra
recursão. O deploy nunca rodaria, e sem erro nenhum aparecendo: o site ficaria
parado num patch antigo indefinidamente. Por isso atualizar e publicar
acontecem na mesma execução.

**Atenção ao agendamento.** O GitHub desativa workflows agendados depois de 60
dias sem nenhuma atividade no repositório. Se o projeto ficar parado meses, é
só reativar em *Actions* ou dar um push.

### Domínio próprio

Coloque o domínio em *Settings → Pages*, crie `public/CNAME` com ele dentro e,
no `deploy.yml`, troque `BASE_PATH` para `/` e `VITE_SITE_URL` para o domínio.

### Testando o build de produção localmente

```bash
BASE_PATH=/Dotaquiz/ npm run build
```

No **Git Bash do Windows** o MSYS converte `/Dotaquiz/` em caminho do Windows e
o build sai com URLs erradas. Use `MSYS_NO_PATHCONV=1` na frente. No PowerShell,
no cmd e no runner do Linux não acontece.

## Estrutura

```
scripts/
  build-data.mjs     pipeline: fontes oficiais -> public/data/
  lib/kv.mjs         parser do formato KeyValues da Valve
  smoke.mjs          teste de navegador
  make-og.mjs        gera o card de compartilhamento
src/
  data/store.tsx     carrega os dados e controla o idioma
  i18n/strings.ts    textos da interface (pt-BR, en)
  games/             Dotle, Quiz, Lore, Ícones + gerador de perguntas
  pages/             home, patches, sobre
  components/        peças de UI compartilhadas
```

---

Projeto de fã. Dota 2 é marca registrada da Valve Corporation.
