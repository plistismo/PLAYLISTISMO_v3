export interface ManualPageData {
  type?: 'cover' | 'cover-inside' | 'text' | 'channels' | 'schematic' | 'colophon' | string;
  title: string;
  subtitle?: string;
  serial?: string;
  placeholder?: string;
  badge?: string;
  stamp?: string;
  category?: string;
  metadata?: Record<string, any>;
  sections?: Array<{
    heading?: string;
    body?: string;
    bullets?: string[];
    callout?: string;
  }>;
  header?: string;
  content?: string;
  footer?: string;
  pageNumber?: string;
  isCover?: boolean;
}

export interface ManualSpread {
  id: string;
  menuLabel: string;
  left: ManualPageData;
  right: ManualPageData;
  leftPage?: ManualPageData;
  rightPage?: ManualPageData;
}

export const spread01 = {
  id: "cover",
  menuLabel: "00. UNIT COVER & RATINGS",
  leftPage: {
    header: "PLIST CRT-90 | SEC-DOC-001/A | TESTADO & APROVADO 96",
    title: "[CONTRACAPA INTERNA]",
    subtitle: "AVISOS DE SEGURANÇA E TELEMETRIA",
    content: `
      <div class="border-2 border-red-600 p-4 mb-6 bg-red-50 text-red-800">
        <h4 class="font-bold mb-2 uppercase tracking-wide">⚠ CUIDADO: ALTA VOLTAGEM</h4>
        <p class="text-sm font-medium leading-relaxed">Não abra o painel traseiro. Risco severo de desprogramação algorítmica. Deixe o choque elétrico com a nossa engenharia. Nenhuma peça aqui dentro aceita ordens de redes sociais.</p>
      </div>
      
      <div class="mb-6">
        <h4 class="font-bold text-gray-900 mb-1 uppercase tracking-wide">■ AVISO OPERACIONAL</h4>
        <p class="text-sm text-gray-800 leading-relaxed">A gente transmite, você sintoniza. Sem pausa, sem <em>skip</em>, sem métrica de vaidade. A sintonia é travada direto no nosso sinal pirata e a transmissão é bruta.</p>
        <ul class="list-disc pl-5 mt-2 text-sm text-gray-800 font-medium space-y-1">
          <li>Alimentação: 120V / 240V Bivolt Automático</li>
          <li>Sincronia: Tempo real. O que tá no ar, tá no ar.</li>
          <li>Risco de Vício: Altíssimo.</li>
        </ul>
      </div>

      <div class="mt-8 border-t border-gray-400 pt-4">
        <h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">■ ENGENHARIA DE TRANSMISSÃO</h4>
        <p class="text-sm text-gray-800 font-medium"><strong>Sinal & Curadoria:</strong> áddri</p>
        <p class="text-sm text-gray-800 font-medium"><strong>Chassi do Sistema:</strong> React, Tailwind, Supabase</p>
        <p class="text-sm text-gray-800 font-medium"><strong>Ano de Lançamento:</strong> 2026</p>
        <p class="text-xs text-gray-600 mt-4 italic font-medium leading-relaxed">Aviso Legal: Isso não é só um site, é um artefato tático para o Mestrado em Cinema e Audiovisual. Um experimento sobre memória, arquivos de guerrilha e o resgate da TV que não pedia licença para existir.</p>
      </div>
    `,
    footer: "DOC REF: SEC-DOC-001/A",
    pageNumber: "01"
  },
  rightPage: {
    header: "PLIST CRT-90 | PLIST-REV-1996 | SINAL BRUTO 02",
    title: "PLAYLISTISMO CRT-90",
    subtitle: "MANUAL DO PROPRIETÁRIO",
    content: `
      <div class="mb-6 border-b-2 border-gray-900 pb-2">
        <span class="bg-gray-900 text-gray-100 text-xs px-2 py-1 font-bold uppercase tracking-widest">Guia de Sobrevivência Audiovisual</span>
      </div>
      <p class="text-base text-gray-800 leading-relaxed font-semibold">
        Instruções, arquitetura da máquina e a filosofia por trás do tubo de imagem do seu receptor CRT-90.
      </p>
      
      <div class="mt-8">
        <h4 class="font-bold text-blue-900 mb-2 uppercase tracking-wide">■ ESPECIFICAÇÕES DO PROJETO</h4>
        <p class="text-sm text-gray-800 font-bold uppercase tracking-widest leading-relaxed">
          MÓDULO: MN-CRT90-V3<br/>
          ARQUIVO VIVO - EDIÇÃO 1996<br/>
          CÓDIGO DE ÉTICA: ARQUIVISMO DE GUERRILHA
        </p>
      </div>

      <div class="mt-8 p-4 bg-gray-200 border-l-4 border-gray-900">
        <p class="text-sm italic font-bold text-gray-900 leading-relaxed">
          « O algoritmo só te mostra o que você já é. A transmissão te joga na cara o que você nem sabia que curtia. »
        </p>
      </div>
    `,
    footer: "PLAYLISTISMO CRT-90 MANUAL",
    pageNumber: "02",
    isCover: true
  },
  get left() { return this.leftPage; },
  get right() { return this.rightPage; }
};

