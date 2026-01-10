import { useState, useEffect } from 'react';
import { candidateApi } from '../../api/candidateApi';
import { toast } from '../../components/Toast';
import Modal from '../../components/Modal';
import './Candidate.css';
import '../admin/Admin.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'CANDIDATE_USER',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await candidateApi.getCandidateUsers();
      setUsers(data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access Denied');
      } else {
        setError('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await candidateApi.createCandidateUser(formData);
    setShowForm(false);
      setFormData({ email: '', password: '', role: 'CANDIDATE_USER' });
      loadUsers();
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access Denied');
      } else {
        setError(err.response?.data?.message || 'Failed to create user');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Candidate Users</h1>
          <p className="page-subtitle">Manage web users for your candidate account</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          + Add User
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="card">
        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No users found</div>
            <div className="empty-state-text">
              Create web users to allow access to the candidate dashboard.
            </div>
            <button onClick={() => setShowForm(true)} className="btn btn-primary mt-3">
              Create User
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className="badge badge-secondary">
                        {user.role}
                      </span>
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
        title="Create User"
        size="medium"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Email</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label required">Password</label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
              required
              minLength={6}
            />
            <div className="form-hint">
              Password must be at least 6 characters long
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="CANDIDATE_USER">Candidate User</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;

