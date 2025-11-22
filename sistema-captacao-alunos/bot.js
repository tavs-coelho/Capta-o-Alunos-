require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const OpenAI = require('openai');

// Verifica se a API key está configurada
if (!process.env.OPENAI_API_KEY) {
    console.error('[BOT] ❌ Erro: OPENAI_API_KEY não configurada!');
    console.error('[BOT] Por favor, configure a variável de ambiente OPENAI_API_KEY no arquivo .env');
    console.error('[BOT] Exemplo: OPENAI_API_KEY=sk-sua-chave-aqui');
    process.exit(1);
}

// Inicializa o cliente OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Constantes de configuração
const PRICE_PER_HOUR = 80; // Valor em reais

// Objeto global para armazenar estados dos usuários
const userStates = {};

/**
 * Função para gerar o System Prompt baseado no estado do usuário
 */
function getSystemPrompt(estado) {
    const basePrompt = `Você é um assistente de captação de alunos para aulas particulares. 
O usuário está no estágio: ${estado}.

IMPORTANTE: Você DEVE retornar suas respostas SEMPRE no formato JSON:
{"texto": "sua mensagem aqui", "novo_estado": "ESTADO_AQUI"}

`;

    const stateInstructions = {
        'INICIO': `Neste estágio INICIO, sua missão é:
1. Tire dúvidas básicas do aluno
2. Seja amigável e acolhedor
3. Tente descobrir qual matéria o aluno precisa (matemática, física, cálculo, etc.)
4. Quando você identificar a matéria que o aluno precisa, mude o estado para "ORCAMENTO"
5. Se ainda não souber a matéria, mantenha o estado como "INICIO"`,

        'ORCAMENTO': `Neste estágio ORCAMENTO, sua missão é:
1. Informe que o valor das aulas é R$ ${PRICE_PER_HOUR} por hora
2. Pergunte sobre a disponibilidade de horários do aluno
3. Se o aluno aceitar o valor e demonstrar interesse em continuar, mude o estado para "FECHAMENTO"
4. Se o aluno ainda tiver dúvidas sobre valor, mantenha o estado como "ORCAMENTO"`,

        'FECHAMENTO': `Neste estágio FECHAMENTO, sua missão é:
1. Peça a confirmação final do aluno
2. Informe que você enviará os dados do Pix para pagamento
3. Seja cordial e profissional
4. Mantenha o estado como "FECHAMENTO" até que o processo seja concluído`
    };

    return basePrompt + (stateInstructions[estado] || stateInstructions['INICIO']);
}

/**
 * Função para interagir com a OpenAI e obter resposta baseada no estado
 */
async function getAIResponse(userMessage, estado) {
    try {
        const systemPrompt = getSystemPrompt(estado);
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.7,
        });

        // Verifica se há resposta válida
        if (!completion.choices || completion.choices.length === 0) {
            throw new Error('Nenhuma resposta recebida da OpenAI');
        }

        const aiResponse = completion.choices[0].message.content;
        
        // Tenta fazer parse do JSON retornado pela IA
        try {
            const parsed = JSON.parse(aiResponse);
            return {
                texto: parsed.texto || aiResponse,
                novo_estado: parsed.novo_estado || estado
            };
        } catch (parseError) {
            // Se não conseguir fazer parse, retorna resposta como texto e mantém o estado
            console.log('[BOT]    ⚠️  Resposta da IA não está em formato JSON, mantendo estado');
            return {
                texto: aiResponse,
                novo_estado: estado
            };
        }
    } catch (error) {
        console.error('[BOT]    ❌ Erro ao chamar OpenAI:', error.message);
        throw error;
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
        
        const from = msg.key.remoteJid;
        
        // Console.log formatado
        console.log(`[BOT] 📱 Mensagem de ${from}:`);
        console.log(`[BOT]    Conteúdo: ${messageText}`);
        
        // Verifica se o usuário já tem um estado. Se não, define como 'INICIO'
        if (!userStates[from]) {
            userStates[from] = 'INICIO';
            console.log(`[BOT]    🆕 Novo usuário! Estado inicial: INICIO`);
        }
        
        const currentState = userStates[from];
        console.log(`[BOT]    📊 Estado atual: ${currentState}`);
        
        try {
            // Obtém resposta da IA com contexto de estado
            const aiResponse = await getAIResponse(messageText, currentState);
            
            // Atualiza o estado do usuário
            userStates[from] = aiResponse.novo_estado;
            console.log(`[BOT]    🔄 Novo estado: ${aiResponse.novo_estado}`);
            
            // Envia a resposta
            await sock.sendMessage(from, { text: aiResponse.texto });
            console.log(`[BOT]    ✅ Resposta enviada: ${aiResponse.texto}`);
        } catch (error) {
            console.error(`[BOT]    ❌ Erro ao processar mensagem: ${error.message}`);
            
            // Fallback: resposta padrão em caso de erro
            const fallbackResponse = 'Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente.';
            try {
                await sock.sendMessage(from, { text: fallbackResponse });
            } catch (sendError) {
                console.error(`[BOT]    ❌ Erro ao enviar resposta de fallback: ${sendError.message}`);
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
