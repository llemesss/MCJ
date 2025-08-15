-- Políticas adicionais para permitir registro de usuários
-- Execute este script no SQL Editor do Supabase Dashboard

-- Permitir inserção de novos usuários (registro)
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (true);

-- Permitir que o service role acesse todos os dados
CREATE POLICY "Service role full access" ON users
  FOR ALL USING (current_setting('role') = 'service_role');

-- Política alternativa para permitir inserção via service role
DROP POLICY IF EXISTS "Allow user registration" ON users;
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (
    current_setting('role') = 'service_role' OR 
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Verificar políticas existentes
-- SELECT * FROM pg_policies WHERE tablename = 'users';