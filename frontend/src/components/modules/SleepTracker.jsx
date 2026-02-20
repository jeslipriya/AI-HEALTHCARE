import React, { useState } from 'react';
import { MoonIcon } from '@heroicons/react/24/outline';
import { healthAPI } from '../services/api';
import toast from 'react-hot-toast';

const SleepTracker = () => {
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState('good');

  const handleLogSleep = async () => {
    if (!hours) {
      toast.error('Please enter sleep hours');
      return;
    }

    try {
      await healthAPI.logSleep(parseFloat(hours), quality);
      toast.success('Sleep logged successfully!');
      setHours('');
    } catch (error) {
      toast.error('Failed to log sleep');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-purple-100 rounded-lg">
            <MoonIcon className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Sleep Tracker</h2>
            <p className="text-gray-600">Monitor your sleep patterns</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hours of Sleep
            </label>
            <input
              type="number"
              step="0.5"
              className="input-field"
              placeholder="e.g., 7.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sleep Quality
            </label>
            <select
              className="input-field"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            >
              <option value="poor">Poor</option>
              <option value="fair">Fair</option>
              <option value="good">Good</option>
              <option value="excellent">Excellent</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleLogSleep}
          className="mt-6 btn-primary w-full"
        >
          Log Sleep
        </button>
      </div>
    </div>
  );
};

export default SleepTracker;