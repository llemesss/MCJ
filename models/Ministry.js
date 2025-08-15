const mongoose = require('mongoose');

const ministrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  church: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  settings: {
    allowMemberSelfScheduling: {
      type: Boolean,
      default: false
    },
    requireConfirmation: {
      type: Boolean,
      default: true
    },
    notificationDays: {
      type: Number,
      default: 3
    },
    defaultInstruments: [{
      type: String,
      enum: ['vocal', 'guitarra', 'baixo', 'bateria', 'teclado', 'violao', 'saxofone', 'flauta', 'violino', 'outros']
    }]
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'leader', 'member'],
      default: 'member'
    },
    instruments: [{
      type: String,
      enum: ['vocal', 'guitarra', 'baixo', 'bateria', 'teclado', 'violao', 'saxofone', 'flauta', 'violino', 'outros']
    }],
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
ministrySchema.index({ name: 1, church: 1 });
ministrySchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Ministry', ministrySchema);