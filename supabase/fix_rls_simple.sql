-- Script simples para corrigir políticas RLS - MCJ Worship App
-- Execute este script no SQL Editor do Supabase Dashboard

-- Desabilitar RLS temporariamente para a tabela users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes da tabela users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- Reabilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar política simples para permitir inserção (registro)
CREATE POLICY "Allow public user registration" ON users
    FOR INSERT 
    WITH CHECK (true);

-- Criar política para permitir que usuários vejam seus próprios dados
CREATE POLICY "Users can view own data" ON users
    FOR SELECT 
    USING (auth.uid() = id);

-- Criar política para permitir que usuários atualizem seus próprios dados
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';