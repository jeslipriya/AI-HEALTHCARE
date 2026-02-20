import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon, HeartIcon, BeakerIcon, ScaleIcon, SparklesIcon,
  PencilIcon, CheckCircleIcon, XMarkIcon, EnvelopeIcon, PhoneIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    age: '', gender: '', height: '', weight: '', bloodType: '',
    allergies: [], conditions: [], diet: '', exercise: '', sleep: '', smoking: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '',
        age: user.profile?.age || '', gender: user.profile?.gender || '',
        height: user.profile?.height || '', weight: user.profile?.weight || '',
        bloodType: user.profile?.bloodType || '',
        allergies: user.healthInfo?.allergies || [],
        conditions: user.healthInfo?.conditions?.map(c => c.name) || [],
        diet: user.lifestyle?.diet || '', exercise: user.lifestyle?.exerciseFrequency || '',
        sleep: user.lifestyle?.sleepHours || '', smoking: user.lifestyle?.smoking || false
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        firstName: formData.firstName, lastName: formData.lastName, email: formData.email,
        profile: { age: formData.age, gender: formData.gender, height: formData.height, weight: formData.weight, bloodType: formData.bloodType },
        healthInfo: { 
          allergies: formData.allergies,
          conditions: formData.conditions.map(c => ({ name: c, severity: 'mild' }))
        },
        lifestyle: { diet: formData.diet, exerciseFrequency: formData.exercise, sleepHours: formData.sleep, smoking: formData.smoking }
      });
      toast.success('Profile updated!');
      setIsEditing(false);
    } catch { toast.error('Update failed'); } finally { setLoading(false); }
  };

  const TagList = ({ items, onRemove }) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((item, i) => (
        <span key={i} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center">
          {item}
          {isEditing && <button onClick={() => onRemove(i)} className="ml-2 text-primary-600">×</button>}
        </span>
      ))}
    </div>
  );

  const options = {
    gender: ['Male', 'Female', 'Other'],
    blood: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    diet: ['Vegetarian', 'Vegan', 'Non-Veg', 'Keto'],
    exercise: ['Daily', 'Weekly', 'Rarely', 'Never']
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Health Profile</h1>
        <button onClick={() => setIsEditing(!isEditing)} className="btn-primary flex items-center">
          {isEditing ? <XMarkIcon className="w-5 h-5 mr-2" /> : <PencilIcon className="w-5 h-5 mr-2" />}
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            <span className="text-3xl text-white">{formData.firstName?.[0]}{formData.lastName?.[0]}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{formData.firstName} {formData.lastName}</h2>
            <p className="text-gray-600 flex items-center"><EnvelopeIcon className="w-4 h-4 mr-1" />{formData.email}</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-3 flex items-center"><UserIcon className="w-5 h-5 mr-2 text-primary-600" />Personal</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input type="number" name="age" placeholder="Age" className="input-field text-sm" value={formData.age} onChange={handleChange} disabled={!isEditing} />
                <select name="gender" className="input-field text-sm" value={formData.gender} onChange={handleChange} disabled={!isEditing}>
                  <option value="">Gender</option>{options.gender.map(g => <option key={g} value={g.toLowerCase()}>{g}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" name="height" placeholder="Height (cm)" className="input-field text-sm" value={formData.height} onChange={handleChange} disabled={!isEditing} />
                <input type="number" name="weight" placeholder="Weight (kg)" className="input-field text-sm" value={formData.weight} onChange={handleChange} disabled={!isEditing} />
              </div>
              <select name="bloodType" className="input-field text-sm" value={formData.bloodType} onChange={handleChange} disabled={!isEditing}>
                <option value="">Blood Type</option>{options.blood.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center"><HeartIcon className="w-5 h-5 mr-2 text-red-600" />Health</h3>
            <div className="space-y-3">
              <div><p className="text-sm text-gray-600">Allergies</p><TagList items={formData.allergies} onRemove={i => {
                const updated = [...formData.allergies]; updated.splice(i, 1);
                setFormData({...formData, allergies: updated});
              }} /></div>
              <div><p className="text-sm text-gray-600">Conditions</p><TagList items={formData.conditions} onRemove={i => {
                const updated = [...formData.conditions]; updated.splice(i, 1);
                setFormData({...formData, conditions: updated});
              }} /></div>
              {isEditing && (
                <div className="flex space-x-2">
                  <input type="text" className="input-field text-sm flex-1" placeholder="Add allergy" onKeyPress={e => e.key === 'Enter' && e.target.value && 
                    setFormData({...formData, allergies: [...formData.allergies, e.target.value]}) && (e.target.value = '')} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lifestyle */}
        <div className="mt-6">
          <h3 className="font-semibold mb-3 flex items-center"><ScaleIcon className="w-5 h-5 mr-2 text-green-600" />Lifestyle</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select name="diet" className="input-field text-sm" value={formData.diet} onChange={handleChange} disabled={!isEditing}>
              <option value="">Diet</option>{options.diet.map(d => <option key={d} value={d.toLowerCase()}>{d}</option>)}
            </select>
            <select name="exercise" className="input-field text-sm" value={formData.exercise} onChange={handleChange} disabled={!isEditing}>
              <option value="">Exercise</option>{options.exercise.map(e => <option key={e} value={e.toLowerCase()}>{e}</option>)}
            </select>
            <input type="number" name="sleep" placeholder="Sleep (hrs)" className="input-field text-sm" value={formData.sleep} onChange={handleChange} disabled={!isEditing} />
            <label className="flex items-center space-x-2"><input type="checkbox" name="smoking" checked={formData.smoking} onChange={handleChange} disabled={!isEditing} /><span className="text-sm">Smoking</span></label>
          </div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="mt-6 flex justify-end">
            <button onClick={handleSave} disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : <><CheckCircleIcon className="w-5 h-5 mr-2" />Save Changes</>}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;