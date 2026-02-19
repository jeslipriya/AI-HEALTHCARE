import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  HeartIcon, 
  BeakerIcon, 
  ClockIcon,
  SparklesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline';
import { healthAPI, aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const WomensHealth = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  
  // Period tracking data
  const [periodData, setPeriodData] = useState({
    startDate: '',
    endDate: '',
    flow: 'medium',
    symptoms: [],
    painLevel: 5,
    notes: ''
  });
  
  // Pregnancy data
  const [pregnancyData, setPregnancyData] = useState({
    isPregnant: false,
    week: '',
    symptoms: [],
    appointmentDate: '',
    babyName: '',
    weightGain: '',
    bloodPressure: '',
    glucoseLevel: ''
  });
  
  // Cycle history and predictions
  const [cycleHistory, setCycleHistory] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [fertilityWindow, setFertilityWindow] = useState(null);
  
  // Symptom tracking
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  
  // Health metrics
  const [healthMetrics, setHealthMetrics] = useState({
    bbt: '',
    cervicalMucus: '',
    ovulationTests: [],
    mood: 5
  });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'period', name: 'Period Tracker', icon: CalendarIcon },
    { id: 'fertility', name: 'Fertility & Ovulation', icon: HeartIcon },
    { id: 'pregnancy', name: 'Pregnancy', icon: BeakerIcon },
    { id: 'symptoms', name: 'Symptom Analyzer', icon: SparklesIcon },
    { id: 'insights', name: 'AI Insights', icon: LightBulbIcon },
  ];

  const commonSymptoms = [
    'Cramps', 'Bloating', 'Headache', 'Fatigue', 
    'Nausea', 'Breast Tenderness', 'Mood Swings', 'Back Pain',
    'Acne', 'Food Cravings', 'Insomnia', 'Dizziness',
    'Spotting', 'Clots', 'Constipation', 'Diarrhea'
  ];

  // Load cycle history on mount
  useEffect(() => {
    loadCycleHistory();
  }, []);

  // Load cycle history on mount
  const loadCycleHistory = async () => {
    try {
      const data = await healthAPI.getHealthData('period', null, null, 12);
      console.log('Raw cycle history data:', data.data);
      
      if (data.data && data.data.data) {
        // Format the data consistently
        const formattedHistory = data.data.data.map(item => ({
          startDate: item.data?.startDate || item.startDate,
          endDate: item.data?.endDate || item.endDate,
          flow: item.data?.flow || item.flow,
          symptoms: item.data?.symptoms || item.symptoms || [],
          painLevel: item.data?.painLevel || item.painLevel,
          notes: item.data?.notes || item.notes,
          timestamp: item.timestamp
        }));
        
        setCycleHistory(formattedHistory);
        calculatePredictions(formattedHistory);
      } else {
        // If no data, set empty array
        setCycleHistory([]);
      }
    } catch (error) {
      console.error('Failed to load cycle history:', error);
      setCycleHistory([]);
    }
  };

// Calculate predictions using AI - FIXED VERSION
const calculatePredictions = async (history) => {
  if (history.length < 2) return;

  try {
    const response = await aiAPI.chat(
      `Based on this menstrual cycle history, predict the next period and fertile window.
       Return ONLY a valid JSON object with no additional text.
       
      Cycle history data:
      ${JSON.stringify(history.map(h => ({
        start: h.startDate || h.data?.startDate,
        end: h.endDate || h.data?.endDate,
        flow: h.flow || h.data?.flow,
        symptoms: h.symptoms || h.data?.symptoms || []
      })))}
      
      Required JSON format:
      {
        "nextPeriod": "YYYY-MM-DD",
        "confidence": "high/medium/low",
        "fertileWindow": {
          "start": "YYYY-MM-DD",
          "end": "YYYY-MM-DD",
          "ovulation": "YYYY-MM-DD"
        },
        "cycleLength": "average cycle length in days",
        "irregularities": ["any noted patterns"],
        "recommendations": ["personalized advice"]
      }`,
      []
    );

    console.log('Raw predictions response:', response.data);

    let predictions = null;
    
    // Try to parse the response
    if (response.data && response.data.response) {
      const responseText = response.data.response;
      
      // Try to extract JSON if it's wrapped in markdown or text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          predictions = JSON.parse(jsonMatch[0]);
          console.log('Parsed predictions:', predictions);
        } catch (e) {
          console.error('Failed to parse JSON from extracted text:', e);
        }
      } else {
        // If no JSON found, create default predictions
        console.log('No JSON found in response, using defaults');
      }
    }
    
    // If parsing failed or no predictions, use calculated defaults
    if (!predictions) {
      predictions = calculateDefaultPredictions(history);
    }
    
    setPredictions(predictions);
    if (predictions.fertileWindow) {
      setFertilityWindow(predictions.fertileWindow);
    }
    
  } catch (error) {
    console.error('Failed to get predictions:', error);
    // Use calculated defaults on error
    const defaultPredictions = calculateDefaultPredictions(history);
    setPredictions(defaultPredictions);
    if (defaultPredictions.fertileWindow) {
      setFertilityWindow(defaultPredictions.fertileWindow);
    }
  }
};

