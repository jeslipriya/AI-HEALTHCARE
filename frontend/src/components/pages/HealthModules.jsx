import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const HealthModules = () => {
  const { user } = useAuth();
  const enabledModules = user?.enabledModules || [];

  const moduleDetails = {
    'womens-health': { icon: '👩', color: 'pink', description: 'Period tracking, fertility, pregnancy care' },
    'mens-health': { icon: '👨', color: 'blue', description: 'Fitness plans, skin care, wellness' },
    'medication': { icon: '💊', color: 'purple', description: 'Reminders, interactions, refill tracking' },
    'sleep': { icon: '😴', color: 'indigo', description: 'Sleep scoring, advice, trends' },
    'fitness': { icon: '💪', color: 'green', description: 'Activity tracking, workouts, goals' },
    'nutrition': { icon: '🥗', color: 'yellow', description: 'Meal planning, diet tracking' },
    'mental-wellness': { icon: '🧠', color: 'teal', description: 'Mood tracking, mindfulness, stress management' },
    'hydration': { icon: '💧', color: 'cyan', description: 'Water intake tracking, reminders' },
    'skin-care': { icon: '✨', color: 'rose', description: 'Skin analysis, product recommendations' }
  };

  const getColorClasses = (color) => {
    const colors = {
      pink: 'bg-pink-100 text-pink-600 border-pink-200',
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      red: 'bg-red-100 text-red-600 border-red-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200',
      indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
      green: 'bg-green-100 text-green-600 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      teal: 'bg-teal-100 text-teal-600 border-teal-200',
      cyan: 'bg-cyan-100 text-cyan-600 border-cyan-200',
      rose: 'bg-rose-100 text-rose-600 border-rose-200'
    };
    return colors[color] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Health Modules</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enabledModules.map((module) => {
          const details = moduleDetails[module] || { 
            icon: '📋', 
            color: 'gray', 
            description: 'Health tracking module' 
          };
          
          return (
            <Link
              key={module}
              to={`/module/${module}`}
              className="card hover:shadow-lg transition-all transform hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-lg ${getColorClasses(details.color)} flex items-center justify-center text-2xl mb-4`}>
                {details.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 capitalize">
                {module.split('-').join(' ')}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {details.description}
              </p>
              <div className="flex items-center text-sm text-primary-600">
                <span>Access Module</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>

      {enabledModules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Complete your profile to enable personalized modules</p>
        </div>
      )}
    </div>
  );
};

export default HealthModules;