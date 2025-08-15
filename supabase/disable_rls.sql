-- Script para desabilitar RLS temporariamente - MCJ Worship App
-- Execute este script no SQL Editor do Supabase Dashboard
-- ATENÇÃO: Isso desabilita a segurança RLS - use apenas para desenvolvimento

-- Desabilitar RLS para todas as tabelas
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE ministries DISABLE ROW LEVEL SECURITY;
ALTER TABLE songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;

-- Verificar status do RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'ministries', 'songs', 'schedules', 'schedule_members', 'schedule_songs', 'messages', 'members');