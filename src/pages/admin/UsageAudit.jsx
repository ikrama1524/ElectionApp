import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { toast } from '../../components/Toast';
import './Admin.css';

const UsageAudit = () => {
  const { candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [prabhags, setPrabhags] = useState([]);
  const [selectedPrabhag, setSelectedPrabhag] = useState('');
  const [usageSummary, setUsageSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (candidateId) {
      loadData();
    }
  }, [candidateId, selectedPrabhag]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [candidateData, prabhagsData] = await Promise.all([
        adminApi.getCandidate(candidateId),
        adminApi.getAssignedPrabhags(candidateId),
      ]);
      
      setCandidate(candidateData);
      
      // Process prabhags
      let prabhagsList = [];
      if (Array.isArray(prabhagsData)) {
        prabhagsList = prabhagsData;
      } else if (prabhagsData && Array.isArray(prabhagsData.prabhags)) {
        prabhagsList = prabhagsData.prabhags;
      } else if (prabhagsData && Array.isArray(prabhagsData.data)) {
        prabhagsList = prabhagsData.data;
      }
      
      prabhagsList = prabhagsList.map(p => {
        if (typeof p === 'object' && p !== null) {
          return p.prabhag || p.prabhagId || p.name || p.code || String(p);
        }
        return String(p);
      }).filter(p => p && p.length > 0);
      
      setPrabhags(prabhagsList);
      
      // Auto-select first prabhag if available
      if (prabhagsList.length > 0 && !selectedPrabhag) {
        setSelectedPrabhag(prabhagsList[0]);
      }
      
      // Load usage data
      await loadUsage();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You do not have permission to view usage data');
      } else {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsage = async () => {
    try {
      let data;
      if (selectedPrabhag) {
        data = await adminApi.getUsageByPrabhag(candidateId, selectedPrabhag);
      } else {
        data = await adminApi.getUsageSummary(candidateId);
      }
      console.log('Usage API response:', data); // Temporary debug log
      setUsageSummary(data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You do not have permission to view usage data');
      } else {
        toast.error('Failed to load usage data');
      }
      setUsageSummary(null);
    }
  };

  const handlePrabhagChange = (e) => {
    const prabhag = e.target.value;
    setSelectedPrabhag(prabhag);
    // loadUsage will be called by useEffect
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading usage data...</p>
        </div>
      </div>
    );
  }

  // API returns: totalSearches, whatsappSearches, webSearches, epicSearches, nameSearches
  const totalSearches = usageSummary?.totalSearches || 0;

  return (
    <div className="page-container">
      <div className="breadcrumbs">
        <Link to="/admin/candidates">Candidates</Link>
        <span className="breadcrumbs-separator">/</span>
        <span>{candidate?.name || candidateId}</span>
        <span className="breadcrumbs-separator">/</span>
        <span>Usage & Audit</span>
      </div>

      <div className="page-header">
        <div>
          <h1>Usage & Audit</h1>
          <p className="page-subtitle">
            View search usage statistics for {candidate?.name || 'this candidate'}
          </p>
        </div>
      </div>

      {prabhags.length > 0 && (
        <div className="card">
          <div className="form-group">
            <label className="form-label">Filter by Prabhag (Optional)</label>
            <select
              className="form-select"
              value={selectedPrabhag}
              onChange={handlePrabhagChange}
            >
              <option value="">All Prabhags (Aggregate)</option>
              {prabhags.map((p) => {
                const prabhagValue = typeof p === 'string' ? p : String(p);
                return (
                  <option key={prabhagValue} value={prabhagValue}>
                    {prabhagValue}
                  </option>
                );
              })}
            </select>
            <div className="form-hint">
              Select a specific prabhag to view its usage, or leave blank for aggregate statistics.
            </div>
          </div>
        </div>
      )}

      {usageSummary ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Searches</h3>
              <p className="stat-value">{totalSearches}</p>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                WhatsApp + Web
              </div>
            </div>
            <div className="stat-card">
              <h3>WhatsApp Searches</h3>
              <p className="stat-value">{usageSummary.whatsappSearches || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Web Searches</h3>
              <p className="stat-value">{usageSummary.webSearches || 0}</p>
            </div>
            <div className="stat-card">
              <h3>EPIC Searches</h3>
              <p className="stat-value">{usageSummary.epicSearches || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Name Searches</h3>
              <p className="stat-value">{usageSummary.nameSearches || 0}</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Usage Breakdown</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Search Type</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>WhatsApp Searches</strong></td>
                    <td>{usageSummary.whatsappSearches || 0}</td>
                    <td>
                      {totalSearches > 0 
                        ? `${Math.round(((usageSummary.whatsappSearches || 0) / totalSearches) * 100)}%`
                        : '0%'}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Web Searches</strong></td>
                    <td>{usageSummary.webSearches || 0}</td>
                    <td>
                      {totalSearches > 0 
                        ? `${Math.round(((usageSummary.webSearches || 0) / totalSearches) * 100)}%`
                        : '0%'}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>EPIC Searches</strong></td>
                    <td>{usageSummary.epicSearches || 0}</td>
                    <td>
                      {totalSearches > 0 
                        ? `${Math.round(((usageSummary.epicSearches || 0) / totalSearches) * 100)}%`
                        : '0%'}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Name Searches</strong></td>
                    <td>{usageSummary.nameSearches || 0}</td>
                    <td>
                      {totalSearches > 0 
                        ? `${Math.round(((usageSummary.nameSearches || 0) / totalSearches) * 100)}%`
                        : '0%'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No Usage Data</div>
            <div className="empty-state-text">
              {selectedPrabhag 
                ? `No search usage recorded for prabhag ${selectedPrabhag} yet.`
                : 'No search usage recorded for this candidate yet.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageAudit;