export const spread02 = {
  id: "manifesto",
  menuLabel: "01. BROADCAST MANIFESTO",
  leftPage: {
    header: "PLIST CRT-90 | MANIF-01-A | REGRAS DA CASA 03",
    title: "HACKEANDO O ALGORITMO",
    subtitle: "O ACASO CONTRA O FEED",
    content: `
      <div class="mb-6">
        <h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">■ A ILUSÃO DA ESCOLHA</h4>
        <p class="text-sm text-gray-800 leading-relaxed font-medium">O <em>feed</em> infinito é uma armadilha. Você acha que escolhe, mas tá só clicando no que a máquina manda pra te manter na zona de conforto. O PlayListismo é o resgate da arte do zapping. Você cai numa frequência que já está rodando, solta o controle remoto e deixa o acaso fazer o serviço. A gente devolve o imprevisível pra sua tela.</p>
      </div>

      <div class="mb-6">
        <h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">■ TRANSMISSÃO COM FRICÇÃO</h4>
        <p class="text-sm text-gray-800 leading-relaxed font-medium">Aqui não tem botão de "pular". O videoclipe é um filme, não um <em>wallpaper</em> de 15 segundos pra você rolar a tela enquanto faz outra coisa. A gente não liga pra <em>views</em> ou engajamento. A remoção do controle absoluto não é um bug, é um choque estético. Se o clipe bater na tela, você decide se aguenta o tranco.</p>
      </div>

      <div class="mt-6 p-4 bg-gray-200 border-l-4 border-gray-900">
        <p class="text-sm italic font-bold text-gray-900 leading-relaxed">
          « Para de pular. Assiste. O ruído faz parte da mensagem. »
        </p>
      </div>
    `,
    footer: "REF: MANIF-01-A",
    pageNumber: "03"
  },
  rightPage: {
    header: "PLIST CRT-90 | MANIF-01-B | ARTE TÁTICA 04",
    title: "O CLIPE COMO ARTE TOTAL",
    subtitle: "A ESTÉTICA DA SOBREVIVÊNCIA",
    content: `
      <div class="mb-6">
        <h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">■ LABORATÓRIO VISUAL</h4>
        <p class="text-sm text-gray-800 leading-relaxed font-medium">Nas últimas quatro décadas, o videoclipe foi o principal laboratório pras ideias mais malucas do cinema, da moda e da cultura pop. Cada vídeo desse canal é tratado como fita <em>master</em>. Isso aqui é um museu de vanguarda, mas com o volume no talo e as portas arrombadas.</p>
      </div>

      <div class="mb-6">
        <h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">■ A ESTÉTICA DA CICATRIZ</h4>
        <p class="text-sm text-gray-800 leading-relaxed font-medium">Fita VHS mastigada, ruído, <em>scanlines</em> e <em>glitch</em>. A internet de hoje quer tudo em 4K, limpo e sem alma. A gente quer o chiado. O erro técnico não é defeito, é textura. É a prova física de que aquela fita VHS sobreviveu ao tempo, rodou de mão em mão, foi ripada pro YouTube aos pedaços e agora tá viva no nosso chassi. O ruído tem memória.</p>
      </div>

      <div class="mt-6 p-4 bg-gray-200 border-l-4 border-gray-900">
        <p class="text-sm italic font-bold text-gray-900 leading-relaxed">
          « Não é uma playlist. É uma emissora pirata invadindo o seu tubo de imagem. »
        </p>
      </div>
    `,
    footer: "PLAYLISTISMO CRT-90 MANUAL",
    pageNumber: "04"
  },
  get left() { return this.leftPage; },
  get right() { return this.rightPage; }
};

