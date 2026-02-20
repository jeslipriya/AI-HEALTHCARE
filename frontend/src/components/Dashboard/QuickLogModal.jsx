import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon, HeartIcon, MoonIcon, FireIcon, BeakerIcon,
  FaceSmileIcon, ScaleIcon, ClockIcon
} from '@heroicons/react/24/outline';

const QuickLogModal = ({ isOpen, onClose, onLog, userGender }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});

  // Consolidated log types configuration
  const logTypes = [
    { id: 'activity', name: 'Activity', icon: FireIcon, color: 'orange', fields: ['steps', 'duration'] },
    { id: 'sleep', name: 'Sleep', icon: MoonIcon, color: 'purple', fields: ['hours', 'quality'] },
    { id: 'hydration', name: 'Water', icon: BeakerIcon, color: 'blue', fields: ['glasses'] },
    { id: 'mood', name: 'Mood', icon: FaceSmileIcon, color: 'yellow', fields: ['mood', 'notes'] },
    { id: 'weight', name: 'Weight', icon: ScaleIcon, color: 'green', fields: ['weight'] },
    { id: 'blood-pressure', name: 'BP', icon: HeartIcon, color: 'red', fields: ['systolic', 'diastolic'] },
    ...(userGender === 'female' ? [
      { id: 'period', name: 'Period', icon: ClockIcon, color: 'pink', fields: ['flow', 'symptoms'] },
      { id: 'pregnancy', name: 'Pregnancy', icon: HeartIcon, color: 'purple', fields: ['week', 'symptom', 'severity'] }
    ] : [])
  ];

  // Dynamic field renderer
  const renderFields = () => {
    const type = logTypes.find(t => t.id === selectedType);
    if (!type) return null;

    return type.fields.map(field => {
      const commonProps = {
        key: field,
        className: "input-field",
        value: formData[field] || '',
        onChange: (e) => setFormData({ ...formData, [field]: e.target.value })
      };

      if (field === 'quality' || field === 'flow' || field === 'severity') {
        const options = {
          quality: ['poor', 'fair', 'good', 'excellent'],
          flow: ['light', 'medium', 'heavy'],
          severity: ['mild', 'moderate', 'severe']
        }[field] || [];

        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
            <select {...commonProps} required>
              <option value="">Select {field}</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        );
      }

      if (field === 'mood') {
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mood (1-10)</label>
            <input type="range" min="1" max="10" {...commonProps} />
            <p className="text-center mt-2 font-semibold text-primary-600">{formData.mood || 5}/10</p>
          </div>
        );
      }

      if (field === 'notes' || field === 'symptoms') {
        return (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
            <textarea rows="2" className="input-field" {...commonProps} />
          </div>
        );
      }

      return (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
          <input 
            type={field.includes('systolic') || field.includes('diastolic') || field === 'steps' || field === 'duration' || field === 'hours' || field === 'glasses' || field === 'week' ? 'number' : 'text'}
            step={field === 'hours' ? '0.5' : field === 'weight' ? '0.1' : '1'}
            {...commonProps}
            required={!['notes', 'symptoms', 'duration', 'calories'].includes(field)}
          />
        </div>
      );
    });
  };

  const colorMap = {
    orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
    purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
    blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    yellow: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
    green: 'bg-green-100 text-green-600 hover:bg-green-200',
    red: 'bg-red-100 text-red-600 hover:bg-red-200',
    pink: 'bg-pink-100 text-pink-600 hover:bg-pink-200',
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
              <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-semibold">
                    {selectedType ? `Log ${selectedType}` : 'Quick Log'}
                  </Dialog.Title>
                  <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {!selectedType ? (
                  <div className="grid grid-cols-2 gap-3">
                    {logTypes.map(({ id, name, icon: Icon, color }) => (
                      <button
                        key={id}
                        onClick={() => setSelectedType(id)}
                        className={`p-4 rounded-lg flex flex-col items-center space-y-2 transition-colors ${colorMap[color]}`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); onLog(selectedType, formData); setSelectedType(null); setFormData({}); }}>
                    <div className="space-y-4">{renderFields()}</div>
                    <div className="flex space-x-3 pt-4">
                      <button type="submit" className="btn-primary flex-1">Save</button>
                      <button type="button" onClick={() => setSelectedType(null)} className="btn-secondary flex-1">Back</button>
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