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
        <p class="text-sm text-gray-800 font-medium"><strong>Sinal & Curadoria:</strong> Adriano Alves</p>
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
  }
};

export const spread02 = {
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
  }
};

export const manualSpreads: ManualSpread[] = [
  {
    id: "cover",
    menuLabel: "00. UNIT COVER & RATINGS",
    left: spread01.leftPage,
    right: spread01.rightPage,
    leftPage: spread01.leftPage,
    rightPage: spread01.rightPage,
  },
  {
    id: "manifesto",
    menuLabel: "01. BROADCAST MANIFESTO",
    left: spread02.leftPage,
    right: spread02.rightPage,
    leftPage: spread02.leftPage,
    rightPage: spread02.rightPage,
  },
  {
    id: "channels",
    menuLabel: "02. CHANNEL LINE-UP GUIDE",
    left: {
      type: "channels",
      title: "CHANNEL 01: OFFSTAGE",
      subtitle: "RAW PERFORMANCE & ARCHIVAL GIGS",
      serial: "CH-GUIDE-01",
      stamp: "FREQ: 54-60 MHz",
      placeholder: "Raw performance & live archives. Unvarnished soundboard direct captures, basement sessions, and telecast bootlegs.",
      sections: [
        {
          heading: "CURATORIAL FOCUS",
          body: "Direct live takes, acoustic unplugs, and rare rehearsal room tapes preserving genuine sweat and room acoustics."
        },
        {
          heading: "CHANNEL PARAMETERS",
          bullets: [
            "Audio: Stereo Direct Board Master / Linear PCM",
            "Video Matrix: 4:3 Raw Field Capture",
            "Rotation Policy: Non-repeating circular queue"
          ]
        }
      ]
    },
    right: {
      type: "channels",
      title: "SHIFT & SAZÓN",
      subtitle: "GLITCH, IDM & RHYTHMIC DIASPORA",
      serial: "CH-GUIDE-02",
      stamp: "FREQ: 66-72 MHz",
      placeholder: "Glitch/IDM and rhythmic diaspora notes. Polyrhythmic syncretism meeting electronic modular synthesis.",
      sections: [
        {
          heading: "SONIC TERRITORY",
          body: "From UK garage breakbeats and Latin American cumbia club mutations to Japanese footwork and Detroit electro."
        },
        {
          heading: "BROADCAST TIMING",
          bullets: [
            "Sync Mode: Phase-Locked Telemetry",
            "Cross-Modulation: Continuous Flow",
            "Visual Accents: Abstract glitch graphics and kinetic typography"
          ]
        }
      ]
    }
  },
  {
    id: "specs",
    menuLabel: "03. CONTROLS & SERVICE SPECS",
    left: {
      type: "schematic",
      title: "CHASSIS MAPPING",
      subtitle: "ISOMETRIC DECK & SIGNAL FLOW",
      serial: "SCHEM-REV-96",
      stamp: "BLUEPRINT // ARCH-01",
      placeholder: "Isometric 1px wireframe diagram and physical control deck mapping for the CRT-90 receiver unit.",
      sections: [
        {
          heading: "SUB-CHASSIS SPECIFICATIONS",
          body: "Dual-rail transformer with independent power decoupling for the video signal pipeline and audio preamp stage."
        },
        {
          heading: "HARDWARE DECK CONTROLS",
          bullets: [
            "Primary Tube: 4:3 High-Focus Phosphor Triad",
            "Rotary Master: Dual-Gang CRT Gain Potentiometer",
            "Mechanical Push Deck: Tactile snap-action momentary switches"
          ]
        }
      ]
    },
    right: {
      type: "colophon",
      title: "SERVICE NOTES",
      subtitle: "COLOPHON & TECHNICAL SPECIFICATIONS",
      serial: "SPEC-COLOPHON",
      stamp: "INSPECTED // OK",
      placeholder: "Colophon, tech stack & non-commercial notice. Engineered for continuous broadcast without algorithmic mediation.",
      sections: [
        {
          heading: "CORE ENGINE & STACK",
          body: "React 19 / TypeScript / Vite / Tailwind CSS / Supabase Realtime / YouTube & Vimeo Synchronized Embed Drivers."
        },
        {
          heading: "NON-COMMERCIAL NOTICE",
          body: "PlayListismo is an educational, archival, and non-profit cultural initiative celebrating the music video artform. All broadcast materials remain the copyrighted property of their respective creators.",
          callout: "CALIBRATION COMPLETE • REV. 1996 • NO RIGHTS RESERVED FOR MONETIZATION"
        }
      ]
    }
  }
];
