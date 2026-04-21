import React, { useState, useEffect } from 'react';
import { chatAPI, handleAPIError } from '../services/api';

const ChatHistorySidebar = ({ onSelectSession, onClose, isLoading }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch sessions on component mount and when tab changes
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const archived = activeTab === 'archived';
        const response = await chatAPI.getAllSessions(archived);
        setSessions(response.data.sessions || []);
      } catch (error) {
        const apiErr = handleAPIError(error);
        console.error('Failed to fetch sessions:', apiErr.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [activeTab]);

  // Filter sessions by search term
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.description && session.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();

    if (!window.confirm('Delete this chat session? This action cannot be undone.')) {
      return;
    }

    try {
      await chatAPI.deleteSession(sessionId);
      setSessions(sessions.filter(s => s._id !== sessionId));
    } catch (error) {
      const apiErr = handleAPIError(error);
      alert(`Failed to delete session: ${apiErr.message}`);
    }
  };

  const handleToggleArchive = async (sessionId, isArchived, e) => {
    e.stopPropagation();

    try {
      await chatAPI.toggleArchiveSession(sessionId);
      if (activeTab === 'active' && !isArchived) {
        // Remove from active list after archiving
        setSessions(sessions.filter(s => s._id !== sessionId));
      } else if (activeTab === 'archived' && isArchived) {
        // Remove from archived list after unarchiving
        setSessions(sessions.filter(s => s._id !== sessionId));
      }
    } catch (error) {
      const apiErr = handleAPIError(error);
      alert(`Failed to update session: ${apiErr.message}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="d-flex flex-column bg-white border-end"
      style={{
        width: '300px',
        height: '100vh',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        zIndex: 100
      }}
    >

      {/* CLOSE BUTTON */}
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
        <h6 className="mb-0"> History</h6>
        <button
          className="btn btn-sm btn-close"
          onClick={onClose}
          title="Close history"
        />
      </div>

      {/* SEARCH */}
      <div className="p-2 border-bottom">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABS */}
      <div className="d-flex border-bottom">
        <button
          className={`flex-grow-1 btn btn-sm border-0 ${
            activeTab === 'active'
              ? 'btn-primary'
              : 'btn-light'
          }`}
          onClick={() => setActiveTab('active')}
        >
          Active
        </button>
        <button
          className={`flex-grow-1 btn btn-sm border-0 ${
            activeTab === 'archived'
              ? 'btn-primary'
              : 'btn-light'
          }`}
          onClick={() => setActiveTab('archived')}
        >
          Archived
        </button>
      </div>

      {/* SESSIONS LIST */}
      <div className="flex-grow-1 overflow-auto">
        {loading ? (
          <div className="p-3 text-center text-muted">
            <small>Loading...</small>
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="list-group list-group-flush">
            {filteredSessions.map((session) => (
              <button
                key={session._id}
                className="list-group-item list-group-item-action text-start border-0 p-3"
                onClick={() => onSelectSession(session._id)}
                style={{
                  borderBottom: '1px solid #e9ecef'
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <h6 className="mb-0 text-truncate" style={{ maxWidth: '220px' }}>
                    {session.title}
                  </h6>
                  <span className="badge bg-secondary ms-2">{session.messageCount}</span>
                </div>

                <small className="text-muted d-block text-truncate">
                  {session.description || 'No description'}
                </small>

                <small className="text-muted d-block mt-1">
                  {formatDate(session.lastMessageAt)}
                </small>

                {/* ACTION BUTTONS */}
                <div
                  className="d-flex gap-1 mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="btn btn-xs btn-outline-warning flex-grow-1"
                    onClick={(e) =>
                      handleToggleArchive(session._id, session.isArchived, e)
                    }
                    title={activeTab === 'active' ? 'Archive' : 'Restore'}
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.5rem'
                    }}
                  >
                    {activeTab === 'active' ? '📦' : '↩️'}
                  </button>
                  <button
                    className="btn btn-xs btn-outline-danger flex-grow-1"
                    onClick={(e) => handleDeleteSession(session._id, e)}
                    title="Delete permanently"
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.5rem'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-3 text-center text-muted">
            <small>
              {searchTerm ? 'No chats match your search' : 'No chats yet'}
            </small>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-3 border-top text-center small text-muted">
        <small>
          {filteredSessions.length} {activeTab === 'active' ? 'active' : 'archived'} chat
          {filteredSessions.length !== 1 ? 's' : ''}
        </small>
      </div>

    </div>
  );
};

export default ChatHistorySidebar;
