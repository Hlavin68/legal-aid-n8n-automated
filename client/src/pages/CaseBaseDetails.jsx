import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export function CaseBaseDetails() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/cases/base/${caseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          setCaseData(res.data.case);
        }
      } catch (err) {
        console.error("Error fetching case:", err);
        setError(err.response?.data?.error || "Failed to load case");
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchCase();
    }
  }, [caseId, token]);

  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div style={{ fontSize: "3rem" }}>❌</div>
          <h4 className="mt-2">Error Loading Case</h4>
          <p className="text-muted">{error || "Case not found"}</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate(user.role === 'client' ? '/client/case-base' : '/lawyer/case-base')}
          >
            Back to Case Base
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold">{caseData.title}</h1>
          <div className="d-flex gap-2 mb-2">
            <span className="badge bg-secondary">{caseData.category}</span>
            <span className="badge bg-success">Closed</span>
          </div>
        </div>
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate(user.role === 'client' ? '/client/case-base' : '/lawyer/case-base')}
        >
          ← Back to Case Base
        </button>
      </div>

      {/* DESCRIPTION */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h5>Description</h5>
          <p className="text-muted">{caseData.description}</p>
        </div>
      </div>

      {/* SUMMARY */}
      {caseData.summary && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5>Case Summary</h5>
            <p className="text-muted">{caseData.summary}</p>
          </div>
        </div>
      )}

      {/* META INFO */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h5>Case Information</h5>
          <div className="row">
            <div className="col-md-6">
              <p><strong>Client:</strong> {caseData.clientId?.name || 'N/A'}</p>
              <p><strong>Lawyer:</strong> {caseData.lawyerId?.name || 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Created:</strong> {new Date(caseData.createdAt).toLocaleDateString("en-KE")}</p>
              <p><strong>Closed:</strong> {new Date(caseData.statusChangedAt).toLocaleDateString("en-KE")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* DOCUMENTS */}
      {caseData.documents && caseData.documents.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5>Documents ({caseData.documents.length})</h5>
            <div className="list-group">
              {caseData.documents.map((doc) => (
                <div key={doc.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{doc.name}</strong>
                      <br />
                      <small className="text-muted">
                        Type: {doc.type} | Uploaded: {new Date(doc.uploadedAt).toLocaleDateString("en-KE")}
                      </small>
                    </div>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NOTES */}
      {caseData.notes && caseData.notes.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5>Notes ({caseData.notes.length})</h5>
            <div className="list-group">
              {caseData.notes.map((note) => (
                <div key={note.id} className="list-group-item">
                  <p className="mb-1">{note.content}</p>
                  <small className="text-muted">
                    By {note.author?.name || 'Unknown'} on {new Date(note.timestamp).toLocaleDateString("en-KE")}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DEADLINES */}
      {caseData.deadlines && caseData.deadlines.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5>Deadlines ({caseData.deadlines.length})</h5>
            <div className="list-group">
              {caseData.deadlines.map((deadline) => (
                <div key={deadline.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{deadline.title}</strong>
                      <br />
                      <small className="text-muted">
                        Due: {new Date(deadline.date).toLocaleDateString("en-KE")}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HEARING DATES */}
      {caseData.hearingDates && caseData.hearingDates.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5>Hearing Dates ({caseData.hearingDates.length})</h5>
            <div className="list-group">
              {caseData.hearingDates.map((hearing) => (
                <div key={hearing.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{new Date(hearing.date).toLocaleDateString("en-KE")}</strong>
                      {hearing.location && <br />}
                      {hearing.location && <small className="text-muted">Location: {hearing.location}</small>}
                      {hearing.description && <br />}
                      {hearing.description && <small className="text-muted">{hearing.description}</small>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseBaseDetails;