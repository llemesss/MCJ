const express = require('express');
const Message = require('../models/Message');
const Ministry = require('../models/Ministry');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/chat/message
// @desc    Send a message
// @access  Private
router.post('/message', auth, async (req, res) => {
  try {
    // Ensure ministry field is always an ID, not an object
    if (req.body.ministry && typeof req.body.ministry === 'object') {
      req.body.ministry = req.body.ministry._id || req.body.ministry;
    }
    
    const { content, ministry, type, attachments, references, replyTo } = req.body;

    // Check if user is member of the ministry
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

    const message = new Message({
      content,
      sender: req.user.id,
      ministry,
      type: type || 'text',
      attachments: attachments || [],
      references: references || {},
      replyTo
    });

    await message.save();
    await message.populate([
      { path: 'sender', select: 'name email avatar' },
      { path: 'replyTo', populate: { path: 'sender', select: 'name' } },
      { path: 'references.schedule', select: 'title date' },
      { path: 'references.song', select: 'title artist' }
    ]);

    res.json(message);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/chat/ministry/:ministryId
// @desc    Get messages for a ministry
// @access  Private
router.get('/ministry/:ministryId', auth, async (req, res) => {
  try {
    const { ministryId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

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

    let query = { ministry: ministryId, isDeleted: false };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email avatar')
      .populate('replyTo', 'content sender')
      .populate('replyTo.sender', 'name')
      .populate('references.schedule', 'title date')
      .populate('references.song', 'title artist')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Mark messages as read
    const unreadMessages = messages.filter(msg => 
      !msg.readBy.some(read => read.user.toString() === req.user.id)
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { 
          _id: { $in: unreadMessages.map(msg => msg._id) },
          'readBy.user': { $ne: req.user.id }
        },
        {
          $push: {
            readBy: {
              user: req.user.id,
              readAt: new Date()
            }
          }
        }
      );
    }

    res.json(messages.reverse());
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   PUT /api/chat/message/:id
// @desc    Edit a message
// @access  Private
router.put('/message/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Mensagem não encontrada' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Permissão negada' });
    }

    // Check if message is not too old (e.g., 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(400).json({ message: 'Não é possível editar mensagens antigas' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();
    await message.populate([
      { path: 'sender', select: 'name email avatar' },
      { path: 'replyTo', populate: { path: 'sender', select: 'name' } }
    ]);

    res.json(message);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   DELETE /api/chat/message/:id
// @desc    Delete a message
// @access  Private
router.delete('/message/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Mensagem não encontrada' });
    }

    // Check if user is the sender or admin
    const ministry = await Ministry.findById(message.ministry);
    const userMembership = ministry.members.find(member => 
      member.user.toString() === req.user.id
    );

    const canDelete = 
      message.sender.toString() === req.user.id ||
      (userMembership && userMembership.role === 'admin');

    if (!canDelete) {
      return res.status(403).json({ message: 'Permissão negada' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = req.user.id;

    await message.save();
    res.json({ message: 'Mensagem removida com sucesso' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   POST /api/chat/message/:id/reaction
// @desc    Add reaction to message
// @access  Private
router.post('/message/:id/reaction', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Mensagem não encontrada' });
    }

    // Check if user is member of the ministry
    const ministry = await Ministry.findById(message.ministry);
    const isMember = ministry.members.some(member => 
      member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(reaction => 
      reaction.user.toString() === req.user.id && reaction.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(reaction => 
        !(reaction.user.toString() === req.user.id && reaction.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({
        user: req.user.id,
        emoji,
        createdAt: new Date()
      });
    }

    await message.save();
    await message.populate('reactions.user', 'name avatar');

    res.json(message);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

// @route   GET /api/chat/ministry/:ministryId/unread
// @desc    Get unread message count
// @access  Private
router.get('/ministry/:ministryId/unread', auth, async (req, res) => {
  try {
    const { ministryId } = req.params;

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

    const unreadCount = await Message.countDocuments({
      ministry: ministryId,
      isDeleted: false,
      sender: { $ne: req.user.id },
      'readBy.user': { $ne: req.user.id }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Erro do servidor' });
  }
});

module.exports = router;