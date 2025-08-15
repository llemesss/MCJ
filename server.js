// server.js - Configurado para Render e Supabase

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// CORS configuration for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || process.env.NODE_ENV === 'production' 
    ? ['https://*.onrender.com', 'https://*.render.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Supabase configuration - no connection needed as it's handled by the service
console.log('Servidor configurado para usar Supabase');

// Health check endpoint
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
  timestamp: new Date().toISOString(),
    server: 'MCJ Worship API'
  });
});

// Health check endpoint for connectivity testing
app.head('/api/ping', (req, res) => {
  res.status(200).end();
});

// Routes - Using Supabase routes as primary
app.use('/api/auth', require('./routes/supabaseRoutes'));
app.use('/api/supabase', require('./routes/supabaseRoutes'));

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Socket.IO for real-time chat
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id);
  
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

// Iniciar o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Exportação para possíveis testes
module.exports = { app, io };