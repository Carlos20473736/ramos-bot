const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint para Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'RAMOS BOT is running' });
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// SPA fallback - redirecionar todas as rotas para index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 RAMOS BOT - Painel ADM rodando em http://0.0.0.0:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor gracefully...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido. Encerrando servidor gracefully...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});
