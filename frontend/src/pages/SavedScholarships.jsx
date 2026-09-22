import { useState, useEffect } from 'react';
import { Bookmark, Building, GraduationCap, Trash2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const SavedScholarships = () => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/scholarships/saved/');
      setSaved(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await apiClient.delete(`/scholarships/saved/${id}/`);
      setSaved(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyAction = async (scholarshipId) => {
    setApplyingId(scholarshipId);
    try {
      await apiClient.post(`/applications/start/${scholarshipId}/`);
      navigate('/applications');
    } catch (err) {
      console.error("Error creating application:", err);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Saved Scholarships</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Bookmarked opportunities for quick reference and application.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-44 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : saved.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No saved scholarships yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Browse opportunities and bookmark ones you like.</p>
          <Link to="/find-scholarships" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            Find Scholarships
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {saved.map(item => {
            const s = item.scholarship || item;
            return (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{s.name}</h3>
                    <button onClick={() => handleRemove(item.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1"><Building size={14} /> {s.provider}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 block uppercase">Deadline</span>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{s.deadline}</span>
                  </div>
                  <button 
                    onClick={() => handleApplyAction(s.id)}
                    disabled={applyingId === s.id}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50 shadow-sm"
                  >
                    {applyingId === s.id ? '...' : 'APPLY NOW'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedScholarships;
