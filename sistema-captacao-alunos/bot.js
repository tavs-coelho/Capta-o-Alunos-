const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexão fechada devido a', lastDisconnect?.error, ', reconectando:', shouldReconnect);
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Conexão aberta com sucesso!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
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
        console.log(`📱 Mensagem de ${from}:`);
        console.log(`   Conteúdo: ${messageText}`);
        
        let response = null;
        
        // Verifica consultas de preço
        if (lowerText.includes('preço') || lowerText.includes('valor') || lowerText.includes('quanto')) {
            response = 'Olá! A hora/aula é R$ 60. Temos pacotes mensais. Qual matéria você precisa?';
        }
        // Verifica consultas sobre matérias
        else if (lowerText.includes('matemática') || lowerText.includes('física') || lowerText.includes('cálculo')) {
            response = 'Eu sou especialista nisso. Você tem alguma prova chegando? Qual a data?';
        }
        // Verifica solicitações de agendamento
        else if (lowerText.includes('agendar')) {
            response = 'Vou verificar minha agenda e te retorno em instantes.';
        }
        
        // Envia resposta se houver
        if (response) {
            await sock.sendMessage(from, { text: response });
            console.log(`   ✅ Resposta enviada: ${response}`);
        }
    });
}

connectToWhatsApp();
