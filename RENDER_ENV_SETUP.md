# Configuração de Variáveis de Ambiente - Render

Guia completo para configurar variáveis de ambiente no Render para sua aplicação MCJ.

## 🔑 Variáveis por Tipo de Deploy

### Frontend (Static Site) + Supabase
```bash
# Supabase
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua_anon_key_aqui

# Ambiente
REACT_APP_NODE_ENV=production
```

### Backend (Web Service) + PostgreSQL
```bash
# Servidor
NODE_ENV=production
PORT=10000

# Database
DATABASE_URL=postgresql://user:pass@host:port/database

# Autenticação
JWT_SECRET=seu_jwt_secret_super_seguro_aqui

# CORS
CORS_ORIGIN=https://seu-frontend.onrender.com

# Upload (se usar Cloudinary)
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret
```

### Fullstack (Tudo em um)
```bash
# Servidor
NODE_ENV=production
PORT=10000

# Database
DATABASE_URL=postgresql://user:pass@host:port/database

# Autenticação
JWT_SECRET=seu_jwt_secret_super_seguro_aqui

# Frontend (se servir React pelo Node.js)
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

## 🔧 Como Configurar no Render

### Método 1: Via Dashboard

#### 1.1 Acessar Configurações
1. Vá para [Render Dashboard](https://dashboard.render.com)
2. Selecione seu serviço
3. Clique em **"Environment"** na barra lateral

#### 1.2 Adicionar Variáveis
1. Clique em **"Add Environment Variable"**
2. Preencha:
   - **Key:** `REACT_APP_SUPABASE_URL`
   - **Value:** `https://seu-projeto.supabase.co`
3. Clique em **"Save Changes"**
4. Repita para todas as variáveis

#### 1.3 Deploy Automático
- Render fará redeploy automaticamente
- Aguarde 3-5 minutos para aplicar

### Método 2: Via render.yaml

#### 2.1 Configurar no Arquivo
```yaml
services:
  - type: web
    name: mcj-frontend
    env: static
    envVars:
      - key: REACT_APP_SUPABASE_URL
        value: https://seu-projeto.supabase.co
      - key: REACT_APP_SUPABASE_ANON_KEY
        value: sua_anon_key_aqui
      - key: REACT_APP_NODE_ENV
        value: production
```

#### 2.2 Commit e Push
```bash
git add render.yaml
git commit -m "Add environment variables"
git push origin main
```

### Método 3: Via Render CLI

#### 3.1 Instalar CLI
```bash
npm install -g @render/cli
# ou
curl -fsSL https://cli.render.com/install | sh
```

#### 3.2 Login
```bash
render login
```

#### 3.3 Configurar Variáveis
```bash
# Listar serviços
render services list

# Adicionar variável
render env set REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co --service-id=seu-service-id

# Listar variáveis
render env list --service-id=seu-service-id
```

## 🔒 Variáveis Sensíveis

### Gerar Secrets Automaticamente
```yaml
# render.yaml
envVars:
  - key: JWT_SECRET
    generateValue: true  # Render gera automaticamente
  - key: SESSION_SECRET
    generateValue: true
```

### Referenciar Database
```yaml
# render.yaml
envVars:
  - key: DATABASE_URL
    fromDatabase:
      name: mcj-database
      property: connectionString
```

### Referenciar Outros Serviços
```yaml
# render.yaml
envVars:
  - key: FRONTEND_URL
    fromService:
      type: web
      name: mcj-frontend
      property: host
```

## 📍 Como Obter Credenciais

### Supabase
1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá para **Settings** → **API**
4. Copie:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon public** → `REACT_APP_SUPABASE_ANON_KEY`

### PostgreSQL (Render)
1. No Render Dashboard
2. Vá para seu database
3. **Info** tab
4. Copie **External Database URL**

### JWT Secret
```bash
# Gerar secret seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Ou usar site
# https://generate-secret.vercel.app/64
```

