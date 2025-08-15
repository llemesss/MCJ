import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase para o frontend
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

// Cliente Supabase para uso no frontend (com anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;