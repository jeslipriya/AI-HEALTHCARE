import React, { useState } from 'react';
import { PillIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { healthAPI } from '../services/api';
import toast from 'react-hot-toast';

const MedicationManager = () => {
  const [medications, setMedications] = useState([
    {
      id: 1,
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      time: ['08:00', '20:00'],
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      taken: [false, false],
      refillDate: '2024-03-15',
      stock: 30
    },
    {
      id: 2,
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      time: ['08:00'],
      startDate: '2024-01-15',
      endDate: '2024-12-31',
      taken: [false],
      refillDate: '2024-03-01',
      stock: 15
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    time: ['08:00'],
    startDate: '',
    endDate: '',
    stock: ''
  });

  const handleTakeMedication = (medId, timeIndex) => {
    setMedications(prev => prev.map(med => {
      if (med.id === medId) {
        const newTaken = [...med.taken];
        newTaken[timeIndex] = !newTaken[timeIndex];
        
        // Log to health data
        healthAPI.logHealthData('medication', {
          medication: med.name,
          dosage: med.dosage,
          taken: newTaken[timeIndex],
          time: med.time[timeIndex]
        }).catch(err => console.error('Failed to log medication:', err));
        
        return { ...med, taken: newTaken };
      }
      return med;
    }));
    
    toast.success('Medication status updated');
  };

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.startDate) {
      toast.error('Please fill required fields');
      return;
    }

    const medication = {
      id: medications.length + 1,
      ...newMedication,
      taken: new Array(newMedication.time.length).fill(false),
      refillDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      stock: parseInt(newMedication.stock) || 30
    };

    setMedications([...medications, medication]);
    setShowAddForm(false);
    setNewMedication({
      name: '',
      dosage: '',
      frequency: 'Once daily',
      time: ['08:00'],
      startDate: '',
      endDate: '',
      stock: ''
    });
    
    toast.success('Medication added');
  };

  const getAdherenceScore = () => {
    const total = medications.reduce((sum, med) => sum + med.taken.length, 0);
    const taken = medications.reduce((sum, med) => 
      sum + med.taken.filter(t => t).length, 0
    );
    return Math.round((taken / total) * 100) || 0;
  };

  const getRefillAlert = (med) => {
    const today = new Date();
    const refillDate = new Date(med.refillDate);
    const daysUntilRefill = Math.ceil((refillDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilRefill <= 3) return 'danger';
    if (daysUntilRefill <= 7) return 'warning';
    return 'ok';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-green-500 to-teal-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Medication Manager</h2>
            <p className="opacity-90 mt-1">Track and manage your medications</p>
          </div>
          <PillIcon className="w-16 h-16 opacity-50" />
        </div>
      </div>

      {/* Adherence Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-green-600">Adherence Score</p>
          <p className="text-3xl font-bold text-green-700">{getAdherenceScore()}%</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-blue-600">Active Medications</p>
          <p className="text-3xl font-bold text-blue-700">{medications.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-sm text-yellow-600">Refills Needed</p>
          <p className="text-3xl font-bold text-yellow-700">
            {medications.filter(m => getRefillAlert(m) === 'danger').length}
          </p>
        </div>
      </div>

      {/* Add Medication Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="btn-primary w-full"
      >
        {showAddForm ? 'Cancel' : '+ Add Medication'}
      </button>

      {/* Add Medication Form */}
      {showAddForm && (
        <div className="card border-2 border-primary-200">
          <h3 className="text-lg font-semibold mb-4">Add New Medication</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medication Name *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Metformin"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosage *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., 500mg"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  className="input-field"
                  value={newMedication.frequency}
                  onChange={(e) => {
                    const times = e.target.value === 'Once daily' ? ['08:00'] : ['08:00', '20:00'];
                    setNewMedication({...newMedication, frequency: e.target.value, time: times});
                  }}
                >
                  <option>Once daily</option>
                  <option>Twice daily</option>
                  <option>Three times daily</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time(s)
                </label>
                <div className="space-y-2">
                  {newMedication.time.map((time, idx) => (
                    <input
                      key={idx}
                      type="time"
                      className="input-field"
                      value={time}
                      onChange={(e) => {
                        const newTimes = [...newMedication.time];
                        newTimes[idx] = e.target.value;
                        setNewMedication({...newMedication, time: newTimes});
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={newMedication.startDate}
                  onChange={(e) => setNewMedication({...newMedication, startDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={newMedication.endDate}
                  onChange={(e) => setNewMedication({...newMedication, endDate: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Stock (pills)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g., 30"
                value={newMedication.stock}
                onChange={(e) => setNewMedication({...newMedication, stock: e.target.value})}
              />
            </div>

            <button
              onClick={handleAddMedication}
              className="btn-primary w-full"
            >
              Save Medication
            </button>
          </div>
        </div>
      )}

      {/* Medication List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Today's Medications</h3>
        
        {medications.map((med) => (
          <div key={med.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg">{med.name}</h4>
                <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Stock: {med.stock} pills</p>
                <p className={`text-xs flex items-center ${
                  getRefillAlert(med) === 'danger' ? 'text-red-600' :
                  getRefillAlert(med) === 'warning' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                  Refill by: {med.refillDate}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {med.time.map((time, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">{time}</span>
                  </div>
                  <button
                    onClick={() => handleTakeMedication(med.id, idx)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      med.taken[idx]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>{med.taken[idx] ? 'Taken' : 'Mark as taken'}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Today's Progress</span>
                <span>{med.taken.filter(t => t).length}/{med.taken.length} doses</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(med.taken.filter(t => t).length / med.taken.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips Section */}
      <div className="card bg-blue-50">
        <h4 className="font-medium text-blue-800 mb-2">💊 Medication Tips</h4>
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
          <li>Set daily reminders for each medication</li>
          <li>Keep medications in their original containers</li>
          <li>Check expiration dates regularly</li>
          <li>Use a pill organizer for weekly doses</li>
          <li>Never share prescription medications</li>
        </ul>
      </div>
    </div>
  );
};

export default MedicationManager;