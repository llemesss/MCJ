# Guia de Diagnóstico - Render API 404 Issues

## Problema Identificado
- ✅ **Local**: APIs funcionando perfeitamente
- ❌ **Render**: APIs retornando 404 ou respostas vazias
- ✅ **Frontend**: Funcionando em ambos os ambientes

## Passos de Diagnóstico Baseados na Documentação Render

### 1. Verificar Logs do Render <mcreference link="https://render.com/docs/troubleshooting-deploys" index="1">1</mcreference>

**Como acessar:**
1. Acesse o Dashboard do Render
2. Vá para seu serviço web
3. Clique na aba "Logs"
4. Procure por erros usando a palavra-chave "error"

**O que procurar:**
- Erros de build ou deploy
- Erros de runtime
- Mensagens sobre rotas não encontradas
- Problemas de dependências

### 2. Verificar Configuração do Serviço

**Build Command:** `npm install && cd client && npm install && npm run build`
**Start Command:** `node server.js`
**Node Version:** Verificar se está usando Node.js >= 18.0.0

### 3. Possíveis Causas dos 404s <mcreference link="https://render.com/docs/troubleshooting-deploys" index="5">5</mcreference>

#### A. Problemas de Roteamento
- Rotas não sendo montadas corretamente
- Middleware não configurado adequadamente
- Problemas com CORS em produção

#### B. Problemas de Build
- Dependências não instaladas corretamente
- Arquivos não encontrados (case-sensitive no Linux)
- Versão do Node.js incompatível

#### C. Problemas de Ambiente
- Variáveis de ambiente faltando ou incorretas
- NODE_ENV não definido como "production"
- Diferenças entre ambiente local e produção

### 4. Problemas Conhecidos do Render <mcreference link="https://community.render.com/t/deploy-is-successful-but-all-connections-return-404-logs-show-nothing/4764" index="4">4</mcreference>

- **Região Ohio**: Problemas intermitentes com 404s em serviços gratuitos
- **Solução**: Tentar mudar para região US West (Oregon)
- **Status**: Render confirmou e corrigiu alguns problemas, mas podem persistir

### 5. Checklist de Verificação

#### ✅ Configuração do Serviço
- [ ] Runtime: Node.js
- [ ] Build Command: `npm run render-build`
- [ ] Start Command: `node server.js`
- [ ] Região: Preferencialmente US West

#### ✅ Variáveis de Ambiente
- [ ] SUPABASE_URL
- [ ] SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] REACT_APP_SUPABASE_URL
- [ ] REACT_APP_SUPABASE_ANON_KEY
- [ ] JWT_SECRET
- [ ] NODE_ENV=production

#### ✅ Arquivos Críticos
- [ ] server.js existe e está correto
- [ ] routes/supabaseRoutes.js existe
- [ ] package.json tem scripts corretos
- [ ] Todas as dependências estão no package.json

### 6. Comandos de Teste

Após verificar os logs e configurações, teste:

```bash
# Teste básico do servidor
curl https://seu-app.onrender.com/

# Teste da API de ping
curl https://seu-app.onrender.com/api/ping

# Teste da API de login
curl -X POST https://seu-app.onrender.com/api/supabase/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### 7. Soluções Comuns

#### Se for problema de região:
1. Criar novo serviço na região US West
2. Conectar ao mesmo repositório
3. Configurar as mesmas variáveis de ambiente

#### Se for problema de build:
1. Verificar logs de deploy
2. Confirmar que todas as dependências estão instaladas
3. Verificar se o arquivo server.js está sendo encontrado

#### Se for problema de roteamento:
1. Verificar se as rotas estão sendo montadas no server.js
2. Confirmar middleware de CORS
3. Verificar se NODE_ENV está definido corretamente

### 8. Próximos Passos

1. **Imediato**: Verificar logs do Render
2. **Se logs mostrarem erros**: Corrigir problemas identificados
3. **Se logs estiverem limpos**: Considerar problema de região
4. **Último recurso**: Recriar serviço em região diferente

---

**Nota**: Este problema é comum no Render e geralmente está relacionado a configuração de ambiente ou problemas de infraestrutura da plataforma.