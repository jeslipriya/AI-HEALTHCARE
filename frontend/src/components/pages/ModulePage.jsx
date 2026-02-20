import React, { lazy, Suspense } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

// Lazy load modules
const HydrationTracker = lazy(() => import('../modules/HydrationTracker'));
const SleepTracker = lazy(() => import('../modules/SleepTracker'));
const FitnessTracker = lazy(() => import('../modules/FitnessTracker'));
const MentalWellness = lazy(() => import('../modules/MentalWellness'));
const SkinCare = lazy(() => import('../modules/SkinCare'));
const WomensHealth = lazy(() => import('./WomensHealth'));
const MensHealth = lazy(() => import('./MensHealth'));
const MedicationManager = lazy(() => import('../modules/MedicationManager'));

// Map module names to components
const moduleComponents = {
  'hydration': HydrationTracker,
  'sleep': SleepTracker,
  'fitness': FitnessTracker,
  'mental-wellness': MentalWellness,
  'skin-care': SkinCare,
  'womens-health': WomensHealth,
  'mens-health': MensHealth,
  'medication': MedicationManager,
};

const ModulePage = () => {
  const { moduleName } = useParams();
  const { user } = useAuth();

  // Check if user has this module enabled
  const isEnabled = user?.enabledModules?.includes(moduleName);
  
  const ModuleComponent = moduleComponents[moduleName];

  // If module doesn't exist or isn't enabled, redirect to modules page
  if (!ModuleComponent || !isEnabled) {
    return <Navigate to="/modules" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 capitalize">
          {moduleName.split('-').join(' ')}
        </h1>
      </div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }>
        <ModuleComponent />
      </Suspense>
    </motion.div>
  );
};

export default ModulePage;