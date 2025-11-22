# Sistema de Captação de Alunos

Sistema integrado que combina um bot de WhatsApp para atendimento automático e um módulo de marketing para automação de tarefas.

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

## 🚀 Instalação

1. Instale as dependências:
```bash
npm install
```

2. (Opcional) Configure o arquivo `.env` para variáveis de ambiente:
```bash
cp .env.example .env
```

## 💻 Como Executar

### Método 1: Script npm
```bash
npm start
```

### Método 2: Execução direta
```bash
node index.js
```

## 📦 Módulos

### Bot de WhatsApp (`bot.js`)
Bot inteligente de atendimento automático via WhatsApp.

**Características:**
- Conecta-se ao WhatsApp usando Baileys
- Gera QR Code para autenticação
- Responde automaticamente a mensagens com base em palavras-chave:
  - **Saudações**: "olá", "oi" → Mensagem de boas-vindas
  - **Preços**: "preço", "valor", "quanto" → Informações sobre preços
  - **Matérias**: "matemática", "física", "cálculo" → Informações sobre especialização
  - **Agendamento**: "agendar" → Verificação de agenda
- Logs prefixados com `[BOT]`
- Reconexão automática com delay de 3 segundos

### Sistema de Marketing (`marketing.js`)
Sistema automatizado de marketing com múltiplas funcionalidades.

**Características:**
- ⏰ **Cron Jobs**: Tarefas agendadas automaticamente
- 📅 **Calendário Acadêmico**: Monitora provas programadas
- 🎯 **Detecção Inteligente**: Identifica provas que acontecerão em 3 dias
- 🚀 **Facebook Ads**: Simula disparo de campanhas publicitárias
- 📊 **Relatórios Diários**: Gerados às 9h com estatísticas de leads, conversões e mensagens
- ✓ **Checks de Status**: A cada 5 minutos
- 🔍 **Verificação de Provas**: A cada 10 segundos (configurável)
- Logs prefixados com `[MARKETING]`

## 📝 Estrutura do Projeto

```
sistema-captacao-alunos/
├── index.js          # Script principal que importa e executa os módulos
├── bot.js            # Bot de WhatsApp
├── marketing.js      # Sistema de marketing e automação
├── package.json      # Dependências e scripts
├── .gitignore        # Arquivos ignorados pelo git
└── .env              # Variáveis de ambiente (não commitado)
```

## 🔧 Como Funciona

O script `index.js` importa e executa ambos os módulos (`bot.js` e `marketing.js`) simultaneamente:

- Usa `require()` para importar os módulos
- Ambos os módulos inicializam automaticamente ao serem importados
- Os logs de ambos aparecem no mesmo terminal
- Cada módulo tem seu próprio prefixo de log para fácil identificação

## 📊 Logs

Todos os logs aparecem no terminal com prefixos identificadores:
- `[BOT]` - Logs do WhatsApp Bot
- `[MARKETING]` - Logs do sistema de Marketing

## 🎯 Funcionalidades de Marketing

### Calendário Acadêmico
O sistema monitora um calendário de provas e dispara campanhas automaticamente:

```javascript
{
  nome: 'Prova de Cálculo I',
  data: '2025-11-25T00:00:00.000Z',
  status: 'agendada'
}
```

### Facebook Ads Integration
Quando uma prova está a 3 dias de acontecer, o sistema:
1. Detecta a proximidade da prova
2. Dispara uma campanha no Facebook Ads (simulado)
3. Registra a ação nos logs

## 🛑 Parar o Sistema

Pressione `Ctrl+C` no terminal para encerrar o sistema.

## 🔐 Autenticação WhatsApp

Na primeira execução, será necessário:
1. Escanear o QR Code com seu WhatsApp
2. Os dados de autenticação serão salvos em `auth_info_baileys/`
3. Nas próximas execuções, a conexão será automática

## 📄 Licença

ISC
