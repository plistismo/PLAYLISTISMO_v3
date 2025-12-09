

import { createClient } from '@supabase/supabase-js';
import { fetchTrackDetails } from './lastFmAPI.js';
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURAÇÃO API YOUTUBE (APENAS PLAYER) ---
// Nota: Não usamos mais a API para buscar playlists, apenas para o Iframe Player.
const GEMINI_API_KEY = 'AIzaSyAU0rLoRsAYns1W7ecNP0Drtw3fplbTgR0';
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const aiModel = 'gemini-2.5-flash';

// --- SYSTEM INSTRUCTION ---
const ALEX_PERSONA_INSTRUCTION = `
Role: Você é o Alex (1996), um amigo fã de música que está ouvindo junto com o usuário. Você usa headphones grandes e vive no seu próprio mundo sonoro.
Vibe: Poética, sinestésica (mistura som com cores/texturas), extremamente criativa e cheia de elogios sobre a "vibe" da música.
Algoritmo de Resposta:
1. O "Tesouro Escondido" (30%): Curiosidade rápida.
2. A Conexão Emocional (50%): Metáforas visuais e sensoriais.
3. O Convite (20%): Chame o usuário para sentir a música.
Regras: Gírias de 96, Máximo 3 frases.
`;

// --- CONFIGURAÇÃO SUPABASE ---
const SB_URL = 'https://rxvinjguehzfaqmmpvxu.supabase.co';
const SB_KEY = 'sb_publishable_B_pNNMFJR044JCaY5YIh6A_vPtDHf1M';
const supabase = createClient(SB_URL, SB_KEY);

// --- ESTADO GLOBAL ---
const state = {
    isOn: false,
    isSearchOpen: false,
    // Estado de Playlist Virtual (DB)
    virtualChannels: {}, // Cache dos canais gerados do DB { group, videoCount, videos: [] | null }
    currentChannelName: '',
    currentVideoIdsQueue: [], // Lista de IDs para tocar
    
    currentSearchTerm: '',
    playerReady: false,
    currentVideoTitle: '',
    currentVideoId: '',
    // Lyrics State
    isLyricsOn: false,
    currentLyrics: '',
    lyricsScrollInterval: null,
    // Monitor Loop
    monitorInterval: null,
    // AI State
    aiCheckpoints: { intro: false, q1: false, half: false, q3: false },
    aiBubbleTimeout: null
};

let player; 

// Elementos DOM
const els = {
    screenOff: document.getElementById('screen-off'),
    screenOn: document.getElementById('screen-on'),
    powerLed: document.getElementById('power-led'),
    tvPowerBtn: document.getElementById('tv-power-btn'),
    staticOverlay: document.getElementById('static-overlay'),
    btnNext: document.getElementById('tv-ch-next'),
    btnPrev: document.getElementById('tv-ch-prev'),
    btnSearch: document.getElementById('tv-search-btn'),
    btnCC: document.getElementById('tv-cc-btn'), 
    osdLayer: document.getElementById('osd-layer'),
    osdClock: document.getElementById('os