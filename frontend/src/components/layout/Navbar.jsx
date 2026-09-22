import { useState, useEffect, useRef } from 'react';
import { Bell, User, Search, Menu, Sun, Moon, LogOut, CheckCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        apiClient.get('/notifications/'),
        apiClient.get('/notifications/unread-count/')
      ]);
      setNotifications(listRes.data.results || listRes.data || []);
      setUnreadCount(countRes.data.unread_count || 0);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/mark-read/${id}/`);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/mark-read/');
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center w-full h-16 px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between w-full">
        {/* Mobile menu button */}
        <div className="flex items-center lg:hidden">
          <button className="text-slate-500 hover:text-slate-600 focus:outline-none">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="hidden sm:flex items-center px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Search scholarships..."
            className="bg-transparent border-none focus:outline-none text-sm text-slate-700 dark:text-slate-300 w-64"
          />
        </div>

        {/* Right side icons */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-slate-500 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="relative p-2 text-slate-400 hover:text-slate-500 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              )}
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden z-50">
                <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <CheckCheck className="w-3 h-3 mr-1" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-4 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!notif.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-medium ${!notif.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {notif.title}
                          </h4>
                          {notif.priority === 'URGENT' || notif.priority === 'HIGH' ? (
                            <span className="text-[10px] uppercase font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                              {notif.priority}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          {notif.message}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                          {!notif.is_read && (
                            <button 
                              onClick={() => markAsRead(notif.id)}
                              className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Link to="/profile" className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.first_name ? user.first_name[0].toUpperCase() : <User className="w-5 h-5" />}
              </div>
              {user && (
                <span className="hidden md:inline text-sm font-medium text-slate-700 dark:text-slate-200">
                  {user.first_name || user.email}
                </span>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-950/50"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
