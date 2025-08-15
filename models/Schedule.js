const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  ministry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ministry',
    required: true
  },
  type: {
    type: String,
    enum: ['culto', 'ensaio', 'evento', 'especial'],
    default: 'culto'
  },
  location: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  songs: [{
    song: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Song'
    },
    order: {
      type: Number,
      required: true
    },
    key: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    instrument: {
      type: String,
      enum: ['vocal', 'guitarra', 'baixo', 'bateria', 'teclado', 'violao', 'saxofone', 'flauta', 'violino', 'outros']
    },
    role: {
      type: String,
      enum: ['lider', 'vocal', 'musico', 'tecnico'],
      default: 'musico'
    },
    isLeader: {
      type: Boolean,
      default: false
    },
    confirmed: {
      type: String,
      enum: ['pending', 'confirmed', 'declined'],
      default: 'pending'
    },
    confirmedAt: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  attendance: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    present: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    markedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'completed', 'cancelled'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
scheduleSchema.index({ ministry: 1, date: 1 });
scheduleSchema.index({ 'members.user': 1 });
scheduleSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);