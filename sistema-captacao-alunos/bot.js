require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

function salvarLead(numero, mensagemInicial) {
    const leadsPath = 'leads.json';
    let leads = [];
    
    // Ler o arquivo leads.json, se existir
    if (fs.existsSync(leadsPath)) {
        try {
            const data = fs.readFileSync(leadsPath, 'utf8');
            leads = JSON.parse(data);
        } catch (error) {
            console.error(`[BOT] ⚠️  Erro ao ler leads.json: ${error.message}. Iniciando com array vazio.`);
            leads = [];
        }
    }
    
    // Verificar se o número já existe
    const leadExiste = leads.some(lead => lead.id === numero);
    
    if (!leadExiste) {
        // Adicionar novo lead
        const novoLead = {
            id: numero,
            data: new Date().toISOString(),
            interesse: mensagemInicial,
            status: 'novo'
        };
        leads.push(novoLead);
        
        // Salvar o arquivo atualizado
        try {
            fs.writeFileSync(leadsPath, JSON.stringify(leads, null, 2), 'utf8');
            console.log(`[BOT] 💾 Novo lead salvo: ${numero}`);
        } catch (error) {
            console.error(`[BOT] ❌ Erro ao salvar lead: ${error.message}`);
        }
    }
}

async function connectToWhatsApp() {
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
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[BOT] Conexão fechada devido a', lastDisconnect?.error, ', reconectando:', shouldReconnect);
            
            if (shouldReconnect) {
                // Add delay before reconnecting to avoid rapid reconnection attempts
                setTimeout(() => connectToWhatsApp(), 3000);
            }
        } else if (connection === 'open') {
            console.log('[BOT] ✓ Conexão aberta com sucesso!');
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
        
        // Salvar lead (a função verifica internamente se o número já existe)
        salvarLead(from, messageText);
        
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
}

// Inicialização automática
console.log('[BOT] Iniciando WhatsApp Bot...');
connectToWhatsApp().catch(err => {
    console.error('[BOT] Erro ao conectar:', err);
});

module.exports = { connectToWhatsApp };
