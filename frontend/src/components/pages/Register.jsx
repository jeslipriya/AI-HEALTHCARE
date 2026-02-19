import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  HeartIcon,
  ScaleIcon,
  BeakerIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Account info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Personal info
    age: '',
    gender: '',
    height: '',
    weight: '',
    bloodType: '',
    
    // Health info
    conditions: [],
    allergies: [],
    medications: [],
    
    // Lifestyle
    diet: '',
    exerciseFrequency: '',
    sleepHours: '',
    smoking: false,
    alcohol: '',
    stressLevel: '',
    
    // Goals
    primaryGoal: '',
    additionalGoals: []
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddItem = (field, value) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }));
    // Clear the input
    if (field === 'conditions') setNewCondition('');
    if (field === 'allergies') setNewAllergy('');
    if (field === 'medications') setNewMedication('');
  };

  const handleRemoveItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const validateStep = () => {
    switch(step) {
      case 1:
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return false;
        }
        break;
      case 2:
        if (!formData.age || !formData.gender) {
          setError('Please fill in age and gender');
          return false;
        }
        break;
      // Steps 3 and 4 are optional
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep()) return;

    setLoading(true);
    setError('');

    try {
      // Prepare user data for registration
      const userData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        profile: {
          age: formData.age,
          gender: formData.gender,
          height: formData.height,
          weight: formData.weight,
          bloodType: formData.bloodType
        },
        healthInfo: {
          conditions: formData.conditions.map(c => ({
            name: c,
            diagnosedDate: new Date().toISOString().split('T')[0],
            severity: 'mild'
          })),
          allergies: formData.allergies,
          medications: formData.medications.map(m => ({
            name: m,
            dosage: '',
            frequency: ''
          }))
        },
        lifestyle: {
          diet: formData.diet,
          exerciseFrequency: formData.exerciseFrequency,
          sleepHours: formData.sleepHours,
          smoking: formData.smoking,
          alcohol: formData.alcohol,
          stressLevel: formData.stressLevel
        },
        goals: [
          {
            title: formData.primaryGoal,
            category: determineGoalCategory(formData.primaryGoal),
            progress: 0
          },
          ...formData.additionalGoals.map(goal => ({
            title: goal,
            category: determineGoalCategory(goal),
            progress: 0
          }))
        ]
      };

      console.log('Registering with data:', userData);
      
      const result = await register(userData);

      if (result.success) {
        toast.success('Registration successful! Welcome to AURA Health!');
        navigate('/dashboard');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const determineGoalCategory = (goal) => {
    const goalLower = goal.toLowerCase();
    if (goalLower.includes('weight') || goalLower.includes('fitness')) return 'fitness';
    if (goalLower.includes('diet') || goalLower.includes('nutrition')) return 'nutrition';
    if (goalLower.includes('mental') || goalLower.includes('stress')) return 'mental';
    if (goalLower.includes('sleep')) return 'sleep';
    if (goalLower.includes('water') || goalLower.includes('hydrate')) return 'hydration';
    return 'general';
  };

  const dietOptions = ['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Pescatarian', 'Keto', 'Mediterranean', 'Other'];
  const exerciseOptions = ['Daily', '3-4 times/week', '1-2 times/week', 'Rarely', 'Never'];
  const alcoholOptions = ['Never', 'Occasionally', 'Regularly'];
  const stressOptions = ['Low', 'Medium', 'High'];
  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const bloodTypeOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
  const goalOptions = [
    'Weight Loss',
    'Muscle Gain',
    'Better Sleep',
    'Stress Management',
    'Improved Fitness',
    'Healthy Eating',
    'Hydration',
    'General Wellness'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-primary-600">Step {step} of 4</span>
            <span className="text-sm text-gray-500">{Math.round((step / 4) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Join AURA Health</h2>
            <p className="text-primary-100">Create your account and start your personalized health journey</p>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="px-6 py-8">
            {/* Step 1: Account Information */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <UserIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Account Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        className="input-field"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        className="input-field"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="input-field"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        required
                        className="input-field"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        className="input-field"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Personal Information */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <HeartIcon className="w-5 h-5 mr-2 text-pink-600" />
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age *
                      </label>
                      <input
                        type="number"
                        name="age"
                        required
                        className="input-field"
                        placeholder="30"
                        value={formData.age}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender *
                      </label>
                      <select
                        name="gender"
                        required
                        className="input-field"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        {genderOptions.map(option => (
                          <option key={option} value={option.toLowerCase()}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        name="height"
                        className="input-field"
                        placeholder="175"
                        value={formData.height}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        name="weight"
                        className="input-field"
                        placeholder="70.5"
                        value={formData.weight}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Type
                    </label>
                    <select
                      name="bloodType"
                      className="input-field"
                      value={formData.bloodType}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      {bloodTypeOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Health Information */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <BeakerIcon className="w-5 h-5 mr-2 text-green-600" />
                    Health Information
                  </h3>

                  {/* Medical Conditions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medical Conditions
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        className="input-field flex-1"
                        placeholder="e.g., Diabetes, Hypertension"
                        value={newCondition}
                        onChange={(e) => setNewCondition(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddItem('conditions', newCondition)}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddItem('conditions', newCondition)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.conditions.map((condition, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                        >
                          {condition}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem('conditions', index)}
                            className="ml-2 text-primary-600 hover:text-primary-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergies
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        className="input-field flex-1"
                        placeholder="e.g., Peanuts, Dairy"
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddItem('allergies', newAllergy)}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddItem('allergies', newAllergy)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm"
                        >
                          {allergy}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem('allergies', index)}
                            className="ml-2 text-yellow-600 hover:text-yellow-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Medications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Medications
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        className="input-field flex-1"
                        placeholder="e.g., Metformin, Lisinopril"
                        value={newMedication}
                        onChange={(e) => setNewMedication(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddItem('medications', newMedication)}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddItem('medications', newMedication)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.medications.map((medication, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {medication}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem('medications', index)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Lifestyle & Goals */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <ScaleIcon className="w-5 h-5 mr-2 text-purple-600" />
                    Lifestyle & Goals
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diet Preference
                      </label>
                      <select
                        name="diet"
                        className="input-field"
                        value={formData.diet}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        {dietOptions.map(option => (
                          <option key={option} value={option.toLowerCase()}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Exercise Frequency
                      </label>
                      <select
                        name="exerciseFrequency"
                        className="input-field"
                        value={formData.exerciseFrequency}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        {exerciseOptions.map(option => (
                          <option key={option} value={option.toLowerCase()}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sleep (hours/day)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        name="sleepHours"
                        className="input-field"
                        placeholder="7.5"
                        value={formData.sleepHours}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alcohol Consumption
                      </label>
                      <select
                        name="alcohol"
                        className="input-field"
                        value={formData.alcohol}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        {alcoholOptions.map(option => (
                          <option key={option} value={option.toLowerCase()}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stress Level
                      </label>
                      <select
                        name="stressLevel"
                        className="input-field"
                        value={formData.stressLevel}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        {stressOptions.map(option => (
                          <option key={option} value={option.toLowerCase()}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="smoking"
                          checked={formData.smoking}
                          onChange={handleChange}
                          className="rounded text-primary-600"
                        />
                        <span className="text-sm text-gray-700">I smoke</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Health Goal
                    </label>
                    <select
                      name="primaryGoal"
                      className="input-field"
                      value={formData.primaryGoal}
                      onChange={handleChange}
                    >
                      <option value="">Select your main goal</option>
                      {goalOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-primary-50 p-4 rounded-lg">
                    <p className="text-sm text-primary-700 flex items-center">
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      AURA will personalize your experience based on this information
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back
                </button>
              )}
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors ml-auto"
                >
                  Next
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-auto disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Complete Registration
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Login Link */}
            <div className="text-center mt-6">
              <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700">
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;