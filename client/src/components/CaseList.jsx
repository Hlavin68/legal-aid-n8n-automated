import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const CaseList = ({ onSelectCase }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [userRole, setUserRole] = useState(null);

  // Get user role
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) setUserRole(user.role);
    } catch (err) {
      console.error('User parse error:', err);
    }
  }, []);

  const isClient = userRole === 'client';
  const isLegal = userRole === 'lawyer' || userRole === 'paralegal';

  // Fetch cases
  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const res = await axios.get('/api/cases', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCases(res.data.cases || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch cases');
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  // Status color
  const getStatusColor = (status) => ({
    new: '#3498db',
    drafting: '#f39c12',
    filed: '#9b59b6',
    hearing: '#e74c3c',
    judgment: '#27ae60',
    closed: '#95a5a6'
  }[status] || '#95a5a6');

  // Deadline urgency
  const getUrgency = (deadlines) => {
    if (!deadlines?.length) {
      return { days: null, label: 'No deadlines', color: '#95a5a6' };
    }

    const now = new Date();

    const soonest = deadlines.reduce((a, b) =>
      new Date(a.date) < new Date(b.date) ? a : b
    );

    const days = Math.ceil((new Date(soonest.date) - now) / (1000 * 60 * 60 * 24));

    if (days < 0) return { days, label: `${Math.abs(days)} days overdue`, color: '#c0392b' };
    if (days < 3) return { days, label: `${days} days left (CRITICAL)`, color: '#e74c3c' };
    if (days < 7) return { days, label: `${days} days left (URGENT)`, color: '#f39c12' };

    return { days, label: `${days} days left`, color: '#27ae60' };
  };

  // Filter
  const filteredCases = useMemo(() => {
    return filter === 'all'
      ? cases
      : cases.filter(c => c.status === filter);
  }, [cases, filter]);

  // Sort
  const sortedCases = useMemo(() => {
    const sorted = [...filteredCases];

    switch (sortBy) {
      case 'deadline':
        return sorted.sort((a, b) =>
          (getUrgency(a.deadlines).days ?? Infinity) -
          (getUrgency(b.deadlines).days ?? Infinity)
        );

      case 'status':
        const order = { new: 0, drafting: 1, filed: 2, hearing: 3, judgment: 4, closed: 5 };
        return sorted.sort((a, b) => order[a.status] - order[b.status]);

      case 'created':
        return sorted.sort((a, b) =>
          new Date(a.createdAt) - new Date(b.createdAt)
        );

      default:
        return sorted.sort((a, b) =>
          new Date(b.updatedAt) - new Date(a.updatedAt)
        );
    }
  }, [filteredCases, sortBy]);

  // UI states
  if (loading) return <p>Loading cases...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="case-list">
      <h2>📋 My Cases</h2>

      {/* Role Info */}
      {isClient && <p>👁️ Client View (Read-only)</p>}
      {isLegal && <p>⚖️ Legal View (Full control)</p>}

      {/* Controls */}
      <div className="controls">
        <div>
          {['all', 'new', 'drafting', 'filed', 'hearing', 'judgment', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{ fontWeight: filter === s ? 'bold' : 'normal' }}
            >
              {s}
            </button>
          ))}
        </div>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="updated">Recently Updated</option>
          <option value="deadline">Nearest Deadline</option>
          <option value="status">Status</option>
          <option value="created">Oldest</option>
        </select>

        <button onClick={fetchCases}> Refresh</button>
      </div>

      {/* Cases */}
      <div className="cases">
        {sortedCases.length === 0 ? (
          <p>No cases found</p>
        ) : (
          sortedCases.map(c => {
            const urgency = getUrgency(c.deadlines);

            return (
              <div
                key={c._id}
                className="case-card"
                onClick={() => onSelectCase(c._id)}
                style={{ border: '1px solid #ddd', padding: 12, marginBottom: 10, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h3>{c.title}</h3>
                  <span style={{ background: getStatusColor(c.status), color: '#fff', padding: '2px 8px' }}>
                    {c.status}
                  </span>
                </div>

                <p><strong>Category:</strong> {c.category}</p>
                <p>{c.description?.slice(0, 100) || 'No description'}...</p>

                <div style={{ background: urgency.color, color: '#fff', padding: 5 }}>
                  {urgency.label}
                </div>

                <small>{new Date(c.createdAt).toLocaleDateString()}</small>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CaseList;