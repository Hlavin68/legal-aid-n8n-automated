import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { caseAPI, documentAPI } from "../services/api";
import { WORKFLOW_STEPS, NEXT_STAGE_MAP, STEP_CONFIG } from "../utils/caseWorkflow";

const DraftingPleadings = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isLawyer = user?.role === "lawyer";
  const isParalegal = user?.role === "paralegal";
  const rolePath = isParalegal ? "staff" : "lawyer";

  useEffect(() => {
    const loadCase = async () => {
      try {
        const res = await caseAPI.getCaseById(caseId);
        setCaseData(res.data.case);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load case");
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [caseId]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" />
      </div>
    );
  }

  const isPermissionDenied =
    error === 'Permission denied: insufficient role' ||
    error === 'Not authorized to view this case';

  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">
          {isPermissionDenied
            ? 'You do not have access to this case. Please ask the assigned lawyer to add you to the case first.'
            : error}
        </div>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate(`/${rolePath}/case/${caseId}`)}
        >
          ← Back
        </button>
      </div>
    );
  }

  if (!caseData) return <div className="container">Case not found</div>;

  const stageKey = caseData.status;
  const stageIndex = WORKFLOW_STEPS.findIndex((s) => s.key === stageKey);
  const nextStage = NEXT_STAGE_MAP[stageKey];

  const stageConfig = STEP_CONFIG[stageKey] || {};

  const stepCompleted = caseData?.stepCompleted || false;
  const hasDocuments = Array.isArray(caseData.documents) && caseData.documents.length > 0;

  const canProceed = isLawyer && stepCompleted && nextStage;
  const showParalegalDocumentNotification = isLawyer && stageKey === 'drafting' && hasDocuments && !stepCompleted;
  const showParalegalCompleteNotification = isLawyer && stageKey === 'drafting' && stepCompleted;

  /**
   * HANDLE NEXT STAGE
   */
  const handleNextStage = async () => {
    try {
      await caseAPI.changeStatus(caseId, nextStage);

      const res = await caseAPI.getCaseById(caseId);
      setCaseData(res.data.case);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to proceed");
    }
  };

  /**
   * PARALEGAL MARK COMPLETE
   */
  const markStepComplete = async () => {
    try {
      const response = await caseAPI.updateCase(caseId, {
        stepCompleted: true
      });

      if (response.data?.success) {
        setCaseData(response.data.case);
      } else {
        setCaseData((prev) => ({
          ...prev,
          stepCompleted: true
        }));
      }
    } catch (err) {
      alert("Failed to mark complete");
    }
  };

  /**
   * FILE UPLOAD
   */
  const handleUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await documentAPI.uploadDocument(caseId, formData);

      if (response.data?.success && response.data.case) {
        setCaseData(response.data.case);
      } else {
        alert("Upload completed, but could not refresh case data.");
      }
    } catch (err) {
      alert("Upload failed");
    }
  };

  return (
    <div className="container py-4">

      {/* BACK */}
      <button
        className="btn btn-link mb-3"
        onClick={() => navigate(`/${rolePath}/case/${caseId}`)}
      >
        ← Back
      </button>

      {/* HEADER */}
      <div className="card mb-4 p-3">
        <h4>⚖️ Case Workflow</h4>
        <p className="mb-0">{caseData.title}</p>
        <strong>Stage: {stageKey.toUpperCase()}</strong>
      </div>

      {showParalegalDocumentNotification && (
        <div className="alert alert-info mb-4">
          <strong>New document uploaded.</strong> A paralegal has added a document for this step. Review the file and approve the step when ready.
        </div>
      )}

      {showParalegalCompleteNotification && (
        <div className="alert alert-success mb-4">
          <strong>Step completed.</strong> A paralegal marked this drafting step complete. You can now move the case to the next stage.
        </div>
      )}

      {/* TIMELINE */}
      <div className="card mb-4 p-3">
        <h5>📊 Timeline</h5>

        <div className="d-flex flex-wrap gap-2">
          {WORKFLOW_STEPS.map((step, i) => {
            const status =
              i < stageIndex
                ? "bg-success"
                : i === stageIndex
                ? "bg-warning text-dark"
                : "bg-light text-muted";

            return (
              <span key={step.key} className={`badge ${status}`}>
                {step.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="row">

        {/* STEP PANEL */}
        <div className="col-md-6">
          <div className="card p-3 mb-3">
            <h5>🧾 {stageConfig.title}</h5>

            <ul>
              {stageConfig.actions?.map((action) => (
                <li key={action}>⬜ {action}</li>
              ))}
            </ul>

            {/* PARALEGAL ACTION */}
            {isParalegal && (
              <>
                <input
                  type="file"
                  className="form-control mt-2"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleUpload(file);
                  }}
                />

                <button
                  className="btn btn-outline-success mt-2 w-100"
                  onClick={markStepComplete}
                  disabled={!hasDocuments || stepCompleted}
                >
                  Mark Step Complete
                </button>

                {!hasDocuments && !stepCompleted && (
                  <div className="text-warning mt-2">
                    Upload a document first, then mark the step complete.
                  </div>
                )}

                {hasDocuments && !stepCompleted && (
                  <div className="text-muted mt-2">
                    Document uploaded. You can now mark the step complete.
                  </div>
                )}
              </>
            )}

            {stepCompleted && (
              <div className="text-success mt-2">
                ✔ Step Completed
              </div>
            )}
          </div>
        </div>

        {/* ACTION PANEL */}
        <div className="col-md-6">
          <div className="card p-3">
            <h5>🚀 Actions</h5>

            <button
              className="btn btn-success w-100 mb-2"
              disabled={!canProceed}
              onClick={handleNextStage}
            >
              Next Stage → {nextStage?.toUpperCase()}
            </button>

            {!isLawyer && (
              <small className="text-muted">
                Only lawyers can proceed
              </small>
            )}

            {!stepCompleted && (
              <small className="text-warning d-block">
                Waiting for paralegal to complete step
              </small>
            )}

            <button
              className="btn btn-outline-primary w-100 mt-2"
              onClick={() => navigate(`/${rolePath}/case/${caseId}`)}
            >
              View Case
            </button>
          </div>
        </div>

      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </div>
  );
};

export default DraftingPleadings;