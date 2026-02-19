import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

const AIInsightBanner = ({ message, icon: Icon = SparklesIcon }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-4 shadow-lg"
    >
      <div className="flex items-start pr-8">
        <Icon className="w-6 h-6 mr-3 flex-shrink-0 mt-1" />
        <p className="text-sm md:text-base">{message}</p>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </motion.div>
  );
};

export default AIInsightBanner;