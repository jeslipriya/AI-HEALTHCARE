import React, { useState } from 'react';
import { DocumentArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const ReportAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleAnalyze = () => {
    if (!file) return;
    
    setAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      setResults({
        summary: "Your blood work shows normal ranges for most markers. Slightly elevated cholesterol levels detected.",
        keyFindings: [
          "HDL Cholesterol: 45 mg/dL (Optimal: >40 mg/dL)",
          "LDL Cholesterol: 130 mg/dL (Optimal: <100 mg/dL)",
          "Triglycerides: 150 mg/dL (Optimal: <150 mg/dL)",
          "Blood Glucose: 95 mg/dL (Normal: 70-99 mg/dL)"
        ],
        recommendations: [
          "Consider reducing saturated fat intake",
          "Increase physical activity to 30 minutes daily",
          "Schedule follow-up in 3 months",
          "Monitor blood pressure weekly"
        ],
        disclaimer: "This analysis is AI-generated and should be reviewed by a healthcare professional."
      });
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Medical Report Analyzer</h1>
      
      <div className="card">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <DocumentArrowUpIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Upload your medical report</p>
          <p className="text-sm text-gray-500 mb-4">PDF, JPG, PNG up to 10MB</p>
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <label
            htmlFor="file-upload"
            className="btn-primary cursor-pointer inline-block"
          >
            Choose File
          </label>
          {file && (
            <p className="mt-4 text-sm text-gray-600">
              Selected: {file.name}
            </p>
          )}
        </div>

        {file && !analyzing && !results && (
          <div className="mt-6 text-center">
            <button
              onClick={handleAnalyze}
              className="btn-primary"
            >
              Analyze Report
            </button>
          </div>
        )}

        {analyzing && (
          <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">AI is analyzing your report...</p>
          </div>
        )}

        {results && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Analysis Results</h3>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800">{results.summary}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Key Findings</h4>
              <ul className="space-y-2">
                {results.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {results.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-gray-500 mt-4">{results.disclaimer}</p>

            <div className="flex space-x-3 mt-4">
              <button className="btn-primary">Save Report</button>
              <button className="btn-secondary">Download PDF</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportAnalyzer;