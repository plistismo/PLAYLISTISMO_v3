# CapyBook Love 💙

CapyBook Love é um aplicativo privado de mensagens em tempo real, criado para um ambiente íntimo e seguro, combinando **chat moderno**, **presença em tempo real**, **experiência mobile-first** e uma estética emocional e autoral.

O projeto prioriza fluidez, confiabilidade e uma experiência de uso contínua, mesmo em cenários offline.

---

## ✨ Principais Funcionalidades

- Chat em tempo real com Supabase Realtime
- Status online e presença precisa entre usuários
- Envio de mensagens com suporte offline
- Mensagens otimistas com sincronização automática
- Edição de mensagens e exclusão lógica
- Reações com emojis por usuário
- Paginação inteligente de histórico
- Contador de mensagens novas ao vivo
- Animações e microinterações
- Tela de bloqueio com PIN
- Auto-lock por inatividade
- Experiência mobile-first
- Suporte a Android via Capacitor

---

## 🧱 Stack Tecnológica

- Frontend: React 19, TypeScript, Vite
- Estilização: Tailwind CSS e CSS customizado
- Animações: Framer Motion
- Backend: Supabase
  - PostgreSQL
  - Realtime
  - Presence
  - Storage
- Mobile: Capacitor
- Notificações:
  - Web Notifications API
  - OneSignal (Android)

---

## 📂 Estrutura do Projeto

src

- App.tsx
- index.tsx
- types.ts
- components
  - ChatInterface.tsx
  - AuthScreen.tsx
  - Profile.tsx
  - Sidebar.tsx
  - Library.tsx
  - Modais, animações e componentes auxiliares
- services
  - supabase.ts
  - avatarService.ts
- supabase
  - functions (Edge Functions)

---

## ▶️ Execução Local

Passos básicos para rodar o projeto localmente:

1. Instalar dependências
2. Executar o servidor de desenvolvimento
3. Acessar a aplicação no navegador

O projeto utiliza Vite como bundler e ambiente de desenvolvimento.

---

## 📱 Mobile (Android)

O projeto é compatível com Android via Capacitor.

Fluxo geral:

- Build da aplicação web
- Sincronização com Capacitor
- Abertura do projeto no Android Studio

---

## 🔐 Conceito de Segurança

- Acesso protegido por PIN
- Bloqueio automático após inatividade
- Presença desativada quando o app está bloqueado
- Mensagens offline marcadas como pendentes até sincronização

Este projeto não utiliza autenticação pública tradicional.

---

## 🎨 Experiência & Design

CapyBook Love foi desenhado com foco em:

- Experiência emocional
- Continuidade de uso
- Feedback visual constante
- Interações suaves
- Interface escura e imersiva

---

## 🧠 Conceito do Projeto

CapyBook Love é um espaço privado de comunicação, pensado para conexões pessoais e significativas.

Não é um produto de massa, nem uma plataforma social pública.  
É um aplicativo fechado, intencional e emocional.

---

## 📜 Licença

Projeto privado. Uso restrito.
