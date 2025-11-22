require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const cheerio = require('cheerio');

console.log('[MARKETING] Iniciando módulo de Marketing...');

// Constantes para configuração
const EVENTS_URL = process.env.EVENTS_URL || 'https://vestibular.brasilescola.uol.com.br/enem/calendario-enem.htm';
const DATE_REGEX = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g;
const MIN_EVENT_NAME_LENGTH = 5;
const MAX_EVENT_NAME_LENGTH = 100;

// Calendário acadêmico com as provas programadas
const calendarioAcademico = [
  {
    nome: 'Prova de Cálculo I',
    data: '2025-11-25T00:00:00.000Z',
    status: 'agendada'
  },
  {
    nome: 'Prova de Física II',
    data: '2025-11-28T00:00:00.000Z',
    status: 'agendada'
  },
  {
    nome: 'Prova de Algoritmos',
    data: '2025-12-01T00:00:00.000Z',
    status: 'agendada'
  }
];

// Função para buscar datas reais de eventos acadêmicos
async function buscarDatasReais() {
  try {
    console.log('[MARKETING] 🔍 Buscando eventos reais...');
    
    const response = await axios.get(EVENTS_URL);
    const $ = cheerio.load(response.data);
    
    const eventos = [];
    const hoje = new Date();
    const daquiTrintaDias = new Date();
    daquiTrintaDias.setDate(hoje.getDate() + 30);
    
    // Tentar encontrar tabelas ou listas que contenham datas
    // Procurar em tabelas
    $('table').each((i, table) => {
      $(table).find('tr').each((j, row) => {
        const cells = $(row).find('td, th');
        if (cells.length >= 2) {
          const textoCompleto = $(row).text();
          const matches = textoCompleto.match(DATE_REGEX);
          
          if (matches) {
            matches.forEach(dataStr => {
              // Extrair nome do evento (texto antes da data)
              const partes = textoCompleto.split(dataStr);
              const nomeEvento = partes[0].trim();
              
              if (nomeEvento && nomeEvento.length > MIN_EVENT_NAME_LENGTH && nomeEvento.length < MAX_EVENT_NAME_LENGTH) {
                try {
                  // Converter data
                  const [dia, mes, ano] = dataStr.split(/[\/\-]/);
                  let anoCompleto = ano.length === 2 ? `20${ano}` : ano;
                  const dataEvento = new Date(`${anoCompleto}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`);
                  
                  // Filtrar apenas eventos nos próximos 30 dias
                  if (dataEvento >= hoje && dataEvento <= daquiTrintaDias) {
                    eventos.push({
                      nome: nomeEvento,
                      data: dataEvento.toISOString(),
                      dataFormatada: dataStr
                    });
                  }
                } catch (e) {
                  // Ignorar erros de conversão de data
                }
              }
            });
          }
        }
      });
    });
    
    // Procurar em listas
    $('ul, ol').each((i, list) => {
      $(list).find('li').each((j, item) => {
        const texto = $(item).text();
        const matches = texto.match(DATE_REGEX);
        
        if (matches) {
          matches.forEach(dataStr => {
            const partes = texto.split(dataStr);
            const nomeEvento = partes[0].trim();
            
            if (nomeEvento && nomeEvento.length > MIN_EVENT_NAME_LENGTH && nomeEvento.length < MAX_EVENT_NAME_LENGTH) {
              try {
                const [dia, mes, ano] = dataStr.split(/[\/\-]/);
                let anoCompleto = ano.length === 2 ? `20${ano}` : ano;
                const dataEvento = new Date(`${anoCompleto}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`);
                
                if (dataEvento >= hoje && dataEvento <= daquiTrintaDias) {
                  eventos.push({
                    nome: nomeEvento,
                    data: dataEvento.toISOString(),
                    dataFormatada: dataStr
                  });
                }
              } catch (e) {
                // Ignorar erros de conversão de data
              }
            }
          });
        }
      });
    });
    
    console.log(`[MARKETING] ✓ ${eventos.length} eventos encontrados nos próximos 30 dias`);
    return eventos;
    
  } catch (error) {
    console.error('[MARKETING] ✗ Erro ao buscar datas reais:', error.message);
    console.error('[MARKETING] Stack trace:', error.stack);
    // Em caso de erro, retornar array vazio
    return [];
  }
}

