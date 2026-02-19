const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const groqService = require('../services/GroqAIService');
const User = require('../models/User');
const HealthData = require('../models/HealthData');

router.use(protect);

// Helper to get user with recent health data
const getUserWithHealthData = async (userId, type = null) => {
  const user = await User.findById(userId);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const query = { user: userId, timestamp: { $gte: thirtyDaysAgo } };
  if (type) query.type = type;
  
  const healthData = await HealthData.find(query).sort({ timestamp: -1 });
  return { user, healthData };
};

// Health insights
router.get('/insights', async (req, res) => {
  try {
    const { user, healthData } = await getUserWithHealthData(req.user._id);
    const insights = await groqService.generateHealthInsights(user, healthData);
    res.json({ success: true, insights });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ message: 'Error generating insights' });
  }
});

// Analyze medical report
router.post('/analyze-report', async (req, res) => {
  try {
    const { reportText, reportType = 'general' } = req.body;
    if (!reportText) return res.status(400).json({ message: 'Report text required' });
    
    const analysis = await groqService.analyzeMedicalReport(reportText, reportType);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ message: 'Error analyzing report' });
  }
});

// Analyze symptoms
router.post('/analyze-symptoms', async (req, res) => {
  try {
    console.log('Symptom analysis:', req.body);
    const { symptoms } = req.body;
    if (!symptoms) return res.status(400).json({ success: false, message: 'Symptoms required' });

    const user = await User.findById(req.user._id);
    console.log('Analyzing for:', user.email);
    
    const analysis = await groqService.analyzeSymptoms(symptoms, user.profile);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Symptom error:', error);
    res.json({ 
      success: true, 
      analysis: {
        possibleCauses: ["Unable to analyze symptoms"],
        severity: "unknown",
        recommendations: ["Please try again", "Consult a doctor if severe"],
        redFlags: ["Seek immediate care for severe symptoms"],
        whenToSeeDoctor: "Consult if symptoms persist",
        disclaimer: "⚠️ Not medical advice. Consult a healthcare provider."
      }
    });
  }
});

// Generate diet plan
router.post('/diet-plan', async (req, res) => {
  try {
    console.log('Diet plan request:', req.body);
    const { goals, preferences = '' } = req.body;
    if (!goals) return res.status(400).json({ success: false, message: 'Goals required' });

    const user = await User.findById(req.user._id);
    const dietPlan = await groqService.generateDietPlan(user, goals, preferences);
    res.json({ success: true, dietPlan });
  } catch (error) {
    console.error('Diet plan error:', error);
    res.json({ 
      success: false,
      dietPlan: {
        dailyCalories: "2000-2200 kcal",
        macros: { protein: "150g", carbs: "250g", fat: "70g" },
        mealPlan: {
          breakfast: ["Oatmeal with berries", "Greek yogurt"],
          lunch: ["Grilled chicken salad", "Quinoa bowl"],
          dinner: ["Baked salmon", "Lean turkey with sweet potato"],
          snacks: ["Apple with almond butter", "Protein shake"]
        },
        foodsToEat: ["Lean proteins", "Whole grains", "Fruits", "Vegetables"],
        foodsToAvoid: ["Processed foods", "Sugary drinks"],
        groceryList: ["Chicken", "Salmon", "Quinoa", "Oats", "Berries", "Spinach"],
        tips: ["Drink 8 glasses of water", "Eat protein with every meal"]
      }
    });
  }
});

// Sleep advice
router.get('/sleep-advice', async (req, res) => {
  try {
    const { user, healthData } = await getUserWithHealthData(req.user._id, 'sleep');
    const advice = await groqService.generateSleepAdvice(healthData, user.profile);
    res.json({ success: true, advice });
  } catch (error) {
    console.error('Sleep advice error:', error);
    res.status(500).json({ message: 'Error generating sleep advice' });
  }
});

// Analyze skin (text-based)
router.post('/analyze-skin', async (req, res) => {
  try {
    const { description, concerns = '' } = req.body;
    if (!description) return res.status(400).json({ message: 'Description required' });

    const analysis = await groqService.analyzeSkinDescription(description, concerns);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Skin analysis error:', error);
    res.status(500).json({ message: 'Error analyzing skin' });
  }
});

// Chat with AI
router.post('/chat', async (req, res) => {
  try {
    console.log('Chat request:', req.body);
    const { message, conversationHistory = [] } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    const user = await User.findById(req.user._id);
    const userProfile = {
      age: user.profile?.age,
      gender: user.profile?.gender,
      firstName: user.firstName
    };

    const response = await groqService.chat(message, conversationHistory, userProfile);
    res.json({ success: true, ...response });
  } catch (error) {
    console.error('Chat error:', error);
    res.json({ 
      success: false,
      response: "I'm sorry, I encountered an error. Please try again."
    });
  }
});


module.exports = router;