import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';

const HealthScoreCard = ({ score, basedOn, trend }) => {
  const getScoreColor = () => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    if (score >= 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowTrendingUpIcon className="w-5 h-5 text-green-300" />;
    if (trend === 'down') return <ArrowTrendingDownIcon className="w-5 h-5 text-red-300" />;
    return <MinusIcon className="w-5 h-5 text-gray-300" />;
  };

  return (
    <div className={`card bg-gradient-to-r ${getScoreColor()} text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <p className="text-lg opacity-90">Your Health Score</p>
            {getTrendIcon()}
          </div>
          <p className="text-4xl font-bold mt-2">{score}</p>
          <p className="text-sm opacity-75 mt-1">{basedOn}</p>
        </div>
        <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <span className="text-3xl">❤️</span>
        </div>
      </div>
    </div>
  );
};

export default HealthScoreCard;