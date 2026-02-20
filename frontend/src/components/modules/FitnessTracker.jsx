import React, { useState } from 'react';
import { FireIcon } from '@heroicons/react/24/outline';
import { healthAPI } from '../services/api';
import toast from 'react-hot-toast';

const FitnessTracker = () => {
  const [steps, setSteps] = useState('');
  const [duration, setDuration] = useState('');

  const handleLogActivity = async () => {
    if (!steps) {
      toast.error('Please enter steps');
      return;
    }

    try {
      await healthAPI.logActivity(parseInt(steps), duration ? parseInt(duration) : null, null);
      toast.success('Activity logged!');
      setSteps('');
      setDuration('');
    } catch (error) {
      toast.error('Failed to log activity');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-orange-100 rounded-lg">
            <FireIcon className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Fitness Tracker</h2>
            <p className="text-gray-600">Track your daily activity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Steps
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g., 5000"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g., 30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleLogActivity}
          className="mt-6 btn-primary w-full"
        >
          Log Activity
        </button>
      </div>
    </div>
  );
};

export default FitnessTracker;