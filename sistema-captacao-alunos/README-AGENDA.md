# Sistema de Agendamento - Google Calendar Integration

Módulo de integração com Google Calendar para gerenciar agendamentos de aulas particulares.

## 📋 Pré-requisitos

1. **Conta Google** com acesso ao Google Calendar
2. **Google Cloud Console** - Projeto configurado
3. **Google Calendar API** - Ativada no projeto
4. **Credenciais** - Service Account (JWT) ou OAuth2

## 🚀 Configuração Inicial

### Passo 1: Configurar Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. No menu lateral, vá para **APIs e Serviços** > **Biblioteca**
4. Procure por "Google Calendar API" e clique em **Ativar**

### Passo 2: Criar Credenciais

#### Opção A: Service Account (Recomendado para automação)

1. Vá para **APIs e Serviços** > **Credenciais**
2. Clique em **Criar Credenciais** > **Conta de serviço**
3. Preencha os dados:
   - Nome da conta de serviço: `calendario-aulas`
   - ID da conta de serviço: (gerado automaticamente)
   - Descrição: `Gerenciamento de agendamento de aulas`
4. Clique em **Criar e continuar**
5. Em "Conceder acesso", pode pular clicando em **Continuar**
6. Clique em **Concluir**
7. Na lista de contas de serviço, clique na conta recém-criada
8. Vá para a aba **Chaves**
9. Clique em **Adicionar Chave** > **Criar nova chave**
10. Selecione **JSON** e clique em **Criar**
11. O arquivo `credentials.json` será baixado automaticamente

