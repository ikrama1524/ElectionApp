import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { toast } from '../../components/Toast';
import Modal from '../../components/Modal';
import './Admin.css';

const AdminPrabhags = () => {
  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [assignedPrabhags, setAssignedPrabhags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newPrabhags, setNewPrabhags] = useState('');
  const [assigning, setAssigning] = useState(false);

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
      
      // Debug logging - remove after confirmation
      console.log('Prabhag API raw response:', prabhagsData);
      
      setCandidate(candidateData);
      
      // Handle different possible response structures
      let prabhagsList = [];
      if (Array.isArray(prabhagsData)) {
        // Response is directly an array
        prabhagsList = prabhagsData;
      } else if (prabhagsData && Array.isArray(prabhagsData.prabhags)) {
        // Response has prabhags property
        prabhagsList = prabhagsData.prabhags;
      } else if (prabhagsData && Array.isArray(prabhagsData.data)) {
        // Response has data property
        prabhagsList = prabhagsData.data;
      } else if (prabhagsData && prabhagsData.prabhag) {
        // Single prabhag or different structure
        prabhagsList = Array.isArray(prabhagsData.prabhag) 
          ? prabhagsData.prabhag 
          : [prabhagsData.prabhag];
      }
      
      // Ensure we have an array of strings/values
      prabhagsList = prabhagsList.map(p => {
        // Handle object with prabhag property or direct value
        if (typeof p === 'object' && p !== null) {
          return p.prabhag || p.prabhagId || p.name || p.code || p.id || String(p);
        }
        return String(p);
      }).filter(p => p && p.length > 0);
      
      console.log('Prabhags state after processing:', prabhagsList);
      setAssignedPrabhags(prabhagsList);
    } catch (err) {
      console.error('Error loading prabhags:', err);
      toast.error('Failed to load data');
      setAssignedPrabhags([]); // Ensure state is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    const prabhagsList = newPrabhags
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (prabhagsList.length === 0) {
      toast.error('Please enter at least one prabhag');
      return;
    }

    setAssigning(true);
    try {
      await adminApi.assignPrabhags(candidateId, prabhagsList);
      toast.success('Prabhags assigned successfully');
      setNewPrabhags('');
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign prabhags');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (prabhag) => {
    if (!window.confirm(`Are you sure you want to remove prabhag ${prabhag}?`)) {
      return;
    }

    try {
      await adminApi.removePrabhag(candidateId, prabhag);
      toast.success('Prabhag removed successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to remove prabhag');
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
        <span>Prabhag Assignment</span>
      </div>

      <div className="page-header">
        <div>
          <h1>Prabhag Assignment</h1>
          <p className="page-subtitle">
            Manage prabhag assignments for {candidate?.name || 'this candidate'}
          </p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="btn btn-primary"
        >
          + Assign Prabhags
        </button>
      </div>

      <div className="card">
        {!Array.isArray(assignedPrabhags) || assignedPrabhags.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📍</div>
            <div className="empty-state-title">No Prabhags Assigned</div>
            <div className="empty-state-text">
              Assign prabhags to enable search functionality for this candidate.
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="btn btn-primary mt-3"
            >
              Assign Prabhags
            </button>
          </div>
        ) : (
          <>
            <div className="card-header">
              <h3 className="card-title">
                Assigned Prabhags ({assignedPrabhags.length})
              </h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Prabhag</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedPrabhags.map((prabhag, index) => {
                    // Ensure prabhag is a string for display and key
                    const prabhagValue = typeof prabhag === 'string' 
                      ? prabhag 
                      : (prabhag?.prabhag || prabhag?.prabhagId || prabhag?.name || prabhag?.code || String(prabhag));
                    const prabhagKey = prabhagValue || `prabhag-${index}`;
                    
                    return (
                      <tr key={prabhagKey}>
                        <td>
                          <strong>{prabhagValue}</strong>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link
                              to={`/admin/candidates/${candidateId}/allow-list`}
                              className="btn btn-secondary btn-sm"
                            >
                              Manage Allow-list
                            </Link>
                            <button
                              onClick={() => handleRemove(prabhagValue)}
                              className="btn btn-danger btn-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Prabhags"
        size="medium"
      >
        <form onSubmit={handleAssign}>
          <div className="form-group">
            <label className="form-label required">Prabhag Numbers</label>
            <textarea
              className="form-textarea"
              value={newPrabhags}
              onChange={(e) => setNewPrabhags(e.target.value)}
              placeholder="Enter prabhag numbers separated by commas, e.g., 1, 2, 3"
              rows={4}
              required
              disabled={assigning}
            />
            <div className="form-hint">
              Enter prabhag numbers separated by commas. You can assign multiple prabhags at once.
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="btn btn-secondary"
              disabled={assigning}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={assigning}
            >
              {assigning ? (
                <>
                  <span className="spinner"></span>
                  Assigning...
                </>
              ) : (
                'Assign Prabhags'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPrabhags;

