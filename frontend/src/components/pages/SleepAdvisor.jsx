import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { aiAPI, healthAPI } from '../services/api';
import { MoonIcon, ClockIcon, CheckCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SleepAdvisor = () => {
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState(null);
  const [sleepData, setSleepData] = useState([]);

  useEffect(() => {
    fetchSleepAdvice();
  }, []);

  const fetchSleepAdvice = async () => {
    try {
      const [adviceRes, dataRes] = await Promise.all([
        aiAPI.getSleepAdvice(),
        healthAPI.getHealthData('sleep', null, null, 30)
      ]);
      
      setAdvice(adviceRes.data.advice);
      setSleepData(dataRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load sleep advice');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-gray-900">AI Sleep Advisor</h1>

      {/* Summary Card */}
      <div className="card bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg opacity-90">Sleep Quality Summary</p>
            <p className="text-xl font-semibold mt-1">
              {advice?.summary || 'Start tracking your sleep to get insights'}
            </p>
          </div>
          <MoonIcon className="w-16 h-16 opacity-50" />
        </div>
      </div>

      {/* Ideal Times */}
      {(advice?.idealBedtime || advice?.idealWakeTime) && (
        <div className="grid grid-cols-2 gap-4">
          {advice.idealBedtime && (
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <MoonIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ideal Bedtime</p>
                  <p className="text-xl font-semibold">{advice.idealBedtime}</p>
                </div>
              </div>
            </div>
          )}
          {advice.idealWakeTime && (
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ideal Wake Time</p>
                  <p className="text-xl font-semibold">{advice.idealWakeTime}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patterns */}
      {advice?.patterns && advice.patterns.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Observed Patterns</h3>
          <ul className="space-y-2">
            {advice.patterns.map((pattern, index) => (
              <li key={index} className="flex items-start">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{pattern}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Issues */}
      {advice?.issues && advice.issues.length > 0 && (
        <div className="card bg-yellow-50">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Areas for Improvement</h3>
          <ul className="space-y-2">
            {advice.issues.map((issue, index) => (
              <li key={index} className="flex items-start text-yellow-700">
                <span className="mr-2">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips */}
      {advice?.tips && advice.tips.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Personalized Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advice.tips.map((tip, index) => (
              <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                <LightBulbIcon className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {sleepData.length === 0 && (
        <div className="card bg-gray-50 text-center py-8">
          <MoonIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">No sleep data yet. Start logging your sleep to get personalized advice!</p>
          <button className="btn-primary">Log Sleep</button>
        </div>
      )}
    </motion.div>
  );
};

export default SleepAdvisor;