-- Script para corrigir erros de RLS identificados no Supabase Dashboard
-- MCJ Worship App - Correção de Políticas de Segurança
-- Execute este script no SQL Editor do Supabase Dashboard

-- ========================================
-- CORREÇÃO DOS ERROS DE RLS IDENTIFICADOS
-- ========================================

-- 1. CORRIGIR TABELA USERS
-- Problema: Política existe mas RLS não habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remover políticas conflitantes
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- Remover TODAS as políticas existentes (incluindo as em português)
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios dados" ON users;
DROP POLICY IF EXISTS "Permitir registro público" ON users;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON users;
DROP POLICY IF EXISTS "Allow public registration" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Criar políticas funcionais para users
CREATE POLICY "mcj_allow_public_registration" ON users
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "mcj_users_view_own_data" ON users
    FOR SELECT 
    USING (auth.uid() = id OR current_setting('role') = 'service_role');

CREATE POLICY "mcj_users_update_own_data" ON users
    FOR UPDATE 
    USING (auth.uid() = id OR current_setting('role') = 'service_role')
    WITH CHECK (auth.uid() = id OR current_setting('role') = 'service_role');

-- 2. CORRIGIR TABELA MESSAGES
-- Habilitar RLS e criar políticas
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON messages;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON messages;
DROP POLICY IF EXISTS "Enable update for users based on email" ON messages;

-- Criar políticas para messages
CREATE POLICY "Allow authenticated users to view messages" ON messages
    FOR SELECT 
    USING (auth.role() = 'authenticated' OR current_setting('role') = 'service_role');

CREATE POLICY "Allow authenticated users to insert messages" ON messages
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated' OR current_setting('role') = 'service_role');

CREATE POLICY "Allow users to update own messages" ON messages
    FOR UPDATE 
    USING (auth.uid() = user_id OR current_setting('role') = 'service_role')
    WITH CHECK (auth.uid() = user_id OR current_setting('role') = 'service_role');

-- 3. CORRIGIR TABELA AGENDAS (SCHEDULES)
-- Habilitar RLS e criar políticas
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON schedules;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON schedules;
DROP POLICY IF EXISTS "Enable update for users based on email" ON schedules;

-- Criar políticas para schedules
CREATE POLICY "Allow authenticated users to view schedules" ON schedules
    FOR SELECT 
    USING (auth.role() = 'authenticated' OR current_setting('role') = 'service_role');

CREATE POLICY "Allow authenticated users to manage schedules" ON schedules
    FOR ALL 
    USING (auth.role() = 'authenticated' OR current_setting('role') = 'service_role')
    WITH CHECK (auth.role() = 'authenticated' OR current_setting('role') = 'service_role');

-- 4. CORRIGIR TABELA MÚSICAS (SONGS)
-- Habilitar RLS e criar políticas
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON songs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON songs;
DROP POLICY IF EXISTS "Enable update for users based on email" ON songs;

-- Criar políticas para songs
CREATE POLICY "Allow authenticated users to view songs" ON songs
    FOR SELECT 
    USING (auth.role() = 'authenticated' OR current_setting('role') = 'service_role');

CREATE POLICY "Allow authenticated users to manage songs" ON songs
    FOR ALL 
    USING (auth.role() = 'authenticated' OR current_setting('role') = 'service_role')
    WITH CHECK (auth.role() = 'authenticated' OR current_setting('role') = 'service_role');

-- 5. CORRIGIR TABELA MINISTÉRIOS
-- Habilitar RLS e criar políticas
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON ministries;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ministries;
DROP POLICY IF EXISTS "Enable update for users based on email" ON ministries;

-- Criar políticas para ministries
CREATE POLICY "Allow authenticated users to view ministries" ON ministries
    FOR SELECT 
    USING (auth.role() = 'authenticated' OR current_setting('role') = 'service_role');

CREATE POLICY "Allow authenticated users to manage ministries" ON ministries
    FOR ALL 
    USING (auth.role() = 'authenticated' OR current_setting('role') = 'service_role')
    WITH CHECK (auth.role() = 'authenticated' OR current_setting('role') = 'service_role');

-- 6. CORRIGIR TABELA MEMBROS
-- Habilitar RLS e criar políticas
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON members;
DROP POLICY IF EXISTS "Enable update for users based on email" ON members;

-- Criar políticas para members
CREATE POLICY "Allow authenticated users to view members" ON members
    FOR SELECT 
    USING (auth.role() = 'authenticated' OR current_setting('role') = 'service_role');

CREATE POLICY "Allow authenticated users to manage members" ON members
    FOR ALL 
    USING (auth.role() = 'authenticated' OR current_setting('role') = 'service_role')
    WITH CHECK (auth.role() = 'authenticated' OR current_setting('role') = 'service_role');

-- 7. CORRIGIR TABELAS DE RELACIONAMENTO (se existirem)
-- Verificar se as tabelas existem antes de aplicar RLS
DO $$
BEGIN
    -- Tabela schedule_songs (se existir)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schedule_songs') THEN
        ALTER TABLE schedule_songs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow authenticated access to schedule songs" ON schedule_songs;
        CREATE POLICY "mcj_schedule_songs_access" ON schedule_songs
            FOR ALL 
            USING (auth.role() = 'authenticated' OR current_setting('role') = 'service_role')
            WITH CHECK (auth.role() = 'authenticated' OR current_setting('role') = 'service_role');
    END IF;

    -- Tabela schedule_members (se existir)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schedule_members') THEN
        ALTER TABLE schedule_members ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow authenticated access to schedule members" ON schedule_members;
        CREATE POLICY "mcj_schedule_members_access" ON schedule_members
            FOR ALL 
            USING (auth.role() = 'authenticated' OR current_setting('role') = 'service_role')
            WITH CHECK (auth.role() = 'authenticated' OR current_setting('role') = 'service_role');
    END IF;
END $$;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Verificar status do RLS em todas as tabelas existentes
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Habilitado'
        ELSE '❌ RLS Desabilitado'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 'messages', 'schedules', 'songs', 'ministries', 'members',
    'schedule_songs', 'schedule_members'
)
ORDER BY tablename;

-- Verificar políticas criadas
SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN '✅ Permissiva'
        ELSE '⚠️ Restritiva'
    END as type
FROM pg_policies 
WHERE tablename IN (
    'users', 'messages', 'schedules', 'songs', 'ministries', 'members',
    'schedule_songs', 'schedule_members'
)
ORDER BY tablename, policyname;

-- ========================================
-- INSTRUÇÕES DE USO
-- ========================================

/*
PARA EXECUTAR ESTE SCRIPT:

1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Cole este script completo
4. Clique em "Run" para executar
5. Verifique os resultados das consultas de verificação
6. Teste o registro de usuários novamente

Este script irá:
✅ Habilitar RLS em todas as tabelas
✅ Remover políticas conflitantes
✅ Criar políticas funcionais
✅ Permitir registro público de usuários
✅ Permitir acesso autenticado aos dados
✅ Manter segurança adequada

Após executar, os erros de RLS no Dashboard devem desaparecer.
*/