export const spread03 = {
  id: "controls",
  menuLabel: "02. ANATOMIA & CONTROLES",
  leftPage: {
    header: "PLIST CRT-90 | CHASSI-SPEC | CONTROLE TÁTICO 05",
    title: "ANATOMIA DO RECEPTOR",
    subtitle: "INTERFACE DE HARDWARE E CONTROLES",
    content: `
      <div class="mb-6">
        <h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">■ O PAINEL DE CONTROLE</h4>
        <p class="text-sm text-gray-800 leading-relaxed font-medium">O CRT-90 não possui tela de toque ou interfaces invisíveis. Operar a emissora exige intenção e fisicalidade. Cada módulo no deck inferior foi forjado para navegação linear tática, ignorando os padrões de usabilidade que anestesiam o usuário moderno.</p>
      </div>

      <div class="mb-6">
        <h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">■ MÓDULOS DE NAVEGAÇÃO</h4>
        <ul class="space-y-3 mt-3">
          <li class="text-sm text-gray-800 leading-relaxed font-medium">
            <strong class="text-gray-900">CHAVE SELETORA DE CANAL:</strong> Não gostou do clipe? Sintoniza outra frequência. Aqui você pula de canal, não de vídeo. A linearidade não negocia com a sua impaciência.
          </li>
          <li class="text-sm text-gray-800 leading-relaxed font-medium">
            <strong class="text-gray-900">DIAL DE GANHO (VOLUME):</strong> Potenciômetro analógico. Sem suavização digital. Cuidado com picos de áudio não comprimidos em transmissões piratas de arquivo.
          </li>
          <li class="text-sm text-gray-800 leading-relaxed font-medium">
            <strong class="text-gray-900">MÓDULO PiP / ZOOM:</strong> O botão de fuga. Desanca o tubo CRT do chassi principal e expande a imagem quando a densidade do texto for demasiada para o processamento do espectador.
          </li>
        </ul>
      </div>
    `,
    footer: "REF: CHASSI-SPEC",
    pageNumber: "05"
  },
  rightPage: {
    header: "PLIST CRT-90 | CHASSI-SPEC | MANUTENÇÃO 06",
    title: "ACESSO RESTRITO",
    subtitle: "FERRAMENTAS DE DIAGNÓSTICO E CURADORIA",
    content: `
      <div class="mb-6">
        <h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">■ O SUBMUNDO DO CHASSI</h4>
        <p class="text-sm text-gray-800 leading-relaxed font-medium">Atrás do painel principal, o PlayListismo esconde as portas de acesso ao banco de dados Supabase e aos protocolos de telemetria da curadoria. O acesso não autorizado a estas portas pode resultar em dessincronização irreversível da grade de programação.</p>
      </div>

      <div class="mb-6">
        <h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">■ PORTAS DE MANUTENÇÃO</h4>
        <ul class="space-y-3 mt-3">
          <li class="text-sm text-gray-800 leading-relaxed font-medium">
            <strong class="text-gray-900">PLIST EDIT:</strong> O terminal de injeção de fitas. É por esta porta que a engenharia de transmissão sobe novos links, altera IDs de vídeo e forja novos canais direto na base de dados.
          </li>
          <li class="text-sm text-gray-800 leading-relaxed font-medium">
            <strong class="text-gray-900">SERVICE MODE:</strong> As gavetas de diagnóstico. Monitoramento em tempo real do ecossistema, 100% exposto. Um espaço brutalista para quem precisa ver as engrenagens da máquina rodando a seco.
          </li>
        </ul>
      </div>

      <div class="mt-6 p-4 bg-gray-200 border-l-4 border-gray-900">
        <p class="text-sm italic font-bold text-gray-900 leading-relaxed">
          « A interface não é amigável, porque a arqueologia de mídia não pede licença. É você quem se adapta à máquina. »
        </p>
      </div>
    `,
    footer: "PLAYLISTISMO CRT-90 MANUAL",
    pageNumber: "06"
  },
  get left() { return this.leftPage; },
  get right() { return this.rightPage; }
};