### Cloudinary (opcional)
1. Acesse [Cloudinary Console](https://cloudinary.com/console)
2. **Dashboard** → **Account Details**
3. Copie:
   - **Cloud name**
   - **API Key**
   - **API Secret**

## 🌍 Configuração por Ambiente

### Desenvolvimento Local
```bash
# .env.local
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua_anon_key_aqui
REACT_APP_NODE_ENV=development
```

### Staging (Preview)
```yaml
# render.yaml
services:
  - type: web
    name: mcj-staging
    branch: develop
    envVars:
      - key: REACT_APP_SUPABASE_URL
        value: https://staging-projeto.supabase.co
      - key: REACT_APP_NODE_ENV
        value: staging
```

### Produção
```yaml
# render.yaml
services:
  - type: web
    name: mcj-production
    branch: main
    envVars:
      - key: REACT_APP_SUPABASE_URL
        value: https://prod-projeto.supabase.co
      - key: REACT_APP_NODE_ENV
        value: production
```

## 🧪 Testando Configuração

### 1. Verificar Build
```bash
# Logs do build
# No dashboard: Deploy → View Logs
```

### 2. Verificar Runtime
```javascript
// No código React
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL)
console.log('Environment:', process.env.REACT_APP_NODE_ENV)
```

### 3. Teste de Conexão
```javascript
// client/src/utils/testEnv.js
export const testEnvironment = () => {
  const requiredVars = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY'
  ]
  
  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    console.error('❌ Variáveis faltando:', missing)
    return false
  }
  
  console.log('✅ Todas as variáveis configuradas')
  return true
}
```

## 🚨 Troubleshooting

### Build Falha por Variáveis
```bash
# Erro comum:
# "REACT_APP_SUPABASE_URL is not defined"

# Solução:
# 1. Verificar se variável está no dashboard
# 2. Verificar se nome está correto (case-sensitive)
# 3. Fazer redeploy manual se necessário
```

### Variáveis Não Aplicadas
```bash
# 1. Verificar se fez redeploy após adicionar
# 2. Limpar cache do build
# 3. Verificar logs de deploy
```

### CORS Error
```javascript
// Verificar se CORS_ORIGIN está correto
// Deve ser a URL do frontend
CORS_ORIGIN=https://mcj-frontend.onrender.com
```

### Database Connection
```bash
# Verificar DATABASE_URL
# Formato: postgresql://user:pass@host:port/db
# Render fornece automaticamente se usar PostgreSQL deles
```

## 📋 Checklist de Configuração

### Frontend (Static Site):
- [ ] `REACT_APP_SUPABASE_URL` configurado
- [ ] `REACT_APP_SUPABASE_ANON_KEY` configurado
- [ ] `REACT_APP_NODE_ENV=production`
- [ ] Build executado com sucesso
- [ ] Aplicação carregando sem erros

### Backend (Web Service):
- [ ] `NODE_ENV=production`
- [ ] `PORT=10000`
- [ ] `DATABASE_URL` configurado
- [ ] `JWT_SECRET` configurado
- [ ] `CORS_ORIGIN` configurado
- [ ] Servidor iniciando sem erros

### Database:
- [ ] PostgreSQL criado no Render
- [ ] `DATABASE_URL` copiado para backend
- [ ] Conexão testada
- [ ] Tabelas criadas

### Segurança:
- [ ] Secrets não expostos no código
- [ ] `.env` no `.gitignore`
- [ ] JWT_SECRET forte (64+ caracteres)
- [ ] CORS configurado corretamente

## 🎯 Exemplo Completo

### render.yaml Final
```yaml
services:
  # Frontend
  - type: web
    name: mcj-frontend
    env: static
    buildCommand: cd client && npm ci && npm run build
    staticPublishPath: ./client/build
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: REACT_APP_SUPABASE_URL
        value: https://xyzabc123.supabase.co
      - key: REACT_APP_SUPABASE_ANON_KEY
        value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
      - key: REACT_APP_NODE_ENV
        value: production

  # Backend (opcional)
  - type: web
    name: mcj-backend
    env: node
    buildCommand: npm ci
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: JWT_SECRET
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: mcj-database
          property: connectionString
      - key: CORS_ORIGIN
        fromService:
          type: web
          name: mcj-frontend
          property: host

# Database (opcional)
databases:
  - name: mcj-database
    plan: starter
```

---

**🔐 Lembre-se: Nunca commite secrets no código! Use sempre as variáveis de ambiente do Render.**