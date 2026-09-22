import { Link, useLocation } from 'react-router-dom';
import {
  Home, Search, Bookmark, FileText, FolderOpen, Clock,
  Sparkles, Award, Map, Bell, User, Settings
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Find Scholarships', path: '/find-scholarships', icon: Search },
    { name: 'Saved Scholarships', path: '/saved-scholarships', icon: Bookmark },
    { name: 'Applications', path: '/applications', icon: FileText },
    { name: 'Documents & OCR', path: '/documents', icon: FolderOpen },
    { name: 'Deadlines', path: '/deadlines', icon: Clock },
    { name: 'AI Copilot', path: '/copilot', icon: Sparkles },
    { name: 'Portfolio', path: '/portfolio', icon: Award },
    { name: 'Opportunity Map', path: '/opportunity-map', icon: Map },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-300 shrink-0">
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          ScholarPilot AI
        </span>
      </div>
      
      <div className="flex flex-col flex-1 overflow-y-auto pt-4 pb-4">
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-3 py-2.5 text-xs font-semibold rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
