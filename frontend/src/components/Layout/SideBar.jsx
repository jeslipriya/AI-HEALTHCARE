import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import * as Icons from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => { if (isCollapsed) setHoveredItem(null); }, [isCollapsed]);

  // Consolidated color mappings
  const colorMap = {
    blue: { active: 'text-blue-600 bg-blue-50', hover: 'hover:bg-blue-50 hover:text-blue-600' },
    purple: { active: 'text-purple-600 bg-purple-50', hover: 'hover:bg-purple-50 hover:text-purple-600' },
    pink: { active: 'text-pink-600 bg-pink-50', hover: 'hover:bg-pink-50 hover:text-pink-600' },
    orange: { active: 'text-orange-600 bg-orange-50', hover: 'hover:bg-orange-50 hover:text-orange-600' },
    indigo: { active: 'text-indigo-600 bg-indigo-50', hover: 'hover:bg-indigo-50 hover:text-indigo-600' },
    yellow: { active: 'text-yellow-600 bg-yellow-50', hover: 'hover:bg-yellow-50 hover:text-yellow-600' },
    green: { active: 'text-green-600 bg-green-50', hover: 'hover:bg-green-50 hover:text-green-600' },
    cyan: { active: 'text-cyan-600 bg-cyan-50', hover: 'hover:bg-cyan-50 hover:text-cyan-600' },
    red: { active: 'text-red-600 bg-red-50', hover: 'hover:bg-red-50 hover:text-red-600' },
    gray: { active: 'text-gray-600 bg-gray-50', hover: 'hover:bg-gray-50 hover:text-gray-600' }
  };

  // Navigation configuration
  const navConfig = [
    { title: 'Main', items: [
      { name: 'Dashboard', href: '/dashboard', icon: 'HomeIcon', color: 'blue' },
      { name: 'Health Modules', href: '/modules', icon: 'BeakerIcon', color: 'purple' }
    ]},
    { title: 'AI Features', items: [
      { name: 'AI Symptom Checker', href: '/symptom-checker', icon: 'SparklesIcon', color: 'pink', badge: 'AI' },
      { name: 'AI Diet Planner', href: '/diet-planner', icon: 'CakeIcon', color: 'orange', badge: 'AI' },
      { name: 'AI Sleep Advisor', href: '/sleep-advisor', icon: 'MoonIcon', color: 'indigo', badge: 'AI' },
      { name: 'AI Skin Analyzer', href: '/skin-analyzer', icon: 'SunIcon', color: 'yellow', badge: 'AI' },
      { name: 'AI Skin Care', href: '/skin-care-ai', icon: 'SparklesIcon', color: 'pink', badge: 'AI' },
      { name: 'AI Chat', href: '/ai-chat', icon: 'ChatBubbleLeftRightIcon', color: 'green', badge: 'AI' }
    ]},
    { title: 'Health', items: [
      { name: 'Report Analyzer', href: '/analyzer', icon: 'DocumentTextIcon', color: 'cyan' },
      { name: 'Family Hub', href: '/family', icon: 'UsersIcon', color: 'green' },
      ...(user?.profile?.gender === 'female' 
        ? [{ name: "Women's Health", href: '/womens-health', icon: 'HeartIcon', color: 'pink' }]
        : user?.profile?.gender === 'male'
        ? [{ name: "Men's Health", href: '/mens-health', icon: 'FireIcon', color: 'blue' }]
        : [{ name: "Women's Health", href: '/womens-health', icon: 'HeartIcon', color: 'pink' },
           { name: "Men's Health", href: '/mens-health', icon: 'FireIcon', color: 'blue' }])
    ]},
    { title: 'Personal', items: [
      { name: 'Profile', href: '/profile', icon: 'UserIcon', color: 'purple' },
      { name: 'Settings', href: '/settings', icon: 'Cog6ToothIcon', color: 'gray' }
    ]}
  ];

  const moduleIcons = {
    'womens-health': { icon: '👩', color: 'pink' }, 'mens-health': { icon: '👨', color: 'blue' },
    'chronic-condition': { icon: '❤️', color: 'red' }, 'medication': { icon: '💊', color: 'purple' },
    'sleep': { icon: '😴', color: 'indigo' }, 'fitness': { icon: '💪', color: 'orange' },
    'nutrition': { icon: '🥗', color: 'green' }, 'mental-wellness': { icon: '🧠', color: 'yellow' },
    'pregnancy-tracker': { icon: '🤰', color: 'pink' }, 'elderly-care': { icon: '👵', color: 'gray' }
  };

  const enabledModules = (user?.enabledModules || []).filter(m => 
    !(user?.profile?.gender === 'male' && (m === 'womens-health' || m === 'pregnancy-tracker')) &&
    !(user?.profile?.gender === 'female' && m === 'mens-health')
  );

  const Tooltip = ({ children }) => (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50 pointer-events-none"
    >
      {children}
      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
    </motion.div>
  );

  return (
    <motion.div
      initial={{ width: isCollapsed ? 80 : 256 }}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3 }}
      className={`fixed inset-y-0 left-0 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl z-50 overflow-hidden ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="flex flex-col h-full relative">
        <button
          onClick={() => {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            window.dispatchEvent(new CustomEvent('sidebarCollapsed', { detail: { collapsed: newState } }));
          }}
          className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg z-10"
        >
          {isCollapsed ? <Icons.ChevronRightIcon className="w-4 h-4" /> : <Icons.ChevronLeftIcon className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start pl-4'} h-20 border-b`}>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          {!isCollapsed && (
            <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              CareLens AI
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          {navConfig.map(group => group.items.length > 0 && (
            <div key={group.title} className="mb-6">
              {!isCollapsed && <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">{group.title}</h3>}
              {group.items.map(item => {
                const Icon = Icons[item.icon];
                const isActive = location.pathname === item.href;
                const colors = colorMap[item.color] || colorMap.gray;
                
                return (
                  <div key={item.name} className="relative" 
                       onMouseEnter={() => setHoveredItem(item.name)} 
                       onMouseLeave={() => setHoveredItem(null)}>
                    <NavLink
                      to={item.href}
                      className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-3 py-2.5 rounded-xl transition-all ${
                        isActive ? colors.active : `text-gray-600 ${colors.hover}`
                      }`}
                    >
                      <div className="relative">
                        <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                        {item.badge && !isCollapsed && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full ml-2">
                              AI
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                    {isCollapsed && hoveredItem === item.name && <Tooltip>{item.name}</Tooltip>}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Dynamic Modules */}
          {enabledModules.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              {!isCollapsed && <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase">Your Modules</h3>}
              {enabledModules.map(module => {
                const info = moduleIcons[module] || { icon: '📋', color: 'gray' };
                const isActive = location.pathname === `/module/${module}`;
                
                return (
                  <div key={module} className="relative"
                       onMouseEnter={() => setHoveredItem(module)}
                       onMouseLeave={() => setHoveredItem(null)}>
                    <NavLink
                      to={`/module/${module}`}
                      className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-3 py-2.5 rounded-xl transition-all ${
                        isActive ? colorMap[info.color].active : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>{info.icon}</span>
                      {!isCollapsed && (
                        <span className="text-sm font-medium truncate">
                          {module.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      )}
                    </NavLink>
                    {isCollapsed && hoveredItem === module && <Tooltip>{module.split('-').join(' ')}</Tooltip>}
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t bg-gradient-to-br from-gray-50 to-white">
          <div className={`flex ${isCollapsed ? 'flex-col items-center' : 'items-center'}`}>
            <div className="relative">
              <div className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg`}>
                <span className="text-white font-bold text-lg">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            </div>
            
            {!isCollapsed && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-500">Online</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-green-50 px-2 py-0.5 rounded-full">
                    <HeartIconSolid className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-bold text-green-700">85</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isCollapsed && (
            <div className="flex justify-center mt-3 space-x-2">
              <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Icons.BellIcon className="w-4 h-4" /></button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Icons.QuestionMarkCircleIcon className="w-4 h-4" /></button>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="px-4 py-2 bg-gray-50 border-t flex justify-between text-xs">
            <span className="flex items-center"><Icons.FireIcon className="w-3 h-3 text-orange-500 mr-1" />2.4k steps</span>
            <span className="flex items-center"><Icons.MoonIcon className="w-3 h-3 text-indigo-500 mr-1" />7.5h</span>
            <span className="flex items-center"><Icons.BeakerIcon className="w-3 h-3 text-blue-500 mr-1" />6/8</span>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </motion.div>
  );
};

export default Sidebar;