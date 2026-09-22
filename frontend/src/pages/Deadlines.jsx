import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import apiClient from '../api/client';

const Deadlines = () => {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const fetchDeadlines = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/applications/deadlines/');
      setDeadlines(res.data.deadlines || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Upcoming Deadlines Timeline</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Priority view of scholarship submission cut-off dates.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading timeline...</div>
        ) : deadlines.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold">No upcoming deadlines found.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-blue-500 ml-4 space-y-6 py-2">
            {deadlines.map((item, idx) => (
              <div key={idx} className="relative pl-6">
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{item.scholarship_name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{item.provider} • Application Progress: {item.progress}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-full">
                      <Clock size={12} /> {item.deadline}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Match: {item.match_score}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Deadlines;
