import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { toast } from '../../components/Toast';
import Modal from '../../components/Modal';
import './Admin.css';

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    status: 'ACTIVE',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getCandidates();
      setCandidates(data || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access Denied');
        toast.error('You do not have permission to view candidates');
      } else {
        setError('Failed to load candidates');
        toast.error('Failed to load candidates. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Candidate name is required';
    }
    if (!formData.status) {
      errors.status = 'Status is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    setEditingCandidate(null);
    setFormData({ name: '', status: 'ACTIVE' });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name || '',
      status: candidate.status || 'ACTIVE',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (editingCandidate) {
        await adminApi.updateCandidate(editingCandidate.candidateId, formData);
        toast.success('Candidate updated successfully');
      } else {
        await adminApi.createCandidate(formData);
        toast.success('Candidate created successfully');
      }
      setShowForm(false);
      loadCandidates();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Access Denied');
      } else {
        const errorMsg = err.response?.data?.message || 'Operation failed';
        toast.error(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (candidateId) => {
    if (!window.confirm('Are you sure you want to delete this candidate? This action cannot be undone.')) {
      return;
    }
    try {
      await adminApi.deleteCandidate(candidateId);
      toast.success('Candidate deleted successfully');
      loadCandidates();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Access Denied');
      } else {
        toast.error('Failed to delete candidate');
      }
    }
  };


  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Candidates</h1>
          <p className="page-subtitle">Manage candidate accounts and assignments</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary">
          + Add Candidate
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="card">
        {candidates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No candidates found</div>
            <div className="empty-state-text">
              Get started by creating your first candidate.
            </div>
            <button onClick={handleCreate} className="btn btn-primary mt-3">
              Create Candidate
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.candidateId}>
                    <td>
                      <code className="text-muted">{candidate.candidateId}</code>
                    </td>
                    <td>
                      <strong>{candidate.name}</strong>
                    </td>
                    <td>
                      <span className={`badge badge-${candidate.status === 'ACTIVE' ? 'success' : 'secondary'}`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/admin/candidates/${candidate.candidateId}/prabhags`}
                          className="btn btn-secondary btn-sm"
                          title="Manage Prabhags"
                        >
                          Prabhags
                        </Link>
                        <Link
                          to={`/admin/candidates/${candidate.candidateId}/allow-list`}
                          className="btn btn-secondary btn-sm"
                          title="Manage Allow-list"
                        >
                          Allow-list
                        </Link>
                        <Link
                          to={`/admin/candidates/${candidate.candidateId}/users`}
                          className="btn btn-secondary btn-sm"
                          title="Manage Users"
                        >
                          Users
                        </Link>
                        <Link
                          to={`/admin/candidates/${candidate.candidateId}/usage`}
                          className="btn btn-secondary btn-sm"
                          title="View Usage & Audit"
                        >
                          Usage
                        </Link>
                        <button
                          onClick={() => handleEdit(candidate)}
                          className="btn btn-secondary btn-sm"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(candidate.candidateId)}
                          className="btn btn-danger btn-sm"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => !saving && setShowForm(false)}
        title={editingCandidate ? 'Edit Candidate' : 'Create Candidate'}
        size="medium"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label required">
              Candidate Name
            </label>
            <input
              type="text"
              id="name"
              className={`form-input ${formErrors.name ? 'error' : ''}`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter candidate name"
              required
              disabled={saving}
            />
            {formErrors.name && (
              <div className="form-error">{formErrors.name}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="status" className="form-label required">
              Status
            </label>
            <select
              id="status"
              className={`form-select ${formErrors.status ? 'error' : ''}`}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
              disabled={saving}
            >
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
            </select>
            {formErrors.status && (
              <div className="form-error">{formErrors.status}</div>
            )}
            <div className="form-hint">
              Active candidates can access the system. Blocked candidates are disabled.
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner"></span>
                  {editingCandidate ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingCandidate ? 'Update Candidate' : 'Create Candidate'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Candidates;
