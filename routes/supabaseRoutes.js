const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabaseService');
const { 
  authenticateToken, 
  requireAdmin, 
  requireLeader,
  requireMinistryMember,
  optionalAuth 
} = require('../middleware/supabaseAuth');

// ==================== PING/HEALTH CHECK ====================

// Rota de ping para verificar se o servidor está funcionando
router.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando corretamente'
  });
});

// ==================== AUTENTICAÇÃO ====================

// Registro de usuário
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, ministry_id, role = 'member' } = req.body;

    // Validações básicas
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Nome, email e senha são obrigatórios' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Senha deve ter pelo menos 6 caracteres' 
      });
    }

    const { user, error } = await supabaseService.createUser({
      name,
      email,
      password,
      ministry_id: ministry_id || null,
      role
    });

    if (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ 
          error: 'Email já está em uso' 
        });
      }
      return res.status(400).json({ error: error.message });
    }

    // Gerar token JWT para login automático após registro
    let token = null;
    try {
      const jwt = require('jsonwebtoken');
      console.log('Gerando token para usuário:', user.id);
      console.log('JWT_SECRET existe:', !!process.env.JWT_SECRET);
      
      token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('Token gerado com sucesso:', !!token);
    } catch (tokenError) {
      console.error('Erro ao gerar token:', tokenError);
    }
    
    const responseData = { 
      message: 'Usuário criado com sucesso',
      user,
      ...(token && { token })
    };
    
    console.log('Resposta final:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    const { user, token, error } = await supabaseService.authenticateUser(email, password);

    if (error) {
      return res.status(401).json({ error });
    }

    res.json({ 
      message: 'Login realizado com sucesso',
      user,
      token 
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar token
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Atualizar perfil do usuário
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    
    const { user, error } = await supabaseService.updateUserProfile(req.user.id, {
      name,
      phone,
      avatar
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ 
      message: 'Perfil atualizado com sucesso',
      user 
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== MÚSICAS ====================

// Listar todas as músicas
router.get('/songs', optionalAuth, async (req, res) => {
  try {
    const { songs, error } = await supabaseService.getAllSongs();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ songs });
  } catch (error) {
    console.error('Erro ao buscar músicas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova música
router.post('/songs', authenticateToken, requireLeader, async (req, res) => {
  try {
    const { title, artist, key, lyrics, chords, youtube_url, spotify_url } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ 
        error: 'Título e artista são obrigatórios' 
      });
    }

    const { song, error } = await supabaseService.createSong({
      title,
      artist,
      key,
      lyrics,
      chords,
      youtube_url,
      spotify_url,
      created_by: req.user.id
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ 
      message: 'Música criada com sucesso',
      song 
    });
  } catch (error) {
    console.error('Erro ao criar música:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar música
router.put('/songs/:id', authenticateToken, requireLeader, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remover campos que não devem ser atualizados
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;

    const { song, error } = await supabaseService.updateSong(id, updates);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!song) {
      return res.status(404).json({ error: 'Música não encontrada' });
    }

    res.json({ 
      message: 'Música atualizada com sucesso',
      song 
    });
  } catch (error) {
    console.error('Erro ao atualizar música:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar música
router.delete('/songs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseService.deleteSong(id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Música deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar música:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Incrementar contador de reprodução
router.post('/songs/:id/play', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseService.incrementPlayCount(id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Contador atualizado', play_count: data });
  } catch (error) {
    console.error('Erro ao incrementar contador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar música por ID
router.get('/songs/:id', optionalAuth, async (req, res) => {
  try {
    const supabase = require('../config/supabase');
    const { data: song, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) {
      return res.status(404).json({ error: 'Música não encontrada' });
    }
    
    res.json(song);
  } catch (error) {
    console.error('Erro ao buscar música:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar músicas por ministério
router.get('/songs/ministry/:ministryId', optionalAuth, async (req, res) => {
  try {
    const supabase = require('../config/supabase');
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .eq('ministry_id', req.params.ministryId)
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json(songs || []);
  } catch (error) {
    console.error('Erro ao buscar músicas do ministério:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Configuração do multer para upload de arquivos multitrack
const multer = require('multer');
const AdmZip = require('adm-zip');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/multitracks');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .zip são permitidos'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB
  }
});

// Função para limpeza de arquivos antigos
const cleanupOldFiles = async () => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'multitracks');
    const audioDir = path.join(uploadsDir, 'audio');
    
    if (!fs.existsSync(audioDir)) {
      return;
    }
    
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    const directories = fs.readdirSync(audioDir);
    
    for (const dir of directories) {
      const dirPath = path.join(audioDir, dir);
      const stat = fs.statSync(dirPath);
      
      if (stat.isDirectory() && (now - stat.mtime.getTime()) > maxAge) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`Diretório antigo removido: ${dir}`);
      }
    }
  } catch (error) {
    console.error('Erro na limpeza de arquivos:', error);
  }
};

// Função auxiliar para detectar instrumento baseado no nome do arquivo
function detectInstrument(fileName) {
  const name = fileName.toLowerCase();
  
  if (name.includes('vocal') || name.includes('voice') || name.includes('lead') || name.includes('singer')) {
    return 'vocal';
  } else if (name.includes('guitar') || name.includes('guitarra')) {
    return 'guitarra';
  } else if (name.includes('bass') || name.includes('baixo')) {
    return 'baixo';
  } else if (name.includes('drum') || name.includes('bateria') || name.includes('kick') || name.includes('snare')) {
    return 'bateria';
  } else if (name.includes('piano') || name.includes('keyboard') || name.includes('teclado') || name.includes('keys')) {
    return 'teclado';
  } else if (name.includes('violin') || name.includes('violino')) {
    return 'violino';
  } else if (name.includes('sax') || name.includes('saxofone')) {
    return 'saxofone';
  } else if (name.includes('flute') || name.includes('flauta')) {
    return 'flauta';
  } else {
    return 'outros';
  }
}

// Processar multitrack
router.post('/songs/process-multitrack', authenticateToken, upload.single('multitrack'), async (req, res) => {
  try {
    console.log('🎵 Processando multitrack - Usuário:', req.user?.email);
    
    // Limpar arquivos antigos antes de processar
    await cleanupOldFiles();
    
    if (!req.file) {
      console.log('❌ Nenhum arquivo enviado');
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    console.log('📁 Arquivo recebido:', req.file.originalname, 'Tamanho:', req.file.size);
    const zipPath = req.file.path;
    const extractDir = path.join(path.dirname(zipPath), `extracted-${uuidv4()}`);
    
    try {
      // Extrair o arquivo ZIP
      console.log('📦 Extraindo arquivo ZIP...');
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractDir, true);
      
      // Listar arquivos de áudio extraídos
      const audioExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg'];
      const tracks = [];
      
      const scanDirectory = (dir, relativePath = '') => {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDirectory(fullPath, path.join(relativePath, file));
          } else {
            const ext = path.extname(file).toLowerCase();
            if (audioExtensions.includes(ext)) {
              const trackName = path.basename(file, ext);
              const instrument = detectInstrument(trackName);
              
              tracks.push({
                name: trackName,
                fileName: file,
                path: path.join(relativePath, file),
                fullPath: fullPath,
                instrument: instrument,
                volume: 1.0,
                mute: false,
                solo: false
              });
            }
          }
        });
      };
      
      scanDirectory(extractDir);
      console.log(`🎼 Encontrados ${tracks.length} arquivos de áudio`);
      
      if (tracks.length === 0) {
        // Limpar arquivos temporários
        fs.rmSync(zipPath, { force: true });
        fs.rmSync(extractDir, { recursive: true, force: true });
        console.log('❌ Nenhum arquivo de áudio encontrado');
        return res.status(400).json({ message: 'Nenhum arquivo de áudio encontrado no ZIP' });
      }
      
      // Mover arquivos de áudio para diretório permanente
      const permanentDir = path.join(__dirname, '../uploads/multitracks/audio', uuidv4());
      fs.mkdirSync(permanentDir, { recursive: true });
      console.log('📂 Criado diretório permanente:', permanentDir);
      
      const processedTracks = tracks.map((track, index) => {
        // Criar nome de arquivo mais curto para evitar problemas de caminho longo
        const ext = path.extname(track.fileName);
        const shortFileName = `track_${index + 1}_${track.instrument}${ext}`.replace(/[^a-zA-Z0-9._-]/g, '_');
        const newPath = path.join(permanentDir, shortFileName);
        
        try {
          fs.copyFileSync(track.fullPath, newPath);
          console.log(`✅ Arquivo copiado: ${track.fileName} -> ${shortFileName}`);
        } catch (error) {
          console.error(`❌ Erro ao copiar arquivo ${track.fileName}:`, error.message);
          throw new Error(`Falha ao processar arquivo: ${track.fileName}`);
        }
        
        return {
          name: track.name,
          fileName: track.fileName,
          filePath: path.relative(path.join(__dirname, '../uploads'), newPath),
          instrument: track.instrument,
          volume: track.volume,
          mute: track.mute,
          solo: track.solo
        };
      });
      
      // Limpar arquivos temporários
      fs.rmSync(zipPath, { force: true });
      fs.rmSync(extractDir, { recursive: true, force: true });
      console.log('🧹 Arquivos temporários removidos');
      
      console.log('🎉 Multitrack processado com sucesso!');
      res.json({
        message: 'Multitrack processada com sucesso',
        tracks: processedTracks,
        totalTracks: processedTracks.length
      });
      
    } catch (extractError) {
      // Limpar arquivos em caso de erro
      try {
        if (fs.existsSync(zipPath)) fs.rmSync(zipPath, { force: true });
        if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Erro ao limpar arquivos temporários:', cleanupError);
      }
      
      console.error('❌ Erro ao extrair ZIP:', extractError);
      
      // Retornar erro mais específico
      const errorMessage = extractError.message.includes('Falha ao processar arquivo') 
        ? extractError.message 
        : 'Erro ao processar arquivo ZIP. Verifique se o arquivo não está corrompido e tente novamente.';
      
      return res.status(400).json({ message: errorMessage });
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar multitrack:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ==================== ESCALAS ====================

// Listar escalas
router.get('/schedules', authenticateToken, async (req, res) => {
  try {
    const { schedules, error } = await supabaseService.getAllSchedules();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Filtrar escalas por ministério se não for admin
    let filteredSchedules = schedules;
    if (req.user.role !== 'admin' && req.user.ministry_id) {
      filteredSchedules = schedules.filter(schedule => 
        schedule.ministry_id === req.user.ministry_id
      );
    }

    res.json({ schedules: filteredSchedules });
  } catch (error) {
    console.error('Erro ao buscar escalas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova escala
router.post('/schedules', authenticateToken, requireLeader, async (req, res) => {
  try {
    const { title, date, time, ministry_id, location, notes } = req.body;

    if (!title || !date || !ministry_id) {
      return res.status(400).json({ 
        error: 'Título, data e ministério são obrigatórios' 
      });
    }

    // Verificar se o usuário pode criar escala para este ministério
    if (req.user.role !== 'admin' && req.user.ministry_id !== ministry_id) {
      return res.status(403).json({ 
        error: 'Você só pode criar escalas para seu ministério' 
      });
    }

    const { schedule, error } = await supabaseService.createSchedule({
      title,
      date,
      time,
      ministry_id,
      location,
      notes,
      created_by: req.user.id
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ 
      message: 'Escala criada com sucesso',
      schedule 
    });
  } catch (error) {
    console.error('Erro ao criar escala:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== MINISTÉRIOS ====================

// Listar ministérios
router.get('/ministries', authenticateToken, async (req, res) => {
  try {
    const { ministries, error } = await supabaseService.getAllMinistries();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ ministries });
  } catch (error) {
    console.error('Erro ao buscar ministérios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar ministério
router.post('/ministries', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, leader_id } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'Nome do ministério é obrigatório' 
      });
    }

    const { ministry, error } = await supabaseService.createMinistry({
      name,
      description,
      leader_id
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ 
      message: 'Ministério criado com sucesso',
      ministry 
    });
  } catch (error) {
    console.error('Erro ao criar ministério:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== MEMBROS/MINISTÉRIOS (Compatibilidade) ====================

// Buscar membros do ministério do usuário
router.get('/members', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabaseService.getUserById(req.user.userId);
    
    if (error || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se o usuário não tem ministério, retornar array vazio
    if (!user.ministry_id) {
      return res.json([]);
    }

    // Buscar todos os membros do mesmo ministério
    const supabase = require('../config/supabase');
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('ministry_id', user.ministry_id);
    
    if (membersError) {
      console.error('Erro ao buscar membros:', membersError);
      return res.status(500).json({ error: 'Erro ao buscar membros' });
    }

    // Formatar resposta para compatibilidade com frontend (usar _id)
    const formattedMembers = members.map(member => ({
      _id: member.id,
      name: member.name,
      email: member.email,
      role: member.role
    }));
    
    res.json(formattedMembers);
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar ministérios do usuário (compatibilidade com frontend)
router.get('/members/my-ministries', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabaseService.getUserById(req.user.userId);
    
    if (error || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se o usuário tem ministry_id, buscar o ministério
    if (user.ministry_id) {
      const supabase = require('../config/supabase');
      const { data: ministry, error: ministryError } = await supabase
        .from('ministries')
        .select('*')
        .eq('id', user.ministry_id)
        .single();
      
      if (!ministryError && ministry) {
        return res.json([{
          ministry: ministry,
          role: user.role,
          joinedAt: user.created_at
        }]);
      }
    }
    
    // Se não tem ministério, retornar array vazio
    res.json([]);
  } catch (error) {
    console.error('Erro ao buscar ministérios do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar ministério (compatibilidade com frontend)
router.post('/members/ministry', authenticateToken, async (req, res) => {
  try {
    const { name, description, church } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'Nome do ministério é obrigatório' 
      });
    }

    const { ministry, error } = await supabaseService.createMinistry({
      name,
      description: description || '',
      leader_id: req.user.userId
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Atualizar o usuário para associá-lo ao ministério
    const supabase = require('../config/supabase');
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        ministry_id: ministry.id,
        role: 'admin'
      })
      .eq('id', req.user.userId);

    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError);
    }

    res.status(201).json({
      _id: ministry.id,
      name: ministry.name,
      description: ministry.description,
      church: church || '',
      createdBy: req.user.userId,
      members: [{
        user: req.user.userId,
        role: 'admin',
        instruments: [],
        joinedAt: new Date()
      }]
    });
  } catch (error) {
    console.error('Erro ao criar ministério:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== MENSAGENS ====================

// Buscar mensagens
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const { schedule_id, ministry_id } = req.query;

    const { messages, error } = await supabaseService.getMessages(
      schedule_id || null,
      ministry_id || null
    );

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ messages });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar mensagem
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { content, schedule_id, ministry_id } = req.body;

    if (!content) {
      return res.status(400).json({ 
        error: 'Conteúdo da mensagem é obrigatório' 
      });
    }

    const { message, error } = await supabaseService.createMessage({
      content,
      user_id: req.user.id,
      schedule_id: schedule_id || null,
      ministry_id: ministry_id || null
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ 
      message: 'Mensagem criada com sucesso',
      data: message 
    });
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;