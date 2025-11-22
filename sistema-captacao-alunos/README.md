# Sistema de Captação de Alunos - Marketing Automation

Sistema automatizado de marketing para instituições de ensino, com disparo de campanhas publicitárias baseado no calendário acadêmico.

## 📋 Funcionalidades

### Marketing Automation (marketing.js)

Script de automação de marketing que monitora o calendário acadêmico e dispara campanhas no Facebook Ads quando as provas estão próximas.

**Características:**
- ⏰ **Cron Job**: Execução automática a cada 10 segundos (configurado para testes)
- 📅 **Calendário Acadêmico**: Lista de provas com nome, data e status
- 🎯 **Detecção Inteligente**: Identifica provas que acontecerão em exatamente 3 dias
- 🚀 **Disparo Automático**: Simula envio de campanhas para Facebook Ads
- 📊 **Logging**: Registra todas as verificações e disparos

## 🚀 Como Usar

### Pré-requisitos

```bash
npm install
```

### Executar o Script de Marketing

```bash
node marketing.js
```

O script iniciará e verificará o calendário acadêmico a cada 10 segundos, exibindo:
```
📅 Sistema de Marketing Automático iniciado!
⏰ Verificando calendário acadêmico a cada 10 segundos...

[22/11/2025, 16:10:40] Verificando provas próximas...
🚀 DISPARANDO ANÚNCIO NO FACEBOOK ADS: Prova de Cálculo I chegando! Estude agora.
[Facebook Ads API] Campanha "Campanha: Prova de Cálculo I" seria criada aqui
```

## 📝 Estrutura do Calendário Acadêmico

O calendário é definido como um array de objetos:

```javascript
const calendarioAcademico = [
  {
    nome: 'Prova de Cálculo I',
    data: '2025-11-25T00:00:00.000Z',  // Data em formato ISO
    status: 'agendada'
  },
  // ... mais provas
];
```

## 🔧 Configuração do Cron

O padrão cron atual é `*/10 * * * * *` (a cada 10 segundos para testes).

Para produção, recomenda-se alterar para:
- `0 * * * *` - A cada hora
- `0 0 * * *` - Uma vez por dia à meia-noite
- `0 9 * * *` - Diariamente às 9h

## 🎯 Integração com Facebook Ads

A função `postToFacebookAds()` está preparada para integração real. Para implementar:

1. Configure as variáveis de ambiente no arquivo `.env`:
```env
FACEBOOK_ACCESS_TOKEN=seu_token_aqui
FACEBOOK_AD_ACCOUNT_ID=seu_account_id_aqui
```

2. Descomente e ajuste o código da função `postToFacebookAds()`:
```javascript
async function postToFacebookAds(campaignName) {
  const response = await axios.post(
    `https://graph.facebook.com/v18.0/act_${process.env.FACEBOOK_AD_ACCOUNT_ID}/campaigns`,
    {
      name: campaignName,
      objective: 'OUTCOME_ENGAGEMENT',
      status: 'ACTIVE',
      access_token: process.env.FACEBOOK_ACCESS_TOKEN
    }
  );
  return response.data;
}
```

## 📦 Dependências

- **node-cron**: ^4.2.1 - Agendamento de tarefas
- **axios**: ^1.13.2 - Cliente HTTP para chamadas de API
- **dotenv**: ^17.2.3 - Gerenciamento de variáveis de ambiente

## 🛠️ Desenvolvimento

Para adicionar novas provas ao calendário, edite o array `calendarioAcademico` em `marketing.js`:

```javascript
{
  nome: 'Nova Prova',
  data: '2025-12-15T00:00:00.000Z',
  status: 'agendada'
}
```

## ⚠️ Notas Importantes

- O script verifica provas que ocorrerão **exatamente** em 3 dias
- Todas as datas devem estar no formato ISO 8601
- O sistema compara apenas as datas (dia/mês/ano), ignorando horários
- Para produção, considere implementar controle de duplicatas de campanhas
