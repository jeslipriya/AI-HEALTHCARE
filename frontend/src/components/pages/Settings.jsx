import React, { useState } from 'react';
import { BellIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, push: true, sms: false });
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });

  const tabs = [
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'privacy', name: 'Privacy', icon: LockClosedIcon }
  ];

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success(`${key} ${!notifications[key] ? 'enabled' : 'disabled'}`);
  };

  const handlePasswordChange = () => {
    if (!password.current || !password.new || !password.confirm) 
      return toast.error('Fill all fields');
    if (password.new !== password.confirm) 
      return toast.error('Passwords mismatch');
    if (password.new.length < 6) 
      return toast.error('Password too short');
    
    setLoading(true);
    setTimeout(() => {
      toast.success('Password changed!');
      setPassword({ current: '', new: '', confirm: '' });
      setLoading(false);
    }, 1000);
  };

  const NotificationItem = ({ label, desc, keyName }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div><p className="font-medium">{label}</p><p className="text-sm text-gray-600">{desc}</p></div>
      <button onClick={() => toggleNotification(keyName)} 
        className={`px-4 py-2 rounded-lg ${notifications[keyName] ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
        {notifications[keyName] ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
            <tab.icon className="w-5 h-5" /><span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
          <div className="space-y-3">
            <NotificationItem label="Email Notifications" desc="Receive email alerts" keyName="email" />
            <NotificationItem label="Push Notifications" desc="Browser notifications" keyName="push" />
            <NotificationItem label="SMS Notifications" desc="Text message alerts" keyName="sms" />
          </div>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>
          <div className="space-y-3 max-w-md">
            <input type="password" className="input-field" placeholder="Current password" 
              value={password.current} onChange={e => setPassword({...password, current: e.target.value})} />
            <input type="password" className="input-field" placeholder="New password (min 6 chars)" 
              value={password.new} onChange={e => setPassword({...password, new: e.target.value})} />
            <input type="password" className="input-field" placeholder="Confirm new password" 
              value={password.confirm} onChange={e => setPassword({...password, confirm: e.target.value})} />
            <button onClick={handlePasswordChange} disabled={loading} className="btn-primary">
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-2">Privacy Settings</h4>
            <label className="flex items-center space-x-2 text-sm">
              <input type="checkbox" className="rounded" /> Share anonymized data for research
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;