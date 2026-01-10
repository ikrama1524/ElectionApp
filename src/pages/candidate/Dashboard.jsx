import { useState, useEffect } from 'react';
import { candidateApi } from '../../api/candidateApi';
import './Candidate.css';

const Dashboard = () => {
  const [usageSummary, setUsageSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsageSummary();
  }, []);

  const loadUsageSummary = async () => {
    try {
      setLoading(true);
      const data = await candidateApi.getUsageSummary();
      setUsageSummary(data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access Denied');
      } else {
        setError('Failed to load usage summary');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Candidate Dashboard</h1>
          <p className="page-subtitle">Usage statistics and overview</p>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Searches</h3>
          <p className="stat-value">{usageSummary?.total_searches || usageSummary?.whatsappSearchCount + usageSummary?.webSearchCount || 0}</p>
        </div>
        <div className="stat-card">
          <h3>WhatsApp Searches</h3>
          <p className="stat-value">{usageSummary?.whatsappSearchCount || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Web Searches</h3>
          <p className="stat-value">{usageSummary?.webSearchCount || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

