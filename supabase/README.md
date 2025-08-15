# Configuração do Supabase - MCJ Worship App

## 🚀 Configuração Inicial

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Crie uma conta ou faça login
4. Clique em "New Project"
5. Escolha sua organização
6. Preencha:
   - **Name**: `mcj-worship-app`
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a região mais próxima
7. Clique em "Create new project"

### 2. Obter Credenciais

Após criar o projeto:

1. Vá para **Settings** → **API**
2. Copie as seguintes informações:
   - **Project URL**: `https://seu-projeto-id.supabase.co`
   - **anon public key**: Para uso no frontend
   - **service_role key**: Para uso no backend (⚠️ MANTENHA SEGURA)

### 3. Configurar Variáveis de Ambiente

#### Backend (.env)
```env
SUPABASE_URL=https://seu-projeto-id.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

#### Frontend (client/.env.local)
```env
REACT_APP_SUPABASE_URL=https://seu-projeto-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 4. Executar Schema SQL

1. No Supabase Dashboard, vá para **SQL Editor**
2. Clique em "New query"
3. Copie e cole o conteúdo do arquivo `schema.sql`
4. Clique em "Run" para executar

### 5. Executar Migração (Opcional)

Para popular o banco com dados de exemplo:

```bash
# No diretório raiz do projeto
node supabase/migration.js
```

## 🔐 Configuração de Autenticação

### 1. Habilitar Provedores de Auth

1. Vá para **Authentication** → **Settings**
2. Em **Auth Providers**, habilite:
   - Email (já habilitado por padrão)
   - Google (opcional)
   - GitHub (opcional)

### 2. Configurar Políticas RLS

As políticas básicas já estão no `schema.sql`. Para políticas mais específicas:

1. Vá para **Authentication** → **Policies**
2. Selecione a tabela desejada
3. Clique em "New Policy"
4. Configure conforme suas necessidades

## 📊 Estrutura do Banco

### Tabelas Principais

- **users**: Usuários da aplicação
- **ministries**: Ministérios/departamentos
- **songs**: Catálogo de músicas
- **schedules**: Escalas de cultos
- **schedule_members**: Membros escalados
- **schedule_songs**: Músicas das escalas
- **messages**: Sistema de chat
- **members**: Relacionamento usuário-ministério

### Relacionamentos

```
users ←→ ministries (many-to-one)
users ←→ schedules (one-to-many, created_by)
schedules ←→ schedule_members (one-to-many)
schedules ←→ schedule_songs (one-to-many)
songs ←→ schedule_songs (one-to-many)
```

## 🔧 Configuração para Deploy

### Render

No `render.yaml`, as variáveis já estão configuradas:

```yaml
envVars:
  - key: REACT_APP_SUPABASE_URL
    value: "" # Cole sua URL aqui
  - key: REACT_APP_SUPABASE_ANON_KEY
    value: "" # Cole sua chave aqui
```

### Vercel/Netlify

Configure as variáveis de ambiente no dashboard da plataforma:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## 🛠️ Comandos Úteis

```bash
# Instalar dependências do Supabase
npm install @supabase/supabase-js

# Executar migração
node supabase/migration.js

# Testar conexão
node -e "const supabase = require('./config/supabase'); console.log('Conectado ao Supabase!');"
```

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript Client](https://supabase.com/docs/reference/javascript)
- [SQL Reference](https://supabase.com/docs/reference/sql)

## ⚠️ Segurança

- **NUNCA** commite a `service_role_key`
- Use apenas a `anon_key` no frontend
- Configure RLS adequadamente
- Mantenha as dependências atualizadas
- Use HTTPS em produção