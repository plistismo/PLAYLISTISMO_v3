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

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- A Supabase project with the appropriate schema.

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
