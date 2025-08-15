# Guia de Migração: MongoDB para Supabase

Este guia explica como migrar do MongoDB para Supabase no MCJ App.

## 📋 Visão Geral

O MCJ App agora suporta duas opções de banco de dados:
- **MongoDB** (sistema atual)
- **Supabase** (nova opção recomendada)

## 🚀 Vantagens do Supabase

- ✅ **Hospedagem gratuita** com plano generoso
- ✅ **PostgreSQL** robusto e confiável
- ✅ **Autenticação integrada** com JWT
- ✅ **Row Level Security (RLS)** para segurança
- ✅ **API REST automática** gerada
- ✅ **Dashboard web** para administração
- ✅ **Backup automático** e alta disponibilidade

## 📁 Arquivos Criados para Supabase

### Backend
- `config/supabase.js` - Configuração do cliente Supabase
- `services/supabaseService.js` - Serviços para operações no banco
- `middleware/supabaseAuth.js` - Middleware de autenticação
- `routes/supabaseRoutes.js` - Rotas da API Supabase

### Frontend
- `client/src/config/supabase.js` - Configuração do cliente React
- `client/src/hooks/useSupabase.js` - Hooks personalizados
- `client/src/components/SupabaseExample.jsx` - Componente de exemplo

### Database
- `supabase/schema.sql` - Schema do banco de dados
- `supabase/migration.js` - Script de migração
- `supabase/README.md` - Documentação específica do Supabase

## 🔧 Configuração Inicial

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta gratuita
3. Clique em "New Project"
4. Escolha um nome e senha para o banco
5. Aguarde a criação (2-3 minutos)

### 2. Obter Credenciais

No dashboard do Supabase:
1. Vá em **Settings** → **API**
2. Copie:
   - `Project URL`
   - `anon public key`
   - `service_role key` (mantenha secreta!)

### 3. Configurar Variáveis de Ambiente

#### Backend (.env)
```env
# Supabase Configuration
SUPABASE_URL=sua_project_url_aqui
SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Manter configurações existentes do MongoDB
# MONGODB_URI=...
# JWT_SECRET=...
```

#### Frontend (client/.env)
```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=sua_project_url_aqui
REACT_APP_SUPABASE_ANON_KEY=sua_anon_key_aqui
REACT_APP_NODE_ENV=development
```

### 4. Executar Schema SQL

1. No dashboard do Supabase, vá em **SQL Editor**
2. Copie o conteúdo de `supabase/schema.sql`
3. Cole e execute o script
4. Verifique se todas as tabelas foram criadas

### 5. Instalar Dependências

```bash
# Backend
npm install @supabase/supabase-js

# Frontend
cd client
npm install @supabase/supabase-js
```

## 🔄 Estratégias de Migração

### Opção 1: Migração Gradual (Recomendada)

1. **Manter ambos os sistemas** funcionando
2. **Novas funcionalidades** usar Supabase
3. **Migrar dados** gradualmente
4. **Desativar MongoDB** quando estiver pronto

### Opção 2: Migração Completa

1. **Exportar dados** do MongoDB
2. **Transformar dados** para PostgreSQL
3. **Importar no Supabase**
4. **Atualizar todas as rotas** para usar Supabase

## 📊 Mapeamento de Dados

### MongoDB → PostgreSQL

| MongoDB Collection | PostgreSQL Table | Observações |
|-------------------|------------------|-------------|
| `users` | `users` | Adicionar `ministry_id` FK |
| `songs` | `songs` | Manter estrutura similar |
| `schedules` | `schedules` | Relacionamentos com FK |
| `ministries` | `ministries` | Nova tabela |
| `messages` | `messages` | Chat/comunicação |

## 🛠 Scripts de Migração

### Executar Migração de Dados

```bash
# Instalar dependências do Supabase
npm run supabase:install

# Executar migração (opcional)
npm run supabase:migrate
```

## 🔐 Autenticação

### MongoDB (Atual)
- JWT manual com bcrypt
- Middleware personalizado
- Sessões em memória

### Supabase (Novo)
- Autenticação integrada
- JWT automático
- Row Level Security
- Políticas de acesso

## 🌐 APIs Disponíveis

### Rotas MongoDB (Existentes)
- `/api/auth/*` - Autenticação atual
- `/api/songs/*` - Músicas
- `/api/schedules/*` - Escalas
- `/api/members/*` - Membros

### Rotas Supabase (Novas)
- `/api/supabase/auth/*` - Autenticação Supabase
- `/api/supabase/songs/*` - Músicas
- `/api/supabase/schedules/*` - Escalas
- `/api/supabase/ministries/*` - Ministérios
- `/api/supabase/messages/*` - Mensagens

## 🧪 Testando a Integração

### 1. Testar Conexão

```javascript
// No console do navegador ou Node.js
const { supabase } = require('./config/supabase');

// Testar conexão
supabase.from('users').select('count').then(console.log);
```

### 2. Componente de Exemplo

Use o componente `SupabaseExample.jsx` para testar:
- Autenticação
- CRUD de músicas
- Listagem de escalas

## 🚀 Deploy com Supabase

### Render.com

O arquivo `render.yaml` já está configurado com as variáveis do Supabase:

```yaml
envVars:
  - key: SUPABASE_URL
    sync: false
  - key: SUPABASE_ANON_KEY
    sync: false
  - key: SUPABASE_SERVICE_ROLE_KEY
    sync: false
  - key: REACT_APP_SUPABASE_URL
    sync: false
  - key: REACT_APP_SUPABASE_ANON_KEY
    sync: false
```

### Configurar no Dashboard do Render

1. Vá em **Environment**
2. Adicione as variáveis do Supabase
3. Faça o redeploy

## 🔍 Monitoramento

### Dashboard Supabase
- **Database** - Visualizar tabelas e dados
- **Auth** - Gerenciar usuários
- **Storage** - Arquivos (se necessário)
- **Logs** - Monitorar atividade

### Métricas
- Número de usuários ativos
- Queries por minuto
- Uso de storage
- Autenticações

## 🆘 Troubleshooting

### Problemas Comuns

1. **Erro de conexão**
   - Verificar URLs e chaves
   - Confirmar variáveis de ambiente

2. **Erro de autenticação**
   - Verificar políticas RLS
   - Confirmar JWT_SECRET

3. **Erro de permissão**
   - Revisar Row Level Security
   - Verificar roles dos usuários

### Logs Úteis

```javascript
// Habilitar logs detalhados
process.env.SUPABASE_DEBUG = 'true';
```

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Migração PostgreSQL](https://supabase.com/docs/guides/database/migrating-to-supabase)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [API Reference](https://supabase.com/docs/reference/javascript)

## ✅ Checklist de Migração

- [ ] Projeto Supabase criado
- [ ] Credenciais configuradas
- [ ] Schema SQL executado
- [ ] Dependências instaladas
- [ ] Variáveis de ambiente configuradas
- [ ] Testes de conexão realizados
- [ ] Dados migrados (se aplicável)
- [ ] Deploy atualizado
- [ ] Monitoramento configurado

---

**Nota**: Esta migração é opcional. O sistema MongoDB continuará funcionando normalmente. O Supabase oferece uma alternativa moderna e gratuita para novos projetos ou melhorias.