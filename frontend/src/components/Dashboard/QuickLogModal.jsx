import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon, 
  HeartIcon, 
  MoonIcon, 
  FireIcon,
  BeakerIcon,
  FaceSmileIcon,
  ScaleIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const QuickLogModal = ({ isOpen, onClose, onLog, userGender }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});

  const logTypes = [
    { id: 'activity', name: 'Activity', icon: FireIcon, color: 'orange', fields: ['steps', 'duration', 'calories'] },
    { id: 'sleep', name: 'Sleep', icon: MoonIcon, color: 'purple', fields: ['hours', 'quality'] },
    { id: 'hydration', name: 'Water', icon: BeakerIcon, color: 'blue', fields: ['glasses'] },
    { id: 'mood', name: 'Mood', icon: FaceSmileIcon, color: 'yellow', fields: ['mood', 'notes'] },
    { id: 'weight', name: 'Weight', icon: ScaleIcon, color: 'green', fields: ['weight'] },
    { id: 'blood-pressure', name: 'Blood Pressure', icon: HeartIcon, color: 'red', fields: ['systolic', 'diastolic'] },
  ];

  // Add gender-specific log types with valid icons
  if (userGender === 'female') {
    logTypes.push(
      { id: 'period', name: 'Period', icon: ClockIcon, color: 'pink', fields: ['flow', 'symptoms', 'cramps'] },
      { id: 'pregnancy', name: 'Pregnancy', icon: HeartIcon, color: 'purple', fields: ['symptom', 'severity', 'week'] }
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onLog(selectedType, formData);
    setSelectedType(null);
    setFormData({});
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getColorClasses = (color) => {
    const colors = {
      orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
      purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
      blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
      yellow: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
      green: 'bg-green-100 text-green-600 hover:bg-green-200',
      red: 'bg-red-100 text-red-600 hover:bg-red-200',
      pink: 'bg-pink-100 text-pink-600 hover:bg-pink-200',
    };
    return colors[color] || 'bg-gray-100 text-gray-600 hover:bg-gray-200';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-semibold">
                    {selectedType ? `Log ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}` : 'Quick Log'}
                  </Dialog.Title>
                  <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {!selectedType ? (
                  <div className="grid grid-cols-2 gap-3">
                    {logTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 rounded-lg flex flex-col items-center space-y-2 transition-colors ${getColorClasses(type.color)}`}
                      >
                        <type.icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{type.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {selectedType === 'activity' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Steps
                          </label>
                          <input
                            type="number"
                            className="input-field"
                            value={formData.steps || ''}
                            onChange={(e) => handleChange('steps', parseInt(e.target.value))}
                            placeholder="e.g., 5000"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            className="input-field"
                            value={formData.duration || ''}
                            onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                            placeholder="e.g., 30"
                          />
                        </div>
                      </>
                    )}

                    {selectedType === 'sleep' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hours
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            className="input-field"
                            value={formData.hours || ''}
                            onChange={(e) => handleChange('hours', parseFloat(e.target.value))}
                            placeholder="e.g., 7.5"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quality
                          </label>
                          <select
                            className="input-field"
                            value={formData.quality || ''}
                            onChange={(e) => handleChange('quality', e.target.value)}
                            required
                          >
                            <option value="">Select quality</option>
                            <option value="poor">Poor</option>
                            <option value="fair">Fair</option>
                            <option value="good">Good</option>
                            <option value="excellent">Excellent</option>
                          </select>
                        </div>
                      </>
                    )}

                    {selectedType === 'hydration' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Glasses of Water
                        </label>
                        <input
                          type="number"
                          className="input-field"
                          value={formData.glasses || ''}
                          onChange={(e) => handleChange('glasses', parseInt(e.target.value))}
                          placeholder="e.g., 8"
                          required
                        />
                      </div>
                    )}

                    {selectedType === 'mood' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mood (1-10)
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            className="w-full"
                            value={formData.mood || 5}
                            onChange={(e) => handleChange('mood', parseInt(e.target.value))}
                          />
                          <div className="text-center mt-2">
                            <span className="text-lg font-semibold text-primary-600">
                              {formData.mood || 5}/10
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (optional)
                          </label>
                          <textarea
                            className="input-field"
                            value={formData.notes || ''}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="How are you feeling?"
                            rows="2"
                          />
                        </div>
                      </>
                    )}

                    {selectedType === 'blood-pressure' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Systolic (top number)
                          </label>
                          <input
                            type="number"
                            className="input-field"
                            value={formData.systolic || ''}
                            onChange={(e) => handleChange('systolic', parseInt(e.target.value))}
                            placeholder="e.g., 120"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Diastolic (bottom number)
                          </label>
                          <input
                            type="number"
                            className="input-field"
                            value={formData.diastolic || ''}
                            onChange={(e) => handleChange('diastolic', parseInt(e.target.value))}
                            placeholder="e.g., 80"
                            required
                          />
                        </div>
                      </>
                    )}

                    {selectedType === 'period' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Flow
                          </label>
                          <select
                            className="input-field"
                            value={formData.flow || ''}
                            onChange={(e) => handleChange('flow', e.target.value)}
                            required
                          >
                            <option value="">Select flow</option>
                            <option value="light">Light</option>
                            <option value="medium">Medium</option>
                            <option value="heavy">Heavy</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Symptoms (comma separated)
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            value={formData.symptoms || ''}
                            onChange={(e) => handleChange('symptoms', e.target.value)}
                            placeholder="e.g., cramps, bloating"
                          />
                        </div>
                      </>
                    )}

                    {selectedType === 'pregnancy' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Week
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="42"
                            className="input-field"
                            value={formData.week || ''}
                            onChange={(e) => handleChange('week', parseInt(e.target.value))}
                            placeholder="e.g., 20"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Symptom
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            value={formData.symptom || ''}
                            onChange={(e) => handleChange('symptom', e.target.value)}
                            placeholder="e.g., nausea, fatigue"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Severity
                          </label>
                          <select
                            className="input-field"
                            value={formData.severity || ''}
                            onChange={(e) => handleChange('severity', e.target.value)}
                            required
                          >
                            <option value="">Select severity</option>
                            <option value="mild">Mild</option>
                            <option value="moderate">Moderate</option>
                            <option value="severe">Severe</option>
                          </select>
                        </div>
                      </>
                    )}

                    {selectedType === 'weight' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="input-field"
                          value={formData.weight || ''}
                          onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
                          placeholder="e.g., 70.5"
                          required
                        />
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="btn-primary flex-1"
                      >
                        Save Log
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedType(null)}
                        className="btn-secondary flex-1"
                      >
                        Back
                      </button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default QuickLogModal;