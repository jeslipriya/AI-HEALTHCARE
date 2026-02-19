import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BellIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-800">Welcome back, {user?.firstName}!</h2>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <BellIcon className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;