import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function CaseDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get user info
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (err) {
      console.error('Failed to parse user:', err);
    }

    // Fetch cases
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/cases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCases(response.data.cases || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch cases');
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const getStatistics = () => {
    const stats = {
      total: cases.length,
      byStatus: {},
      urgent: 0,
      overdue: 0,
      active: 0
    };

    const statuses = ['new', 'drafting', 'filed', 'hearing', 'judgment', 'closed'];
    statuses.forEach(status => {
      stats.byStatus[status] = cases.filter(c => c.status === status).length;
    });

    // Count active cases (not closed)
    stats.active = cases.filter(c => c.status !== 'closed').length;

    // Count urgent and overdue
    cases.forEach(c => {
      if (c.deadlines && c.deadlines.length > 0) {
        const soonest = Math.min(...c.deadlines.map(d => new Date(d.date).getTime()));
        const daysLeft = Math.ceil((soonest - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) stats.overdue++;
        if (daysLeft < 7) stats.urgent++;
      }
    });

    return stats;
  };

  const isLawyer = user?.role === 'lawyer';
  const isParalegal = user?.role === 'paralegal';
  const isClient = user?.role === 'client';
  const isLegal = isLawyer || isParalegal;

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            {isClient && '👁️ My Cases'}
            {isLawyer && '⚖️ Case Management'}
            {isParalegal && '📋 Case Dashboard'}
          </h1>
          <p className="header-subtitle">
            {isClient && 'View and track your legal cases'}
            {isLegal && 'Manage and monitor your caseload'}
          </p>
        </div>

        <div className="header-actions">
          {isLegal && (
            <>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/lawyer/cases')}
              >
                ➕ Create Case
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/chat')}
              >
                🤖 Ask AI
              </button>
            </>
          )}
          {isClient && (
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/chat')}
            >
              💬 Chat with AI
            </button>
          )}
        </div>
      </div>

      {/* Alert Banner - Critical Issues */}
      {(stats.overdue > 0 || stats.urgent > 0) && (
        <div className="alert-banner alert-warning">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            {stats.overdue > 0 && <strong>{stats.overdue} overdue deadline(s)</strong>}
            {stats.overdue > 0 && stats.urgent > 0 && <span className="alert-separator">•</span>}
            {stats.urgent > 0 && <strong>{stats.urgent} urgent action(s) needed</strong>}
          </div>
          <button 
            className="alert-action"
            onClick={() => navigate(isClient ? '/client/cases' : isLawyer ? '/lawyer/cases' : '/paralegal/cases')}
          >
            View Cases →
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Total Cases Card */}
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Cases</div>
          </div>
        </div>

        {/* Active Cases Card */}
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active Cases</div>
          </div>
        </div>

        {/* Urgent Cases Card */}
        {(stats.urgent > 0 || isLegal) && (
          <div className={`stat-card ${stats.urgent > 0 ? 'stat-urgent' : ''}`}>
            <div className="stat-icon">🔔</div>
            <div className="stat-content">
              <div className="stat-value">{stats.urgent}</div>
              <div className="stat-label">Urgent Actions</div>
            </div>
          </div>
        )}

        {/* Overdue Card */}
        {(stats.overdue > 0 || isLegal) && (
          <div className={`stat-card ${stats.overdue > 0 ? 'stat-overdue' : ''}`}>
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <div className="stat-value">{stats.overdue}</div>
              <div className="stat-label">Overdue {isClient ? 'Deadlines' : 'Actions'}</div>
            </div>
          </div>
        )}

        {/* Closed Cases Card */}
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.byStatus.closed}</div>
            <div className="stat-label">Closed Cases</div>
          </div>
        </div>
      </div>

      {/* Workflow Status - Lawyer View */}
      {isLegal && (
        <div className="workflow-section">
          <h2>Cases by Status</h2>
          <div className="workflow-grid">
            {[
              { status: 'new', label: 'New', color: '#3498db', icon: '🔵' },
              { status: 'drafting', label: 'Drafting', color: '#f39c12', icon: '🟠' },
              { status: 'filed', label: 'Filed', color: '#9b59b6', icon: '🟣' },
              { status: 'hearing', label: 'Hearing', color: '#e74c3c', icon: '🔴' },
              { status: 'judgment', label: 'Judgment', color: '#27ae60', icon: '🟢' },
              { status: 'closed', label: 'Closed', color: '#95a5a6', icon: '⚪' }
            ].map(item => (
              <div key={item.status} className="workflow-item">
                <div className="workflow-icon">{item.icon}</div>
                <div className="workflow-label">{item.label}</div>
                <div className="workflow-count">{stats.byStatus[item.status] || 0}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Cases */}
      <div className="recent-section">
        <div className="recent-header">
          <h2>Recent Cases</h2>
          <button 
            className="view-all-link"
            onClick={() => navigate(isClient ? '/client/cases' : isLawyer ? '/lawyer/cases' : '/paralegal/cases')}
          >
            View All →
          </button>
        </div>

        {cases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>No cases yet</h3>
            <p>
              {isClient && 'Your cases will appear here once your lawyer creates them'}
              {isLegal && 'Create your first case to get started'}
            </p>
            {isLegal && (
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/lawyer/cases')}
              >
                Create Case
              </button>
            )}
          </div>
        ) : (
          <div className="recent-cases">
            {cases.slice(0, 5).map(caseItem => (
              <div 
                key={caseItem._id} 
                className="recent-case-item"
                onClick={() => navigate(isClient ? `/client/case/${caseItem._id}` : `/lawyer/case/${caseItem._id}`)}
              >
                <div className="case-item-title">{caseItem.title}</div>
                <div className="case-item-meta">
                  <span className="case-status-badge" style={{ backgroundColor: getStatusColor(caseItem.status) }}>
                    {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                  </span>
                  <span className="case-category">{caseItem.category}</span>
                  <span className="case-date">
                    {new Date(caseItem.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function
function getStatusColor(status) {
  const colors = {
    new: '#3498db',
    drafting: '#f39c12',
    filed: '#9b59b6',
    hearing: '#e74c3c',
    judgment: '#27ae60',
    closed: '#95a5a6'
  };
  return colors[status] || '#95a5a6';
}

export default CaseDashboard;
