# Deploy no Render com GitHub - Guia Completo

Guia para hospedar sua aplicação MCJ usando Render com integração GitHub.

## 🏗️ Arquitetura Render

```
GitHub → Render (Auto Deploy) → Aplicação Live
   ↓           ↓                    ↓
 Push      Build & Deploy      https://seu-app.onrender.com
```

## 🚀 Vantagens do Render

- ✅ **Deploy automático** via GitHub
- ✅ **HTTPS gratuito** com certificados SSL
- ✅ **Domínios customizados**
- ✅ **Logs em tempo real**
- ✅ **Escalabilidade automática**
- ✅ **Tier gratuito** generoso (750h/mês)
- ✅ **PostgreSQL** gerenciado
- ✅ **Redis** para cache
- ✅ **Mais simples** que AWS/Google Cloud

## 📋 Pré-requisitos

1. **Conta GitHub** com repositório do projeto
2. **Conta Render** (gratuita)
3. **Código no GitHub** (público ou privado)

## 🔧 Opções de Deploy

### **Opção 1: Render + Supabase** (Recomendado)
- **Frontend:** Render Static Site
- **Backend:** Supabase (PostgreSQL + Auth + Real-time)
- **Custo:** Gratuito
- **Complexidade:** Baixa

### **Opção 2: Render Completo**
- **Frontend:** Render Static Site
- **Backend:** Render Web Service
- **Database:** Render PostgreSQL
- **Custo:** ~$7-15/mês
- **Complexidade:** Média

### **Opção 3: Render Fullstack**
- **Tudo em um:** Render Web Service (Node.js serve React)
- **Database:** Render PostgreSQL ou Supabase
- **Custo:** ~$7/mês
- **Complexidade:** Baixa

## 🚀 Deploy Opção 1: Render + Supabase

### Passo 1: Preparar Repositório GitHub

#### 1.1 Criar repositório (se não existir)
```bash
# No diretório do projeto
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/mcj-app.git
git push -u origin main
```

#### 1.2 Configurar para Render
Crie `render.yaml` na raiz:
```yaml
services:
  - type: web
    name: mcj-frontend
    env: static
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/build
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: REACT_APP_SUPABASE_URL
        value: https://seu-projeto.supabase.co
      - key: REACT_APP_SUPABASE_ANON_KEY
        value: sua_anon_key_aqui
```

### Passo 2: Deploy no Render

#### 2.1 Conectar GitHub
1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em **"New +"** → **"Static Site"**
3. Conecte sua conta GitHub
4. Selecione o repositório `mcj-app`

#### 2.2 Configurar Build
```
Build Command: cd client && npm install && npm run build
Publish Directory: client/build
Branch: main
```

#### 2.3 Configurar Variáveis de Ambiente
```
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

#### 2.4 Deploy
1. Clique em **"Create Static Site"**
2. Aguarde o build (3-5 minutos)
3. Acesse a URL gerada: `https://mcj-app.onrender.com`

## 🚀 Deploy Opção 2: Render Completo

### Passo 1: Configurar Backend

#### 1.1 Ajustar package.json (raiz)
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "cd client && npm install && npm run build",
    "render-build": "npm install && npm run build",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "nodemon server.js",
    "client": "cd client && npm start"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 1.2 Ajustar server.js
```javascript
const express = require('express')
const path = require('path')
const cors = require('cors')
const http = require('http')
const socketIo = require('socket.io')
require('dotenv').config()

const app = express()
const server = http.createServer(app)

// CORS para Render
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://seu-frontend.onrender.com'] 
    : ['http://localhost:3000'],
  credentials: true
}))

// Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://seu-frontend.onrender.com'] 
      : ['http://localhost:3000'],
    credentials: true
  }
})

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rotas da API
app.use('/api/auth', require('./routes/auth'))
app.use('/api/songs', require('./routes/songs'))
app.use('/api/schedules', require('./routes/schedules'))
app.use('/api/members', require('./routes/members'))
app.use('/api/chat', require('./routes/chat'))
app.use('/api/reports', require('./routes/reports'))

// Servir arquivos estáticos do React (produção)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'))
  })
}

// Socket.io handlers
io.on('connection', (socket) => {
  console.log('Usuário conectado:', socket.id)
  
  socket.on('join-schedule', (scheduleId) => {
    socket.join(scheduleId)
    console.log(`Usuário ${socket.id} entrou na escala ${scheduleId}`)
  })
  
  socket.on('send-message', (data) => {
    io.to(data.scheduleId).emit('new-message', data)
  })
  
  socket.on('disconnect', () => {
    console.log('Usuário desconectado:', socket.id)
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
```

