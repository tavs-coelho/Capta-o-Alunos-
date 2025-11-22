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
- Conecta-se ao WhatsApp usando Baileys
- Gera QR Code para autenticação
- Responde automaticamente a mensagens
- Logs prefixados com `[BOT]`

### Sistema de Marketing (`marketing.js`)
- Agendamento de tarefas com node-cron
- Relatório diário às 9h
- Check de status a cada 5 minutos
- Logs prefixados com `[MARKETING]`

## 📝 Estrutura do Projeto

```
sistema-captacao-alunos/
├── index.js          # Script principal que importa e executa os módulos
├── bot.js            # Bot de WhatsApp
├── marketing.js      # Sistema de marketing e automação
├── package.json      # Dependências e scripts
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

## 🛑 Parar o Sistema

Pressione `Ctrl+C` no terminal para encerrar o sistema.

## 📄 Licença

ISC
