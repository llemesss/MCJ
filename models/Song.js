const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    trim: true
  },
  album: {
    type: String,
    trim: true
  },
  originalKey: {
    type: String,
    trim: true
  },
  bpm: {
    type: Number,
    min: 1,
    max: 300
  },
  duration: {
    type: String,
    trim: true
  },
  genre: {
    type: String,
    enum: ['adoracao', 'louvor', 'contemporaneo', 'tradicional', 'gospel', 'rock', 'pop', 'balada', 'outros'],
    default: 'louvor'
  },
  ministry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ministry',
    required: false
  },
  lyrics: {
    type: String,
    trim: true
  },
  chords: {
    type: String,
    trim: true
  },
  links: {
    youtube: {
      type: String,
      trim: true
    },
    spotify: {
      type: String,
      trim: true
    },
    cifraClub: {
      type: String,
      trim: true
    },
    audio: {
      type: String,
      trim: true
    },
    sheet: {
      type: String,
      trim: true
    }
  },
  thumbnail: {
    type: String,
    trim: true
  },
  youtubeVideoId: {
    type: String,
    trim: true
  },
  multitrack: {
    fileName: {
      type: String,
      trim: true
    },
    filePath: {
      type: String,
      trim: true
    },
    tracks: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      filePath: {
        type: String,
        required: true,
        trim: true
      },
      instrument: {
        type: String,
        enum: ['vocal', 'guitarra', 'baixo', 'bateria', 'teclado', 'violao', 'saxofone', 'flauta', 'violino', 'outros'],
        trim: true
      },
      volume: {
        type: Number,
        min: 0,
        max: 1,
        default: 1
      },
      muted: {
        type: Boolean,
        default: false
      },
      solo: {
        type: Boolean,
        default: false
      }
    }],
    uploadedAt: {
      type: Date
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['facil', 'medio', 'dificil'],
    default: 'medio'
  },
  instruments: [{
    name: {
      type: String,
      enum: ['vocal', 'guitarra', 'baixo', 'bateria', 'teclado', 'violao', 'saxofone', 'flauta', 'violino', 'outros']
    },
    required: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  usage: {
    timesPlayed: {
      type: Number,
      default: 0
    },
    lastPlayed: {
      type: Date
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
songSchema.index({ ministry: 1, title: 1 });
songSchema.index({ title: 'text', artist: 'text', tags: 'text' });
songSchema.index({ genre: 1, difficulty: 1 });

module.exports = mongoose.model('Song', songSchema);