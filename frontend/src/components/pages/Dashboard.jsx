import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HeartIcon, 
  MoonIcon, 
  FireIcon,
  TrophyIcon,
  SparklesIcon,
  PlusCircleIcon,
  BeakerIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  AcademicCapIcon,  // Replaces BrainIcon
  ChartBarIcon,     // For activity/trends
  ArrowTrendingUpIcon, // For trends
  ExclamationTriangleIcon, // For alerts
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
  const [dashboardData, setDashboardData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [healthTrends, setHealthTrends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [
        dashboardRes, 
        insightsRes, 
        logsRes, 
        trendsRes,
        remindersRes
      ] = await Promise.all([
        healthAPI.getDashboardData(),
        aiAPI.getInsights(),
        healthAPI.getHealthData(null, null, null, 10),
        healthAPI.getTrends('month'),
        healthAPI.getUpcomingReminders?.() || Promise.resolve({ data: { data: [] } })
      ]);

      setDashboardData(dashboardRes.data);
      setInsights(insightsRes.data.insights || []);
      setRecentLogs(logsRes.data.data || []);
      setHealthTrends(trendsRes.data.data || []);
      setUpcomingReminders(remindersRes.data.data || []);

      // Generate AI summary based on all data
      await generateAISummary(dashboardRes.data, insightsRes.data.insights, logsRes.data.data);
      
      // Generate personalized recommendations
      await generateRecommendations(dashboardRes.data, user);
      
      // Calculate achievements
      calculateAchievements(dashboardRes.data, logsRes.data.data);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateAISummary = async (dashboard, insightsList, recentActivity) => {
    try {
      const healthScore = dashboard?.healthScore?.total || 0;
      const metrics = dashboard?.metrics || {};
      
      const prompt = `As a health AI assistant, provide a brief, encouraging summary (2-3 sentences) of this user's current health status:
      
      Health Score: ${healthScore}/100
      Fitness: ${metrics.fitness || 0}%
      Sleep: ${metrics.sleep || 0}%
      Mental: ${metrics.mental || 0}%
      Hydration: ${metrics.hydration || 0}%
      
      Recent Activity: ${recentActivity?.length || 0} logs in last 7 days
      
      Make it personal, motivational, and highlight one key achievement or area for improvement.`;

      const response = await aiAPI.chat(prompt, []);
      setAiSummary(response.data.response);
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      setAiSummary(`You're doing great! Keep tracking your health to get personalized insights.`);
    }
  };

  const generateRecommendations = async (dashboard, userProfile) => {
    try {
      const metrics = dashboard?.metrics || {};
      const weakAreas = Object.entries(metrics)
        .filter(([_, value]) => value < 70)
        .map(([key]) => key);

      if (weakAreas.length === 0) {
        setRecommendations([
          'Maintain your excellent health habits!',
          'Try a new workout routine to challenge yourself',
          'Share your success with family members'
        ]);
        return;
      }

      const prompt = `Based on these health metrics, provide 3 specific, actionable recommendations:
      ${weakAreas.map(area => `- ${area}: ${metrics[area]}%`).join('\n')}
      
      User age: ${userProfile?.profile?.age || 'unknown'}
      User gender: ${userProfile?.profile?.gender || 'unknown'}
      
      Provide recommendations as a JSON array of strings. IMPORTANT: Return ONLY a JSON array of strings, no other text or objects.`;

      const response = await aiAPI.chat(prompt, []);
      
      let recommendationsArray = [];
      
      try {
        // Try to parse as JSON
        const jsonMatch = response.data.response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          // Ensure all items are strings
          recommendationsArray = parsed.map(item => 
            typeof item === 'string' ? item : 
            (item.recommendation || JSON.stringify(item))
          );
        } else {
          // If not JSON, split by newlines and clean up
          recommendationsArray = response.data.response
            .split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .filter(line => line.length > 0 && !line.match(/^(and|or)$/i));
        }
      } catch (e) {
        console.error('Failed to parse recommendations:', e);
        recommendationsArray = [
          'Focus on improving your sleep quality',
          'Stay hydrated throughout the day',
          'Add more physical activity to your routine'
        ];
      }
      
      // Final safety check - ensure all items are strings
      setRecommendations(recommendationsArray.filter(item => typeof item === 'string'));
      
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      setRecommendations([
        'Track your health daily for better insights',
        'Stay consistent with your health goals',
        'Reach out to family members for support'
      ]);
    }
  };

  const calculateAchievements = (dashboard, recentActivity) => {
    const newAchievements = [];
    const healthScore = dashboard?.healthScore?.total || 0;
    
    // Health score achievements
    if (healthScore >= 80) {
      newAchievements.push({
        id: 'excellent-health',
        name: 'Excellent Health',
        icon: '🌟',
        bgColor: 'bg-yellow-100',
        description: 'Maintaining great health metrics'
      });
    } else if (healthScore >= 60) {
      newAchievements.push({
        id: 'good-health',
        name: 'Good Progress',
        icon: '📈',
        bgColor: 'bg-green-100',
        description: 'Making steady progress'
      });
    }

    // Streak achievements
    if (recentActivity?.length >= 7) {
      newAchievements.push({
        id: 'weekly-streak',
        name: '7-Day Streak',
        icon: '🔥',
        bgColor: 'bg-orange-100',
        description: 'Logged health data for 7 days'
      });
    }

    // Fitness achievements
    if (dashboard?.metrics?.fitness > 80) {
      newAchievements.push({
        id: 'fitness-pro',
        name: 'Fitness Pro',
        icon: '💪',
        bgColor: 'bg-blue-100',
        description: 'Excellent fitness level'
      });
    }

    // Sleep achievements
    if (dashboard?.metrics?.sleep > 80) {
      newAchievements.push({
        id: 'sleep-master',
        name: 'Sleep Master',
        icon: '😴',
        bgColor: 'bg-purple-100',
        description: 'Consistent quality sleep'
      });
    }

    setAchievements(newAchievements);
  };

  const handleQuickLog = async (type, data) => {
    try {
      await healthAPI.logHealthData(type, data);
      toast.success(`${type} logged successfully!`);
      await fetchDashboardData(); // Refresh all data
      setShowLogModal(false);
    } catch (error) {
      toast.error('Failed to log data');
    }
  };

  // Get personalized health tip based on time of day
  const getTimeBasedTip = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "🌅 Morning tip: Start your day with a glass of water and light stretching";
    } else if (hour < 17) {
      return "☀️ Afternoon tip: Take a short walk to boost your energy";
    } else {
      return "🌙 Evening tip: Wind down with some deep breathing exercises";
    }
  };

  // Get gender-specific stats
  const getGenderSpecificStats = () => {
    if (!user) return null;

    if (user.profile?.gender === 'female') {
      return (
        <div className="card bg-gradient-to-br from-pink-50 to-pink-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-pink-800">Women's Health</h3>
            <HeartIcon className="w-5 h-5 text-pink-600" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-pink-700">
              {dashboardData?.user?.pregnancy?.isPregnant 
                ? `Pregnancy Week ${dashboardData.user.pregnancy.week}`
                : 'Track your cycle for personalized insights'}
            </p>
            {!dashboardData?.user?.pregnancy?.isPregnant && (
              <button 
                onClick={() => setShowLogModal('period')}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                Log Period →
              </button>
            )}
          </div>
        </div>
      );
    }

    if (user.profile?.gender === 'male') {
      return (
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-blue-800">Men's Health</h3>
            <FireIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-blue-700">Fitness tracking active</p>
            <button 
              onClick={() => setShowLogModal('workout')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Log Workout →
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || {
    fitness: 0,
    nutrition: 0,
    mental: 0,
    sleep: 0,
    hydration: 0,
    medication: 100
  };

  const hasData = Object.values(metrics).some(value => value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header with Quick Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-1 flex items-center">
            <CalendarIcon className="w-4 h-4 mr-1" />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowLogModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Quick Log
          </button>
        </div>
      </div>

      {/* AI Summary Banner */}
      {aiSummary && <AIInsightBanner message={aiSummary} icon={SparklesIcon} />}

      {/* Health Score */}
      <HealthScoreCard 
        score={dashboardData?.healthScore?.total || 0} 
        basedOn={dashboardData?.healthScore?.basedOn || 'Based on your recent data'}
      />      

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold mb-4">Your Health Metrics</h3>
          {hasData ? (
            <RadarChart data={metrics} />
          ) : (
            <div className="h-80 flex flex-col items-center justify-center text-gray-500">
              <BeakerIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p>No data yet. Start logging your health metrics!</p>
              <button 
                onClick={() => setShowLogModal(true)}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Log your first metric →
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats & Recommendations */}
        <div className="space-y-4">
          {/* Time-based Tip */}
          <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
            <p className="text-sm text-primary-800">{getTimeBasedTip()}</p>
          </div>

          {/* Recent Activity */}
          {recentLogs.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Recent Activity</h3>
              <div className="space-y-2">
                {recentLogs.slice(0, 3).map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-gray-600">{log.type}</span>
                    <span className="text-gray-900 font-medium">
                      {log.type === 'activity' && `${log.data.steps || 0} steps`}
                      {log.type === 'sleep' && `${log.data.hours || 0} hrs`}
                      {log.type === 'hydration' && `${log.data.glasses || 0} glasses`}
                      {log.type === 'mental' && `Mood: ${log.data.mood || 0}/10`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gender-specific module */}
          {getGenderSpecificStats()}

          {/* Upcoming Reminders */}
          {upcomingReminders.length > 0 && (
            <div className="card bg-yellow-50">
              <h3 className="text-sm font-semibold mb-3 text-yellow-800 flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Upcoming Reminders
              </h3>
              <div className="space-y-2">
                {upcomingReminders.slice(0, 2).map((reminder, idx) => (
                  <div key={idx} className="text-sm text-yellow-700">
                    • {reminder.title} at {reminder.time}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trends Chart */}
      {healthTrends.length > 3 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Monthly Progress</h3>
          <TrendChart data={healthTrends} />
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-start space-x-3">
            <AcademicCapIcon className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-purple-800 mb-2">AI Recommendations</h3>
              <ul className="space-y-2">
                {recommendations.map((rec, idx) => {
                  // Ensure we're rendering a string, not an object
                  let displayText = '';
                  
                  if (typeof rec === 'string') {
                    displayText = rec;
                  } else if (rec && typeof rec === 'object') {
                    // Try to extract a string representation
                    displayText = rec.recommendation || rec.message || rec.text || JSON.stringify(rec);
                  } else {
                    displayText = String(rec);
                  }
                  
                  return (
                    <li key={idx} className="flex items-start text-sm text-purple-700">
                      <CheckCircleIcon className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      {displayText}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold">Personalized Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <TrophyIcon className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold">Your Achievements</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="text-center group cursor-pointer">
                <div className={`w-20 h-20 mx-auto ${achievement.bgColor} rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <span className="text-3xl">{achievement.icon}</span>
                </div>
                <p className="text-sm font-medium text-gray-800">{achievement.name}</p>
                <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Log Modal */}
      <QuickLogModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onLog={handleQuickLog}
        userGender={user?.profile?.gender}
      />
    </motion.div>
  );
};

export default Dashboard;