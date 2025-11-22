const cron = require('node-cron');
const axios = require('axios');

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
  
  console.log(`[Facebook Ads API] Campanha "${campaignName}" seria criada aqui`);
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
      console.log(`🚀 DISPARANDO ANÚNCIO NO FACEBOOK ADS: ${prova.nome} chegando! Estude agora.`);
      
      // Chama a função placeholder para simular envio ao Facebook Ads
      postToFacebookAds(`Campanha: ${prova.nome}`);
    }
  });
}

// Agendar tarefa cron para rodar a cada 10 segundos (para fins de teste)
console.log('📅 Sistema de Marketing Automático iniciado!');
console.log('⏰ Verificando calendário acadêmico a cada 10 segundos...\n');

cron.schedule('*/10 * * * * *', () => {
  const agora = new Date().toLocaleString('pt-BR');
  console.log(`[${agora}] Verificando provas próximas...`);
  verificarProvasProximas();
});
