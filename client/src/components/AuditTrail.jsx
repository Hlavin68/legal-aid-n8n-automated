import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AuditTrail = ({ caseId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [caseId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/cases/${caseId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.history || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      created: '✨',
      status_changed: '→',
      document_added: '📄',
      document_removed: '🗑️',
      hearing_scheduled: '📅',
      note_added: '📝',
      deadline_set: '⏰',
      assigned_user: '👥',
      removed_user: '❌',
      closed: '✓'
    };
    return icons[action] || '•';
  };

  const getActionLabel = (action) => {
    return action.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (loading) return <div className="audit-trail"><p>Loading audit trail...</p></div>;
  if (error) return <div className="audit-trail error"><p>{error}</p></div>;

  return (
    <div className="audit-trail">
      <h3>Audit Trail & Case History</h3>
      
      {history.length === 0 ? (
        <p className="no-history">No activity recorded</p>
      ) : (
        <div className="timeline">
          {history.map((entry, idx) => (
            <div key={idx} className="timeline-item">
              <div className="timeline-dot">
                <span className="icon">{getActionIcon(entry.action)}</span>
              </div>
              <div className="timeline-content">
                <div className="action-header">
                  <p className="action">{getActionLabel(entry.action)}</p>
                  <span className="timestamp">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>

                {entry.previousStatus && entry.newStatus && (
                  <div className="status-change">
                    <span className="from">{entry.previousStatus}</span>
                    <span className="arrow">→</span>
                    <span className="to">{entry.newStatus}</span>
                  </div>
                )}

                {entry.performedBy && (
                  <p className="performer">
                    <strong>{entry.performedBy.name}</strong> ({entry.performedBy.role})
                  </p>
                )}

                {entry.details && (
                  <p className="details">{entry.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="refresh-btn" onClick={fetchHistory}>
        Refresh History
      </button>
    </div>
  );
};

export default AuditTrail;
