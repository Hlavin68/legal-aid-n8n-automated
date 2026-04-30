import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCaseContext } from "../hooks/useCaseContext";
import { useAuth } from "../hooks/useAuth";
import { authAPI } from "../services/api";

const LAWYER_TABS = [
  "overview",
  "inbox",
  "assign",
  "documents",
  "deadlines",
  "steps",
  "timeline",
  "notes",
  "summary"
];

const CLIENT_TABS = ["overview", "inbox", "notes"];

const STATE_LABELS = {
  new: "New",
  drafting: "Drafting",
  filed: "Filed",
  hearing: "Hearing",
  judgment: "Judgment",
  closed: "Closed"
};

export function CaseDetails() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    cases,
    setCurrentCaseId,
    addNote,
    deleteNote,
    addDocument,
    deleteDocument,
    addDeadline,
    deleteDeadline,
    updateCaseSummary,
    changeStatus,
    assignUser,
    removeUser
  } = useCaseContext();

  const [currentCase, setCurrentCase] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const [newDeadlineTitle, setNewDeadlineTitle] = useState("");
  const [newDeadlineDate, setNewDeadlineDate] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const isLawyer =
    user?.role === "lawyer" || user?.role === "paralegal";

  const tabs = isLawyer ? LAWYER_TABS : CLIENT_TABS;
  const caseKey = currentCase?._id ?? currentCase?.id;

  useEffect(() => {
    if (!caseId) return;
    setCurrentCaseId(caseId);

    const found =
      cases.find((c) => c._id === caseId || c.id === caseId) || null;

    setCurrentCase(found);
  }, [caseId, cases, setCurrentCaseId]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab === "assign" && user?.role === "lawyer") {
        try {
          const response = await authAPI.getUsers();
          if (response.data?.success) {
            setAvailableUsers(response.data.users);
          }
        } catch (err) {
          console.error("Error fetching users:", err);
        }
      }
    };

    fetchUsers();
  }, [activeTab, user?.role]);

  if (!currentCase) {
    return (
      <div className="container py-5 text-center">
        <h4>Case not found</h4>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>
      </div>
    );
  }

  const upcomingDeadlines =
    currentCase.deadlines
      ?.filter((d) => new Date(d.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date)) || [];

  const userId = user?.id || user?._id;
  const inboxMessages = (currentCase.notifications || [])
    .filter((notification) => {
      const recipientByRole = notification.recipientRoles?.includes(user?.role);
      const recipientById = notification.recipientIds?.some(
        (id) => id?.toString?.() === userId
      );
      return recipientByRole || recipientById || (!notification.recipientRoles?.length && !notification.recipientIds?.length);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote(caseKey, newNote);
    setNewNote("");
  };

  const handleAddDeadline = () => {
    if (!newDeadlineTitle || !newDeadlineDate) return;
    addDeadline(caseKey, newDeadlineTitle, newDeadlineDate);
    setNewDeadlineTitle("");
    setNewDeadlineDate("");
  };

  const generateSummary = () => {
    setSummaryLoading(true);

    setTimeout(() => {
      const summary = `Case "${currentCase.title}" is currently ${currentCase.status}.`;

      updateCaseSummary(caseKey, summary);

      setCurrentCase((prev) => ({
        ...prev,
        summary
      }));

      setSummaryLoading(false);
    }, 1000);
  };

  return (
    <div className="container py-4">

      {/* HEADER */}
      <div className="mb-3">

        <button
          className="btn btn-outline-secondary btn-sm mb-3"
          onClick={() => {
            if (user?.role) {
              navigate(`/${user.role}/dashboard`);
            } else {
              navigate("/");
            }
          }}        >
          ← Back
        </button>

        <div className="d-flex flex-wrap align-items-center gap-2">

          <h3 className="mb-0">{currentCase.title}</h3>

          <span className="badge bg-primary">
            {currentCase.status}
          </span>

          <span className="badge bg-secondary">
            {currentCase.category}
          </span>

          {isLawyer && (
            <select
              className="form-select form-select-sm w-auto"
              value={currentCase.status}
              onChange={(e) =>
                changeStatus(caseKey, e.target.value)
              }
            >
              {Object.entries(STATE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          )}

        </div>
      </div>

      {/* TABS */}
      <ul className="nav nav-tabs mb-3">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${
                activeTab === tab ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      {/* CONTENT */}
      <div className="card shadow-sm border-0">
        <div className="card-body">

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <>
              <h5>Case Overview</h5>
              
              {/* CASE INFO BADGE */}
              <div className="alert alert-light border mb-4">
                <div className="row">
                  <div className="col-md-6">
                    <small className="text-muted d-block">CASE ID</small>
                    <strong>{currentCase._id || currentCase.id}</strong>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">LAW FIRM</small>
                    <strong>
                      {currentCase.lawyerId?.firm || currentCase.caseCreatedBy?.firm || 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* LAWYER INFO */}
              {(currentCase.lawyerId || currentCase.caseCreatedBy) && (
                <div className="mb-4 p-3 border rounded bg-light">
                  <h6 className="text-primary mb-2">Assigned Lawyer</h6>
                  <p className="mb-1">
                    <strong>{currentCase.lawyerId?.name || currentCase.caseCreatedBy?.name}</strong>
                  </p>
                  <p className="mb-0 text-muted small">
                    <strong>Email:</strong> {currentCase.lawyerId?.email || currentCase.caseCreatedBy?.email}
                  </p>
                </div>
              )}

              {/* CASE DESCRIPTION */}
              <div className="mb-4">
                <h6 className="text-primary">Case Details</h6>
                <p className="text-muted">
                  {currentCase.description}
                </p>
              </div>

              {/* NOTES */}
              <div className="mb-4">
                <h6 className="text-primary">Notes & Comments</h6>
                {currentCase.notes && currentCase.notes.length > 0 ? (
                  <div className="list-group mb-3">
                    {currentCase.notes.map((n) => (
                      <div
                        key={n.id}
                        className="list-group-item"
                      >
                        <div className="d-flex justify-content-between">
                          <div>
                            <p className="mb-1">{n.content}</p>
                            <small className="text-muted">
                              {n.author?.name && `By ${n.author.name}`} 
                              {n.timestamp && ` • ${new Date(n.timestamp).toLocaleDateString()}`}
                            </small>
                          </div>
                          {isLawyer && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteNote(caseKey, n.id)}
                              title="Delete note"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No notes yet.</p>
                )}
              </div>

              {/* DOCUMENTS */}
              <div className="mb-4">
                <h6 className="text-primary">Documents</h6>
                {currentCase.documents && currentCase.documents.length > 0 ? (
                  <div className="list-group">
                    {currentCase.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <span className="fw-bold">{doc.name}</span>
                          <br />
                          <small className="text-muted">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </small>
                        </div>
                        {isLawyer && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteDocument(caseKey, doc.id)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No documents uploaded yet.</p>
                )}
              </div>

              {/* DEADLINES */}
              <div className="mb-4">
                <h6 className="text-primary">Upcoming Deadlines</h6>
                {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                  <div className="list-group">
                    {upcomingDeadlines.map((d) => (
                      <div
                        key={d.id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <span className="fw-bold">{d.title}</span>
                          <br />
                          <small className="text-muted">
                            Due: {new Date(d.date).toLocaleDateString()}
                          </small>
                        </div>
                        {isLawyer && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteDeadline(caseKey, d.id)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No upcoming deadlines.</p>
                )}
              </div>
            </>
          )}

          {/* INBOX */}
          {activeTab === "inbox" && (
            <>
              <h5>Inbox</h5>
              {inboxMessages.length > 0 ? (
                <div className="list-group">
                  {inboxMessages.map((note) => (
                    <div key={note.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <p className="mb-1">{note.message}</p>
                          <small className="text-muted">
                            {note.type.charAt(0).toUpperCase() + note.type.slice(1)} • {new Date(note.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                        <span className="badge bg-info text-dark">
                          {note.recipientRoles?.join(', ') || 'all'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-light">
                  No inbox messages for this case yet.
                </div>
              )}
            </>
          )}

          {/* NOTES */}
          {activeTab === "notes" && (
            <>
              <h5>Notes</h5>

              <div className="input-group mb-3">
                <input
                  className="form-control"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddNote}
                >
                  Add
                </button>
              </div>

              {currentCase.notes?.map((n) => (
                <div
                  key={n.id}
                  className="d-flex justify-content-between align-items-center border rounded p-2 mb-2"
                >
                  <span>{n.content}</span>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => deleteNote(caseKey, n.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </>
          )}

          {/* DOCUMENTS */}
          {activeTab === "documents" && isLawyer && (
            <>
              <h5>Documents</h5>

              <input
                type="file"
                multiple
                className="form-control mb-3"
                onChange={(e) => {
                  for (const file of e.target.files || []) {
                    addDocument(caseKey, file.name, file.name.split(".").pop());
                  }
                }}
              />

              {currentCase.documents?.map((doc) => (
                <div
                  key={doc.id}
                  className="d-flex justify-content-between border rounded p-2 mb-2"
                >
                  <span>{doc.name}</span>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => deleteDocument(caseKey, doc.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </>
          )}

          {/* DEADLINES */}
          {activeTab === "deadlines" && isLawyer && (
            <>
              <h5>Deadlines</h5>

              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <input
                    className="form-control"
                    placeholder="Title"
                    value={newDeadlineTitle}
                    onChange={(e) =>
                      setNewDeadlineTitle(e.target.value)
                    }
                  />
                </div>

                <div className="col-md-4">
                  <input
                    type="date"
                    className="form-control"
                    value={newDeadlineDate}
                    onChange={(e) =>
                      setNewDeadlineDate(e.target.value)
                    }
                  />
                </div>

                <div className="col-md-2">
                  <button
                    className="btn btn-primary w-100"
                    onClick={handleAddDeadline}
                  >
                    Add
                  </button>
                </div>
              </div>

              {upcomingDeadlines.map((d) => (
                <div
                  key={d.id}
                  className="d-flex justify-content-between border rounded p-2 mb-2"
                >
                  <span>
                    {d.title} — {d.date}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => deleteDeadline(caseKey, d.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </>
          )}

          {/* STEPS */}
          {activeTab === "steps" && isLawyer && (
            <>
              <h5>Suggested Steps</h5>
              <ul className="list-group">
                {currentCase.suggestedSteps?.map((s, i) => (
                  <li className="list-group-item" key={i}>
                    {s}
                  </li>
                ))}
              </ul>

              <div className="mt-3">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    const rolePath = user?.role === "paralegal" ? "staff" : user?.role;
                    navigate(`/${rolePath}/case/${caseKey}/pleadings`);
                  }}
                >
                  Open Drafting Pleadings
                </button>
              </div>
            </>
          )}

          {/* ASSIGN USERS */}
          {activeTab === "assign" && user?.role === "lawyer" && (
            <>
              <h5>Assign Users to Case</h5>

              {/* CURRENT ASSIGNED USERS */}
              <div className="mb-4">
                <h6>Currently Assigned Users</h6>
                {currentCase.assignedUsers && currentCase.assignedUsers.length > 0 ? (
                  <div className="list-group">
                    {currentCase.assignedUsers.map((assigned) => (
                      <div
                        key={assigned.userId._id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <strong>{assigned.userId.name}</strong>
                          <br />
                          <small className="text-muted">
                            {assigned.userId.email} • {assigned.role}
                          </small>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeUser(caseKey, assigned.userId._id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No users assigned to this case.</p>
                )}
              </div>

              {/* ASSIGN NEW USER */}
              <div className="card p-3">
                <h6>Assign New User</h6>
                <div className="row g-2">
                  <div className="col-md-10">
                    <select
                      className="form-select"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                    >
                      <option value="">Select a user...</option>
                      {availableUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email}) - {user.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button
                      className="btn btn-primary w-100"
                      onClick={async () => {
                        if (!selectedUserId) return;
                        const selectedUser = availableUsers.find(u => u._id === selectedUserId);
                        if (!selectedUser) return;
                        try {
                          await assignUser(caseKey, selectedUserId, selectedUser.role);
                          setSelectedUserId("");
                        } catch (err) {
                          alert("Failed to assign user");
                        }
                      }}
                      disabled={!selectedUserId}
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SUMMARY */}
          {activeTab === "summary" && isLawyer && (
            <>
              <h5>Summary</h5>

              <button
                className="btn btn-primary mb-3"
                onClick={generateSummary}
                disabled={summaryLoading}
              >
                {summaryLoading ? "Generating..." : "Generate"}
              </button>

              <p className="text-muted">
                {currentCase.summary}
              </p>
            </>
          )}

        
        </div>
      </div>
    </div>
  );
}

export default CaseDetails;