require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

// Exponential backoff configuration
let reconnectAttempts = 0;
const MAX_BACKOFF_TIME = 60000; // 60 seconds maximum

function getBackoffDelay() {
    reconnectAttempts++;
    const delay = Math.min(2000 * Math.pow(2, reconnectAttempts - 1), MAX_BACKOFF_TIME);
    return delay;
}

function resetBackoff() {
    reconnectAttempts = 0;
}

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
        
        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('[BOT] QR Code gerado. Escaneie com WhatsApp:');
                qrcode.generate(qr, { small: true });
            }
            
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                let shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                // Handle specific error codes
                if (statusCode === 401) {
                    console.log('[BOT] ⚠️  Erro 401 (Unauthorized): Nova autenticação necessária. Aguardando novo QR Code...');
                    shouldReconnect = true;
                } else if (statusCode === 515) {
                    console.log('[BOT] ⚠️  Erro 515 (Stream Restart Required): Reconectando...');
                    shouldReconnect = true;
                }
                
                console.log('[BOT] Conexão fechada devido a', lastDisconnect?.error, ', reconectando:', shouldReconnect);
                
                if (shouldReconnect) {
                    const delay = getBackoffDelay();
                    console.log(`[BOT] 🔄 Aguardando ${delay}ms antes de reconectar (tentativa ${reconnectAttempts})...`);
                    setTimeout(() => connectToWhatsApp(), delay);
                } else {
                    console.log('[BOT] ❌ Desconectado. Não será feita reconexão automática.');
                    resetBackoff();
                }
            } else if (connection === 'open') {
                console.log('[BOT] ✓ Conexão aberta com sucesso!');
                resetBackoff(); // Reset backoff on successful connection
            }
        });

        sock.ev.on('messages.upsert', async ({ messages }) => {
            if (!messages || messages.length === 0) return;
            
            const msg = messages[0];
            
            // Ignora mensagens enviadas por mim e que não sejam texto
            if (!msg.message || msg.key.fromMe) return;
            
            const messageText = msg.message.conversation || 
                               msg.message.extendedTextMessage?.text || 
                               '';
            
            if (!messageText) return;
            
            const lowerText = messageText.toLowerCase();
            const from = msg.key.remoteJid;
            
            // Console.log formatado
            console.log(`[BOT] 📱 Mensagem de ${from}:`);
            console.log(`[BOT]    Conteúdo: ${messageText}`);
            
            let response = null;
            
            // Verifica saudações
            if (lowerText.includes('olá') || lowerText.includes('oi') || lowerText.includes('ola')) {
                response = '👋 Olá! Bem-vindo ao sistema de captação de alunos. Como posso ajudar?';
            }
            // Verifica consultas de preço
            else if (lowerText.includes('preço') || lowerText.includes('preco') || lowerText.includes('valor') || lowerText.includes('quanto')) {
                response = 'Olá! A hora/aula é R$ 60. Temos pacotes mensais. Qual matéria você precisa?';
            }
            // Verifica consultas sobre matérias
            else if (lowerText.includes('matemática') || lowerText.includes('matematica') || 
                     lowerText.includes('física') || lowerText.includes('fisica') || 
                     lowerText.includes('cálculo') || lowerText.includes('calculo')) {
                response = 'Eu sou especialista nisso. Você tem alguma prova chegando? Qual a data?';
            }
            // Verifica solicitações de agendamento
            else if (lowerText.includes('agendar')) {
                response = 'Vou verificar minha agenda e te retorno em instantes.';
            }
            
            // Envia resposta se houver
            if (response) {
                try {
                    await sock.sendMessage(from, { text: response });
                    console.log(`[BOT]    ✅ Resposta enviada: ${response}`);
                } catch (error) {
                    console.error(`[BOT]    ❌ Erro ao enviar resposta: ${error.message}`);
                }
            }
        });

        return sock;
    } catch (error) {
        console.error('[BOT] ❌ Erro ao conectar ao WhatsApp:', error.message);
        const delay = getBackoffDelay();
        console.log(`[BOT] 🔄 Tentando reconectar em ${delay}ms (tentativa ${reconnectAttempts})...`);
        setTimeout(() => connectToWhatsApp(), delay);
    }
}

// Inicialização automática
console.log('[BOT] Iniciando WhatsApp Bot...');
connectToWhatsApp().catch(err => {
    console.error('[BOT] Erro ao conectar:', err);
});

// Global error handlers to prevent process termination
// Note: These handlers intentionally do NOT call process.exit() to keep the bot running
// even when unexpected errors occur, as per the fail-safe requirement
process.on('uncaughtException', (error) => {
    console.error('[BOT] ❌ Uncaught Exception:', error.message);
    console.error('[BOT] Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[BOT] ❌ Unhandled Rejection at:', promise);
    console.error('[BOT] Reason:', reason);
});

module.exports = { connectToWhatsApp };
