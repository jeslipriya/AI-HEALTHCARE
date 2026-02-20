import React, { useState } from 'react';
import { FaceSmileIcon } from '@heroicons/react/24/outline';
import { healthAPI } from '../services/api';
import toast from 'react-hot-toast';

const MentalWellness = () => {
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState('');

  const handleLogMood = async () => {
    try {
      await healthAPI.logMood(mood, notes);
      toast.success('Mood logged!');
      setNotes('');
    } catch (error) {
      toast.error('Failed to log mood');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <FaceSmileIcon className="w-8 h-8 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Mental Wellness</h2>
            <p className="text-gray-600">Track your mood and mental health</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How are you feeling? ({mood}/10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              className="w-full"
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              rows="4"
              className="input-field"
              placeholder="How was your day? Any stressors?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            onClick={handleLogMood}
            className="btn-primary w-full"
          >
            Log Mood
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentalWellness;