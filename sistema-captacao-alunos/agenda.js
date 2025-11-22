require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Módulo de integração com Google Calendar
 * Gerencia agendamentos de aulas particulares
 */

// Caminho para o arquivo de credenciais
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

// Configuração de horário de funcionamento
const HORARIO_INICIO = 8; // 08:00
const HORARIO_FIM = 18;   // 18:00
const DURACAO_SLOT = 60;  // 1 hora em minutos

/**
 * Carrega e configura a autenticação com Google Calendar
 * Suporta tanto Service Account (JWT) quanto OAuth2
 * @returns {Promise<Object>} Cliente autenticado do Google Calendar
 */
async function getAuthenticatedClient() {
    try {
        // Verifica se o arquivo de credenciais existe
        if (!fs.existsSync(CREDENTIALS_PATH)) {
            throw new Error(`Arquivo credentials.json não encontrado em ${CREDENTIALS_PATH}`);
        }

        // Carrega as credenciais do arquivo
        const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

        // Detecta o tipo de credencial (Service Account ou OAuth2)
        if (credentials.type === 'service_account') {
            // Autenticação JWT (Service Account)
            const auth = new google.auth.JWT({
                email: credentials.client_email,
                key: credentials.private_key,
                scopes: ['https://www.googleapis.com/auth/calendar']
            });

            await auth.authorize();
            console.log('[AGENDA] ✓ Autenticação JWT (Service Account) realizada com sucesso');
            return auth;
        } else {
            // Autenticação OAuth2
            const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
            const oAuth2Client = new google.auth.OAuth2(
                client_id,
                client_secret,
                redirect_uris[0]
            );

            // TODO: Implementar fluxo completo de OAuth2 com token refresh
            // Por enquanto, assumimos que o token já está configurado via variáveis de ambiente
            if (process.env.GOOGLE_ACCESS_TOKEN) {
                oAuth2Client.setCredentials({
                    access_token: process.env.GOOGLE_ACCESS_TOKEN,
                    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
                });
                console.log('[AGENDA] ✓ Autenticação OAuth2 realizada com sucesso');
                return oAuth2Client;
            } else {
                throw new Error('Para OAuth2, configure GOOGLE_ACCESS_TOKEN e GOOGLE_REFRESH_TOKEN no .env');
            }
        }
    } catch (error) {
        console.error('[AGENDA] ✗ Erro na autenticação:', error.message);
        throw error;
    }
}

/**
 * Lista horários livres de 1 hora em um determinado dia
 * @param {string} dia - Data no formato YYYY-MM-DD
 * @returns {Promise<Array>} Lista de slots livres no formato { inicio, fim }
 */
async function listarHorariosLivres(dia) {
    try {
        console.log(`[AGENDA] 🔍 Buscando horários livres para ${dia}...`);

        // Valida o formato da data
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) {
            throw new Error('Data deve estar no formato YYYY-MM-DD');
        }

        // Obtém cliente autenticado
        const auth = await getAuthenticatedClient();
        const calendar = google.calendar({ version: 'v3', auth });

        // Define o intervalo do dia (08:00 às 18:00)
        const dataInicio = new Date(`${dia}T${HORARIO_INICIO.toString().padStart(2, '0')}:00:00`);
        const dataFim = new Date(`${dia}T${HORARIO_FIM.toString().padStart(2, '0')}:00:00`);

        // Busca eventos do dia no calendário 'primary'
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: dataInicio.toISOString(),
            timeMax: dataFim.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
        });

        const eventos = response.data.items || [];
        console.log(`[AGENDA] 📅 ${eventos.length} eventos encontrados no dia ${dia}`);

        // Gera todos os slots possíveis de 1 hora entre 08:00 e 18:00
        const slotsDisponiveis = [];
        const totalSlots = HORARIO_FIM - HORARIO_INICIO; // 10 slots de 1 hora

        for (let i = 0; i < totalSlots; i++) {
            const horaInicio = HORARIO_INICIO + i;
            const horaFim = horaInicio + 1;

            const slotInicio = new Date(`${dia}T${horaInicio.toString().padStart(2, '0')}:00:00`);
            const slotFim = new Date(`${dia}T${horaFim.toString().padStart(2, '0')}:00:00`);

            // Verifica se o slot está livre (não conflita com nenhum evento)
            const slotLivre = !eventos.some(evento => {
                const eventoInicio = new Date(evento.start.dateTime || evento.start.date);
                const eventoFim = new Date(evento.end.dateTime || evento.end.date);

                // Verifica se há sobreposição
                return (slotInicio < eventoFim && slotFim > eventoInicio);
            });

            if (slotLivre) {
                slotsDisponiveis.push({
                    inicio: slotInicio.toISOString(),
                    fim: slotFim.toISOString(),
                    horario: `${horaInicio.toString().padStart(2, '0')}:00 - ${horaFim.toString().padStart(2, '0')}:00`
                });
            }
        }

        console.log(`[AGENDA] ✓ ${slotsDisponiveis.length} horários livres encontrados`);
        return slotsDisponiveis;

    } catch (error) {
        console.error('[AGENDA] ✗ Erro ao listar horários livres:', error.message);
        throw error;
    }
}

