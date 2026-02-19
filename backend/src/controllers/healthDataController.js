const HealthData = require('../models/HealthData');
const User = require('../models/User');

// @desc    Log daily health data
const logHealthData = async (req, res) => {
  try {
    const { type, data, timestamp } = req.body;
    const userId = req.user._id;

    const healthData = await HealthData.create({
      user: userId, type, data,
      timestamp: timestamp || Date.now(),
      source: 'manual'
    });

    await User.findByIdAndUpdate(userId, {
      $push: { 'healthMetrics.daily': { date: timestamp || Date.now(), ...data } }
    });

    const alerts = await checkForAlerts(userId, type, data);
    res.status(201).json({ success: true, data: healthData, alerts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's health data with filters
const getHealthData = async (req, res) => {
  try {
    const { type, from, to, limit = 50 } = req.query;
    const userId = req.params.userId || req.user._id;

    if (userId !== req.user._id.toString() && 
        !req.user.familyAccess?.some(a => a.memberId.toString() === userId && a.permissions.viewHealthData) && 
        req.user.role !== 'family-admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const query = { user: userId };
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
};

//     Get dashboard data with real user metrics
const getDashboardData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('familyMembers', 'firstName lastName profile');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const healthData = await HealthData.find({
      user: req.user._id,
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: -1 });

    res.json({
      success: true,
      user: {
        name: `${user.firstName} ${user.lastName}`,
        age: user.profile?.age,
        gender: user.profile?.gender,
        conditions: user.healthInfo?.conditions || []
      },
      metrics: calculateMetrics(healthData),
      healthScore: user.calculateHealthScore(),
      trends: calculateTrends(healthData),
      insights: generateInsights(user, healthData),
      enabledModules: user.enabledModules || user.generateEnabledModules()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper: Calculate metrics from data
const calculateMetrics = (data) => {
  const metrics = { fitness: 0, nutrition: 0, mental: 0, sleep: 0, hydration: 0, medication: 100 };
  if (!data.length) return metrics;

  const grouped = data.reduce((acc, item) => {
    (acc[item.type] = acc[item.type] || []).push(item);
    return acc;
  }, {});

  if (grouped.activity) {
    const avg = grouped.activity.reduce((s, a) => s + (a.data.steps || 0), 0) / grouped.activity.length;
    metrics.fitness = Math.min(100, (avg / 10000) * 100);
  }
  if (grouped.sleep) {
    const avg = grouped.sleep.reduce((s, sl) => s + (sl.data.hours || 0), 0) / grouped.sleep.length;
    metrics.sleep = Math.min(100, (avg / 8) * 100);
  }
  if (grouped.hydration) {
    const avg = grouped.hydration.reduce((s, h) => s + (h.data.glasses || 0), 0) / grouped.hydration.length;
    metrics.hydration = Math.min(100, (avg / 8) * 100);
  }
  if (grouped.mental) {
    const avg = grouped.mental.reduce((s, m) => s + (m.data.mood || 5), 0) / grouped.mental.length;
    metrics.mental = (avg / 10) * 100;
  }
  return metrics;
};

// Helper: Generate insights from data
const generateInsights = (user, data) => {
  const insights = [];
  
  if (data.length) {
    const sleep = data.filter(d => d.type === 'sleep');
    if (sleep.length > 3) {
      const avg = sleep.reduce((s, sl) => s + (sl.data.hours || 0), 0) / sleep.length;
      insights.push({
        type: avg < 7 ? 'warning' : avg > 9 ? 'info' : null,
        title: avg < 7 ? 'Sleep Deprivation' : avg > 9 ? 'Excessive Sleep' : null,
        description: avg < 7 ? `Only ${avg.toFixed(1)}h sleep. Aim for 7-9h.` : 
                     avg > 9 ? `${avg.toFixed(1)}h sleep. Check for fatigue.` : null,
        action: avg < 7 ? 'Sleep 30min earlier' : avg > 9 ? 'Track energy levels' : null
      }).filter(i => i.type);
    }

    const hydration = data.filter(d => d.type === 'hydration');
    if (hydration.length > 3) {
      const avg = hydration.reduce((s, h) => s + (h.data.glasses || 0), 0) / hydration.length;
      if (avg < 6) insights.push({
        type: 'warning',
        title: 'Low Water Intake',
        description: `${avg.toFixed(1)} glasses/day. Aim for 8.`,
        action: 'Set hourly reminders'
      });
    }

    const activity = data.filter(d => d.type === 'activity');
    if (activity.length > 3) {
      const avg = activity.reduce((s, a) => s + (a.data.steps || 0), 0) / activity.length;
      insights.push({
        type: avg < 5000 ? 'warning' : avg > 10000 ? 'success' : null,
        title: avg < 5000 ? 'Low Activity' : avg > 10000 ? 'Great Activity!' : null,
        description: avg < 5000 ? `${Math.round(avg)} steps/day. Move more.` : 
                     avg > 10000 ? 'Exceeding 10k steps! Keep it up!' : null,
        action: avg < 5000 ? 'Take short walks' : avg > 10000 ? 'Vary your routine' : null
      }).filter(i => i.type);
    }

    if (user.profile?.gender === 'female' && user.pregnancy?.isPregnant) {
      insights.push({
        type: 'info',
        title: 'Pregnancy Health',
        description: `Week ${user.pregnancy.week}. Take prenatal vitamins.`,
        action: 'Schedule prenatal checkup'
      });
    }

    if (user.healthInfo?.conditions?.length) {
      insights.push({
        type: 'info',
        title: 'Manage Conditions',
        description: `Tracking ${user.healthInfo.conditions.map(c => c.name).join(', ')}`,
        action: 'Log daily readings'
      });
    }
  }

  if (!insights.length) insights.push({
    type: 'info',
    title: 'Start Tracking',
    description: 'Log health data for personalized insights.',
    action: 'Log first metric'
  });

  return insights;
};

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

// Helper: Check for alerts
const checkForAlerts = async (userId, type, data) => {
  const alerts = [];
  
  if (type === 'blood-pressure' && (data.systolic > 140 || data.diastolic > 90)) {
    alerts.push({ type: 'danger', message: 'High BP detected. Consult doctor.', severity: 'high' });
  } else if (type === 'blood-pressure' && (data.systolic > 130 || data.diastolic > 80)) {
    alerts.push({ type: 'warning', message: 'Elevated BP. Monitor closely.', severity: 'medium' });
  }
  
  if (type === 'blood-sugar' && (data.value > 180 || data.value < 70)) {
    alerts.push({
      type: 'danger',
      message: data.value > 180 ? 'High blood sugar. Check medication.' : 'Low blood sugar. Eat carbs.',
      severity: 'high'
    });
  }
  
  return alerts;
};

module.exports = { logHealthData, getHealthData, getDashboardData };