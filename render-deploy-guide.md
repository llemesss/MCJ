# Guia de Deploy no Render - Solução para Erro 404

## 🚨 Problema Identificado
O serviço atual no Render está retornando 404 para todas as rotas, indicando que:
1. O serviço pode não estar funcionando corretamente
2. A configuração pode estar incorreta
3. O deploy pode ter falhado

## 🔧 Solução: Recriar o Serviço

### Passo 1: Verificar o Dashboard do Render
1. Acesse [render.com](https://render.com)
2. Faça login na sua conta
3. Verifique se existe um serviço chamado `mcj-11m8` ou similar
4. Verifique os logs do serviço para identificar erros

### Passo 2: Criar Novo Web Service
1. No Render Dashboard, clique em "New" → "Web Service"
2. Conecte seu repositório GitHub `MCJ`
3. Configure:
   - **Name:** `mcj-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && cd client && npm install && npm run build && cd ..`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

### Passo 3: Configurar Variáveis de Ambiente
Adicione estas variáveis no dashboard:
```
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://lnxofsqwfkmpphjsgecb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueG9mc3F3ZmttcHBoanNnZWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTgwMDAsImV4cCI6MjA3MDgzNDAwMH0.L22_jfMFHJCokN0Vp4ZFpwN6rU5m_hzeKlbAO_3IlE4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueG9mc3F3ZmttcHBoanNnZWNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI1ODAwMCwiZXhwIjoyMDcwODM0MDAwfQ.Ut4EKmCXltNOb3OtanQU6HYEC6kMTgkBkOTghOCA-tc
JWT_SECRET=sua_jwt_secret_super_segura_aqui_123456789
REACT_APP_SUPABASE_URL=https://lnxofsqwfkmpphjsgecb.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxueG9mc3F3ZmttcHBoanNnZWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNTgwMDAsImV4cCI6MjA3MDgzNDAwMH0.L22_jfMFHJCokN0Vp4ZFpwN6rU5m_hzeKlbAO_3IlE4
```

### Passo 4: Deploy
1. Clique em "Create Web Service"
2. Aguarde o build e deploy (pode levar 5-10 minutos)
3. A nova URL será algo como: `https://mcj-backend-xxxx.onrender.com`

### Passo 5: Testar
Após o deploy, teste:
```bash
curl https://sua-nova-url.onrender.com/api/ping
```

## 🔍 Possíveis Problemas e Soluções

### 1. Build Falha
- **Erro:** `Module not found`
- **Solução:** Verificar se todas as dependências estão no `package.json`

### 2. Start Falha
- **Erro:** `Cannot find module`
- **Solução:** Verificar se o `server.js` está na raiz do projeto

### 3. Timeout
- **Erro:** `Service timeout`
- **Solução:** Verificar se o servidor está escutando na porta correta (`process.env.PORT`)

### 4. Variáveis de Ambiente
- **Erro:** `Connection failed`
- **Solução:** Verificar se todas as variáveis estão configuradas corretamente

## 📋 Checklist de Verificação

- [ ] Repositório conectado corretamente
- [ ] Build command correto
- [ ] Start command correto
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Logs de build sem erros
- [ ] Logs de runtime sem erros
- [ ] Rota `/api/ping` respondendo
- [ ] Rotas de autenticação funcionando

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs detalhadamente** no dashboard do Render
2. **Teste localmente** com `NODE_ENV=production npm start`
3. **Considere usar Railway** como alternativa mais simples
4. **Entre em contato** com o suporte do Render

## 📞 Próximos Passos

1. Acesse o dashboard do Render
2. Verifique o status do serviço atual
3. Se necessário, recrie o serviço seguindo este guia
4. Teste todas as rotas após o deploy
5. Atualize a URL no frontend se necessário