// Helper function to calculate default predictions based on cycle history
const calculateDefaultPredictions = (history) => {
  if (!history || history.length === 0) {
    return {
      nextPeriod: 'Not enough data',
      confidence: 'low',
      fertileWindow: {
        start: 'Not enough data',
        end: 'Not enough data',
        ovulation: 'Not enough data'
      },
      cycleLength: 'Unknown',
      irregularities: ['Track more cycles for accurate predictions'],
      recommendations: ['Continue tracking your cycles']
    };
  }

  // Calculate average cycle length
  let totalCycleLength = 0;
  let validCycles = 0;
  
  for (let i = 1; i < history.length; i++) {
    const prevStart = new Date(history[i-1].startDate || history[i-1].data?.startDate);
    const currStart = new Date(history[i].startDate || history[i].data?.startDate);
    
    if (prevStart && currStart) {
      const diffTime = Math.abs(currStart - prevStart);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalCycleLength += diffDays;
      validCycles++;
    }
  }
  
  const avgCycleLength = validCycles > 0 ? Math.round(totalCycleLength / validCycles) : 28;
  
  // Predict next period
  const lastPeriod = new Date(history[history.length-1].startDate || history[history.length-1].data?.startDate);
  const nextPeriod = new Date(lastPeriod);
  nextPeriod.setDate(nextPeriod.getDate() + avgCycleLength);
  
  // Calculate fertile window (simplified)
  const fertileStart = new Date(nextPeriod);
  fertileStart.setDate(nextPeriod.getDate() - 18);
  
  const ovulation = new Date(nextPeriod);
  ovulation.setDate(nextPeriod.getDate() - 14);
  
  const fertileEnd = new Date(ovulation);
  fertileEnd.setDate(ovulation.getDate() + 1);
  
  return {
    nextPeriod: nextPeriod.toISOString().split('T')[0],
    confidence: validCycles > 2 ? 'high' : validCycles > 0 ? 'medium' : 'low',
    fertileWindow: {
      start: fertileStart.toISOString().split('T')[0],
      end: fertileEnd.toISOString().split('T')[0],
      ovulation: ovulation.toISOString().split('T')[0]
    },
    cycleLength: `${avgCycleLength} days`,
    irregularities: validCycles > 3 ? [] : ['Track more cycles for pattern detection'],
    recommendations: [
      'Continue tracking your cycle daily',
      'Note any symptoms or changes',
      'Stay hydrated and maintain a balanced diet',
      'Exercise regularly for hormonal balance'
    ]
  };
};

  // Handle period logging with AI analysis
  const handleLogPeriod = async () => {
    if (!periodData.startDate) {
      toast.error('Please select start date');
      return;
    }

    setLoading(true);
    try {
      // Log period data
      await healthAPI.logPeriod(
        periodData.startDate,
        periodData.endDate || periodData.startDate,
        periodData.flow,
        periodData.symptoms,
        { painLevel: periodData.painLevel, notes: periodData.notes }
      );

      // Get AI insights about this period
      const insights = await aiAPI.chat(
        `Analyze this period data and provide insights:
        Start: ${periodData.startDate}
        End: ${periodData.endDate || 'ongoing'}
        Flow: ${periodData.flow}
        Symptoms: ${periodData.symptoms.join(', ')}
        Pain Level: ${periodData.painLevel}/10
        
        Provide brief, helpful insights about what this might indicate and any recommendations.`,
        []
      );

      toast.success('Period logged successfully!');
      
      // Update local state
      const nextPeriod = new Date(periodData.startDate);
      nextPeriod.setDate(nextPeriod.getDate() + 28);
      
      const newCycle = {
        startDate: periodData.startDate,
        endDate: periodData.endDate,
        flow: periodData.flow,
        symptoms: periodData.symptoms,
        painLevel: periodData.painLevel,
        nextPredicted: nextPeriod.toISOString().split('T')[0]
      };
      
      setCycleHistory(prev => [...prev, newCycle]);

      // Show AI insights
      setAiInsights(insights.data.response);

      // Reset form
      setPeriodData({
        startDate: '',
        endDate: '',
        flow: 'medium',
        symptoms: [],
        painLevel: 5,
        notes: ''
      });
      setSelectedSymptoms([]);

      // Recalculate predictions
      calculatePredictions([...cycleHistory, newCycle]);

    } catch (error) {
      toast.error('Failed to log period');
    } finally {
      setLoading(false);
    }
  };

  // Handle symptom selection
  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
    setPeriodData(prev => ({
      ...prev,
      symptoms: selectedSymptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  // Analyze symptoms with AI - FIXED
  const analyzeSymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error('Please select symptoms to analyze');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Analyzing symptoms:', selectedSymptoms);
      
      const response = await aiAPI.analyzeSymptoms(
        `I'm experiencing these symptoms: ${selectedSymptoms.join(', ')}. 
        This is day ${getCycleDay()} of my menstrual cycle.`
      );

      console.log('✅ AI Analysis response:', response.data);
      
      if (response.data.success && response.data.analysis) {
        // Check if analysis is an object or string
        let analysisData = response.data.analysis;
        
        // If it's a string, try to parse it
        if (typeof analysisData === 'string') {
          try {
            analysisData = JSON.parse(analysisData);
          } catch (e) {
            // If not JSON, create a structured object
            analysisData = {
              possibleCauses: [analysisData],
              severity: "medium",
              recommendations: ["Monitor your symptoms", "Stay hydrated", "Rest if needed"],
              redFlags: ["Seek immediate care if symptoms worsen"],
              whenToSeeDoctor: "Consult a doctor if symptoms persist",
              disclaimer: "⚠️ This is an AI analysis. Please consult a healthcare provider for medical advice."
            };
          }
        }
        
        // Ensure analysisData has the expected structure
        const formattedAnalysis = {
          possibleCauses: Array.isArray(analysisData.possibleCauses) ? analysisData.possibleCauses : 
                          (analysisData.possibleCauses ? [analysisData.possibleCauses] : ["Unable to determine specific causes"]),
          severity: analysisData.severity || "medium",
          recommendations: Array.isArray(analysisData.recommendations) ? analysisData.recommendations : 
                          (analysisData.recommendations ? [analysisData.recommendations] : ["Monitor symptoms", "Rest", "Stay hydrated"]),
          redFlags: Array.isArray(analysisData.redFlags) ? analysisData.redFlags : 
                  (analysisData.redFlags ? [analysisData.redFlags] : ["Severe pain", "High fever", "Difficulty breathing"]),
          whenToSeeDoctor: analysisData.whenToSeeDoctor || "Consult a healthcare provider if symptoms persist or worsen",
          disclaimer: analysisData.disclaimer || "⚠️ This is an AI analysis. Please consult a healthcare provider for medical advice."
        };
        
        setAiInsights(formattedAnalysis);
        toast.success('Symptoms analyzed!');
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('❌ Symptom analysis error:', error);
      
      // Set fallback analysis as a proper object, not a string
      const fallbackAnalysis = {
        possibleCauses: [
          "Common menstrual symptoms",
          "Hormonal fluctuations",
          "Normal cycle-related discomfort"
        ],
        severity: "low",
        recommendations: [
          "Rest and stay hydrated",
          "Apply heat to affected areas",
          "Take over-the-counter pain relief if needed"
        ],
        redFlags: [
          "Severe pain not relieved by medication",
          "Symptoms that interfere with daily activities"
        ],
        whenToSeeDoctor: "If symptoms are severe or persist beyond your normal pattern",
        disclaimer: "⚠️ This is a general analysis. Please consult a healthcare provider for medical advice."
      };
      
      setAiInsights(fallbackAnalysis);
      toast.error('Using general symptom guidance');
    } finally {
      setLoading(false);
    }
  };

  // Get current cycle day
  const getCycleDay = () => {
    if (cycleHistory.length === 0) return 1;
    const lastPeriod = new Date(cycleHistory[cycleHistory.length - 1].startDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastPeriod);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Update fertility tracking
  const updateFertilityData = async (type, value) => {
    setHealthMetrics(prev => ({ ...prev, [type]: value }));

    try {
      await healthAPI.logHealthData('fertility', {
        type,
        value,
        date: new Date().toISOString(),
        cycleDay: getCycleDay()
      });

      // Check if we should update fertile window
      if (type === 'bbt' && parseFloat(value) > 36.5) {
        toast.info('Temperature rise detected - possible ovulation');
      }
    } catch (error) {
      console.error('Failed to log fertility data:', error);
    }
  };

  // Get fertility insights
  const getFertilityInsights = () => {
    if (!fertilityWindow) return null;

    const today = new Date();
    const fertileStart = new Date(fertilityWindow.start);
    const fertileEnd = new Date(fertilityWindow.end);
    const ovulation = new Date(fertilityWindow.ovulation);

    if (today >= fertileStart && today <= fertileEnd) {
      if (today.toDateString() === ovulation.toDateString()) {
        return {
          status: 'ovulation',
          message: '🌸 Today is your predicted ovulation day!',
          color: 'purple'
        };
      }
      return {
        status: 'fertile',
        message: '✨ You are in your fertile window',
        color: 'pink'
      };
    } else if (today < fertileStart) {
      const daysUntil = Math.ceil((fertileStart - today) / (1000 * 60 * 60 * 24));
      return {
        status: 'approaching',
        message: `⏳ Fertile window starts in ${daysUntil} days`,
        color: 'blue'
      };
    } else {
      return {
        status: 'luteal',
        message: '🌙 In luteal phase - next fertile window after your period',
        color: 'gray'
      };
    }
  };

  const fertilityStatus = getFertilityInsights();

  // Handle pregnancy update
  const handlePregnancyUpdate = async () => {
    try {
      await healthAPI.logHealthData('pregnancy', pregnancyData);
      toast.success('Pregnancy info updated!');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with AI Badge */}
      <div className="card bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Women's Health AI</h2>
            <p className="opacity-90 mt-1">Intelligent tracking with personalized insights</p>
          </div>
          <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-4 py-2 rounded-full">
            <SparklesIcon className="w-5 h-5" />
            <span className="text-sm font-medium">AI-Powered</span>
          </div>
        </div>
      </div>

      {/* Cycle Day Indicator */}
      {cycleHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-pink-50 to-pink-100">
            <p className="text-sm text-pink-600">Cycle Day</p>
            <p className="text-2xl font-bold text-pink-700">{getCycleDay()}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
            <p className="text-sm text-purple-600">Next Period</p>
            <p className="text-2xl font-bold text-purple-700">
              {predictions?.nextPeriod || '—'}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-sm text-blue-600">Cycle Length</p>
            <p className="text-2xl font-bold text-blue-700">
              {predictions?.cycleLength || '28'} days
            </p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-sm text-green-600">Confidence</p>
            <p className="text-2xl font-bold text-green-700 capitalize">
              {predictions?.confidence || 'medium'}
            </p>
          </div>
        </div>
      )}

      {/* Fertility Status Banner */}
      {fertilityStatus && (
        <div className={`card bg-${fertilityStatus.color}-50 border-${fertilityStatus.color}-200`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {fertilityStatus.status === 'ovulation' && <HeartIcon className={`w-6 h-6 text-${fertilityStatus.color}-600`} />}
              {fertilityStatus.status === 'fertile' && <SparklesIcon className={`w-6 h-6 text-${fertilityStatus.color}-600`} />}
              {fertilityStatus.status === 'approaching' && <ClockIcon className={`w-6 h-6 text-${fertilityStatus.color}-600`} />}
              {fertilityStatus.status === 'luteal' && <MoonIcon className={`w-6 h-6 text-${fertilityStatus.color}-600`} />}
              <span className={`font-medium text-${fertilityStatus.color}-800`}>
                {fertilityStatus.message}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Cycle History Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Cycle History</h3>
            {cycleHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No cycle data yet. Start tracking your period!
              </p>
            ) : (
              <div className="space-y-2">
                {cycleHistory.slice(-6).map((cycle, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {new Date(cycle.startDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Flow: {cycle.flow} • Symptoms: {cycle.symptoms?.join(', ') || 'None'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-pink-600">
                        Next: {cycle.nextPredicted}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Common Symptoms */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Common Symptoms This Cycle</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonSymptoms.slice(0, 8).map((symptom) => (
                <div key={symptom} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  <span className="text-sm">{symptom}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Quick Insight */}
          {aiInsights && (
            <div className="card bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="flex items-start space-x-3">
                <LightBulbIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium text-purple-800 mb-1">AI Insight</h4>
                  <p className="text-sm text-purple-700">{aiInsights}</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Period Tracker Tab - Enhanced */}
      {activeTab === 'period' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Log Your Period</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={periodData.startDate}
                  onChange={(e) => setPeriodData({...periodData, startDate: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={periodData.endDate}
                  onChange={(e) => setPeriodData({...periodData, endDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flow
                </label>
                <select
                  className="input-field"
                  value={periodData.flow}
                  onChange={(e) => setPeriodData({...periodData, flow: e.target.value})}
                >
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                  <option value="very heavy">Very Heavy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pain Level (1-10)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    className="flex-1"
                    value={periodData.painLevel}
                    onChange={(e) => setPeriodData({...periodData, painLevel: parseInt(e.target.value)})}
                  />
                  <span className="text-lg font-semibold text-pink-600 w-8">
                    {periodData.painLevel}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms (select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {commonSymptoms.map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => toggleSymptom(symptom)}
                    className={`p-2 rounded-lg text-sm transition-colors ${
                      selectedSymptoms.includes(symptom)
                        ? 'bg-pink-100 text-pink-700 border-pink-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                rows="3"
                className="input-field"
                placeholder="Any additional notes about your period..."
                value={periodData.notes}
                onChange={(e) => setPeriodData({...periodData, notes: e.target.value})}
              />
            </div>

            <button
              onClick={handleLogPeriod}
              disabled={loading}
              className="mt-6 btn-primary w-full"
            >
              {loading ? 'Logging...' : 'Log Period with AI Analysis'}
            </button>
          </div>

          {/* Cycle History */}
          {cycleHistory.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Recent Cycles</h3>
              <div className="space-y-3">
                {cycleHistory.slice(-5).map((cycle, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {new Date(cycle.startDate).toLocaleDateString()} - 
                          {cycle.endDate ? new Date(cycle.endDate).toLocaleDateString() : 'Ongoing'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Flow: {cycle.flow} • Pain: {cycle.painLevel}/10
                        </p>
                        {cycle.symptoms?.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Symptoms: {cycle.symptoms.join(', ')}
                            </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-pink-600">Next predicted:</p>
                        <p className="text-sm font-medium">{cycle.nextPredicted}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Fertility & Ovulation Tab - Enhanced */}
      {activeTab === 'fertility' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Fertility Window Display */}
          <div className="card bg-gradient-to-br from-pink-50 to-purple-50">
            <h3 className="text-lg font-semibold mb-4">Your Fertile Window</h3>
            
            {fertilityWindow ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Window Start</p>
                    <p className="text-lg font-bold text-pink-600">
                      {new Date(fertilityWindow.start).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Ovulation</p>
                    <p className="text-lg font-bold text-purple-600">
                      {new Date(fertilityWindow.ovulation).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Window End</p>
                    <p className="text-lg font-bold text-pink-600">
                      {new Date(fertilityWindow.end).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Fertility Calendar */}
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">This Week's Fertility Status:</p>
                  <div className="flex space-x-1">
                    {[...Array(7)].map((_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() + i);
                      const isFertile = date >= new Date(fertilityWindow.start) && 
                                       date <= new Date(fertilityWindow.end);
                      const isOvulation = date.toDateString() === new Date(fertilityWindow.ovulation).toDateString();
                      
                      return (
                        <div key={i} className="flex-1 text-center">
                          <div className={`p-2 rounded-lg ${
                            isOvulation ? 'bg-purple-200' :
                            isFertile ? 'bg-pink-200' : 'bg-gray-100'
                          }`}>
                            <p className="text-xs font-medium">
                              {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className="text-xs mt-1">
                              {isOvulation ? '🌕' : isFertile ? '✨' : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">
                {cycleHistory.length < 2 
                  ? 'Track at least 2 cycles to see fertility predictions' 
                  : 'Calculating your fertile window...'}
              </p>
            )}
          </div>

          {/* Fertility Tracking Tools */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Track Fertility Signs</h3>
            
            <div className="space-y-6">
              {/* Basal Body Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Basal Body Temperature (°C)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    step="0.01"
                    className="input-field flex-1"
                    placeholder="e.g., 36.5"
                    value={healthMetrics.bbt}
                    onChange={(e) => updateFertilityData('bbt', e.target.value)}
                  />
                  {healthMetrics.bbt && parseFloat(healthMetrics.bbt) > 36.5 && (
                    <span className="text-sm text-green-600 whitespace-nowrap">
                      ⬆️ Rise detected
                    </span>
                  )}
                </div>
              </div>

              {/* Cervical Mucus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cervical Mucus
                </label>
                <select
                  className="input-field"
                  value={healthMetrics.cervicalMucus}
                  onChange={(e) => updateFertilityData('cervicalMucus', e.target.value)}
                >
                  <option value="">Select consistency</option>
                  <option value="dry">Dry / Nothing</option>
                  <option value="sticky">Sticky / Past</option>
                  <option value="creamy">Creamy / Milky</option>
                  <option value="watery">Watery</option>
                  <option value="eggwhite">Egg White / Stretchy</option>
                </select>
              </div>

              {/* Mood Tracker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mood Today
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    className="flex-1"
                    value={healthMetrics.mood}
                    onChange={(e) => setHealthMetrics({...healthMetrics, mood: parseInt(e.target.value)})}
                  />
                  <div className="flex items-center space-x-2">
                    <SunIcon className={`w-5 h-5 ${healthMetrics.mood > 6 ? 'text-yellow-500' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium">{healthMetrics.mood}/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Fertility Tips */}
          {predictions?.recommendations && (
            <div className="card bg-blue-50">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <LightBulbIcon className="w-5 h-5 mr-2" />
                AI Fertility Tips
              </h4>
              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                {predictions.recommendations.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Pregnancy Tab */}
      {activeTab === 'pregnancy' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Pregnancy Tracking</h3>
            <label className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">I'm pregnant</span>
              <input
                type="checkbox"
                className="toggle"
                checked={pregnancyData.isPregnant}
                onChange={(e) => setPregnancyData({...pregnancyData, isPregnant: e.target.checked})}
              />
            </label>
          </div>

          {pregnancyData.isPregnant && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Week
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="42"
                    className="input-field"
                    placeholder="e.g., 20"
                    value={pregnancyData.week}
                    onChange={(e) => setPregnancyData({...pregnancyData, week: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next Appointment
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={pregnancyData.appointmentDate}
                    onChange={(e) => setPregnancyData({...pregnancyData, appointmentDate: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight Gain (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field"
                    placeholder="e.g., 5.5"
                    value={pregnancyData.weightGain}
                    onChange={(e) => setPregnancyData({...pregnancyData, weightGain: e.target.value})}
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
                    value={pregnancyData.bloodPressure}
                    onChange={(e) => setPregnancyData({...pregnancyData, bloodPressure: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms / Notes
                </label>
                <textarea
                  rows="4"
                  className="input-field"
                  placeholder="Any symptoms or notes about your pregnancy..."
                  value={pregnancyData.symptoms}
                  onChange={(e) => setPregnancyData({...pregnancyData, symptoms: e.target.value})}
                />
              </div>

              <button
                onClick={handlePregnancyUpdate}
                className="btn-primary w-full"
              >
                Update Pregnancy Info
              </button>

              {/* Weekly Tips with AI */}
              {pregnancyData.week && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Week {pregnancyData.week} Tip</h4>
                  <p className="text-sm text-green-700">
                    {parseInt(pregnancyData.week) < 12 && "First trimester: Focus on folic acid, stay hydrated, and rest when needed."}
                    {parseInt(pregnancyData.week) >= 12 && parseInt(pregnancyData.week) < 27 && "Second trimester: You might feel more energetic. Stay active with pregnancy-safe exercises."}
                    {parseInt(pregnancyData.week) >= 27 && "Third trimester: Prepare for baby's arrival, practice breathing exercises, and rest."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Symptoms Tab with AI Analysis */}
      {activeTab === 'symptoms' && (
        <div className="space-y-6">
          {/* Symptom Selection Card */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Track Symptoms with AI Analysis</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {commonSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`p-4 rounded-lg text-center transition-colors ${
                    selectedSymptoms.includes(symptom)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-pink-50'
                  }`}
                >
                  <p className="text-sm font-medium">{symptom}</p>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity (1-10)
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                className="w-full" 
                value={periodData.painLevel}
                onChange={(e) => setPeriodData({...periodData, painLevel: parseInt(e.target.value)})}
              />
              <div className="text-center mt-2">
                <span className="text-lg font-semibold text-pink-600">
                  {periodData.painLevel}/10
                </span>
              </div>
            </div>

            <button
              onClick={analyzeSymptoms}
              disabled={loading || selectedSymptoms.length === 0}
              className="mt-6 btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                'Analyze Symptoms with AI'
              )}
            </button>
          </div>

          {/* Analysis Results Display - FIXED */}
          {aiInsights && typeof aiInsights === 'object' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <SparklesIcon className="w-5 h-5 text-purple-600 mr-2" />
                AI Analysis Results
              </h3>
              
              <div className="space-y-4">
                {/* Severity Badge */}
                {aiInsights.severity && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Severity:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      aiInsights.severity === 'high' ? 'bg-red-100 text-red-700' :
                      aiInsights.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {aiInsights.severity.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Possible Causes */}
                {aiInsights.possibleCauses && aiInsights.possibleCauses.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 mr-1" />
                      Possible Causes
                    </h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {aiInsights.possibleCauses.map((cause, idx) => (
                        <li key={idx}>{cause}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-600 mr-1" />
                      Recommendations
                    </h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {aiInsights.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Red Flags */}
                {aiInsights.redFlags && aiInsights.redFlags.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-600 mr-1" />
                      When to Seek Medical Attention
                    </h4>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {aiInsights.redFlags.map((flag, idx) => (
                        <li key={idx}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* When to See Doctor */}
                {aiInsights.whenToSeeDoctor && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">👩‍⚕️ Doctor's Visit</h4>
                    <p className="text-sm text-blue-700">{aiInsights.whenToSeeDoctor}</p>
                  </div>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-gray-500 italic mt-4">
                  {aiInsights.disclaimer || "⚠️ This is an AI analysis. Please consult a healthcare provider for medical advice."}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* AI Insights Tab - FIXED */}
      {activeTab === 'insights' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">AI Health Insights</h3>
          
          {aiInsights && typeof aiInsights === 'object' ? (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                {aiInsights.possibleCauses && (
                  <>
                    <h4 className="font-medium text-purple-800 mb-2">Possible Causes:</h4>
                    <ul className="list-disc list-inside text-sm text-purple-700">
                      {aiInsights.possibleCauses.map((cause, idx) => (
                        <li key={idx}>{cause}</li>
                      ))}
                    </ul>
                  </>
                )}
                {aiInsights.recommendations && (
                  <>
                    <h4 className="font-medium text-purple-800 mt-3 mb-2">Recommendations:</h4>
                    <ul className="list-disc list-inside text-sm text-purple-700">
                      {aiInsights.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              
              <button
                onClick={async () => {
                  const response = await aiAPI.chat(
                    `Based on my cycle history: ${JSON.stringify(cycleHistory)},
                    give me personalized health recommendations for the upcoming week.`,
                    []
                  );
                  setAiInsights({ 
                    possibleCauses: ["General Health Insights"],
                    recommendations: [response.data.response],
                    severity: "info",
                    disclaimer: "⚠️ AI-generated insights"
                  });
                }}
                className="btn-secondary w-full"
              >
                Get More Insights
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Track your cycles and symptoms to get AI-powered insights</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WomensHealth;