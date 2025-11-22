require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const cheerio = require('cheerio');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

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

// Função para gerar banner de anúncio
function gerarBannerAnuncio(nomeProva, dataProva) {
  try {
    console.log(`[MARKETING] 🎨 Gerando banner para: ${nomeProva} - ${dataProva}`);
    
    // Criar canvas 1080x1920 (formato Stories)
    const width = 1080;
    const height = 1920;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Pintar fundo azul escuro
    ctx.fillStyle = '#001a33';
    ctx.fillRect(0, 0, width, height);
    
    // Configurar texto - "Atenção Alunos!" em branco
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Atenção Alunos!', width / 2, height * 0.25);
    
    // Texto do nome da prova em amarelo
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 65px Arial';
    
    // Quebrar texto se for muito longo
    const maxWidth = width * 0.9;
    const nomeText = nomeProva;
    const words = nomeText.split(' ');
    let line = '';
    let y = height * 0.45;
    const lineHeight = 80;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, width / 2, y);
        line = words[i] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, width / 2, y);
    
    // Data da prova em branco
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 55px Arial';
    ctx.fillText(`Dia ${dataProva}`, width / 2, height * 0.65);
    
    // Call-to-action no rodapé em amarelo
    ctx.fillStyle = '#ffcc00';
    ctx.font = '45px Arial';
    ctx.fillText('Garanta sua aula de revisão.', width / 2, height * 0.85);
    ctx.fillText('Link na Bio.', width / 2, height * 0.90);
    
    // Salvar imagem na raiz do projeto com timestamp
    const timestamp = new Date().getTime();
    const filename = `anuncio_gerado_${timestamp}.png`;
    const outputPath = path.join(__dirname, '..', filename);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`[MARKETING] ✓ Banner salvo em: ${outputPath}`);
    return outputPath;
    
  } catch (error) {
    console.error('[MARKETING] ✗ Erro ao gerar banner:', error.message);
    return null;
  }
}

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
      
      // Gerar banner de anúncio
      const dataFormatada = dataProva.toLocaleDateString('pt-BR');
      const bannerPath = gerarBannerAnuncio(prova.nome, dataFormatada);
      
      if (bannerPath) {
        console.log(`[MARKETING] ✓ Banner criado com sucesso para campanha`);
      } else {
        console.log(`[MARKETING] ⚠ Campanha continuará sem banner`);
      }
      
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
    buscarDatasReais,
    gerarBannerAnuncio
};
