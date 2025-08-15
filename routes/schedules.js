const express = require('express');
const Schedule = require('../models/Schedule');
const Ministry = require('../models/Ministry');
const Member = require('../models/Member');
const Song = require('../models/Song');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/schedules
// @desc    Create a new schedule
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    // Ensure ministry field is always an ID, not an object
    if (req.body.ministry && typeof req.body.ministry === 'object') {
      req.body.ministry = req.body.ministry._id || req.body.ministry;
    }
    
    const { title, date, time, type, description, ministry, members, songs, location, notes } = req.body;

    // Check if user is admin or leader of the ministry
    const ministryDoc = await Ministry.findById(ministry);
    if (!ministryDoc) {
      return res.status(404).json({ message: 'Ministério não encontrado' });
    }

    const userMembership = ministryDoc.members.find(member => 
      member.user.toString() === req.user.id
    );

    if (!userMembership || !['admin', 'leader'].includes(userMembership.role)) {
      return res.status(403).json({ message: 'Permissão negada' });
    }

    const schedule = new Schedule({
      title,
      date,
      time,
      ministry,
      type,
      location,
      description,
      songs: songs || [],
      members: members || [],
      notes,
      createdBy: req.user.id
    });

    await schedule.save();
    await schedule.populate([
      { path: 'members.user', select: 'name email avatar' },
      { path: 'songs.song', select: 'title artist originalKey' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json(schedule);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/schedules
// @desc    Get all schedules for user's ministries
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;

    // Get user's ministries
    const user = await User.findById(req.user.id);
    const userMinistryIds = user.ministries.map(m => 
      typeof m.ministry === 'object' ? m.ministry._id : m.ministry
    );

    // Build query
    let query = { ministry: { $in: userMinistryIds } };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const schedules = await Schedule.find(query)
      .populate('members.user', 'name email avatar')
      .populate('songs.song', 'title artist originalKey')
      .populate('ministry', 'name')
      .populate('createdBy', 'name email')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Schedule.countDocuments(query);

    res.json({
      schedules,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao buscar escalas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   GET /api/schedules/ministry/:ministryId
// @desc    Get schedules for a ministry
// @access  Private
router.get('/ministry/:ministryId', auth, async (req, res) => {
  try {
    const { ministryId } = req.params;
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;

    // Check if user is member of the ministry
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

    // Build query
    let query = { ministry: ministryId };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const schedules = await Schedule.find(query)
      .populate('members.user', 'name email avatar')
      .populate('songs.song', 'title artist originalKey')
      .populate('createdBy', 'name email')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Schedule.countDocuments(query);

    res.json({
      schedules,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/schedules/:id
// @desc    Get schedule by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('members.user', 'name email avatar phone')
      .populate('songs.song', 'title artist originalKey lyrics chords')
      .populate('createdBy', 'name email')
      .populate('ministry', 'name');

    if (!schedule) {
      return res.status(404).json({ message: 'Escala não encontrada' });
    }

    // Check if user is member of the ministry
    const ministry = await Ministry.findById(schedule.ministry);
    const isMember = ministry.members.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(schedule);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   PUT /api/schedules/:id
// @desc    Update schedule
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    // Ensure ministry field is always an ID, not an object
    if (req.body.ministry && typeof req.body.ministry === 'object') {
      req.body.ministry = req.body.ministry._id || req.body.ministry;
    }
    
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Escala não encontrada' });
    }

    // Check if user is admin or leader of the ministry
    const ministry = await Ministry.findById(schedule.ministry);
    const userMembership = ministry.members.find(member => 
      member.user.toString() === req.user.id
    );

    if (!userMembership || !['admin', 'leader'].includes(userMembership.role)) {
      return res.status(403).json({ message: 'Permissão negada' });
    }

    const updateFields = req.body;
    Object.keys(updateFields).forEach(key => {
      schedule[key] = updateFields[key];
    });

    await schedule.save();
    await schedule.populate([
      { path: 'members.user', select: 'name email avatar' },
      { path: 'songs.song', select: 'title artist originalKey' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json(schedule);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   PUT /api/schedules/:id/confirm
// @desc    Confirm participation in schedule
// @access  Private
router.put('/:id/confirm', auth, async (req, res) => {
  try {
    const { confirmed } = req.body; // 'confirmed', 'declined'
    
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Escala não encontrada' });
    }

    // Find user in schedule members
    const memberIndex = schedule.members.findIndex(member => 
      member.user.toString() === req.user.id
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Você não está escalado para este evento' });
    }

    schedule.members[memberIndex].confirmed = confirmed;
    schedule.members[memberIndex].confirmedAt = new Date();

    await schedule.save();
    await schedule.populate('members.user', 'name email avatar');

    res.json(schedule);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   PUT /api/schedules/:id/attendance
// @desc    Mark attendance for schedule
// @access  Private
router.put('/:id/attendance', auth, async (req, res) => {
  try {
    const { attendance } = req.body; // Array of { user, present, notes }
    
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Escala não encontrada' });
    }

    // Check if user is admin or leader
    const ministry = await Ministry.findById(schedule.ministry);
    const userMembership = ministry.members.find(member => 
      member.user.toString() === req.user.id
    );

    if (!userMembership || !['admin', 'leader'].includes(userMembership.role)) {
      return res.status(403).json({ message: 'Permissão negada' });
    }

    schedule.attendance = attendance.map(att => ({
      ...att,
      markedBy: req.user.id,
      markedAt: new Date()
    }));

    await schedule.save();
    await schedule.populate('attendance.user', 'name email avatar');

    res.json(schedule);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   DELETE /api/schedules/:id
// @desc    Delete schedule
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Escala não encontrada' });
    }

    // Check if user is admin or leader of the ministry
    const ministry = await Ministry.findById(schedule.ministry);
    const userMembership = ministry.members.find(member => 
      member.user.toString() === req.user.id
    );

    if (!userMembership || !['admin', 'leader'].includes(userMembership.role)) {
      return res.status(403).json({ message: 'Permissão negada' });
    }

    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Escala removida com sucesso' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   POST /api/schedules/:id/members
// @desc    Adicionar membro à escala
// @access  Private
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { memberId, role } = req.body;
    
    if (!memberId || !role) {
      return res.status(400).json({ 
        message: 'ID do membro e função são obrigatórios' 
      });
    }
    
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Escala não encontrada' });
    }
    
    // Verificar se o membro existe
    const member = await Member.findById(memberId);
    
    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado' });
    }
    
    // Verificar se o membro já está na escala
    const existingMember = schedule.members.find(
      m => m.user && m.user.toString() === member.user.toString()
    );
    
    if (existingMember) {
      return res.status(400).json({ 
        message: 'Este membro já está na escala' 
      });
    }
    
    schedule.members.push({
      user: member.user,
      role: role,
      confirmed: false
    });
    
    await schedule.save();
    await schedule.populate([
      { path: 'members.user', select: 'name email avatar' },
      { path: 'songs.song', select: 'title artist originalKey' }
    ]);
    
    res.json(schedule);
  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   DELETE /api/schedules/:id/members/:memberId
// @desc    Remover membro da escala
// @access  Private
router.delete('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Escala não encontrada' });
    }
    
    // Encontrar o membro para obter o user ID
    const member = await Member.findById(req.params.memberId);
    if (!member) {
      return res.status(404).json({ message: 'Membro não encontrado' });
    }
    
    // Remover o membro da escala
    schedule.members = schedule.members.filter(
      m => m.user.toString() !== member.user.toString()
    );
    
    await schedule.save();
    await schedule.populate([
      { path: 'members.user', select: 'name email avatar' },
      { path: 'songs.song', select: 'title artist originalKey' }
    ]);
    
    res.json(schedule);
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   POST /api/schedules/:id/songs
// @desc    Adicionar música à escala
// @access  Private
router.post('/:id/songs', auth, async (req, res) => {
  try {
    const { songId } = req.body;
    
    if (!songId) {
      return res.status(400).json({ 
        message: 'ID da música é obrigatório' 
      });
    }
    
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Escala não encontrada' });
    }
    
    // Verificar se a música existe
    const song = await Song.findById(songId);
    
    if (!song) {
      return res.status(404).json({ message: 'Música não encontrada' });
    }
    
    // Verificar se a música já está na escala
    const existingSong = schedule.songs.find(
      s => s.song.toString() === songId
    );
    
    if (existingSong) {
      return res.status(400).json({ 
        message: 'Esta música já está no repertório' 
      });
    }
    
    schedule.songs.push({
      song: songId,
      key: song.originalKey || 'C'
    });
    
    await schedule.save();
    await schedule.populate([
      { path: 'members.user', select: 'name email avatar' },
      { path: 'songs.song', select: 'title artist originalKey' }
    ]);
    
    res.json(schedule);
  } catch (error) {
    console.error('Erro ao adicionar música:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// @route   DELETE /api/schedules/:id/songs/:songId
// @desc    Remover música da escala
// @access  Private
router.delete('/:id/songs/:songId', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Escala não encontrada' });
    }
    
    // Remover a música da escala
    schedule.songs = schedule.songs.filter(
      s => s.song.toString() !== req.params.songId
    );
    
    await schedule.save();
    await schedule.populate([
      { path: 'members.user', select: 'name email avatar' },
      { path: 'songs.song', select: 'title artist originalKey' }
    ]);
    
    res.json(schedule);
  } catch (error) {
    console.error('Erro ao remover música:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;