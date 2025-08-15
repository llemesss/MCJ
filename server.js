// server.js - Corrigido para Render e Supabase

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require("socket.io");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

<<<<<<< HEAD
// --- Configuração do CORS ---
// Permite que seu frontend no Render acesse esta API.
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://*.onrender.com',
=======
// CORS configuration for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || process.env.NODE_ENV === 'production' 
    ? ['https://*.onrender.com', 'https://*.render.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
>>>>>>> f822b0b26ee288f888c033210da3fd2ec6228986
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

<<<<<<< HEAD
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
=======
// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ extended: true, limit: '2gb' }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection with fallback to in-memory database
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mcj-worship';
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB conectado com sucesso');
  } catch (err) {
    console.log('Erro ao conectar MongoDB local, usando banco em memória...');
    try {
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB em memória conectado com sucesso');
    } catch (memoryErr) {
      console.error('Erro ao conectar banco em memória:', memoryErr);
      process.exit(1);
    }
  }
};

connectDB();

// Health check endpoint for connectivity testing
app.head('/api/ping', (req, res) => {
  res.status(200).end();
});

app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
>>>>>>> f822b0b26ee288f888c033210da3fd2ec6228986
    timestamp: new Date().toISOString(),
    server: 'MCJ Worship API'
  });
});

<<<<<<< HEAD

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
=======
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/songs', require('./routes/songs'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/chat', require('./routes/chat'));

// Supabase routes (new database option)
app.use('/api/supabase', require('./routes/supabaseRoutes'));

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Socket.IO for real-time chat
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server, {
>>>>>>> f822b0b26ee288f888c033210da3fd2ec6228986
  cors: corsOptions
});

io.on('connection', (socket) => {
<<<<<<< HEAD
  console.log('Usuário conectado via Socket.IO:', socket.id);

  socket.on('join-ministry', (ministryId) => {
    socket.join(ministryId);
  });

  socket.on('send-message', (data) => {
    io.to(data.ministryId).emit('new-message', data);
  });

=======
  console.log('Usuário conectado:', socket.id);
  
  socket.on('join-ministry', (ministryId) => {
    socket.join(ministryId);
  });
  
  socket.on('send-message', (data) => {
    io.to(data.ministryId).emit('new-message', data);
  });
  
>>>>>>> f822b0b26ee288f888c033210da3fd2ec6228986
  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id);
  });
});

<<<<<<< HEAD

// --- Iniciar o Servidor ---
=======
>>>>>>> f822b0b26ee288f888c033210da3fd2ec6228986
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

<<<<<<< HEAD
// Exportação para possíveis testes
=======
>>>>>>> f822b0b26ee288f888c033210da3fd2ec6228986
module.exports = { app, io };