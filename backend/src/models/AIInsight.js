const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'daily-insight',
      'trend-analysis',
      'recommendation',
      'alert',
      'report-analysis',
      'symptom-analysis'
    ]
  },
  category: {
    type: String,
    enum: [
      'fitness',
      'nutrition',
      'sleep',
      'mental',
      'hydration',
      'medication',
      'general'
    ]
  },
  title: String,
  content: String,
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  data: mongoose.Schema.Types.Mixed,
  actionItems: [{
    description: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  expiresAt: Date,
  viewedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('AIInsight', aiInsightSchema);