import React from 'react';
import { LightBulbIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const InsightCard = ({ insight }) => {
  const getIcon = (type) => {
    switch(type) {
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'positive':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      default:
        return <LightBulbIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type) => {
    switch(type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'positive':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getBgColor(insight?.type)}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon(insight?.type)}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">
            {insight?.title || 'Health Insight'}
          </h4>
          <p className="text-sm text-gray-600">
            {insight?.description || 'Based on your recent activity, you\'re doing great! Keep up the healthy habits.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;