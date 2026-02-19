import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  HeartIcon, 
  BeakerIcon, 
  ScaleIcon,
  SparklesIcon,
  PencilIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  FireIcon,
  MoonIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { healthAPI, aiAPI } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [healthMetrics, setHealthMetrics] = useState([]);
  const [allergyWarnings, setAllergyWarnings] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profile: {
      age: '',
      gender: '',
      height: '',
      weight: '',
      bloodType: '',
      dateOfBirth: ''
    },
    healthInfo: {
      conditions: [],
      allergies: [],
      surgeries: [],
      familyHistory: []
    },
    lifestyle: {
      diet: '',
      exerciseFrequency: '',
      sleepHours: '',
      smoking: false,
      alcohol: '',
      occupation: '',
      stressLevel: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    goals: []
  });

  // Condition input state
  const [newCondition, setNewCondition] = useState({
    name: '',
    diagnosedDate: '',
    severity: 'mild',
    medications: []
  });

  const [newMedication, setNewMedication] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetDate: '',
    category: 'fitness',
    target: ''
  });

  // Load user data into form
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        profile: {
          age: user.profile?.age || '',
          gender: user.profile?.gender || '',
          height: user.profile?.height || '',
          weight: user.profile?.weight || '',
          bloodType: user.profile?.bloodType || '',
          dateOfBirth: user.profile?.dateOfBirth ? user.profile.dateOfBirth.split('T')[0] : ''
        },
        healthInfo: {
          conditions: user.healthInfo?.conditions || [],
          allergies: user.healthInfo?.allergies || [],
          surgeries: user.healthInfo?.surgeries || [],
          familyHistory: user.healthInfo?.familyHistory || []
        },
        lifestyle: {
          diet: user.lifestyle?.diet || '',
          exerciseFrequency: user.lifestyle?.exerciseFrequency || '',
          sleepHours: user.lifestyle?.sleepHours || '',
          smoking: user.lifestyle?.smoking || false,
          alcohol: user.lifestyle?.alcohol || '',
          occupation: user.lifestyle?.occupation || '',
          stressLevel: user.lifestyle?.stressLevel || ''
        },
        emergencyContact: {
          name: user.emergencyContact?.name || '',
          relationship: user.emergencyContact?.relationship || '',
          phone: user.emergencyContact?.phone || '',
          email: user.emergencyContact?.email || ''
        },
        goals: user.goals || []
      });

      // Check for allergy-related warnings
      checkAllergyWarnings(user.healthInfo?.allergies || []);
    }
  }, [user]);

  // Check for common allergens in user's conditions or medications
  const checkAllergyWarnings = (allergies) => {
    const warnings = [];
    const commonAllergens = {
      'peanuts': ['peanut', 'arachis', 'groundnut'],
      'tree nuts': ['almond', 'walnut', 'cashew', 'pecan', 'hazelnut'],
      'dairy': ['milk', 'lactose', 'casein', 'whey', 'dairy'],
      'eggs': ['egg', 'albumin', 'ovoglobulin'],
      'soy': ['soy', 'soya', 'tofu', 'tempeh'],
      'wheat': ['wheat', 'gluten', 'flour', 'bran'],
      'shellfish': ['shrimp', 'crab', 'lobster', 'prawn', 'shellfish'],
      'fish': ['fish', 'salmon', 'tuna', 'cod'],
      'sulfites': ['sulfite', 'sulphite', 'preservative']
    };

    allergies.forEach(allergy => {
      const lowerAllergy = allergy.toLowerCase();
      for (const [category, keywords] of Object.entries(commonAllergens)) {
        if (keywords.some(keyword => lowerAllergy.includes(keyword))) {
          warnings.push({
            allergen: category,
            severity: 'high',
            message: `You have a ${category} allergy. This will be considered in all AI recommendations.`
          });
          break;
        }
      }
    });

    setAllergyWarnings(warnings);
  };

  // Load health metrics
  useEffect(() => {
    loadHealthMetrics();
    generateAIInsights();
  }, []);

  const loadHealthMetrics = async () => {
    try {
      const response = await healthAPI.getHealthData(null, null, null, 30);
      if (response.data.data) {
        setHealthMetrics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load health metrics:', error);
    }
  };

  // Enhanced AI insights that consider allergies and conditions
  const generateAIInsights = async () => {
    try {
      // Build comprehensive health context
      const healthContext = {
        age: user?.profile?.age || 'Not specified',
        gender: user?.profile?.gender || 'Not specified',
        conditions: user?.healthInfo?.conditions?.map(c => ({
          name: c.name,
          severity: c.severity,
          medications: c.medications
        })) || [],
        allergies: user?.healthInfo?.allergies || [],
        surgeries: user?.healthInfo?.surgeries || [],
        familyHistory: user?.healthInfo?.familyHistory || [],
        lifestyle: {
          diet: user?.lifestyle?.diet,
          exerciseFrequency: user?.lifestyle?.exerciseFrequency,
          sleepHours: user?.lifestyle?.sleepHours,
          smoking: user?.lifestyle?.smoking,
          alcohol: user?.lifestyle?.alcohol,
          stressLevel: user?.lifestyle?.stressLevel,
          occupation: user?.lifestyle?.occupation
        },
        goals: user?.goals || []
      };

      const prompt = `As a health AI assistant, analyze this user's complete health profile and provide personalized insights and recommendations.
      
      IMPORTANT: You MUST consider all allergies, conditions, and medications in your recommendations.
      
      User Health Profile:
      ${JSON.stringify(healthContext, null, 2)}
      
      Provide 4-5 specific, actionable insights that:
      1. Take into account their allergies and conditions
      2. Suggest lifestyle modifications that are safe for them
      3. Recommend foods/exercises that avoid their allergens
      4. Consider their medications when giving advice
      5. Are tailored to their specific health goals
      
      Format your response in a friendly, conversational tone.`;

      const response = await aiAPI.chat(prompt, []);
      setAiInsights(response.data.response);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: section === 'profile' || section === 'healthInfo' || section === 'lifestyle' || section === 'emergencyContact'
        ? { ...prev[section], [field]: value }
        : value
    }));
  };

  const handleAddCondition = () => {
    if (!newCondition.name) {
      toast.error('Please enter condition name');
      return;
    }

    setFormData(prev => ({
      ...prev,
      healthInfo: {
        ...prev.healthInfo,
        conditions: [...prev.healthInfo.conditions, { ...newCondition, medications: [] }]
      }
    }));

    setNewCondition({
      name: '',
      diagnosedDate: '',
      severity: 'mild',
      medications: []
    });

    // Regenerate insights with new condition
    setTimeout(() => generateAIInsights(), 500);
  };

  const handleAddMedication = (conditionIndex) => {
    if (!newMedication) return;

    setFormData(prev => {
      const updatedConditions = [...prev.healthInfo.conditions];
      updatedConditions[conditionIndex].medications.push(newMedication);
      return {
        ...prev,
        healthInfo: { ...prev.healthInfo, conditions: updatedConditions }
      };
    });

    setNewMedication('');
  };

  const handleAddAllergy = () => {
    if (!newAllergy) {
      toast.error('Please enter an allergy');
      return;
    }

    setFormData(prev => ({
      ...prev,
      healthInfo: {
        ...prev.healthInfo,
        allergies: [...prev.healthInfo.allergies, newAllergy]
      }
    }));

    // Check warnings for new allergy
    checkAllergyWarnings([...formData.healthInfo.allergies, newAllergy]);
    
    // Regenerate insights with new allergy
    setTimeout(() => generateAIInsights(), 500);
    
    setNewAllergy('');
    toast.success('Allergy added successfully');
  };

  const handleAddGoal = () => {
    if (!newGoal.title) {
      toast.error('Please enter goal title');
      return;
    }

    setFormData(prev => ({
      ...prev,
      goals: [...prev.goals, { ...newGoal, progress: 0, id: Date.now() }]
    }));

    setNewGoal({
      title: '',
      targetDate: '',
      category: 'fitness',
      target: ''
    });
  };

  const handleRemoveItem = (section, subsection, index) => {
    setFormData(prev => {
      let updated;
      if (subsection) {
        const updatedArray = [...prev[section][subsection]];
        updatedArray.splice(index, 1);
        updated = {
          ...prev,
          [section]: { ...prev[section], [subsection]: updatedArray }
        };
      } else {
        const updatedArray = [...prev[section]];
        updatedArray.splice(index, 1);
        updated = { ...prev, [section]: updatedArray };
      }
      return updated;
    });

    // Regenerate insights after removal
    setTimeout(() => generateAIInsights(), 500);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      
      // Regenerate insights with new data
      generateAIInsights();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const dietOptions = ['vegetarian', 'vegan', 'non-vegetarian', 'pescatarian', 'keto', 'other'];
  const exerciseOptions = ['daily', 'weekly', 'rarely', 'never'];
  const alcoholOptions = ['never', 'occasionally', 'regularly'];
  const stressOptions = ['low', 'medium', 'high'];
  const bloodTypeOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];
  const goalCategories = ['fitness', 'nutrition', 'mental', 'sleep', 'hydration', 'medication'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Profile</h1>
          <p className="text-gray-600 mt-1">Manage your personal health information</p>
        </div>
        <div className="flex space-x-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary flex items-center"
            >
              <PencilIcon className="w-5 h-5 mr-2" />
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary flex items-center"
              >
                <XMarkIcon className="w-5 h-5 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="btn-primary flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Allergy Warnings */}
      {allergyWarnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg"
        >
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Allergy Awareness</h3>
              <div className="mt-1 text-sm text-yellow-700">
                {allergyWarnings.map((warning, idx) => (
                  <p key={idx}>{warning.message}</p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Insights Card - Enhanced with Allergy Context */}
      {aiInsights && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-r from-purple-500 to-pink-500 text-white"
        >
          <div className="flex items-start space-x-3">
            <SparklesIcon className="w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">AI Health Insights</h3>
              <p className="text-sm opacity-90 whitespace-pre-line">{aiInsights}</p>
              {allergyWarnings.length > 0 && (
                <div className="mt-3 text-xs bg-white bg-opacity-20 p-2 rounded">
                  <span className="font-semibold">Note:</span> All recommendations consider your allergies
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Profile Card */}
      <div className="card">
        {/* Profile Header */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-4xl text-white font-semibold">
                {formData.firstName?.[0]}{formData.lastName?.[0]}
              </span>
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg">
                <PencilIcon className="w-4 h-4 text-primary-600" />
              </button>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{formData.firstName} {formData.lastName}</h2>
            <p className="text-gray-600 flex items-center">
              <EnvelopeIcon className="w-4 h-4 mr-1" />
              {formData.email}
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2 text-primary-600" />
              Personal Information
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="input-field"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  ) : (
                    <p className="text-gray-900">{formData.firstName || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="input-field"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  ) : (
                    <p className="text-gray-900">{formData.lastName || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    className="input-field"
                    value={formData.profile.dateOfBirth}
                    onChange={(e) => handleInputChange('profile', 'dateOfBirth', e.target.value)}
                  />
                ) : (
                  <p className="text-gray-900">
                    {formData.profile.dateOfBirth ? new Date(formData.profile.dateOfBirth).toLocaleDateString() : 'Not set'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      className="input-field"
                      value={formData.profile.age}
                      onChange={(e) => handleInputChange('profile', 'age', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{formData.profile.age || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      className="input-field"
                      value={formData.profile.gender}
                      onChange={(e) => handleInputChange('profile', 'gender', e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{formData.profile.gender || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (cm)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      className="input-field"
                      value={formData.profile.height}
                      onChange={(e) => handleInputChange('profile', 'height', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{formData.profile.height || 'Not set'} cm</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      className="input-field"
                      value={formData.profile.weight}
                      onChange={(e) => handleInputChange('profile', 'weight', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900">{formData.profile.weight || 'Not set'} kg</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Type
                </label>
                {isEditing ? (
                  <select
                    className="input-field"
                    value={formData.profile.bloodType}
                    onChange={(e) => handleInputChange('profile', 'bloodType', e.target.value)}
                  >
                    <option value="">Select</option>
                    {bloodTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900">{formData.profile.bloodType || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <PhoneIcon className="w-5 h-5 mr-2 text-red-600" />
              Emergency Contact
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="input-field"
                    value={formData.emergencyContact.name}
                    onChange={(e) => handleInputChange('emergencyContact', 'name', e.target.value)}
                  />
                ) : (
                  <p className="text-gray-900">{formData.emergencyContact.name || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="input-field"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => handleInputChange('emergencyContact', 'relationship', e.target.value)}
                  />
                ) : (
                  <p className="text-gray-900">{formData.emergencyContact.relationship || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    className="input-field"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => handleInputChange('emergencyContact', 'phone', e.target.value)}
                  />
                ) : (
                  <p className="text-gray-900">{formData.emergencyContact.phone || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    className="input-field"
                    value={formData.emergencyContact.email}
                    onChange={(e) => handleInputChange('emergencyContact', 'email', e.target.value)}
                  />
                ) : (
                  <p className="text-gray-900">{formData.emergencyContact.email || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Health Information */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <HeartIcon className="w-5 h-5 mr-2 text-red-600" />
            Health Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Medical Conditions */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Medical Conditions</h4>
              <div className="space-y-2">
                {formData.healthInfo.conditions.map((condition, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{condition.name}</p>
                        <p className="text-xs text-gray-600">
                          Severity: {condition.severity} • 
                          Diagnosed: {condition.diagnosedDate ? new Date(condition.diagnosedDate).toLocaleDateString() : 'Date not set'}
                        </p>
                        {condition.medications.length > 0 && (
                          <p className="text-xs text-gray-600 mt-1">
                            Medications: {condition.medications.join(', ')}
                          </p>
                        )}
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => handleRemoveItem('healthInfo', 'conditions', idx)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isEditing && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      className="input-field text-sm"
                      placeholder="Condition name"
                      value={newCondition.name}
                      onChange={(e) => setNewCondition({...newCondition, name: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        className="input-field text-sm"
                        value={newCondition.diagnosedDate}
                        onChange={(e) => setNewCondition({...newCondition, diagnosedDate: e.target.value})}
                      />
                      <select
                        className="input-field text-sm"
                        value={newCondition.severity}
                        onChange={(e) => setNewCondition({...newCondition, severity: e.target.value})}
                      >
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                    <button
                      onClick={handleAddCondition}
                      className="btn-primary w-full text-sm"
                    >
                      Add Condition
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Allergies - Enhanced with AI Context */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center">
                Allergies
                {formData.healthInfo.allergies.length > 0 && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    AI will consider these
                  </span>
                )}
              </h4>
              <div className="space-y-2">
                {formData.healthInfo.allergies.map((allergy, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium">{allergy}</span>
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveItem('healthInfo', 'allergies', idx)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {isEditing && (
                  <div className="flex space-x-2 mt-2">
                    <input
                      type="text"
                      className="input-field text-sm flex-1"
                      placeholder="Add allergy (e.g., Peanuts, Dairy)"
                      value={newAllergy}
                      onChange={(e) => setNewAllergy(e.target.value)}
                    />
                    <button
                      onClick={handleAddAllergy}
                      className="btn-primary text-sm px-4"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Allergy-aware note */}
              {formData.healthInfo.allergies.length > 0 && !isEditing && (
                <p className="text-xs text-gray-500 mt-3">
                  ✅ All AI recommendations will automatically avoid your allergens
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Lifestyle */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ScaleIcon className="w-5 h-5 mr-2 text-green-600" />
            Lifestyle
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diet
              </label>
              {isEditing ? (
                <select
                  className="input-field"
                  value={formData.lifestyle.diet}
                  onChange={(e) => handleInputChange('lifestyle', 'diet', e.target.value)}
                >
                  <option value="">Select</option>
                  {dietOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900 capitalize">{formData.lifestyle.diet || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exercise Frequency
              </label>
              {isEditing ? (
                <select
                  className="input-field"
                  value={formData.lifestyle.exerciseFrequency}
                  onChange={(e) => handleInputChange('lifestyle', 'exerciseFrequency', e.target.value)}
                >
                  <option value="">Select</option>
                  {exerciseOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900 capitalize">{formData.lifestyle.exerciseFrequency || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sleep Hours
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.5"
                  className="input-field"
                  value={formData.lifestyle.sleepHours}
                  onChange={(e) => handleInputChange('lifestyle', 'sleepHours', e.target.value)}
                />
              ) : (
                <p className="text-gray-900">{formData.lifestyle.sleepHours || 'Not set'} hours</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Smoking
              </label>
              {isEditing ? (
                <select
                  className="input-field"
                  value={formData.lifestyle.smoking ? 'yes' : 'no'}
                  onChange={(e) => handleInputChange('lifestyle', 'smoking', e.target.value === 'yes')}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              ) : (
                <p className="text-gray-900">{formData.lifestyle.smoking ? 'Yes' : 'No'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alcohol
              </label>
              {isEditing ? (
                <select
                  className="input-field"
                  value={formData.lifestyle.alcohol}
                  onChange={(e) => handleInputChange('lifestyle', 'alcohol', e.target.value)}
                >
                  <option value="">Select</option>
                  {alcoholOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900 capitalize">{formData.lifestyle.alcohol || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stress Level
              </label>
              {isEditing ? (
                <select
                  className="input-field"
                  value={formData.lifestyle.stressLevel}
                  onChange={(e) => handleInputChange('lifestyle', 'stressLevel', e.target.value)}
                >
                  <option value="">Select</option>
                  {stressOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900 capitalize">{formData.lifestyle.stressLevel || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Health Metrics */}
        {healthMetrics.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-blue-600" />
              Recent Health Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {healthMetrics.slice(0, 4).map((metric, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 capitalize">{metric.type}</p>
                  <p className="font-medium">{JSON.stringify(metric.data)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(metric.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;