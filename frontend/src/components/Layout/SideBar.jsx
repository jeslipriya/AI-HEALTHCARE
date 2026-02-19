import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  UserIcon,
  DocumentTextIcon,
  UsersIcon,
  Cog6ToothIcon,
  BeakerIcon,
  MoonIcon,
  CakeIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  HeartIcon,
  SunIcon,
  FireIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Close tooltip on collapse
  useEffect(() => {
    if (isCollapsed) {
      setHoveredItem(null);
    }
  }, [isCollapsed]);

  // Filter health items based on user gender
  const getHealthItems = () => {
    const healthItems = [
      { name: 'Report Analyzer', href: '/analyzer', icon: DocumentTextIcon, color: 'cyan' },
      { name: 'Family Hub', href: '/family', icon: UsersIcon, color: 'green' },
    ];

    // Add gender-specific health modules
    if (user?.profile?.gender === 'female') {
      healthItems.push(
        { name: "Women's Health", href: '/womens-health', icon: HeartIcon, color: 'pink' }
      );
    } else if (user?.profile?.gender === 'male') {
      healthItems.push(
        { name: "Men's Health", href: '/mens-health', icon: FireIcon, color: 'blue' }
      );
    } else {
      // If gender not specified, show both (or none based on preference)
      healthItems.push(
        { name: "Women's Health", href: '/womens-health', icon: HeartIcon, color: 'pink' },
        { name: "Men's Health", href: '/mens-health', icon: FireIcon, color: 'blue' }
      );
    }

    return healthItems;
  };

  // Navigation items organized by category
  const navigationGroups = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, color: 'blue' },
        { name: 'Health Modules', href: '/modules', icon: BeakerIcon, color: 'purple' },
      ]
    },
    {
      title: 'AI Features',
      items: [
        { name: 'AI Symptom Checker', href: '/symptom-checker', icon: SparklesIcon, color: 'pink', badge: 'AI' },
        { name: 'AI Diet Planner', href: '/diet-planner', icon: CakeIcon, color: 'orange', badge: 'AI' },
        { name: 'AI Sleep Advisor', href: '/sleep-advisor', icon: MoonIcon, color: 'indigo', badge: 'AI' },
        { name: 'AI Skin Analyzer', href: '/skin-analyzer', icon: SunIcon, color: 'yellow', badge: 'AI' },
        { name: 'AI Skin Care', href: '/skin-care-ai', icon: SparklesIcon, color: 'pink', badge: 'AI' },
        { name: 'AI Chat', href: '/ai-chat', icon: ChatBubbleLeftRightIcon, color: 'green', badge: 'AI' },
      ]
    },
    {
      title: 'Health',
      items: getHealthItems()
    },
    {
      title: 'Personal',
      items: [
        { name: 'Profile', href: '/profile', icon: UserIcon, color: 'purple' },
        { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, color: 'gray' },
      ]
    }
  ];

  // Module icons mapping
  const moduleIcons = {
    'womens-health': { icon: '👩', color: 'pink' },
    'mens-health': { icon: '👨', color: 'blue' },
    'chronic-condition': { icon: '❤️', color: 'red' },
    'medication': { icon: '💊', color: 'purple' },
    'sleep': { icon: '😴', color: 'indigo' },
    'fitness': { icon: '💪', color: 'orange' },
    'nutrition': { icon: '🥗', color: 'green' },
    'mental-wellness': { icon: '🧠', color: 'yellow' },
    'pregnancy-tracker': { icon: '🤰', color: 'pink' },
    'elderly-care': { icon: '👵', color: 'gray' },
  };

  const enabledModules = user?.enabledModules || [];

  // Filter enabled modules based on user gender
  const filteredEnabledModules = enabledModules.filter(module => {
    // Hide women's health modules for male users
    if (user?.profile?.gender === 'male' && 
        (module === 'womens-health' || module === 'pregnancy-tracker')) {
      return false;
    }
    // Hide men's health modules for female users
    if (user?.profile?.gender === 'female' && module === 'mens-health') {
      return false;
    }
    return true;
  });

  // Get color classes for active/hover states
  const getColorClasses = (color) => {
    const colors = {
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      pink: 'text-pink-600 bg-pink-50 border-pink-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200',
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      green: 'text-green-600 bg-green-50 border-green-200',
      cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      red: 'text-red-600 bg-red-50 border-red-200',
      gray: 'text-gray-600 bg-gray-50 border-gray-200',
    };
    return colors[color] || colors.gray;
  };

  const getHoverColorClasses = (color) => {
    const colors = {
      blue: 'hover:bg-blue-50 hover:text-blue-600',
      purple: 'hover:bg-purple-50 hover:text-purple-600',
      pink: 'hover:bg-pink-50 hover:text-pink-600',
      orange: 'hover:bg-orange-50 hover:text-orange-600',
      indigo: 'hover:bg-indigo-50 hover:text-indigo-600',
      yellow: 'hover:bg-yellow-50 hover:text-yellow-600',
      green: 'hover:bg-green-50 hover:text-green-600',
      cyan: 'hover:bg-cyan-50 hover:text-cyan-600',
      red: 'hover:bg-red-50 hover:text-red-600',
      gray: 'hover:bg-gray-50 hover:text-gray-600',
    };
    return colors[color] || colors.gray;
  };

  return (
    <motion.div
      initial={{ width: isCollapsed ? 80 : 256 }}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`fixed inset-y-0 left-0 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl z-50 overflow-hidden ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full relative">
        <button
          onClick={() => {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            // Dispatch custom event for Layout to listen
            window.dispatchEvent(new CustomEvent('sidebarCollapsed', { 
              detail: { collapsed: newState } 
            }));
            // Call onCollapse prop if provided
            if (props.onCollapse) {
              props.onCollapse(newState);
            }
          }}
          className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all z-10"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
        </button>

        {/* Logo */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start pl-4'} h-20 border-b border-gray-100`}>
          {isCollapsed ? (
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">A</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                AURA Health
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#e2e8f0 transparent'
        }}>
          <style>{`
            nav::-webkit-scrollbar {
              width: 4px;
            }
            nav::-webkit-scrollbar-track {
              background: transparent;
            }
            nav::-webkit-scrollbar-thumb {
              background: #e2e8f0;
              border-radius: 20px;
            }
            nav::-webkit-scrollbar-thumb:hover {
              background: #cbd5e1;
            }
          `}</style>
          
          {navigationGroups.map((group) => (
            group.items.length > 0 && (
              <div key={group.title} className="mb-6">
                {!isCollapsed && (
                  <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    const colorClasses = getColorClasses(item.color);
                    const hoverClasses = getHoverColorClasses(item.color);

                    return (
                      <div
                        key={item.name}
                        className="relative"
                        onMouseEnter={() => setHoveredItem(item.name)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <NavLink
                          to={item.href}
                          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-3 py-2.5 rounded-xl transition-all duration-200 ${
                            isActive
                              ? `${colorClasses} shadow-sm`
                              : `text-gray-600 ${hoverClasses}`
                          }`}
                        >
                          <div className="relative">
                            <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                            {item.badge && !isCollapsed && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          {!isCollapsed && (
                            <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                          )}
                          {item.badge && !isCollapsed && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full ml-2">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>

                        {/* Tooltip for collapsed mode */}
                        {isCollapsed && hoveredItem === item.name && (
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50 pointer-events-none"
                          >
                            {item.name}
                            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ))}

          {/* Dynamic Modules Section */}
          {filteredEnabledModules.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              {!isCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Your Modules
                </h3>
              )}
              <div className="space-y-1">
                {filteredEnabledModules.map((module) => {
                  const moduleInfo = moduleIcons[module] || { icon: '📋', color: 'gray' };
                  const isActive = location.pathname === `/module/${module}`;
                  
                  return (
                    <div
                      key={module}
                      className="relative"
                      onMouseEnter={() => setHoveredItem(module)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <NavLink
                        to={`/module/${module}`}
                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          isActive
                            ? `${getColorClasses(moduleInfo.color)} shadow-sm`
                            : `text-gray-600 hover:bg-gray-50`
                        }`}
                      >
                        <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>
                          {moduleInfo.icon}
                        </span>
                        {!isCollapsed && (
                          <span className="text-sm font-medium truncate">
                            {module.split('-').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </span>
                        )}
                      </NavLink>

                      {/* Tooltip for collapsed mode */}
                      {isCollapsed && hoveredItem === module && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50 pointer-events-none"
                        >
                          {module.split('-').join(' ')}
                          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white">
          <div className={`flex ${isCollapsed ? 'flex-col items-center' : 'items-center'}`}>
            <div className="relative">
              <div className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg`}>
                <span className="text-white font-bold text-lg">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            </div>
            
            {!isCollapsed && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
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

          {/* Quick Actions for collapsed mode */}
          {isCollapsed && (
            <div className="flex justify-center mt-3 space-x-2">
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <BellIcon className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <QuestionMarkCircleIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats Bar (only when expanded) */}
        {!isCollapsed && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <FireIcon className="w-3 h-3 text-orange-500" />
                <span className="text-gray-600">2.4k steps</span>
              </div>
              <div className="flex items-center space-x-1">
                <MoonIcon className="w-3 h-3 text-indigo-500" />
                <span className="text-gray-600">7.5h</span>
              </div>
              <div className="flex items-center space-x-1">
                <BeakerIcon className="w-3 h-3 text-blue-500" />
                <span className="text-gray-600">6/8</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;