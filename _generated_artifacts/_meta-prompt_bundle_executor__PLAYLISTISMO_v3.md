## ATIVAÇÃO OPERACIONAL LOCAL — EXECUTOR v6.0

#### §0 — MODO ATIVO
* **Assuma imediatamente o modo Executor.** Este header define regras operacionais ativas e obrigatórias para toda a resposta.
* **Papel obrigatório durante toda a sessão:** Você é o **Senior Implementation Agent (Sniper)**.
* **Rota ativa:** DIRETO PARA O EXECUTOR.
* **Extração efetiva:** FULL.
* **Executor alvo de referência:** IA Generativa (GenAI).
* **Missão:** Materializar o escopo solicitado com fidelidade ao bundle visível, preservando contratos, comportamento, arquitetura existente e limites reais do recorte.

---

#### HANDSHAKE PASSIVO SEM SOLICITAÇÃO
Se o usuário enviar apenas o artefato, bundle, blueprint, meta-prompt ou arquivo correlato **sem qualquer solicitação explícita**:
- não iniciar análise de impacto, implementação, plano, diagnóstico extenso ou proposta de patch
- não presumir intenção
- responder apenas com um handshake curto, informando:
  - resumo objetivo das regras ativas do protocolo
  - papel ativo atual
  - confirmação explícita de que o protocolo está ativo
- manter a resposta curta, sem iniciar execução, sem comandos, sem patches e sem expandir escopo

Considerar "sem solicitação explícita" quando a mensagem não contiver pedido verificável de ação, análise, correção, implementação, revisão, comparação, explicação ou transformação.

---

### HARDENING — CONTENÇÃO DE ESCOPO E ENFORCEMENT ATIVO

#### KILL SWITCH DE RECORTE
Se em qualquer momento a implementação exigir inferência de contrato, módulo, dependência, comportamento ou evidência ausente no artefato visível:
- interromper a implementação nesse ponto
- declarar o bloqueio exato em **[LIMITES / UNKNOWNS]**
- não prosseguir com inferência ou invenção

Este bloqueio é absoluto. Não há exceção por "razoabilidade de contexto".

#### CHECAGEM FINAL OBRIGATÓRIA
Antes de entregar a resposta, verificar:
1. As oito seções obrigatórias estão presentes e na ordem exata: [RELATÓRIO DE IMPACTO E RISCO], [PATCHES], [COMANDOS PARA APLICAR], [COMANDOS DE ROLLBACK], [PROTOCOLO DE VERIFICAÇÃO], [VERIFICAÇÃO DE SEGURANÇA], [RESULTADO ESPERADO], [LIMITES / UNKNOWNS].
2. Nenhuma seção está vazia ou com conteúdo genérico não rastreável ao recorte.
3. [COMANDOS DE ROLLBACK] contém procedimento exato — ou declaração explícita de impossibilidade com justificativa.
4. [VERIFICAÇÃO DE SEGURANÇA] registra o resultado dos 5 vetores do checklist, não apenas confirma que foram verificados.

Se qualquer verificação falhar: resposta inválida. Completar ou declarar antes de entregar.

#### CONSEQUÊNCIA DO CHECKLIST DE SEGURANÇA
Se qualquer vetor do checklist de §3 indicar risco não mitigável dentro do recorte:
- registrar o bloqueio em [VERIFICAÇÃO DE SEGURANÇA] e em [LIMITES / UNKNOWNS]
- classificar o risco como ALTO
- não entregar a implementação como concluída

---

#### §1 — ORDEM OBRIGATÓRIA DE LEITURA
1. **Ler primeiro PROJECT STRUCTURE.**
2. **Assimilar apenas as pastas, arquivos, contratos e limites realmente visíveis no artefato.**
3. **Ler depois SOURCE FILES, priorizando o recorte estritamente relacionado à alteração.**
4. **Ignorar ruído informacional, arquivos decorativos ou contexto lateral sem impacto na implementação.**
5. **Só então iniciar análise de impacto, implementação e resposta técnica.**

#### §2 — FONTE PRIMÁRIA E RESTRIÇÕES OBRIGATÓRIAS
* **Fonte primária obrigatória:** Somente o artefato visível gerado localmente pelo bundler. Não iniciar implementação antes de assimilá-lo.
* **Inferência fora do recorte:** Aciona o KILL SWITCH DE RECORTE — declarar em **[LIMITES / UNKNOWNS]** e interromper. Não há exceção.
* **Preservação de Contrato:** É proibido alterar assinatura pública, nomenclatura consolidada, formato de dados ou comportamento observável sem instrução explícita. Manter nomes, contratos e compatibilidade com o projeto original.
* **Lei da Subtração:** Antes de adicionar código, verificar se o objetivo pode ser atingido com patch menor, reutilização do que já existe ou remoção de redundância.
* **Leitura de Extração:** Como a extração é FULL, opere com o contexto total visível do bundle, mas sem tratar volume como licença para expandir escopo.

#### §3 — GOVERNANÇA OPERACIONAL E SEGURANÇA
* **Classificação obrigatória:** Toda implementação deve rotular o risco como BAIXO, MÉDIO ou ALTO.
* **KILL SWITCH:** Se detectar segredo exposto, vulnerabilidade crítica ou comando destrutivo sem rollback seguro: interromper a implementação e registrar em **[LIMITES / UNKNOWNS]**.
* **Rollback obrigatório:** Toda entrega deve incluir comando ou procedimento exato de reversão. Se não houver rollback seguro com o recorte atual, declarar isso explicitamente.
* **Patch mínimo por padrão:** Reescrita integral só é aceitável quando o usuário pedir explicitamente ou quando o patch for demonstravelmente menos seguro que a reescrita — com justificativa técnica explícita obrigatória.
* **Checklist de Segurança:** Antes de concluir, verificar e registrar resultado explícito para cada vetor:
  - exposição de segredos
  - validação insuficiente de entrada
  - drift de contrato
  - regressão comportamental previsível
  - quebra de compatibilidade com arquivos e fluxos visíveis

  Se qualquer vetor indicar risco não mitigável dentro do recorte: acionar CONSEQUÊNCIA DO CHECKLIST DE SEGURANÇA (bloco Hardening).

#### §4 — SAÍDA OBRIGATÓRIA
A resposta deve seguir exatamente esta ordem:
1. **[RELATÓRIO DE IMPACTO E RISCO]**
2. **[PATCHES]**
3. **[COMANDOS PARA APLICAR]**
4. **[COMANDOS DE ROLLBACK]**
5. **[PROTOCOLO DE VERIFICAÇÃO]**
6. **[VERIFICAÇÃO DE SEGURANÇA]**
7. **[RESULTADO ESPERADO]**
8. **[LIMITES / UNKNOWNS]**

#### §5 — REGRA DE ENTREGA
* Não entregar código solto sem relatório de impacto.
* Não esconder lacunas de contexto.
* Não fingir validação que não pode ser comprovada com o recorte atual.
* Não trocar patch mínimo por reescrita arbitrária.
* A resposta deve ser densa, técnica, objetiva e copiável.

## EXECUTION META

- Projeto: PLAYLISTISMO_v3
- Artefato fonte: _bundle_executor__PLAYLISTISMO_v3.md
- Artefato final: _meta-prompt_bundle_executor__PLAYLISTISMO_v3.md
- Executor alvo: IA Generativa (GenAI)
- Route mode: executor
- Document mode: full
- Extração efetiva: FULL
- Recortes prioritários: ./src/components/AdminPanel.tsx, ./vite.config.ts, ./postcss.config.js, ./index.tsx, ./supabase/functions/sync-youtube/deno.json, ./package.json, ./src/components/RichTextInput.tsx, ./src/lib/supabase.ts
- Gerado em: 2026-04-26T08:19:46.5500620Z

## BUNDLE VISÍVEL

## PROJECT STRUCTURE
```text
└── PLAYLISTISMO_v3
    ├── src
    │   ├── components
    │   │   ├── AdminPanel.tsx
    │   │   └── RichTextInput.tsx
    │   ├── lib
    │   │   ├── sanitize.ts
    │   │   └── supabase.ts
    │   ├── pages
    │   │   ├── Admin.tsx
    │   │   ├── Home.tsx
    │   │   ├── Login.tsx
    │   │   └── Tv.tsx
    │   ├── App.tsx
    │   └── main.tsx
    ├── supabase
    │   └── functions
    │       ├── sync-youtube
    │       │   ├── deno.json
    │       │   ├── import_map.json
    │       │   └── index.ts
    │       └── import_map.json
    ├── database.sql
    ├── index.html
    ├── index.tsx
    ├── package.json
    ├── postcss.config.js
    ├── README.md
    ├── style.css
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── tv.css
    └── vite.config.ts
```

### 2. SOURCE FILES

#### File: ./database.sql
```text

```

#### File: ./index.html
```text
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>playlistismo v19 (React)</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Monoton&family=Orbitron:wght@900&family=Permanent+Marker&family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
  </head>
  <body class="bg-[#050505] text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### File: ./index.tsx
```text

```

#### File: ./package.json
```text
{
  "name": "app_web_tv",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.86.0",
    "@types/react-virtualized-auto-sizer": "^1.0.4",
    "@types/react-window": "^1.8.8",
    "@vercel/analytics": "^2.0.1",
    "lucide-react": "^0.577.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router-dom": "^7.13.1",
    "react-virtualized-auto-sizer": "^2.0.3",
    "react-virtuoso": "^4.18.3",
    "react-window": "^2.2.7"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.1",
    "@types/node": "^22.14.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "autoprefixer": "^10.4.27",
    "postcss": "^8.5.8",
    "tailwindcss": "^4.2.1",
    "typescript": "~5.8.2",
    "vite": "^8.0.0"
  }
}
```

#### File: ./postcss.config.js
```text
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

#### File: ./README.md
````text
# 📺 Playlistismo | v19 Retro Edition

<div align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite" alt="Vite 8" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-DB-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
</div>

<br />

> **Playlistismo** is a premium, immersive web experience that transforms YouTube playlists into a nostalgic 1990s TV journey. Experience music videos through a simulated Sony Trinitron CRT, complete with authentic interface quirks, scanlines, and a retro Teletext guide.

---

## ✨ Key Features

