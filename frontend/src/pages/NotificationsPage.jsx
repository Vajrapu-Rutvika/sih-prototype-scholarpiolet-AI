import { useState, useEffect } from 'react';
import { Bell, Check, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import apiClient from '../api/client';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications/');
      setNotifications(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.patch('/notifications/mark-read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Notifications Center</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time alerts for scheme matches, deadlines, and document status.</p>
        </div>
        <button onClick={markAllRead} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1">
          <Check size={14} /> Mark All as Read
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold">No notifications right now.</p>
          </div>
        ) : (
          notifications.map(item => (
            <div key={item.id} className={`p-4 flex items-start gap-3 transition-colors ${item.is_read ? 'opacity-70' : 'bg-blue-50/40 dark:bg-blue-950/20'}`}>
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shrink-0">
                {item.notification_type === 'NEW_MATCH' ? <Sparkles size={18} /> : <Clock size={18} />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{item.message}</p>
                <span className="text-[10px] text-slate-400 mt-2 block">{new Date(item.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
