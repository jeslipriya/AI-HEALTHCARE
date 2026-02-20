import React, { useState, useEffect } from 'react';
import { FireIcon, HeartIcon, BeakerIcon, ScaleIcon, SparklesIcon, ChartBarIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon, LightBulbIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { healthAPI, aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const MensHealth = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [personalizedPlan, setPersonalizedPlan] = useState(null);
  const [workout, setWorkout] = useState({ type: 'cardio', duration: '', intensity: 'medium', exercises: [], calories: '', notes: '' });
  const [vitals, setVitals] = useState({ heartRate: '', bloodPressure: '', weight: '', bodyFat: '', sleep: '', waterIntake: '' });
  const [goals, setGoals] = useState([
    { id: 1, name: 'Run 5km', target: '25 min', progress: 75, category: 'cardio' },
    { id: 2, name: 'Bench Press', target: '100kg', progress: 60, category: 'strength' },
    { id: 3, name: 'Weight Goal', target: '70kg', progress: 85, category: 'weight' }
  ]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [nutrition] = useState({ calories: 2200, protein: 150, carbs: 250, fat: 70 });

  const tabs = [
    { id: 'overview', name: 'AI Overview', icon: ChartBarIcon },
    { id: 'fitness', name: 'Smart Fitness', icon: FireIcon },
    { id: 'vitals', name: 'Health Vitals', icon: HeartIcon },
    { id: 'nutrition', name: 'AI Nutrition', icon: BeakerIcon },
    { id: 'goals', name: 'Smart Goals', icon: TrophyIcon },
    { id: 'insights', name: 'AI Insights', icon: SparklesIcon },
  ];

  const exerciseLibrary = {
    cardio: ['Running', 'Cycling', 'Swimming', 'Rowing', 'Jump Rope'],
    strength: ['Bench Press', 'Squats', 'Deadlifts', 'Pull-ups', 'Shoulder Press'],
    hiit: ['Burpees', 'Mountain Climbers', 'Box Jumps', 'Kettlebell Swings'],
    yoga: ['Downward Dog', 'Warrior Pose', 'Sun Salutation', 'Tree Pose']
  };

  useEffect(() => { loadWorkoutHistory(); }, []);

  const loadWorkoutHistory = async () => {
    try {
      const { data } = await healthAPI.getHealthData('activity', null, null, 30);
      if (data?.data) setWorkoutHistory(data.data);
    } catch (error) { console.error('Failed to load history'); }
  };

  const handleLogWorkout = async () => {
    if (!workout.duration) return toast.error('Enter duration');
    setLoading(true);
    try {
      await healthAPI.logActivity(null, parseInt(workout.duration), workout.calories ? parseInt(workout.calories) : null,
        { type: workout.type, intensity: workout.intensity, exercises: workout.exercises, notes: workout.notes });
      
      const { data } = await aiAPI.chat(`Analyze this ${workout.type} workout for ${workout.duration}min at ${workout.intensity} intensity`, []);
      toast.success('Workout logged!');
      setAiInsights({ type: 'feedback', content: data.response });
      loadWorkoutHistory();
      setWorkout({ type: 'cardio', duration: '', intensity: 'medium', exercises: [], calories: '', notes: '' });
    } catch { toast.error('Failed to log'); } finally { setLoading(false); }
  };

  const handleLogVitals = async () => {
    try {
      const logs = [];
      if (vitals.heartRate) { await healthAPI.logHealthData('heart-rate', { value: parseInt(vitals.heartRate) }); logs.push(`HR: ${vitals.heartRate}`); }
      if (vitals.bloodPressure) { 
        const [s,d] = vitals.bloodPressure.split('/'); 
        await healthAPI.logBloodPressure(parseInt(s), parseInt(d)); 
        logs.push(`BP: ${vitals.bloodPressure}`); 
      }
      if (vitals.weight) { await healthAPI.logWeight(parseFloat(vitals.weight)); logs.push(`Weight: ${vitals.weight}`); }
      
      if (logs.length) {
        const { data } = await aiAPI.chat(`Analyze these vitals: ${logs.join(', ')}. Age: ${user?.profile?.age}`, []);
        setAiInsights({ type: 'health', content: data.response });
      }
      toast.success('Vitals logged!');
      setVitals({ heartRate: '', bloodPressure: '', weight: '', bodyFat: '', sleep: '', waterIntake: '' });
    } catch { toast.error('Failed to log'); }
  };

  const getAINutritionPlan = async () => {
    setLoading(true);
    try {
      const { data } = await aiAPI.getDietPlan(`Goals: ${goals.map(g => g.name).join(', ')}`, `Weight: ${vitals.weight || 'unknown'}kg`);
      setPersonalizedPlan(data.dietPlan);
      toast.success('AI nutrition plan generated!');
    } catch { toast.error('Failed to generate'); } finally { setLoading(false); }
  };

  const updateGoalProgress = (goalId, newProgress) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, progress: newProgress } : g));
    const goal = goals.find(g => g.id === goalId);
    if (newProgress >= 100 && goal?.progress < 100) {
      toast.success(`🎉 Goal: ${goal.name}!`);
      aiAPI.chat(`Congratulate me on achieving: ${goal.name}`, []).then(r => setAiInsights(r.data.response));
    }
  };

  const calculateFitnessScore = () => Math.min(100, Math.round((workoutHistory.length * 10 + (vitals.heartRate ? 80 : 0) + 85) / 3));

  const fitnessScore = calculateFitnessScore();

  const renderWorkoutItem = (w, i) => (
    <div key={i} className="flex justify-between p-3 bg-gray-50 rounded-lg">
      <div><p className="font-medium">{w.data.type || 'Workout'}</p><p className="text-sm text-gray-600">{w.data.duration} min</p></div>
      <p className="text-sm text-blue-600">{new Date(w.timestamp).toLocaleDateString()}</p>
    </div>
  );

  const renderGoalItem = (goal) => (
    <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between mb-2">
        <div><p className="font-medium">{goal.name}</p><p className="text-sm text-gray-600">Target: {goal.target}</p></div>
        <p className="text-sm font-medium text-blue-600">{goal.progress}%</p>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded-full mb-2">
        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
      </div>
      <input type="range" min="0" max="100" value={goal.progress} onChange={e => updateGoalProgress(goal.id, parseInt(e.target.value))} className="w-full mt-2" />
    </div>
  );

  const renderMealSection = (title, color, items) => (
    <div className={`p-4 bg-${color}-50 rounded-lg`}>
      <p className={`font-medium text-${color}-800`}>{title}</p>
      <ul className="list-disc list-inside text-sm">{items?.map((m,i) => <li key={i} className={`text-${color}-700`}>{m}</li>)}</ul>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="flex justify-between items-center">
          <div><h2 className="text-2xl font-bold">Men's Health AI</h2><p className="opacity-90 mt-1">AI-powered fitness optimization</p></div>
          <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full"><SparklesIcon className="w-5 h-5" /><span>AI Coach</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'AI Fitness Score', value: fitnessScore, color: 'blue', icon: '💪', span: 2 },
          { label: 'Workouts/Week', value: workoutHistory.length, color: 'green', span: 1 },
          { label: 'Active Goals', value: goals.length, color: 'purple', span: 1 }
        ].map(({ label, value, color, icon, span }) => (
          <div key={label} className={`card bg-gradient-to-br from-${color}-50 to-${color}-100 col-span-${span}`}>
            <div className="flex justify-between items-center">
              <div><p className={`text-sm text-${color}-600`}>{label}</p><p className={`text-3xl font-bold text-${color}-700`}>{value}</p></div>
              {icon && <div className={`w-16 h-16 bg-${color}-200 rounded-full flex items-center justify-center text-2xl`}>{icon}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-2 border-b overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
            <tab.icon className="w-5 h-5" /><span>{tab.name}</span>
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {activeTab === 'overview' && (
          <>
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              {!workoutHistory.length ? <p className="text-gray-500 text-center py-4">No workouts yet</p> : 
                <div className="space-y-2">{workoutHistory.slice(-5).map(renderWorkoutItem)}</div>}
            </div>
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="flex items-start space-x-3">
                <LightBulbIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">AI Coach Tip</h4>
                  <p className="text-sm text-blue-700">{workoutHistory.length === 0 ? "Start with 3 workouts/week. Even 20 minutes counts!" : "Great consistency! Try increasing intensity gradually."}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'fitness' && (
          <>
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Log Workout with AI Feedback</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select className="input-field" value={workout.type} onChange={e => setWorkout({...workout, type: e.target.value})}>
                  {['cardio','strength','hiit','yoga','sports'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
                <input type="number" className="input-field" placeholder="Duration (min)" value={workout.duration} onChange={e => setWorkout({...workout, duration: e.target.value})} />
                <select className="input-field" value={workout.intensity} onChange={e => setWorkout({...workout, intensity: e.target.value})}>
                  {['low','medium','high'].map(i => <option key={i} value={i}>{i.charAt(0).toUpperCase()+i.slice(1)}</option>)}
                </select>
                <input type="number" className="input-field" placeholder="Calories (optional)" value={workout.calories} onChange={e => setWorkout({...workout, calories: e.target.value})} />
              </div>
              <select multiple className="input-field h-32 mt-4" value={workout.exercises} onChange={e => setWorkout({...workout, exercises: Array.from(e.target.selectedOptions, o => o.value)})}>
                {exerciseLibrary[workout.type]?.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
              <textarea rows="2" className="input-field mt-4" placeholder="Notes..." value={workout.notes} onChange={e => setWorkout({...workout, notes: e.target.value})} />
              <div className="flex space-x-4 mt-4">
                <button onClick={handleLogWorkout} disabled={loading} className="flex-1 btn-primary">{loading ? 'Logging...' : 'Log Workout'}</button>
                <button onClick={() => aiAPI.chat(`Suggest workout based on history: ${JSON.stringify(workoutHistory.slice(-3))}`, []).then(r => setAiInsights({type:'workout',content:r.data.response}))} 
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 mr-2" />AI Suggest
                </button>
              </div>
            </div>
            {aiInsights?.type === 'workout' && <div className="card bg-purple-50"><p className="text-sm text-purple-700 whitespace-pre-line">{aiInsights.content}</p></div>}
            {aiInsights?.type === 'feedback' && <div className="card bg-green-50"><p className="text-sm text-green-700">{aiInsights.content}</p></div>}
          </>
        )}

        {activeTab === 'vitals' && (
          <>
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Track Vitals with AI Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['heartRate','bloodPressure','weight','bodyFat','sleep','waterIntake'].map(field => (
                  <div key={field}>
                    <label className="block text-sm font-medium mb-1">{field.replace(/([A-Z])/g,' $1').trim()}</label>
                    <input type={field.includes('Rate')?'number':'text'} className="input-field" placeholder={`e.g., ${field==='bloodPressure'?'120/80':field==='weight'?'75.5':'70'}`} 
                      value={vitals[field]} onChange={e => setVitals({...vitals, [field]: e.target.value})} />
                  </div>
                ))}
              </div>
              <button onClick={handleLogVitals} className="mt-4 btn-primary w-full">Log Vitals & Get AI Assessment</button>
            </div>
            {aiInsights?.type === 'health' && <div className="card bg-blue-50"><p className="text-sm text-blue-700 whitespace-pre-line">{aiInsights.content}</p></div>}
            <div className="card">
              <h4 className="font-medium mb-4">Healthy Ranges</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Heart Rate', value: '60-100 bpm' },
                  { label: 'Blood Pressure', value: '<120/80' },
                  { label: 'Body Fat', value: '10-20%' },
                  { label: 'Sleep', value: '7-9 hours' }
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-600">{label}</p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'nutrition' && (
          <>
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">AI-Powered Nutrition</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {['calories','protein'].map((k,i) => (
                  <div key={k} className={`text-center p-4 bg-${i===0?'green':'blue'}-50 rounded-lg`}>
                    <p className={`text-2xl font-bold text-${i===0?'green':'blue'}-600`}>{nutrition[k]}{k==='protein'?'g':''}</p>
                    <p className="text-sm text-gray-600">{k.charAt(0).toUpperCase()+k.slice(1)}</p>
                  </div>
                ))}
              </div>
              <button onClick={getAINutritionPlan} disabled={loading} className="btn-primary w-full">
                {loading ? 'Generating...' : 'Generate AI Nutrition Plan'}
              </button>
            </div>
            {personalizedPlan && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Your AI Meal Plan</h3>
                <div className="space-y-4">
                  {renderMealSection('Breakfast', 'yellow', personalizedPlan.mealPlan?.breakfast)}
                  {renderMealSection('Lunch', 'green', personalizedPlan.mealPlan?.lunch)}
                  {renderMealSection('Dinner', 'blue', personalizedPlan.mealPlan?.dinner)}
                </div>
              </div>
            )}
            <div className="card">
              <h4 className="font-medium mb-3">Quick Meal Ideas</h4>
              {[
                { title: 'High Protein Breakfast', desc: 'Scrambled eggs with spinach and whole grain toast' },
                { title: 'Post-Workout Meal', desc: 'Grilled chicken breast with quinoa and broccoli' },
                { title: 'Healthy Snack', desc: 'Greek yogurt with berries and nuts' }
              ].map(({ title, desc }) => (
                <div key={title} className="p-3 bg-gray-50 rounded-lg mb-2">
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'goals' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Smart Goals with AI Tracking</h3>
            <div className="space-y-4">{goals.map(renderGoalItem)}</div>
            <button className="mt-4 btn-primary w-full">+ Add New Goal with AI</button>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">AI Health Insights</h3>
            {aiInsights ? (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-purple-800 whitespace-pre-line">{typeof aiInsights === 'string' ? aiInsights : aiInsights.content}</p>
                </div>
                <button onClick={() => aiAPI.chat(`Give recommendations based on: ${JSON.stringify(workoutHistory.slice(-3))}`, []).then(r => setAiInsights(r.data.response))} 
                  className="btn-secondary w-full">Get New Insights</button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Log workouts to get AI-powered insights</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MensHealth;