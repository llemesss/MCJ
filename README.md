# MCJ Worship App

Sistema de gestão para ministério de louvor com funcionalidades de agendamento, repertório e chat em tempo real.

## 🚀 Deploy no Vercel

### Pré-requisitos
1. Conta no [Vercel](https://vercel.com)
2. Repositório no GitHub com o código

### Passos para Deploy

1. **Prepare o repositório:**
   ```bash
   git add .
   git commit -m "Preparando para deploy no Vercel"
   git push origin main
   ```

2. **Configure no Vercel:**
   - Acesse [vercel.com](https://vercel.com) e faça login
   - Clique em "New Project"
   - Importe seu repositório do GitHub
   - Configure as variáveis de ambiente:
     - `NODE_ENV=production`
     - `JWT_SECRET=seu_jwt_secret_aqui`
     - Outras variáveis do seu `.env`

3. **Deploy automático:**
   - O Vercel detectará automaticamente a configuração
   - O build será executado usando `vercel-build`
   - Frontend será servido estaticamente
   - Backend rodará como função serverless

## 🛠️ Tecnologias

- **Frontend:** React, Material-UI, Socket.io-client
- **Backend:** Node.js, Express, Socket.io
- **Banco:** SQLite (desenvolvimento)
- **Deploy:** Vercel

## 📁 Estrutura do Projeto

```
mcjapp/
├── client/          # Aplicação React
├── routes/          # Rotas da API
├── models/          # Modelos do banco
├── middleware/      # Middlewares
├── server.js        # Servidor principal
├── vercel.json      # Configuração Vercel
└── .gitignore       # Arquivos ignorados
```

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install
npm run install-client

# Executar em modo desenvolvimento
npm run dev
```

## 📝 Notas Importantes

- Arquivos de upload são ignorados no `.gitignore`
- Banco SQLite não é adequado para produção no Vercel
- Considere usar MongoDB Atlas ou PostgreSQL para produção
- Funções serverless têm limite de tempo de execução# MCJ
