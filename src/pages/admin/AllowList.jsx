import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { toast } from '../../components/Toast';
import Modal from '../../components/Modal';
import './Admin.css';

const AdminAllowList = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [prabhags, setPrabhags] = useState([]);
  const [selectedPrabhag, setSelectedPrabhag] = useState('');
  const [allowList, setAllowList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [candidateId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [candidateData, prabhagsData] = await Promise.all([
        adminApi.getCandidate(candidateId),
        adminApi.getAssignedPrabhags(candidateId),
      ]);
      setCandidate(candidateData);
      
      // Process prabhags data (handle different response structures)
      let prabhagsList = [];
      if (Array.isArray(prabhagsData)) {
        prabhagsList = prabhagsData;
      } else if (prabhagsData && Array.isArray(prabhagsData.prabhags)) {
        prabhagsList = prabhagsData.prabhags;
      } else if (prabhagsData && Array.isArray(prabhagsData.data)) {
        prabhagsList = prabhagsData.data;
      }
      
      // Normalize prabhag values to strings
      prabhagsList = prabhagsList.map(p => {
        if (typeof p === 'object' && p !== null) {
          return p.prabhag || p.prabhagId || p.name || p.code || String(p);
        }
        return String(p);
      }).filter(p => p && p.length > 0);
      
      setPrabhags(prabhagsList);
      
      // Auto-select first prabhag if available, then load allow-list
      if (prabhagsList.length > 0) {
        setSelectedPrabhag(prabhagsList[0]);
        loadAllowList(prabhagsList[0]);
      } else {
        // No prabhags - cannot load allow-list (Swagger requires prabhag in path)
        setAllowList([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load data');
      setAllowList([]); // Ensure allow-list is always an array
    } finally {
      setLoading(false);
    }
  };

  const loadAllowList = async (prabhag) => {
    if (!prabhag) {
      setAllowList([]);
      return;
    }
    
    try {
      const data = await adminApi.getAllowList(candidateId, prabhag);
      setAllowList(data || []);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You do not have permission to view allow-list');
      } else {
        toast.error('Failed to load allow-list');
      }
      setAllowList([]);
    }
  };

  const handlePrabhagChange = (e) => {
    const prabhag = e.target.value;
    setSelectedPrabhag(prabhag);
    // Load allow-list for the selected prabhag (Swagger requires prabhag in path)
    loadAllowList(prabhag);
  };

  const handleAddPhone = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    
    if (!selectedPrabhag) {
      toast.error('No prabhag selected. Please select a prabhag first.');
      return;
    }

    try {
      await adminApi.addToAllowList(candidateId, selectedPrabhag, phoneNumber.trim());
      toast.success('Phone number added to allow-list');
      setPhoneNumber('');
      setShowAddModal(false);
      loadAllowList(selectedPrabhag);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You do not have permission to perform this action');
      } else if (err.response?.status === 409) {
        toast.error('Mobile already exists in allow-list');
      } else if (err.response?.status === 400) {
        toast.error(err.response?.data?.message || 'Invalid input');
      } else {
        toast.error(err.response?.data?.message || 'Failed to add phone number');
      }
    }
  };

  const handleDelete = async (mobile) => {
    if (!selectedPrabhag) {
      toast.error('No prabhag selected');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to remove ${mobile} from the allow-list?`)) {
      return;
    }

    try {
      await adminApi.deleteFromAllowList(candidateId, selectedPrabhag, mobile);
      toast.success('Phone number removed');
      loadAllowList(selectedPrabhag);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You do not have permission to perform this action');
      } else if (err.response?.status === 400) {
        toast.error('Mobile number not found');
      } else {
        toast.error('Failed to remove phone number');
      }
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }
    
    if (!selectedPrabhag) {
      toast.error('No prabhag selected. Please select a prabhag first.');
      return;
    }

    setUploading(true);
    try {
      // TODO: Implement CSV upload endpoint
      // For now, show a message
      toast.info('CSV upload feature coming soon. Please add numbers manually.');
      setShowUploadModal(false);
      setCsvFile(null);
    } catch (err) {
      toast.error('Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="breadcrumbs">
        <Link to="/admin/candidates">Candidates</Link>
        <span className="breadcrumbs-separator">/</span>
        <span>{candidate?.name || candidateId}</span>
        <span className="breadcrumbs-separator">/</span>
        <span>Allow List</span>
      </div>

      <div className="page-header">
        <div>
          <h1>Allow List Management</h1>
          <p className="page-subtitle">
            Manage mobile numbers allowed to search for {candidate?.name || 'this candidate'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-secondary"
            disabled={!selectedPrabhag || prabhags.length === 0}
            title={!selectedPrabhag ? 'Please select a prabhag first' : ''}
          >
            📤 Upload CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            disabled={!selectedPrabhag || prabhags.length === 0}
            title={!selectedPrabhag ? 'Please select a prabhag first' : ''}
          >
            + Add Number
          </button>
        </div>
      </div>

      {/* Blocking message if no prabhags - Swagger requires prabhag in API path */}
      {prabhags.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">Assign Prabhag Before Managing Allow-List</div>
            <div className="empty-state-text">
              Allow-list management requires a prabhag to be assigned to this candidate first.
              The backend API requires prabhag in the request path.
            </div>
            <Link
              to={`/admin/candidates/${candidateId}/prabhags`}
              className="btn btn-primary mt-3"
            >
              Assign Prabhags →
            </Link>
          </div>
        </div>
      )}

      {/* Prabhag selector and allow-list - only shown if prabhags exist */}
      {prabhags.length > 0 && (
        <>
          {/* Prabhag selector */}
          <div className="card">
            <div className="form-group">
              <label className="form-label required">Select Prabhag</label>
              <select
                className="form-select"
                value={selectedPrabhag}
                onChange={handlePrabhagChange}
                required
              >
                {prabhags.length === 1 ? (
                  <option value={prabhags[0]}>{prabhags[0]}</option>
                ) : (
                  <>
                    <option value="">Select a prabhag</option>
                    {prabhags.map((p) => {
                      const prabhagValue = typeof p === 'string' ? p : String(p);
                      return (
                        <option key={prabhagValue} value={prabhagValue}>
                          {prabhagValue}
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
              <div className="form-hint">
                {prabhags.length === 1 
                  ? 'This candidate has one assigned prabhag. Allow-list is managed for this prabhag.'
                  : 'Select a prabhag to view and manage its allow-list. Swagger API requires prabhag in the request path.'}
              </div>
            </div>
          </div>

          {/* Allow-list content - shown when prabhag is selected */}
          {selectedPrabhag && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  Allow-listed Numbers for Prabhag {selectedPrabhag} ({allowList.length})
                </h3>
              </div>
              {allowList.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📱</div>
                  <div className="empty-state-title">No numbers in allow-list</div>
                  <div className="empty-state-text">
                    Add phone numbers to enable search access for prabhag {selectedPrabhag}.
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="btn btn-primary"
                    >
                      + Add Number
                    </button>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="btn btn-secondary"
                    >
                      📤 Upload CSV
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Phone Number</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allowList.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <code>{item.phoneNumber || item.mobile || item}</code>
                            </td>
                            <td>
                              <span className="badge badge-success">Active</span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleDelete(item.phoneNumber || item.mobile || item)}
                                className="btn btn-danger btn-sm"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="btn btn-secondary"
                    >
                      📤 Upload CSV
                    </button>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="btn btn-primary"
                    >
                      + Add Number
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Show message if prabhag selector exists but nothing selected (shouldn't happen with auto-select) */}
          {!selectedPrabhag && prabhags.length > 1 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">Select a Prabhag</div>
                <div className="empty-state-text">
                  Please select a prabhag from above to view and manage its allow-list.
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Phone Number"
        size="small"
      >
        <form onSubmit={handleAddPhone}>
          {selectedPrabhag && (
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <strong>Prabhag:</strong> {selectedPrabhag}
              <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                This number will be added to the allow-list for this prabhag.
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label required">Phone Number</label>
            <input
              type="text"
              className="form-input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., 9876543210"
              required
            />
            <div className="form-hint">
              Enter 10-digit mobile number without spaces or dashes
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Number
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload CSV File"
        size="medium"
      >
        <form onSubmit={handleCsvUpload}>
          <div className="form-group">
            <label className="form-label required">CSV File</label>
            <input
              type="file"
              accept=".csv"
              className="form-input"
              onChange={(e) => setCsvFile(e.target.files[0])}
              required
            />
            <div className="form-hint">
              CSV should contain one phone number per line. First row can be a header.
            </div>
          </div>
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            <strong>Note:</strong> CSV upload feature is currently under development.
            Please add numbers manually for now.
          </div>
          <div className="modal-footer">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="btn btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || !csvFile}
            >
              {uploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminAllowList;