/**
 * Cria um evento de aula particular no Google Calendar
 * @param {string} nomeAluno - Nome do aluno
 * @param {string} dataInicio - Data/hora de início no formato ISO 8601 (YYYY-MM-DDTHH:mm:ss)
 * @returns {Promise<Object>} Objeto com informações do evento criado, incluindo link do Google Meet
 */
async function criarEventoAula(nomeAluno, dataInicio) {
    try {
        console.log(`[AGENDA] 📝 Criando evento de aula para ${nomeAluno}...`);

        // Valida o formato da data/hora
        const dataInicioObj = new Date(dataInicio);
        if (isNaN(dataInicioObj.getTime())) {
            throw new Error('Data de início inválida. Use formato ISO 8601: YYYY-MM-DDTHH:mm:ss');
        }

        // Calcula data/hora de fim (1 hora depois)
        const dataFimObj = new Date(dataInicioObj.getTime() + DURACAO_SLOT * 60 * 1000);

        // Obtém cliente autenticado
        const auth = await getAuthenticatedClient();
        const calendar = google.calendar({ version: 'v3', auth });

        // Cria o evento
        const evento = {
            summary: `Aula Particular - ${nomeAluno}`,
            description: 'Agendado via Bot WhatsApp',
            start: {
                dateTime: dataInicioObj.toISOString(),
                timeZone: 'America/Sao_Paulo'
            },
            end: {
                dateTime: dataFimObj.toISOString(),
                timeZone: 'America/Sao_Paulo'
            },
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 1 dia antes
                    { method: 'popup', minutes: 30 }        // 30 minutos antes
                ]
            }
        };

        // Insere o evento no calendário
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: evento,
            conferenceDataVersion: 1 // Necessário para criar Google Meet
        });

        const eventoCriado = response.data;
        const meetLink = eventoCriado.conferenceData?.entryPoints?.find(
            ep => ep.entryPointType === 'video'
        )?.uri || 'Link do Google Meet não disponível';

        console.log(`[AGENDA] ✓ Evento criado com sucesso!`);
        console.log(`[AGENDA]   ID: ${eventoCriado.id}`);
        console.log(`[AGENDA]   Link: ${eventoCriado.htmlLink}`);
        console.log(`[AGENDA]   Google Meet: ${meetLink}`);

        return {
            id: eventoCriado.id,
            titulo: eventoCriado.summary,
            inicio: eventoCriado.start.dateTime,
            fim: eventoCriado.end.dateTime,
            descricao: eventoCriado.description,
            linkEvento: eventoCriado.htmlLink,
            linkMeet: meetLink
        };

    } catch (error) {
        console.error('[AGENDA] ✗ Erro ao criar evento:', error.message);
        throw error;
    }
}

// Exporta as funções
module.exports = {
    listarHorariosLivres,
    criarEventoAula,
    getAuthenticatedClient
};

// Se executado diretamente, faz um teste básico
if (require.main === module) {
    console.log('[AGENDA] Modo de teste - Módulo de Agenda do Google Calendar');
    console.log('[AGENDA] Este módulo está pronto para uso!');
    console.log('[AGENDA]');
    console.log('[AGENDA] Funções disponíveis:');
    console.log('[AGENDA]   - listarHorariosLivres(dia)');
    console.log('[AGENDA]   - criarEventoAula(nomeAluno, dataInicio)');
    console.log('[AGENDA]');
    console.log('[AGENDA] Exemplo de uso:');
    console.log('[AGENDA]   const agenda = require("./agenda.js");');
    console.log('[AGENDA]   const horarios = await agenda.listarHorariosLivres("2025-11-25");');
    console.log('[AGENDA]   const evento = await agenda.criarEventoAula("João Silva", "2025-11-25T10:00:00");');
}
