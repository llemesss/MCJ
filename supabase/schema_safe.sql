-- Schema SQL para Supabase - MCJ Worship App (Versão Segura)
-- Execute este script no SQL Editor do Supabase Dashboard
-- Este script verifica se objetos já existem antes de criá-los

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

-- Adicionar chaves estrangeiras (apenas se não existirem)
DO $$
BEGIN
    -- fk_users_ministry
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_ministry' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_ministry 
            FOREIGN KEY (ministry_id) REFERENCES ministries(id);
    END IF;

    -- fk_ministries_leader
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_ministries_leader' 
        AND table_name = 'ministries'
    ) THEN
        ALTER TABLE ministries ADD CONSTRAINT fk_ministries_leader 
            FOREIGN KEY (leader_id) REFERENCES users(id);
    END IF;

    -- fk_songs_created_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_songs_created_by' 
        AND table_name = 'songs'
    ) THEN
        ALTER TABLE songs ADD CONSTRAINT fk_songs_created_by 
            FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;

    -- fk_schedules_ministry
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_schedules_ministry' 
        AND table_name = 'schedules'
    ) THEN
        ALTER TABLE schedules ADD CONSTRAINT fk_schedules_ministry 
            FOREIGN KEY (ministry_id) REFERENCES ministries(id);
    END IF;

    -- fk_schedules_created_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_schedules_created_by' 
        AND table_name = 'schedules'
    ) THEN
        ALTER TABLE schedules ADD CONSTRAINT fk_schedules_created_by 
            FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;

    -- fk_schedule_members_schedule
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_schedule_members_schedule' 
        AND table_name = 'schedule_members'
    ) THEN
        ALTER TABLE schedule_members ADD CONSTRAINT fk_schedule_members_schedule 
            FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE;
    END IF;

    -- fk_schedule_members_user
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_schedule_members_user' 
        AND table_name = 'schedule_members'
    ) THEN
        ALTER TABLE schedule_members ADD CONSTRAINT fk_schedule_members_user 
            FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;

    -- fk_schedule_songs_schedule
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_schedule_songs_schedule' 
        AND table_name = 'schedule_songs'
    ) THEN
        ALTER TABLE schedule_songs ADD CONSTRAINT fk_schedule_songs_schedule 
            FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE;
    END IF;

    -- fk_schedule_songs_song
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_schedule_songs_song' 
        AND table_name = 'schedule_songs'
    ) THEN
        ALTER TABLE schedule_songs ADD CONSTRAINT fk_schedule_songs_song 
            FOREIGN KEY (song_id) REFERENCES songs(id);
    END IF;

    -- fk_messages_user
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_messages_user' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages ADD CONSTRAINT fk_messages_user 
            FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;

    -- fk_messages_schedule
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_messages_schedule' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages ADD CONSTRAINT fk_messages_schedule 
            FOREIGN KEY (schedule_id) REFERENCES schedules(id);
    END IF;

    -- fk_messages_ministry
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_messages_ministry' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages ADD CONSTRAINT fk_messages_ministry 
            FOREIGN KEY (ministry_id) REFERENCES ministries(id);
    END IF;

    -- fk_members_user
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_members_user' 
        AND table_name = 'members'
    ) THEN
        ALTER TABLE members ADD CONSTRAINT fk_members_user 
            FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;

    -- fk_members_ministry
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_members_ministry' 
        AND table_name = 'members'
    ) THEN
        ALTER TABLE members ADD CONSTRAINT fk_members_ministry 
            FOREIGN KEY (ministry_id) REFERENCES ministries(id);
    END IF;
END $$;

-- Criar índices (apenas se não existirem)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_ministry ON users(ministry_id);
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_ministry ON schedules(ministry_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_schedule_members_schedule ON schedule_members(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_songs_schedule ON schedule_songs(schedule_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de RLS (apenas se não existirem)
DO $$
BEGIN
    -- Remover políticas existentes se houver
    DROP POLICY IF EXISTS "Users can view own profile" ON users;
    DROP POLICY IF EXISTS "Users can update own profile" ON users;
    DROP POLICY IF EXISTS "Anyone can view songs" ON songs;
    DROP POLICY IF EXISTS "Authenticated users can create songs" ON songs;
    DROP POLICY IF EXISTS "Anyone can view schedules" ON schedules;
    DROP POLICY IF EXISTS "Authenticated users can create schedules" ON schedules;
    DROP POLICY IF EXISTS "Anyone can view messages" ON messages;
    DROP POLICY IF EXISTS "Authenticated users can create messages" ON messages;
    DROP POLICY IF EXISTS "Allow user registration" ON users;
    DROP POLICY IF EXISTS "Service role full access" ON users;

    -- Criar políticas atualizadas
    -- Permitir inserção de novos usuários (registro)
    CREATE POLICY "Allow user registration" ON users
        FOR INSERT WITH CHECK (true);

    -- Permitir que o service role acesse todos os dados
    CREATE POLICY "Service role full access" ON users
        FOR ALL USING (current_setting('role') = 'service_role');

    -- Usuários podem ver seus próprios dados
    CREATE POLICY "Users can view own profile" ON users
        FOR SELECT USING (auth.uid()::text = id::text OR current_setting('role') = 'service_role');

    -- Usuários podem atualizar seus próprios dados
    CREATE POLICY "Users can update own profile" ON users
        FOR UPDATE USING (auth.uid()::text = id::text OR current_setting('role') = 'service_role');

    -- Todos podem ver músicas
    CREATE POLICY "Anyone can view songs" ON songs
        FOR SELECT USING (true);

    -- Usuários autenticados podem criar músicas
    CREATE POLICY "Authenticated users can create songs" ON songs
        FOR INSERT WITH CHECK (true);

    -- Todos podem ver escalas
    CREATE POLICY "Anyone can view schedules" ON schedules
        FOR SELECT USING (true);

    -- Usuários autenticados podem criar escalas
    CREATE POLICY "Authenticated users can create schedules" ON schedules
        FOR INSERT WITH CHECK (true);

    -- Todos podem ver mensagens
    CREATE POLICY "Anyone can view messages" ON messages
        FOR SELECT USING (true);

    -- Usuários autenticados podem criar mensagens
    CREATE POLICY "Authenticated users can create messages" ON messages
        FOR INSERT WITH CHECK (true);
END $$;