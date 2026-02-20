import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, SunIcon, MoonIcon, CheckCircleIcon, BeakerIcon, ExclamationTriangleIcon, ClockIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { aiAPI, healthAPI } from '../services/api';
import toast from 'react-hot-toast';

const SkinCareAI = () => {
  const [activeTab, setActiveTab] = useState('analyze');
  const [skinAnalysis, setSkinAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skinDescription, setSkinDescription] = useState('');
  const [concerns, setConcerns] = useState('');
  const [dailyRoutine, setDailyRoutine] = useState({
    morning: [
      { id: 'cleanse', name: 'Gentle Cleanser', emoji: '🧼', time: '5 min', completed: false },
      { id: 'toner', name: 'Toner', emoji: '💧', time: '2 min', completed: false },
      { id: 'vitaminC', name: 'Vitamin C Serum', emoji: '🍊', time: '3 min', completed: false },
      { id: 'moisturize', name: 'Moisturizer', emoji: '🧴', time: '2 min', completed: false },
      { id: 'sunscreen', name: 'Sunscreen SPF 50+', emoji: '☀️', time: '3 min', completed: false },
    ],
    evening: [
      { id: 'oilCleanse', name: 'Oil Cleanser', emoji: '💆', time: '5 min', completed: false },
      { id: 'waterCleanse', name: 'Water-Based Cleanser', emoji: '🧼', time: '3 min', completed: false },
      { id: 'exfoliate', name: 'Exfoliate (2-3x/week)', emoji: '🧽', time: '5 min', completed: false },
      { id: 'treatment', name: 'Treatment Serum', emoji: '✨', time: '3 min', completed: false },
      { id: 'eyeCream', name: 'Eye Cream', emoji: '👁️', time: '2 min', completed: false },
      { id: 'moisturize', name: 'Night Moisturizer', emoji: '🌙', time: '3 min', completed: false },
    ]
  });
  const [trackedSteps, setTrackedSteps] = useState({});
  const [history, setHistory] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [determinedSkinType, setDeterminedSkinType] = useState('');

  const tabs = [
    { id: 'analyze', name: 'Skin Analysis', icon: SparklesIcon },
    { id: 'routine', name: 'Daily Routine', icon: SunIcon },
    { id: 'track', name: 'Track Progress', icon: ChartBarIcon },
    { id: 'history', name: 'History', icon: CalendarIcon },
  ];

  const skinTypeQuiz = [
    {
      question: "How does your skin feel after washing?",
      options: [
        { text: "Tight and dry", type: "dry" },
        { text: "Comfortable, not tight", type: "normal" },
        { text: "Already getting oily", type: "oily" },
        { text: "Dry in some areas, oily in others", type: "combination" }
      ]
    },
    {
      question: "How would you describe your pores?",
      options: [
        { text: "Barely visible", type: "dry" },
        { text: "Visible but not large", type: "normal" },
        { text: "Large and visible", type: "oily" },
        { text: "Large on nose/chin, small elsewhere", type: "combination" }
      ]
    },
    {
      question: "How often do you get breakouts?",
      options: [
        { text: "Rarely", type: "dry" },
        { text: "Occasionally, around cycle", type: "normal" },
        { text: "Frequently", type: "oily" },
        { text: "On T-zone mostly", type: "combination" }
      ]
    }
  ];

  const extractFromText = (text, section) => {
    if (!text) return null;
    const match = text.match(new RegExp(`${section}[:\\s]*(.*?)(?=\\n\\n|\\n[A-Z]|$)`, 'i'));
    return match ? match[1].trim() : null;
  };

  const extractList = (text, section) => {
    const sectionText = extractFromText(text, section);
    return sectionText?.split(/\n|•|-|\d+\./).map(s => s.trim()).filter(s => s.length > 0) || null;
  };

  const handleAIAnalysis = async () => {
    if (!skinDescription.trim()) return toast.error('Please describe your skin');
    setLoading(true);
    
    try {
      const { data } = await aiAPI.chat(
        `Analyze skin: ${skinDescription}. Concerns: ${concerns || 'None'}. Return JSON with skinType, concerns[], recommendations[], ingredients[], avoid[], routine{morning[], evening[], weekly[]}`,
        []
      );
      
      const jsonMatch = data?.response?.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        skinType: determinedSkinType || 'Combination',
        concerns: extractList(data.response, 'Concerns') || ['General concerns'],
        recommendations: extractList(data.response, 'Recommendations') || ['Use gentle products', 'Wear SPF'],
        ingredients: extractList(data.response, 'Ingredients') || ['Hyaluronic acid', 'Niacinamide'],
        avoid: extractList(data.response, 'Avoid') || ['Alcohol', 'Fragrance'],
        routine: {
          morning: extractList(data.response, 'Morning') || ['Cleanse', 'Moisturize', 'SPF'],
          evening: extractList(data.response, 'Evening') || ['Double cleanse', 'Treatment', 'Moisturize'],
          weekly: extractList(data.response, 'Weekly') || ['Exfoliate 2-3x', 'Mask']
        }
      };
      
      setSkinAnalysis(analysis);
      toast.success('Analysis complete!');
    } catch {
      setSkinAnalysis({
        skinType: determinedSkinType || "Combination",
        concerns: ["Oiliness", "Dryness"],
        recommendations: ["Gentle cleanser", "Moisturizer", "SPF 50"],
        ingredients: ["Hyaluronic acid", "Niacinamide", "Ceramides"],
        avoid: ["Alcohol", "Fragrance", "Sulfates"],
        routine: {
          morning: ["Cleanse", "Vitamin C", "Moisturize", "SPF"],
          evening: ["Double cleanse", "Treatment", "Night cream"],
          weekly: ["Exfoliate 2x", "Hydrating mask"]
        }
      });
      toast.warning('Using default analysis');
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (timeOfDay, stepId) => {
    setDailyRoutine(prev => {
      const updated = { ...prev };
      const step = updated[timeOfDay].find(s => s.id === stepId);
      if (step) {
        step.completed = !step.completed;
        if (step.completed) {
          const log = { date: new Date().toISOString(), timeOfDay, step: step.name, completed: true };
          setHistory(prev => [log, ...prev].slice(0, 30));
          healthAPI.logHealthData('skincare', log).catch(console.error);
          setTimeout(() => toast.success('Step completed!'), 0);
        }
      }
      return updated;
    });
  };

  const getDailyProgress = () => {
    const total = dailyRoutine.morning.length + dailyRoutine.evening.length;
    const completed = [...dailyRoutine.morning, ...dailyRoutine.evening].filter(s => s.completed).length;
    return Math.round((completed / total) * 100) || 0;
  };

  const handleQuizAnswer = (type) => {
    const answers = [...quizAnswers, type];
    setQuizAnswers(answers);
    
    if (currentQuestion < skinTypeQuiz.length - 1) {
      setCurrentQuestion(c => c + 1);
    } else {
      const counts = answers.reduce((acc, t) => ({ ...acc, [t]: (acc[t] || 0) + 1 }), {});
      const skinType = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      setDeterminedSkinType(skinType);
      setQuizComplete(true);
      const desc = { dry: "tight/flaky", oily: "shiny/breakouts", combination: "oily T-zone/dry cheeks", normal: "balanced" }[skinType];
      setSkinDescription(`My skin is ${desc}. ${concerns}`);
      toast.success(`Your skin type: ${skinType}!`);
    }
  };

  const resetQuiz = () => {
    setQuizAnswers([]);
    setCurrentQuestion(0);
    setQuizComplete(false);
    setDeterminedSkinType('');
  };

  const getSkinTypeDisplay = (type) => ({
    dry: 'Dry Skin', oily: 'Oily Skin', combination: 'Combination Skin', normal: 'Normal Skin'
  })[type] || type;

  const renderStep = (step, timeOfDay) => (
    <div key={step.id} onClick={() => toggleStep(timeOfDay, step.id)}
         className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${step.completed ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'}`}>
      <div className="flex items-center space-x-3">
        <span className="text-xl">{step.emoji}</span>
        <div>
          <p className={`font-medium ${step.completed ? 'line-through text-gray-500' : ''}`}>{step.name}</p>
          <p className="text-xs text-gray-500 flex items-center"><ClockIcon className="w-3 h-3 mr-1" />{step.time}</p>
        </div>
      </div>
      {step.completed ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="flex justify-between items-center">
          <div><h2 className="text-2xl font-bold">AI Skin Care Assistant</h2><p className="opacity-90 mt-1">Personalized analysis & routines</p></div>
          <SparklesIcon className="w-16 h-16 opacity-50" />
        </div>
      </div>

      <div className="flex space-x-2 border-b overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500'}`}>
            <tab.icon className="w-5 h-5" /><span>{tab.name}</span>
          </button>
        ))}
      </div>

      {activeTab === 'analyze' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {!quizComplete ? (
            <div className="card">
              <h3 className="text-lg font-semibold mb-6">Find Your Skin Type</h3>
              <div className="mb-8">
                <div className="flex justify-between text-sm mb-2">
                  <span>Q{currentQuestion + 1}/{skinTypeQuiz.length}</span>
                  <span>{Math.round(((currentQuestion + 1) / skinTypeQuiz.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div className="bg-pink-500 h-2 rounded-full transition-all" style={{ width: `${((currentQuestion + 1) / skinTypeQuiz.length) * 100}%` }} />
                </div>
              </div>
              <p className="text-lg font-medium mb-6">{skinTypeQuiz[currentQuestion].question}</p>
              <div className="space-y-3">
                {skinTypeQuiz[currentQuestion].options.map((opt, i) => (
                  <button key={i} onClick={() => handleQuizAnswer(opt.type)} className="w-full p-4 text-left bg-gray-50 hover:bg-pink-50 rounded-lg">{opt.text}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Your Skin Type: {getSkinTypeDisplay(determinedSkinType)}</h3>
                <button onClick={resetQuiz} className="text-sm text-pink-600">Retake Quiz</button>
              </div>
              <textarea rows="4" className="input-field mb-4" placeholder="Tell us more about your skin concerns..." value={skinDescription} onChange={e => setSkinDescription(e.target.value)} />
              <input type="text" className="input-field mb-4" placeholder="Specific concerns? (acne, aging, dark spots)" value={concerns} onChange={e => setConcerns(e.target.value)} />
              <button onClick={handleAIAnalysis} disabled={loading} className="btn-primary w-full">{loading ? 'Analyzing...' : 'Get AI Analysis'}</button>
            </div>
          )}

          {skinAnalysis && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="card bg-gradient-to-br from-pink-50 to-purple-50">
                <h4 className="font-semibold mb-2">Your Skin Type</h4>
                <p className="text-2xl font-bold text-pink-600">{skinAnalysis.skinType}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: ExclamationTriangleIcon, color: 'yellow', title: 'Concerns', items: skinAnalysis.concerns },
                  { icon: BeakerIcon, color: 'green', title: 'Ingredients', items: skinAnalysis.ingredients }
                ].map(({ icon: Icon, color, title, items }) => (
                  <div key={title} className="card">
                    <h4 className="font-semibold mb-3 flex items-center"><Icon className={`w-5 h-5 text-${color}-500 mr-2`} />{title}</h4>
                    <ul className="list-disc list-inside">{items?.map((item, i) => <li key={i} className="text-gray-700">{item}</li>)}</ul>
                  </div>
                ))}
              </div>

              <div className="card">
                <h4 className="font-semibold mb-3 flex items-center"><CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />Product Recommendations</h4>
                <ul className="list-disc list-inside">{skinAnalysis.recommendations?.map((rec, i) => <li key={i} className="text-gray-700">{rec}</li>)}</ul>
              </div>

              <div className="card">
                <h4 className="font-semibold mb-3">Suggested Routine</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { icon: SunIcon, color: 'yellow', title: 'Morning', items: skinAnalysis.routine?.morning },
                    { icon: MoonIcon, color: 'blue', title: 'Evening', items: skinAnalysis.routine?.evening },
                    { icon: CalendarIcon, color: 'purple', title: 'Weekly', items: skinAnalysis.routine?.weekly }
                  ].map(({ icon: Icon, color, title, items }) => (
                    <div key={title} className={`bg-${color}-50 p-4 rounded-lg`}>
                      <p className={`font-medium text-${color}-800 mb-2 flex items-center`}><Icon className="w-4 h-4 mr-2" />{title}</p>
                      <ul className="list-decimal list-inside text-sm">{items?.map((step, i) => <li key={i} className="text-gray-700">{step}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </div>
              
              <button onClick={() => setActiveTab('routine')} className="btn-primary w-full">Start Routine</button>
            </motion.div>
          )}
        </motion.div>
      )}

      {activeTab === 'routine' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="card">
            <div className="flex justify-between mb-2"><span className="font-medium">Today's Progress</span><span className="text-pink-600 font-bold">{getDailyProgress()}%</span></div>
            <div className="w-full bg-gray-200 h-3 rounded-full"><div className="bg-pink-500 h-3 rounded-full transition-all" style={{ width: `${getDailyProgress()}%` }} /></div>
          </div>

          {[
            { icon: SunIcon, color: 'yellow', title: 'Morning', data: dailyRoutine.morning, time: 'morning' },
            { icon: MoonIcon, color: 'blue', title: 'Evening', data: dailyRoutine.evening, time: 'evening' }
          ].map(({ icon: Icon, color, title, data, time }) => (
            <div key={title} className="card">
              <div className="flex items-center space-x-3 mb-4"><div className={`p-2 bg-${color}-100 rounded-lg`}><Icon className={`w-6 h-6 text-${color}-600`} /></div><h3 className="text-lg font-semibold">{title}</h3></div>
              <div className="space-y-3">{data.map(step => renderStep(step, time))}</div>
            </div>
          ))}

          <div className="card bg-blue-50">
            <h4 className="font-medium text-blue-800 mb-2">💡 Tips for Best Results</h4>
            <ul className="list-disc list-inside text-sm text-blue-700">{['Be consistent', 'Patch test new products', 'Drink water', 'Get sleep', 'Daily SPF'].map(t => <li key={t}>{t}</li>)}</ul>
          </div>
        </motion.div>
      )}

      {activeTab === 'track' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Current Streak', value: history.length > 0 ? 1 : 0, unit: 'day', color: 'pink' },
              { label: 'Total Completed', value: history.length, unit: '', color: 'purple' }
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="card text-center">
                <p className="text-sm text-gray-600">{label}</p>
                <p className={`text-3xl font-bold text-${color}-600`}>{value} {unit}</p>
              </div>
            ))}
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            {!history.length ? <p className="text-gray-500 text-center py-4">No activity yet</p> : 
              history.slice(0,5).map((e,i) => (
                <div key={i} className="flex justify-between p-2 bg-gray-50 rounded mb-2">
                  <div className="flex items-center"><CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" /><span className="text-sm">{e.step}</span></div>
                  <span className="text-xs text-gray-500">{new Date(e.date).toLocaleTimeString()}</span>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <h3 className="text-lg font-semibold mb-4">Routine History</h3>
          {!history.length ? (
            <div className="text-center py-8 text-gray-500"><CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No history yet</p></div>
          ) : (
            Object.entries(history.reduce((acc, e) => {
              const d = new Date(e.date).toLocaleDateString();
              (acc[d] = acc[d] || []).push(e);
              return acc;
            }, {})).map(([date, entries]) => (
              <div key={date} className="border-b pb-4 mb-4 last:border-0">
                <p className="font-medium mb-2">{date}</p>
                {entries.map((e,i) => (
                  <div key={i} className="flex items-center text-sm mb-1">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-gray-600">{e.step}</span>
                    <span className="text-xs text-gray-400 ml-auto">{new Date(e.date).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SkinCareAI;