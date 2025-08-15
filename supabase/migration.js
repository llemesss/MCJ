const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  console.log('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Dados de exemplo para popular o banco
const sampleData = {
  ministries: [
    {
      name: 'Ministério de Louvor',
      description: 'Responsável pela música e adoração nos cultos'
    },
    {
      name: 'Ministério de Som',
      description: 'Responsável pela operação técnica de áudio'
    }
  ],
  
  songs: [
    {
      title: 'Reckless Love',
      artist: 'Cory Asbury',
      key: 'C',
      tempo: 75,
      duration: 360,
      lyrics: 'Before I spoke a word, You were singing over me\nYou have been so, so good to me\nBefore I took a breath, You breathed Your life in me\nYou have been so, so kind to me',
      tags: ['adoração', 'lenta', 'intimista']
    },
    {
      title: 'Way Maker',
      artist: 'Sinach',
      key: 'G',
      tempo: 120,
      duration: 300,
      lyrics: 'You are here, moving in our midst\nI worship You, I worship You\nYou are here, working in this place\nI worship You, I worship You',
      tags: ['adoração', 'declaração', 'fé']
    },
    {
      title: 'Goodness of God',
      artist: 'Bethel Music',
      key: 'D',
      tempo: 85,
      duration: 420,
      lyrics: 'I love You Lord, oh Your mercy never fails me\nAll my days, I\'ve been held in Your hands\nFrom the moment that I wake up, until I lay my head\nI will sing of the goodness of God',
      tags: ['gratidão', 'bondade', 'fidelidade']
    }
  ]
};

async function runMigration() {
  try {
    console.log('🚀 Iniciando migração do Supabase...');
    
    // Inserir ministérios
    console.log('📋 Inserindo ministérios...');
    const { data: ministries, error: ministriesError } = await supabase
      .from('ministries')
      .insert(sampleData.ministries)
      .select();
    
    if (ministriesError) {
      console.error('❌ Erro ao inserir ministérios:', ministriesError);
    } else {
      console.log('✅ Ministérios inseridos com sucesso:', ministries.length);
    }
    
    // Inserir músicas
    console.log('🎵 Inserindo músicas...');
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .insert(sampleData.songs)
      .select();
    
    if (songsError) {
      console.error('❌ Erro ao inserir músicas:', songsError);
    } else {
      console.log('✅ Músicas inseridas com sucesso:', songs.length);
    }
    
    console.log('🎉 Migração concluída com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para Authentication > Settings');
    console.log('3. Configure as políticas de RLS conforme necessário');
    console.log('4. Teste a aplicação com os dados inseridos');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

// Executar migração
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };