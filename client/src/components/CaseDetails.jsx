import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EvidenceUpload from './EvidenceUpload';
import { getStatusLabel } from '../utils/caseWorkflow';

const CaseDetails = ({ caseId, onBack }) => {
  const [caseData, setCaseData] = useState(null);
  const [history, setHistory] = useState([]);
  const [availableTransitions, setAvailableTransitions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transitionError, setTransitionError] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [selectedTransition, setSelectedTransition] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('documents');

  // Parse user role from localStorage (or from auth context if available)
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
        setUserId(user.id || user._id || null);
      }
    } catch (err) {
      console.error('Failed to parse user info:', err);
    }
  }, []);

  const getCaseRole = () => {
    if (!caseData || !userId) return null;
    if (caseData.clientId?._id === userId || caseData.clientId === userId) {
      return 'client';
    }

    if (caseData.lawyerId?._id === userId || caseData.lawyerId === userId) {
      return 'lawyer';
    }

    const member = caseData.assignedUsers?.find(
      (u) => u.userId?._id === userId || u.userId === userId
    );

    if (member) {
      return member.role;
    }

    return userRole;
  };

  const caseRole = getCaseRole();
  const isLawyer = caseRole === 'lawyer';
  const isParalegal = caseRole === 'paralegal';
  const isClient = caseRole === 'client';
  const canUploadDocuments = ['lawyer', 'paralegal', 'client'].includes(caseRole);
  const canDraftDocuments = ['lawyer', 'paralegal'].includes(caseRole);
  const canApproveDocuments = caseRole === 'lawyer';
  const canManageDeadlines = ['lawyer', 'paralegal'].includes(caseRole);
  const canTransitionState = caseRole === 'lawyer';
  const canCreateTasks = caseRole === 'lawyer';
  const canExecuteTasks = caseRole === 'paralegal';
  const isCaseClosed = caseData?.status === 'closed';

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [caseRes, historyRes, transRes] = await Promise.all([
        axios.get(`/api/cases/${caseId}`, { headers }),
        axios.get(`/api/cases/${caseId}/history`, { headers }),
        axios.get(`/api/cases/${caseId}/transitions`, { headers })
      ]);

      setCaseData(caseRes.data.case);
      setHistory(historyRes.data.history || []);
      setAvailableTransitions(transRes.data.availableTransitions || {});
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch case details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/cases/${caseId}/notes`, 
        { content: noteContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNoteContent('');
      await fetchCaseDetails();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add note');
    }
  };

  const isTransitionAllowed = (newStatus) => {
    return !!availableTransitions?.[newStatus];
  };

  const handleTransitionState = async (newStatus) => {
    setTransitionError(null);

    if (isCaseClosed) {
      setTransitionError({
        title: 'Closed case',
        message: 'This case is closed and cannot be transitioned.'
      });
      return;
    }

    if (!isTransitionAllowed(newStatus)) {
      setTransitionError({
        title: 'Invalid transition',
        message: `Cannot transition from ${getStatusLabel(caseData?.status)} to ${getStatusLabel(newStatus)}.`
      });
      return;
    }

    if (!window.confirm(`Transition case to ${getStatusLabel(newStatus)}?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/cases/${caseId}/status`,
        { newStatus, reason: transitionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransitionReason('');
      setSelectedTransition(null);
      await fetchCaseDetails();
    } catch (err) {
      const errorData = err.response?.data;
      setTransitionError({
        title: errorData?.error || 'Failed to transition state',
        message: errorData?.reason || 'An error occurred while attempting to change the case status',
        statusLabel: errorData?.statusLabel
      });
    }
  };

  const getStatusBadgeClass = (status) => {
    const badgeMap = {
      new: 'badge-primary',
      drafting: 'badge-warning',
      filed: 'badge-info',
      hearing: 'badge-danger',
      judgment: 'badge-success',
      closed: 'badge-secondary'
    };
    return badgeMap[status] || 'badge-secondary';
  };

  const sections = [
    { id: 'documents', label: ' Documents' },
    { id: 'deadlines', label: ' Deadlines' },
    ...(canCreateTasks || canExecuteTasks ? [{ id: 'tasks', label: ' Tasks' }] : []),
    { id: 'notes', label: ' Notes' },
    { id: 'summary', label: ' Summary' }
  ];

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading case details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Error:</strong> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-warning">Case not found</div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Back Button */}
      <button className="btn btn-link text-primary mb-4" onClick={onBack}>
        ← Back to Cases
      </button>

      {/* Client Badge */}
      {isClient && (
        <div className="alert alert-info mb-4">
          <strong>View-Only Access</strong> — You can see case details, documents, deadlines, and hearing information
        </div>
      )}

      {/* Case Closed Warning */}
      {isCaseClosed && canTransitionState && (
        <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
          <strong> Case Closed</strong> — This case is closed and cannot be modified. No further state transitions are allowed.
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      {/* Transition Error Alert */}
      {transitionError && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          <strong>{transitionError.title}</strong>
          <p className="mb-0">{transitionError.message}</p>
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}

      <div className="row">
        {/* Left Sidebar */}
        <div className="col-lg-4 col-md-5 mb-4 mb-lg-0">
          {/* Case Info Card */}
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h3 className="card-title">{caseData.title}</h3>
              <div className="mb-3">
                <span className={`badge ${getStatusBadgeClass(caseData.status)} me-2`}>
                  {getStatusLabel(caseData.status)}
                </span>
                <span className="badge bg-light text-dark">{caseData.category}</span>
              </div>
              <dl className="row">
                <dt className="col-sm-5">Case ID:</dt>
                <dd className="col-sm-7 text-truncate">{caseData._id.substring(0, 8)}...</dd>
                <dt className="col-sm-5">Opened:</dt>
                <dd className="col-sm-7">{new Date(caseData.createdAt).toLocaleDateString()}</dd>
                {caseData.assignedLawyer && (
                  <>
                    <dt className="col-sm-5">Lawyer:</dt>
                    <dd className="col-sm-7">{caseData.assignedLawyer}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>

          {/* Sections Navigation */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Sections</h5>
              <nav className="nav flex-column">
                {sections.map(section => (
                  <button
                    key={section.id}
                    className={`nav-link text-start ${activeTab === section.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(section.id)}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-lg-8 col-md-7">
          {/* Tabs Navigation */}
          <ul className="nav nav-tabs mb-4" role="tablist">
            {sections.map(section => (
              <li className="nav-item" key={section.id} role="presentation">
                <button
                  className={`nav-link ${activeTab === section.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(section.id)}
                  role="tab"
                  aria-selected={activeTab === section.id}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="tab-pane fade show active">
                <div className="card mb-4 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">Upload Documents</h5>
                    {!isClient ? (
                      <div className="border-2 border-dashed p-4 text-center rounded bg-light">
                        <p className="mb-1">Drop files here or click to browse</p>
                        <small className="text-muted">PDF, DOCX, JPG — up to 20 MB each</small>
                      </div>
                    ) : (
                      <p className="text-muted">You do not have permission to upload documents</p>
                    )}
                  </div>
                </div>

                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">All Documents</h5>
                    {caseData.documents && caseData.documents.length > 0 ? (
                      <div className="list-group">
                        {caseData.documents.map(doc => (
                          <div key={doc.id} className="list-group-item">
                            <div className="d-flex justify-content-between">
                              <strong>{doc.name}</strong>
                              <small className="badge bg-secondary">{doc.type}</small>
                            </div>
                            <small className="text-muted">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                            </small>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No documents uploaded yet. Add files above to get started.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Deadlines Tab */}
            {activeTab === 'deadlines' && (
              <div className="tab-pane fade show active">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">Deadlines</h5>
                    {caseData.deadlines && caseData.deadlines.length > 0 ? (
                      <div className="list-group">
                        {caseData.deadlines.map(deadline => (
                          <div key={deadline.id} className="list-group-item d-flex justify-content-between">
                            <strong>{deadline.title}</strong>
                            <span className="badge bg-danger">
                              {new Date(deadline.date).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No deadlines set</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Steps Tab */}
            {activeTab === 'steps' && (
              <div className="tab-pane fade show active">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">Case Steps</h5>
                    <p className="text-muted">Steps information coming soon</p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="tab-pane fade show active">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">Timeline & Activity</h5>
                    {history.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {history.map((entry, idx) => (
                          <div key={idx} className="list-group-item">
                            <div className="d-flex justify-content-between">
                              <strong>{entry.action.replace(/_/g, ' ')}</strong>
                              <small className="text-muted">
                                {new Date(entry.timestamp).toLocaleDateString()}
                              </small>
                            </div>
                            <small className="text-muted">By: {entry.performedBy?.name}</small>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No activity yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="tab-pane fade show active">
                <div className="card mb-4 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">Add Note</h5>
                    {!isClient ? (
                      <form onSubmit={handleAddNote}>
                        <div className="mb-3">
                          <textarea
                            className="form-control"
                            rows="3"
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Add a note..."
                          ></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary">
                          Add Note
                        </button>
                      </form>
                    ) : (
                      <p className="text-muted">You do not have permission to add notes</p>
                    )}
                  </div>
                </div>

                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">Notes</h5>
                    {caseData.notes && caseData.notes.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {caseData.notes.map(note => (
                          <div key={note.id} className="list-group-item">
                            <p className="mb-1">{note.content}</p>
                            <small className="text-muted">
                              {new Date(note.timestamp).toLocaleString()}
                            </small>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No notes yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="tab-pane fade show active">
                <div className="card mb-4 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title">Case Description</h5>
                    <p>{caseData.description}</p>
                  </div>
                </div>

                {/* State Transitions - LAWYERS ONLY */}
                {canTransitionState && (
                  <div className="card mb-4 shadow-sm border-warning">
                    <div className="card-body">
                      <h5 className="card-title">Workflow Actions</h5>
                      
                      {isCaseClosed ? (
                        <div className="alert alert-danger mb-0">
                          <strong>Cannot Modify:</strong> This case is closed and cannot be transitioned to another state. Closed cases are considered finalized.
                        </div>
                      ) : Object.keys(availableTransitions).length > 0 ? (
                        <div>
                          <div className="btn-group-vertical w-100 mb-3" role="group">
                            {Object.entries(availableTransitions).map(([status, info]) => (
                              <button
                                key={status}
                                type="button"
                                className="btn btn-outline-primary text-start"
                                onClick={() => setSelectedTransition(status)}
                                title={info.description}
                              >
                                → <strong>Change to {info.label}</strong>
                                <br />
                                <small className="text-muted">{info.description}</small>
                              </button>
                            ))}
                          </div>

                          {selectedTransition && (
                            <div className="card bg-light border-primary">
                              <div className="card-body">
                                <h6>Confirm Transition</h6>
                                <div className="mb-3">
                                  <label className="form-label">Reason for transition:</label>
                                  <textarea
                                    className="form-control"
                                    rows="3"
                                    value={transitionReason}
                                    onChange={(e) => setTransitionReason(e.target.value)}
                                    placeholder="Enter reason for this state change..."
                                    required
                                  ></textarea>
                                </div>
                                <div className="d-flex gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() => handleTransitionState(selectedTransition)}
                                  >
                                    Confirm Transition
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedTransition(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="alert alert-info mb-0">
                          No state transitions available
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hearing Dates Section */}
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title"> Hearing Dates</h5>
                    {caseData.hearingDates && caseData.hearingDates.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {caseData.hearingDates.map(hearing => (
                          <div key={hearing.id} className="list-group-item">
                            <strong>
                              {new Date(hearing.date).toLocaleDateString()} at{' '}
                              {new Date(hearing.date).toLocaleTimeString()}
                            </strong>
                            {hearing.location && (
                              <div className="text-muted">📍 {hearing.location}</div>
                            )}
                            {hearing.description && (
                              <small className="text-muted">{hearing.description}</small>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No hearing dates scheduled</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
