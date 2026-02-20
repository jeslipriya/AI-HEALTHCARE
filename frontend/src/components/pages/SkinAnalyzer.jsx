import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../services/api';
import { 
  SparklesIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SkinAnalyzer = () => {
  const [description, setDescription] = useState('');
  const [concerns, setConcerns] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    if (!description.trim()) {
      toast.error('Please describe your skin');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await aiAPI.analyzeSkin(description, concerns);
      setAnalysis(response.data.analysis);
    } catch (error) {
      toast.error('Failed to analyze skin description');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-gray-900">AI Skin Analyzer</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="card">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe Your Skin
              </label>
              <textarea
                rows="6"
                className="input-field"
                placeholder="e.g., I have dry patches on my cheeks, occasional acne on my forehead, and some redness around my nose. My skin feels tight after washing..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Concerns (optional)
              </label>
              <textarea
                rows="3"
                className="input-field"
                placeholder="e.g., Worried about aging, acne scars, dark spots..."
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzing || !description.trim()}
              className="btn-primary w-full"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                'Analyze Skin'
              )}
            </button>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="space-y-4">
          {!analysis ? (
            <div className="card h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PencilIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Describe your skin to get AI analysis</p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Skin Type */}
              {analysis.skinType && (
                <div className="card bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                  <p className="text-lg opacity-90">Estimated Skin Type</p>
                  <p className="text-2xl font-bold">{analysis.skinType}</p>
                </div>
              )}

              {/* Observations */}
              {analysis.observations && analysis.observations.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-3">Observations</h3>
                  <ul className="space-y-2">
                    {analysis.observations.map((obs, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Potential Issues */}
              {analysis.potentialIssues && analysis.potentialIssues.length > 0 && (
                <div className="card bg-yellow-50">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                    Potential Concerns
                  </h3>
                  <ul className="space-y-2">
                    {analysis.potentialIssues.map((issue, index) => (
                      <li key={index} className="text-yellow-700">
                        • {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <SparklesIcon className="w-5 h-5 text-primary-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* When to See Dermatologist */}
              {analysis.whenToSeeDermatologist && (
                <div className="card bg-red-50">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    When to See a Dermatologist
                  </h3>
                  <p className="text-red-700">{analysis.whenToSeeDermatologist}</p>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-gray-500 italic">
                {analysis.disclaimer}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SkinAnalyzer;