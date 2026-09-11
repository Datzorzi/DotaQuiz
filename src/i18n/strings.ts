// Textos da interface. Os dados de jogo (heroi, item, habilidade, lore) ja vem
// traduzidos pela propria Valve no pipeline -- aqui e so a casca do site.

export const ptBR = {
  code: 'pt-BR',
  label: 'Português (BR)',
  flag: '🇧🇷',

  nav: {
    home: 'Início',
    patch: 'Patches',
    about: 'Sobre',
  },

  home: {
    tagline: 'Jogos para quem vive o mundo de Dota',
    blurb:
      'Herói, item, habilidade, lore e patch — tudo tirado das fontes oficiais e atualizado a cada versão.',
    play: 'Jogar',
    dataFrom: (patch: string) => `Dados do patch ${patch}`,
    langNote: 'Nomes, descrições e lore vêm da tradução oficial da Valve.',
  },

  games: {
    dotle: {
      name: 'Dotle',
      tag: 'Dedução',
      desc: 'Adivinhe o herói do dia pelos atributos. Cada palpite revela o que você acertou.',
    },
    quiz: {
      name: 'Quiz',
      tag: 'Conhecimento',
      desc: 'Perguntas geradas dos dados do jogo. Stats, habilidades, itens, talentos — nunca repete.',
    },
    lore: {
      name: 'Lore',
      tag: 'História',
      desc: 'Um trecho da lore oficial. De quem é? Cada erro revela mais do texto.',
    },
    icons: {
      name: 'Ícones',
      tag: 'Olho treinado',
      desc: 'Habilidade, item ou um pedaço ampliado do retrato. Você reconhece só pela imagem?',
    },
  },

  common: {
    loading: 'Carregando o Rio…',
    error: 'Não foi possível carregar os dados.',
    retry: 'Tentar de novo',
    score: 'Pontos',
    streak: 'Sequência',
    best: 'Recorde',
    question: 'Pergunta',
    of: 'de',
    correct: 'Certa!',
    wrong: 'Errou',
    answer: 'Resposta',
    next: 'Próxima',
    playAgain: 'Jogar de novo',
    giveUp: 'Desistir',
    finish: 'Fim de jogo',
    yourScore: (n: number, total: number) => `Você acertou ${n} de ${total}`,
    back: 'Voltar',
    share: 'Copiar resultado',
    copied: 'Copiado!',
    difficulty: 'Dificuldade',
    easy: 'Fácil',
    normal: 'Normal',
    hard: 'Nerd',
    hint: 'Dica',
    skip: 'Pular',
    disclaimer: 'Projeto de fã, sem vínculo com a Valve.',
  },

  dotle: {
    daily: 'Desafio do dia',
    free: 'Treino livre',
    placeholder: 'Digite um herói…',
    guesses: (n: number, max: number) => `Palpite ${n} de ${max}`,
    won: (n: number) => `Acertou em ${n} ${n === 1 ? 'palpite' : 'palpites'}!`,
    lost: (name: string) => `Acabaram os palpites. Era ${name}.`,
    alreadyDone: 'Você já jogou o desafio de hoje.',
    nextDaily: 'Próximo desafio em',
    cols: {
      hero: 'Herói',
      attr: 'Atributo',
      attack: 'Ataque',
      roles: 'Papéis',
      legs: 'Pernas',
      range: 'Alcance',
      ms: 'Vel. mov.',
    },
    legend: {
      hit: 'exato',
      near: 'parcial',
      miss: 'errado',
      higher: 'é maior',
      lower: 'é menor',
    },
  },

  quiz: {
    q: {
      whoHasAbility: 'De qual herói é esta habilidade?',
      whichAbility: 'Que habilidade é esta?',
      heroAttr: (hero: string) => `Qual o atributo primário de ${hero}?`,
      itemCost: (item: string) => `Quanto custa ${item}?`,
      whichItemLore: 'De qual item é este texto?',
      fastest: 'Qual destes heróis tem a maior velocidade de movimento?',
      toughest: 'Qual destes heróis tem mais força base?',
      longestRange: 'Qual destes heróis tem o maior alcance de ataque?',
      whoseTalent: 'De qual herói é este talento?',
      abilityOfHero: (hero: string) => `Qual destas habilidades é de ${hero}?`,
      whichHeroRoles: (roles: string) => `Qual herói tem exatamente estes papéis: ${roles}?`,
    },
    level: (n: number) => `Nível ${n}`,
  },

  lore: {
    source: {
      hero: 'Biografia de herói',
      ability: 'Lore de habilidade',
      item: 'Lore de item',
    },
    prompt: 'De quem é este trecho?',
    promptItem: 'De qual item é este trecho?',
    reveal: 'Mais um trecho',
    noMore: 'Não há mais trechos',
  },

  icons: {
    mode: {
      ability: 'Habilidade → herói',
      item: 'Item → nome',
      hero: 'Zoom → herói',
    },
    prompt: {
      ability: 'De qual herói é este ícone?',
      item: 'Que item é este?',
      hero: 'Quem é?',
    },
  },

  patch: {
    title: 'O que mudou',
    subtitle: 'Notas de atualização, versão por versão',
    general: 'Geral',
    heroes: 'Heróis',
    items: 'Itens',
    pickHero: 'Filtrar por herói',
    all: 'Todos',
    noChanges: 'Sem mudanças nesta versão',
    englishOnly: 'As notas de atualização só existem em inglês — é assim que a Valve publica.',
  },

  attrs: {
    str: 'Força',
    agi: 'Agilidade',
    int: 'Inteligência',
    all: 'Universal',
  },

  attack: {
    Melee: 'Corpo a corpo',
    Ranged: 'À distância',
  },

  roles: {
    Carry: 'Carregador',
    Support: 'Suporte',
    Nuker: 'Explosivo',
    Disabler: 'Incapacitador',
    Jungler: 'Selvagem',
    Durable: 'Resistente',
    Escape: 'Fuga',
    Pusher: 'Empurrador',
    Initiator: 'Iniciador',
  },

  about: {
    title: 'Sobre o Dotaquiz',
    body: [
      'O Dotaquiz é um punhado de jogos para quem gosta do universo de Dota 2 e quer passar um tempo bom ali dentro.',
      'Nada aqui é digitado à mão. Os números vêm do dotaconstants (o mesmo conjunto que a OpenDota mantém a cada patch) e todo o texto — nome, descrição, lore, até os apelidos de herói — vem dos arquivos de localização oficiais da Valve. Quando sai patch novo, o site se atualiza sozinho.',
      'Projeto de fã, sem vínculo com a Valve. Dota 2 é marca registrada da Valve Corporation.',
    ],
    sources: 'Fontes',
    updated: 'Atualizado em',
  },
}