### Passo 2: Configurar Database

#### 2.1 Criar PostgreSQL no Render
1. No dashboard, clique **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `mcj-database`
   - **Database:** `mcj_db`
   - **User:** `mcj_user`
3. Anote as credenciais geradas

#### 2.2 Configurar Conexão
Crie `database-postgres.js`:
```javascript
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Criar tabelas
const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'member',
        ministry VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS songs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255),
        key VARCHAR(10),
        tempo INTEGER,
        youtube_url TEXT,
        lyrics TEXT,
        chords TEXT,
        multitrack_files JSONB DEFAULT '[]',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Adicionar outras tabelas...
    
    console.log('✅ Tabelas criadas com sucesso')
  } catch (error) {
    console.error('❌ Erro criando tabelas:', error)
  }
}

module.exports = { pool, createTables }
```

### Passo 3: Deploy Backend

#### 3.1 Criar Web Service
1. **"New +"** → **"Web Service"**
2. Conectar repositório GitHub
3. Configurar:
   ```
   Build Command: npm run render-build
   Start Command: npm start
   ```

#### 3.2 Configurar Variáveis
```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=seu_jwt_secret_super_seguro
PORT=10000
```

## 🔧 Deploy Opção 3: Render Fullstack

### Configurar render.yaml
```yaml
services:
  - type: web
    name: mcj-fullstack
    env: node
    plan: starter
    buildCommand: npm install && cd client && npm install && npm run build && cd ..
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: mcj-database
          property: connectionString
      - key: JWT_SECRET
        generateValue: true

databases:
  - name: mcj-database
    plan: starter
```

## 🌐 Configurar Domínio Customizado

### 1. No Render Dashboard
1. Vá para seu serviço
2. **Settings** → **Custom Domains**
3. Adicione: `mcjapp.com.br`

### 2. Configurar DNS
```
Tipo: CNAME
Nome: @
Valor: seu-app.onrender.com
```

## 🔄 CI/CD Automático

### Auto Deploy
- ✅ **Push para main** → Deploy automático
- ✅ **Pull Request** → Preview deploy
- ✅ **Rollback** → Versão anterior

### Configurar Branch
```yaml
# render.yaml
services:
  - type: web
    name: mcj-app
    branch: main  # ou production
    autoDeploy: true
```

## 📊 Monitoramento

### Logs em Tempo Real
```bash
# Via dashboard ou CLI
render logs -s mcj-app
```

### Métricas
- **CPU/Memory** usage
- **Response time**
- **Error rate**
- **Deploy history**

## 💰 Custos Render

### Tier Gratuito
- **Static Sites:** Ilimitados
- **Web Services:** 750h/mês
- **PostgreSQL:** 90 dias
- **Bandwidth:** 100GB/mês

### Planos Pagos
- **Starter:** $7/mês (Web Service)
- **Standard:** $25/mês (mais recursos)
- **PostgreSQL:** $7/mês (persistente)

## 🚨 Troubleshooting

### Build Falha
```bash
# Verificar logs no dashboard
# Comum: versão Node.js
"engines": {
  "node": ">=18.0.0"
}
```

### CORS Error
```javascript
// server.js
app.use(cors({
  origin: [
    'https://seu-frontend.onrender.com',
    'http://localhost:3000'
  ],
  credentials: true
}))
```

### Database Connection
```javascript
// Verificar DATABASE_URL
console.log('DB URL:', process.env.DATABASE_URL)
```

## ✅ Checklist Final

### Preparação:
- [ ] Código no GitHub
- [ ] package.json configurado
- [ ] Variáveis de ambiente definidas
- [ ] Scripts de build funcionando

### Deploy:
- [ ] Serviço criado no Render
- [ ] Build executado com sucesso
- [ ] Aplicação acessível
- [ ] Database conectado (se aplicável)

### Pós-Deploy:
- [ ] Domínio customizado (opcional)
- [ ] HTTPS funcionando
- [ ] Logs sem erros
- [ ] Funcionalidades testadas

## 🎯 Recomendação para MCJ

**Para sua aplicação MCJ, recomendo:**

1. **Render Static Site** (frontend) + **Supabase** (backend)
   - ✅ Mais simples
   - ✅ Mais barato
   - ✅ Mais moderno
   - ✅ Real-time nativo

2. **Render Web Service** (fullstack) se quiser manter Node.js
   - ✅ Controle total
   - ✅ Socket.io customizado
   - ❌ Mais caro
   - ❌ Mais complexo

---

**🚀 Com Render + GitHub, você terá deploy automático e uma aplicação profissional no ar em minutos!**