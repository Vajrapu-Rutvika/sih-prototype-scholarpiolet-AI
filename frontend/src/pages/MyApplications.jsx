import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, PlayCircle, Plus, Upload, X, ShieldAlert, TrendingUp, Check, ArrowRight, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/applications/');
      const list = response.data.results || response.data || [];
      setApplications(list);
      
      // If modal is open, refresh selected application
      if (selectedApp) {
        const updated = list.find(a => a.id === selectedApp.id);
        if (updated) setSelectedApp(updated);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await apiClient.patch(`/applications/${appId}/`, { status: newStatus });
      await fetchApplications();
    } catch (err) {
      console.error("Error updating application status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleChecklist = async (appId, itemId, currentStatus) => {
    try {
      await apiClient.patch(`/applications/checklist/${itemId}/`, {
        is_completed: !currentStatus
      });

      // Update local state and selected modal state
      setApplications(prev => prev.map(app => {
        if (app.id === appId) {
          const updatedChecklists = (app.checklists || []).map(item =>
            item.id === itemId ? { ...item, is_completed: !currentStatus } : item
          );
          const completedCount = updatedChecklists.filter(c => c.is_completed).length;
          const newProgress = updatedChecklists.length > 0
            ? Math.round((completedCount / updatedChecklists.length) * 100)
            : 0;
          const updatedApp = { ...app, checklists: updatedChecklists, progress: newProgress };
          if (selectedApp && selectedApp.id === appId) {
            setSelectedApp(updatedApp);
          }
          return updatedApp;
        }
        return app;
      }));
    } catch (err) {
      console.error("Error toggling checklist item:", err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"><CheckCircle className="w-3 h-3 mr-1 text-emerald-600" /> Approved</span>;
      case 'APPLIED':
      case 'UNDER_REVIEW':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"><Clock className="w-3 h-3 mr-1 text-blue-600" /> {status.replace('_', ' ')}</span>;
      case 'PREPARING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"><Clock className="w-3 h-3 mr-1 text-amber-600" /> Preparing</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"><AlertCircle className="w-3 h-3 mr-1 text-red-600" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"><FileText className="w-3 h-3 mr-1" /> {status}</span>;
    }
  };

  // Dashboard Summary Counters
  const totalApps = applications.length;
  const preparingCount = applications.filter(a => a.status === 'PREPARING' || a.status === 'SAVED').length;
  const appliedCount = applications.filter(a => a.status === 'APPLIED' || a.status === 'UNDER_REVIEW').length;
  const approvedCount = applications.filter(a => a.status === 'APPROVED').length;
  const actionNeededApps = applications.filter(a => (a.missing_documents && a.missing_documents.length > 0) || a.progress < 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Application Tracking & Lifecycle</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage active scholarship applications, missing documents, readiness, and timelines.</p>
        </div>
        <Link
          to="/find-scholarships"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} /> Start New Application
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          {error}
        </div>
      )}

      {/* DASHBOARD STATISTICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Applications</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalApps}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">In Preparation</span>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{preparingCount}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Applied / Review</span>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{appliedCount}</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Approved</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</p>
        </div>
      </div>

      {/* ACTION NEEDED ALERT BANNER */}
      {actionNeededApps.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{actionNeededApps.length} Application(s) Require Action:</span>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800 dark:text-amber-400">
              {actionNeededApps.slice(0, 3).map(app => (
                <li key={app.id}>
                  <strong>{app.scholarship_details?.name || 'Scholarship'}</strong>: {app.next_action || 'Upload missing documents'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* APPLICATIONS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No active applications</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">You haven't started tracking any scholarship applications yet.</p>
            <Link
              to="/find-scholarships"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Scholarships
            </Link>
          </div>
        ) : (
          applications.map(app => {
            const sch = app.scholarship_details || {};
            return (
              <div key={app.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {getStatusBadge(app.status)}
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        {app.match_score !== null && app.match_score !== undefined ? `${app.match_score}% Match` : 'Match N/A'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                      {sch.name || 'Scholarship Application'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {sch.provider || 'Official Provider'}
                    </p>

                    <p className="font-extrabold text-slate-900 dark:text-white text-base mt-3">
                      {sch.amount ? `₹${parseFloat(sch.amount).toLocaleString('en-IN')}` : 'Funding Available'}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Deadline:</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">{app.scholarship_details?.deadline || 'Deadline not verified'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Doc Readiness:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{app.document_readiness !== null && app.document_readiness !== undefined ? `${app.document_readiness}%` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:w-2/3 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Checklist Progress
                      </span>
                      <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{app.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                      <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${app.progress}%` }}></div>
                    </div>
                  </div>

                  {/* Missing Documents & Next Action snippet */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">Next Action:</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">{app.next_action || 'Complete checklist'}</span>
                    </div>
                    {app.missing_documents && app.missing_documents.length > 0 && (
                      <p className="text-amber-600 dark:text-amber-400 font-medium">
                        ⚠ Missing Documents: {app.missing_documents.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => navigate('/documents')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Upload size={14} /> Go to Document Vault
                    </button>

                    <button
                      onClick={() => setSelectedApp(app)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1"
                    >
                      Manage Application <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* COMPLETE APPLICATION MANAGEMENT MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header & Status Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    ID #{selectedApp.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Created: {new Date(selectedApp.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedApp.scholarship_details?.name || 'Scholarship Application'}
                </h3>
                <p className="text-xs text-slate-500">{selectedApp.scholarship_details?.provider}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Application Lifecycle Status</label>
                  <select
                    value={selectedApp.status}
                    onChange={(e) => handleStatusChange(selectedApp.id, e.target.value)}
                    disabled={updatingStatus}
                    className="mt-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="SAVED">Saved</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="APPLIED">Applied</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* SECTION 1: 3-TIER SCORE METRIC CARDS */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50">
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">Match Score</span>
                <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">{selectedApp.match_score !== null && selectedApp.match_score !== undefined ? `${selectedApp.match_score}%` : 'N/A'}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Eligibility</span>
                <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 mt-2">
                  {selectedApp.eligibility_status === 'ELIGIBLE' ? '✓ Eligible' : '⚠ Needs Verification'}
                </p>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Doc Readiness</span>
                <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-0.5">{selectedApp.document_readiness !== null && selectedApp.document_readiness !== undefined ? `${selectedApp.document_readiness}%` : 'N/A'}</p>
              </div>
            </div>

            {/* SECTION 2: WHY YOU MATCH */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} className="text-blue-600" /> Why You Match This Scheme:
              </h4>
              <div className="space-y-1">
                {selectedApp.matched_criteria?.map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: DOCUMENT AUDIT & MISSING DOCUMENTS */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Document Requirement Audit
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {selectedApp.uploaded_documents?.map((d, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{d.document_type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      d.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))}
                {selectedApp.missing_documents?.map((mDoc, idx) => (
                  <div key={idx} className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex justify-between items-center">
                    <span className="font-semibold text-amber-900 dark:text-amber-300">⚠ {mDoc}</span>
                    <button
                      onClick={() => navigate('/documents')}
                      className="px-2 py-1 bg-amber-600 text-white text-[10px] font-bold rounded-lg hover:bg-amber-700"
                    >
                      Upload Now
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 4: WHAT IS STOPPING ME? (BLOCKERS) */}
            {selectedApp.blockers && selectedApp.blockers.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 space-y-2 text-xs text-red-900 dark:text-red-300">
                <h4 className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertCircle size={14} className="text-red-600" /> What Is Stopping Me From Applying?
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedApp.blockers.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* SECTION 5: HOW CAN I IMPROVE MY CHANCES? */}
            {selectedApp.acceptance_improvements && selectedApp.acceptance_improvements.length > 0 && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs text-indigo-900 dark:text-indigo-300">
                <h4 className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <TrendingUp size={14} className="text-indigo-600" /> How To Improve Application Readiness:
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {selectedApp.acceptance_improvements.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* SECTION 6: INTERACTIVE CHECKLIST */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Application Checklist ({selectedApp.checklists?.filter(c => c.is_completed).length || 0} / {selectedApp.checklists?.length || 0})
                </h4>
                <span className="text-xs font-extrabold text-blue-600">{selectedApp.progress}%</span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedApp.checklists?.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleChecklist(selectedApp.id, item.id, item.is_completed)}
                    className="flex items-center cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2.5 transition-colors ${
                      item.is_completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                    }`}>
                      {item.is_completed && <Check size={12} />}
                    </div>
                    <span className={item.is_completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200 font-semibold'}>
                      {item.item_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 7: STATUS HISTORY TIMELINE */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Application History
              </h4>
              {selectedApp.history && selectedApp.history.length > 0 ? (
                <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-4 space-y-4">
                  {selectedApp.history.map((hist) => (
                    <div key={hist.id} className="relative text-xs">
                      <div className="absolute -left-6 top-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white dark:border-slate-900"></div>
                      <p className="text-slate-900 dark:text-white font-semibold">
                        Status changed from <span className="text-slate-500">{hist.previous_status || 'None'}</span> to <span className="text-blue-600">{hist.new_status}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(hist.changed_at).toLocaleString()} • by {hist.changed_by_name || 'System'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No history recorded yet.</p>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500">
                Deadline: <strong className="text-amber-600">{selectedApp.scholarship_details?.deadline || 'Deadline not verified'}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
                {selectedApp.scholarship_details?.official_scheme_url && (
                  <a
                    href={selectedApp.scholarship_details.official_scheme_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    Official Scholarship Source <ExternalLink size={14} />
                  </a>
                )}
                {selectedApp.scholarship_details?.official_application_url && (
                  <a
                    href={selectedApp.scholarship_details.official_application_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    {selectedApp.scholarship_details.application_type === 'DIRECT_FORM' ? 'Apply Now' :
                     selectedApp.scholarship_details.application_type === 'LOGIN_PORTAL' ? 'Apply on Official Portal' :
                     selectedApp.scholarship_details.application_type === 'NSP' ? 'Apply on National Scholarship Portal' :
                     selectedApp.scholarship_details.application_type === 'JNANABHUMI' ? 'Apply on JnanaBhumi' :
                     'Apply Officially'} <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
