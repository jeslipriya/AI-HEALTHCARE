import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  CakeIcon, 
  FireIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DietPlanner = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState('');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [dietPlan, setDietPlan] = useState(null);

  const handleGenerate = async () => {
    if (!goals.trim()) {
      toast.error('Please specify your goals');
      return;
    }

    setLoading(true);
    try {
      console.log('Generating diet plan with:', { goals, preferences });
      
      const response = await aiAPI.getDietPlan(goals, preferences);
      console.log('API Response:', response.data);
      
      if (response.data.success && response.data.dietPlan) {
        setDietPlan(response.data.dietPlan);
        toast.success('Diet plan generated!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Diet plan error:', error);
      console.error('Error response:', error.response?.data);
      
      // Use fallback diet plan
      setDietPlan({
        dailyCalories: "2200-2500 kcal",
        macros: {
          protein: "160g",
          carbs: "280g",
          fat: "80g"
        },
        mealPlan: {
          breakfast: ["Protein smoothie with banana", "Scrambled eggs with toast"],
          lunch: ["Grilled chicken breast with rice", "Fish curry with vegetables"],
          dinner: ["Paneer tikka with salad", "Egg curry with roti"],
          snacks: ["Greek yogurt", "Protein bar", "Mixed nuts"]
        },
        foodsToEat: ["Lean meats", "Eggs", "Fish", "Paneer", "Rice", "Vegetables", "Fruits"],
        foodsToAvoid: ["Processed foods", "Sugary drinks", "Excessive oil"],
        groceryList: "Chicken breast, Eggs, Paneer, Rice, Vegetables, Fruits, Greek yogurt, Protein powder",
        tips: [
          "Eat protein with every meal",
          "Stay hydrated - drink 3-4 liters daily",
          "Get 7-8 hours of sleep for muscle recovery",
          "Gradually increase calorie intake"
        ]
      });
      
      toast.warning('Using default diet plan');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely render arrays or strings
  const renderList = (items) => {
    if (!items) return null;
    
    if (Array.isArray(items)) {
      return items.map((item, i) => (
        <li key={i} className="text-gray-700">{item}</li>
      ));
    }
    
    // If it's a string, split by commas or newlines
    if (typeof items === 'string') {
      return items.split(/[,\n]+/).map((item, i) => (
        <li key={i} className="text-gray-700">{item.trim()}</li>
      ));
    }
    
    return null;
  };

  // Helper function to render grocery list as checkboxes
  const renderGroceryList = (items) => {
    if (!items) return null;
    
    let groceryItems = [];
    
    if (Array.isArray(items)) {
      groceryItems = items;
    } else if (typeof items === 'string') {
      groceryItems = items.split(/[,\n]+/).map(item => item.trim());
    } else {
      return null;
    }
    
    return groceryItems.map((item, i) => (
      <div key={i} className="flex items-center text-sm text-gray-700">
        <input type="checkbox" className="mr-2 rounded" />
        {item}
      </div>
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-gray-900">AI Diet Planner</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <div className="card space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Goals
              </label>
              <textarea
                rows="3"
                className="input-field"
                placeholder="e.g., Lose 5kg, Build muscle, Improve energy..."
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Preferences
              </label>
              <textarea
                rows="3"
                className="input-field"
                placeholder="e.g., Vegetarian, No nuts, Prefer Indian food..."
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                'Generate Diet Plan'
              )}
            </button>
          </div>
        </div>

        {/* Diet Plan Display */}
        <div className="lg:col-span-2">
          {!dietPlan ? (
            <div className="card h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <CakeIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Enter your goals to generate a personalized diet plan</p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Daily Calories */}
              <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg opacity-90">Daily Calorie Target</p>
                    <p className="text-3xl font-bold">{dietPlan.dailyCalories}</p>
                  </div>
                  <FireIcon className="w-12 h-12 opacity-50" />
                </div>
              </div>

              {/* Macros */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Macronutrients</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-full bg-blue-100 rounded-full h-2 mb-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <p className="font-medium">{dietPlan.macros?.protein || '0g'}</p>
                    <p className="text-sm text-gray-600">Protein</p>
                  </div>
                  <div className="text-center">
                    <div className="w-full bg-green-100 rounded-full h-2 mb-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                    <p className="font-medium">{dietPlan.macros?.carbs || '0g'}</p>
                    <p className="text-sm text-gray-600">Carbs</p>
                  </div>
                  <div className="text-center">
                    <div className="w-full bg-yellow-100 rounded-full h-2 mb-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                    <p className="font-medium">{dietPlan.macros?.fat || '0g'}</p>
                    <p className="text-sm text-gray-600">Fat</p>
                  </div>
                </div>
              </div>

              {/* Meal Plan */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Daily Meal Plan</h3>
                <div className="space-y-4">
                  {dietPlan.mealPlan?.breakfast && (
                    <div>
                      <p className="font-medium text-primary-600">Breakfast</p>
                      <ul className="list-disc list-inside text-gray-700">
                        {renderList(dietPlan.mealPlan.breakfast)}
                      </ul>
                    </div>
                  )}
                  {dietPlan.mealPlan?.lunch && (
                    <div>
                      <p className="font-medium text-primary-600">Lunch</p>
                      <ul className="list-disc list-inside text-gray-700">
                        {renderList(dietPlan.mealPlan.lunch)}
                      </ul>
                    </div>
                  )}
                  {dietPlan.mealPlan?.dinner && (
                    <div>
                      <p className="font-medium text-primary-600">Dinner</p>
                      <ul className="list-disc list-inside text-gray-700">
                        {renderList(dietPlan.mealPlan.dinner)}
                      </ul>
                    </div>
                  )}
                  {dietPlan.mealPlan?.snacks && (
                    <div>
                      <p className="font-medium text-primary-600">Snacks</p>
                      <ul className="list-disc list-inside text-gray-700">
                        {renderList(dietPlan.mealPlan.snacks)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Foods to Eat/Avoid */}
              <div className="grid grid-cols-2 gap-4">
                {dietPlan.foodsToEat && (
                  <div className="card">
                    <h3 className="font-semibold text-green-600 mb-2 flex items-center">
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Foods to Eat
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {renderList(dietPlan.foodsToEat)}
                    </ul>
                  </div>
                )}
                {dietPlan.foodsToAvoid && (
                  <div className="card">
                    <h3 className="font-semibold text-red-600 mb-2 flex items-center">
                      <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                      Foods to Avoid
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {renderList(dietPlan.foodsToAvoid)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tips */}
              {dietPlan.tips && (
                <div className="card bg-blue-50">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <LightBulbIcon className="w-5 h-5 mr-2" />
                    Pro Tips
                  </h3>
                  <ul className="list-disc list-inside text-sm text-blue-700">
                    {renderList(dietPlan.tips)}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DietPlanner;