const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Basic Auth middleware
const basicAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
        return res.status(401).send('Autenticação necessária');
    }
    
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    
    // Hardcoded credentials for testing
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = 'admin123';
    
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
        return res.status(401).send('Credenciais inválidas');
    }
};

// Admin route - protected with Basic Auth
app.get('/admin', basicAuth, (req, res) => {
    const leadsPath = path.join(__dirname, 'leads.json');
    
    // Check if leads.json exists
    if (!fs.existsSync(leadsPath)) {
        // Return empty array if file doesn't exist
        return res.render('admin', { leads: [] });
    }
    
    try {
        // Read leads.json
        const data = fs.readFileSync(leadsPath, 'utf8');
        const leads = JSON.parse(data);
        
        // Render admin view with leads data
        res.render('admin', { leads });
    } catch (error) {
        console.error('[SERVER] ❌ Erro ao ler leads.json:', error.message);
        res.status(500).send('Erro ao carregar leads');
    }
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`[SERVER] ✓ Servidor Express rodando na porta ${PORT}`);
    console.log(`[SERVER] 🔗 Acesse o painel admin em: http://localhost:${PORT}/admin`);
    console.log(`[SERVER] 🔐 Usuário: admin | Senha: admin123`);
});

module.exports = { app, server };