// Função placeholder para enviar campanha para o Facebook Ads
async function postToFacebookAds(campaignName) {
  // TODO: Implementar chamada real para Facebook Ads API
  // const response = await axios.post('https://graph.facebook.com/v18.0/act_<AD_ACCOUNT_ID>/campaigns', {
  //   name: campaignName,
  //   objective: 'OUTCOME_ENGAGEMENT',
  //   status: 'ACTIVE',
  //   access_token: process.env.FACEBOOK_ACCESS_TOKEN
  // });
  // return response.data;
  
  console.log(`[MARKETING] 🚀 [Facebook Ads API] Campanha "${campaignName}" seria criada aqui`);
}

// Função para verificar provas que estão a 3 dias de acontecer
function verificarProvasProximas() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Zerar horas para comparação precisa
  
  const daquiTresDias = new Date(hoje);
  daquiTresDias.setDate(hoje.getDate() + 3);
  
  calendarioAcademico.forEach(prova => {
    const dataProva = new Date(prova.data);
    dataProva.setHours(0, 0, 0, 0);
    
    // Verifica se a prova é exatamente daqui a 3 dias
    if (dataProva.getTime() === daquiTresDias.getTime()) {
      console.log(`[MARKETING] 🚀 DISPARANDO ANÚNCIO NO FACEBOOK ADS: ${prova.nome} chegando! Estude agora.`);
      
      // Chama a função placeholder para simular envio ao Facebook Ads
      postToFacebookAds(`Campanha: ${prova.nome}`);
    }
  });
}

// Tarefa agendada: Enviar relatório diário às 9h
cron.schedule('0 9 * * *', () => {
    console.log('[MARKETING] ⏰ Executando tarefa agendada: Relatório diário');
    sendDailyReport();
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
});

// Tarefa de demonstração: A cada 5 minutos
cron.schedule('*/5 * * * *', () => {
    console.log('[MARKETING] ✓ Check de status realizado:', new Date().toLocaleString('pt-BR'));
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
});

// Verificar provas próximas a cada 10 segundos (para fins de teste)
cron.schedule('*/10 * * * * *', async () => {
  const agora = new Date().toLocaleString('pt-BR');
  console.log(`[MARKETING] [${agora}] Verificando eventos próximos...`);
  
  // Buscar eventos reais
  const eventosReais = await buscarDatasReais();
  
  // Para cada evento encontrado, verificar se está próximo e exibir oportunidade
  eventosReais.forEach(evento => {
    console.log(`[MARKETING] 🎯 OPORTUNIDADE DE ANÚNCIO: ${evento.nome} em ${evento.dataFormatada}`);
  });
  
  // Também verificar o calendário fixo (manter compatibilidade)
  verificarProvasProximas();
});

// Função para enviar relatório diário
async function sendDailyReport() {
    try {
        console.log('[MARKETING] 📊 Gerando relatório diário...');
        
        // Simulação de coleta de dados
        // TODO: Substituir por coleta real de dados
        const MAX_LEADS = 50;
        const MAX_CONVERSIONS = 20;
        const MAX_MESSAGES = 100;
        
        const report = {
            date: new Date().toLocaleDateString('pt-BR'),
            newLeads: Math.floor(Math.random() * MAX_LEADS),
            conversions: Math.floor(Math.random() * MAX_CONVERSIONS),
            messages: Math.floor(Math.random() * MAX_MESSAGES)
        };
        
        console.log('[MARKETING] Relatório:', JSON.stringify(report, null, 2));
        console.log('[MARKETING] ✓ Relatório processado com sucesso!');
        
        return report;
    } catch (error) {
        console.error('[MARKETING] ✗ Erro ao gerar relatório:', error.message);
    }
}

// Função para campanhas de marketing
async function sendMarketingCampaign(campaign) {
    console.log('[MARKETING] 📢 Iniciando campanha:', campaign.name);
    // Lógica de campanha aqui
    console.log('[MARKETING] ✓ Campanha enviada!');
}

// Log de inicialização
console.log('[MARKETING] ✓ Sistema de Marketing ativo!');
console.log('[MARKETING] ⏰ Tarefas agendadas:');
console.log('[MARKETING]   - Relatório diário: 9h00');
console.log('[MARKETING]   - Check de status: A cada 5 minutos');
console.log('[MARKETING]   - Verificação de provas próximas: A cada 10 segundos');

module.exports = {
    sendDailyReport,
    sendMarketingCampaign,
    postToFacebookAds,
    verificarProvasProximas,
    buscarDatasReais
};
