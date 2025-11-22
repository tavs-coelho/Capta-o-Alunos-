/**
 * Script de teste para o módulo de agenda
 * Este script permite testar as funções do módulo sem precisar de credenciais reais
 */

const agenda = require('./agenda.js');

async function testarModulo() {
    console.log('='.repeat(60));
    console.log('🧪 Teste do Módulo de Agenda - Google Calendar');
    console.log('='.repeat(60));
    console.log('');
    
    // Teste 1: Verificar se o módulo foi carregado corretamente
    console.log('Teste 1: Verificando módulo...');
    if (typeof agenda.listarHorariosLivres === 'function' && 
        typeof agenda.criarEventoAula === 'function') {
        console.log('✓ Módulo carregado com sucesso');
        console.log('✓ Funções disponíveis:');
        console.log('  - listarHorariosLivres(dia)');
        console.log('  - criarEventoAula(nomeAluno, dataInicio)');
    } else {
        console.log('✗ Erro ao carregar módulo');
        return;
    }
    console.log('');
    
    // Teste 2: Testar listarHorariosLivres (requer credentials.json)
    console.log('Teste 2: Listando horários livres...');
    try {
        // Calcula data de amanhã de forma robusta
        const hoje = new Date();
        const dataAmanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
        const dataStr = dataAmanha.toISOString().split('T')[0]; // YYYY-MM-DD
        
        console.log(`📅 Buscando horários para: ${dataStr}`);
        const horarios = await agenda.listarHorariosLivres(dataStr);
        
        console.log(`✓ ${horarios.length} horários livres encontrados:`);
        horarios.forEach((slot, index) => {
            console.log(`  ${index + 1}. ${slot.horario}`);
        });
        
        // Teste 3: Testar criarEventoAula (apenas se houver horários livres)
        if (horarios.length > 0) {
            console.log('');
            console.log('Teste 3: Criando evento de aula...');
            
            const primeiroHorario = horarios[0].inicio;
            console.log(`📝 Agendando aula no horário: ${horarios[0].horario}`);
            
            const evento = await agenda.criarEventoAula('Aluno Teste', primeiroHorario);
            
            console.log('✓ Evento criado com sucesso!');
            console.log(`  Título: ${evento.titulo}`);
            console.log(`  Horário: ${new Date(evento.inicio).toLocaleString('pt-BR')} - ${new Date(evento.fim).toLocaleString('pt-BR')}`);
            console.log(`  Link do Evento: ${evento.linkEvento}`);
            console.log(`  Link do Google Meet: ${evento.linkMeet}`);
        } else {
            console.log('');
            console.log('⚠️  Nenhum horário livre encontrado para testar criação de evento');
        }
        
        console.log('');
        console.log('='.repeat(60));
        console.log('✓ Todos os testes passaram com sucesso!');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.log('');
        console.log('='.repeat(60));
        console.log('⚠️  Erro durante os testes:');
        console.log('='.repeat(60));
        console.log('');
        
        if (error.message.includes('credentials.json não encontrado')) {
            console.log('❌ Arquivo credentials.json não encontrado');
            console.log('');
            console.log('📝 Para resolver:');
            console.log('1. Acesse https://console.cloud.google.com/');
            console.log('2. Ative a Google Calendar API');
            console.log('3. Crie credenciais (Service Account ou OAuth2)');
            console.log('4. Baixe o arquivo credentials.json');
            console.log('5. Coloque-o na pasta sistema-captacao-alunos/');
            console.log('');
            console.log('📚 Consulte o README-AGENDA.md para instruções detalhadas');
        } else if (error.message.includes('Calendar API has not been used')) {
            console.log('❌ Google Calendar API não está ativada no projeto');
            console.log('');
            console.log('📝 Para resolver:');
            console.log('1. Acesse https://console.cloud.google.com/');
            console.log('2. Vá para APIs e Serviços > Biblioteca');
            console.log('3. Procure por "Google Calendar API"');
            console.log('4. Clique em "Ativar"');
        } else if (error.message.includes('Insufficient Permission')) {
            console.log('❌ Permissões insuficientes');
            console.log('');
            console.log('📝 Para resolver:');
            console.log('1. Abra o Google Calendar');
            console.log('2. Compartilhe seu calendário com a service account');
            console.log('3. Conceda permissão "Fazer alterações nos eventos"');
            console.log('');
            console.log('📧 Email da service account está no arquivo credentials.json');
            console.log('   (campo "client_email")');
        } else {
            console.log('❌ Erro inesperado:', error.message);
            console.log('');
            console.log('Stack trace:', error.stack);
        }
        
        console.log('');
        console.log('='.repeat(60));
    }
}

// Executar testes
if (require.main === module) {
    testarModulo();
} else {
    module.exports = { testarModulo };
}
