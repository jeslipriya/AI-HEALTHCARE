import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI, healthAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  PaperAirplaneIcon, 
  UserIcon, 
  SparklesIcon,
  MicrophoneIcon,
  BeakerIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AIChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [healthContext, setHealthContext] = useState(null);
  const [showContext, setShowContext] = useState(false);
  const messagesEndRef = useRef(null);

  // Load user health context on mount
  useEffect(() => {
    loadHealthContext();
  }, []);

  // Initialize chat with context-aware greeting
  useEffect(() => {
    if (healthContext) {
      const greeting = generatePersonalizedGreeting();
      setMessages([
        {
          role: 'assistant',
          content: greeting,
          timestamp: new Date()
        }
      ]);
    }
  }, [healthContext]);

  const loadHealthContext = async () => {
    try {
      // Fetch recent health data
      const [healthData, profileData] = await Promise.all([
        healthAPI.getHealthData(null, null, null, 50),
        healthAPI.getDashboardData()
      ]);

      const context = {
        profile: {
          firstName: user?.firstName,
          lastName: user?.lastName,
          age: user?.profile?.age,
          gender: user?.profile?.gender,
          bloodType: user?.profile?.bloodType,
          height: user?.profile?.height,
          weight: user?.profile?.weight
        },
        healthInfo: {
          conditions: user?.healthInfo?.conditions || [],
          allergies: user?.healthInfo?.allergies || [],
          surgeries: user?.healthInfo?.surgeries || [],
          familyHistory: user?.healthInfo?.familyHistory || []
        },
        lifestyle: {
          diet: user?.lifestyle?.diet,
          exerciseFrequency: user?.lifestyle?.exerciseFrequency,
          sleepHours: user?.lifestyle?.sleepHours,
          smoking: user?.lifestyle?.smoking,
          alcohol: user?.lifestyle?.alcohol,
          stressLevel: user?.lifestyle?.stressLevel
        },
        goals: user?.goals || [],
        recentActivity: healthData?.data?.data?.slice(0, 10) || [],
        healthScore: profileData?.data?.healthScore?.total || 0,
        metrics: profileData?.data?.metrics || {}
      };

      setHealthContext(context);
    } catch (error) {
      console.error('Failed to load health context:', error);
      // Set default greeting if context fails to load
      setMessages([
        {
          role: 'assistant',
          content: `Hi ${user?.firstName}! I'm Aura, your personal health assistant. How can I help you today?`,
          timestamp: new Date()
        }
      ]);
    }
  };

  const generatePersonalizedGreeting = () => {
    if (!healthContext) return `Hi ${user?.firstName}! I'm Aura, your personal health assistant. How can I help you today?`;

    const { profile, healthInfo, healthScore, recentActivity } = healthContext;
    const hasAllergies = healthInfo.allergies.length > 0;
    const hasConditions = healthInfo.conditions.length > 0;
    const recentLogs = recentActivity.length;

    let greeting = `Hi ${profile.firstName}! 👋 I'm Aura, your AI health assistant. `;

    // Personalized based on health status
    if (healthScore >= 80) {
      greeting += `Your health score is looking great at ${healthScore}! `;
    } else if (healthScore >= 60) {
      greeting += `I see your health score is ${healthScore}. Let's work on improving that together. `;
    } else if (healthScore > 0) {
      greeting += `I notice your health score is ${healthScore}. Don't worry, I'm here to help you improve it. `;
    }

    // Mention recent activity
    if (recentLogs > 0) {
      greeting += `You've been tracking your health with ${recentLogs} recent logs. `;
    } else {
      greeting += `I notice you haven't logged any health data yet. `;
    }

    // Acknowledge allergies/conditions if present
    if (hasAllergies) {
      greeting += `I'll be sure to consider your allergies to ${healthInfo.allergies.join(', ')} in my recommendations. `;
    }
    if (hasConditions) {
      greeting += `I'll also keep your ${healthInfo.conditions.length} health conditions in mind. `;
    }

    greeting += `How can I assist you today?`;

    return greeting;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildHealthPrompt = (userMessage) => {
    // Create a comprehensive health profile for the AI
    const healthProfile = {
      personal: {
        name: `${user?.firstName} ${user?.lastName}`,
        age: user?.profile?.age || 'Not specified',
        gender: user?.profile?.gender || 'Not specified',
        bloodType: user?.profile?.bloodType || 'Not specified'
      },
      medical: {
        conditions: healthContext?.healthInfo?.conditions?.map(c => ({
          name: c.name,
          severity: c.severity,
          medications: c.medications
        })) || [],
        allergies: healthContext?.healthInfo?.allergies || [],
        surgeries: healthContext?.healthInfo?.surgeries || [],
        familyHistory: healthContext?.healthInfo?.familyHistory || []
      },
      lifestyle: {
        diet: healthContext?.lifestyle?.diet || 'Not specified',
        exercise: healthContext?.lifestyle?.exerciseFrequency || 'Not specified',
        sleep: healthContext?.lifestyle?.sleepHours ? `${healthContext.lifestyle.sleepHours} hours` : 'Not tracked',
        smoking: healthContext?.lifestyle?.smoking ? 'Yes' : 'No',
        alcohol: healthContext?.lifestyle?.alcohol || 'Not specified',
        stress: healthContext?.lifestyle?.stressLevel || 'Not specified'
      },
      goals: healthContext?.goals || [],
      recentHealth: {
        score: healthContext?.healthScore || 0,
        metrics: healthContext?.metrics || {},
        recentLogs: healthContext?.recentActivity?.map(log => ({
          type: log.type,
          data: log.data,
          date: new Date(log.timestamp).toLocaleDateString()
        })) || []
      }
    };

    return `You are Aura, a compassionate and knowledgeable health AI assistant. You have access to the user's complete health profile below. Use this information to provide personalized, accurate, and helpful responses.

IMPORTANT RULES:
1. ALWAYS consider the user's allergies when giving food or medication advice
2. Take into account their medical conditions and medications
3. Consider their lifestyle factors (diet, exercise, sleep, stress)
4. Reference their health goals when relevant
5. Be encouraging and supportive
6. Include appropriate medical disclaimers
7. If you don't know something, be honest about it
8. Suggest consulting healthcare providers for serious concerns

USER'S HEALTH PROFILE:
${JSON.stringify(healthProfile, null, 2)}

USER'S QUESTION: ${userMessage}

Provide a helpful, personalized response that takes into account all the above health information.`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      // Prepare conversation history
      const historyForAPI = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Build prompt with full health context
      const contextualPrompt = buildHealthPrompt(currentInput);

      const response = await aiAPI.chat(contextualPrompt, historyForAPI);
      
      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const getHealthSummary = () => {
    if (!healthContext) return null;

    const { healthInfo, healthScore, recentActivity } = healthContext;
    const hasAllergies = healthInfo.allergies.length > 0;
    const hasConditions = healthInfo.conditions.length > 0;

    return (
      <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
          <ClipboardDocumentListIcon className="w-4 h-4 mr-1" />
          Your Health Snapshot
        </h3>
        <div className="space-y-1 text-blue-700">
          <p>🏥 Health Score: {healthScore}</p>
          {hasConditions && (
            <p>💊 Conditions: {healthInfo.conditions.map(c => c.name).join(', ')}</p>
          )}
          {hasAllergies && (
            <p className="flex items-center">
              <ExclamationTriangleIcon className="w-3 h-3 mr-1 text-yellow-600" />
              Allergies: {healthInfo.allergies.join(', ')}
            </p>
          )}
          {recentActivity.length > 0 && (
            <p>📊 Recent logs: {recentActivity.length} entries</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-12rem)] flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Health Assistant</h1>
        <button
          onClick={() => setShowContext(!showContext)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <BeakerIcon className="w-5 h-5" />
          <span>{showContext ? 'Hide' : 'Show'} Health Context</span>
        </button>
      </div>

      {/* Health Context Panel */}
      <AnimatePresence>
        {showContext && getHealthSummary()}
      </AnimatePresence>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-primary-100' 
                        : 'bg-purple-100'
                    }`}>
                      {message.role === 'user' 
                        ? <UserIcon className="w-4 h-4 text-primary-600" />
                        : <SparklesIcon className="w-4 h-4 text-purple-600" />
                      }
                    </div>
                  </div>
                  <div>
                    <div className={`rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-purple-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleVoiceInput}
              className={`p-2 rounded-lg transition-colors ${
                isListening 
                  ? 'bg-red-100 text-red-600 animate-pulse' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>
            
            <textarea
              rows="1"
              className="flex-1 input-field resize-none"
              placeholder="Ask me anything about your health... (I know about your allergies, conditions, and health goals!)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center">
            <HeartIcon className="w-3 h-3 mr-1 text-pink-500" />
            Aura is aware of your health profile and will personalize responses accordingly. Not a substitute for professional medical advice.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AIChat;