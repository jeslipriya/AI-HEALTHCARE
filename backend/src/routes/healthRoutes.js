const express = require('express');
const router = express.Router();
const { protect, familyAccess } = require('../middleware/auth');
const { logHealthData, getHealthData, getDashboardData } = require('../controllers/healthDataController');
const User = require('../models/User');
const HealthData = require('../models/HealthData');

router.use(protect);

// Dashboard
router.get('/dashboard', getDashboardData);

// Log health data
router.post('/log', protect, async (req, res) => {
  try {
    const { type, data } = req.body;
    if (!type || !data) return res.status(400).json({ success: false, message: 'Type and data required' });

    console.log('Logging:', { type, data, userId: req.user._id });
    
    const healthData = await HealthData.create({
      user: req.user._id, type, data,
      timestamp: Date.now(), source: 'manual'
    });
    
    res.status(201).json({ success: true, data: healthData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get health data (own)
router.get('/data', async (req, res) => {
  try {
    const { type, from, to, limit = 50 } = req.query;
    const query = { user: req.user._id };
    
    if (type) query.type = type;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const data = await HealthData.find(query).sort({ timestamp: -1 }).limit(parseInt(limit));
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get health data (family member)
router.get('/data/:userId', familyAccess, async (req, res) => {
  try {
    const { type, from, to, limit = 50 } = req.query;
    const query = { user: req.params.userId };
    
    if (type) query.type = type;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const data = await HealthData.find(query).sort({ timestamp: -1 }).limit(parseInt(limit));
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health score
router.get('/score', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const score = user.calculateHealthScore?.() || { total: 0, components: {}, basedOn: 'No data' };
    res.json({ success: true, score });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Trends
router.get('/trends', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await HealthData.find({
      user: req.user._id,
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: 1 });

    res.json({ success: true, data: calculateTrends(data) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper: Calculate trends
const calculateTrends = (data) => {
  const weeks = {};
  data.forEach(item => {
    const d = new Date(item.timestamp);
    const week = `${d.getFullYear()}-W${Math.ceil(d.getDate()/7)}`;
    (weeks[week] = weeks[week] || []).push(item);
  });

  return Object.entries(weeks).map(([week, items]) => ({
    week,
    value: Math.round(items.reduce((sum, d) => {
      if (d.type === 'activity') sum += (d.data.steps || 0) / 100;
      if (d.type === 'sleep') sum += (d.data.hours || 0) * 12.5;
      if (d.type === 'hydration') sum += (d.data.glasses || 0) * 12.5;
      return sum;
    }, 0) / items.length)
  })).slice(-8);
};

module.exports = router;