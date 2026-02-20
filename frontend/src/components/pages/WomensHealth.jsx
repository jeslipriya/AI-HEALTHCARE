import React, { useState, useEffect } from 'react';
import { CalendarIcon, HeartIcon, BeakerIcon, ClockIcon, SparklesIcon, ChartBarIcon, ExclamationTriangleIcon, CheckCircleIcon, LightBulbIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { healthAPI, aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const WomensHealth = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [periodData, setPeriodData] = useState({ startDate: '', endDate: '', flow: 'medium', symptoms: [], painLevel: 5, notes: '' });
  const [pregnancyData, setPregnancyData] = useState({ isPregnant: false, week: '', symptoms: [], appointmentDate: '', babyName: '', weightGain: '', bloodPressure: '', glucoseLevel: '' });
  const [cycleHistory, setCycleHistory] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [fertilityWindow, setFertilityWindow] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [healthMetrics, setHealthMetrics] = useState({ bbt: '', cervicalMucus: '', ovulationTests: [], mood: 5 });

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'period', name: 'Period Tracker', icon: CalendarIcon },
    { id: 'fertility', name: 'Fertility & Ovulation', icon: HeartIcon },
    { id: 'pregnancy', name: 'Pregnancy', icon: BeakerIcon },
    { id: 'symptoms', name: 'Symptom Analyzer', icon: SparklesIcon },
    { id: 'insights', name: 'AI Insights', icon: LightBulbIcon },
  ];

  const commonSymptoms = ['Cramps', 'Bloating', 'Headache', 'Fatigue', 'Nausea', 'Breast Tenderness', 'Mood Swings', 'Back Pain', 'Acne', 'Food Cravings', 'Insomnia', 'Dizziness', 'Spotting', 'Clots', 'Constipation', 'Diarrhea'];

  useEffect(() => { loadCycleHistory(); }, []);

  const loadCycleHistory = async () => {
    try {
      const { data } = await healthAPI.getHealthData('period', null, null, 12);
      if (data?.data) {
        const formatted = data.data.map(item => ({
          startDate: item.data?.startDate || item.startDate,
          endDate: item.data?.endDate || item.endDate,
          flow: item.data?.flow || item.flow,
          symptoms: item.data?.symptoms || item.symptoms || [],
          painLevel: item.data?.painLevel || item.painLevel,
          notes: item.data?.notes || item.notes,
          timestamp: item.timestamp
        }));
        setCycleHistory(formatted);
        calculatePredictions(formatted);
      }
    } catch (error) { setCycleHistory([]); }
  };

  const calculatePredictions = async (history) => {
    if (history.length < 2) return;
    try {
      const { data } = await aiAPI.chat(`Based on cycle history, predict next period. Return ONLY valid JSON. History: ${JSON.stringify(history.map(h => ({ start: h.startDate, end: h.endDate, flow: h.flow, symptoms: h.symptoms || [] })))}`, []);
      const jsonMatch = data?.response?.match(/\{[\s\S]*\}/);
      const predictions = jsonMatch ? JSON.parse(jsonMatch[0]) : calculateDefaultPredictions(history);
      setPredictions(predictions);
      if (predictions.fertileWindow) setFertilityWindow(predictions.fertileWindow);
    } catch {
      const defaultPredictions = calculateDefaultPredictions(history);
      setPredictions(defaultPredictions);
      if (defaultPredictions.fertileWindow) setFertilityWindow(defaultPredictions.fertileWindow);
    }
  };

  const calculateDefaultPredictions = (history) => {
    if (!history?.length) return { nextPeriod: 'Not enough data', confidence: 'low', fertileWindow: { start: 'Not enough data', end: 'Not enough data', ovulation: 'Not enough data' }, cycleLength: 'Unknown', irregularities: ['Track more cycles'], recommendations: ['Continue tracking'] };
    
    let total = 0, valid = 0;
    for (let i = 1; i < history.length; i++) {
      const prev = new Date(history[i-1].startDate);
      const curr = new Date(history[i].startDate);
      if (prev && curr) { total += Math.ceil(Math.abs(curr - prev) / 86400000); valid++; }
    }
    const avg = valid > 0 ? Math.round(total / valid) : 28;
    const last = new Date(history[history.length-1].startDate);
    const next = new Date(last); next.setDate(next.getDate() + avg);
    const fertileStart = new Date(next); fertileStart.setDate(next.getDate() - 18);
    const ovulation = new Date(next); ovulation.setDate(next.getDate() - 14);
    const fertileEnd = new Date(ovulation); fertileEnd.setDate(ovulation.getDate() + 1);
    
    return {
      nextPeriod: next.toISOString().split('T')[0],
      confidence: valid > 2 ? 'high' : valid > 0 ? 'medium' : 'low',
      fertileWindow: {
        start: fertileStart.toISOString().split('T')[0],
        end: fertileEnd.toISOString().split('T')[0],
        ovulation: ovulation.toISOString().split('T')[0]
      },
      cycleLength: `${avg} days`,
      irregularities: valid > 3 ? [] : ['Track more cycles'],
      recommendations: ['Continue tracking', 'Stay hydrated', 'Exercise regularly']
    };
  };

  const handleLogPeriod = async () => {
    if (!periodData.startDate) return toast.error('Select start date');
    setLoading(true);
    try {
      await healthAPI.logPeriod(periodData.startDate, periodData.endDate || periodData.startDate, periodData.flow, periodData.symptoms, { painLevel: periodData.painLevel, notes: periodData.notes });
      const next = new Date(periodData.startDate); next.setDate(next.getDate() + 28);
      const newCycle = { ...periodData, nextPredicted: next.toISOString().split('T')[0] };
      setCycleHistory(prev => [...prev, newCycle]);
      toast.success('Period logged!');
      setPeriodData({ startDate: '', endDate: '', flow: 'medium', symptoms: [], painLevel: 5, notes: '' });
      setSelectedSymptoms([]);
      calculatePredictions([...cycleHistory, newCycle]);
    } catch { toast.error('Failed to log'); } finally { setLoading(false); }
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev => prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]);
    setPeriodData(prev => ({ ...prev, symptoms: prev.symptoms.includes(symptom) ? prev.symptoms.filter(s => s !== symptom) : [...prev.symptoms, symptom] }));
  };

  const analyzeSymptoms = async () => {
    if (!selectedSymptoms.length) return toast.error('Select symptoms');
    setLoading(true);
    try {
      const { data } = await aiAPI.analyzeSymptoms(`Symptoms: ${selectedSymptoms.join(', ')}. Cycle day: ${getCycleDay()}`);
      if (data.success) {
        const analysis = data.analysis;
        const formatted = {
          possibleCauses: Array.isArray(analysis.possibleCauses) ? analysis.possibleCauses : [analysis.possibleCauses || 'Unable to determine'],
          severity: analysis.severity || 'medium',
          recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [analysis.recommendations || 'Monitor symptoms'],
          redFlags: Array.isArray(analysis.redFlags) ? analysis.redFlags : [analysis.redFlags || 'Severe pain'],
          whenToSeeDoctor: analysis.whenToSeeDoctor || 'Consult if persists',
          disclaimer: analysis.disclaimer || '⚠️ AI analysis - consult doctor'
        };
        setAiInsights(formatted);
        toast.success('Symptoms analyzed!');
      }
    } catch {
      setAiInsights({
        possibleCauses: ['Common menstrual symptoms', 'Hormonal fluctuations'],
        severity: 'low',
        recommendations: ['Rest', 'Stay hydrated', 'OTC pain relief'],
        redFlags: ['Severe pain', 'High fever'],
        whenToSeeDoctor: 'If severe or persistent',
        disclaimer: '⚠️ Not medical advice'
      });
    } finally { setLoading(false); }
  };

  const getCycleDay = () => {
    if (!cycleHistory.length) return 1;
    const last = new Date(cycleHistory[cycleHistory.length - 1].startDate);
    return Math.ceil((new Date() - last) / 86400000);
  };

  const updateFertilityData = async (type, value) => {
    setHealthMetrics(prev => ({ ...prev, [type]: value }));
    await healthAPI.logHealthData('fertility', { type, value, date: new Date(), cycleDay: getCycleDay() });
    if (type === 'bbt' && parseFloat(value) > 36.5) toast.info('Temp rise - possible ovulation');
  };

  const getFertilityInsights = () => {
    if (!fertilityWindow) return null;
    const today = new Date(), start = new Date(fertilityWindow.start), end = new Date(fertilityWindow.end), ov = new Date(fertilityWindow.ovulation);
    if (today >= start && today <= end) return { status: today.toDateString() === ov.toDateString() ? 'ovulation' : 'fertile', message: today.toDateString() === ov.toDateString() ? '🌸 Ovulation day!' : '✨ In fertile window', color: today.toDateString() === ov.toDateString() ? 'purple' : 'pink' };
    if (today < start) return { status: 'approaching', message: `⏳ Fertile in ${Math.ceil((start - today) / 86400000)} days`, color: 'blue' };
    return { status: 'luteal', message: '🌙 In luteal phase', color: 'gray' };
  };

  const fertilityStatus = getFertilityInsights();

  const renderFertilityCalendar = () => {
    if (!fertilityWindow) return null;
    return (
      <div className="flex space-x-1 mt-4">
        {[...Array(7)].map((_, i) => {
          const date = new Date(); date.setDate(date.getDate() + i);
          const isFertile = date >= new Date(fertilityWindow.start) && date <= new Date(fertilityWindow.end);
          const isOv = date.toDateString() === new Date(fertilityWindow.ovulation).toDateString();
          return (
            <div key={i} className="flex-1 text-center">
              <div className={`p-2 rounded-lg ${isOv ? 'bg-purple-200' : isFertile ? 'bg-pink-200' : 'bg-gray-100'}`}>
                <p className="text-xs font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <p className="text-xs mt-1">{isOv ? '🌕' : isFertile ? '✨' : ''}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Cycle History</h3>
              {!cycleHistory.length ? <p className="text-gray-500 text-center py-4">No data yet. Start tracking!</p> :
                cycleHistory.slice(-6).map((c, i) => (
                  <div key={i} className="flex justify-between p-3 bg-gray-50 rounded-lg mb-2">
                    <div>
                      <p className="font-medium">{new Date(c.startDate).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Flow: {c.flow} • Symptoms: {c.symptoms?.join(', ') || 'None'}</p>
                    </div>
                    <p className="text-sm text-pink-600">Next: {c.nextPredicted}</p>
                  </div>
                ))}
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Common Symptoms</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {commonSymptoms.slice(0,8).map(s => (
                  <div key={s} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'period':
        return (
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Log Period</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="date" className="input-field" value={periodData.startDate} onChange={e => setPeriodData({...periodData, startDate: e.target.value})} />
                <input type="date" className="input-field" value={periodData.endDate} onChange={e => setPeriodData({...periodData, endDate: e.target.value})} />
                <select className="input-field" value={periodData.flow} onChange={e => setPeriodData({...periodData, flow: e.target.value})}>
                  {['light','medium','heavy','very heavy'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="flex items-center space-x-4">
                  <input type="range" min="1" max="10" className="flex-1" value={periodData.painLevel} onChange={e => setPeriodData({...periodData, painLevel: parseInt(e.target.value)})} />
                  <span className="text-lg font-semibold text-pink-600">{periodData.painLevel}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {commonSymptoms.map(s => (
                  <button key={s} onClick={() => toggleSymptom(s)} className={`p-2 rounded-lg text-sm ${selectedSymptoms.includes(s) ? 'bg-pink-100 text-pink-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <textarea className="input-field mt-4" rows="3" placeholder="Notes..." value={periodData.notes} onChange={e => setPeriodData({...periodData, notes: e.target.value})} />
              <button onClick={handleLogPeriod} disabled={loading} className="btn-primary w-full mt-4">{loading ? 'Logging...' : 'Log Period'}</button>
            </div>
          </div>
        );

      case 'fertility':
        return (
          <div className="space-y-4">
            <div className="card bg-gradient-to-br from-pink-50 to-purple-50">
              <h3 className="text-lg font-semibold mb-4">Fertile Window</h3>
              {fertilityWindow ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    {['Window Start', 'Ovulation', 'Window End'].map((label, i) => (
                      <div key={label} className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600">{label}</p>
                        <p className={`text-lg font-bold text-${i===1?'purple':'pink'}-600`}>
                          {new Date([fertilityWindow.start, fertilityWindow.ovulation, fertilityWindow.end][i]).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  {renderFertilityCalendar()}
                </>
              ) : <p className="text-gray-600">{cycleHistory.length<2 ? 'Track 2+ cycles' : 'Calculating...'}</p>}
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Track Fertility</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">BBT (°C)</label>
                  <div className="flex items-center space-x-4">
                    <input type="number" step="0.01" className="input-field flex-1" value={healthMetrics.bbt} onChange={e => updateFertilityData('bbt', e.target.value)} />
                    {healthMetrics.bbt > 36.5 && <span className="text-sm text-green-600">⬆️ Rise</span>}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Cervical Mucus</label>
                  <select className="input-field" value={healthMetrics.cervicalMucus} onChange={e => updateFertilityData('cervicalMucus', e.target.value)}>
                    {['','dry','sticky','creamy','watery','eggwhite'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Mood</label>
                  <div className="flex items-center space-x-4">
                    <input type="range" min="1" max="10" className="flex-1" value={healthMetrics.mood} onChange={e => setHealthMetrics({...healthMetrics, mood: parseInt(e.target.value)})} />
                    <SunIcon className={`w-5 h-5 ${healthMetrics.mood>6 ? 'text-yellow-500' : 'text-gray-400'}`} />
                    <span>{healthMetrics.mood}/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pregnancy':
        return (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Pregnancy</h3>
              <label className="flex items-center space-x-2">
                <span className="text-sm">I'm pregnant</span>
                <input type="checkbox" className="toggle" checked={pregnancyData.isPregnant} onChange={e => setPregnancyData({...pregnancyData, isPregnant: e.target.checked})} />
              </label>
            </div>
            {pregnancyData.isPregnant && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="number" placeholder="Week" className="input-field" value={pregnancyData.week} onChange={e => setPregnancyData({...pregnancyData, week: e.target.value})} />
                  <input type="date" placeholder="Next appt" className="input-field" value={pregnancyData.appointmentDate} onChange={e => setPregnancyData({...pregnancyData, appointmentDate: e.target.value})} />
                  <input type="number" step="0.1" placeholder="Weight gain" className="input-field" value={pregnancyData.weightGain} onChange={e => setPregnancyData({...pregnancyData, weightGain: e.target.value})} />
                  <input type="text" placeholder="BP" className="input-field" value={pregnancyData.bloodPressure} onChange={e => setPregnancyData({...pregnancyData, bloodPressure: e.target.value})} />
                </div>
                <textarea rows="3" placeholder="Symptoms/notes..." className="input-field mt-4" value={pregnancyData.symptoms} onChange={e => setPregnancyData({...pregnancyData, symptoms: e.target.value})} />
                <button onClick={handlePregnancyUpdate} className="btn-primary w-full mt-4">Update</button>
                {pregnancyData.week && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      {parseInt(pregnancyData.week) < 12 ? '1st trimester: Folic acid, rest, hydration' :
                       parseInt(pregnancyData.week) < 27 ? '2nd trimester: Stay active' :
                       '3rd trimester: Prepare for baby, rest'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'symptoms':
        return (
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Symptom Analyzer</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {commonSymptoms.map(s => (
                  <button key={s} onClick={() => toggleSymptom(s)} className={`p-3 rounded-lg text-center ${selectedSymptoms.includes(s) ? 'bg-pink-500 text-white' : 'bg-gray-50 hover:bg-pink-50'}`}>
                    <span className="text-sm">{s}</span>
                  </button>
                ))}
              </div>
              <button onClick={analyzeSymptoms} disabled={loading || !selectedSymptoms.length} className="btn-primary w-full">
                {loading ? 'Analyzing...' : 'Analyze Symptoms'}
              </button>
            </div>
            {aiInsights && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card bg-gradient-to-br from-purple-50 to-pink-50">
                <h3 className="text-lg font-semibold mb-4 flex items-center"><SparklesIcon className="w-5 h-5 text-purple-600 mr-2" />AI Analysis</h3>
                <div className="space-y-3">
                  {aiInsights.severity && <div className={`px-3 py-1 rounded-full text-sm font-medium inline-block bg-${aiInsights.severity==='high'?'red':aiInsights.severity==='medium'?'yellow':'green'}-100 text-${aiInsights.severity==='high'?'red':aiInsights.severity==='medium'?'yellow':'green'}-700`}>{aiInsights.severity}</div>}
                  {['possibleCauses','recommendations'].map(section => aiInsights[section]?.length > 0 && (
                    <div key={section}>
                      <h4 className="font-medium mb-1">{section === 'possibleCauses' ? 'Possible Causes' : 'Recommendations'}</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700">{aiInsights[section].map((item,i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                  ))}
                  {aiInsights.redFlags?.length > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-1">🚨 Red Flags</h4>
                      <ul className="list-disc list-inside text-sm text-red-700">{aiInsights.redFlags.map((f,i) => <li key={i}>{f}</li>)}</ul>
                    </div>
                  )}
                  {aiInsights.whenToSeeDoctor && <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">{aiInsights.whenToSeeDoctor}</div>}
                  <p className="text-xs text-gray-500 italic">{aiInsights.disclaimer}</p>
                </div>
              </motion.div>
            )}
          </div>
        );

      case 'insights':
        return (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
            {aiInsights ? (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <ul className="list-disc list-inside text-sm text-purple-700">{aiInsights.recommendations?.map((r,i) => <li key={i}>{r}</li>)}</ul>
                </div>
                <button onClick={async () => {
                  const { data } = await aiAPI.chat(`Give health recommendations based on: ${JSON.stringify(cycleHistory)}`, []);
                  setAiInsights({ recommendations: [data.response], disclaimer: 'AI-generated' });
                }} className="btn-secondary w-full">Get More</button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Track cycles to get AI insights</p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div><h2 className="text-2xl font-bold">Women's Health AI</h2><p className="opacity-90 mt-1">Intelligent tracking with insights</p></div>
          <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full"><SparklesIcon className="w-5 h-5" /><span className="text-sm">AI-Powered</span></div>
        </div>
      </div>

      {cycleHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Cycle Day', value: getCycleDay(), color: 'pink' },
            { label: 'Next Period', value: predictions?.nextPeriod || '—', color: 'purple' },
            { label: 'Cycle Length', value: predictions?.cycleLength || '28', color: 'blue' },
            { label: 'Confidence', value: predictions?.confidence || 'medium', color: 'green' }
          ].map(({ label, value, color }) => (
            <div key={label} className={`card bg-gradient-to-br from-${color}-50 to-${color}-100`}>
              <p className={`text-sm text-${color}-600`}>{label}</p>
              <p className={`text-2xl font-bold text-${color}-700 capitalize`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {fertilityStatus && (
        <div className={`card bg-${fertilityStatus.color}-50 border-${fertilityStatus.color}-200`}>
          <div className="flex items-center space-x-3">
            {fertilityStatus.status === 'ovulation' && <HeartIcon className={`w-6 h-6 text-${fertilityStatus.color}-600`} />}
            {fertilityStatus.status === 'fertile' && <SparklesIcon className={`w-6 h-6 text-${fertilityStatus.color}-600`} />}
            {fertilityStatus.status === 'approaching' && <ClockIcon className={`w-6 h-6 text-${fertilityStatus.color}-600`} />}
            {fertilityStatus.status === 'luteal' && <MoonIcon className={`w-6 h-6 text-${fertilityStatus.color}-600`} />}
            <span className={`font-medium text-${fertilityStatus.color}-800`}>{fertilityStatus.message}</span>
          </div>
        </div>
      )}

      <div className="flex space-x-2 border-b overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 px-4 py-2 border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="w-5 h-5" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        {renderTabContent()}
      </motion.div>
    </div>
  );
};

export default WomensHealth;