# Sistema de Captação de Alunos

Sistema integrado que combina um bot de WhatsApp para atendimento automático e um módulo de marketing para automação de tarefas.

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn
- Chave de API da OpenAI (para respostas inteligentes com IA)

## 🚀 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure o arquivo `.env` com suas credenciais:
```bash
cp .env.example .env
```

3. Edite o arquivo `.env` e adicione sua chave da OpenAI:
```
OPENAI_API_KEY=sk-sua-chave-aqui
```

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

2. Configure o arquivo `.env` com sua chave de API da OpenAI:
```bash
cp .env.example .env
# Edite o arquivo .env e adicione sua chave da OpenAI
```

Para obter sua chave de API:
- Acesse https://platform.openai.com/api-keys
- Crie uma nova chave de API
- Copie e cole no arquivo `.env`

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
Bot inteligente de atendimento automático via WhatsApp com IA generativa.
Bot inteligente de atendimento automático via WhatsApp com IA integrada.

**Características:**
- Conecta-se ao WhatsApp usando Baileys
- Gera QR Code para autenticação
- **🤖 Integração com OpenAI**: Usa GPT-3.5-turbo para respostas contextuais
- **📊 Gerenciamento de Estados**: Acompanha o progresso de cada usuário no funil de vendas:
  - **INICIO**: Descoberta de necessidades e identificação da matéria
  - **ORCAMENTO**: Apresentação do valor (R$ 80/hora) e disponibilidade
  - **FECHAMENTO**: Confirmação final e envio de dados de pagamento
- **🧠 Respostas Inteligentes**: A IA adapta suas respostas baseadas no estado atual da conversa
- **🔄 Transições Automáticas**: Estados mudam automaticamente conforme o progresso da conversa
- **🤖 Respostas com IA (OpenAI GPT-4o-mini)**: 
  - Assistente comercial inteligente que entende o contexto
  - Personalidade simpática e focada em agendar aulas
  - Informações sobre preço base (R$ 60/hora)
  - Uso moderado de emojis
  - Respostas curtas e diretas
  - Verifica datas de provas quando solicitado
- Logs prefixados com `[BOT]`
- Reconexão automática com delay de 3 segundos
- Tratamento de erros robusto

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

## 🤖 Gerenciamento de Estados do Bot

O bot mantém o contexto da conversa com cada usuário através de um sistema de estados:

### Estados Disponíveis

#### 1. INICIO (Estado Inicial)
- **Objetivo**: Descobrir as necessidades do aluno
- **Ações da IA**:
  - Tira dúvidas básicas
  - Identifica a matéria de interesse
  - Transição: Muda para ORCAMENTO quando identificar a matéria

#### 2. ORCAMENTO
- **Objetivo**: Apresentar valores e verificar interesse
- **Ações da IA**:
  - Informa o valor de R$ 80/hora
  - Pergunta sobre disponibilidade de horários
  - Transição: Muda para FECHAMENTO quando o aluno aceitar

#### 3. FECHAMENTO
- **Objetivo**: Finalizar a venda
- **Ações da IA**:
  - Pede confirmação final
  - Informa sobre envio de dados do Pix
  - Mantém o profissionalismo até conclusão

### Formato de Resposta da IA

A IA retorna respostas estruturadas em JSON:
```json
{
  "texto": "Mensagem para o usuário",
  "novo_estado": "ORCAMENTO"
}
```

Isso permite que o bot:
- Envie a mensagem apropriada
- Atualize automaticamente o estado da conversa
- Mantenha contexto entre múltiplas mensagens

## 📄 Licença

ISC
## ⚠️ Notas Importantes

- O script verifica provas que ocorrerão **exatamente** em 3 dias
- Todas as datas devem estar no formato ISO 8601
- O sistema compara apenas as datas (dia/mês/ano), ignorando horários
- Para produção, considere implementar controle de duplicatas de campanhas
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

## 🤖 Integração com OpenAI

O bot agora usa a OpenAI GPT-4o-mini para gerar respostas inteligentes e contextuais.

### Configuração

1. Instale a biblioteca openai (já incluída nas dependências):
```bash
npm install openai
```

2. Configure a variável de ambiente no `.env`:
```
OPENAI_API_KEY=sua_chave_api_openai_aqui
```

### Como Funciona

- **Função `gerarRespostaIA(mensagemUsuario)`**: Envia mensagens do usuário para o modelo GPT-4o-mini
- **System Prompt**: Define o comportamento do assistente como um vendedor simpático de aulas particulares
- **Modelo**: gpt-4o-mini (pode ser alterado para gpt-3.5-turbo se necessário)
- **Parâmetros**:
  - `temperature`: 0.7 (equilíbrio entre criatividade e consistência)
  - `max_tokens`: 200 (respostas curtas e diretas)

### Vantagens da IA

- ✅ Respostas mais naturais e contextuais
- ✅ Entende a intenção do usuário sem depender de palavras-chave específicas
- ✅ Personalidade consistente focada em vendas
- ✅ Adaptável a diferentes tipos de perguntas
- ✅ Tratamento de erros com mensagem amigável

## Segurança

A pasta `auth_info/` contém informações sensíveis de autenticação e está configurada no `.gitignore` para não ser versionada.

⚠️ **Importante**: Nunca compartilhe ou commite sua chave de API da OpenAI (`OPENAI_API_KEY`). Mantenha-a apenas no arquivo `.env`.
