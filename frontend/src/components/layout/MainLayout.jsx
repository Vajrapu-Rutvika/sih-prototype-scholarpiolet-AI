import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import FloatingCopilot from '../common/FloatingCopilot';

const MainLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Sidebar />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Navbar />
        <main className="w-full grow p-6">
          <Outlet />
        </main>
        <FloatingCopilot />
      </div>
    </div>
  );
};

export default MainLayout;
