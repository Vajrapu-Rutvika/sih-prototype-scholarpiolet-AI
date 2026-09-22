import { useState, useEffect, useRef } from 'react';
import { Upload, Camera, FileText, CheckCircle, AlertCircle, Trash2, Clock, Check, Eye, RefreshCw, X } from 'lucide-react';
import apiClient from '../api/client';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('INCOME_CERT');
  const [error, setError] = useState('');
  
  // Review & Comparison Modals
  const [reviewDoc, setReviewDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('fields'); // 'fields', 'raw_text', 'compare'
  const [comparisonData, setComparisonData] = useState(null);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [reviewFields, setReviewFields] = useState({
    extracted_name: '',
    extracted_dob: '',
    extracted_id_number: '',
    extracted_income: '',
    extracted_institution: '',
    extracted_marks: '',
    extracted_category: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/documents/');
      setDocuments(response.data.results || response.data || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to fetch document vault.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);

    try {
      await apiClient.post('/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchDocuments();
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.file && Array.isArray(responseData.file)) {
        setError(responseData.file[0]);
      } else {
        setError(responseData?.detail || "Upload failed. Please upload a valid image or PDF.");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Camera Capture logic
  const startCamera = async () => {
    setShowCamera(true);
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied or unavailable:", err);
      setCameraError("Camera access unavailable. Upload document instead.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      stopCamera();
      setUploading(true);

      const file = new File([blob], `camera_scan_${Date.now()}.png`, { type: 'image/png' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', docType);

      try {
        await apiClient.post('/documents/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        await fetchDocuments();
      } catch (err) {
        const responseData = err.response?.data;
        if (responseData?.file && Array.isArray(responseData.file)) {
          setError(responseData.file[0]);
        } else {
          setError(responseData?.detail || "Camera OCR scanning failed. Please try again.");
        }
      } finally {
        setUploading(false);
      }
    }, 'image/png');
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/documents/${id}/`);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError("Failed to delete document.");
    }
  };

  const openReviewModal = async (doc) => {
    setReviewDoc(doc);
    setActiveTab('fields');
    setReviewFields({
      extracted_name: doc.extracted_name || '',
      extracted_dob: doc.extracted_dob || '',
      extracted_id_number: doc.extracted_id_number || '',
      extracted_income: doc.extracted_income || '',
      extracted_institution: doc.extracted_institution || '',
      extracted_marks: doc.extracted_marks || '',
      extracted_category: doc.extracted_category || ''
    });

    // Fetch comparison with student profile
    try {
      const compRes = await apiClient.get(`/documents/${doc.id}/compare/`);
      setComparisonData(compRes.data);
    } catch (err) {
      setComparisonData(null);
    }
  };

  const handleConfirmVerification = async (syncToProfile = false) => {
    if (!reviewDoc) return;

    try {
      await apiClient.patch(`/documents/${reviewDoc.id}/verify/`, {
        ...reviewFields,
        status: 'VERIFIED',
        sync_to_profile: syncToProfile
      });
      setReviewDoc(null);
      fetchDocuments();
    } catch (err) {
      setError("Failed to save verified data.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED': return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'EXPIRED': return 'text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300';
      case 'VERIFICATION_REQUIRED': return 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300';
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle className="w-4 h-4 mr-1 text-emerald-600" />;
      case 'EXPIRED': return <AlertCircle className="w-4 h-4 mr-1 text-red-600" />;
      case 'VERIFICATION_REQUIRED': return <Clock className="w-4 h-4 mr-1 text-amber-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Document Vault & OCR Intelligence</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Upload or capture documents to run real Python EasyOCR text extraction and profile sync.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs focus:outline-none text-slate-900 dark:text-white"
          >
            <option value="INCOME_CERT">Income Certificate</option>
            <option value="ID_PROOF">Aadhaar / ID Proof</option>
            <option value="COLLEGE_ID">College ID</option>
            <option value="BONAFIDE">Bonafide Certificate</option>
            <option value="MARKSHEET">Academic Marksheet</option>
            <option value="CASTE_CERT">Caste / Category Certificate</option>
            <option value="FEE_RECEIPT">Fee Receipt</option>
            <option value="BANK_DOC">Bank Document / Passbook</option>
            <option value="DOMICILE_CERT">Domicile Certificate</option>
            <option value="DISABILITY_CERT">Disability Certificate</option>
            <option value="OTHER">Other</option>
          </select>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            {uploading ? 'Scanning...' : 'Upload File'}
          </button>

          <button
            onClick={startCamera}
            disabled={uploading}
            className="flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            <Camera className="w-4 h-4 mr-1.5" />
            Scan via Camera
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Document List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">No documents in vault</p>
            <p className="text-xs mt-1">Upload an Income Certificate or ID proof to start automatic OCR processing.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Document Type</th>
                <th className="px-6 py-4 font-medium">Extracted Data Preview</th>
                <th className="px-6 py-4 font-medium">OCR Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="font-semibold text-slate-900 dark:text-white">{doc.document_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate text-xs">
                    {doc.extracted_name && `Name: ${doc.extracted_name} | `}
                    {doc.extracted_income && `Income: ₹${doc.extracted_income} | `}
                    {doc.extracted_id_number && `ID: ${doc.extracted_id_number}`}
                    {!doc.extracted_name && !doc.extracted_income && !doc.extracted_id_number && (
                      <span className="text-slate-400 italic">Raw OCR scan stored. Click Review to inspect.</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {getStatusIcon(doc.status)}
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => openReviewModal(doc)}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-semibold mr-2 transition-colors"
                    >
                      Review OCR & Compare
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CAMERA SCAN MODAL */}
      {showCamera && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera size={18} className="text-indigo-500" /> Live Document Camera Capture
              </h3>
              <button onClick={stopCamera} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            {cameraError ? (
              <div className="p-4 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded-xl text-xs border border-red-200 dark:border-red-800">
                {cameraError}
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={stopCamera} className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                Cancel
              </button>
              {!cameraError && (
                <button
                  onClick={capturePhoto}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                >
                  <Camera size={16} /> Capture Photo & Run OCR
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REVIEW & PROFILE COMPARISON MODAL */}
      {reviewDoc && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Document OCR & Intelligence: {reviewDoc.document_type}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Review raw OCR text, parsed fields, and profile comparison.</p>
              </div>
              <button onClick={() => setReviewDoc(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('fields')}
                className={`pb-2 border-b-2 transition-colors ${activeTab === 'fields' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500'}`}
              >
                Extracted Fields
              </button>
              <button
                onClick={() => setActiveTab('raw_text')}
                className={`pb-2 border-b-2 transition-colors ${activeTab === 'raw_text' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500'}`}
              >
                Stored Raw OCR Text
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                className={`pb-2 border-b-2 transition-colors ${activeTab === 'compare' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500'}`}
              >
                Profile vs Document Comparison
              </button>
            </div>

            {/* Tab 1: Extracted Fields */}
            {activeTab === 'fields' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Extracted Full Name</label>
                  <input
                    type="text"
                    value={reviewFields.extracted_name}
                    onChange={(e) => setReviewFields({ ...reviewFields, extracted_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Extracted Annual Income (INR)</label>
                  <input
                    type="text"
                    value={reviewFields.extracted_income}
                    onChange={(e) => setReviewFields({ ...reviewFields, extracted_income: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Extracted Category</label>
                  <input
                    type="text"
                    value={reviewFields.extracted_category}
                    onChange={(e) => setReviewFields({ ...reviewFields, extracted_category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Raw OCR Text */}
            {activeTab === 'raw_text' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Complete raw text extracted by EasyOCR / PyMuPDF:</p>
                <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl font-mono text-[11px] max-h-48 overflow-y-auto text-slate-800 dark:text-slate-200 leading-relaxed">
                  {reviewDoc.raw_ocr_text || "No raw text recorded."}
                </div>
              </div>
            )}

            {/* Tab 3: Comparison with Profile */}
            {activeTab === 'compare' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">Cross-checking document OCR data against student profile:</p>
                {comparisonData?.comparisons?.map((c, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">{c.field}</span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Profile: <span className="font-medium text-slate-700 dark:text-slate-300">{c.profile_value}</span> | Document: <span className="font-medium text-slate-700 dark:text-slate-300">{c.document_value}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      c.is_matched ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    }`}>
                      {c.is_matched ? '✓ Matched' : '⚠ Differs'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setReviewDoc(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                Cancel
              </button>
              <button
                onClick={() => handleConfirmVerification(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Confirm Verified
              </button>
              <button
                onClick={() => handleConfirmVerification(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Check size={14} /> Accept & Sync to Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
