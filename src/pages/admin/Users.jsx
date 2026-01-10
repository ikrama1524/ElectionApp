import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { toast } from '../../components/Toast';
import Modal from '../../components/Modal';
import './Admin.css';

const AdminUsers = () => {
  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [candidateId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [candidateData, usersData] = await Promise.all([
        adminApi.getCandidate(candidateId),
        adminApi.getCandidateUsers(candidateId),
      ]);
      setCandidate(candidateData);
      setUsers(usersData || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setCreating(true);
    try {
      await adminApi.createCandidateUser(candidateId, formData);
      toast.success('User created successfully');
      setFormData({ username: '', password: '' });
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleBlock = async (userId) => {
    if (!window.confirm('Are you sure you want to block this user?')) {
      return;
    }

    try {
      await adminApi.blockUser(candidateId, userId);
      toast.success('User blocked successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to block user');
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
        <span>Web Users</span>
      </div>

      <div className="page-header">
        <div>
          <h1>Web Users</h1>
          <p className="page-subtitle">
            Manage web users for {candidate?.name || 'this candidate'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          + Create User
        </button>
      </div>

      <div className="card">
        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">No Users Found</div>
            <div className="empty-state-text">
              Create web users to allow access to the candidate dashboard.
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary mt-3"
            >
              Create User
            </button>
          </div>
        ) : (
          <>
            <div className="card-header">
              <h3 className="card-title">Users ({users.length})</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.userId || user.id}>
                      <td>
                        <code className="text-muted">{user.userId || user.id}</code>
                      </td>
                      <td>
                        <strong>{user.username}</strong>
                      </td>
                      <td>
                        <span className="badge badge-secondary">
                          {user.role || 'CANDIDATE_USER'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${user.status === 'BLOCKED' ? 'danger' : 'success'}`}>
                          {user.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td>
                        {user.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString()
                          : user.createdDate
                          ? new Date(user.createdDate).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        {user.status !== 'BLOCKED' && (
                          <button
                            onClick={() => handleBlock(user.userId || user.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Block
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Web User"
        size="medium"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label required">Username</label>
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Enter username"
              required
              disabled={creating}
            />
            <div className="form-hint">
              Username must be unique for this candidate
            </div>
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
              disabled={creating}
              minLength={6}
            />
            <div className="form-hint">
              Password must be at least 6 characters long
            </div>
          </div>
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            <strong>Note:</strong> New users will have CANDIDATE_USER role by default.
          </div>
          <div className="modal-footer">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn btn-secondary"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminUsers;

