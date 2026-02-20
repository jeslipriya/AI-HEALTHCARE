import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

const SkinCare = () => {
  const [routine, setRoutine] = useState({
    cleansed: false,
    moisturized: false,
    sunscreen: false
  });

  const handleToggle = (item) => {
    setRoutine(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-pink-100 rounded-lg">
            <SparklesIcon className="w-8 h-8 text-pink-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Skincare Tracker</h2>
            <p className="text-gray-600">Track your daily skincare routine</p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(routine).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="capitalize font-medium">{key}</span>
              <button
                onClick={() => handleToggle(key)}
                className={`px-4 py-2 rounded-lg ${
                  value 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {value ? 'Done ✓' : 'Not Done'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkinCare;