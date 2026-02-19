import React, { useState, useEffect } from 'react';
import { 
  FireIcon, 
  HeartIcon, 
  BeakerIcon, 
  ScaleIcon,
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  TrophyIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { healthAPI, aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const MensHealth = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [personalizedPlan, setPersonalizedPlan] = useState(null);
  
  // Workout tracking
  const [workout, setWorkout] = useState({
    type: 'cardio',
    duration: '',
    intensity: 'medium',
    exercises: [],
    calories: '',
    notes: ''
  });
  
  // Vitals tracking
  const [vitals, setVitals] = useState({
    heartRate: '',
    bloodPressure: '',
    weight: '',
    bodyFat: '',
    sleep: '',
    waterIntake: ''
  });
  
  // Goals tracking
  const [goals, setGoals] = useState([
    { id: 1, name: 'Run 5km', target: '25 min', progress: 75, unit: '%', category: 'cardio' },
    { id: 2, name: 'Bench Press', target: '100kg', progress: 60, unit: '%', category: 'strength' },
    { id: 3, name: 'Weight Goal', target: '70kg', progress: 85, unit: '%', category: 'weight' }
  ]);
  
  // Workout history
  const [workoutHistory, setWorkoutHistory] = useState([]);
  
  // Nutrition tracking
  const [nutrition, setNutrition] = useState({
    calories: 2200,
    protein: 150,
    carbs: 250,
    fat: 70,
    meals: []
  });

  const tabs = [
    { id: 'overview', name: 'AI Overview', icon: ChartBarIcon },
    { id: 'fitness', name: 'Smart Fitness', icon: FireIcon },
    { id: 'vitals', name: 'Health Vitals', icon: HeartIcon },
    { id: 'nutrition', name: 'AI Nutrition', icon: BeakerIcon },
    { id: 'goals', name: 'Smart Goals', icon: TrophyIcon },
    { id: 'insights', name: 'AI Insights', icon: SparklesIcon },
  ];

  // Exercise library
  const exerciseLibrary = {
    cardio: ['Running', 'Cycling', 'Swimming', 'Rowing', 'Jump Rope'],
    strength: ['Bench Press', 'Squats', 'Deadlifts', 'Pull-ups', 'Shoulder Press'],
    hiit: ['Burpees', 'Mountain Climbers', 'Box Jumps', 'Kettlebell Swings'],
    yoga: ['Downward Dog', 'Warrior Pose', 'Sun Salutation', 'Tree Pose']
  };

  // Load workout history on mount
  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      const data = await healthAPI.getHealthData('activity', null, null, 30);
      if (data.data.data) {
        setWorkoutHistory(data.data.data);
      }
    } catch (error) {
      console.error('Failed to load workout history:', error);
    }
  };

  // Get AI-powered workout recommendation
  const getAIWorkoutRecommendation = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.chat(
        `Based on my fitness profile and history, suggest a personalized workout:
        Recent workouts: ${JSON.stringify(workoutHistory.slice(-5))}
        Current vitals: ${JSON.stringify(vitals)}
        
        Provide a detailed workout plan with:
        1. Warm-up exercises
        2. Main workout sets/reps
        3. Cool-down stretches
        4. Estimated calories burn
        5. Difficulty level`,
        []
      );

      setAiInsights({
        type: 'workout',
        content: response.data.response,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to get AI recommendation:', error);
      toast.error('Could not get AI recommendation');
    } finally {
      setLoading(false);
    }
  };

  // Handle workout logging with AI analysis
  const handleLogWorkout = async () => {
    if (!workout.duration) {
      toast.error('Please enter workout duration');
      return;
    }

    setLoading(true);
    try {
      // Log workout
      await healthAPI.logActivity(
        null, 
        parseInt(workout.duration), 
        workout.calories ? parseInt(workout.calories) : null,
        { type: workout.type, intensity: workout.intensity, exercises: workout.exercises, notes: workout.notes }
      );

      // Get AI feedback on workout
      const feedback = await aiAPI.chat(
        `Analyze this workout and provide feedback:
        Type: ${workout.type}
        Duration: ${workout.duration} minutes
        Intensity: ${workout.intensity}
        Calories: ${workout.calories || 'Not tracked'}
        
        Provide brief, encouraging feedback and suggestions for improvement.`,
        []
      );

      toast.success('Workout logged!');
      setAiInsights({
        type: 'feedback',
        content: feedback.data.response
      });
      
      // Update history
      loadWorkoutHistory();
      
      // Reset form
      setWorkout({
        type: 'cardio',
        duration: '',
        intensity: 'medium',
        exercises: [],
        calories: '',
        notes: ''
      });

    } catch (error) {
      toast.error('Failed to log workout');
    } finally {
      setLoading(false);
    }
  };

  // Handle vitals logging with AI health assessment
  const handleLogVitals = async () => {
    try {
      const vitalsData = [];
      
      if (vitals.heartRate) {
        await healthAPI.logHealthData('heart-rate', { value: parseInt(vitals.heartRate) });
        vitalsData.push(`Heart Rate: ${vitals.heartRate} bpm`);
      }
      if (vitals.bloodPressure) {
        const [systolic, diastolic] = vitals.bloodPressure.split('/');
        await healthAPI.logBloodPressure(parseInt(systolic), parseInt(diastolic));
        vitalsData.push(`BP: ${vitals.bloodPressure}`);
      }
      if (vitals.weight) {
        await healthAPI.logWeight(parseFloat(vitals.weight));
        vitalsData.push(`Weight: ${vitals.weight} kg`);
      }
      if (vitals.bodyFat) {
        await healthAPI.logHealthData('body-fat', { value: parseFloat(vitals.bodyFat) });
        vitalsData.push(`Body Fat: ${vitals.bodyFat}%`);
      }

      // Get AI health assessment
      if (vitalsData.length > 0) {
        const assessment = await aiAPI.chat(
          `Analyze these vitals and provide a health assessment:
          ${vitalsData.join('\n')}
          Age: ${user?.profile?.age || 'unknown'}
          
          Provide:
          1. Overall assessment
          2. Areas of concern
          3. Recommendations for improvement`,
          []
        );

        setAiInsights({
          type: 'health',
          content: assessment.data.response
        });
      }

      toast.success('Vitals logged!');
      setVitals({ heartRate: '', bloodPressure: '', weight: '', bodyFat: '', sleep: '', waterIntake: '' });

    } catch (error) {
      toast.error('Failed to log vitals');
    }
  };

  // Get AI nutrition plan
  const getAINutritionPlan = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.getDietPlan(
        `Based on my fitness goals: ${goals.map(g => g.name).join(', ')}`,
        `Weight: ${vitals.weight || 'unknown'}kg, Activity level: ${workoutHistory.length}/week`
      );

      setPersonalizedPlan(response.data.dietPlan);
      toast.success('AI nutrition plan generated!');

    } catch (error) {
      toast.error('Failed to generate nutrition plan');
    } finally {
      setLoading(false);
    }
  };

  // Update goal progress
  const updateGoalProgress = (goalId, newProgress) => {
    setGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, progress: newProgress } : goal
    ));

    // Check if goal achieved
    const goal = goals.find(g => g.id === goalId);
    if (newProgress >= 100 && goal.progress < 100) {
      toast.success(`🎉 Goal achieved: ${goal.name}!`);
      
      // Get AI celebration message
      aiAPI.chat(`Congratulate me on achieving my fitness goal: ${goal.name}`, [])
        .then(res => setAiInsights({ type: 'achievement', content: res.data.response }));
    }
  };

  // Calculate fitness score
  const calculateFitnessScore = () => {
    const workoutScore = workoutHistory.length * 10;
    const heartRateScore = vitals.heartRate ? 
      (vitals.heartRate >= 60 && vitals.heartRate <= 100 ? 100 : 70) : 80;
    const weightScore = vitals.weight ? 
      (Math.random() * 20 + 80) : 85; // Simplified for demo
    
    return Math.min(100, Math.round((workoutScore + heartRateScore + weightScore) / 3));
  };

  const fitnessScore = calculateFitnessScore();

  return (
    <div className="space-y-6">
      {/* Header with AI Badge */}
      <div className="card bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Men's Health AI</h2>
            <p className="opacity-90 mt-1">AI-powered fitness and wellness optimization</p>
          </div>
          <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-full">
            <SparklesIcon className="w-5 h-5" />
            <span className="text-sm font-medium">AI Coach</span>
          </div>
        </div>
      </div>

      {/* Fitness Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">AI Fitness Score</p>
              <p className="text-3xl font-bold text-blue-700">{fitnessScore}</p>
            </div>
            <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">💪</span>
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-green-600">Workouts This Week</p>
          <p className="text-2xl font-bold text-green-700">{workoutHistory.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-purple-600">Active Goals</p>
          <p className="text-2xl font-bold text-purple-700">{goals.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* AI Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            {workoutHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No workouts logged yet. Start your fitness journey!</p>
            ) : (
              <div className="space-y-2">
                {workoutHistory.slice(-5).map((workout, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{workout.data.type || 'Workout'}</p>
                      <p className="text-sm text-gray-600">{workout.data.duration} minutes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-600">{new Date(workout.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Quick Tip */}
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="flex items-start space-x-3">
              <LightBulbIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">AI Coach Tip</h4>
                <p className="text-sm text-blue-700">
                  {workoutHistory.length === 0 
                    ? "Start with 3 workouts per week to build consistency. Even 20 minutes counts!"
                    : "Great work staying active! Try increasing intensity gradually for better results."}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Smart Fitness Tab */}
      {activeTab === 'fitness' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Log Your Workout with AI Feedback</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workout Type
                </label>
                <select
                  className="input-field"
                  value={workout.type}
                  onChange={(e) => setWorkout({...workout, type: e.target.value})}
                >
                  <option value="cardio">Cardio</option>
                  <option value="strength">Strength Training</option>
                  <option value="hiit">HIIT</option>
                  <option value="yoga">Yoga</option>
                  <option value="sports">Sports</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g., 45"
                  value={workout.duration}
                  onChange={(e) => setWorkout({...workout, duration: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intensity
                </label>
                <select
                  className="input-field"
                  value={workout.intensity}
                  onChange={(e) => setWorkout({...workout, intensity: e.target.value})}
                >
                  <option value="low">Low - Easy pace</option>
                  <option value="medium">Medium - Moderate effort</option>
                  <option value="high">High - Maximum effort</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calories Burned (optional)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g., 300"
                  value={workout.calories}
                  onChange={(e) => setWorkout({...workout, calories: e.target.value})}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exercises Performed
              </label>
              <select
                multiple
                className="input-field h-32"
                value={workout.exercises}
                onChange={(e) => setWorkout({
                  ...workout, 
                  exercises: Array.from(e.target.selectedOptions, option => option.value)
                })}
              >
                {exerciseLibrary[workout.type]?.map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                rows="3"
                className="input-field"
                placeholder="How was your workout? Any notes..."
                value={workout.notes}
                onChange={(e) => setWorkout({...workout, notes: e.target.value})}
              />
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleLogWorkout}
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? 'Logging...' : 'Log Workout'}
              </button>
              <button
                onClick={getAIWorkoutRecommendation}
                disabled={loading}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 flex items-center justify-center"
              >
                <SparklesIcon className="w-5 h-5 mr-2" />
                AI Recommendation
              </button>
            </div>
          </div>

          {/* AI Workout Suggestion */}
          {aiInsights?.type === 'workout' && (
            <div className="card bg-purple-50">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2" />
                AI Recommended Workout
              </h4>
              <p className="text-sm text-purple-700 whitespace-pre-line">{aiInsights.content}</p>
            </div>
          )}

          {/* Workout Feedback */}
          {aiInsights?.type === 'feedback' && (
            <div className="card bg-green-50">
              <h4 className="font-medium text-green-800 mb-2">Workout Feedback</h4>
              <p className="text-sm text-green-700">{aiInsights.content}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Health Vitals Tab */}
      {activeTab === 'vitals' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Track Your Vitals with AI Assessment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g., 72"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({...vitals, heartRate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Pressure
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., 120/80"
                  value={vitals.bloodPressure}
                  onChange={(e) => setVitals({...vitals, bloodPressure: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  placeholder="e.g., 75.5"
                  value={vitals.weight}
                  onChange={(e) => setVitals({...vitals, weight: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body Fat %
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field"
                  placeholder="e.g., 15.5"
                  value={vitals.bodyFat}
                  onChange={(e) => setVitals({...vitals, bodyFat: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sleep (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="input-field"
                  placeholder="e.g., 7.5"
                  value={vitals.sleep}
                  onChange={(e) => setVitals({...vitals, sleep: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Water Intake (glasses)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g., 8"
                  value={vitals.waterIntake}
                  onChange={(e) => setVitals({...vitals, waterIntake: e.target.value})}
                />
              </div>
            </div>

            <button
              onClick={handleLogVitals}
              className="mt-6 btn-primary w-full"
            >
              Log Vitals & Get AI Assessment
            </button>
          </div>

          {/* AI Health Assessment */}
          {aiInsights?.type === 'health' && (
            <div className="card bg-blue-50">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <HeartIcon className="w-5 h-5 mr-2" />
                AI Health Assessment
              </h4>
              <p className="text-sm text-blue-700 whitespace-pre-line">{aiInsights.content}</p>
            </div>
          )}

          {/* Health Ranges */}
          <div className="card">
            <h4 className="font-medium mb-4">Healthy Ranges</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">Heart Rate</p>
                <p className="text-sm font-medium">60-100 bpm</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">Blood Pressure</p>
                <p className="text-sm font-medium">&lt;120/80</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">Body Fat</p>
                <p className="text-sm font-medium">10-20%</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">Sleep</p>
                <p className="text-sm font-medium">7-9 hours</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Nutrition Tab */}
      {activeTab === 'nutrition' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">AI-Powered Nutrition</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{nutrition.calories}</p>
                <p className="text-sm text-gray-600">Daily Calories</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{nutrition.protein}g</p>
                <p className="text-sm text-gray-600">Protein</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Protein Goal
                </label>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>

              <button
                onClick={getAINutritionPlan}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Generating...' : 'Generate AI Nutrition Plan'}
              </button>
            </div>
          </div>

          {/* AI Meal Plan */}
          {personalizedPlan && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Your AI Meal Plan</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="font-medium text-yellow-800">Breakfast</p>
                  <ul className="list-disc list-inside text-sm text-yellow-700">
                    {personalizedPlan.mealPlan?.breakfast?.map((meal, i) => (
                      <li key={i}>{meal}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-800">Lunch</p>
                  <ul className="list-disc list-inside text-sm text-green-700">
                    {personalizedPlan.mealPlan?.lunch?.map((meal, i) => (
                      <li key={i}>{meal}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800">Dinner</p>
                  <ul className="list-disc list-inside text-sm text-blue-700">
                    {personalizedPlan.mealPlan?.dinner?.map((meal, i) => (
                      <li key={i}>{meal}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Quick Meal Ideas */}
          <div className="card">
            <h4 className="font-medium mb-3">Quick Meal Ideas</h4>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">High Protein Breakfast</p>
                <p className="text-sm text-gray-600">Scrambled eggs with spinach and whole grain toast</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Post-Workout Meal</p>
                <p className="text-sm text-gray-600">Grilled chicken breast with quinoa and broccoli</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Healthy Snack</p>
                <p className="text-sm text-gray-600">Greek yogurt with berries and nuts</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Smart Goals Tab */}
      {activeTab === 'goals' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Smart Goals with AI Tracking</h3>
          
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{goal.name}</p>
                    <p className="text-sm text-gray-600">Target: {goal.target}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">{goal.progress}%</p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 h-2 rounded-full mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={goal.progress}
                  onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            ))}

            <button className="mt-4 btn-primary w-full">
              + Add New Goal with AI
            </button>
          </div>
        </div>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'insights' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">AI Health Insights</h3>
          
          {aiInsights ? (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-purple-800 whitespace-pre-line">
                  {typeof aiInsights === 'string' ? aiInsights : aiInsights.content}
                </p>
              </div>
              
              <button
                onClick={async () => {
                  const response = await aiAPI.chat(
                    `Based on my fitness data: ${JSON.stringify(workoutHistory.slice(-5))},
                     give me personalized health recommendations for the next week.`,
                    []
                  );
                  setAiInsights(response.data.response);
                }}
                className="btn-secondary w-full"
              >
                Get New Insights
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Log workouts and vitals to get AI-powered insights</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MensHealth;