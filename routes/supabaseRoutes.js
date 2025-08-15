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