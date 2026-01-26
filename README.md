# 📺 Playlistismo | Retro Edition

> Uma experiência visual nostálgica que transforma playlists do YouTube em uma TV de Tubo interativa dos anos 90, enriquecida com metadados e curiosidades.

## 🕹️ Sobre o Projeto

O **Play-Listismo** é uma aplicação web que simula uma televisão CRT Sony Trinitron. O projeto consome a API do YouTube para reproduzir vídeos como se fossem canais de TV, aplica filtros visuais (scanlines, ruído, distorção VHS) e exibe créditos estilo MTV e curiosidades sobre as músicas em tempo real.

## ✨ Funcionalidades

*   **TV Retrô Interativa**: Interface 3D feita puramente em CSS (Sony Trinitron) com botões funcionais (Power, Canal, Volume/Busca).
*   **Guia de Canais (Teletexto)**: Menu de navegação estilo teletexto dos anos 80/90, organizado por categorias (Uploads, Zones, Genres, Eras).
*   **Sincronização de Banco de Dados**: Script em Node.js (`sync.js`) que varre o canal do YouTube e sincroniza os IDs dos vídeos com um banco de dados PostgreSQL (Supabase) para enriquecimento de dados.
*   **Créditos Estilo MTV**: Overlay automático que exibe Artista, Música, Álbum, Ano e Diretor no início e fim de cada clipe.
*   **Data Module (Last.FM)**: Painel lateral que busca automaticamente curiosidades e bios da música atual na API da Last.FM.
*   **Efeitos Visuais**:
    *   Efeito de desligar/ligar CRT.
    *   Chiado (Static Noise) ao trocar de canal.
    *   Filtros VHS e Scanlines sobre o vídeo.
    *   Zoom no player para esconder a interface nativa do YouTube.

## 🛠️ Tecnologias Utilizadas

*   **Frontend**: HTML5, Vanilla JavaScript (ES6+), CSS3.
*   **Estilização**: Tailwind CSS + CSS Customizado (Animações, 3D Transforms).
*   **Backend / BaaS**: Supabase (PostgreSQL).
*   **APIs Externas**:
    *   YouTube Data API v3.
    *   Last.FM API.
    *   Google Gemini (preparado para uso futuro).

## 🚀 Como Rodar o Projeto

### Pré-requisitos
*   Node.js instalado (para o script de sincronização).
*   Uma conta no Google Cloud (para YouTube API Key).
*   Uma conta no Supabase.
*   Uma conta na Last.FM (para API Key).

### 1. Configuração do Banco de Dados (Supabase)

No painel do Supabase, vá em **SQL Editor** e rode o seguinte script para criar a tabela:

```sql
create table public.musicas (
  id bigserial not null,
  artista text not null,
  musica text null,
  album text null,
  ano integer null,
  direcao text null,
  date_creation timestamp with time zone null default now(),
  video_id text null, -- Será preenchido pelo sync.js
  constraint musicas_pkey primary key (id)
);
```

### 2. Sincronização de Dados

Para vincular os vídeos do seu canal com os dados da tabela `musicas`:

1.  Abra o arquivo `sync.js`.
2.  Configure suas chaves (`API_KEY`, `CHANNEL_ID`, `SB_URL`, `SB_KEY`).
3.  No terminal, instale a dependência e rode o script:

```bash
npm install @supabase/supabase-js
node sync.js
```

### 3. Rodando a Aplicação (Front-end)

Como o projeto utiliza Módulos ES6 (`import/export`), você precisa de um servidor local. Se estiver usando VS Code com a extensão "Live Server", basta clicar em "Go Live".

Ou via terminal com Python:
```bash
python3 -m http.server
```
Acesse `http://localhost:8000`.

## 🎮 Controles da TV

*   **Botão Power**: Liga/Desliga a TV.
*   **Botão Lupa**: Abre o Guia de Canais (Teletexto) para buscar e selecionar playlists.
*   **Botões CH +/-**: Navega entre as músicas da playlist atual.

## 📂 Estrutura de Arquivos

*   `index.html`: Estrutura principal da TV e overlays.
*   `style.css`: Estilização pesada da TV, efeitos CRT e animações.
*   `script.js`: Lógica principal (Player YouTube, Controle de UI, Integração Supabase).
*   `lastFmAPI.js`: Módulo de conexão com a Last.FM.
*   `sync.js`: Script de backend para manutenção do banco de dados.

---
*Desenvolvido com 📺 e 📼 por Play-Listismo.*
