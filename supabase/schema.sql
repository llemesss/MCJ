-- Schema SQL para Supabase - MCJ Worship App
-- Execute este script no SQL Editor do Supabase Dashboard

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  ministry_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ministérios
CREATE TABLE IF NOT EXISTS ministries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de músicas
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  key VARCHAR(10),
  tempo INTEGER,
  duration INTEGER,
  youtube_url VARCHAR(500),
  lyrics TEXT,
  chords TEXT,
  tags TEXT[],
  play_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de escalas
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME,
  ministry_id UUID,
  location VARCHAR(255),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros das escalas
CREATE TABLE IF NOT EXISTS schedule_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  schedule_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(100),
  instrument VARCHAR(100),
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(schedule_id, user_id)
);

-- Tabela de músicas das escalas
CREATE TABLE IF NOT EXISTS schedule_songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  schedule_id UUID NOT NULL,
  song_id UUID NOT NULL,
  order_index INTEGER,
  key VARCHAR(10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens/chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID NOT NULL,
  schedule_id UUID,
  ministry_id UUID,
  type VARCHAR(50) DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  ministry_id UUID NOT NULL,
  role VARCHAR(100),
  instruments TEXT[],
  skills TEXT[],
  availability JSONB,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ministry_id)
);

-- Adicionar chaves estrangeiras
ALTER TABLE users ADD CONSTRAINT fk_users_ministry 
  FOREIGN KEY (ministry_id) REFERENCES ministries(id);

ALTER TABLE ministries ADD CONSTRAINT fk_ministries_leader 
  FOREIGN KEY (leader_id) REFERENCES users(id);

ALTER TABLE songs ADD CONSTRAINT fk_songs_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE schedules ADD CONSTRAINT fk_schedules_ministry 
  FOREIGN KEY (ministry_id) REFERENCES ministries(id);

ALTER TABLE schedules ADD CONSTRAINT fk_schedules_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE schedule_members ADD CONSTRAINT fk_schedule_members_schedule 
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE;

ALTER TABLE schedule_members ADD CONSTRAINT fk_schedule_members_user 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE schedule_songs ADD CONSTRAINT fk_schedule_songs_schedule 
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE;

ALTER TABLE schedule_songs ADD CONSTRAINT fk_schedule_songs_song 
  FOREIGN KEY (song_id) REFERENCES songs(id);

ALTER TABLE messages ADD CONSTRAINT fk_messages_user 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE messages ADD CONSTRAINT fk_messages_schedule 
  FOREIGN KEY (schedule_id) REFERENCES schedules(id);

ALTER TABLE messages ADD CONSTRAINT fk_messages_ministry 
  FOREIGN KEY (ministry_id) REFERENCES ministries(id);

ALTER TABLE members ADD CONSTRAINT fk_members_user 
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE members ADD CONSTRAINT fk_members_ministry 
  FOREIGN KEY (ministry_id) REFERENCES ministries(id);

-- Criar índices para melhor performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_ministry ON users(ministry_id);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_artist ON songs(artist);
CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_schedules_ministry ON schedules(ministry_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_schedule_members_schedule ON schedule_members(schedule_id);
CREATE INDEX idx_schedule_songs_schedule ON schedule_songs(schedule_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de RLS (ajuste conforme necessário)
-- Usuários podem ver seus próprios dados
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Usuários podem atualizar seus próprios dados
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Todos podem ver músicas
CREATE POLICY "Anyone can view songs" ON songs
  FOR SELECT USING (true);

-- Usuários autenticados podem criar músicas
CREATE POLICY "Authenticated users can create songs" ON songs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Todos podem ver escalas
CREATE POLICY "Anyone can view schedules" ON schedules
  FOR SELECT USING (true);

-- Usuários autenticados podem criar escalas
CREATE POLICY "Authenticated users can create schedules" ON schedules
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Todos podem ver mensagens
CREATE POLICY "Anyone can view messages" ON messages
  FOR SELECT USING (true);

-- Usuários autenticados podem criar mensagens
CREATE POLICY "Authenticated users can create messages" ON messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');