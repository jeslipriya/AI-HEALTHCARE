import React, { useState } from 'react';
import { BeakerIcon, PlusIcon } from '@heroicons/react/24/outline';
import { healthAPI } from '../services/api';
import toast from 'react-hot-toast';

const HydrationTracker = () => {
  const [glasses, setGlasses] = useState(0);
  const [goal] = useState(8);

  const handleAddGlass = async () => {
    try {
      await healthAPI.logHydration(glasses + 1);
      setGlasses(prev => prev + 1);
      toast.success('Water intake logged!');
    } catch (error) {
      toast.error('Failed to log water intake');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BeakerIcon className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Hydration Tracker</h2>
              <p className="text-gray-600">Track your daily water intake</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
            <p className="text-blue-600 mb-2">Today's Intake</p>
            <p className="text-4xl font-bold text-blue-700">{glasses} / {goal} glasses</p>
            <div className="w-full bg-blue-200 h-4 rounded-full mt-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${(glasses / goal) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="font-semibold mb-4">Quick Log</h3>
            <button
              onClick={handleAddGlass}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Glass of Water
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HydrationTracker;