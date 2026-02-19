const mongoose = require('mongoose');

const healthDataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'vitals',
      'activity',
      'nutrition',
      'sleep',
      'medication',
      'symptom',
      'mental',
      'hydration',
      'blood-pressure',
      'blood-sugar',
      'weight',
      'skin',
      'period',
      'fertility',
      'pregnancy',
      'skincare' 
    ]
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  source: {
    type: String,
    enum: ['manual', 'device', 'import', 'ai-analysis'],
    default: 'manual'
  },
  notes: String,
  tags: [String],
  attachments: [{
    url: String,
    type: String,
    uploadedAt: Date
  }]
}, {
  timestamps: true
});

// Index for efficient queries
healthDataSchema.index({ user: 1, type: 1, timestamp: -1 });
healthDataSchema.index({ user: 1, 'data.condition': 1 });

module.exports = mongoose.model('HealthData', healthDataSchema);