import { useState, useEffect } from 'react';
import { User, GraduationCap, DollarSign, BookOpen, Save, CheckCircle2 } from 'lucide-react';
import apiClient from '../api/client';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    gender: 'Male',
    address: '',
    state: '',
    district: '',
    category: 'General',
    is_disabled: false,
    institution: '',
    university: '',
    course: '',
    branch: '',
    year: 1,
    semester: 1,
    student_id: '',
    cgpa: '',
    percentage: '',
    tenth_details: '',
    twelfth_details: '',
    annual_family_income: '',
    category_certificate_info: '',
    technical_skills: '',
    certifications: '',
    achievements: '',
    extracurricular: ''
  });

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'academic', label: 'Academic Details', icon: GraduationCap },
    { id: 'financial', label: 'Financial Info', icon: DollarSign },
    { id: 'skills', label: 'Skills & Extra', icon: BookOpen },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/auth/profile/');
      if (response.data) {
        const sanitized = {};
        Object.keys(response.data).forEach(key => {
          sanitized[key] = response.data[key] === null ? '' : response.data[key];
        });
        setFormData(prev => ({
          ...prev,
          ...sanitized,
          gender: response.data.gender || 'Male',
          category: response.data.category || 'General',
          year: response.data.year || 1,
          semester: response.data.semester || 1,
        }));
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    // Prepare payload cleanly so Django DRF serializer validation passes
    const payload = {
      ...formData,
      dob: formData.dob && formData.dob.trim() !== '' ? formData.dob : null,
      cgpa: formData.cgpa !== '' && formData.cgpa !== null ? parseFloat(formData.cgpa) : null,
      percentage: formData.percentage !== '' && formData.percentage !== null ? parseFloat(formData.percentage) : null,
      annual_family_income: formData.annual_family_income !== '' && formData.annual_family_income !== null ? parseFloat(formData.annual_family_income) : null,
      year: formData.year ? parseInt(formData.year) : 1,
      semester: formData.semester ? parseInt(formData.semester) : 1
    };

    try {
      await apiClient.patch('/auth/profile/', payload);
      setMessage('Profile saved successfully!');
      
      // Re-fetch profile directly from backend database to ensure total UI synchronization
      await fetchProfile();

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Profile save error:", err.response?.data || err);
      const detailMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Please check the fields and try again.';
      setError(`Failed to save profile: ${detailMsg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-slate-500">
        Loading student profile...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Profile Setup</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Complete your profile to get high-accuracy scholarship matches and instant eligibility checking.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/30 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4">
          <nav className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-3 ${activeTab === tab.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Form Content */}
        <div className="flex-1 p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'personal' && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Maharashtra"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">District</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Pune"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                    <textarea
                      name="address"
                      rows={2}
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Full residential address"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_disabled"
                      name="is_disabled"
                      checked={formData.is_disabled}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_disabled" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Person with Disability (PwD)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Academic Details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Institution</label>
                    <input
                      type="text"
                      name="institution"
                      value={formData.institution}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. IIT Bombay / VJTI"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">University</label>
                    <input
                      type="text"
                      name="university"
                      value={formData.university}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Mumbai University"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Course / Degree</label>
                    <input
                      type="text"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. B.Tech / B.Sc"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Branch / Major</label>
                    <input
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year of Study</label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value={1}>Year 1</option>
                      <option value={2}>Year 2</option>
                      <option value={3}>Year 3</option>
                      <option value={4}>Year 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      name="cgpa"
                      value={formData.cgpa}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. 8.75"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Percentage (Overall)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="percentage"
                      value={formData.percentage}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. 85.50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student ID / Roll No</label>
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. 21BCE0001"
                    />
                  </div>
                  <div className="sm:col-span-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Past Academic Details</h4>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">10th Details (School, Board, %)</label>
                    <textarea
                      name="tenth_details"
                      rows={2}
                      value={formData.tenth_details}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. ABC School, CBSE, 92%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">12th/Diploma Details</label>
                    <textarea
                      name="twelfth_details"
                      rows={2}
                      value={formData.twelfth_details}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. XYZ College, State Board, 88%"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Financial Information</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Annual Family Income (INR)</label>
                  <input
                    type="number"
                    name="annual_family_income"
                    value={formData.annual_family_income}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 250000"
                  />
                  <p className="text-xs text-slate-500 mt-1">Used to evaluate need-based scholarship eligibility.</p>
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Skills & Extra-Curriculars</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Technical Skills</label>
                  <textarea
                    name="technical_skills"
                    rows={3}
                    value={formData.technical_skills}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Python, React, Machine Learning..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Certifications & Achievements</label>
                  <textarea
                    name="achievements"
                    rows={3}
                    value={formData.achievements}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="State level hackathon winner, AWS Certified..."
                  />
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving Profile...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
