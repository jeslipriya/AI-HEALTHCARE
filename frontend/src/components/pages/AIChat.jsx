import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiAPI, healthAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  PaperAirplaneIcon, UserIcon, SparklesIcon, MicrophoneIcon,
  BeakerIcon, HeartIcon, ExclamationTriangleIcon, ClipboardDocumentListIcon
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

  useEffect(() => { loadHealthContext(); }, []);

  useEffect(() => {
    if (healthContext) {
      setMessages([{ role: 'assistant', content: generateGreeting(), timestamp: new Date() }]);
    }
  }, [healthContext]);

  const loadHealthContext = async () => {
    try {
      const [healthData, profileData] = await Promise.all([
        healthAPI.getHealthData(null, null, null, 50),
        healthAPI.getDashboardData()
      ]);
      
      setHealthContext({
        profile: { firstName: user?.firstName, lastName: user?.lastName, age: user?.profile?.age, gender: user?.profile?.gender },
        healthInfo: { conditions: user?.healthInfo?.conditions || [], allergies: user?.healthInfo?.allergies || [] },
        lifestyle: { diet: user?.lifestyle?.diet, exerciseFrequency: user?.lifestyle?.exerciseFrequency, sleepHours: user?.lifestyle?.sleepHours },
        goals: user?.goals || [],
        recentActivity: healthData?.data?.data?.slice(0, 10) || [],
        healthScore: profileData?.data?.healthScore?.total || 0
      });
    } catch {
      setMessages([{ role: 'assistant', content: `Hi ${user?.firstName}! I'm CareLens AI, your health assistant. How can I help?`, timestamp: new Date() }]);
    }
  };

  const generateGreeting = () => {
    const { profile, healthInfo, healthScore, recentActivity } = healthContext;
    const parts = [
      `Hi ${profile.firstName}! 👋 I'm CareLens AI. `,
      healthScore >= 80 ? `Great health score of ${healthScore}! ` : healthScore > 0 ? `Your health score is ${healthScore}. ` : '',
      recentActivity.length ? `${recentActivity.length} recent logs. ` : 'No logs yet. ',
      healthInfo.allergies.length ? `I'll consider your allergies to ${healthInfo.allergies.join(', ')}. ` : '',
      healthInfo.conditions.length ? `Keeping your ${healthInfo.conditions.length} conditions in mind. ` : '',
      'How can I assist?'
    ].filter(Boolean).join('');
    return parts;
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const buildPrompt = (msg) => `You are CareLens AI, a health AI assistant. User profile: ${JSON.stringify({
    personal: { name: `${user?.firstName} ${user?.lastName}`, age: user?.profile?.age, gender: user?.profile?.gender },
    medical: { conditions: healthContext?.healthInfo?.conditions || [], allergies: healthContext?.healthInfo?.allergies || [] },
    lifestyle: healthContext?.lifestyle || {},
    goals: healthContext?.goals || [],
    healthScore: healthContext?.healthScore || 0
  })}. Rules: 1. Always consider allergies 2. Account for conditions 3. Be supportive 4. Include disclaimers. Question: ${msg}`;

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map(({ role, content }) => ({ role, content }));
      const { data } = await aiAPI.chat(buildPrompt(currentInput), history);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please try again.", timestamp: new Date() }]);
    } finally { setLoading(false); }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) return toast.error('Voice input not supported');
    const recognition = new window.webkitSpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e) => setInput(e.results[0][0].transcript);
    recognition.start();
  };

  const HealthSnapshot = () => {
    if (!healthContext) return null;
    const { healthInfo, healthScore, recentActivity } = healthContext;
    return (
      <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center"><ClipboardDocumentListIcon className="w-4 h-4 mr-1" />Health Snapshot</h3>
        <p>🏥 Score: {healthScore}</p>
        {healthInfo.conditions.length > 0 && <p>💊 Conditions: {healthInfo.conditions.map(c => c.name).join(', ')}</p>}
        {healthInfo.allergies.length > 0 && <p className="flex items-center"><ExclamationTriangleIcon className="w-3 h-3 mr-1 text-yellow-600" />Allergies: {healthInfo.allergies.join(', ')}</p>}
        {recentActivity.length > 0 && <p>📊 {recentActivity.length} recent logs</p>}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Health Assistant</h1>
        <button onClick={() => setShowContext(!showContext)} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
          <BeakerIcon className="w-5 h-5" /><span>{showContext ? 'Hide' : 'Show'} Context</span>
        </button>
      </div>

      <AnimatePresence>{showContext && <HealthSnapshot />}</AnimatePresence>

      <div className="flex-1 bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${msg.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary-100' : 'bg-purple-100'}`}>
                      {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-primary-600" /> : <SparklesIcon className="w-4 h-4 text-purple-600" />}
                    </div>
                  </div>
                  <div>
                    <div className={`rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center"><SparklesIcon className="w-4 h-4 text-purple-600" /></div>
                <div className="bg-gray-100 rounded-2xl px-4 py-2"><div className="flex space-x-1">{[...Array(3)].map((_, i) => 
                  <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />)}</div></div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="flex items-center space-x-2">
            <button onClick={handleVoiceInput} className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-gray-100 text-gray-600'}`}>
              <MicrophoneIcon className="w-5 h-5" />
            </button>
            <textarea rows="1" className="flex-1 input-field resize-none" placeholder="Ask me anything..." value={input}
              onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} />
            <button onClick={handleSend} disabled={!input.trim() || loading} className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center"><HeartIcon className="w-3 h-3 mr-1 text-pink-500" />CareLens AI knows your health profile. Not medical advice.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AIChat;