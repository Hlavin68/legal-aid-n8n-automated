import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BACKEND_BASE_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const buildPdfUrl = (pdfUrl) => {
  if (!pdfUrl) return null;
  const normalizedPath = pdfUrl.startsWith("/") ? pdfUrl : `/${pdfUrl}`;
  return `${BACKEND_BASE_URL}${normalizedPath}`;
};

/**
 * CaseBaseDetails Component
 * Displays full details of a legal case with PDF viewer
 * Available to: Clients (read-only) and Lawyers (read + edit/delete)
 */
export function CaseBaseDetails() {
  const { caseId } = useParams();

  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(`${API_URL}/case-base/${caseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.success) {
          setCaseData(res.data.case);
        } else {
          setError("Case not found");
        }
      } catch (err) {
        console.error("Error fetching case:", err);
        setError(err.response?.data?.error || "Failed to load case details");
      } finally {
        setLoading(false);
      }
    };

    if (caseId && token) {
      fetchCase();
    }
  }, [caseId, token]);

  const handleDownloadPDF = () => {
    if (!caseData?.pdfUrl) return;

    try {
      const link = document.createElement("a");
      link.href = buildPdfUrl(caseData.pdfUrl);
      link.download = `${caseData.title.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download PDF");
    }
  };

  const handleDelete = async () => {
    if (user?.role !== "lawyer") {
      alert("Only lawyers can delete cases");
      return;
    }

    try {
      setDeleting(true);

      const res = await axios.delete(`${API_URL}/case-base/${caseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        navigate("/lawyer/case-base");
      }
    } catch (err) {
      console.error("Error deleting case:", err);
      alert(err.response?.data?.error || "Failed to delete case");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const goBack = () => {
    navigate(
      user?.role === "client"
        ? "/client/case-base"
        : "/lawyer/case-base"
    );
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <h4 className="mb-2">Error Loading Case</h4>
          <p className="text-muted mb-3">{error || "Case not found"}</p>
          <button className="btn btn-primary" onClick={goBack}>
            ← Back to Case Base
          </button>
        </div>
      </div>
    );
  }

  const estimatedReadTime = Math.ceil(
    (caseData.description?.length || 0) / 200
  );

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="mb-4">
        <button
          className="btn btn-outline-secondary btn-sm mb-3"
          onClick={goBack}
        >
          ← Back to Case Base
        </button>

        <h1 className="fw-bold mb-2">{caseData.title}</h1>

        {/* BADGES */}
        <div className="d-flex gap-2 flex-wrap mb-3">
          <span className="badge bg-secondary">
            {caseData.category || "General"}
          </span>

          {caseData.year && (
            <span className="badge bg-info text-dark">
              {caseData.year}
            </span>
          )}

          {caseData.views && (
            <span className="badge bg-light text-dark">
               {caseData.views} views
            </span>
          )}

          {estimatedReadTime > 0 && (
            <span className="badge bg-light text-dark">
               ~{estimatedReadTime} min read
            </span>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="d-flex gap-2 flex-wrap">
          {caseData.pdfUrl && (
            <button
              className="btn btn-primary"
              onClick={handleDownloadPDF}
            >
               Download PDF
            </button>
          )}

          {user?.role === "lawyer" &&
            caseData.createdBy?._id === user?.id && (
              <>
                <button
                  className="btn btn-outline-warning"
                  onClick={() =>
                    navigate(`/lawyer/edit-case/${caseId}`)
                  }
                >
                   Edit
                </button>

                <button
                  className="btn btn-outline-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                   Delete
                </button>
              </>
            )}
        </div>
      </div>

      {/* DELETE CONFIRMATION */}
      {showDeleteConfirm && (
        <div className="card border-danger mb-4">
          <div className="card-body">
            <h5 className="card-title">Confirm Deletion</h5>
            <p className="text-muted">
              Are you sure you want to delete this case? This
              action cannot be undone.
            </p>

            <div className="d-flex gap-2">
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Case"}
              </button>

              <button
                className="btn btn-outline-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BRIEF */}
      {caseData.brief && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5 className="mb-2">Brief Summary</h5>
            <p className="mb-0">{caseData.brief}</p>
          </div>
        </div>
      )}

      {/* METADATA */}
      <div className="row g-3 mb-4">
        {caseData.court && (
          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h6 className="text-muted small mb-1">COURT</h6>
                <p className="mb-0">{caseData.court}</p>
              </div>
            </div>
          </div>
        )}

        {caseData.judge && (
          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h6 className="text-muted small mb-1">JUDGE</h6>
                <p className="mb-0">{caseData.judge}</p>
              </div>
            </div>
          </div>
        )}

        {caseData.citation && (
          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h6 className="text-muted small mb-1">CITATION</h6>
                <p className="mb-0">{caseData.citation}</p>
              </div>
            </div>
          </div>
        )}

        {caseData.createdBy && (
          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h6 className="text-muted small mb-1">
                  UPLOADED BY
                </h6>
                <p className="mb-0">
                  {caseData.createdBy.name}
                  {caseData.createdBy.firm && (
                    <span className="text-muted">
                      {" "}
                      ({caseData.createdBy.firm})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FULL DESCRIPTION */}
      {caseData.description && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5 className="mb-3"> Full Description</h5>
            <p
              className="text-muted mb-0"
              style={{ lineHeight: "1.8" }}
            >
              {caseData.description}
            </p>
          </div>
        </div>
      )}

      {/* KEYWORDS */}
      {caseData.keywords?.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5 className="mb-3">Keywords</h5>
            <div className="d-flex flex-wrap gap-2">
              {caseData.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="badge bg-light text-dark"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PDF VIEWER */}
      {caseData.pdfUrl && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5 className="mb-3">PDF Document</h5>

            <iframe
              src={buildPdfUrl(caseData.pdfUrl)}
              title="Case PDF"
              style={{
                width: "100%",
                height: "600px",
                border: "1px solid #dee2e6",
                borderRadius: "0.375rem",
              }}
            />

            <div className="mt-3">
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleDownloadPDF}
              >
                Download PDF
              </button>

              <a
                href={buildPdfUrl(caseData.pdfUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-secondary ms-2"
              >
                🔗 Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}

      {/* NOTES */}
      {caseData.notes?.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5>Notes ({caseData.notes.length})</h5>

            <div className="list-group">
              {caseData.notes.map((note) => (
                <div
                  key={note._id || note.id}
                  className="list-group-item"
                >
                  <p className="mb-1">{note.content}</p>

                  <small className="text-muted">
                    By {note.author?.name || "Unknown"} on{" "}
                    {new Date(
                      note.timestamp || note.createdAt
                    ).toLocaleDateString("en-KE")}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DEADLINES */}
      {caseData.deadlines?.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5>Deadlines ({caseData.deadlines.length})</h5>

            <div className="list-group">
              {caseData.deadlines.map((deadline) => (
                <div
                  key={deadline._id || deadline.id}
                  className="list-group-item"
                >
                  <strong>{deadline.title}</strong>
                  <br />

                  <small className="text-muted">
                    Due:{" "}
                    {new Date(
                      deadline.date
                    ).toLocaleDateString("en-KE")}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HEARING DATES */}
      {caseData.hearingDates?.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <h5>
              Hearing Dates ({caseData.hearingDates.length})
            </h5>

            <div className="list-group">
              {caseData.hearingDates.map((hearing) => (
                <div
                  key={hearing._id || hearing.id}
                  className="list-group-item"
                >
                  <strong>
                    {new Date(
                      hearing.date
                    ).toLocaleDateString("en-KE")}
                  </strong>

                  {hearing.location && (
                    <>
                      <br />
                      <small className="text-muted">
                        Location: {hearing.location}
                      </small>
                    </>
                  )}

                  {hearing.description && (
                    <>
                      <br />
                      <small className="text-muted">
                        {hearing.description}
                      </small>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CASE METADATA */}
      <div className="card bg-light border-0 mb-4">
        <div className="card-body">
          <h6 className="text-muted mb-2">Case Metadata</h6>

          <small className="text-muted d-block">
            Case ID: {caseData._id}
          </small>

          {caseData.createdAt && (
            <small className="text-muted d-block">
              Created:{" "}
              {new Date(
                caseData.createdAt
              ).toLocaleString("en-KE")}
            </small>
          )}

          {caseData.updatedAt && (
            <small className="text-muted d-block">
              Last Updated:{" "}
              {new Date(
                caseData.updatedAt
              ).toLocaleString("en-KE")}
            </small>
          )}
        </div>
      </div>
    </div>
  );
}

export default CaseBaseDetails;