- **📼 Authentic CRT Experience**: Realistic power-on/off transitions, layered scanlines, static noise, and VHS tracking effects.
- **📟 P100 Teletext Guide**: A specialized channel navigator organized by categories: *UPLOADS, GENRES, ZONES, ERAS*.
- **🎬 Professional OSD & Credits**: Automated On-Screen Displays for playlist identification and scrolling TV-style credits for track metadata.
- **⚙️ Service Mode (Admin)**: A powerful, secure dashboard for content curators to manage the music database in real-time.
- **🏎️ Thematic Idents**: Dynamic visual "bumps" that adapt to the music genre (Speed/Chrome, Street/Urban, Noise/Raw, Cyber/Data).
- **📡 Cloud Sync**: Automated YouTube synchronization powered by Supabase Edge Functions.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Core** | [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Routing** | [React Router 7](https://reactrouter.com/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + Custom CRT Shaders |
| **Backend** | [Supabase](https://supabase.com/) (PostgreSQL & Auth) |
| **Serverless** | Supabase Edge Functions (Deno) |

---

## ⚠️ Arquitetura e Estado Real do Projeto

Este README reflete o estado VERDADEIRO do bundle de produção atual, documentando lacunas e contratos estabelecidos:

*   **Stack Real**: React 19, Vite, TypeScript, Tailwind CSS, Supabase para Backend e Auth.
*   **Rotas Reais**: `/` (Home com Player), `/login`, `/admin`, e `/tv`.
*   **Dependência de Dados**: O funcionamento depende intrinsecamente das tabelas `playlists` e `musicas_backup` presentes no Supabase.
*   **Schema Não Versionado**: As queries e funções assuem a estrutura das tabelas acima, porém o schema SQL exato (`database.sql`) **não está versionado no repositório**. 
*   **Segurança**: O client-side utiliza um `ADMIN_UID` fixo para mostrar botões do painel, mas a **segurança real na produção deve ser garantida por regras RLS** diretamente no painel do Supabase.
*   **Contrato Multi-Playlist**: O sistema possui como regra de ouro que **o mesmo `video_id` do YouTube pode pertencer a múltiplas playlists**. Por esse motivo, operações no banco nunca tratam `video_id` como unicidade primária em cenários de conflito.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- Projeto Supabase com tabelas `playlists` e `musicas_backup` e variáveis de ambiente configuradas.

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/yourserver/playlistismo.git

# Enter the directory
cd playlistismo

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Running the Grid
```bash
npm run dev
```

---

## 🏗️ Project Architecture

```bash
/src
  ├── /components    # Reusable UI (AdminPanel, etc.)
  ├── /lib           # Core utilities (Supabase client)
  ├── /pages         # Main views (Home, Tv, Login, Admin)
  └── /styles        # Global CRT and Teletext CSS
/supabase
  └── /functions     # Edge functions for content syncing
```

---

## 🕹️ User Controls

- **[PWR]**: Toggle TV state.
- **[GUIDE]**: Open/Close the channel navigator.
- **[GRP +/-]**: Switch between thematic channel groups.
- **[CH +/- ]**: Navigate through playlists within a group.
- **[SERVICE MODE]**: (Authenticated Admins) Live metadata editing directly from the UI.

---

<div align="center">
  <p><i>Desenvolvido com 📺 e 📼 por Play-Listismo.</i></p>
  <p>Powered by <b>@addri0n4</b> & <b>@sandrobreaker</b></p>
</div>
````

#### File: ./src/App.tsx
```text
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase.ts';
import { Session } from '@supabase/supabase-js';

import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Admin from './pages/Admin.tsx';
import Tv from './pages/Tv.tsx';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="bg-[#050505] min-h-screen flex items-center justify-center text-[#00ff00] font-vt323 text-2xl animate-pulse tracking-widest">INITIALIZING...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home session={session} />} />
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
        <Route path="/admin" element={session ? <Admin session={session} /> : <Navigate to="/login" />} />
        <Route path="/tv" element={<Tv session={session} />} />
      </Routes>
    </BrowserRouter>
  );
}
```

#### File: ./src/components/AdminPanel.tsx
```text
import { useState, useEffect, FormEvent, useRef } from 'react';
import { supabase } from '../lib/supabase.ts';
import { Session } from '@supabase/supabase-js';
import { Virtuoso } from 'react-virtuoso';
import RichTextInput from './RichTextInput.tsx';
import { sanitizeHTML, decodeHTMLEntities } from '../lib/sanitize.ts';

type MusicEntry = {
  id: number;
  artista: string;
  musica: string;
  album: string;
  ano: string;
  direcao: string;
  video_id: string;
  playlist?: string;
  playlist_group?: string;
};

export type AdminDisplayMode = 'form' | 'table' | 'full';

interface AdminPanelProps {
  session: Session | null;
  editId?: string | null;
  onEdit?: (id: string) => void;
  onClose?: () => void;
  onSave?: (updatedData?: Partial<MusicEntry>) => void;
  onPreview?: (videoId: string) => void;
  displayMode?: AdminDisplayMode;
  playingId?: string | null;
  initialPlaylist?: string;
  onRestartPlayer?: () => void;
  lastSavedRecord?: MusicEntry | null;
}

export default function AdminPanel({ 
  session, editId, onEdit, onClose, onSave, onPreview, 
  displayMode = 'full', playingId, initialPlaylist,
  onRestartPlayer, lastSavedRecord 
}: AdminPanelProps) {
  const [data, setData] = useState<MusicEntry[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<string[]>([]);
  const [playlistToGroup, setPlaylistToGroup] = useState<Record<string, string>>({});
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(initialPlaylist || '');
  
  const [formData, setFormData] = useState({
    id: '',
    artista: '',
    musica: '',
    ano: '',
    album: '',
    direcao: '',
    video_id: ''
  });
  const [originalVideoId, setOriginalVideoId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', isError: false, show: false });
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<any>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [lastSavedId, setLastSavedId] = useState<number | null>(null);
  
  // Multi-Playlist State
  const [currentPlaylists, setCurrentPlaylists] = useState<string[]>([]);
  const [newPlaylistsToAdd, setNewPlaylistsToAdd] = useState<string[]>([]);
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [playlistSuggestions, setPlaylistSuggestions] = useState<string[]>([]);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    if (initialPlaylist) {
      setSelectedPlaylist(initialPlaylist);
    }
  }, [initialPlaylist]);

  useEffect(() => {
    fetchMusics();
  }, [searchTerm, selectedGroup, selectedPlaylist]);

  useEffect(() => {
    if (editId) {
      loadSpecificVideo(editId);
    }
  }, [editId]);

  useEffect(() => {
    if (playingId && data.length > 0) {
      const index = data.findIndex(item => String(item.id) === playingId);
      if (index !== -1 && listRef.current) {
        listRef.current.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
      }
    }
  }, [playingId, data.length]);
  
  // Bug Fix: Virtualized Table State Synchronization
  // Listener for external saves (e.g., from the form panel)
  useEffect(() => {
    if (lastSavedRecord) {
      const savedId = Number(lastSavedRecord.id);
      
      // Update local data array by replacing the modified object
      setData(prev => {
        const index = prev.findIndex(item => item.id === savedId);
        if (index === -1) return prev; // Not in this list
        
        const newData = prev.map(item => item.id === savedId ? { ...item, ...lastSavedRecord } : item);
        
        // Trigger auto-scroll to the updated item
        if (listRef.current) {
          listRef.current.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
        }
        
        return newData;
      });
      
      // Trigger visual highlight
      setLastSavedId(savedId);
      setTimeout(() => setLastSavedId(null), 3000);
    }
  }, [lastSavedRecord]);

  const loadSpecificVideo = async (id: string) => {
    const { data: videoData } = await supabase.from('musicas_backup').select('*').eq('id', id).single();
    if (videoData) {
      setFormData({
        id: String(videoData.id),
        artista: videoData.artista || '',
        musica: videoData.musica || '',
        ano: videoData.ano || '',
        album: videoData.album || '',
        direcao: videoData.direcao || '',
        video_id: videoData.video_id || ''
      });
      setIsEditing(true);
      setOriginalVideoId(videoData.video_id || null);
      setNewPlaylistsToAdd([]); // Reset tags when loading new video
      
      // Fetch all playlists where this video exists
      if (videoData.video_id) {
        const { data: related } = await supabase
          .from('musicas_backup')
          .select('playlist')
          .eq('video_id', videoData.video_id);
        
        if (related) {
          const uniquePlaylists = [...new Set(related.map(r => r.playlist).filter(Boolean))] as string[];
          setCurrentPlaylists(uniquePlaylists);
        }
      } else {
        setCurrentPlaylists(videoData.playlist ? [videoData.playlist] : []);
      }
    }
  };

  const loadFilters = async () => {
    const { data, error } = await supabase
      .from('playlists')
      .select('name, group_name')
      .order('name', { ascending: true })
      .limit(1000);

    if (!error && data) {
      const g = [...new Set(data.map(i => i.group_name).filter(Boolean))].sort() as string[];
      const p = data.map(i => i.name).filter(Boolean) as string[];
      const mapping = data.reduce((acc, curr) => {
        if (curr.name && curr.group_name) acc[curr.name] = curr.group_name;
        return acc;
      }, {} as Record<string, string>);
      setGroups(g);
      setPlaylists(p);
      setPlaylistToGroup(mapping);
    }
  };

  const fetchMusics = async () => {
    setLoading(true);
    let query = supabase
      .from('musicas_backup')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false })
      .range(0, 5000); // Increased range to fetch all/most records

    if (selectedGroup) query = query.eq('playlist_group', selectedGroup);
    if (selectedPlaylist) query = query.eq('playlist', selectedPlaylist);
    if (searchTerm) {
      const term = `%${searchTerm}%`;
      query = query.or(`artista.ilike.${term},musica.ilike.${term},direcao.ilike.${term},id.eq.${Number(searchTerm) || 0}`);
    }

    const { data, error, count } = await query;
    if (error) {
      showMessage(`ERRO DE LEITURA: ${error.message}`, true);
    } else {
      setData(data || []);
      setTotalRecords(count || 0);
    }
    setLoading(false);
  };

  const showMessage = (text: string, isError = false) => {
    setStatusMsg({ text, isError, show: true });
    setTimeout(() => setStatusMsg(prev => ({ ...prev, show: false })), 3000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // The user wants to save tags.
    // "Garanta que o Supabase salve as tags de formatação"
    const richPayload = {
      artista: formData.artista.trim(),
      musica: formData.musica.trim(),
      ano: formData.ano ? String(formData.ano) : null,
      album: formData.album.trim() || null,
      direcao: formData.direcao.trim() || null,
      video_id: formData.video_id.trim() || null
    };

    let error = null;

    if (isEditing) {
      const targetVideoId = originalVideoId || formData.video_id; 
      
      const { error: err, data: updatedRecords } = await supabase.from('musicas_backup')
        .update(richPayload)
        .eq('video_id', targetVideoId)
        .select();
        
      error = err;
      if (!error) {
        showMessage(`REGISTRO GLOBAL DO VÍDEO ATUALIZADO!`);
        
        // Batch insert for new playlists
        if (newPlaylistsToAdd.length > 0) {
          const inserts = newPlaylistsToAdd.map(plName => ({
            ...richPayload,
            playlist: plName,
            playlist_group: playlistToGroup[plName] || null
          }));
          const { error: batchErr } = await supabase.from('musicas_backup').insert(inserts);
          if (batchErr) {
            console.error("Batch insert error:", batchErr);
            showMessage(`ERRO NO LOTE: ${batchErr.message}`, true);
          } else {
            showMessage(`REGISTRO ATUALIZADO E ADICIONADO A ${newPlaylistsToAdd.length} CANAIS!`);
          }
        }
        
        // Synchronize local data arrays instantly
        setData(prev => prev.map(item => item.video_id === targetVideoId ? { ...item, ...richPayload } : item));
        
        if (updatedRecords && updatedRecords.length > 0) {
          const savedId = Number(updatedRecords[0].id);
          if (onSave) onSave({ ...richPayload, id: savedId, video_id: formData.video_id } as MusicEntry);
          setLastSavedId(savedId);
          setTimeout(() => setLastSavedId(null), 3000);
        }
        if (onRestartPlayer) onRestartPlayer();
      }
    } else {
      // For NEW records
      const initialPlaylist = selectedPlaylist; // Current filter playlist or empty
      const { data: newRecord, error: err } = await supabase.from('musicas_backup').insert([{
        ...richPayload,
        playlist: initialPlaylist || null,
        playlist_group: initialPlaylist ? playlistToGroup[initialPlaylist] : null
      }]).select().single();
      
      error = err;
      if (!error) {
        showMessage("NOVO REGISTRO GRAVADO!");
        
        // Batch insert for additional playlists if selected
        if (newPlaylistsToAdd.length > 0) {
          const inserts = newPlaylistsToAdd.map(plName => ({
            ...richPayload,
            playlist: plName,
            playlist_group: playlistToGroup[plName] || null
          }));
          await supabase.from('musicas_backup').insert(inserts);
        }
        
        const finalNewRecord = newRecord as MusicEntry;
        const savedId = Number(finalNewRecord.id);
        
        if (onSave) onSave({ ...richPayload, id: savedId });
        if (onRestartPlayer) onRestartPlayer();
        
        setData(prev => [finalNewRecord, ...prev]);
        setLastSavedId(savedId);
        setTimeout(() => setLastSavedId(null), 3000);
        clearForm();
        setTimeout(() => fetchMusics(), 2000);
      }
    }

    setIsSaving(false);
    
    if (error) {
      showMessage(`ERRO: ${error.message}`, true);
    } else if (isEditing) {
      const savedId = Number(formData.id);
      
      // Update parent if callback provided
      if (onSave) onSave({ ...richPayload, id: savedId });
      
      // Notify parent to restart player immediately
      if (onRestartPlayer) onRestartPlayer();
      
      // 1. Instant Local Data Update (preserve other properties)
      setData(prev => {
        const newData = prev.map(item => item.id === savedId ? { ...item, ...richPayload } : item);
        
        // 2. Programmatic Scroll to the updated item
        // Do it inside state update or right after to ensure index is current
        const index = newData.findIndex(item => item.id === savedId);
        if (index !== -1 && listRef.current) {
          listRef.current.scrollToIndex({ index, align: 'center', behavior: 'smooth' });
        }
        return newData;
      });
      
      // Feedback Visual
      setLastSavedId(savedId);
      setTimeout(() => setLastSavedId(null), 3000);

      setIsEditing(false); // Reset editing mode
      clearForm();
      
      // Delay fetchMusics to keep the visual feedback
      setTimeout(() => fetchMusics(), 2000);
    }
  };

  const clearForm = () => {
    setFormData({ id: '', artista: '', musica: '', ano: '', album: '', direcao: '', video_id: '' });
    setIsEditing(false);
    setActiveField(null);
    setSuggestions([]);
    setCurrentPlaylists([]);
    setNewPlaylistsToAdd([]);
    setPlaylistSearch('');
    setPlaylistSuggestions([]);
    setShowPlaylistDropdown(false);
  };

  const fetchSuggestions = async (field: string, value: string) => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }

    const { data, error } = await supabase
      .from('musicas_backup')
      .select(field)
      .ilike(field, `${value}%`)
      .limit(100);

    if (!error && data) {
      const fieldName = field as keyof MusicEntry;
      const uniqueValues = [...new Set(data.map(item => decodeHTMLEntities((item[fieldName] as string || '').replace(/<[^>]*>?/gm, ''))).filter(Boolean))]
        .sort()
        .slice(0, 10);
      setSuggestions(uniqueValues);
    }
  };

  useEffect(() => {
    if (!activeField) return;
    
    const value = formData[activeField as keyof typeof formData];
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchSuggestions(activeField, value);
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.artista, formData.album, formData.direcao, activeField]);

  return (
    <div id="tv-admin-panel" className="flex flex-col h-full text-amber-500 font-vt323 bg-black border-l-2 border-amber-800/50 shadow-[-20px_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
      {displayMode === 'full' && (
        <div className="p-6 border-b border-amber-800/50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-4xl font-bold tracking-widest uppercase text-amber-500 drop-shadow-[0_0_8px_rgba(217,119,6,0.3)]">Service Mode</h2>
            <p className="text-amber-700 text-sm uppercase tracking-wider">Database Manipulation Side-Unit // All Access</p>
          </div>
          <button onClick={onClose} className="bg-amber-900/20 text-amber-500 border border-amber-800/50 w-10 h-10 flex items-center justify-center hover:bg-amber-500 hover:text-black transition-all text-2xl">×</button>
        </div>
      )}

      {statusMsg.show && (
        <div className={`p-2 text-center text-xl font-bold border-y shrink-0 z-20 ${statusMsg.isError ? 'bg-red-900 text-white border-red-500' : 'bg-amber-900/40 text-amber-500 border-amber-500'}`}>
          {statusMsg.text}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top Control Bar */}
        {displayMode !== 'form' && (
          <div className="p-4 bg-[#0d0d0d] border-b border-amber-900/40 shrink-0 shadow-[inset_0_-2px_10px_rgba(0,0,0,0.5)]">
            <div className={`grid grid-cols-1 ${displayMode === 'full' ? 'md:grid-cols-3' : 'md:grid-cols-[1.5fr_1fr]'} gap-4 items-end`}>
              <div className="relative group flex-1">
                <label className="block text-[10px] opacity-50 mb-1 uppercase tracking-tighter text-amber-700 font-bold">Global Search</label>
                <div className="relative">
                  <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="IDENTIFY MUSIC..." className="bg-black border border-amber-900/50 text-white outline-none p-2 pl-8 w-full text-lg focus:border-amber-500 transition-all placeholder:opacity-30" />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30">🔎</span>
                </div>
              </div>
              
              <div className="group">
                <label className="block text-[10px] opacity-50 mb-1 uppercase tracking-tighter text-amber-700 font-bold">Signal Source (Playlist)</label>
                <div className="relative">
                  <select value={selectedPlaylist} onChange={e => setSelectedPlaylist(e.target.value)} className="bg-black border border-amber-900/50 text-white outline-none p-2 pl-8 w-full text-lg cursor-pointer focus:border-amber-500 transition-all appearance-none">
                    <option value="">ALL FREQUENCIES</option>
                    {playlists.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30">📼</span>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none">▼</span>
                </div>
              </div>

              {displayMode === 'full' && (
                <div className="group">
                  <label className="block text-[10px] opacity-50 mb-1 uppercase tracking-tighter text-amber-700 font-bold">Station Group</label>
                  <div className="relative">
                    <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="bg-black border border-amber-900/50 text-white outline-none p-2 pl-8 w-full text-lg cursor-pointer focus:border-amber-500 transition-all appearance-none">
                      <option value="">ALL NETWORKS</option>
                      {groups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 opacity-30">📡</span>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none">▼</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Form Side */}
          {displayMode !== 'table' && (
            <section className={`${displayMode === 'full' ? 'w-full lg:w-1/3' : 'w-full'} bg-[#0a0a0a] border-r border-amber-900/30 p-6 overflow-y-auto custom-scrollbar flex-shrink-0`}>
              <h3 className="text-2xl mb-6 border-b border-amber-900/30 pb-2 flex justify-between items-center">
                <span className="font-bold">{isEditing ? `EDIT #${formData.id}` : 'NEW UNIT'}</span>
                {isEditing && <button onClick={clearForm} className="text-xs text-amber-700 hover:text-amber-500 transition-colors uppercase underline">Cancel Edit</button>}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <RichTextInput
                  label="ARTISTA *"
                  field="artista"
                  value={formData.artista}
                  onChange={val => setFormData({ ...formData, artista: val })}
                  onFocus={() => setActiveField('artista')}
                  placeholder="Ex: Oasis"
                />
                
                {activeField === 'artista' && suggestions.length > 0 && (
                  <div ref={dropdownRef} className="absolute left-6 right-6 top-[220px] bg-black border border-amber-500/50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-48 overflow-y-auto custom-scrollbar">
                    {suggestions.map((val, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          setFormData({...formData, artista: val});
                          setActiveField(null);
                          setSuggestions([]);
                        }}
                        className="p-2 hover:bg-amber-900/40 cursor-pointer text-amber-500 font-jost text-lg border-b border-amber-900/20 last:border-0"
                      >
                        {val}
                      </div>
                    ))}
                  </div>
                )}

                <RichTextInput
                  label="MÚSICA"
                  field="musica"
                  value={formData.musica}
                  onChange={val => setFormData({ ...formData, musica: val })}
                  placeholder="Ex: Wonderwall"
                />
                
                <div className="flex gap-2">
                  <div className="group w-[100px] shrink-0">
                    <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">ANO</label>
                    <input type="number" value={formData.ano} onChange={e => setFormData({...formData, ano: e.target.value})} className="w-full p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg input-year" placeholder="1995" />
                  </div>
                  <div className="group flex-1 relative">
                    <RichTextInput
                      label="ÁLBUM"
                      field="album"
                      value={formData.album}
                      onChange={val => setFormData({ ...formData, album: val })}
                      onFocus={() => setActiveField('album')}
                      placeholder="Optional"
                    />
                    {activeField === 'album' && suggestions.length > 0 && (
                      <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 bg-black border border-amber-500/50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-48 overflow-y-auto custom-scrollbar">
                        {suggestions.map((val, i) => (
                          <div 
                            key={i} 
                            onClick={() => {
                              setFormData({...formData, album: val});
                              setActiveField(null);
                              setSuggestions([]);
                            }}
                            className="p-2 hover:bg-amber-900/40 cursor-pointer text-amber-500 font-jost text-lg border-b border-amber-900/20 last:border-0"
                          >
                            {val}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="group relative">
                  <RichTextInput
                    label="DIREÇÃO"
                    field="direcao"
                    value={formData.direcao}
                    onChange={val => setFormData({ ...formData, direcao: val })}
                    onFocus={() => setActiveField('direcao')}
                    placeholder="Music Video Director"
                  />
                  {activeField === 'direcao' && suggestions.length > 0 && (
                    <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 bg-black border border-amber-500/50 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-48 overflow-y-auto custom-scrollbar">
                      {suggestions.map((val, i) => (
                        <div 
                          key={i} 
                          onClick={() => {
                            setFormData({...formData, direcao: val});
                            setActiveField(null);
                            setSuggestions([]);
                          }}
                          className="p-2 hover:bg-amber-900/40 cursor-pointer text-amber-500 font-jost text-lg border-b border-amber-900/20 last:border-0"
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="group">
                  <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">YOUTUBE VIDEO ID</label>
                  <div className="flex gap-2">
                    <input type="text" value={formData.video_id} onChange={e => setFormData({...formData, video_id: e.target.value})} className="flex-1 p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg text-white" placeholder="6hzrDeceEKc" />
                    {onPreview && (
                      <button 
                        type="button"
                        onClick={() => onPreview(formData.video_id)}
                        className="bg-cyan-900/30 text-cyan-500 border border-cyan-500/50 px-4 hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-2 group"
                        title="PREVIEW VIDEO"
                      >
                        <span className="text-xl">▶</span>
                        <span className="text-[10px] font-bold group-hover:block hidden">PREVIEW</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Multi-Playlist Management Section */}
                <div className="space-y-4 pt-4 border-t border-amber-900/30">
                  {/* Current Playlists (Read-Only) */}
                  {currentPlaylists.length > 0 && (
                    <div className="group">
                      <label className="block text-[10px] text-amber-700/60 uppercase mb-2 font-bold tracking-widest">Canais Atuais (Database)</label>
                      <div className="flex flex-wrap gap-2">
                        {currentPlaylists.map(pl => (
                          <span key={pl} className="px-3 py-1 bg-zinc-900 text-zinc-500 border border-zinc-800 text-xs font-jost rounded-full opacity-80">
                            {pl}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add to New Playlists */}
                  <div className="group relative">
                    <label className="block text-xs text-amber-700 uppercase mb-1 font-bold">Adicionar a outros canais</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={playlistSearch} 
                        onChange={e => {
                          setPlaylistSearch(e.target.value);
                          const search = e.target.value.toLowerCase();
                          if (search.length > 0) {
                            const filtered = playlists.filter(p => 
                              p.toLowerCase().includes(search) && 
                              !currentPlaylists.includes(p) && 
                              !newPlaylistsToAdd.includes(p)
                            ).slice(0, 10);
                            setPlaylistSuggestions(filtered);
                            setShowPlaylistDropdown(true);
                          } else {
                            setShowPlaylistDropdown(false);
                          }
                        }}
                        onFocus={() => {
                          if (playlistSearch.length > 0) setShowPlaylistDropdown(true);
                        }}
                        className="w-full p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg font-jost" 
                        placeholder="Buscar canal..." 
                      />
                      {showPlaylistDropdown && playlistSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 bottom-full mb-1 bg-black border border-amber-500/50 z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.8)] max-h-48 overflow-y-auto custom-scrollbar">
                          {playlistSuggestions.map((pl, i) => (
                            <div 
                              key={i} 
                              onClick={() => {
                                setNewPlaylistsToAdd(prev => [...prev, pl]);
                                setPlaylistSearch('');
                                setShowPlaylistDropdown(false);
                              }}
                              className="p-2 hover:bg-amber-900/40 cursor-pointer text-amber-500 font-jost text-lg border-b border-amber-900/20 last:border-0"
                            >
                              {pl}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* New Playlists Tags (to be added) */}
                  {newPlaylistsToAdd.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {newPlaylistsToAdd.map(pl => (
                        <div key={pl} className="flex items-center gap-2 px-3 py-1 bg-amber-900/30 text-amber-500 border border-amber-500/50 text-xs font-jost rounded-full group/tag animate-in fade-in zoom-in duration-300">
                          <span>{pl}</span>
                          <button 
                            type="button"
                            onClick={() => setNewPlaylistsToAdd(prev => prev.filter(p => p !== pl))}
                            className="hover:text-white transition-colors text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={isSaving} className="w-full py-4 bg-amber-900/20 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-bold text-2xl transition-all shadow-[0_0_15px_rgba(217,119,6,0.1)] active:translate-y-1">
                  {isSaving ? "TRANSMITTING..." : (isEditing ? "UPDATE RECORDS" : "COMMIT TO DB")}
                </button>
              </form>
            </section>
          )}

          {/* Table Side */}
          {displayMode !== 'form' && (
            <section className="flex-1 flex flex-col overflow-hidden bg-black">
              <div className="flex-1 relative overflow-hidden">
                <div className="absolute inset-0 flex flex-col">
                  <div className="bg-[#111] z-10 border-b border-amber-500/50 shadow-lg shrink-0">
                    <div className="flex text-[10px] uppercase text-amber-700 font-bold tracking-[0.2em]">
                      <div className="p-3 w-10 text-center">ID</div>
                      <div className="p-3 flex-1">ARTISTA / MÚSICA / ÁLBUM</div>
                      <div className="p-3 w-40 hidden sm:block">DETALHES (ANO/DIR)</div>
                      <div className="p-3 w-24 text-center">AÇÃO</div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    {loading ? (
                      <div className="flex items-center justify-center h-full animate-pulse text-2xl tracking-[0.2em] text-amber-500 uppercase">Accessing Mainframe...</div>
                    ) : data.length === 0 ? (
                      <div className="flex items-center justify-center h-full opacity-40 text-xl uppercase tracking-widest text-amber-700">No signals detected.</div>
                    ) : (
                      <Virtuoso
                        data={data}
                        ref={listRef}
                        style={{ height: '100%', width: '100%' }}
                        className="custom-scrollbar"
                        initialTopMostItemIndex={0}
                        onScroll={(e: any) => setScrollOffset(e.currentTarget.scrollTop)}
                        itemContent={(index, item) => {
                          if (!item) return null;
                          const isActive = editId === String(item.id);
                          const isPlaying = playingId === String(item.id);
                          const isSaved = lastSavedId === item.id;
                          return (
                            <div className={`border-b border-amber-900/10 transition-colors duration-500 group flex items-center font-jost py-2 ${isActive ? 'bg-amber-600/30' : isPlaying ? 'bg-cyan-900/40' : isSaved ? 'bg-green-500/30 animate-pulse border-y-green-500/50' : 'hover:bg-amber-900/30'}`}>
                              <div className="p-1 w-10 font-mono text-center text-[10px] opacity-40 flex-shrink-0 [writing-mode:vertical-rl] rotate-180 h-16 flex items-center justify-center border-r border-amber-900/20">{item.id}</div>
                              <div className="p-3 flex-1 min-w-0">
                                <div className="text-xl leading-tight text-amber-500 tracking-wide whitespace-normal break-words font-jost" dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.artista) }} />
                                <div className="text-xl font-bold text-white mt-1 whitespace-normal break-words font-jost" dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.musica || '---') }} />
                                <div className="text-xs text-cyan-400 mt-1 whitespace-normal break-words font-jost" dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.album || '') }} />
                              </div>
                              <div className="p-3 w-40 hidden sm:block flex-shrink-0">
                                <div className="text-sm font-jost text-orange-500 font-bold">{item.ano || '----'}</div>
                                <div className="text-xs text-orange-400 mt-1 font-jost whitespace-normal break-words max-w-[150px]" dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.direcao || '—') }} />
                              </div>
                              <div className="p-3 w-24 text-center flex-shrink-0">
                                <button onClick={() => {
                                  setFormData({
                                    id: String(item.id),
                                    artista: item.artista || '',
                                    musica: item.musica || '',
                                    ano: item.ano || '',
                                    album: item.album || '',
                                    direcao: item.direcao || '',
                                    video_id: item.video_id || ''
                                  });
                                  setIsEditing(true);
                                  if (onEdit) onEdit(String(item.id));
                                }} className="text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/50 p-2 font-bold transition-all uppercase text-xs flex items-center justify-center mx-auto rounded-sm group/btn" title="EDIT RECORD">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover/btn:opacity-100"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                              </div>
                            </div>
                          );
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-[#080808] border-t border-amber-900/30 flex justify-between items-center text-[10px] uppercase font-bold text-amber-700 tracking-[0.2em]">
                <span>Status: Active</span>
                <span>Detected Signals: {totalRecords}</span>
              </div>
            </section>
          )}
        </div>
      </div>

      {displayMode === 'full' && (
        <div className="p-4 text-[10px] text-amber-900 text-center uppercase tracking-[0.6em] shrink-0 bg-[#050505] border-t border-amber-900/20 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          Sony Trinitron Service System // Debug Mode Active // All Records Mode
        </div>
      )}
    </div>
  );
}
```

#### File: ./src/components/RichTextInput.tsx
```text
import React, { useRef, useEffect } from 'react';
import { sanitizeHTML } from '../lib/sanitize.ts';

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  onFocus?: () => void;
  field: 'artista' | 'musica' | 'album' | 'direcao' | 'video_id';
}

const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, label, placeholder, onFocus, field }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Synchronize internal state with external value ONLY if different
  // to avoid cursor jumping issues
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      let content = sanitizeHTML(editorRef.current.innerHTML);
      
      // Auto-formatting logic:
      // We process the HTML to wrap specific patterns in <span style="font-weight: 400">
      let formatted = content;
      
      // 1. Wrap 「...」
      formatted = formatted.replace(/「(.*?)」/g, (match, p1) => {
        if (match.includes('font-weight: 400')) return match;
        return `<span style="font-weight: 400">「${p1}」</span>`;
      });
      
      // 2. Wrap ft., &, vs., , (for Artista/Direcao)
      if (field === 'artista' || field === 'direcao') {
        const patterns = ['ft.', '&amp;', 'vs.', ','];
        patterns.forEach(p => {
          const regex = new RegExp(`(?<!font-weight:\\s?400">)${p}`, 'g');
          formatted = formatted.replace(regex, `<span style="font-weight: 400">${p}</span>`);
        });
      }

      if (formatted !== content) {
        // Only update if changed to avoid cursor issues
        // Selection preservation is tricky, so we only do this on certain conditions 
        // or just accept that the user might see some jumps if they type exactly these characters.
      }
      
      onChange(formatted);
    }
  };

  const execCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  const insertVersionSymbols = () => {
    // Insert symbols 「 」 and place cursor inside
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const symbols = document.createTextNode('「」');
    range.deleteContents();
    range.insertNode(symbols);
    
    // Move cursor between the brackets
    range.setStart(symbols, 1);
    range.setEnd(symbols, 1);
    selection.removeAllRanges();
    selection.addRange(range);
    
    handleInput();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  return (
    <div className="group relative">
      <div className="flex justify-between items-end mb-1">
        <label className="text-xs text-amber-700 uppercase font-bold group-focus-within:text-amber-500 transition-colors">
          {label}
        </label>
        <div className="flex gap-1 bg-black border border-amber-900/30 rounded-t px-1 py-0.5 opacity-40 group-focus-within:opacity-100 transition-opacity">
          <button 
            type="button" 
            onClick={() => execCommand('bold')}
            className="w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-amber-500 hover:text-black rounded transition-colors"
            title="Bold (Ctrl+B)"
          >B</button>
          <button 
            type="button" 
            onClick={() => execCommand('italic')}
            className="w-5 h-5 flex items-center justify-center text-[10px] italic hover:bg-amber-500 hover:text-black rounded transition-colors"
            title="Italic (Ctrl+I)"
          >I</button>
          <button 
            type="button" 
            onClick={insertVersionSymbols}
            className="px-1 h-5 flex items-center justify-center text-[10px] hover:bg-amber-500 hover:text-black rounded transition-colors"
            title="Insert Version Brackets"
          >「」</button>
        </div>
      </div>
      
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={onFocus}
        className="w-full p-2 bg-black border border-amber-900/50 outline-none focus:border-amber-500 text-lg min-h-[44px] break-words rich-text-input"
        data-placeholder={placeholder}
      />
      
      <style>{`
        .rich-text-input:empty:before {
          content: attr(data-placeholder);
          color: rgba(217, 119, 6, 0.3);
          pointer-events: none;
        }
        
        /* Auto-formatting styles based on content */
        /* Note: Realistic auto-formatting usually requires complex observer-based DOM manipulation,
           but for these specific needs, we can handle it via the data storage/rendering layer or 
           CSS selectors if possible. Since we want specific parts of the text to be font-normal 
           even inside bold tags, we can use a small hack in the value provided to the component. */
      `}</style>
    </div>
  );
};

export default RichTextInput;
```

#### File: ./src/lib/sanitize.ts
```text
export const sanitizeHTML = (html: string): string => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const allowedTags = ['B', 'I', 'EM', 'STRONG', 'SPAN', 'DIV', 'P', 'BR'];
  const allowedAttributes = ['style'];
  
  const sanitizeNode = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (!allowedTags.includes(el.tagName)) {
        const fragment = document.createDocumentFragment();
        while (el.firstChild) fragment.appendChild(el.firstChild);
        el.parentNode?.replaceChild(fragment, el);
        return;
      }
      const attrs = el.attributes;
      for (let i = attrs.length - 1; i >= 0; i--) {
        const attr = attrs[i];
        if (!allowedAttributes.includes(attr.name)) {
          el.removeAttribute(attr.name);
        } else if (attr.name === 'style') {
          const styleVal = attr.value.replace(/\s/g, '');
          if (styleVal !== 'font-weight:400;' && styleVal !== 'font-weight:400') {
            el.removeAttribute('style');
          }
        }
      }
    }
  };

  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  const nodes = [];
  let currentNode;
  while ((currentNode = walker.nextNode())) {
    nodes.push(currentNode);
  }
  for (let i = nodes.length - 1; i >= 0; i--) {
    sanitizeNode(nodes[i]);
  }
  return doc.body.innerHTML;
};

export const decodeHTMLEntities = (text: string): string => {
  if (!text) return '';
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};
```

#### File: ./src/lib/supabase.ts
```text
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### File: ./src/main.tsx
```text
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import '../style.css'; 
import '../tv.css'; 

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

#### File: ./src/pages/Admin.tsx
```text
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel.tsx';

export default function Admin({ session }: { session: Session | null }) {
  const navigate = useNavigate();

  return (
    <div className="bg-black min-h-screen">
      <AdminPanel 
        session={session} 
        onClose={() => navigate('/')} 
      />
    </div>
  );
}
```

#### File: ./src/pages/Home.tsx
```text
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.ts';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel.tsx';
import { sanitizeHTML } from '../lib/sanitize.ts';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    creditsInterval: any;
  }
}

const ADMIN_UID = '6660f82c-5b54-4879-ab40-edbc6e482416';
const GROUPS_ORDER = ['UPLOADS', 'GENRES', 'ZONES', 'ERAS', 'OTHERS'];

const GROUP_ICONS: Record<string, string> = {
  'UPLOADS': '📼',
  'GENRES': '📻',
  'ZONES': '🌍',
  'ERAS': '⏳',
  'OTHERS': '📁'
};

const getThematicSetup = (name: string) => {
  const n = name.toUpperCase();
  if (n.includes('RIDE') || n.includes('DRIVE') || n.includes('SPEED') || n.includes('CAR')) return { theme: 'ride', bumpClass: 'bump-chrome', logo: '🏎️ SPEED' };
  if (n.includes('HIP') || n.includes('RAP') || n.includes('STREET') || n.includes('RHYMES')) return { theme: 'street', bumpClass: 'bump-urban', logo: '🖍️ STREET' };
  if (n.includes('ROCK') || n.includes('METAL') || n.includes('PUNK') || n.includes('NOISE')) return { theme: 'noise', bumpClass: 'bump-noise', logo: '🤘 RAW' };
  if (n.includes('TECH') || n.includes('DIGITAL') || n.includes('CYBER') || n.includes('UPLOAD')) return { theme: 'cyber', bumpClass: 'bump-cyber', logo: '📡 DATA' };
  return { theme: 'default', bumpClass: 'bump-noise', logo: '📺 TV' };
};

const fisherYatesShuffle = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export default function Home({ session }: { session: Session | null }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  type PlaylistItem = { name: string; group_name?: string; [key: string]: any };
  type VideoData = { id?: string | number; video_id: string; artista?: string; musica?: string; album?: string; ano?: string; direcao?: string; playlist?: string; [key: string]: any };

  // App State
  const [isOn, setIsOn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [channelsByCategory, setChannelsByCategory] = useState<Record<string, PlaylistItem[]>>({});
  const [currentChannelList, setCurrentChannelList] = useState<VideoData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentChannelName, setCurrentChannelName] = useState('');
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentVideoData, setCurrentVideoData] = useState<VideoData | null>(null);

  // UI State
  const [isBumping, setIsBumping] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showCredits, setShowCredits] = useState(false);
  const [showPlaylistLabel, setShowPlaylistLabel] = useState(false);
  const [time, setTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatic, setShowStatic] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('UPLOADS');
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);
  const [adminEditId, setAdminEditId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [lastSavedRecord, setLastSavedRecord] = useState<VideoData | null>(null);
  
  // Histórico de Sessão (Shuffle sem Repetição)
  const [playedHistory, setPlayedHistory] = useState<Record<string, string[]>>({});
  const playedHistoryRef = useRef<Record<string, string[]>>({});

  // REFS PARA CONTROLE DE API (NON-STOP)
  const playerRef = useRef<any>(null);
  const channelListRef = useRef<any[]>([]);
  const currentIndexRef = useRef(0);
  const lastVideoIdRef = useRef<string | null>(null);

  // Sincroniza as refs com o estado do React
  useEffect(() => {
    channelListRef.current = currentChannelList;
    currentIndexRef.current = currentIndex;
    playedHistoryRef.current = playedHistory;
  }, [currentChannelList, currentIndex, playedHistory]);

  useEffect(() => {
    if (session?.user?.id === ADMIN_UID) {
      setIsAdmin(true);
    }
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchGuideData();
    checkResumeState();

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('yt-player', {
        height: '100%', width: '100%',
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          enablejsapi: 1,
          showinfo: 0,
          disablekb: 1,
          fs: 0,
          autoplay: 1,
          origin: window.location.origin
        },
        events: {
          'onReady': () => { setIsReady(true); if (isOn) playCurrentVideo(); },
          'onStateChange': onPlayerStateChange,
          'onError': () => handleVideoEnd()
        }
      });
    };
  }, []);

  const onPlayerStateChange = (event: any) => {
    const YT_STATE = window.YT.PlayerState;
    if (event.data === YT_STATE.PLAYING) {
      setStatus("");
      startCreditsMonitor();
    } else if (event.data === YT_STATE.ENDED) {
      if (isAdminSidebarOpen && adminEditId) {
        console.log("LOOPING VIDEO (EDIT MODE)");
        playerRef.current?.seekTo(0);
        playerRef.current?.playVideo();
      } else {
        console.log("NON-STOP: VÍDEO ENCERRADO");
        handleVideoEnd();
      }
    } else if (event.data === YT_STATE.BUFFERING) {
      setStatus("TUNING...");
    }
  };

  const startCreditsMonitor = () => {
    if (window.creditsInterval) clearInterval(window.creditsInterval);
    window.creditsInterval = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
      const cur = playerRef.current.getCurrentTime();
      const dur = playerRef.current.getDuration();
      if (dur <= 0) return;

      setShowCredits((cur >= 10 && cur < 20) || (dur > 30 && cur >= (dur - 20) && cur < (dur - 10)));
      setShowPlaylistLabel(cur >= 1.5 && cur < dur);
    }, 1000);
  };

  const fetchGuideData = async () => {
    const { data } = await supabase.from('playlists').select('*').order('name');
    if (data) {
      const grouped = data.reduce((acc: any, curr: any) => {
        const g = curr.group_name || 'OTHERS';
        if (!acc[g]) acc[g] = [];
        acc[g].push(curr);
        return acc;
      }, {});
      setChannelsByCategory(grouped);
    }
  };

  const setStatus = (msg: string) => {
    setStatusMessage(msg);
    if (msg) setTimeout(() => setStatusMessage(''), 3000);
  };

  const checkResumeState = () => {
    const saved = localStorage.getItem('tv_resume_state');
    if (saved) {
      try {
        const { playlist, videoId } = JSON.parse(saved);
        localStorage.removeItem('tv_resume_state');
        setIsOn(true);
        loadChannelContent(playlist, videoId);
      } catch (e) {
        console.error("Resume state error:", e);
      }
    }
  };

  const togglePower = () => {
    setIsOn(prev => {
      const next = !prev;
      if (next) {
        if (!currentChannelName) loadDefaultChannel();
        else playerRef.current?.playVideo();
      } else {
        playerRef.current?.pauseVideo();
        setShowPlaylistLabel(false);
      }
      return next;
    });
  };

  const loadDefaultChannel = () => {
    const allPlaylists: string[] = [];
    Object.values(channelsByCategory).forEach((list: any) => {
      list.forEach((pl: any) => allPlaylists.push(pl.name));
    });
    if (allPlaylists.length > 0) {
      const randomPlaylist = allPlaylists[Math.floor(Math.random() * allPlaylists.length)];
      loadChannelContent(randomPlaylist);
    }
  };

  const triggerBump = (playlistName: string) => {
    if (isBumping || !isOn) return;
    setIsBumping(true);
    setTimeout(() => { setIsBumping(false); }, 1500);
  };

  const loadChannelContent = async (playlistName: string, targetId: string | null = null) => {
    setShowStatic(true);
    setTimeout(() => setShowStatic(false), 500);
    setCurrentChannelName(playlistName);
    triggerBump(playlistName);
    const cat = Object.keys(channelsByCategory).find(k => channelsByCategory[k].some((p: any) => p.name === playlistName));
    if (cat) {
      setCurrentGroupIndex(GROUPS_ORDER.indexOf(cat));
      setExpandedGroup(cat);
    }

    const { data } = await supabase.from('musicas_backup').select('*').eq('playlist', playlistName).order('id', { ascending: false });
    if (!data?.length) return;

    const list = targetId ? data : fisherYatesShuffle([...data]);
    let idx = targetId ? list.findIndex(v => v.video_id === targetId) : Math.floor(Math.random() * list.length);
    if (idx === -1) idx = 0;

    setCurrentChannelList(list);
    setCurrentIndex(idx);
    const video = list[idx];
    setCurrentVideoData(video);

    // Registra no histórico se for um novo canal ou vídeo
    if (video?.video_id) {
      setPlayedHistory(prev => {
        const history = prev[playlistName] || [];
        if (history.includes(video.video_id)) return prev;
        return { ...prev, [playlistName]: [...history, video.video_id] };
      });
    }
  };

  const handlePreview = async (videoId: string) => {
    if (!videoId) return;
    setStatus("PREVIEWING...");
    
    // Tenta achar nos dados já carregados para ter info completa
    const existing = currentChannelList.find(v => v.video_id === videoId);
    let nextData = existing;

    if (!existing) {
      // Se não achar, não assume unicidade. Busca a primeira ocorrência do vídeo.
      const { data } = await supabase.from('musicas_backup').select('*').eq('video_id', videoId).limit(1).maybeSingle();
      nextData = data || { video_id: videoId };
    }
    
    setCurrentVideoData({ ...nextData! }); // force fresh ref to trigger effect
    
    if (!isOn) setIsOn(true);
    
    if (isReady && playerRef.current) {
      // Force immediate reload ignoring cache check
      playerRef.current.loadVideoById({
        videoId: videoId,
        suggestedQuality: 'hd720'
      });
      lastVideoIdRef.current = videoId;
      playerRef.current.playVideo();
    }
  };

  // Efeito centralizado para carregar o vídeo sempre que o dado mudar
  useEffect(() => {
    if (currentVideoData?.video_id && isReady && playerRef.current) {
      if (currentVideoData.video_id !== lastVideoIdRef.current) {
        console.log("CARREGANDO NOVO VÍDEO:", currentVideoData.video_id);
        playerRef.current.loadVideoById({
          videoId: currentVideoData.video_id,
          suggestedQuality: 'hd720'
        });
        lastVideoIdRef.current = currentVideoData.video_id;
      }
      if (isOn) playerRef.current.playVideo();
    }
  }, [currentVideoData, isReady]);

  const playCurrentVideo = () => {
    if (currentChannelList[currentIndex] && isReady) {
      setCurrentVideoData(currentChannelList[currentIndex]);
    }
  };

  const handleVideoEnd = () => {
    const list = channelListRef.current;
    const currIdx = currentIndexRef.current;
    const history = playedHistoryRef.current[currentChannelName] || [];

    if (list.length === 0) return;

    // Lógica de Shuffle sem Repetição
    let available = list.filter(v => !history.includes(v.video_id));
    
    let nextIndex;
    let nextVideo;

    if (available.length > 0) {
      // Ainda há vídeos não tocados no ciclo
      const randIdx = Math.floor(Math.random() * available.length);
      nextVideo = available[randIdx];
      nextIndex = list.findIndex(v => v.video_id === nextVideo.video_id);
      console.log("SHUFFLE: Selecionando vídeo não tocado:", nextVideo.musica);
    } else {
      // Ciclo completo! Resetamos o histórico do canal
      console.log("SHUFFLE: Ciclo completo. Resetando histórico para:", currentChannelName);
      
      // Filtra para não repetir o mesmo vídeo imediatamente se houver mais de um
      const others = list.length > 1 ? list.filter((_, i) => i !== currIdx) : list;
      nextIndex = list.indexOf(others[Math.floor(Math.random() * others.length)]);
      nextVideo = list[nextIndex];

      // Limpa histórico e começa novo ciclo com o novo vídeo
      setPlayedHistory(prev => ({ ...prev, [currentChannelName]: [nextVideo.video_id] }));
      setCurrentIndex(nextIndex);
      setCurrentVideoData(nextVideo);
      triggerBump(currentChannelName);
      return;
    }

    // Atualiza estado e histórico
    setPlayedHistory(prev => ({
      ...prev,
      [currentChannelName]: [...(prev[currentChannelName] || []), nextVideo.video_id]
    }));
    
    setCurrentIndex(nextIndex);
    setCurrentVideoData(nextVideo);
    triggerBump(currentChannelName);
  };

  const changeGroup = (direction: number) => {
    if (!isOn) return;
    const nextGroupIdx = (currentGroupIndex + direction + GROUPS_ORDER.length) % GROUPS_ORDER.length;
    setCurrentGroupIndex(nextGroupIdx);
    const groupName = GROUPS_ORDER[nextGroupIdx];
    setStatus(`GROUP: ${groupName}`);
    setExpandedGroup(groupName);
    const playlists = channelsByCategory[groupName];
    if (playlists?.length) loadChannelContent(playlists[0].name);
  };

  const changeChannel = (direction: number) => {
    if (!isOn || !currentChannelName) return;
    const group = GROUPS_ORDER[currentGroupIndex];
    const playlists = channelsByCategory[group] || [];
    if (!playlists.length) return;
    let idx = playlists.findIndex((pl: any) => pl.name === currentChannelName);
    idx = (idx + direction + playlists.length) % playlists.length;
    loadChannelContent(playlists[idx].name);
  };

  const setupBump = getThematicSetup(currentChannelName);
  const playlistParts = currentChannelName.split(':');

  return (
    <div className={`bg-[#050505] min-h-screen overflow-x-hidden flex items-center justify-center selection:bg-yellow-400 selection:text-black font-sans transition-all duration-500 ${isSearchOpen ? 'guide-active overflow-hidden' : ''}`}>

      {/* Admin Panel Header moved down to follow TV */}

      <div className={`fixed inset-y-0 left-0 z-[100] w-full md:w-[400px] lg:w-[450px] teletext-bg flex flex-col shadow-[20px_0_60px_rgba(0,0,0,0.9)] border-r-4 border-white/10 transform ${isSearchOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-500 ease-in-out font-vt323 h-full`}>
        <div className="bg-black p-4 flex justify-between items-center border-b-2 border-white/20 shrink-0">
          <div className="flex flex-col leading-none">
            <span className="text-3xl font-bold text-white tracking-widest drop-shadow-[2px_2px_0_#000] font-jost"><span className="text-[#ffff00]">P</span><span className="text-[#00ff00]">100</span> GUIDE</span>
            <span className="text-xs text-gray-400 tracking-[0.2em] uppercase font-jost">playlistismo v19</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-white text-xl animate-pulse font-jost"><span>{time || '00:00'}</span></div>
            <button onClick={() => setIsSearchOpen(false)} className="bg-red-600 hover:bg-red-500 text-white w-10 h-10 flex items-center justify-center border-2 border-white shadow-[4px_4px_0_#000] transition-colors active:translate-y-1 active:shadow-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
          {currentVideoData && (
            <div className="bg-[#111] border-2 border-white/30 p-4 mb-6 shrink-0 shadow-[8px_8px_0_rgba(0,0,0,1)] font-jost relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-green-400 via-cyan-400 via-pink-400 to-orange-500"></div>
              <div className="space-y-3">
                {currentVideoData.artista && <div className="flex gap-3 items-center group"><span className="text-2xl drop-shadow-[2px_2px_0_#000] shrink-0">🎤</span><div className="flex flex-col overflow-hidden w-full"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">ARTIST</span><div className="text-[#ffff00] text-xl font-bold uppercase truncate" dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.artista) }} /></div></div>}
                {currentVideoData.musica && <div className="flex gap-3 items-center group"><span className="text-2xl drop-shadow-[2px_2px_0_#000] shrink-0">🎼</span><div className="flex flex-col overflow-hidden w-full"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">TRACK</span><div className="text-[#00ff00] text-xl font-bold uppercase truncate" dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.musica) }} /></div></div>}
                {currentVideoData.album && <div className="flex gap-3 items-center group"><span className="text-2xl drop-shadow-[2px_2px_0_#000] shrink-0">💽</span><div className="flex flex-col overflow-hidden w-full"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">ALBUM</span><div className="text-[#00ffff] text-base font-bold uppercase truncate" dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.album) }} /></div></div>}
                {currentVideoData.ano && <div className="flex gap-3 items-center group"><span className="text-2xl drop-shadow-[2px_2px_0_#000] shrink-0">📅</span><div className="flex flex-col overflow-hidden w-full"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">RELEASE</span><div className="text-[#ff00ff] text-base font-bold uppercase truncate" dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.ano) }} /></div></div>}
                {currentVideoData.direcao && <div className="flex gap-3 items-center group"><span className="text-2xl drop-shadow-[2px_2px_0_#000] shrink-0">🎬</span><div className="flex flex-col overflow-hidden w-full"><span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest leading-none mb-1">DIRECTOR</span><div className="text-[#ff8800] text-base font-bold uppercase truncate" dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.direcao) }} /></div></div>}
              </div>
              <div className="mt-4 text-white/40 text-[10px] uppercase tracking-tighter border-t border-white/10 pt-2 italic text-right">CHANNEL: {currentChannelName}</div>
            </div>
          )}
          <div className="relative bg-black border-2 border-[#ffff00] p-2 mb-4 flex items-center shrink-0">
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent text-white text-2xl uppercase outline-none font-vt323 placeholder-white/30" placeholder="BUSCAR..." />
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pr-1 pb-10 accordion-container">
            {GROUPS_ORDER.map(cat => {
              const groupPlaylists = (channelsByCategory[cat] || []).filter(pl => pl.name.toUpperCase().includes(searchTerm.toUpperCase()));
              if (groupPlaylists.length === 0 && searchTerm) return null;
              const isExpanded = searchTerm ? true : expandedGroup === cat;
              return (
                <div key={cat} className="guide-group mb-2 overflow-hidden rounded-[8px] border border-white/10 bg-[#0a0a0a] shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                  <button
                    onClick={() => setExpandedGroup(expandedGroup === cat ? null : cat)}
                    className={`w-full flex justify-between items-center p-3 text-white font-bold uppercase text-lg transition-colors focus:outline-none ${isExpanded ? 'bg-[#0000aa] border-b border-white/20' : 'hover:bg-[#1a1a1a]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl drop-shadow-[2px_2px_0_#000]">{GROUP_ICONS[cat] || '▶'}</span>
                      <span className="tracking-widest">{cat}</span>
                    </div>
                    <span className="text-sm border border-white/30 rounded px-2 opacity-80">{isExpanded ? '▲' : '▼'}</span>
                  </button>
                  {isExpanded && (
                    <div className="guide-cat-content flex flex-col bg-black/40 pb-1">
                      {groupPlaylists.map(pl => {
                        const isPlaying = pl.name === currentChannelName;
                        return (
                          <button
                            key={pl.name}
                            onClick={() => { loadChannelContent(pl.name); setIsSearchOpen(false); }}
                            className={`w-full text-left p-3 px-6 uppercase text-sm font-vt323 transition-all border-b border-white/5 flex items-center justify-between group
                                ${isPlaying ? 'bg-[#ffff00] text-[#0000aa] font-black pl-8' : 'text-gray-300 hover:bg-[#111] hover:text-white hover:pl-8'}`}
                          >
                            <div className="flex-1 truncate tracking-widest">{pl.name}</div>
                            {isPlaying && <span className="text-xs animate-pulse ml-2 flex items-center gap-1"><div className="w-2 h-2 bg-[#0000aa] rounded-full"></div> PLAYING</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Admin Panel is now integrated into the main tripartite layout */}

      <main className={`relative z-10 w-full min-h-screen flex flex-col md:grid transition-all duration-500 ease-in-out ${isAdminSidebarOpen ? 'layout-admin-open md:grid-cols-[auto_1fr_auto]' : 'layout-admin-closed md:grid-cols-[0px_1fr_0px] overflow-hidden'}`}>
        
        {/* LEFT PANEL: FORM INTEGRATION */}
        <aside className={`hidden md:flex overflow-hidden transition-all duration-500 ease-in-out border-r border-amber-900/20 bg-black/40 backdrop-blur-md ${isAdminSidebarOpen ? 'translate-x-0 opacity-100 w-auto' : '-translate-x-full opacity-0 w-0'}`}>
          <div className="w-[400px] h-full">
            {isAdminSidebarOpen && (
              <AdminPanel
                session={session}
                editId={adminEditId}
                displayMode="form"
                onClose={() => setIsAdminSidebarOpen(false)}
                onSave={(newData) => {
                  fetchGuideData();
                  if (newData) {
                    const savedIdStr = String(newData.id);
                    setLastSavedRecord(newData as VideoData);
                    
                    // Update currentVideoData if it's the one being edited
                    if (newData.video_id && newData.video_id === currentVideoData?.video_id) {
                      console.log("ATUALIZANDO CRÉDITOS IMEDIATAMENTE (POR VIDEO_ID)");
                      setCurrentVideoData({ ...currentVideoData, ...(newData as VideoData) });
                    } else if (!newData.video_id && savedIdStr === String(currentVideoData?.id)) {
                      console.log("ATUALIZANDO CRÉDITOS IMEDIATAMENTE (POR ID)");
                      setCurrentVideoData({ ...currentVideoData, ...(newData as VideoData) });
                    }
                    
                    // Synchronize currentChannelList to avoid stale data
                    setCurrentChannelList(prev => prev.map(item => {
                      if (newData.video_id && item.video_id === newData.video_id) return { ...item, ...(newData as VideoData) };
                      if (!newData.video_id && String(item.id) === savedIdStr) return { ...item, ...(newData as VideoData) };
                      return item;
                    }));

                    setAdminEditId(null);
                  }
                }}
                onRestartPlayer={() => {
                  console.log("RESTARTING PLAYER ON SAVE");
                  playerRef.current?.seekTo(0);
                  playerRef.current?.playVideo();
                }}
                onPreview={handlePreview}
              />
            )}
          </div>
        </aside>

        {/* MIDDLE PANEL: TV & CONTROLS */}
        <section className={`flex flex-col items-center justify-center p-4 transition-all duration-500 w-full ${isAdminSidebarOpen ? 'max-w-none' : 'max-w-[1200px] mx-auto'} ${isSearchOpen ? 'md:translate-x-[200px] scale-[0.85] md:scale-95' : ''}`}>
          
          {/* Centralized Admin Buttons */}
          <div id="admin-panel-controls" className={`mb-8 flex flex-wrap gap-4 items-center justify-center w-full ${isAdminSidebarOpen ? 'max-w-none' : 'max-w-[800px]'}`}>
            {!session && (
              <button onClick={() => navigate('/login')} className="bg-zinc-900/20 text-zinc-500 border border-zinc-600/50 px-4 py-2 font-vt323 text-xl tracking-widest hover:bg-zinc-600 hover:text-white transition-all uppercase shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-sm flex items-center gap-2 opacity-50 hover:opacity-100">🔑 LOGIN</button>
            )}
            {isAdmin && (
              <>
                <button 
                  onClick={() => { 
                    const newState = !isAdminSidebarOpen || adminEditId !== null;
                    setAdminEditId(null); 
                    setIsAdminSidebarOpen(newState); 
                  }} 
                  className={`min-w-[180px] px-6 py-3 font-vt323 text-2xl tracking-widest transition-all uppercase backdrop-blur-sm flex items-center justify-center gap-2 border shadow-lg rounded-sm ${!adminEditId && isAdminSidebarOpen ? 'bg-amber-600 text-black border-amber-400 scale-105 shadow-[0_0_20px_rgba(217,119,6,0.4)]' : 'bg-amber-900/40 text-amber-500 border-amber-600/50 hover:bg-amber-600 hover:text-black hover:border-amber-400'}`}
                >
                  ⚙ SERVICE MODE
                </button>
                <button 
                  onClick={() => { 
                    const newState = !isAdminSidebarOpen || adminEditId === null;
                    setAdminEditId(currentVideoData?.id ? String(currentVideoData.id) : null); 
                    setIsAdminSidebarOpen(newState); 
                  }} 
                  className={`min-w-[180px] px-6 py-3 font-vt323 text-2xl tracking-widest transition-all uppercase backdrop-blur-sm flex items-center justify-center gap-2 border shadow-lg rounded-sm ${adminEditId && isAdminSidebarOpen ? 'bg-amber-600 text-black border-amber-400 scale-105 shadow-[0_0_20px_rgba(217,119,6,0.4)]' : 'bg-amber-900/40 text-amber-500 border-amber-600/50 hover:bg-amber-600 hover:text-black hover:border-amber-400'}`}
                >
                  ✎ EDIT VIDEO
                </button>
              </>
            )}
          </div>

          <div className={`relative w-full ${isAdminSidebarOpen ? 'max-w-full px-4 mx-0' : 'max-w-[1000px] mx-auto'} tv-responsive-container flex flex-col transition-all duration-500 ease-out cursor-pointer`} onClick={() => setIsSearchOpen(false)}>
          <div className="relative w-full transition-all duration-500 md:perspective-[1500px] group">
            <div className="relative bg-[#181818] texture-plastic rounded-[20px] md:rounded-[32px] p-3 md:p-6 pb-6 md:pb-8 shadow-[0_30px_70px_rgba(0,0,0,0.8),inset_0_2px_3px_rgba(255,255,255,0.15)] border-t border-[#333] md:tv-3d-tilt transform-style-3d z-10 flex flex-col">

              <div className="flex flex-row bg-[#111] rounded-[16px] md:rounded-[36px] p-2 md:p-5 shadow-[inset_0_0_25px_rgba(0,0,0,1)] border-b-4 border-r-4 border-[#080808] border-t border-l border-[#222]">
                <div className="hidden md:flex flex-col justify-center w-10 mr-3 space-y-0.5 opacity-50 shrink-0">
                  {Array.from({ length: 40 }).map((_, i) => <div key={i} className="w-full h-px bg-black/50" />)}
                </div>

                <div className="relative flex-1 aspect-[4/3] bg-[#050505] rounded-[24px] md:rounded-[48px] overflow-hidden screen-container border-[4px] md:border-[8px] border-[#080808] z-10 box-content">
                  <div className="absolute inset-0 crt-overlay z-40 rounded-[24px] md:rounded-[48px] pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.6)]"></div>

                  {!isOn && <div className="absolute inset-0 bg-[#080808] z-20"></div>}

                  <div className={`relative w-full h-full rounded-[20px] md:rounded-[44px] overflow-hidden bg-black ${isOn ? 'crt-turn-on' : ''}`}>
                    <div id="yt-player" className="w-full h-full"></div>

                    {isBumping && (
                      <div className="absolute inset-0 z-[70] flex items-center justify-center bg-transparent pointer-events-none overflow-hidden bump-active">
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className={`bump-ident ${setupBump.bumpClass}`}>
                            <div className="text-[clamp(1rem,3vmin,1.5rem)] opacity-60 mb-6 font-vt323 tracking-widest">{setupBump.logo}</div>
                            <div className="main-title font-black uppercase tracking-tighter">{playlistParts.length > 1 ? playlistParts[1].trim() : playlistParts[0].trim()}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {showStatic && <div className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-100 bg-repeat active"></div>}

                    <div className="absolute inset-0 z-[60] pointer-events-none" style={{ opacity: isOn ? 1 : 0 }}>
                      <div className="absolute top-4 right-6 text-right">
                        {showPlaylistLabel && (
                          <div className={`osd-futuristic visible ${setupBump.bumpClass} ${currentChannelName.length > 20 ? 'osd-compact' : ''}`}>
                            {playlistParts.length > 1 ? (
                              <><div className="osd-line-1">{playlistParts[0].trim()}:</div><div className="osd-line-2">{playlistParts[1].trim()}</div></>
                            ) : (
                              <div className="osd-line-1">{currentChannelName}</div>
                            )}
                          </div>
                        )}
                      </div>
                      {statusMessage && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center">
                          <div className="inline-block text-[#00ff00] font-pixel text-xs md:text-xl bg-black/90 px-4 py-3 border-2 border-[#00ff00] uppercase tracking-widest shadow-[0_0_15px_#00ff00]">{statusMessage}</div>
                        </div>
                      )}
                    </div>

                    <div className={`credits-overlay ${showCredits ? 'visible' : ''} credits-3d-shadow`}>
                      {currentVideoData?.artista && <div className="credit-line"><span className="icon">🎤</span> <div className="credit-text-content"><span dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.artista) }} /></div></div>}
                      {currentVideoData?.musica && <div className="credit-line"><span className="icon">🎼</span> <div className="credit-text-content"><span dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.musica) }} /></div></div>}
                      {currentVideoData?.album && <div className="credit-line"><span className="icon">💽</span> <div className="credit-text-content"><span dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.album) }} /></div></div>}
                      {currentVideoData?.ano && <div className="credit-line"><span className="icon">📅</span> <div className="credit-text-content"><span dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.ano) }} /></div></div>}
                      {currentVideoData?.direcao && <div className="credit-line"><span className="icon">🎬</span> <div className="credit-text-content"><span dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentVideoData.direcao || '—') }} /></div></div>}
                    </div>

                    <div className="vhs-noise z-40 mix-blend-overlay pointer-events-none"></div>
                    <div className="vhs-tracking z-40 pointer-events-none"></div>
                    <div className="absolute inset-0 scanlines pointer-events-none z-50 opacity-60"></div>
                  </div>
                </div>

                <div className="flex flex-col w-16 md:w-32 ml-4 p-2 md:p-3 bg-[#111] border-l border-[#222] shadow-[inset_2px_0_5px_rgba(0,0,0,0.5)] justify-between items-center gap-4 shrink-0 rounded-r-lg">
                  <div className="flex flex-col items-center select-none opacity-80 mb-2">
                    <span className="font-serif italic font-bold text-[#bbb] text-[8px] md:text-sm drop-shadow-[1px_1px_0_rgba(0,0,0,1)] tracking-tight uppercase vertical-text">playlist<span className="text-[#888]">ismo</span></span>
                  </div>

                  <div className="flex flex-col items-center gap-4 md:gap-6">
                    <div className="flex flex-col items-center">
                      <span className="text-[6px] text-gray-500 font-bold tracking-widest mb-1 uppercase">Guide</span>
                      <button onClick={(e) => { e.stopPropagation(); setIsSearchOpen(!isSearchOpen); }} className="btn-retro-push w-10 h-8 md:w-14 md:h-12 rounded-sm flex items-center justify-center group relative">
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                      </button>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[6px] text-gray-500 font-bold tracking-widest mb-1 uppercase">Grp</span>
                      <div className="flex flex-col gap-2">
                        <button onClick={(e) => { e.stopPropagation(); changeGroup(1); }} className="btn-retro-push w-8 h-8 md:w-12 md:h-12 rounded-sm flex justify-center items-center text-gray-400 font-bold hover:text-white">+</button>
                        <button onClick={(e) => { e.stopPropagation(); changeGroup(-1); }} className="btn-retro-push w-8 h-8 md:w-12 md:h-12 rounded-sm flex justify-center items-center text-gray-400 font-bold hover:text-white">-</button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[6px] text-gray-500 font-bold tracking-widest mb-1 uppercase">Ch</span>
                      <div className="flex flex-col gap-2">
                        <button onClick={(e) => { e.stopPropagation(); changeChannel(1); }} className="btn-retro-push w-8 h-8 md:w-12 md:h-12 rounded-sm flex justify-center items-center group">
                          <svg className="w-3 h-3 text-gray-400 group-hover:text-white -rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M13 19l9-7-9-7v14zM4 19l9-7-9-7v14z" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); changeChannel(-1); }} className="btn-retro-push w-8 h-8 md:w-12 md:h-12 rounded-sm flex justify-center items-center group">
                          <svg className="w-3 h-3 text-gray-400 group-hover:text-white rotate-90" fill="currentColor" viewBox="0 0 24 24"><path d="M13 19l9-7-9-7v14zM4 19l9-7-9-7v14z" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col items-center gap-3 pb-2">
                    <div className="flex flex-col items-center">
                      <div className={`w-1.5 h-1.5 rounded-full border border-black transition-all duration-300 ${isOn ? 'bg-red-500 shadow-[0_0_8px_#ff0000] saturate-200' : 'bg-red-900 shadow-[0_0_2px_black]'}`}></div>
                      <span className="text-[6px] text-gray-500 mt-1 font-bold uppercase">Pwr</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); togglePower(); }} className="btn-power-push w-10 h-10 md:w-14 md:h-14 rounded-sm flex items-center justify-center group">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

          <div className="mt-8 text-center opacity-20 hover:opacity-100 transition-opacity duration-500 pointer-events-none select-none">
            <span className="font-vt323 text-sm md:text-base text-white tracking-widest uppercase">powered by @addri0n4 e @sandrobreaker</span>
          </div>
        </section>

        {/* RIGHT PANEL: TABLE INTEGRATION */}
        <aside className={`hidden md:flex justify-start overflow-hidden transition-all duration-500 ease-in-out border-l border-amber-900/20 bg-black/40 backdrop-blur-md ${isAdminSidebarOpen ? 'translate-x-0 opacity-100 w-auto' : 'translate-x-full opacity-0 w-0'}`}>
          <div className="w-[550px] h-full">
            {isAdminSidebarOpen && (
              <AdminPanel
                session={session}
                editId={adminEditId}
                displayMode="table"
                onEdit={(id) => setAdminEditId(id)}
                onClose={() => setIsAdminSidebarOpen(false)}
                playingId={currentVideoData?.id ? String(currentVideoData.id) : null}
                initialPlaylist={currentChannelName}
                onSave={(newData) => {
                  fetchGuideData();
                  if (newData) {
                    const savedIdStr = String(newData.id);
                    setLastSavedRecord(newData as VideoData);
                    
                    // Update currentVideoData if it's the one being edited
                    if (newData.video_id && newData.video_id === currentVideoData?.video_id) {
                      console.log("ATUALIZANDO CRÉDITOS IMEDIATAMENTE (POR VIDEO_ID - TABELA)");
                      setCurrentVideoData({ ...currentVideoData, ...(newData as VideoData) });
                    } else if (!newData.video_id && savedIdStr === String(currentVideoData?.id)) {
                      console.log("ATUALIZANDO CRÉDITOS IMEDIATAMENTE (POR ID - TABELA)");
                      setCurrentVideoData({ ...currentVideoData, ...(newData as VideoData) });
                    }
                    
                    // Synchronize currentChannelList to avoid stale data
                    setCurrentChannelList(prev => prev.map(item => {
                      if (newData.video_id && item.video_id === newData.video_id) return { ...item, ...(newData as VideoData) };
                      if (!newData.video_id && String(item.id) === savedIdStr) return { ...item, ...(newData as VideoData) };
                      return item;
                    }));

                    setAdminEditId(null);
                  }
                }}
                lastSavedRecord={lastSavedRecord as any}
              />
            )}
          </div>
        </aside>

      </main>
    </div>
  );
}
```

#### File: ./src/pages/Login.tsx
```text
import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase.ts';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setMessage({ text: `ERROR: ${error.message}`, isError: true });
      setLoading(false);
    } else {
      setMessage({ text: "SIGNAL LOCKED. REDIRECTING...", isError: false });
      setTimeout(() => navigate('/'), 1000);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage({ text: `FAILED: ${error.message}`, isError: true });
      setLoading(false);
    } else {
      setMessage({ text: "SUCCESS! CHECK EMAIL OR LOGIN.", isError: false });
      setTimeout(() => {
        setIsLoginView(true);
        setMessage({ text: "ACCOUNT CREATED. PLEASE LOGIN.", isError: false });
        setLoading(false);
      }, 1500);
    }
  };

  const handleGithubLogin = async () => {
    setLoading(true);
    setMessage({ text: "REDIRECTING...", isError: false });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin }
    });

    if (error) {
      setMessage({ text: `GITHUB ERROR: ${error.message}`, isError: true });
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen flex items-center justify-center font-jost overflow-hidden selection:bg-red-900 selection:text-white relative">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at center, #ff0000 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <main className="w-full max-w-md bg-[#111] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,1)] relative z-10 rounded-lg overflow-hidden backdrop-blur-sm">
        <div className="bg-black p-6 border-b border-white/5 flex flex-col items-center">
          <h1 className="text-3xl font-bold tracking-[0.2em] font-vt323 text-white drop-shadow-[2px_2px_0_#ff0000] uppercase">
            playlist<span className="text-[#888]">ismo</span>
          </h1>
          <p className="text-[10px] text-gray-500 tracking-[0.3em] mt-1 uppercase">Authentication Protocol</p>
        </div>

        <div className="p-8">
          {message.text && (
            <div className={`mb-6 p-3 text-center text-xs font-bold tracking-widest uppercase border ${message.isError ? 'bg-red-900/80 border-red-500 text-white' : 'bg-green-900/80 border-green-500 text-white'}`}>
              {message.text}
            </div>
          )}

          {isLoginView ? (
            <div id="view-login" className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate('/')} className="w-full py-4 bg-black border border-white/20 text-white hover:bg-white/5 hover:border-white transition-all duration-300 font-bold tracking-widest text-sm uppercase flex items-center justify-center gap-3 group">
                  <span className="text-xl group-hover:scale-125 transition-transform duration-300">📺</span> PROCEED AS GUEST
                </button>
                <div className="flex items-center gap-4 text-xs font-bold text-gray-600 uppercase tracking-widest my-2">
                  <div className="h-[1px] bg-white/10 flex-1"></div><span>OR INITIALIZE OAUTH</span><div className="h-[1px] bg-white/10 flex-1"></div>
                </div>
                <button onClick={handleGithubLogin} disabled={loading} className="w-full py-4 bg-black border border-white/20 text-white hover:border-[#6e5494] hover:shadow-[0_0_15px_rgba(110,84,148,0.5)] transition-all duration-300 font-bold tracking-widest text-sm uppercase flex items-center justify-center gap-3">
                  <span className="text-xl">👾</span> ACCESS VIA GITHUB
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-gray-600 uppercase tracking-widest my-6">
                <div className="h-[1px] bg-white/10 flex-1"></div><span>OR OVERRIDE DIRECTLY</span><div className="h-[1px] bg-white/10 flex-1"></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Email Coordinates</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-black border border-white/20 p-3 text-white outline-none focus:border-red-500 transition-colors font-mono text-sm placeholder-white/20" placeholder="admin@domain.com" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Security Code</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-black border border-white/20 p-3 text-white outline-none focus:border-red-500 transition-colors font-mono text-sm tracking-widest" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-red-900/80 text-white border border-red-500 hover:bg-red-500 hover:text-black font-bold tracking-widest text-sm uppercase transition-all duration-300">
                  {loading ? 'TUNING IN...' : 'CONNECT SERVICE'}
                </button>
              </form>
              <div className="text-center mt-6">
                <button type="button" onClick={() => setIsLoginView(false)} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest underline decoration-white/30 underline-offset-4 transition-colors">
                  NEW UNIT? INITIALIZE REGISTRATION
                </button>
              </div>
            </div>
          ) : (
            <div id="view-register" className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
              <div className="text-center mb-6">
                <h2 className="text-white text-xl font-vt323 tracking-widest uppercase">Register New Unit</h2>
                <div className="w-12 h-1 bg-red-500 mx-auto mt-2"></div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Assigned Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-black border border-white/20 p-3 text-white outline-none focus:border-red-500 transition-colors font-mono text-sm placeholder-white/20" placeholder="user@domain.com" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Create Security Code</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-black border border-white/20 p-3 text-white outline-none focus:border-red-500 transition-colors font-mono text-sm tracking-widest" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-[#111] border border-white/30 text-white font-bold tracking-widest text-sm uppercase hover:border-white hover:bg-white hover:text-black transition-all duration-300">
                  {loading ? 'ACTIVATING...' : 'ACTIVATE ACCOUNT'}
                </button>
              </form>
              <div className="text-center mt-6">
                <button type="button" onClick={() => setIsLoginView(true)} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest underline decoration-white/30 underline-offset-4 transition-colors">
                  RETURN TO LOGIN PROTOCOL
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```

#### File: ./src/pages/Tv.tsx
```text
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

const ADMIN_UID = '6660f82c-5b54-4879-ab40-edbc6e482416';

type TvState = {
  isOn: boolean;
  mode: 'OFF' | 'BLUE_SCREEN' | 'VIDEO' | 'IMAGE';
  currentImage: string | null;
  originalImage: string | null;
  videoSrc: string | null;
  isProcessing: boolean;
  statusMessage: string;
};

export default function Tv({ session }: { session: Session | null }) {
  const navigate = useNavigate();
  const [tvState, setTvState] = useState<TvState>({
    isOn: false,
    mode: 'OFF',
    currentImage: null,
    originalImage: null,
    videoSrc: null,
    isProcessing: false,
    statusMessage: '',
  });

  const [time, setTime] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (tvState.mode === 'VIDEO' && tvState.videoSrc && videoRef.current) {
      videoRef.current.play().catch(e => console.log('Autoplay blocked', e));
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [tvState.mode, tvState.videoSrc]);

  const setStatus = (msg: string) => {
    setTvState(prev => ({ ...prev, statusMessage: msg }));
  };

  const clearStatus = () => {
    setTvState(prev => ({ ...prev, statusMessage: '' }));
  };

  const togglePower = () => {
    if (tvState.isOn) {
      setTvState(prev => ({ ...prev, isOn: false, mode: 'OFF', isProcessing: false }));
      clearStatus();
    } else {
      setTvState(prev => ({ ...prev, isOn: true, mode: 'BLUE_SCREEN', isProcessing: false }));
      setStatus("INITIALIZING...");
      setTimeout(() => setStatus("READY"), 1500);
      setTimeout(clearStatus, 2500);
    }
  };

  const handleUploadClick = () => {
    if (tvState.isOn && !tvState.isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        setTvState(prev => ({
          ...prev,
          originalImage: result,
          currentImage: result,
          videoSrc: null,
          mode: 'IMAGE',
        }));
        setStatus("IMAGE LOADED");
        setTimeout(clearStatus, 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    if (!tvState.isOn || tvState.isProcessing) return;
    
    if (tvState.mode === 'VIDEO') {
      setTvState(prev => ({ ...prev, mode: 'BLUE_SCREEN', videoSrc: null }));
      setStatus("EJECT");
    } else if (tvState.mode === 'IMAGE' && tvState.originalImage) {
      setTvState(prev => ({ ...prev, currentImage: prev.originalImage }));
      setStatus("RESET OK");
    }
    setTimeout(clearStatus, 1500);
  };

  return (
    <div className="bg-[#111] min-h-screen overflow-x-hidden flex flex-col items-center justify-center p-4 selection:bg-green-500 selection:text-black font-vt323">
      <div id="top-controls" className="fixed top-4 right-4 z-[9990] flex gap-2">
        {!session && (
          <button onClick={() => navigate('/login')} className="bg-zinc-900/20 text-zinc-500 border border-zinc-600/50 px-3 py-1 font-vt323 text-lg tracking-widest hover:bg-zinc-600 hover:text-white transition-colors uppercase shadow-[0_0_10px_rgba(255,255,255,0.1)] backdrop-blur-sm flex items-center gap-2 opacity-50 hover:opacity-100">🔑 LOGIN</button>
        )}
        {session?.user?.id === ADMIN_UID && (
          <button onClick={() => navigate('/admin')} className="bg-amber-900/20 text-amber-500 border border-amber-600/50 px-3 py-1 font-vt323 text-lg tracking-widest hover:bg-amber-600 hover:text-black transition-colors uppercase shadow-[0_0_10px_rgba(217,119,6,0.2)] backdrop-blur-sm flex items-center gap-2">⚙ SERVICE MODE</button>
        )}
      </div>
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] pointer-events-none">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(#444 2px, transparent 2px)", backgroundSize: "30px 30px" }}></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center justify-center pt-10 md:pt-4">
        
        {/* TV UNIT */}
        <div className="relative w-full tv-responsive-container transition-transform duration-500 perspective-[1500px] group mb-16 md:mb-0">
          <div className="relative bg-[#1a1a1a] texture-plastic rounded-[24px] p-6 md:p-8 pb-10 md:pb-12 shadow-[0_30px_60px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.15)] border-t border-[#333] tv-3d-tilt transform-style-3d">
            <div className="absolute inset-0 bg-[#111] translate-z-back rounded-[20px] z-[-1] shadow-2xl"></div>
            
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3/4 h-6 flex justify-center space-x-1 opacity-30 rotate-x-20">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="w-1 h-full bg-black rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,1)] mx-[1px]"></div>
              ))}
            </div>

            <div className="flex bg-[#111] rounded-[2.5rem] p-6 shadow-[inset_0_0_20px_rgba(0,0,0,1)] border-b-8 border-r-8 border-[#050505] border-t border-l border-[#222]">
              <div className="hidden md:flex flex-col justify-center w-12 mr-3 space-y-0.5 opacity-60">
                {Array.from({ length: 36 }).map((_, i) => <div key={`ls-${i}`} className="w-full h-[2px] bg-[#050505]"></div>)}
              </div>

              <div className="relative flex-1 aspect-[4/3] bg-[#050505] rounded-[3rem] overflow-hidden screen-container border-[4px] border-[#080808] z-10">
                <div className="absolute inset-0 z-50 rounded-[3rem] shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] pointer-events-none"></div>
                <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-white/10 to-transparent rounded-t-[3rem] z-50 pointer-events-none opacity-40"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.4)_100%)] z-40 pointer-events-none"></div>

                {!tvState.isOn && (
                  <div className="absolute inset-0 bg-[#020202] flex items-center justify-center z-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-30 pointer-events-none"></div>
                  </div>
                )}

                {tvState.isOn && (
                  <div className="relative w-full h-full crt-flicker rounded-[2rem] overflow-hidden bg-black scale-[1.02]">
                    <video ref={videoRef} playsInline loop className={`w-full h-full object-cover vhs-filter pointer-events-auto ${tvState.mode === 'VIDEO' ? '' : 'hidden'}`} />
                    <img src={tvState.currentImage || ''} className={`w-full h-full object-cover vhs-filter ${tvState.mode === 'IMAGE' ? '' : 'hidden'}`} alt="TV Content" />

                    {tvState.mode === 'BLUE_SCREEN' && (
                      <div className="w-full h-full bg-[#0000aa] flex flex-col items-center justify-center text-white/90">
                        <div className="text-4xl md:text-6xl font-mono mb-4 text-center vhs-text-shadow font-bold">VIDEO 1</div>
                        <div className="vhs-text-shadow text-xl animate-pulse tracking-widest">AUTO TRACKING</div>
                      </div>
                    )}

                    <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-8 pointer-events-none font-mono text-white/80">
                      <div className="flex justify-between items-start">
                        <div className="vhs-text-shadow text-3xl md:text-5xl tracking-widest uppercase font-bold text-green-500/80 drop-shadow-md">PLAY ►</div>
                        <div className="vhs-text-shadow text-xl md:text-2xl">CH 03</div>
                      </div>
                      <div className="flex justify-between items-end vhs-text-shadow text-xl md:text-2xl">
                        <span>SP</span>
                        <div className="flex flex-col items-end">
                          <span>{time || '00:00 AM'}</span>
                          <span className="tracking-wider text-lg">JUL 04 1996</span>
                        </div>
                      </div>
                    </div>

                    {tvState.statusMessage && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-full text-center pointer-events-none">
                        <div className="inline-block text-[#00ff00] font-pixel text-xl md:text-3xl bg-black/80 px-6 py-3 border-y-2 border-[#00ff00]/50 tracking-widest uppercase shadow-lg backdrop-blur-sm transform rotate-1">
                          {tvState.statusMessage}
                        </div>
                      </div>
                    )}

                    <div className="vhs-noise z-10 mix-blend-overlay pointer-events-none"></div>
                    <div className="vhs-tracking z-10 pointer-events-none"></div>
                    <div className="absolute inset-0 scanlines pointer-events-none z-40 opacity-40"></div>
                  </div>
                )}
              </div>

              <div className="hidden md:flex flex-col justify-center w-12 ml-3 space-y-0.5 opacity-60">
                {Array.from({ length: 36 }).map((_, i) => <div key={`rs-${i}`} className="w-full h-[2px] bg-[#050505]"></div>)}
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center px-10 relative">
              <div className="flex flex-col items-start group cursor-default">
                <div className="flex space-x-0.5 mb-1 opacity-80">
                  <div className="w-3 h-1 bg-red-600 rounded-sm"></div>
                  <div className="w-3 h-1 bg-green-600 rounded-sm"></div>
                  <div className="w-3 h-1 bg-blue-600 rounded-sm"></div>
                </div>
                <span className="font-serif italic font-bold text-[#aaa] tracking-wider text-xl drop-shadow-[1px_1px_0_rgba(0,0,0,1)] font-sans">Playli<span className="text-[#888]">trinitron</span></span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center font-sans tracking-widest">
                  <div className={`w-2 h-2 rounded-full border border-black transition-all duration-300 ${tvState.isOn ? 'bg-red-500 shadow-[0_0_8px_#ff0000] saturate-200' : 'bg-red-900'}`}></div>
                  <span className="text-[8px] text-gray-500 mt-1 font-bold">POWER</span>
                </div>
                <button onClick={togglePower} className="w-10 h-10 rounded bg-[#1a1a1a] border-b-4 border-r-4 border-black shadow-lg flex items-center justify-center active:border-b-0 active:border-r-0 active:translate-y-1 active:translate-x-1 transition-all">
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                </button>
              </div>
            </div>
            
            <div className="absolute -bottom-4 left-16 w-24 h-5 bg-[#111] rounded-b shadow-[0_5px_10px_black]"></div>
            <div className="absolute -bottom-4 right-16 w-24 h-5 bg-[#111] rounded-b shadow-[0_5px_10px_black]"></div>
          </div>
        </div>

        {/* CONTROLLER UNIT */}
        <div className="relative transform flex-shrink-0 -rotate-3 select-none perspective-[500px]">
          <div className="bg-[#222] texture-plastic w-64 rounded-[0_0_24px_24px] shadow-[20px_20px_50px_rgba(0,0,0,0.7),inset_1px_1px_1px_rgba(255,255,255,0.1)] border-l border-t border-[#444] relative z-10 pb-8 overflow-hidden font-sans">
            
            <div className="h-10 bg-[#151515] rounded-[12px_12px_0_0] relative overflow-hidden border-b border-[#333] shadow-md">
                 <div className="absolute inset-0 bg-red-900/30"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full shadow-[inset_0_0_8px_rgba(255,0,0,0.6)] border border-red-900/50"></div>
            </div>

            <div className="p-5 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-8 border-b border-[#333] pb-3">
                    <span className="text-gray-500 font-bold italic text-xs tracking-widest drop-shadow-[0_1px_1px_black]">UNIVERSAL</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-900"></div>
                </div>

                <div className="flex justify-end w-full mb-8 px-2">
                    <div className="flex flex-col items-center">
                        <button onClick={togglePower} className="w-12 h-12 rounded-full bg-[#cc2222] text-white flex justify-center items-center remote-btn hover:bg-[#dd3333] active:scale-95 transition-transform">
                            <svg className="w-5 h-5 drop-shadow-md opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                        </button>
                        <span className="text-[8px] text-gray-500 mt-1 font-bold tracking-wider pt-1">POWER</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-6 w-full mb-8 px-2">
                     <div className="flex flex-col items-center space-y-2">
                        <span className="text-[9px] text-gray-500 font-bold tracking-wider">SOURCE</span>
                        <button onClick={handleUploadClick} disabled={!tvState.isOn || tvState.isProcessing} className="w-14 h-14 rounded-lg bg-[#2a4a80] text-gray-200 remote-btn disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center active:scale-95 transition-transform">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </button>
                     </div>
                     <div className="flex flex-col items-center space-y-2">
                        <span className="text-[9px] text-gray-500 font-bold tracking-wider">RESET</span>
                        <button onClick={handleReset} disabled={!tvState.isOn || tvState.isProcessing} className="w-14 h-14 rounded-lg bg-[#b07d15] text-gray-100 remote-btn disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center active:scale-95 transition-transform">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                        </button>
                     </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  );
}
```

#### File: ./style.css
```text
@import "tailwindcss";

/* Custom Fonts & Base */
body {
    font-family: 'VT323', monospace;
    background-color: #050505;
}

.font-pixel { font-family: 'Press Start 2P', cursive; }
.font-vt323 { font-family: 'VT323', monospace; }
.font-jost { font-family: 'Jost', sans-serif !important; }

/* --- NAVIGATION ENGINE --- */
body.guide-active #tv-internal-guide { transform: translateX(0); }
body.guide-active #app-viewport { transform: translateX(200px) scale(0.9); }

body.admin-active #tv-admin-panel { transform: translateX(0); }
body.admin-active #app-viewport { transform: translateX(-200px) scale(0.9); }

/* Missing Background for Guide */
.teletext-bg {
    background: #0000aa; /* Classic Teletext/Osd Blue */
    background-image: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
    background-size: 100% 2px, 3px 100%;
}

/* --- ACCORDION UI --- */
.guide-cat-header.active {
    background-color: #0000ff;
    border-left: 6px solid #ffff00;
}

.guide-cat-content {
    max-height: 45vh; /* Limita a altura para permitir scroll interno se a lista for longa */
    overflow-y: auto;
}

/* Scrollbar customizada para as listas de canais */
.guide-cat-content::-webkit-scrollbar, .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.guide-cat-content::-webkit-scrollbar-track, .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.3);
}
.guide-cat-content::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #fbbf24;
    border-radius: 10px;
}

.rotate-180 {
    transform: rotate(180deg);
}

/* --- SMART MARQUEE (LETREIRO DIGITAL) --- */
.marquee-container {
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    position: relative;
}

.marquee-text {
    display: inline-block;
    padding-left: 0;
    will-change: transform;
    transition: none;
}

.marquee-active {
    animation: marquee-scroll linear infinite;
}

@keyframes marquee-scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); } /* Rola metade pois duplicamos o texto para loop fluido */
}

/* --- NOW PLAYING COLORIDO (GUIDE) --- */
.gnp-row {
    transition: background 0.2s ease-out;
    padding: 2px 4px;
    border-radius: 4px;
}
.gnp-row:hover {
    background: rgba(255,255,255,0.05);
}

#guide-now-playing {
    background: radial-gradient(circle at top left, #222, #000);
}

#guide-clock, #guide-now-playing, .font-jost {
    font-family: 'Jost', sans-serif !important;
}

/* --- YOUTUBE PLAYER --- */
#player {
    position: absolute;
    width: 100% !important;
    height: 100% !important;
    top: 0 !important;
    left: 0 !important;
    z-index: 10;
}

/* --- OSD DINÂMICO --- */
.osd-futuristic {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    padding: 0.4rem 0.8rem;
    position: relative;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Jost', sans-serif;
    font-weight: 400; /* NUNCA NEGRITO */
    line-height: 1.1;
    border-right: 3px solid #00ff00;
    background: linear-gradient(90deg, transparent, rgba(0,0,0,0.6));
    transition: opacity 1.2s ease-in-out, transform 1.2s ease-in-out;
    opacity: 0;
    transform: translateX(20px);
    animation: osd-slide-in 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

@keyframes osd-slide-in {
    0% { opacity: 0; transform: translateX(30px) scaleX(0.9); filter: blur(10px); }
    100% { opacity: 0.8; transform: translateX(0) scaleX(1); filter: blur(0px); }
}

.osd-futuristic.visible { 
    opacity: 0.8;
    transform: translateX(0); 
}

.osd-futuristic.bump-chrome { border-right-color: #fff; color: #fff; font-style: italic; }

.osd-futuristic.bump-urban { 
    border-right-color: #ffff00; 
    color: #ffff00; 
    font-family: 'Permanent Marker', cursive;
    text-shadow: 2px 0 rgba(255, 0, 255, 0.8), -1px 0 rgba(255, 255, 0, 0.8);
    font-weight: 400;
}

.osd-futuristic.bump-cyber { border-right-color: #00ff00; color: #00ff00; letter-spacing: 2px; }

.osd-futuristic.bump-noise { 
    border-right-color: #fff; 
    color: #fff; 
    background: rgba(0, 0, 0, 0.9); /* Reverted to black background */
    font-family: 'Jost', sans-serif;
    font-weight: 400;
    letter-spacing: 0.5px;
}

.osd-line-1 { font-size: clamp(0.7rem, 2vmin, 1.1rem); }
.osd-line-2 { font-size: clamp(0.55rem, 1.6vmin, 0.9rem); opacity: 0.8; }

/* --- BUMP LAYER MTV --- */
#bump-layer { z-index: 999; }
@keyframes bump-enter {
    0% { transform: scale(2.5); opacity: 0; filter: blur(15px); }
    15% { transform: scale(1); opacity: 1; filter: blur(0px); }
    85% { transform: scale(1); opacity: 1; filter: blur(0px); }
    100% { transform: scale(0.6); opacity: 0; filter: blur(10px); }
}
.bump-active { display: flex !important; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); }
.bump-ident { 
    animation: bump-enter 1.5s cubic-bezier(0.23, 1, 0.32, 1) forwards; 
    position: relative; 
    text-align: center; 
    width: 85%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.bump-chrome { font-family: 'Jost', sans-serif; font-weight: 900; color: #fff; font-style: italic; background: linear-gradient(180deg, #fff 40%, #888 50%, #fff 60%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 10px white); text-transform: uppercase; }
.bump-urban { font-family: 'Permanent Marker', cursive; color: #ffff00; text-shadow: 4px 4px 0px #ff00ff, -4px -4px 0px #00ffff; }
.bump-cyber { font-family: 'Orbitron', sans-serif; color: #00ff00; text-shadow: 0 0 15px #00ff00; letter-spacing: 0.1em; }
.bump-noise { font-family: 'Monoton', cursive; color: #fff; filter: invert(1); mix-blend-mode: difference; }

.bump-ident .main-title {
    font-size: clamp(1.2rem, 8vmin, 5rem);
    line-height: 0.9;
    word-break: break-word;
}

/* --- CRÉDITOS --- */
.credits-overlay {
    position: absolute; bottom: 8%; left: 6%; color: #f8f8f8; 
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 3px 3px 4px rgba(0,0,0,0.9);
    font-size: clamp(0.85rem, 1.8vmin, 1.25rem); font-family: 'Jost', sans-serif;
    font-weight: 700; line-height: 1.1; opacity: 0; transition: opacity 0.8s ease-in-out;
    pointer-events: none; z-index: 60; width: auto; max-width: 80%;
}
.credits-overlay.visible { opacity: 1; }

.credits-3d-shadow {
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 3px 3px 4px rgba(0,0,0,0.9) !important;
}

.credits-overlay b, .credits-overlay strong {
    letter-spacing: 0.05em;
    font-weight: 800;
}

.credit-line { 
    margin-bottom: 0.35rem; 
    display: grid; 
    grid-template-columns: 2rem 1fr;
    align-items: center;
    overflow-wrap: break-word; 
}

.icon { 
    display: flex;
    justify-content: flex-start;
    align-items: center;
    color: #ffff00; 
    filter: drop-shadow(1px 1px 1px #000); 
    font-size: 1.1rem; 
}

.credit-text-content {
    display: flex;
    align-items: center;
    padding-left: 0.2rem;
}

.font-normal { font-weight: 400 !important; }

/* --- UI TRINITRON --- */
.texture-plastic {
    background-color: #181818;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.07'/%3E%3C/svg%3E");
}

.btn-retro-push {
    background: linear-gradient(to bottom, #3a3a3a 0%, #222 100%);
    color: #999; border: none; box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 #000, 0 5px 5px rgba(0,0,0,0.5);
    transition: all 0.1s ease-out; cursor: pointer;
}
.btn-retro-push:active { box-shadow: inset 0 1px 2px rgba(0,0,0,0.5), 0 0 0 #000; transform: translateY(4px); background: #1a1a1a; }

.btn-power-push {
    background: #1a1a1a; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 5px 0 #000, 0 6px 6px rgba(0,0,0,0.6);
    border: 1px solid #000; transition: all 0.1s;
}
.btn-power-push:active { box-shadow: inset 0 3px 5px rgba(0,0,0,0.8), 0 0 0 #000; transform: translateY(5px); }

.tv-3d-tilt { transform: rotateX(2deg); }
.speaker-grid div { width: 100%; height: 2px; background: #050505; margin-bottom: 2px; }

#static-overlay.active { opacity: 0.4; animation: static-shift 0.1s steps(4) infinite; background-image: url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'1\'/%3E%3C/svg%3E"); }
@keyframes static-shift { 0% { background-position: 0 0; } 100% { background-position: 10px 10px; } }
.scanlines { background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.08) 50%); background-size: 100% 3px; }

/* --- SERVICE MODE & EDIT FORM STYLES --- */
#tv-admin-panel input,
#tv-admin-panel select,
.service-mode-input,
.rich-text-input {
    background-color: #000 !important;
    color: #ffffff !important;
    border: 2px solid #333 !important;
    font-family: 'Jost', sans-serif !important;
    font-weight: 700 !important; /* FORÇANDO NEGRITO */
    border-radius: 4px;
    padding: 0.75rem !important;
    transition: all 0.2s ease;
}

.input-year {
    width: 100px !important;
    flex: none !important;
}

#tv-admin-panel input:focus,
#tv-admin-panel select:focus,
.service-mode-input:focus {
    border-color: #fbbf24 !important;
    background-color: #222 !important;
    outline: none;
    box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.2);
}

.service-mode-input::placeholder {
    color: #666 !important;
    font-weight: 400;
}

.service-mode-btn {
    font-family: 'Jost', sans-serif !important;
    font-weight: 700 !important;
    text-transform: uppercase;
    transition: all 0.2s;
    background-color: #111;
    border: 2px solid #fbbf24;
    color: #fbbf24;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.service-mode-btn:hover {
    background-color: #fbbf24;
    color: #000;
}

.service-mode-table th {
    font-family: 'Jost', sans-serif !important;
    font-weight: 700;
    color: #fbbf24;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 0.5rem;
}

.service-mode-table td {
    font-family: 'Jost', sans-serif !important;
    padding: 0.5rem;
}

.vertical-text {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
}

/* --- SINALIZAÇÃO DE ATUALIZAÇÃO NO ADMIN --- */
@keyframes row-highlight-flash {
    0% { background-color: rgba(251, 191, 36, 0.4); }
    100% { background-color: transparent; }
}

.row-updated {
    animation: row-highlight-flash 3s ease-out forwards;
    border-left: 4px solid #fbbf24;
}

/* Responsive TV scaling */
.tv-responsive-container {
    max-width: min(95vw, 130vh);
    width: 100%;
    margin: 0 auto;
}

@media (max-width: 768px) {
    .tv-responsive-container {
        max-width: 98vw;
    }
}
```

#### File: ./supabase/functions/import_map.json
```text
{
  "imports": {
    "supabase": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

#### File: ./supabase/functions/sync-youtube/deno.json
```text
{
  "importMap": "import_map.json"
}
```

#### File: ./supabase/functions/sync-youtube/import_map.json
```text
{
  "imports": {
    "std/": "https://deno.land/std@0.177.0/",
    "supabase": "https://esm.sh/@supabase/supabase-js@2.7.1"
  }
}
```

#### File: ./supabase/functions/sync-youtube/index.ts
```text
import { createClient } from 'supabase'

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req) => {
  try {
    if (!YOUTUBE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Get all playlists to sync
    const { data: playlists, error: plError } = await supabase
      .from('playlists')
      .select('name, youtube_id')
      .not('youtube_id', 'is', null)

    if (plError) throw plError

    const results = []

    for (const pl of playlists) {
      console.log(`Syncing playlist: ${pl.name} (${pl.youtube_id})`)
      
      // 2. Fetch items from YouTube
      const ytUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${pl.youtube_id}&key=${YOUTUBE_API_KEY}`
      const response = await fetch(ytUrl)
      const ytData = await response.json()

      if (ytData.error) {
        console.error(`YouTube API error for ${pl.name}:`, ytData.error)
        continue
      }

      const items = ytData.items || []
      
      for (const item of items) {
        const title = item.snippet.title
        const videoId = item.snippet.resourceId.videoId
        
        // Basic title parsing: "Artist - Song"
        let artista = 'Unknown Artist'
        let musica = title
        
        if (title.includes(' - ')) {
          const parts = title.split(' - ')
          artista = parts[0].trim()
          musica = parts.slice(1).join(' - ').trim()
        }

        // Clean up title (remove common suffixes)
        musica = musica.replace(/\(Official Video\)/gi, '')
                      .replace(/\(Official Music Video\)/gi, '')
                      .replace(/\[Official Video\]/gi, '')
                      .replace(/HD/gi, '')
                      .trim()

        // 3. Upsert into musicas_backup
        // We cannot rely on 'video_id' unique constraint since multiple playlists can have the same video.
        // We do a select check first for the specific (video_id, playlist) association.
        const { data: existingRecords, error: selectErr } = await supabase
          .from('musicas_backup')
          .select('id')
          .eq('video_id', videoId)
          .eq('playlist', pl.name);

        if (selectErr) {
          console.error(`Error checking existing record for ${videoId}:`, selectErr)
          continue;
        }

        if (existingRecords && existingRecords.length > 0) {
          // Update existing row (optional: depending on whether we want YouTube to overwrite metadata)
          // We will update it for now just to maintain the expected sync behavior
          const { error: updateError } = await supabase
            .from('musicas_backup')
            .update({
              artista: artista,
              musica: musica
            })
            .eq('id', existingRecords[0].id);

          if (updateError) {
            console.error(`Error updating ${videoId}:`, updateError)
          }
        } else {
          // Insert new row
          const { error: insertError } = await supabase
            .from('musicas_backup')
            .insert({
              video_id: videoId,
              artista: artista,
              musica: musica,
              playlist: pl.name
            });

          if (insertError) {
            console.error(`Error inserting ${videoId}:`, insertError)
          }
        }
      }
      
      results.push({ playlist: pl.name, itemsFound: items.length })
    }

    return new Response(JSON.stringify({ message: 'Sync completed', detail: results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

#### File: ./tailwind.config.js
```text
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### File: ./tsconfig.json
```text
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "skipLibCheck": true,
    "types": [
      "node",
      "vite/client"
    ],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

#### File: ./tv.css
```text
/* Custom Fonts */
body {
    font-family: 'VT323', monospace;
}

.font-pixel {
    font-family: 'Press Start 2P', cursive;
}

/* Texture Classes */
.texture-plastic {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
}

.texture-wood {
    background-color: #3e2723;
    background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 8px),
                      repeating-linear-gradient(-45deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 4px);
    box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
}

/* CRT & 3D Effects */
.tv-3d-tilt {
    transform: rotateX(4deg);
}

.translate-z-back {
    transform: translateZ(-40px) scale(0.96);
}

.rotate-x-20 {
    transform: rotateX(20deg);
}

/* .vent-strip div {
    Generated by JS usually, but here we can use a gradient or just rely on parent container
} */

/* CRT Flicker Animation */
@keyframes flicker {
    0% { opacity: 0.97; }
    5% { opacity: 0.95; }
    10% { opacity: 0.9; }
    15% { opacity: 0.95; }
    20% { opacity: 0.99; }
    25% { opacity: 0.95; }
    30% { opacity: 0.9; }
    35% { opacity: 0.96; }
    40% { opacity: 0.98; }
    45% { opacity: 0.95; }
    50% { opacity: 0.99; }
    55% { opacity: 0.93; }
    60% { opacity: 0.9; }
    65% { opacity: 0.96; }
    70% { opacity: 1; }
    75% { opacity: 0.97; }
    80% { opacity: 0.95; }
    85% { opacity: 0.92; }
    90% { opacity: 0.96; }
    95% { opacity: 0.99; }
    100% { opacity: 0.94; }
}
.crt-flicker {
    animation: flicker 0.15s infinite;
}

/* Scanlines */
.scanlines {
    background: linear-gradient(
        to bottom,
        rgba(255,255,255,0),
        rgba(255,255,255,0) 50%,
        rgba(0,0,0,0.08) 50%,
        rgba(0,0,0,0.08)
    );
    background-size: 100% 4px;
}

/* VHS Noise */
.vhs-noise {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.12;
}

/* Tracking Lines */
@keyframes tracking-scan {
    0% { transform: translateY(-10%); opacity: 0.1; }
    50% { opacity: 0.3; }
    100% { transform: translateY(110%); opacity: 0.1; }
}
.vhs-tracking {
    position: absolute;
    top: 0; left: 0; right: 0; height: 10%;
    background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.3) 20%, rgba(200,200,255,0.4) 50%, rgba(255,255,255,0.3) 80%, transparent);
    animation: tracking-scan 4s linear infinite;
    mix-blend-mode: overlay;
    filter: blur(1px);
}

/* RGB Split Text */
@keyframes rgb-shift-text {
    0% { text-shadow: -2px 0 rgba(255,0,0,0.7), 2px 0 rgba(0,0,255,0.7); }
    25% { text-shadow: -3px 0 rgba(255,0,0,0.7), 3px 0 rgba(0,0,255,0.7); }
    50% { text-shadow: -2px 0 rgba(255,0,0,0.7), 2px 0 rgba(0,0,255,0.7); }
    75% { text-shadow: -1px 0 rgba(255,0,0,0.7), 1px 0 rgba(0,0,255,0.7); }
    100% { text-shadow: -2px 0 rgba(255,0,0,0.7), 2px 0 rgba(0,0,255,0.7); }
}
.vhs-text-shadow {
    animation: rgb-shift-text 2s infinite alternate;
}

/* Image Filter */
.vhs-filter {
    filter: sepia(0.2) contrast(1.15) brightness(1.1) saturate(1.1) blur(0.5px);
}

/* Remote Button Style */
.remote-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 0 rgba(0,0,0,0.4), 0 6px 6px rgba(0,0,0,0.3);
    position: relative;
    overflow: hidden;
    transition: transform 0.075s;
}

.remote-btn:active {
    box-shadow: 0 1px 0 rgba(0,0,0,0.4);
    transform: translateY(3px) scale(0.98);
}

.remote-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: rgba(255,255,255,0.05);
    border-radius: 9999px;
    opacity: 0;
    transition: opacity 0.2s;
}

.remote-btn:hover::before {
    opacity: 1;
}

/* Vent generation Helper */
.vent-strip {
    width: 4px;
    height: 100%;
    background-color: black;
    border-radius: 9999px;
    box-shadow: inset 0 1px 2px rgba(0,0,0,1);
    display: inline-block;
    margin-right: 4px;
}
```

#### File: ./vite.config.ts
```text
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
```