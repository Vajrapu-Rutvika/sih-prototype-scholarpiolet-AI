import { useState, useEffect } from 'react';
import { Award, Clock, FileCheck, Target, Sparkles, ArrowRight, AlertCircle, Bell as BellIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_applications: 0,
    preparing: 0,
    applied: 0,
    approved: 0,
    rejected: 0,
    potential_funding: 0,
    successful_funding: 0
  });

  const [recentNotifications, setRecentNotifications] = useState([]);
  const [urgentApps, setUrgentApps] = useState([]);
  const [topMatch, setTopMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, matchesRes] = await Promise.all([
        apiClient.get('/dashboard/stats/').catch(() => ({ data: {} })),
        apiClient.get('/ai/matches/').catch(() => ({ data: { matches: [] } }))
      ]);

      if (statsRes.data) {
        setStats(statsRes.data.stats || stats);
        setRecentNotifications(statsRes.data.recent_notifications || []);
        setUrgentApps(statsRes.data.applications_needing_action || []);
      }

      const matches = matchesRes.data.matches || [];
      if (matches.length > 0) {
        setTopMatch(matches[0]);
      }

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back! Here's real-time progress on your scholarship journey.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Target} title="Active Applications" value={stats.preparing} color="amber" />
        <StatCard icon={FileCheck} title="Submitted Applications" value={stats.applied} color="blue" />
        <StatCard icon={Award} title="Approved Applications" value={stats.approved} color="green" />
        <StatCard icon={Sparkles} title="Potential Funding" value={`₹${stats.potential_funding.toLocaleString()}`} color="indigo" />
      </div>

      {/* Urgent Actions & AI Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Applications Needing Action */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-red-50/50 dark:bg-red-900/10">
            <h3 className="text-base font-semibold text-red-700 dark:text-red-400 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" /> Applications Needing Action
            </h3>
            <Link to="/applications" className="text-xs text-red-600 dark:text-red-400 font-medium hover:underline">
              Manage All
            </Link>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-slate-500">Checking for urgent actions...</div>
            ) : urgentApps.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                You're all caught up! No applications need urgent action right now.
              </div>
            ) : (
              urgentApps.map((app, idx) => (
                <div key={idx} className="p-6 flex flex-col hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{app.scholarship_details.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Deadline: {app.days_remaining} days remaining</p>
                    </div>
                    <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                      {app.doc_readiness ?? 0}% Ready
                    </span>
                  </div>
                  {app.missing_documents && app.missing_documents.length > 0 ? (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                      Missing: {app.missing_documents[0]}
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 font-medium flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"></span>
                      Incomplete Application Form
                    </p>
                  )}
                  <div className="mt-4">
                    <Link to="/applications" className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center">
                      Continue Application <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* AI Copilot Suggestion */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div>
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <Sparkles className="w-5 h-5 mr-2 text-amber-300 fill-amber-300" /> AI Copilot Insights
              </h3>
              {topMatch ? (
                <p className="text-blue-100 leading-relaxed mb-6 text-sm">
                  You are a <strong>{topMatch.match_score}% match</strong> for the <strong>{topMatch.scholarship_name}</strong>. The deadline is <strong>{topMatch.deadline}</strong>.
                </p>
              ) : (
                <p className="text-blue-100 leading-relaxed mb-6 text-sm">
                  Complete your profile and upload documents to get hyper-accurate AI scholarship recommendations tailored to your background.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Link
                to="/find-scholarships"
                className="inline-flex items-center gap-1.5 bg-white text-indigo-700 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-blue-50 transition-colors shadow-sm"
              >
                View Match <ArrowRight size={16} />
              </Link>
              <Link
                to="/copilot"
                className="inline-flex items-center gap-1.5 bg-blue-700/50 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors border border-blue-400/30"
              >
                Ask AI Assistant
              </Link>
            </div>
          </div>
          
          {/* Recent Notifications */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center">
                <BellIcon className="w-5 h-5 mr-2 text-slate-500" /> Recent Notifications
              </h3>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No recent notifications.
                </div>
              ) : (
                recentNotifications.slice(0, 3).map((notif, idx) => (
                  <div key={idx} className={`p-4 flex items-start ${!notif.is_read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                    <div className="flex-1">
                      <h4 className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{notif.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

function StatCard({ icon: Icon, title, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
