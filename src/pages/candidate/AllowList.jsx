import { useState, useEffect } from 'react';
import { candidateApi } from '../../api/candidateApi';
import { toast } from '../../components/Toast';
import Modal from '../../components/Modal';
import './Candidate.css';
import '../admin/Admin.css';

const AllowList = () => {
  const [allowList, setAllowList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: '',
    name: '',
  });

  useEffect(() => {
    loadAllowList();
  }, []);

  const loadAllowList = async () => {
    try {
      setLoading(true);
      const data = await candidateApi.getAllowList();
      setAllowList(data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access Denied');
      } else {
        setError('Failed to load allow-list');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await candidateApi.addToAllowList(formData);
      toast.success('Phone number added to allow-list');
      setShowForm(false);
      setFormData({ phone_number: '', name: '' });
      loadAllowList();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Access Denied');
      } else {
        toast.error(err.response?.data?.message || 'Failed to add to allow-list');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this entry?')) {
      return;
    }
    try {
      await candidateApi.removeFromAllowList(id);
      toast.success('Entry removed from allow-list');
      loadAllowList();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Access Denied');
      } else {
        toast.error('Failed to remove from allow-list');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading allow-list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Allow List</h1>
          <p className="page-subtitle">Manage mobile numbers allowed to search</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          + Add Entry
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="card">
        {allowList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📱</div>
            <div className="empty-state-title">No entries found</div>
            <div className="empty-state-text">
              Add phone numbers to enable search access.
            </div>
            <button onClick={() => setShowForm(true)} className="btn btn-primary mt-3">
              Add Entry
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Phone Number</th>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allowList.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.id}</td>
                    <td><code>{entry.phone_number}</code></td>
                    <td>{entry.name || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(entry.id)}
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
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add to Allow List"
        size="small"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Phone Number</label>
            <input
              type="text"
              className="form-input"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="e.g., 9876543210"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Optional name"
            />
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AllowList;

