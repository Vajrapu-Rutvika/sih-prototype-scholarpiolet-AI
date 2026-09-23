import { useState, useEffect } from 'react';
import { Search, Filter, Bookmark, Building, GraduationCap, Award, CheckCircle, AlertCircle, Clock, X, ExternalLink, RefreshCw, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const FindScholarships = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const navigate = useNavigate();

  const handleApplyAction = async (scholarshipId) => {
    setApplyingId(scholarshipId);
    try {
      const targetScholarship = scholarships.find(s => s.scholarship_id === scholarshipId);
      
      // Fire backend API in background to track the application
      apiClient.post(`/applications/start/${scholarshipId}/`).catch(err => console.error("Background tracking failed", err));

      if (targetScholarship && targetScholarship.official_application_url) {
        // External scholarship: Open directly
        window.open(targetScholarship.official_application_url, '_blank');
      } else {
        // Internal application: navigate to tracker
        navigate('/applications');
      }
    } catch (err) {
      console.error("Error creating application:", err);
      setError(err.response?.data?.error || 'Failed to start application. Please try again.');
    } finally {
      setApplyingId(null);
    }
  };

  // Filter Drawer State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    eligibility: 'ALL',        // ALL, ELIGIBLE, NOT_ELIGIBLE, NEEDS_VERIFICATION
    amount_order: 'ANY',       // ANY, HIGH_TO_LOW, LOW_TO_HIGH
    sort_by: 'best_match',     // best_match, highest_chance, highest_match, highest_amount, closing_soon, deadline_latest
    category: 'ALL'            // ALL, Government, Private, Merit, Need-based, Women, State, National, Engineering, CSE, Category
  });

  // Temporary filter state inside modal before applying
  const [tempFilters, setTempFilters] = useState({ ...activeFilters });

  useEffect(() => {
    fetchScholarships();
  }, [activeFilters]);

  const fetchScholarships = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        search: searchQuery,
        eligibility: activeFilters.eligibility,
        category: activeFilters.category,
        amount_order: activeFilters.amount_order,
        sort_by: activeFilters.sort_by
      };

      const response = await apiClient.get('/ai/matches/', { params });
      setScholarships(response.data.matches || []);
    } catch (err) {
      console.error("Error fetching scholarships:", err);
      // Fallback to raw scholarship list if match API fails
      try {
        const rawRes = await apiClient.get('/scholarships/');
        const list = rawRes.data.results || rawRes.data || [];
        const formatted = list.map(s => ({
          scholarship_id: s.id,
          scholarship_name: s.name,
          provider: s.provider,
          category: s.category || 'General',
          amount: s.amount ? `₹${parseFloat(s.amount).toLocaleString('en-IN')}` : 'Variable',
          deadline: s.deadline || 'Deadline not verified — please check the official source',
          application_type: s.application_type,
          official_application_url: s.official_application_url,
          official_scheme_url: s.official_scheme_url,
          match_score: null,
          eligibility_status: 'UNKNOWN',
          is_saved: false,
          details: { matched_criteria: [] }
        }));
        setScholarships(formatted);
      } catch (e) {
        setError('Failed to load scholarships. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchScholarships();
  };

  const handleApplyFilters = () => {
    setActiveFilters({ ...tempFilters });
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    const cleared = {
      eligibility: 'ALL',
      amount_order: 'ANY',
      sort_by: 'best_match',
      category: 'ALL'
    };
    setTempFilters(cleared);
    setActiveFilters(cleared);
    setSearchQuery('');
    setShowFilterModal(false);
  };

  const toggleSaveScholarship = async (scholarshipId, currentSaved) => {
    setSavingId(scholarshipId);
    try {
      if (currentSaved) {
        await apiClient.delete(`/scholarships/saved/${scholarshipId}/`);
      } else {
        await apiClient.post('/scholarships/saved/', { scholarship_id: scholarshipId });
      }
      setScholarships(prev => prev.map(s => s.scholarship_id === scholarshipId ? { ...s, is_saved: !currentSaved } : s));
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    } finally {
      setSavingId(null);
    }
  };

  const isFiltered = activeFilters.eligibility !== 'ALL' || 
                     activeFilters.category !== 'ALL' || 
                     activeFilters.amount_order !== 'ANY' || 
                     activeFilters.sort_by !== 'best_match';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Top Header Section with Top-Right FILTER Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Find Scholarships</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Browse all verified government, private, merit, and need-based scholarships matched to your profile.
          </p>
        </div>

        {/* TOP-RIGHT FILTER BUTTON */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setTempFilters({ ...activeFilters });
              setShowFilterModal(true);
            }}
            className={`flex items-center px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm border ${
              isFiltered
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-blue-500'
            }`}
            id="filter-toggle-btn"
          >
            <Filter className="w-4 h-4 mr-2" />
            <span>FILTER</span>
            {isFiltered && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-white text-blue-600 rounded-full font-bold">
                • Active
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar & Quick Indicators */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-24 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
            placeholder="Search by scholarship name, provider, course, or category..."
          />
          <button
            type="submit"
            className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        {isFiltered && (
          <button
            onClick={handleClearFilters}
            className="px-3.5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Active Filter Pills Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium mr-1">Showing:</span>
        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 font-semibold">
          Eligibility: {activeFilters.eligibility === 'ALL' ? 'All Scholarships' : activeFilters.eligibility}
        </span>
        {activeFilters.category !== 'ALL' && (
          <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
            Category: {activeFilters.category}
          </span>
        )}
        {activeFilters.sort_by !== 'best_match' && (
          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full font-semibold">
            Sort: {activeFilters.sort_by.replace('_', ' ')}
          </span>
        )}
        <span className="ml-auto text-slate-500 font-medium">
          {scholarships.length} scholarship{scholarships.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Scholarships Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : scholarships.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No scholarships matched your filters</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Try resetting your filters or adjusting your search keyword to view more opportunities.
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {scholarships.map(scholarship => (
            <ScholarshipCard
              key={scholarship.scholarship_id}
              data={scholarship}
              onSelect={() => setSelectedScholarship(scholarship)}
              onToggleSave={() => toggleSaveScholarship(scholarship.scholarship_id, scholarship.is_saved)}
              isSaving={savingId === scholarship.scholarship_id}
              onApplyAction={() => handleApplyAction(scholarship.scholarship_id)}
              isApplying={applyingId === scholarship.scholarship_id}
            />
          ))}
        </div>
      )}

      {/* FILTER PANEL DRAWER / MODAL */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Scholarship Filters & Sorting</h3>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 text-sm">
              {/* SECTION 1: ELIGIBILITY */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-2">
                  1. Eligibility Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ALL', label: 'All Scholarships' },
                    { id: 'ELIGIBLE', label: 'Eligible for me' },
                    { id: 'NEEDS_VERIFICATION', label: 'Needs verification' },
                    { id: 'NOT_ELIGIBLE', label: 'Not eligible' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTempFilters({ ...tempFilters, eligibility: opt.id })}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${
                        tempFilters.eligibility === opt.id
                          ? 'bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 2: SCHOLARSHIP AMOUNT */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-2">
                  2. Scholarship Amount
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ANY', label: 'Any amount' },
                    { id: 'HIGH_TO_LOW', label: 'Highest → Lowest' },
                    { id: 'LOW_TO_HIGH', label: 'Lowest → Highest' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTempFilters({ ...tempFilters, amount_order: opt.id })}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                        tempFilters.amount_order === opt.id
                          ? 'bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 3: SORT BY */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-2">
                  3. Sort By
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'best_match', label: 'Recommended / Match %' },
                    { id: 'highest_chance', label: 'Highest chance of acceptance' },
                    { id: 'highest_amount', label: 'Highest scholarship amount' },
                    { id: 'closing_soon', label: 'Deadline soonest' },
                    { id: 'deadline_latest', label: 'Deadline latest' },
                    { id: 'recently_added', label: 'Recently added' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTempFilters({ ...tempFilters, sort_by: opt.id })}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${
                        tempFilters.sort_by === opt.id
                          ? 'bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 4: OTHER FILTERS / CATEGORY */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-2">
                  4. Scholarship Category / Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'ALL', 'Government', 'Private', 'Merit', 'Need-based', 'Women', 'State', 'National', 'Engineering', 'CSE', 'Category'
                  ].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTempFilters({ ...tempFilters, category: cat })}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        tempFilters.category === cat
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cat === 'ALL' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 gap-3">
              <button
                type="button"
                onClick={() => {
                  const cleared = { eligibility: 'ALL', amount_order: 'ANY', sort_by: 'best_match', category: 'ALL' };
                  setTempFilters(cleared);
                }}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors"
              >
                Clear Filters
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHOLARSHIP DETAILS & MATCH BREAKDOWN MODAL */}
      {selectedScholarship && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    {selectedScholarship.match_score}% Match Score
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    selectedScholarship.eligibility_status === 'ELIGIBLE' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' 
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                  }`}>
                    {selectedScholarship.eligibility_status === 'ELIGIBLE' ? '✓ Eligible' : '⚠ Needs Verification'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedScholarship.scholarship_name}
                </h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <Building size={14} /> {selectedScholarship.provider}
                </p>
              </div>
              <button
                onClick={() => setSelectedScholarship(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="border-t border-b border-slate-100 dark:border-slate-800 py-4 space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Profile Eligibility Analysis:</h4>
              {selectedScholarship.details?.matched_criteria?.map((reason, idx) => (
                <div key={`match-${idx}`} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
              {selectedScholarship.details?.missing_information?.map((gap, idx) => (
                <div key={`miss-${idx}`} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{gap} (Missing Information)</span>
                </div>
              ))}
              {selectedScholarship.details?.unmet_criteria?.map((gap, idx) => (
                <div key={`unmet-${idx}`} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                  <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{gap}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-medium">Award Amount</span>
                <p className="font-bold text-slate-900 dark:text-white text-base mt-0.5">{selectedScholarship.amount}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-medium">Deadline</span>
                <p className="font-bold text-amber-600 dark:text-amber-400 text-base mt-0.5">{selectedScholarship.deadline}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedScholarship(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Close
              </button>
              {selectedScholarship.official_scheme_url && (
                <a
                  href={selectedScholarship.official_scheme_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  Official Scholarship Source <ExternalLink size={14} />
                </a>
              )}
              {selectedScholarship.official_application_url && (
                <a
                  href={selectedScholarship.official_application_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {selectedScholarship.application_type === 'DIRECT_FORM' ? 'Apply Now' :
                   selectedScholarship.application_type === 'LOGIN_PORTAL' ? 'Apply on Official Portal' :
                   selectedScholarship.application_type === 'NSP' ? 'Apply on National Scholarship Portal' :
                   selectedScholarship.application_type === 'JNANABHUMI' ? 'Apply on JnanaBhumi' :
                   'Apply Officially'} <ExternalLink size={14} />
                </a>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyAction(selectedScholarship.scholarship_id);
                }}
                disabled={applyingId === selectedScholarship.scholarship_id}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1 disabled:opacity-50"
              >
                {applyingId === selectedScholarship.scholarship_id ? '...' : 
                 selectedScholarship.eligibility_status === 'ELIGIBLE' ? 'APPLY NOW' : 
                 selectedScholarship.eligibility_status === 'NEEDS_VERIFICATION' ? 'REVIEW & APPLY' : 'VIEW WHY'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function ScholarshipCard({ data, onSelect, onToggleSave, isSaving, onApplyAction, isApplying }) {
  const getEligibilityBadge = (status) => {
    switch (status) {
      case 'ELIGIBLE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Check className="w-3 h-3 mr-1" /> Eligible
          </span>
        );
      case 'NEEDS_VERIFICATION':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertCircle className="w-3 h-3 mr-1" /> Needs Verification
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Ineligible
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col h-full relative">
      {/* Card Header & Save Bookmark Button */}
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {data.match_score}% Match
          </span>
          {getEligibilityBadge(data.eligibility_status)}
        </div>

        <button
          onClick={onToggleSave}
          disabled={isSaving}
          className={`p-2 rounded-xl transition-colors shrink-0 ${
            data.is_saved
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600'
          }`}
          title={data.is_saved ? "Remove bookmark" : "Save scholarship"}
        >
          <Bookmark className={`w-4 h-4 ${data.is_saved ? 'fill-amber-500 text-amber-500' : ''}`} />
        </button>
      </div>

      <div className="space-y-1 mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {data.scholarship_name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
          <Building className="w-3.5 h-3.5 mr-1 shrink-0" />
          <span className="truncate">{data.provider}</span>
        </p>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Award Amount:</span>
          <span className="font-bold text-slate-900 dark:text-white">{data.amount}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Category:</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{data.category || 'General'}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Deadline</p>
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{data.deadline}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onSelect}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Details
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onApplyAction) onApplyAction();
            }}
            disabled={isApplying}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1 disabled:opacity-50"
          >
            {isApplying ? '...' : 
             data.eligibility_status === 'ELIGIBLE' ? (
                data.application_type === 'LOGIN_PORTAL' ? 'OPEN PORTAL' : 
                data.application_type === 'NSP' ? 'APPLY ON NSP' : 
                data.application_type === 'JNANABHUMI' ? 'APPLY ON JNANABHUMI' : 'APPLY NOW'
             ) : 
             data.eligibility_status === 'NEEDS_VERIFICATION' ? 'REVIEW & APPLY' : 'VIEW WHY'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FindScholarships;
