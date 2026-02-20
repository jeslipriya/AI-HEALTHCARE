import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout components
import Layout from './components/UI/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import HealthModules from './pages/HealthModules';
import ReportAnalyzer from './pages/ReportAnalyzer';
import FamilyHub from './pages/FamilyHub';
import Settings from './pages/Settings';
import SymptomChecker from './pages/SymptomChecker';
import DietPlanner from './pages/DietPlanner';
import SleepAdvisor from './pages/SleepAdvisor';
import SkinAnalyzer from './pages/SkinAnalyzer';
import AIChat from './pages/AIChat';
import ModulePage from './pages/ModulePage';
import SkinCareAI from './pages/SkinCareAI';
import WomensHealth from './pages/WomensHealth';
import MensHealth from './pages/MensHealth';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppContent() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="modules" element={<HealthModules />} />
          <Route path="analyzer" element={<ReportAnalyzer />} />
          <Route path="family" element={<FamilyHub />} />
          <Route path="settings" element={<Settings />} />
          <Route path="symptom-checker" element={<SymptomChecker />} />
          <Route path="diet-planner" element={<DietPlanner />} />
          <Route path="sleep-advisor" element={<SleepAdvisor />} />
          <Route path="skin-analyzer" element={<SkinAnalyzer />} />
          <Route path="skin-care-ai" element={<SkinCareAI />} />
          <Route path="ai-chat" element={<AIChat />} />  
          <Route path="womens-health" element={<WomensHealth />} />
          <Route path="mens-health" element={<MensHealth />} />
          <Route path="module/:moduleName" element={<ModulePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <AppContent />
    </AuthProvider>
  );
}

export default App;