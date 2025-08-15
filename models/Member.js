const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ministry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ministry',
    required: true
  },
  instruments: [{
    type: String,
    enum: ['vocal', 'guitarra', 'baixo', 'bateria', 'teclado', 'violao', 'saxofone', 'flauta', 'violino', 'outros']
  }],
  roles: [{
    type: String,
    enum: ['lider', 'vocal', 'musico', 'tecnico']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices
memberSchema.index({ ministry: 1, isActive: 1 });
memberSchema.index({ user: 1 });
memberSchema.index({ email: 1 });

module.exports = mongoose.model('Member', memberSchema);