export const spread04 = {
  id: "colophon",
  menuLabel: "03. CIDADE & ENCERRAMENTO",
  leftPage: {
    header: "PLIST CRT-90 | TESE-URBANA | SINAL 07",
    title: "A CIDADE E O TUBO",
    subtitle: "EXPANSÃO DE ARQUIVO E MOBILIDADE",
    content: `
      <div class="mb-6">
        <h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">■ O CIRCUITO METROPOLITANO</h4>
        <p class="text-sm text-gray-800 leading-relaxed font-medium">O <em>PlayListismo</em> é apenas o módulo inicial de um ecossistema de arqueologia de mídia. Em sua frequência paralela e futura (o projeto <em>Retrovisor Coletivo</em>, atualmente em fase de documentação), a mesma lógica de resgate é aplicada à cidade: a preservação da tipografia Kabel Black dos letreiros e a memória da mobilidade urbana.</p>
      </div>

      <div class="mb-6">
        <h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">■ VETORES DE TRANSMISSÃO</h4>
        <p class="text-sm text-gray-800 leading-relaxed font-medium">Um sinal de TV pirata invadindo a madrugada e a rota de um ônibus noturno cruzando São Paulo têm a mesma função tática: atravessar o escuro e conectar pontos isolados. Não estamos apenas construindo um receptor de videoclipes; estamos documentando a tecnologia da sobrevivência — seja no tubo de imagem ou no asfalto.</p>
      </div>

      <div class="mt-6 p-4 bg-gray-200 border-l-4 border-gray-900">
        <p class="text-sm italic font-bold text-gray-900 leading-relaxed">
          « O letreiro aponta o destino. O sinal linear pavimenta o caminho. »
        </p>
      </div>
    `,
    footer: "REF: TESE-URBANA",
    pageNumber: "07"
  },
  rightPage: {
    header: "PLIST CRT-90 | EOF-1996 | DESLIGAMENTO 08",
    title: "FIM DE TRANSMISSÃO",
    subtitle: "PROCEDIMENTO DE DESCONEXÃO",
    content: `
      <div class="mb-6 border-b-2 border-gray-900 pb-2">
        <span class="bg-gray-900 text-gray-100 text-xs px-2 py-1 font-bold uppercase tracking-widest">Desligamento Térmico</span>
      </div>
      
      <div class="mt-6 mb-6">
        <h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">■ CÓDIGO DE ENCERRAMENTO</h4>
        <p class="text-sm text-gray-800 leading-relaxed font-medium">A unidade CRT-90 atingiu o limite de operação térmica contínua do manual. Retorne ao painel principal, selecione um canal e permita que o sinal assuma o controle.</p>
      </div>

      <div class="mb-6">
        <h4 class="font-bold text-gray-900 mb-2 uppercase tracking-wide">■ REGISTRO DE PATRIMÔNIO</h4>
        <ul class="space-y-2 mt-2">
          <li class="text-sm text-gray-800 leading-relaxed font-medium"><strong class="text-gray-900">Propriedade:</strong> Sistema de Curadoria Independente.</li>
          <li class="text-sm text-gray-800 leading-relaxed font-medium"><strong class="text-gray-900">Manutenção:</strong> Nenhuma atualização de interface garantida. Sobreviva com o que está na tela.</li>
        </ul>
      </div>

      <div class="mt-8 p-4 bg-yellow-400 border-4 border-black text-black">
        <h4 class="font-black mb-1 uppercase tracking-widest">⚠ AVISO FINAL DO SISTEMA</h4>
        <p class="text-sm font-bold leading-relaxed">Desligue a racionalidade. Ligue o monitor. A revolução não será algoritmizada.</p>
      </div>
    `,
    footer: "PLAYLISTISMO CRT-90 MANUAL",
    pageNumber: "08"
  },
  get left() { return this.leftPage; },
  get right() { return this.rightPage; }
};

export const manualSpreads = [spread01, spread02, spread03, spread04];
