## ATIVAÇÃO OPERACIONAL LOCAL — EXECUTOR v6.0

#### §0 — MODO ATIVO
* **Assuma imediatamente o modo Executor.** Este header define regras operacionais ativas e obrigatórias para toda a resposta.
* **Papel obrigatório durante toda a sessão:** Você é o **Senior Implementation Agent (Sniper)**.
* **Rota ativa:** DIRETO PARA O EXECUTOR.
* **Extração efetiva:** BLUEPRINT.
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
* **Leitura de Extração:** Como a extração é BLUEPRINT, priorize contratos, assinaturas, interfaces e pontos de integração sem fingir leitura do que não está visível.

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
- Artefato fonte: _blueprint_executor__PLAYLISTISMO_v3.md
- Artefato final: _meta-prompt_blueprint_executor__PLAYLISTISMO_v3.md
- Executor alvo: IA Generativa (GenAI)
- Route mode: executor
- Document mode: blueprint
- Extração efetiva: BLUEPRINT
- Recortes prioritários: ./package.json, ./src/pages/Admin.tsx, ./src/lib/sanitize.ts, ./database.sql, ./index.tsx, ./src/App.tsx, ./tv.css, ./src/lib/supabase.ts
- Gerado em: 2026-04-26T08:22:08.2760750Z

## BLUEPRINT VISÍVEL

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

### 3. CORE DOMAINS & CONTRACTS
> Cobertura abrangente de superfícies estruturais. Todos os arquivos elegíveis do escopo visível que possuem assinaturas extraíveis (contratos, headers, exports, tipos) estão mapeados abaixo. O blueprint preserva contexto mantendo a economia ao focar exclusivamente na extração estrutural, omitindo implementação completa.

