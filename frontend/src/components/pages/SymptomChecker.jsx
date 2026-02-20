import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../services/api';
import { 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SymptomChecker = () => {
  const [symptoms, setSymptoms] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      toast.error('Please describe your symptoms');
      return;
    }

    setAnalyzing(true);
    try {
      console.log('Analyzing symptoms:', symptoms);
      
      const response = await aiAPI.analyzeSymptoms(symptoms);
      console.log('API Response:', response.data);
      
      if (response.data.success && response.data.analysis) {
        setAnalysis(response.data.analysis);
        toast.success('Analysis complete!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Symptom analysis error:', error);
      console.error('Error response:', error.response?.data);
      
      // Use fallback analysis
      setAnalysis({
        possibleCauses: ["Common cold", "Seasonal allergies", "Viral infection"],
        severity: "low",
        recommendations: ["Rest and stay hydrated", "Monitor symptoms", "Take over-the-counter medication if needed"],
        redFlags: ["Difficulty breathing", "High fever over 103°F", "Severe pain"],
        whenToSeeDoctor: "If symptoms persist for more than 3 days or worsen",
        disclaimer: "⚠️ This is an automated response. Please consult a healthcare provider for medical advice."
      });
      
      toast.warning('Using default analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-gray-900">AI Symptom Checker</h1>
      
      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your symptoms
          </label>
          <textarea
            rows="4"
            className="input-field"
            placeholder="e.g., I have a headache, fever of 101°F, and feel nauseous..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="btn-primary w-full flex items-center justify-center"
        >
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Analyzing...
            </>
          ) : (
            'Analyze Symptoms'
          )}
        </button>

        {analysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 space-y-4"
          >
            {/* Severity Badge */}
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getSeverityColor(analysis.severity)}`}>
              Severity: {analysis.severity?.toUpperCase() || 'Not determined'}
            </div>

            {/* Possible Causes */}
            {analysis.possibleCauses && analysis.possibleCauses.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 flex items-center mb-2">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                  Possible Causes
                </h3>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  {analysis.possibleCauses.map((cause, index) => (
                    <li key={index}>{cause}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 flex items-center mb-2">
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Recommendations
                </h3>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Red Flags */}
            {analysis.redFlags && analysis.redFlags.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 flex items-center mb-2">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                  Seek Immediate Medical Attention If
                </h3>
                <ul className="list-disc list-inside space-y-1 text-red-700">
                  {analysis.redFlags.map((flag, index) => (
                    <li key={index}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* When to See Doctor */}
            {analysis.whenToSeeDoctor && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 flex items-center mb-2">
                  <LightBulbIcon className="w-5 h-5 mr-2" />
                  When to See a Doctor
                </h3>
                <p className="text-purple-700">{analysis.whenToSeeDoctor}</p>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-gray-500 italic mt-4">
              {analysis.disclaimer}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default SymptomChecker;