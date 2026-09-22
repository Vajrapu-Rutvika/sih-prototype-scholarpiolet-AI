import { useState, useEffect } from 'react';
import { Map, MapPin, Building, GraduationCap, CheckCircle } from 'lucide-react';
import apiClient from '../api/client';

const OpportunityMap = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/ai/matches/');
      setScholarships(res.data.matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Regional Opportunity Map</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Geographic distribution of state and central scholarship schemes.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-[350px]">
        <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 font-semibold text-sm">
          <Map size={18} /> Active Regional Distribution (India)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 text-center py-12 text-slate-500">Loading map data...</div>
          ) : scholarships.map(item => (
            <div key={item.scholarship_id} className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {item.match_score}% Match
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{item.deadline}</span>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.scholarship_name}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12} /> {item.provider}</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OpportunityMap;
