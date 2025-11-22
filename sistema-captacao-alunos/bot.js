require('dotenv').config();
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'info' }),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('[BOT] QR Code gerado. Escaneie com WhatsApp:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[BOT] Conexão fechada. Reconectando:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('[BOT] ✓ WhatsApp Bot conectado com sucesso!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            console.log('[BOT] Mensagem recebida:', msg.key.remoteJid);
            
            const messageText = msg.message?.conversation || 
                              msg.message?.extendedTextMessage?.text || '';
            
            // Resposta automática simples
            if (messageText.toLowerCase().includes('olá') || 
                messageText.toLowerCase().includes('oi')) {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: '👋 Olá! Bem-vindo ao sistema de captação de alunos. Como posso ajudar?'
                });
                console.log('[BOT] Resposta automática enviada');
            }
        }
    });

    return sock;
}

// Inicialização automática
console.log('[BOT] Iniciando WhatsApp Bot...');
connectToWhatsApp().catch(err => {
    console.error('[BOT] Erro ao conectar:', err);
});

module.exports = { connectToWhatsApp };
