// server.js - Corrigido para Render e Supabase

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// --- Configuração do CORS ---
// Permite que seu frontend no Render acesse esta API.
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://*.onrender.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// --- Middlewares ---
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Limite ajustado para um valor mais comum
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- Conexão com o Banco de Dados (Supabase) ---
// A lógica de conexão com o Supabase (usando o cliente 'pg' ou 'supabase-js')
// deve ser implementada aqui ou em um arquivo separado (ex: database.js).
// Todo o código relacionado ao Mongoose foi removido por ser incompatível.
console.log("Servidor configurado para usar Supabase. Implemente a lógica de conexão.");


// --- Rotas da API ---

// Rotas antigas (baseadas em Mongoose) comentadas para evitar erros.
// Você precisará migrar a lógica delas para usar o Supabase.
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/members', require('./routes/members'));
// app.use('/api/schedules', require('./routes/schedules'));
// app.use('/api/songs', require('./routes/songs'));
// app.use('/api/reports', require('./routes/reports'));
// app.use('/api/chat', require('./routes/chat'));

// Rota ativa para a nova implementação com Supabase
app.use('/api/supabase', require('./routes/supabaseRoutes'));

// Endpoint de verificação de saúde da API
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'MCJ Worship API'
  });
});


// --- Servir o Frontend (React) ---
// Este bloco serve os arquivos estáticos da sua pasta 'client/build' em produção.
app.use(express.static(path.join(__dirname, 'client/build')));

// Para qualquer outra requisição que não seja da API, serve o app React.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});


// --- Configuração do Socket.IO para Chat em Tempo Real ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

io.on('connection', (socket) => {
  console.log('Usuário conectado via Socket.IO:', socket.id);

  socket.on('join-ministry', (ministryId) => {
    socket.join(ministryId);
  });

  socket.on('send-message', (data) => {
    io.to(data.ministryId).emit('new-message', data);
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });
});


// --- Iniciar o Servidor ---
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Exportação para possíveis testes
module.exports = { app, io };