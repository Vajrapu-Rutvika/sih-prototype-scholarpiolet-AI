import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import FindScholarships from './pages/FindScholarships';
import SavedScholarships from './pages/SavedScholarships';
import MyApplications from './pages/MyApplications';
import Documents from './pages/Documents';
import Deadlines from './pages/Deadlines';
import Copilot from './pages/Copilot';
import Portfolio from './pages/Portfolio';
import OpportunityMap from './pages/OpportunityMap';
import NotificationsPage from './pages/NotificationsPage';
import Profile from './pages/Profile';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/Login';
import Register from './pages/Register';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading ScholarPilot AI...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="find-scholarships" element={<FindScholarships />} />
        <Route path="saved-scholarships" element={<SavedScholarships />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="documents" element={<Documents />} />
        <Route path="deadlines" element={<Deadlines />} />
        <Route path="copilot" element={<Copilot />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="opportunity-map" element={<OpportunityMap />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
