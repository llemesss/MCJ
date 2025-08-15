const express = require('express');
const User = require('../models/User');
const Ministry = require('../models/Ministry');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/members/ministry
// @desc    Create a new ministry
// @access  Private
router.post('/ministry', auth, async (req, res) => {
  try {
    const { name, description, church } = req.body;

    const ministry = new Ministry({
      name,
      description,
      church,
      createdBy: req.user.id,
      members: [{
        user: req.user.id,
        role: 'admin',
        instruments: [],
        joinedAt: new Date()
      }]
    });

    await ministry.save();

    // Add ministry to user
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        ministries: {
          ministry: ministry._id,
          role: 'admin',
          instruments: [],
          joinedAt: new Date()
        }
      }
    });

    await ministry.populate('members.user', 'name email avatar');
    res.json(ministry);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/members/ministry/:id
// @desc    Get ministry details
// @access  Private
router.get('/ministry/:id', auth, async (req, res) => {
  try {
    const ministry = await Ministry.findById(req.params.id)
      .populate('members.user', 'name email avatar phone')
      .populate('createdBy', 'name email');

    if (!ministry) {
      return res.status(404).json({ message: 'Ministério não encontrado' });
    }

    // Check if user is member of this ministry
    const isMember = ministry.members.some(member => 
      member.user._id.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    res.json(ministry);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   POST /api/members/ministry/:id/invite
// @desc    Invite member to ministry
// @access  Private
router.post('/ministry/:id/invite', auth, async (req, res) => {
  try {
    const { email, instruments, role } = req.body;
    const ministryId = req.params.id;

    const ministry = await Ministry.findById(ministryId);
    if (!ministry) {
      return res.status(404).json({ message: 'Ministério não encontrado' });
    }

    // Check if user is admin or leader
    const userMembership = ministry.members.find(member => 
      member.user.toString() === req.user.id
    );

    if (!userMembership || !['admin', 'leader'].includes(userMembership.role)) {
      return res.status(403).json({ message: 'Permissão negada' });
    }

    // Find user by email
    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Check if user is already a member
    const isAlreadyMember = ministry.members.some(member => 
      member.user.toString() === invitedUser._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: 'Usuário já é membro deste ministério' });
    }

    // Add member to ministry
    ministry.members.push({
      user: invitedUser._id,
      role: role || 'member',
      instruments: instruments || [],
      joinedAt: new Date()
    });

    await ministry.save();

    // Add ministry to user
    invitedUser.ministries.push({
      ministry: ministryId,
      role: role || 'member',
      instruments: instruments || [],
      joinedAt: new Date()
    });

    await invitedUser.save();

    await ministry.populate('members.user', 'name email avatar phone');
    res.json(ministry);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   PUT /api/members/ministry/:id/member/:memberId
// @desc    Update member role and instruments
// @access  Private
router.put('/ministry/:id/member/:memberId', auth, async (req, res) => {
  try {
    const { role, instruments } = req.body;
    const { id: ministryId, memberId } = req.params;

    const ministry = await Ministry.findById(ministryId);
    if (!ministry) {
      return res.status(404).json({ message: 'Ministério não encontrado' });
    }

    // Check if user is admin or leader
    const userMembership = ministry.members.find(member => 
      member.user.toString() === req.user.id
    );

    if (!userMembership || !['admin', 'leader'].includes(userMembership.role)) {
      return res.status(403).json({ message: 'Permissão negada' });
    }

    // Find and update member
    const memberIndex = ministry.members.findIndex(member => 
      member.user.toString() === memberId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Membro não encontrado' });
    }

    if (role) ministry.members[memberIndex].role = role;
    if (instruments) ministry.members[memberIndex].instruments = instruments;

    await ministry.save();

    // Update user's ministry info
    await User.findOneAndUpdate(
      { _id: memberId, 'ministries.ministry': ministryId },
      {
        $set: {
          'ministries.$.role': role || ministry.members[memberIndex].role,
          'ministries.$.instruments': instruments || ministry.members[memberIndex].instruments
        }
      }
    );

    await ministry.populate('members.user', 'name email avatar phone');
    res.json(ministry);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   DELETE /api/members/ministry/:id/member/:memberId
// @desc    Remove member from ministry
// @access  Private
router.delete('/ministry/:id/member/:memberId', auth, async (req, res) => {
  try {
    const { id: ministryId, memberId } = req.params;

    const ministry = await Ministry.findById(ministryId);
    if (!ministry) {
      return res.status(404).json({ message: 'Ministério não encontrado' });
    }

    // Check if user is admin or the member themselves
    const userMembership = ministry.members.find(member => 
      member.user.toString() === req.user.id
    );

    const isAdmin = userMembership && userMembership.role === 'admin';
    const isSelf = req.user.id === memberId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Permissão negada' });
    }

    // Remove member from ministry
    ministry.members = ministry.members.filter(member => 
      member.user.toString() !== memberId
    );

    await ministry.save();

    // Remove ministry from user
    await User.findByIdAndUpdate(memberId, {
      $pull: {
        ministries: { ministry: ministryId }
      }
    });

    await ministry.populate('members.user', 'name email avatar phone');
    res.json(ministry);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/members/my-ministries
// @desc    Get user's ministries
// @access  Private
router.get('/my-ministries', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('ministries.ministry', 'name description church logo')
      .select('ministries');

    res.json(user.ministries);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/members
// @desc    Obter todos os membros (usuários) para escalas
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // Buscar todos os usuários como membros potenciais
    const users = await User.find({})
      .select('name email phone')
      .sort({ name: 1 });
    
    // Transformar usuários em formato de membros para compatibilidade
    const members = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      user: user._id,
      instruments: [],
      roles: ['musico'],
      isActive: true
    }));
    
    res.json(members);
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;