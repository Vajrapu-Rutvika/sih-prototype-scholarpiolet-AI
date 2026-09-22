import { useState } from 'react';
import { Settings, Moon, Sun, Bell, Shield, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings & Preferences</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage platform appearance, alert notifications, and security.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
        {/* Appearance */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">Theme Appearance</h3>
            <p className="text-xs text-slate-500 mt-1">Toggle between Light mode and Dark mode styling.</p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</span>
          </button>
        </div>

        {/* Notifications */}
        <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Bell size={18} /> Notification Preferences
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700 dark:text-slate-300">Email Alerts for New Matches</span>
            <input type="checkbox" checked={emailAlerts} onChange={() => setEmailAlerts(!emailAlerts)} className="w-4 h-4 text-blue-600 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700 dark:text-slate-300">SMS Deadline Reminders</span>
            <input type="checkbox" checked={smsAlerts} onChange={() => setSmsAlerts(!smsAlerts)} className="w-4 h-4 text-blue-600 rounded" />
          </div>
        </div>

        {/* Security */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Shield size={18} /> Account Security
          </h3>
          <p className="text-xs text-slate-500">Your account is secured with JWT Token authentication and Django password hashing.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