export type Dict = typeof ptBR

export const en: Dict = {
  code: 'en',
  label: 'English',
  flag: '🇬🇧',

  nav: {
    home: 'Home',
    patch: 'Patches',
    about: 'About',
  },

  home: {
    tagline: 'Games for people who live in the world of Dota',
    blurb:
      'Heroes, items, abilities, lore and patches — pulled from official sources and refreshed every version.',
    play: 'Play',
    dataFrom: (patch: string) => `Patch ${patch} data`,
    langNote: "Names, descriptions and lore come from Valve's official translations.",
  },

  games: {
    dotle: {
      name: 'Dotle',
      tag: 'Deduction',
      desc: "Guess the hero of the day from their attributes. Every guess narrows it down.",
    },
    quiz: {
      name: 'Quiz',
      tag: 'Knowledge',
      desc: 'Questions generated from game data. Stats, abilities, items, talents — never the same twice.',
    },
    lore: {
      name: 'Lore',
      tag: 'Story',
      desc: 'A passage of official lore. Whose is it? Each miss reveals a little more.',
    },
    icons: {
      name: 'Icons',
      tag: 'Sharp eye',
      desc: 'An ability, an item, a zoomed crop of a portrait. Can you name it from the art alone?',
    },
  },

  common: {
    loading: 'Loading the River…',
    error: 'Could not load the data.',
    retry: 'Try again',
    score: 'Score',
    streak: 'Streak',
    best: 'Best',
    question: 'Question',
    of: 'of',
    correct: 'Correct!',
    wrong: 'Wrong',
    answer: 'Answer',
    next: 'Next',
    playAgain: 'Play again',
    giveUp: 'Give up',
    finish: 'Game over',
    yourScore: (n: number, total: number) => `You got ${n} of ${total}`,
    back: 'Back',
    share: 'Copy result',
    copied: 'Copied!',
    difficulty: 'Difficulty',
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Nerd',
    hint: 'Hint',
    skip: 'Skip',
    disclaimer: 'A fan project, not affiliated with Valve.',
  },

  dotle: {
    daily: 'Daily challenge',
    free: 'Free play',
    placeholder: 'Type a hero…',
    guesses: (n: number, max: number) => `Guess ${n} of ${max}`,
    won: (n: number) => `Solved in ${n} ${n === 1 ? 'guess' : 'guesses'}!`,
    lost: (name: string) => `Out of guesses. It was ${name}.`,
    alreadyDone: "You've already played today's challenge.",
    nextDaily: 'Next challenge in',
    cols: {
      hero: 'Hero',
      attr: 'Attribute',
      attack: 'Attack',
      roles: 'Roles',
      legs: 'Legs',
      range: 'Range',
      ms: 'Move speed',
    },
    legend: {
      hit: 'exact',
      near: 'partial',
      miss: 'wrong',
      higher: 'is higher',
      lower: 'is lower',
    },
  },

  quiz: {
    q: {
      whoHasAbility: 'Which hero does this ability belong to?',
      whichAbility: 'Which ability is this?',
      heroAttr: (hero: string) => `What is ${hero}'s primary attribute?`,
      itemCost: (item: string) => `How much does ${item} cost?`,
      whichItemLore: 'Which item is this text from?',
      fastest: 'Which of these heroes has the highest move speed?',
      toughest: 'Which of these heroes has the most base strength?',
      longestRange: 'Which of these heroes has the longest attack range?',
      whoseTalent: 'Which hero has this talent?',
      abilityOfHero: (hero: string) => `Which of these abilities belongs to ${hero}?`,
      whichHeroRoles: (roles: string) => `Which hero has exactly these roles: ${roles}?`,
    },
    level: (n: number) => `Level ${n}`,
  },

  lore: {
    source: {
      hero: 'Hero biography',
      ability: 'Ability lore',
      item: 'Item lore',
    },
    prompt: 'Whose passage is this?',
    promptItem: 'Which item is this from?',
    reveal: 'Another passage',
    noMore: 'No more passages',
  },

  icons: {
    mode: {
      ability: 'Ability → hero',
      item: 'Item → name',
      hero: 'Zoom → hero',
    },
    prompt: {
      ability: 'Which hero owns this icon?',
      item: 'What item is this?',
      hero: 'Who is this?',
    },
  },

  patch: {
    title: 'What changed',
    subtitle: 'Patch notes, version by version',
    general: 'General',
    heroes: 'Heroes',
    items: 'Items',
    pickHero: 'Filter by hero',
    all: 'All',
    noChanges: 'No changes in this version',
    englishOnly: 'Patch notes exist in English only — that is how Valve publishes them.',
  },

  attrs: {
    str: 'Strength',
    agi: 'Agility',
    int: 'Intelligence',
    all: 'Universal',
  },

  attack: {
    Melee: 'Melee',
    Ranged: 'Ranged',
  },

  roles: {
    Carry: 'Carry',
    Support: 'Support',
    Nuker: 'Nuker',
    Disabler: 'Disabler',
    Jungler: 'Jungler',
    Durable: 'Durable',
    Escape: 'Escape',
    Pusher: 'Pusher',
    Initiator: 'Initiator',
  },

  about: {
    title: 'About Dotaquiz',
    body: [
      'Dotaquiz is a handful of games for people who enjoy the world of Dota 2 and want to spend good time inside it.',
      "Nothing here is hand-typed. The numbers come from dotaconstants (the same set OpenDota maintains every patch) and all the text — names, descriptions, lore, even hero nicknames — comes from Valve's official localization files. When a new patch lands, the site updates itself.",
      'A fan project, not affiliated with Valve. Dota 2 is a trademark of Valve Corporation.',
    ],
    sources: 'Sources',
    updated: 'Updated',
  },
}

export const DICTS: Record<string, Dict> = { 'pt-BR': ptBR, en }
export const LANG_CODES = Object.keys(DICTS)
