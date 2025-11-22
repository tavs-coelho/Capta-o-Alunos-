# Sistema de Captação de Alunos - WhatsApp Bot

Bot de WhatsApp para captação de alunos usando a biblioteca @whiskeysockets/baileys.

## Funcionalidades

O bot responde automaticamente a mensagens de potenciais alunos com base em palavras-chave:

### 1. Consultas de Preço
Palavras-chave: `preço`, `valor`, `quanto`

**Resposta:** "Olá! A hora/aula é R$ 60. Temos pacotes mensais. Qual matéria você precisa?"

### 2. Consultas sobre Matérias
Palavras-chave: `matemática`, `física`, `cálculo`

**Resposta:** "Eu sou especialista nisso. Você tem alguma prova chegando? Qual a data?"

### 3. Solicitações de Agendamento
Palavra-chave: `agendar`

**Resposta:** "Vou verificar minha agenda e te retorno em instantes."

## Como Usar

### Pré-requisitos
- Node.js instalado
- Dependências instaladas via `npm install`

### Execução

```bash
node bot.js
```

### Primeira Execução

1. Execute o bot
2. Um QR Code será exibido no terminal
3. Escaneie o QR Code com seu WhatsApp (WhatsApp > Configurações > Aparelhos conectados)
4. O bot estará conectado e pronto para responder mensagens

### Reconexão Automática

O bot possui reconexão automática em caso de quedas de conexão, exceto quando houver logout manual.

## Características Técnicas

- **Autenticação:** Usa `useMultiFileAuthState` para salvar sessão na pasta `auth_info`
- **Logs:** Usa biblioteca `pino` com nível `silent` para logs limpos
- **QR Code:** Usa `qrcode-terminal` com opção `{ small: true }`
- **Reconexão:** Automática em caso de queda de conexão (exceto logout)
- **Mensagens:** Ignora mensagens próprias e processa apenas texto
- **Console:** Exibe logs formatados de mensagens recebidas e respostas enviadas

## Estrutura de Pastas

```
sistema-captacao-alunos/
├── bot.js              # Bot principal
├── auth_info/          # Pasta de autenticação (ignorada pelo git)
├── package.json        # Dependências
└── .gitignore          # Arquivos ignorados
```

## Segurança

A pasta `auth_info/` contém informações sensíveis de autenticação e está configurada no `.gitignore` para não ser versionada.
