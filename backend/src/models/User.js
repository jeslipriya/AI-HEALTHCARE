const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Core auth
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  role: { type: String, enum: ['user', 'family-admin', 'caregiver', 'doctor'], default: 'user' },

  // Profile
  profile: {
    age: Number, gender: String, height: Number, weight: Number,
    bloodType: String, dateOfBirth: Date
  },

  // Health history
  healthInfo: {
    conditions: [{
      name: String, diagnosedDate: Date, severity: String,
      medications: [String], notes: String
    }],
    allergies: [String],
    surgeries: [{ name: String, date: Date, hospital: String }],
    familyHistory: [{ condition: String, relation: String }]
  },

  // Lifestyle
  lifestyle: {
    diet: String, exerciseFrequency: String, sleepHours: Number,
    smoking: Boolean, alcohol: String, occupation: String, stressLevel: String
  },

  // Metrics
  healthMetrics: {
    daily: [{
      date: { type: Date, default: Date.now }, heartRate: Number,
      bloodPressure: { systolic: Number, diastolic: Number },
      bloodSugar: Number, weight: Number, steps: Number,
      sleep: { hours: Number, quality: String }, water: Number,
      mood: Number, symptoms: [String]
    }],
    weekly: [{
      weekStart: Date, averageHeartRate: Number,
      averageBloodPressure: { systolic: Number, diastolic: Number },
      averageBloodSugar: Number, averageSleep: Number, totalSteps: Number,
      exerciseMinutes: Number, caloriesBurned: Number, waterIntakeAverage: Number, moodAverage: Number
    }]
  },

  // Special tracking
  menstrualCycle: {
    lastPeriod: Date, cycleLength: Number, periodLength: Number,
    symptoms: [String], predictions: { nextPeriod: Date, fertileWindow: {}, ovulation: Date }
  },
  pregnancy: {
    isPregnant: { type: Boolean, default: false }, dueDate: Date,
    week: Number, trimester: Number,
    appointments: [{ date: Date, type: String, notes: String }],
    symptoms: [{ date: Date, symptom: String, severity: String }]
  },

  // Conditions & meds
  conditions: [{
    name: String, diagnosedDate: Date, severity: String,
    medications: [{
      name: String, dosage: String, frequency: String,
      startDate: Date, endDate: Date,
      adherence: [{ date: Date, taken: Boolean, time: String }]
    }],
    readings: [{ date: Date, value: Number, unit: String, notes: String }]
  }],

  // Goals & family
  goals: [{
    title: String, description: String, targetDate: Date,
    category: String, progress: { type: Number, default: 0, min: 0, max: 100 }
  }],
  familyMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  familyAccess: [{
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relationship: String,
    permissions: {
      viewHealthData: Boolean, viewMedications: Boolean,
      receiveAlerts: Boolean, emergencyContact: Boolean
    }
  }],
  emergencyContact: { name: String, relationship: String, phone: String, email: String },

  // Preferences
  preferences: {
    language: { type: String, default: 'en' },
    notifications: { email: { type: Boolean, default: true }, push: { type: Boolean, default: true }, sms: Boolean },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }
  },
  enabledModules: [String],
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function(pwd) {
  return await bcrypt.compare(pwd, this.password);
};

// Calculate health score
userSchema.methods.calculateHealthScore = function() {
  const days = this.healthMetrics.daily.slice(-7);
  if (!days.length) return null;

  const scores = { fitness: 0, nutrition: 0, mental: 0, sleep: 0, hydration: 0, medication: 100 };
  
  days.forEach(d => {
    if (d.steps) scores.fitness += Math.min(100, d.steps / 100);
    if (d.sleep?.hours) scores.sleep += Math.max(0, 100 - Math.abs(d.sleep.hours - 8) * 10);
    if (d.water) scores.hydration += Math.min(100, d.water * 12.5);
    if (d.mood) scores.mental += d.mood * 10;
  });

  Object.keys(scores).forEach(k => scores[k] = Math.round(scores[k] / days.length));
  
  return {
    total: Math.round(Object.values(scores).reduce((s, v, i) => 
      s + v * [0.2, 0.2, 0.15, 0.15, 0.15, 0.15][i], 0)),
    components: scores,
    basedOn: `${days.length} days`
  };
};

// Generate modules
userSchema.methods.generateEnabledModules = function() {
  const modules = ['dashboard', 'hydration', 'sleep', 'fitness', 'mental-wellness', 'skin-care'];
  
  if (this.profile?.gender === 'female') {
    modules.push('womens-health');
    if (this.pregnancy?.isPregnant) modules.push('pregnancy-tracker');
  } else if (this.profile?.gender === 'male') modules.push('mens-health');
  
  if (this.profile?.age > 35) modules.push('preventive-care');
  if (this.profile?.age > 60) modules.push('elderly-care');

  const conditions = [
    ...(this.healthInfo?.conditions || []),
    ...(this.conditions || [])
  ].map(c => c.name?.toLowerCase());
  
  if (conditions.some(c => ['diabetes', 'hypertension', 'asthma'].includes(c))) modules.push('chronic-condition');
  if (conditions.includes('diabetes')) modules.push('blood-sugar-monitoring');
  if (conditions.includes('hypertension')) modules.push('blood-pressure-monitoring');

  const hasMeds = [...(this.healthInfo?.conditions || []), ...(this.conditions || [])]
    .some(c => c.medications?.length);
  if (hasMeds) modules.push('medication');
  
  if (this.familyMembers?.length) modules.push('family-health');
  if (this.lifestyle?.exerciseFrequency === 'daily') modules.push('fitness-advanced');

  return [...new Set(modules)];
};

module.exports = mongoose.model('User', userSchema);