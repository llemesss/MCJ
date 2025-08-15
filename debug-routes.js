// Script de debug para verificar rotas e variáveis de ambiente
const express = require('express');
require('dotenv').config();

const app = express();

// Middleware básico
app.use(express.json());

// Debug das variáveis de ambiente
console.log('=== DEBUG VARIÁVEIS DE AMBIENTE ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'CONFIGURADO' : 'NÃO CONFIGURADO');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURADO' : 'NÃO CONFIGURADO');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'CONFIGURADO' : 'NÃO CONFIGURADO');

// Rota de teste simples
app.get('/api/debug', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      SUPABASE_URL_SET: !!process.env.SUPABASE_URL,
      SUPABASE_KEY_SET: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      JWT_SECRET_SET: !!process.env.JWT_SECRET
    }
  });
});

// Tentar importar as rotas do Supabase
try {
  console.log('=== TENTANDO IMPORTAR ROTAS ===');
  const supabaseRoutes = require('./routes/supabaseRoutes');
  app.use('/api/auth', supabaseRoutes);
  app.use('/api/supabase', supabaseRoutes);
  console.log('✅ Rotas do Supabase importadas com sucesso');
} catch (error) {
  console.error('❌ Erro ao importar rotas do Supabase:', error.message);
  console.error('Stack:', error.stack);
}

// Listar todas as rotas registradas
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log('Rota registrada:', middleware.route.path);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        console.log('Rota registrada:', handler.route.path);
      }
    });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Servidor de debug rodando na porta ${PORT}`);
});