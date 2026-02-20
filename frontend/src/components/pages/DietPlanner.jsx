import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../services/api';
import { CakeIcon, FireIcon, CheckCircleIcon, ExclamationTriangleIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DietPlanner = () => {
  const [goals, setGoals] = useState('');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const fallbackPlan = {
    dailyCalories: "2200-2500 kcal",
    macros: { protein: "160g", carbs: "280g", fat: "80g" },
    mealPlan: {
      breakfast: ["Protein smoothie", "Scrambled eggs with toast"],
      lunch: ["Grilled chicken with rice", "Fish curry with vegetables"],
      dinner: ["Paneer tikka with salad", "Egg curry with roti"],
      snacks: ["Greek yogurt", "Protein bar", "Mixed nuts"]
    },
    foodsToEat: ["Lean meats", "Eggs", "Fish", "Paneer", "Rice", "Vegetables", "Fruits"],
    foodsToAvoid: ["Processed foods", "Sugary drinks", "Excessive oil"],
    tips: ["Eat protein with every meal", "Stay hydrated", "Get 7-8 hours sleep"]
  };

  const handleGenerate = async () => {
    if (!goals.trim()) return toast.error('Please specify your goals');
    
    setLoading(true);
    try {
      const { data } = await aiAPI.getDietPlan(goals, preferences);
      setPlan(data.dietPlan || fallbackPlan);
      toast.success(data.dietPlan ? 'Diet plan generated!' : 'Using default plan');
    } catch {
      setPlan(fallbackPlan);
      toast.warning('Using default diet plan');
    } finally {
      setLoading(false);
    }
  };

  const renderItems = (items) => {
    if (!items) return null;
    const list = Array.isArray(items) ? items : items.split(/[,\n]+/).map(s => s.trim());
    return list.map((item, i) => <li key={i} className="text-gray-700">{item}</li>);
  };

  const Section = ({ title, icon: Icon, color, children }) => (
    <div className="card">
      <h3 className={`font-semibold mb-2 flex items-center text-${color}-600`}>
        <Icon className="w-5 h-5 mr-2" />{title}
      </h3>
      {children}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h1 className="text-3xl font-bold">AI Diet Planner</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1 card space-y-4">
          <textarea rows="3" className="input-field" placeholder="Your goals (e.g., Lose 5kg, Build muscle)" 
            value={goals} onChange={(e) => setGoals(e.target.value)} />
          <textarea rows="3" className="input-field" placeholder="Dietary preferences (e.g., Vegetarian, Indian food)" 
            value={preferences} onChange={(e) => setPreferences(e.target.value)} />
          <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full">
            {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mx-auto" /> : 'Generate Plan'}
          </button>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {!plan ? (
            <div className="card h-64 flex items-center justify-center text-gray-500">
              <div className="text-center"><CakeIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" /><p>Enter your goals to generate a plan</p></div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Calories Card */}
              <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white flex justify-between items-center">
                <div><p className="opacity-90">Daily Calories</p><p className="text-3xl font-bold">{plan.dailyCalories}</p></div>
                <FireIcon className="w-12 h-12 opacity-50" />
              </div>

              {/* Macros */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Macros</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {['protein', 'carbs', 'fat'].map(m => (
                    <div key={m}>
                      <div className="w-full bg-gray-200 h-2 rounded-full mb-2">
                        <div className={`bg-${m === 'protein' ? 'blue' : m === 'carbs' ? 'green' : 'yellow'}-600 h-2 rounded-full`} style={{ width: '30%' }} />
                      </div>
                      <p className="font-medium">{plan.macros?.[m] || '0g'}</p>
                      <p className="text-sm text-gray-600 capitalize">{m}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meals */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Meal Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => plan.mealPlan?.[meal] && (
                    <div key={meal}>
                      <p className="font-medium text-primary-600 capitalize">{meal}</p>
                      <ul className="list-disc list-inside text-sm text-gray-700">{renderItems(plan.mealPlan[meal])}</ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foods */}
              <div className="grid grid-cols-2 gap-4">
                {plan.foodsToEat && (
                  <Section title="Foods to Eat" icon={CheckCircleIcon} color="green">
                    <ul className="list-disc list-inside text-sm">{renderItems(plan.foodsToEat)}</ul>
                  </Section>
                )}
                {plan.foodsToAvoid && (
                  <Section title="Foods to Avoid" icon={ExclamationTriangleIcon} color="red">
                    <ul className="list-disc list-inside text-sm">{renderItems(plan.foodsToAvoid)}</ul>
                  </Section>
                )}
              </div>

              {/* Tips */}
              {plan.tips && (
                <Section title="Pro Tips" icon={LightBulbIcon} color="blue">
                  <ul className="list-disc list-inside text-sm text-blue-700">{renderItems(plan.tips)}</ul>
                </Section>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DietPlanner;