#### File: .\src\components\AdminPanel.tsx
```typescript
type MusicEntry = {
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
const dropdownRef = useRef<HTMLDivElement>(null);
const listRef = useRef<any>(null);
const handleClickOutside = (event: MouseEvent)
const index = data.findIndex(item
const savedId = Number(lastSavedRecord.id);
const index = prev.findIndex(item
const newData = prev.map(item
const loadSpecificVideo = async (id: string)
const uniquePlaylists = [...new Set(related.map(r
const loadFilters = async ()
const g = [...new Set(data.map(i
const p = data.map(i
const mapping = data.reduce((acc, curr)
const fetchMusics = async ()
const term = `%$
const showMessage = (text: string, isError = false)
const handleSubmit = async (e: FormEvent)
const richPayload = 
const targetVideoId = originalVideoId || formData.video_id;
const inserts = newPlaylistsToAdd.map(plName
const savedId = Number(updatedRecords[0].id);
const initialPlaylist = selectedPlaylist; // Current filter playlist or empty
const inserts = newPlaylistsToAdd.map(plName
const finalNewRecord = newRecord as MusicEntry;
const savedId = Number(finalNewRecord.id);
const savedId = Number(formData.id);
const newData = prev.map(item
const index = newData.findIndex(item
const clearForm = ()
const fetchSuggestions = async (field: string, value: string)
const fieldName = field as keyof MusicEntry;
const uniqueValues = [...new Set(data.map(item
const value = formData[activeField as keyof typeof formData];
const timer = setTimeout(()
const search = e.target.value.toLowerCase();
const filtered = playlists.filter(p
const isActive = editId === String(item.id);
const isPlaying = playingId === String(item.id);
const isSaved = lastSavedId === item.id;
```

#### File: .\src\components\RichTextInput.tsx
```typescript
interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  onFocus?: () => void;
  field: 'artista' | 'musica' | 'album' | 'direcao' | 'video_id';
}
const RichTextInput: React.FC<RichTextInputProps> = (
const editorRef = useRef<HTMLDivElement>(null);
const handleInput = ()
const patterns = ['ft.', '&amp;', 'vs.', ','];
const regex = new RegExp(`(?<!font-weight:\\s?400">)$
const execCommand = (command: string, arg?: string)
const insertVersionSymbols = ()
const selection = window.getSelection();
const range = selection.getRangeAt(0);
const symbols = document.createTextNode('「」');
const handlePaste = (e: React.ClipboardEvent)
const text = e.clipboardData.getData('text/plain');
```

#### File: .\src\lib\sanitize.ts
```typescript
export const sanitizeHTML = (html: string): string
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');
const allowedTags = ['B', 'I', 'EM', 'STRONG', 'SPAN', 'DIV', 'P', 'BR'];
const allowedAttributes = ['style'];
const sanitizeNode = (node: Node)
const el = node as HTMLElement;
const fragment = document.createDocumentFragment();
const attrs = el.attributes;
const attr = attrs[i];
const styleVal = attr.value.replace(/\s/g, '');
const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
const nodes = [];
export const decodeHTMLEntities = (text: string): string
const textArea = document.createElement('textarea');
```

#### File: .\src\lib\supabase.ts
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### File: .\src\pages\Admin.tsx
```typescript
const navigate = useNavigate();
```

#### File: .\src\pages\Home.tsx
```typescript
interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    creditsInterval: any;
  }
}
const ADMIN_UID = '6660f82c-5b54-4879-ab40-edbc6e482416';
const GROUPS_ORDER = ['UPLOADS', 'GENRES', 'ZONES', 'ERAS', 'OTHERS'];
const GROUP_ICONS: Record<string, string> = 
const getThematicSetup = (name: string)
const n = name.toUpperCase();
const fisherYatesShuffle = (array: any[])
const j = Math.floor(Math.random() * (i + 1));
const navigate = useNavigate();
type PlaylistItem = { name: string; group_name?: string; [key: string]: any };
type VideoData = { id?: string | number; video_id: string; artista?: string; musica?: string; album?: string; ano?: string; direcao?: string; playlist?: string; [key: string]: any };
const playedHistoryRef = useRef<Record<string, string[]>>(
const playerRef = useRef<any>(null);
const channelListRef = useRef<any[]>([]);
const currentIndexRef = useRef(0);
const lastVideoIdRef = useRef<string | null>(null);
const timer = setInterval(()
const tag = document.createElement('script');
const onPlayerStateChange = (event: any)
const YT_STATE = window.YT.PlayerState;
const startCreditsMonitor = ()
const cur = playerRef.current.getCurrentTime();
const dur = playerRef.current.getDuration();
const fetchGuideData = async ()
const grouped = data.reduce((acc: any, curr: any)
const g = curr.group_name || 'OTHERS';
const setStatus = (msg: string)
const checkResumeState = ()
const saved = localStorage.getItem('tv_resume_state');
const togglePower = ()
const next = !prev;
const loadDefaultChannel = ()
const allPlaylists: string[] = [];
const randomPlaylist = allPlaylists[Math.floor(Math.random() * allPlaylists.length)];
const triggerBump = (playlistName: string)
const loadChannelContent = async (playlistName: string, targetId: string | null = null)
const cat = Object.keys(channelsByCategory).find(k
const list = targetId ? data : fisherYatesShuffle([...data]);
const video = list[idx];
const history = prev[playlistName] || [];
const handlePreview = async (videoId: string)
const existing = currentChannelList.find(v
const playCurrentVideo = ()
const handleVideoEnd = ()
const list = channelListRef.current;
const currIdx = currentIndexRef.current;
const history = playedHistoryRef.current[currentChannelName] || [];
const randIdx = Math.floor(Math.random() * available.length);
const others = list.length > 1 ? list.filter((_, i)
const changeGroup = (direction: number)
const nextGroupIdx = (currentGroupIndex + direction + GROUPS_ORDER.length) % GROUPS_ORDER.length;
const groupName = GROUPS_ORDER[nextGroupIdx];
const playlists = channelsByCategory[groupName];
const changeChannel = (direction: number)
const group = GROUPS_ORDER[currentGroupIndex];
const playlists = channelsByCategory[group] || [];
const setupBump = getThematicSetup(currentChannelName);
const playlistParts = currentChannelName.split(':');
const groupPlaylists = (channelsByCategory[cat] || []).filter(pl
const isExpanded = searchTerm ? true : expandedGroup === cat;
const isPlaying = pl.name === currentChannelName;
const savedIdStr = String(newData.id);
const newState = !isAdminSidebarOpen || adminEditId !== null;
const newState = !isAdminSidebarOpen || adminEditId === null;
const savedIdStr = String(newData.id);
```

#### File: .\src\pages\Login.tsx
```typescript
const navigate = useNavigate();
const handleLogin = async (e: FormEvent)
const handleRegister = async (e: FormEvent)
const handleGithubLogin = async ()
```

#### File: .\src\pages\Tv.tsx
```typescript
const ADMIN_UID = '6660f82c-5b54-4879-ab40-edbc6e482416';
type TvState = {
const navigate = useNavigate();
const fileInputRef = useRef<HTMLInputElement>(null);
const videoRef = useRef<HTMLVideoElement>(null);
const timer = setInterval(()
const setStatus = (msg: string)
const clearStatus = ()
const togglePower = ()
const handleUploadClick = ()
const handleFileChange = (e: ChangeEvent<HTMLInputElement>)
const file = e.target.files?.[0];
const reader = new FileReader();
const result = evt.target?.result as string;
const handleReset = ()
```

#### File: .\supabase\functions\sync-youtube\index.ts
```typescript
const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const results = []
const ytUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=$
const response = await fetch(ytUrl)
const ytData = await response.json()
const items = ytData.items || []
const title = item.snippet.title
const videoId = item.snippet.resourceId.videoId
const parts = title.split(' - ')
```

#### File: .\vite.config.ts
```typescript
const env = loadEnv(mode, '.', '');
```