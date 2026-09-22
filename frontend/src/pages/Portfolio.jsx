import { useState, useEffect } from 'react';
import { Award, User, GraduationCap, CheckCircle, FileText, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const Portfolio = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    setLoading(true);
    try {
      const [profRes, readRes] = await Promise.all([
        apiClient.get('/auth/profile/').catch(() => ({ data: null })),
        apiClient.get('/documents/readiness/').catch(() => ({ data: null }))
      ]);
      setProfile(profRes.data);
      setReadiness(readRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Student Scholarship Portfolio</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Verified academic profile, document credentials & achievement resume.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-md">
            {user?.first_name?.[0]?.toUpperCase() || <User size={32} />}
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{user?.first_name} {user?.last_name}</h3>
          <p className="text-xs text-slate-500">{user?.email}</p>
          <span className="mt-3 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full">
            {profile?.course || 'Undergraduate Student'}
          </span>

          <div className="w-full border-t border-slate-100 dark:border-slate-800 mt-6 pt-4 space-y-2 text-left text-xs text-slate-600 dark:text-slate-300">
            <p><strong>Institution:</strong> {profile?.institution || 'Not specified'}</p>
            <p><strong>State:</strong> {profile?.state || 'Not specified'}</p>
            <p><strong>CGPA:</strong> {profile?.cgpa || 'Not specified'}</p>
            <p><strong>Family Income:</strong> {profile?.annual_family_income ? `₹${profile.annual_family_income.toLocaleString('en-IN')}` : 'Not specified'}</p>
          </div>
        </div>

        {/* Credentials & Document Readiness */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="text-emerald-500" size={18} /> Document Readiness Score
            </h3>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full border-4 border-blue-600 flex items-center justify-center text-xl font-bold text-blue-600 dark:text-blue-400">
                {readiness?.score || 100}%
              </div>
              <div className="flex-1 text-sm text-slate-600 dark:text-slate-300">
                <p className="font-medium">Uploaded Documents: {readiness?.uploaded?.length || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Missing required scheme documents: {readiness?.missing?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={18} /> Skills & Achievements
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Technical Skills:</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-4">{profile?.technical_skills || 'None specified yet'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Certifications & Awards:</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{profile?.achievements || 'None specified yet'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
