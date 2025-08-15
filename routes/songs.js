const express = require('express');
const Ministry = require('../models/Ministry');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { v4: uuidv4 } = require('uuid');
const sqliteDB = require('../database');
const { processYouTubeUrlWithValidation } = require('../utils/youtubeUtils');
const router = express.Router();

// Configuração do multer para upload de arquivos
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

// @route   POST /api/songs
// @desc    Create a new song
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    // Ensure ministry field is always an ID, not an object
    if (req.body.ministry && typeof req.body.ministry === 'object') {
      req.body.ministry = req.body.ministry._id || req.body.ministry;
    }
    
    // Processar link do YouTube se fornecido
    if (req.body.links && req.body.links.youtube) {
      try {
        const youtubeInfo = await processYouTubeUrlWithValidation(req.body.links.youtube);
        if (youtubeInfo) {
          req.body.youtubeVideoId = youtubeInfo.videoId;
          if (youtubeInfo.thumbnail) {
            req.body.thumbnail = youtubeInfo.thumbnail;
          }
        }
      } catch (error) {
        console.error('Erro ao processar URL do YouTube:', error);
        // Continua sem falhar se houver erro no processamento do YouTube
      }
    }
    
    const {
      title, artist, album, originalKey, bpm, duration, genre,
      ministry, lyrics, chords, links, tags, difficulty,
      instruments, notes, multitrack
    } = req.body;

    // Check if user is member of the ministry (skip check for default ministry)
    if (ministry && ministry !== 'default-ministry-id') {
      try {
        const ministryDoc = await Ministry.findById(ministry);
        if (!ministryDoc) {
          return res.status(404).json({ message: 'Ministério não encontrado' });
        }

        const isMember = ministryDoc.members.some(member => 
          member.user.toString() === req.user.id
        );

        if (!isMember) {
          return res.status(403).json({ message: 'Acesso negado' });
        }
      } catch (error) {
        console.error('Erro ao verificar ministério:', error.message);
        return res.status(400).json({ message: 'ID de ministério inválido' });
      }
    }

    // Usar SQLite para salvar a música
    const songData = {
      id: uuidv4(),
      title,
      artist,
      album,
      originalKey,
      bpm,
      duration,
      genre,
      ministry,
      lyrics,
      chords,
      links,
      tags,
      difficulty,
      instruments,
      notes,
      multitrack,
      createdBy: req.user.id
    };

    const savedSong = await sqliteDB.insertSong(songData);
    console.log('Música salva no SQLite:', savedSong.title);

    res.json(savedSong);
  } catch (error) {
    console.error('Erro ao salvar música:', error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/songs/ministry/:ministryId
// @desc    Get songs for a ministry
// @access  Private
router.get('/ministry/:ministryId', auth, async (req, res) => {
  try {
    const { ministryId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      search, 
      genre, 
      difficulty, 
      sortBy = 'title',
      sortOrder = 'asc'
    } = req.query;

    // Check if user is member of the ministry (skip check for default ministry)
    if (ministryId !== 'default-ministry-id') {
      try {
        const ministry = await Ministry.findById(ministryId);
        if (!ministry) {
          return res.status(404).json({ message: 'Ministério não encontrado' });
        }

        const isMember = ministry.members.some(member => 
          member.user.toString() === req.user.id
        );

        if (!isMember) {
          return res.status(403).json({ message: 'Acesso negado' });
        }
      } catch (error) {
        console.error('Erro ao verificar ministério:', error.message);
        return res.status(400).json({ message: 'ID de ministério inválido' });
      }
    }

    // Buscar todas as músicas do SQLite
    const allSongs = await sqliteDB.getAllSongs();
    
    // Filtrar por ministério e apenas músicas ativas
    let filteredSongs = allSongs.filter(song => 
      song.ministry === ministryId && song.isActive !== false
    );
    
    // Aplicar filtros de busca
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSongs = filteredSongs.filter(song => 
        song.title.toLowerCase().includes(searchLower) ||
        (song.artist && song.artist.toLowerCase().includes(searchLower)) ||
        (song.tags && song.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    if (genre) {
      filteredSongs = filteredSongs.filter(song => song.genre === genre);
    }
    
    if (difficulty) {
      filteredSongs = filteredSongs.filter(song => song.difficulty === difficulty);
    }

    // Ordenar
    filteredSongs.sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      if (sortOrder === 'desc') {
        return bValue.localeCompare(aValue);
      }
      return aValue.localeCompare(bValue);
    });

    // Paginação
    const total = filteredSongs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedSongs = filteredSongs.slice(startIndex, endIndex);

    // Transformar dados para compatibilidade com frontend
    const formattedSongs = paginatedSongs.map(song => ({
      _id: song.id,
      title: song.title,
      artist: song.artist || 'Artista Desconhecido',
      originalKey: song.originalKey,
      bpm: song.bpm,
      genre: song.genre,
      difficulty: song.difficulty,
      lyrics: song.lyrics,
      notes: song.notes,
      tags: song.tags || [],
      instruments: song.instruments || [],
      links: song.links || {},
      thumbnail: song.thumbnail,
      youtubeVideoId: song.youtubeVideoId,
      album: song.album,
      duration: song.duration,
      ministry: song.ministry,
      createdBy: song.createdBy,
      createdAt: song.createdAt,
      timesPlayed: song.timesPlayed || 0,
      lastPlayed: song.lastPlayed,
      isActive: song.isActive !== false
    }));

    res.json({
      songs: formattedSongs,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/songs/:id
// @desc    Get song by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const song = await sqliteDB.getSongById(req.params.id);

    if (!song) {
      return res.status(404).json({ message: 'Música não encontrada' });
    }

    // Check if user is member of the ministry (skip check for default ministry)
    if (song.ministry && song.ministry !== 'default-ministry-id') {
      try {
        const ministry = await Ministry.findById(song.ministry);
        if (!ministry) {
          return res.status(404).json({ message: 'Ministério não encontrado' });
        }
        
        const isMember = ministry.members.some(member => 
          member.user.toString() === req.user.id
        );

        if (!isMember) {
          return res.status(403).json({ message: 'Acesso negado' });
        }
      } catch (error) {
        console.error('Erro ao verificar ministério:', error.message);
        return res.status(400).json({ message: 'ID de ministério inválido' });
      }
    }

    res.json(song);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   PUT /api/songs/:id
// @desc    Update song
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const song = await sqliteDB.getSongById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Música não encontrada' });
    }

    // Check if user is member of the ministry (skip check for default ministry)
    if (song.ministry && song.ministry !== 'default-ministry-id') {
      try {
        const ministry = await Ministry.findById(song.ministry);
        if (!ministry) {
          return res.status(404).json({ message: 'Ministério não encontrado' });
        }
        
        const isMember = ministry.members.some(member => 
          member.user.toString() === req.user.id
        );

        if (!isMember) {
          return res.status(403).json({ message: 'Acesso negado' });
        }
      } catch (error) {
        console.error('Erro ao verificar ministério:', error.message);
        return res.status(400).json({ message: 'ID de ministério inválido' });
      }
    }

    // Processar link do YouTube se fornecido
    if (req.body.links && req.body.links.youtube) {
      try {
        const youtubeInfo = await processYouTubeUrlWithValidation(req.body.links.youtube);
        if (youtubeInfo) {
          req.body.youtubeVideoId = youtubeInfo.videoId;
          if (youtubeInfo.thumbnail) {
            req.body.thumbnail = youtubeInfo.thumbnail;
          }
        }
      } catch (error) {
        console.error('Erro ao processar URL do YouTube:', error);
        // Continua sem falhar se houver erro no processamento do YouTube
      }
    }
    
    const updateFields = req.body;
    const updatedSong = { ...song };
    Object.keys(updateFields).forEach(key => {
      if (key !== 'createdBy' && key !== 'ministry') {
        updatedSong[key] = updateFields[key];
      }
    });

    await sqliteDB.updateSong(req.params.id, updatedSong);
    const finalSong = await sqliteDB.getSongById(req.params.id);

    res.json(finalSong);
  } catch (error) {
    console.error('Erro ao atualizar música:', error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   POST /api/songs/:id/rate
// @desc    Rate a song
// @access  Private
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Avaliação deve ser entre 1 e 5' });
    }

    const song = await sqliteDB.getSongById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Música não encontrada' });
    }

    // Check if user is member of the ministry (skip check for default ministry)
    if (song.ministry && song.ministry !== 'default-ministry-id') {
      try {
        const ministry = await Ministry.findById(song.ministry);
        if (!ministry) {
          return res.status(404).json({ message: 'Ministério não encontrado' });
        }
        
        const isMember = ministry.members.some(member => 
          member.user.toString() === req.user.id
        );

        if (!isMember) {
          return res.status(403).json({ message: 'Acesso negado' });
        }
      } catch (error) {
        console.error('Erro ao verificar ministério:', error.message);
        return res.status(400).json({ message: 'ID de ministério inválido' });
      }
    }

    // Para simplificar, vamos apenas atualizar a música com a nova avaliação
    // Em uma implementação completa, seria necessário uma tabela separada para ratings
    const updatedSong = {
      ...song,
      lastRating: rating,
      lastRatingComment: comment,
      lastRatingUser: req.user.id,
      lastRatingDate: new Date().toISOString()
    };

    await sqliteDB.updateSong(req.params.id, updatedSong);
    const finalSong = await sqliteDB.getSongById(req.params.id);

    res.json(finalSong);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   PUT /api/songs/:id/usage
// @desc    Update song usage stats
// @access  Private
router.put('/:id/usage', auth, async (req, res) => {
  try {
    const song = await sqliteDB.getSongById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Música não encontrada' });
    }

    // Check if user is member of the ministry (skip check for default ministry)
    if (song.ministry && song.ministry !== 'default-ministry-id') {
      try {
        const ministry = await Ministry.findById(song.ministry);
        if (!ministry) {
          return res.status(404).json({ message: 'Ministério não encontrado' });
        }
        
        const isMember = ministry.members.some(member => 
          member.user.toString() === req.user.id
        );

        if (!isMember) {
          return res.status(403).json({ message: 'Acesso negado' });
        }
      } catch (error) {
        console.error('Erro ao verificar ministério:', error.message);
        return res.status(400).json({ message: 'ID de ministério inválido' });
      }
    }

    const updatedSong = {
      ...song,
      timesPlayed: (song.timesPlayed || 0) + 1,
      lastPlayed: new Date().toISOString()
    };

    await sqliteDB.updateSong(req.params.id, updatedSong);
    const finalSong = await sqliteDB.getSongById(req.params.id);
    res.json(finalSong);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   DELETE /api/songs/:id
// @desc    Delete song (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const song = await sqliteDB.getSongById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Música não encontrada' });
    }

    // Check if user is admin/leader or song creator
    let canDelete = song.createdBy.toString() === req.user.id;
    
    if (song.ministry && song.ministry !== 'default-ministry-id' && !canDelete) {
      try {
        const ministry = await Ministry.findById(song.ministry);
        if (ministry) {
          const userMembership = ministry.members.find(member => 
            member.user.toString() === req.user.id
          );
          canDelete = userMembership && ['admin', 'leader'].includes(userMembership.role);
        }
      } catch (error) {
        console.error('Erro ao verificar ministério:', error.message);
        // If there's an error checking ministry, don't allow deletion unless user is creator
      }
    } else if (song.ministry === 'default-ministry-id' && !canDelete) {
      // For default ministry, allow any authenticated user to delete
      canDelete = true;
    }

    if (!canDelete) {
      return res.status(403).json({ message: 'Permissão negada' });
    }

    const updatedSong = {
      ...song,
      isActive: false
    };
    await sqliteDB.updateSong(req.params.id, updatedSong);

    res.json({ message: 'Música removida com sucesso' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/songs/ministry/:ministryId/stats
// @desc    Get song statistics for ministry
// @access  Private
router.get('/ministry/:ministryId/stats', auth, async (req, res) => {
  try {
    const { ministryId } = req.params;

    // Check if user is member of the ministry (skip check for default ministry)
    if (ministryId !== 'default-ministry-id') {
      try {
        const ministry = await Ministry.findById(ministryId);
        if (!ministry) {
          return res.status(404).json({ message: 'Ministério não encontrado' });
        }

        const isMember = ministry.members.some(member => 
          member.user.toString() === req.user.id
        );

        if (!isMember) {
          return res.status(403).json({ message: 'Acesso negado' });
        }
      } catch (error) {
        console.error('Erro ao verificar ministério:', error.message);
        return res.status(400).json({ message: 'ID de ministério inválido' });
      }
    }

    // Buscar músicas do SQLite e filtrar
    const allSongs = await sqliteDB.getAllSongs();
    const ministrySongs = allSongs.filter(song => 
      song.ministry === ministryId && song.isActive !== false
    );

    // Calcular estatísticas usando dados do SQLite
    const stats = {
      totalSongs: ministrySongs.length,
      totalPlays: ministrySongs.reduce((sum, song) => sum + (song.timesPlayed || 0), 0),
      averageRating: ministrySongs.filter(song => song.lastRating).length > 0 ?
        ministrySongs.filter(song => song.lastRating).reduce((sum, song) => sum + song.lastRating, 0) / ministrySongs.filter(song => song.lastRating).length : 0
    };

    const mostPlayed = ministrySongs
      .sort((a, b) => (b.timesPlayed || 0) - (a.timesPlayed || 0))
      .slice(0, 10)
      .map(song => ({
        title: song.title,
        artist: song.artist,
        timesPlayed: song.timesPlayed || 0,
        lastPlayed: song.lastPlayed
      }));

    const topRated = ministrySongs
      .filter(song => song.lastRating)
      .sort((a, b) => (b.lastRating || 0) - (a.lastRating || 0))
      .slice(0, 10)
      .map(song => ({
        title: song.title,
        artist: song.artist,
        averageRating: song.lastRating || 0
      }));

    res.json({
      stats,
      mostPlayed,
      topRated
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/songs
// @desc    Obter todas as músicas para escalas
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Buscar todas as músicas do SQLite
    const songs = await sqliteDB.getAllSongs();
    
    // Filtrar apenas músicas ativas
    const activeSongs = songs.filter(song => song.isActive !== false);
    
    // Transformar para formato compatível com escalas
    const formattedSongs = activeSongs.map(song => ({
      _id: song.id,
      title: song.title,
      artist: song.artist || 'Artista Desconhecido',
      key: song.originalKey || 'C',
      genre: song.genre,
      difficulty: song.difficulty,
      thumbnail: song.thumbnail,
      links: song.links,
      youtubeVideoId: song.youtubeVideoId,
      createdAt: song.createdAt,
      album: song.album,
      duration: song.duration
    }));
    
    res.json(formattedSongs);
  } catch (error) {
    console.error('Erro ao buscar músicas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   POST /api/songs/:id/play
// @desc    Register song play
// @access  Private
router.post('/:id/play', auth, async (req, res) => {
  try {
    const song = await sqliteDB.getSongById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Música não encontrada' });
    }

    // Atualizar estatísticas de uso
    const updatedSong = {
      ...song,
      timesPlayed: (song.timesPlayed || 0) + 1,
      lastPlayed: new Date().toISOString()
    };

    await sqliteDB.updateSong(req.params.id, updatedSong);

    res.json({ 
      message: 'Reprodução registrada com sucesso',
      timesPlayed: updatedSong.timesPlayed
    });
  } catch (error) {
    console.error('Erro ao registrar reprodução:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Função para limpar arquivos antigos
const cleanupOldFiles = async () => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'multitracks');
    const audioDir = path.join(uploadsDir, 'audio');
    
    if (!fs.existsSync(audioDir)) return;
    
    const folders = fs.readdirSync(audioDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    for (const folder of folders) {
      const folderPath = path.join(audioDir, folder);
      const stats = fs.statSync(folderPath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.rmSync(folderPath, { recursive: true, force: true });
        console.log(`Pasta antiga removida: ${folder}`);
      }
    }
  } catch (error) {
    console.error('Erro ao limpar arquivos antigos:', error);
  }
};

// @route   POST /api/songs/process-multitrack
// @desc    Process multitrack ZIP file
// @access  Private
router.post('/process-multitrack', auth, upload.single('multitrack'), async (req, res) => {
  try {
    // Limpar arquivos antigos antes de processar
    await cleanupOldFiles();
    
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    const zipPath = req.file.path;
    const extractDir = path.join(path.dirname(zipPath), `extracted-${uuidv4()}`);
    
    try {
      // Extrair o arquivo ZIP
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
      
      if (tracks.length === 0) {
        // Limpar arquivos temporários
        fs.rmSync(zipPath, { force: true });
        fs.rmSync(extractDir, { recursive: true, force: true });
        return res.status(400).json({ message: 'Nenhum arquivo de áudio encontrado no ZIP' });
      }
      
      // Mover arquivos de áudio para diretório permanente
      const permanentDir = path.join(__dirname, '../uploads/multitracks/audio', uuidv4());
      fs.mkdirSync(permanentDir, { recursive: true });
      
      const processedTracks = tracks.map((track, index) => {
        // Criar nome de arquivo mais curto para evitar problemas de caminho longo
        const ext = path.extname(track.fileName);
        const shortFileName = `track_${index + 1}_${track.instrument}${ext}`.replace(/[^a-zA-Z0-9._-]/g, '_');
        const newPath = path.join(permanentDir, shortFileName);
        
        try {
          fs.copyFileSync(track.fullPath, newPath);
        } catch (error) {
          console.error(`Erro ao copiar arquivo ${track.fileName}:`, error.message);
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
      
      console.error('Erro ao extrair ZIP:', extractError);
      
      // Retornar erro mais específico
      const errorMessage = extractError.message.includes('Falha ao processar arquivo') 
        ? extractError.message 
        : 'Erro ao processar arquivo ZIP. Verifique se o arquivo não está corrompido e tente novamente.';
      
      return res.status(400).json({ message: errorMessage });
    }
    
  } catch (error) {
    console.error('Erro ao processar multitrack:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

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

module.exports = router;