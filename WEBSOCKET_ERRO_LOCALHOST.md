# 🔧 ERRO WEBSOCKET - Conexão com localhost em Produção

## 🚨 PROBLEMA IDENTIFICADO

**Erro no Console**: WebSocket tentando conectar em `ws://localhost:5000` em produção

### Causa Raiz
O `SocketContext.js` está configurado para usar `localhost:5000` quando a variável `REACT_APP_SERVER_URL` não está definida:

```javascript
// Linha 15 do SocketContext.js
const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
```

## ✅ SOLUÇÃO

### 1. Adicionar Variável de Ambiente no Render

**No Render Dashboard** → **Environment Variables**, adicionar:

```
REACT_APP_SERVER_URL=https://mcj-rmdj.onrender.com
```

### 2. Atualizar Arquivo de Exemplo

Adicionar no `.env.render.example`:

```bash
# === WEBSOCKET ===
REACT_APP_SERVER_URL=https://seu-app.onrender.com
```

### 3. Verificar Configuração Local

Para desenvolvimento local, criar `.env.local` no diretório `client/`:

```bash
REACT_APP_SERVER_URL=http://localhost:5000
```

## 🔍 DETALHES TÉCNICOS

### Arquivos Afetados
- `client/src/contexts/SocketContext.js` (linha 15)
- Configuração de variáveis de ambiente no Render

### Funcionalidades Impactadas
- ❌ Chat em tempo real
- ❌ Notificações push
- ❌ Status de usuários online
- ❌ Atualizações automáticas de escalas

### Como o WebSocket Funciona
1. **Frontend** conecta via Socket.IO client
2. **Backend** aceita conexões via Socket.IO server
3. **Comunicação** bidirecional para recursos em tempo real

## 🚀 PASSOS PARA CORREÇÃO

### Passo 1: Configurar no Render
1. Acesse https://dashboard.render.com
2. Vá para seu serviço web
3. Clique em "Environment"
4. Adicione: `REACT_APP_SERVER_URL=https://mcj-rmdj.onrender.com`
5. Clique "Save Changes"

### Passo 2: Forçar Redeploy
1. Vá para aba "Manual Deploy"
2. Clique "Deploy latest commit"
3. Aguarde o build completar

### Passo 3: Verificar Correção
1. Abra o site: https://mcj-rmdj.onrender.com
2. Abra DevTools (F12)
3. Vá para aba "Console"
4. Procure por mensagens de conexão Socket.IO
5. **Sucesso**: "Conectado ao servidor Socket.IO"
6. **Falha**: Erros de conexão WebSocket

## 🧪 TESTE DE VERIFICAÇÃO

### Console do Navegador (Esperado)
```javascript
// ✅ CORRETO
"Conectado ao servidor Socket.IO"

// ❌ INCORRETO
"WebSocket connection to 'ws://localhost:5000/socket.io/' failed"
```

### Network Tab (Esperado)
```
✅ wss://mcj-rmdj.onrender.com/socket.io/
❌ ws://localhost:5000/socket.io/
```

## 📋 CHECKLIST DE CORREÇÃO

- [ ] Adicionar `REACT_APP_SERVER_URL` no Render
- [ ] Fazer redeploy do frontend
- [ ] Verificar console sem erros de WebSocket
- [ ] Testar funcionalidade de chat (se disponível)
- [ ] Confirmar conexão WebSocket no Network tab

## ⚠️ NOTAS IMPORTANTES

1. **Variáveis REACT_APP_**: Só são lidas durante o build
2. **Redeploy Necessário**: Mudanças em env vars precisam de rebuild
3. **Case Sensitive**: Nome da variável deve ser exato
4. **URL Completa**: Incluir protocolo (https://)

## 🔄 CONFIGURAÇÃO DINÂMICA (Alternativa)

Se quiser uma solução mais robusta, pode modificar o `SocketContext.js`:

```javascript
// Detectar ambiente automaticamente
const getServerUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return window.location.origin; // Usa a URL atual
  }
  return process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
};

const newSocket = io(getServerUrl(), {
  // ... resto da configuração
});
```

---

**Status**: Problema identificado, solução documentada
**Prioridade**: Alta (funcionalidades em tempo real não funcionam)
**Tempo Estimado**: 5-10 minutos para correção