require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Configuração da OpenAI
if (!process.env.OPENAI_API_KEY) {
    console.error('[BOT] ❌ ERRO: OPENAI_API_KEY não encontrada no arquivo .env');
    console.error('[BOT] Por favor, configure sua chave de API da OpenAI no arquivo .env');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Prompt do sistema para o assistente de IA
const SYSTEM_PROMPT = 'Você é o assistente comercial de um professor particular de Exatas e Programação. Seu objetivo é ser simpático, entender a dor do aluno e agendar uma aula. O preço base é R$ 60/hora. Nunca dê respostas muito longas. Use emojis moderados. Se o aluno perguntar datas de provas, diga que vai verificar.';

// Função para transcrever áudio usando OpenAI Whisper
async function transcreverAudio(audioBuffer) {
    try {
        // Salvar temporariamente o áudio
        const tempAudioPath = path.join(__dirname, 'temp_audio.ogg');
        fs.writeFileSync(tempAudioPath, audioBuffer);
        
        // Enviar para OpenAI Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempAudioPath),
            model: 'whisper-1',
        });
        
        // Remover arquivo temporário
        fs.unlinkSync(tempAudioPath);
        
        return transcription.text;
    } catch (error) {
        console.error('[BOT] ❌ Erro ao transcrever áudio:', error.message);
        throw error;
    }
}

// Função para gerar resposta usando IA
async function gerarRespostaIA(mensagemUsuario) {
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: mensagemUsuario
                }
            ],
            temperature: 0.7,
            max_tokens: 200
        });

        if (!completion.choices || completion.choices.length === 0) {
            throw new Error('Empty response from OpenAI API');
        }
        
        const messageContent = completion.choices[0]?.message?.content;
        if (!messageContent || messageContent.trim() === '') {
            throw new Error('Invalid message content from OpenAI API');
        }
        
        return messageContent;
    } catch (error) {
        console.error('[BOT] ❌ Erro ao gerar resposta da IA:', error.message);
        return 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em instantes. 🙏';
    }
}

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
            
            // Ignora mensagens enviadas por mim
            if (!msg.message || msg.key.fromMe) return;
            
            const from = msg.key.remoteJid;
            let messageText = '';
            
            // Verifica se é mensagem de áudio
            if (msg.message.audioMessage) {
                console.log(`[BOT] 🎤 Áudio recebido de ${from}`);
                
                try {
                    // Baixa o áudio
                    const audioBuffer = await downloadMediaMessage(msg, 'buffer', {});
                    
                    // Transcreve o áudio
                    messageText = await transcreverAudio(audioBuffer);
                    console.log(`[BOT] 📝 [Áudio Transcrito]: ${messageText}`);
                } catch (error) {
                    console.error(`[BOT] ❌ Erro ao processar áudio: ${error.message}`);
                    await sock.sendMessage(from, { text: 'Desculpe, não consegui processar seu áudio. Pode enviar uma mensagem de texto?' });
                    return;
                }
            } else {
                // Processa mensagem de texto normal
                messageText = msg.message.conversation || 
                             msg.message.extendedTextMessage?.text || 
                             '';
                
                if (!messageText) return;
            }
            
            // Salvar lead (a função verifica internamente se o número já existe)
            salvarLead(from, messageText);
            
            // Console.log formatado
            console.log(`[BOT] 📱 Mensagem de ${from}:`);
            console.log(`[BOT]    Conteúdo: ${messageText}`);
            
            // Gera resposta usando IA
            try {
                const response = await gerarRespostaIA(messageText);
                await sock.sendMessage(from, { text: response });
                console.log(`[BOT]    ✅ Resposta enviada: ${response}`);
            } catch (error) {
                console.error(`[BOT]    ❌ Erro ao enviar resposta: ${error.message}`);
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