**Importante:** Após criar a Service Account, você precisa compartilhar seu Google Calendar com ela:
1. Abra [Google Calendar](https://calendar.google.com/)
2. Em "Meus calendários", clique nos 3 pontos ao lado do calendário que deseja usar
3. Selecione **Configurações e compartilhamento**
4. Role até **Compartilhar com pessoas específicas**
5. Clique em **Adicionar pessoas**
6. Digite o email da service account (exemplo: `calendario-aulas@seu-projeto.iam.gserviceaccount.com`)
7. Selecione permissão **Fazer alterações nos eventos**
8. Clique em **Enviar**

#### Opção B: OAuth 2.0 (Recomendado para aplicações de usuário)

1. Vá para **APIs e Serviços** > **Credenciais**
2. Clique em **Criar Credenciais** > **ID do cliente OAuth**
3. Tipo de aplicativo: **Aplicativo para computador**
4. Nome: `Sistema de Captação de Alunos`
5. Clique em **Criar**
6. Baixe o arquivo JSON (será seu `credentials.json`)
7. Configure as variáveis de ambiente no `.env`:
   ```env
   GOOGLE_ACCESS_TOKEN=seu_access_token
   GOOGLE_REFRESH_TOKEN=seu_refresh_token
   ```

### Passo 3: Instalar Dependências

```bash
npm install googleapis
```

### Passo 4: Configurar Arquivo de Credenciais

1. Renomeie o arquivo baixado para `credentials.json`
2. Mova-o para a pasta `sistema-captacao-alunos/`
3. Verifique se o arquivo está no `.gitignore` (já configurado)

## 💻 Como Usar

### Importar o Módulo

```javascript
const agenda = require('./agenda.js');
```

### Listar Horários Livres

Lista todos os horários de 1 hora disponíveis entre 08:00 e 18:00 em um determinado dia.

```javascript
// Buscar horários livres em uma data específica
const horarios = await agenda.listarHorariosLivres('2025-11-25');

// Resultado:
// [
//   {
//     inicio: '2025-11-25T08:00:00.000Z',
//     fim: '2025-11-25T09:00:00.000Z',
//     horario: '08:00 - 09:00'
//   },
//   {
//     inicio: '2025-11-25T10:00:00.000Z',
//     fim: '2025-11-25T11:00:00.000Z',
//     horario: '10:00 - 11:00'
//   }
//   // ... mais horários
// ]

console.log(`${horarios.length} horários disponíveis:`);
horarios.forEach(slot => {
  console.log(`- ${slot.horario}`);
});
```

### Criar Evento de Aula

Cria um evento de 1 hora no Google Calendar com link do Google Meet.

```javascript
// Criar uma aula para um aluno
const evento = await agenda.criarEventoAula(
  'João Silva',
  '2025-11-25T10:00:00'
);

// Resultado:
// {
//   id: 'abc123xyz',
//   titulo: 'Aula Particular - João Silva',
//   inicio: '2025-11-25T10:00:00.000Z',
//   fim: '2025-11-25T11:00:00.000Z',
//   descricao: 'Agendado via Bot WhatsApp',
//   linkEvento: 'https://calendar.google.com/event?eid=...',
//   linkMeet: 'https://meet.google.com/abc-defg-hij'
// }

console.log('Aula agendada!');
console.log(`Link do Google Meet: ${evento.linkMeet}`);
```

## 🔗 Integração com WhatsApp Bot

Você pode integrar o módulo de agenda com o bot de WhatsApp:

```javascript
// Em bot.js
const agenda = require('./agenda.js');

// Quando o usuário solicita agendamento
if (lowerText.includes('agendar')) {
    // Lista horários disponíveis
    const horarios = await agenda.listarHorariosLivres('2025-11-25');
    
    let resposta = 'Horários disponíveis para 25/11/2025:\n\n';
    horarios.forEach((slot, index) => {
        resposta += `${index + 1}. ${slot.horario}\n`;
    });
    
    await sock.sendMessage(from, { text: resposta });
}

// Quando o usuário escolhe um horário
if (lowerText.includes('horário') && lowerText.includes('1')) {
    const evento = await agenda.criarEventoAula(
        'João Silva', // Nome extraído da conversa
        '2025-11-25T08:00:00'
    );
    
    const resposta = `✅ Aula agendada com sucesso!\n\n` +
                    `📅 Data: 25/11/2025 às 08:00\n` +
                    `🎓 Professor: [Seu Nome]\n` +
                    `🔗 Link do Google Meet: ${evento.linkMeet}\n\n` +
                    `Você receberá um lembrete por email 1 dia antes da aula.`;
    
    await sock.sendMessage(from, { text: resposta });
}
```

## 📋 Funcionalidades

### `listarHorariosLivres(dia)`

**Parâmetros:**
- `dia` (string) - Data no formato `YYYY-MM-DD` (ex: `'2025-11-25'`)

**Retorna:**
- Array de objetos com horários livres:
  ```javascript
  {
    inicio: string,  // ISO 8601
    fim: string,     // ISO 8601
    horario: string  // Formato legível (HH:mm - HH:mm)
  }
  ```

**Funcionalidade:**
- Busca eventos do dia no calendário 'primary'
- Gera slots de 1 hora entre 08:00 e 18:00
- Retorna apenas os horários que não conflitam com eventos existentes

### `criarEventoAula(nomeAluno, dataInicio)`

**Parâmetros:**
- `nomeAluno` (string) - Nome do aluno (ex: `'João Silva'`)
- `dataInicio` (string) - Data/hora de início em formato ISO 8601 (ex: `'2025-11-25T10:00:00'`)

**Retorna:**
- Objeto com informações do evento:
  ```javascript
  {
    id: string,           // ID do evento no Google Calendar
    titulo: string,       // Título do evento
    inicio: string,       // Data/hora de início (ISO 8601)
    fim: string,          // Data/hora de fim (ISO 8601)
    descricao: string,    // Descrição do evento
    linkEvento: string,   // Link para o evento no Google Calendar
    linkMeet: string      // Link do Google Meet
  }
  ```

**Funcionalidade:**
- Cria evento de 1 hora com título "Aula Particular - [NomeAluno]"
- Adiciona descrição "Agendado via Bot WhatsApp"
- Gera link do Google Meet automaticamente
- Configura lembretes (1 dia antes por email, 30 minutos antes por popup)

## 🔧 Configuração

### Horário de Funcionamento

Por padrão, o sistema considera horários entre 08:00 e 18:00. Para alterar:

```javascript
// Em agenda.js
const HORARIO_INICIO = 9;  // 09:00
const HORARIO_FIM = 20;    // 20:00
```

### Duração dos Slots

Por padrão, cada slot tem 1 hora (60 minutos). Para alterar:

```javascript
// Em agenda.js
const DURACAO_SLOT = 90;  // 1h30min
```

### Fuso Horário

O fuso horário padrão é `America/Sao_Paulo`. Para alterar:

```javascript
// Em agenda.js, função criarEventoAula
start: {
  dateTime: dataInicioObj.toISOString(),
  timeZone: 'America/New_York'  // Exemplo: Nova York
}
```

## 🔐 Segurança

### Protegendo Credenciais

1. **NUNCA** commite o arquivo `credentials.json` para o Git
2. O arquivo já está no `.gitignore`
3. Para produção, use variáveis de ambiente ou secret managers
4. Limite as permissões da Service Account apenas ao necessário

### Compartilhamento de Calendário

- Se usar Service Account, lembre-se de compartilhar o calendário com o email da service account
- Conceda apenas a permissão necessária ("Fazer alterações nos eventos")

## 🧪 Testes

### Teste Manual

Execute o módulo diretamente:

```bash
node agenda.js
```

Isso exibirá informações sobre o módulo e como usá-lo.

### Teste de Integração

```javascript
const agenda = require('./agenda.js');

async function testar() {
    try {
        // Teste 1: Listar horários livres
        console.log('Teste 1: Listando horários livres...');
        const horarios = await agenda.listarHorariosLivres('2025-11-25');
        console.log(`✓ ${horarios.length} horários encontrados`);
        
        // Teste 2: Criar evento
        if (horarios.length > 0) {
            console.log('Teste 2: Criando evento de aula...');
            const primeiroHorario = horarios[0].inicio;
            const evento = await agenda.criarEventoAula('Teste Aluno', primeiroHorario);
            console.log(`✓ Evento criado: ${evento.linkMeet}`);
        }
        
        console.log('✓ Todos os testes passaram!');
    } catch (error) {
        console.error('✗ Erro nos testes:', error.message);
    }
}

testar();
```

## 📊 Logs

O módulo exibe logs detalhados com o prefixo `[AGENDA]`:

```
[AGENDA] ✓ Autenticação JWT (Service Account) realizada com sucesso
[AGENDA] 🔍 Buscando horários livres para 2025-11-25...
[AGENDA] 📅 2 eventos encontrados no dia 2025-11-25
[AGENDA] ✓ 8 horários livres encontrados
[AGENDA] 📝 Criando evento de aula para João Silva...
[AGENDA] ✓ Evento criado com sucesso!
[AGENDA]   ID: abc123xyz
[AGENDA]   Link: https://calendar.google.com/event?eid=...
[AGENDA]   Google Meet: https://meet.google.com/abc-defg-hij
```

## ❓ Solução de Problemas

### Erro: "Arquivo credentials.json não encontrado"

**Solução:** Certifique-se de que o arquivo `credentials.json` está na pasta `sistema-captacao-alunos/`

### Erro: "Calendar API has not been used in project"

**Solução:** 
1. Acesse o Google Cloud Console
2. Vá para "APIs e Serviços" > "Biblioteca"
3. Procure "Google Calendar API"
4. Clique em "Ativar"

### Erro: "Insufficient Permission"

**Solução:** 
1. Verifique se compartilhou o calendário com a service account
2. Certifique-se de conceder permissão "Fazer alterações nos eventos"
3. Aguarde alguns minutos para as permissões serem propagadas

### Google Meet não está sendo gerado

**Solução:**
1. Verifique se o Google Meet está habilitado na sua conta Google Workspace
2. Certifique-se de que `conferenceDataVersion: 1` está configurado na chamada da API
3. Verifique os logs para ver se há mensagens de erro específicas

## 📚 Referências

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [googleapis Node.js Client](https://github.com/googleapis/google-api-nodejs-client)
- [Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

## 📄 Licença

ISC
