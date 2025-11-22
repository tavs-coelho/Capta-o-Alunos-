#!/usr/bin/env node
/**
 * Script principal para executar o Bot de WhatsApp e o sistema de Marketing
 * Este script importa e executa ambos os módulos simultaneamente
 */

console.log('='.repeat(60));
console.log('🚀 Sistema de Captação de Alunos');
console.log('='.repeat(60));
console.log('');

// Importar ambos os módulos
// Como ambos executam suas funções na inicialização (já possuem código executável),
// apenas importar (require) é suficiente
console.log('📦 Carregando módulos...');
console.log('');

try {
    // Importar bot.js - ele inicia automaticamente
    require('./bot.js');
    console.log('');
    
    // Importar marketing.js - ele também inicia automaticamente
    require('./marketing.js');
    console.log('');
    
    console.log('='.repeat(60));
    console.log('✓ Todos os módulos foram carregados com sucesso!');
    console.log('='.repeat(60));
    console.log('');
    console.log('💡 Os logs de ambos os módulos aparecerão abaixo:');
    console.log('   [BOT] - Logs do WhatsApp Bot');
    console.log('   [MARKETING] - Logs do sistema de Marketing');
    console.log('');
    
} catch (error) {
    console.error('❌ Erro ao inicializar sistema:', error);
    process.exit(1);
}

// Manter o processo rodando
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Encerrando sistema...');
    process.exit(0);
});
