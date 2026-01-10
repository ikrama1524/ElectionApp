import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { toast } from '../../components/Toast';
import './Admin.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalUsers: 0,
    totalSearches: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const candidates = await adminApi.getCandidates();
      setStats({
        totalCandidates: candidates?.length || 0,
        totalUsers: 0, // TODO: Add API endpoint for total users count
        totalSearches: 0, // TODO: Add API endpoint for total searches count
      });
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access Denied');
        toast.error('You do not have permission to view the dashboard');
      } else {
        setError('Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
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
          <h1>Admin Dashboard</h1>
          <p className="page-subtitle">Overview of your election search system</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Candidates</h3>
          <p className="stat-value">{stats.totalCandidates}</p>
          <Link to="/admin/candidates" className="btn btn-secondary btn-sm mt-2">
            Manage Candidates →
          </Link>
        </div>
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">{stats.totalUsers}</p>
          <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Coming soon
          </div>
        </div>
        <div className="stat-card">
          <h3>Total Searches</h3>
          <p className="stat-value">{stats.totalSearches}</p>
          <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Coming soon
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Link to="/admin/candidates" className="btn btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Manage Candidates
          </Link>
          <Link to="/search" className="btn btn-secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Search Voters
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
