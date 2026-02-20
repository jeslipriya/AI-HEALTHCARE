import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HeartIcon, MoonIcon, FireIcon, TrophyIcon, SparklesIcon,
  PlusCircleIcon, BeakerIcon, ClockIcon, CalendarIcon,
  CheckCircleIcon, AcademicCapIcon, ChartBarIcon
} from '@heroicons/react/24/outline';
import { healthAPI, aiAPI } from '../services/api';
import HealthScoreCard from '../components/Dashboard/HealthScoreCard';
import RadarChart from '../components/Charts/RadarChart';
import TrendChart from '../components/Charts/TrendChart';
import InsightCard from '../components/Dashboard/InsightCard';
import QuickLogModal from '../components/Dashboard/QuickLogModal';
import AIInsightBanner from '../components/Dashboard/AIInsightBanner';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [state, setState] = useState({
    dashboard: null, insights: [], recentLogs: [], trends: [], reminders: [],
    aiSummary: '', recommendations: [], achievements: [], loading: true, showLogModal: false
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const [dash, insights, logs, trends, reminders] = await Promise.all([
        healthAPI.getDashboardData(),
        aiAPI.getInsights(),
        healthAPI.getHealthData(null, null, null, 10),
        healthAPI.getTrends('month'),
        healthAPI.getUpcomingReminders?.() || Promise.resolve({ data: { data: [] } })
      ]);

      setState(prev => ({
        ...prev,
        dashboard: dash.data,
        insights: insights.data.insights || [],
        recentLogs: logs.data.data || [],
        trends: trends.data.data || [],
        reminders: reminders.data.data || [],
        loading: false
      }));

      await Promise.all([
        generateAISummary(dash.data, logs.data.data),
        generateRecommendations(dash.data),
        calculateAchievements(dash.data, logs.data.data)
      ]);
    } catch (error) {
      toast.error('Failed to load dashboard');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const generateAISummary = async (dashboard, recentActivity) => {
    try {
      const { healthScore = 0, metrics = {} } = dashboard || {};
      const { data } = await aiAPI.chat(
        `Summarize health: Score ${healthScore}, Fitness ${metrics.fitness || 0}%, Sleep ${metrics.sleep || 0}%, ${recentActivity?.length || 0} logs. Be encouraging.`, []);
      setState(prev => ({ ...prev, aiSummary: data.response }));
    } catch {
      setState(prev => ({ ...prev, aiSummary: 'Keep tracking for personalized insights!' }));
    }
  };

  const generateRecommendations = async (dashboard) => {
    try {
      const metrics = dashboard?.metrics || {};
      const weak = Object.entries(metrics).filter(([_, v]) => v < 70).map(([k]) => k);
      
      if (!weak.length) {
        setState(prev => ({ ...prev, recommendations: ['Maintain great habits!', 'Try new workouts', 'Share success'] }));
        return;
      }

      const { data } = await aiAPI.chat(`Give 3 recommendations for improving: ${weak.join(', ')}`, []);
      const recs = data.response.split('\n').filter(Boolean).slice(0, 3);
      setState(prev => ({ ...prev, recommendations: recs.length ? recs : ['Improve sleep', 'Stay hydrated', 'Exercise more'] }));
    } catch {
      setState(prev => ({ ...prev, recommendations: ['Track daily', 'Stay consistent', 'Reach out for support'] }));
    }
  };

  const calculateAchievements = (dashboard, recentActivity) => {
    const score = dashboard?.healthScore?.total || 0;
    const metrics = dashboard?.metrics || {};
    const achievements = [];
    
    if (score >= 80) achievements.push({ id: 'excellent', name: 'Excellent Health', icon: '🌟', bg: 'bg-yellow-100' });
    else if (score >= 60) achievements.push({ id: 'good', name: 'Good Progress', icon: '📈', bg: 'bg-green-100' });
    
    if (recentActivity?.length >= 7) achievements.push({ id: 'streak', name: '7-Day Streak', icon: '🔥', bg: 'bg-orange-100' });
    if (metrics.fitness > 80) achievements.push({ id: 'fitness', name: 'Fitness Pro', icon: '💪', bg: 'bg-blue-100' });
    if (metrics.sleep > 80) achievements.push({ id: 'sleep', name: 'Sleep Master', icon: '😴', bg: 'bg-purple-100' });
    
    setState(prev => ({ ...prev, achievements }));
  };

  const handleQuickLog = async (type, data) => {
    try {
      await healthAPI.logHealthData(type, data);
      toast.success(`${type} logged!`);
      await fetchData();
      setState(prev => ({ ...prev, showLogModal: false }));
    } catch { toast.error('Failed to log'); }
  };

  const getTimeTip = () => {
    const h = new Date().getHours();
    return h < 12 ? '🌅 Morning: Start with water & stretching' :
           h < 17 ? '☀️ Afternoon: Take a short walk' :
           '🌙 Evening: Deep breathing exercises';
  };

  const GenderModule = () => {
    if (!user?.profile?.gender) return null;
    const isFemale = user.profile.gender === 'female';
    return (
      <div className={`card bg-gradient-to-br from-${isFemale ? 'pink' : 'blue'}-50 to-${isFemale ? 'pink' : 'blue'}-100`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold text-${isFemale ? 'pink' : 'blue'}-800`}>
            {isFemale ? "Women's Health" : "Men's Health"}
          </h3>
          {isFemale ? <HeartIcon className="w-5 h-5 text-pink-600" /> : <FireIcon className="w-5 h-5 text-blue-600" />}
        </div>
        <p className={`text-sm text-${isFemale ? 'pink' : 'blue'}-700 mt-2`}>
          {isFemale ? (state.dashboard?.user?.pregnancy?.isPregnant ? `Pregnancy Week ${state.dashboard.user.pregnancy.week}` : 'Track your cycle') : 'Fitness tracking active'}
        </p>
        {(!isFemale || !state.dashboard?.user?.pregnancy?.isPregnant) && (
          <button onClick={() => setState(prev => ({ ...prev, showLogModal: true }))} 
            className={`text-sm text-${isFemale ? 'pink' : 'blue'}-600 hover:text-${isFemale ? 'pink' : 'blue'}-700 font-medium mt-2`}>
            Log {isFemale ? 'Period' : 'Workout'} →
          </button>
        )}
      </div>
    );
  };

  if (state.loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;

  const metrics = state.dashboard?.metrics || { fitness:0, nutrition:0, mental:0, sleep:0, hydration:0, medication:100 };
  const hasData = Object.values(metrics).some(v => v > 0);

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
          <p className="text-gray-600 mt-1 flex items-center"><CalendarIcon className="w-4 h-4 mr-1" />{new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <button onClick={() => setState(prev => ({ ...prev, showLogModal: true }))} className="btn-primary flex items-center">
          <PlusCircleIcon className="w-5 h-5 mr-2" />Quick Log
        </button>
      </div>

      {state.aiSummary && <AIInsightBanner message={state.aiSummary} icon={SparklesIcon} />}
      
      <HealthScoreCard score={state.dashboard?.healthScore?.total || 0} basedOn="Based on your recent data" />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold mb-4">Your Health Metrics</h3>
          {hasData ? <RadarChart data={metrics} /> : (
            <div className="h-80 flex flex-col items-center justify-center text-gray-500">
              <BeakerIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p>No data yet. Start logging!</p>
              <button onClick={() => setState(prev => ({ ...prev, showLogModal: true }))} className="mt-4 text-primary-600 hover:text-primary-700">Log first metric →</button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card bg-primary-50"><p className="text-sm text-primary-800">{getTimeTip()}</p></div>
          
          {state.recentLogs.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
              {state.recentLogs.slice(0,3).map((log, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="capitalize text-gray-600">{log.type}</span>
                  <span className="font-medium">
                    {log.type === 'activity' && `${log.data.steps || 0} steps`}
                    {log.type === 'sleep' && `${log.data.hours || 0} hrs`}
                    {log.type === 'hydration' && `${log.data.glasses || 0} glasses`}
                    {log.type === 'mental' && `Mood: ${log.data.mood || 0}/10`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <GenderModule />

          {state.reminders.length > 0 && (
            <div className="card bg-yellow-50">
              <h3 className="text-sm font-semibold mb-2 text-yellow-800 flex items-center"><ClockIcon className="w-4 h-4 mr-1" />Reminders</h3>
              {state.reminders.slice(0,2).map((r, i) => <div key={i} className="text-sm text-yellow-700">• {r.title} at {r.time}</div>)}
            </div>
          )}
        </div>
      </div>

      {state.trends.length > 3 && <div className="card"><h3 className="text-lg font-semibold mb-4">Monthly Progress</h3><TrendChart data={state.trends} /></div>}

      {state.recommendations.length > 0 && (
        <div className="card bg-purple-50">
          <div className="flex items-start space-x-3">
            <AcademicCapIcon className="w-6 h-6 text-purple-600 mt-1" />
            <div>
              <h3 className="font-semibold text-purple-800 mb-2">AI Recommendations</h3>
              <ul className="space-y-2">
                {state.recommendations.map((rec, i) => (
                  <li key={i} className="flex text-sm text-purple-700"><CheckCircleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {state.insights.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2"><SparklesIcon className="w-6 h-6 text-yellow-500" /><h3 className="text-lg font-semibold">Personalized Insights</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
          </div>
        </div>
      )}

      {state.achievements.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-4"><TrophyIcon className="w-6 h-6 text-yellow-500" /><h3 className="text-lg font-semibold">Achievements</h3></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {state.achievements.map(a => (
              <div key={a.id} className="text-center group">
                <div className={`w-20 h-20 mx-auto ${a.bg} rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <span className="text-3xl">{a.icon}</span>
                </div>
                <p className="text-sm font-medium">{a.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <QuickLogModal isOpen={state.showLogModal} onClose={() => setState(prev => ({ ...prev, showLogModal: false }))}
        onLog={handleQuickLog} userGender={user?.profile?.gender} />
    </motion.div>
  );
};

export default Dashboard;