#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import * as readline from 'node:readline';

// Definição de Ambiente.
const supabaseUrl = process.env.SUPABASE_URL || 'https://yggpwbvhyieaqvwwjcot.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnZ3B3YnZoeWllYXF2d3dqY290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODE4MjksImV4cCI6MjA4MzY1NzgyOX0.UK00JUukbjaLkLob3cW1XWaQBJ9cZd5-TuJZ384Q3Rc';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AUTOR_ID = '00000000-0000-0000-0000-000000000001';
const MUSA_ID  = '00000000-0000-0000-0000-000000000002';

async function main() {
  console.log('\x1b[36m=== CapBook CLI Chat (Node ES - Realtime Protocol) ===\x1b[0m');
  
  const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout,
    prompt: '> '
  });
  const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

  let currentUserId = process.env.CHAT_USER_ID || AUTOR_ID;
  let partnerId     = process.env.CHAT_PARTNER_ID || MUSA_ID;

  console.log(`\x1b[90mIDs detectados na matriz: autor=${AUTOR_ID}, musa=${MUSA_ID}\x1b[0m`);
  console.log(`\x1b[90mAutenticação de ID local: ${currentUserId}\x1b[0m`);
  console.log(`\x1b[90mAutenticação de ID remoto: ${partnerId}\x1b[0m`);

  // Validação e Criação Automática de Perfis
  async function ensureProfile(id, defaultName) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao consultar cluster: ${error.message}`);
    }

    if (!data) {
      console.log(`\x1b[33m[Sync] Perfil [${id}] inexistente. Criando registro emergencial...\x1b[0m`);
      const { data: newData, error: upsertError } = await supabase
        .from('profiles')
        .upsert({ 
          id, 
          display_name: defaultName,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
          bio: 'Perfil gerado automaticamente via CLI'
        })
        .select('id, display_name')
        .single();

      if (upsertError) throw new Error(`Falha ao criar perfil: ${upsertError.message}`);
      return newData;
    }
    return data;
  }

  let userData, partnerData;
  try {
    userData = await ensureProfile(currentUserId, currentUserId === AUTOR_ID ? 'Autor' : 'Usuário Local');
    partnerData = await ensureProfile(partnerId, partnerId === MUSA_ID ? 'Musa' : 'Parceiro');
  } catch (err) {
    console.error(`\x1b[31mFalha crítica: ${err.message}\x1b[0m`);
    rl.close();
    return;
  }

  const currentUserName = userData.display_name || 'Você';
  const partnerName = partnerData.display_name || 'Parceiro';

  console.log(`\n\x1b[36mLink estabelecido: [${currentUserName}] ↔ [${partnerName}]\x1b[0m`);
  console.log('\x1b[90mComandos operacionais permitidos: digite sua mensagem ou /exit\x1b[0m\n');
  
  rl.setPrompt(`\x1b[32m${currentUserName} >\x1b[0m `);

  // Engine de Busca
  async function fetchMessages(limit = 20) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .in('sender_id', [currentUserId, partnerId])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro de I/O na busca:', error.message);
      return [];
    }
    return (data || []).reverse();
  }

  // Renderizador
  function displayMessages(msgs) {
    console.clear();
    console.log(`\x1b[36m=== CapBook Secure Link: ${currentUserName} ↔ ${partnerName} ===\x1b[0m\n`);
    
    let lastSenderId = null;
    const termWidth = process.stdout.columns || 80;
    const wrapLimit = Math.max(20, termWidth - 2);

    const dim = `\x1b[2m`;
    const reset = `\x1b[0m`;
    const bold = `\x1b[1m`;

    msgs.forEach((msg, index) => {
      const isMe = msg.sender_id === currentUserId;
      const sender = isMe ? currentUserName : partnerName;
      const time = new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const senderColor = isMe ? `\x1b[32m${bold}` : `\x1b[35m${bold}`;
      const textColor = isMe ? `\x1b[37m` : `\x1b[97m`;
      const payloadColor = `\x1b[33m`;
      const marker = isMe ? "►" : "●";

      // Cabeçalho condicional: só imprime quando o autor muda
      if (msg.sender_id !== lastSenderId) {
        if (lastSenderId !== null) console.log('');
        console.log(`${dim}\x1b[90m[${time}]${reset} ${dim}\x1b[90m${marker}${reset} ${senderColor}${sender}:${reset}`);
      }
      lastSenderId = msg.sender_id;

      // Corpo da mensagem: margem a margem (padding mínimo de 1 espaço)
      if (msg.type === 'text') {
        const paragraphs = (msg.text || '').split('\n');
        
        for (const para of paragraphs) {
          if (para === '') {
            console.log('');
            continue;
          }
          const words = para.split(' ');
          let currentLine = '';
          
          for (const word of words) {
            if (currentLine.length === 0) {
              currentLine = word;
            } else if (currentLine.length + 1 + word.length <= wrapLimit) {
              currentLine += ' ' + word;
            } else {
              console.log(` ${textColor}${currentLine}${reset}`);
              currentLine = word;
            }
          }
          if (currentLine.length > 0) {
            console.log(` ${textColor}${currentLine}${reset}`);
          }
        }
      } else {
        const typeStr = (msg.type || 'unknown').substring(0, 10).padEnd(10, ' ');
        console.log(` ${payloadColor}┌─ Payload: ${typeStr} ─┐${reset}`);
        console.log(` ${payloadColor}│ Mídia não suportada   │${reset}`);
        console.log(` ${payloadColor}└───────────────────────┘${reset}`);
      }
    });
    
    const statusLine = `─[ Sala: ${currentUserName} & ${partnerName} | ${msgs.length} mensagens exibidas ]─`;
    console.log(`\n\x1b[90m${statusLine.padEnd(50, '─')}\x1b[0m`);
    rl.prompt();
  }

  // Estado Inicial
  let messages = await fetchMessages(20);
  displayMessages(messages);

  // Realtime Subscription
  const messageChannel = supabase.channel('public:messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      async (payload) => {
        const newMsg = payload.new;
        if (newMsg.sender_id === partnerId || newMsg.sender_id === currentUserId) {
          messages = await fetchMessages(20);
          displayMessages(messages);
        }
      }
    )
    .subscribe();

  // Loop de I/O
  rl.on('line', async (line) => {
    const input = line.trim();
    
    if (input === '/exit') {
      supabase.removeChannel(messageChannel);
      rl.close();
      return;
    }

    if (input === '' || input.startsWith('/')) {
      rl.prompt();
      return;
    }

    const { error } = await supabase.from('messages').insert({
      id: randomUUID(),
      sender_id: currentUserId,
      type: 'text',
      text: input,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('\n\x1b[31mErro no transporte:\x1b[0m', error.message);
      rl.prompt();
    }
  });

  rl.on('close', () => {
    console.log('\x1b[36mSessão encerrada.\x1b[0m');
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('\x1b[31mFatal:\x1b[0m', err);
  process.exit(1);
});
