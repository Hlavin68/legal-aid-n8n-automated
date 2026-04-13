import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Badge, Button } from "../components/ui";
import CreateCaseModal from "../components/CreateCaseModal";
import { useCaseContext } from "../hooks/useCaseContext";
import { useAuth } from "../hooks/useAuth";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cases, createCase, setCurrentCaseId, fetchCases, loading } =
    useCaseContext();

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleCreateCase = async (caseData) => {
    try {
      await createCase(caseData);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error creating case:", err);
    }
  };

  const handleCaseClick = (caseId) => {
    setCurrentCaseId(caseId);

    const prefix =
      user?.role === "lawyer" ? "/lawyer" : "/client";

    navigate(`${prefix}/case/${caseId}`);
  };

  const handleAskAI = () => {
    navigate("/client/chat");
  };

  /* LOADING STATE */
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh", background: "#1a365d" }}
      >
        <div className="spinner-border text-light" />
      </div>
    );
  }

  return (
    <div
      className="container-fluid py-4"
      style={{ background: "#1a365d", minHeight: "100vh" }}
    >

      {/* HEADER */}
      <div className="container mb-4">
        <div className="row align-items-center">

          <div className="col-md-6">
            <h1 className="text-white mb-1">📋 My Cases</h1>
            <p className="text-light mb-0">
              Manage your legal cases in one place
            </p>
          </div>

          <div className="col-md-6 text-md-end mt-3 mt-md-0 d-flex gap-2 justify-content-md-end">

            {user?.role === "lawyer" && (
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setIsModalOpen(true)}
              >
                ➕ Create Case
              </button>
            )}

            <button
              className="btn btn-outline-light btn-lg"
              onClick={handleAskAI}
            >
              🤖 Ask AI
            </button>

          </div>

        </div>
      </div>

      {/* EMPTY STATE */}
      {cases.length === 0 ? (
        <div className="text-center text-white py-5">
          <div style={{ fontSize: "4rem" }}>📋</div>
          <h3>No cases yet</h3>
          <p className="text-light">
            Create your first case to get started
          </p>

          <button
            className="btn btn-primary btn-lg mt-3"
            onClick={() => setIsModalOpen(true)}
          >
            Create First Case
          </button>
        </div>
      ) : (
        /* CASE GRID */
        <div className="container">
          <div className="row g-4">

            {cases.map((caseItem) => {
              const caseId = caseItem._id || caseItem.id;

              const updatedDate = caseItem.updatedAt
                ? new Date(caseItem.updatedAt).toLocaleDateString()
                : "N/A";

              return (
                <div key={caseId} className="col-lg-6 col-xl-4">

                  <div
                    className="card h-100 shadow-sm border-0"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleCaseClick(caseId)}
                  >

                    <div className="card-body">

                      {/* TITLE */}
                      <div className="d-flex justify-content-between align-items-start mb-2">

                        <h5 className="mb-0">
                          {caseItem.title}
                        </h5>

                        <span className="badge bg-success">
                          {caseItem.status}
                        </span>

                      </div>

                      {/* CATEGORY */}
                      <div className="mb-2">
                        <span className="badge bg-secondary">
                          {caseItem.category}
                        </span>
                      </div>

                      {/* DESCRIPTION */}
                      <p className="text-muted small">
                        {caseItem.description}
                      </p>

                      {/* STATS */}
                      <div className="d-flex gap-3 flex-wrap text-muted small">

                        <span>📝 {caseItem.notes?.length || 0} Notes</span>
                        <span>📄 {caseItem.documents?.length || 0} Docs</span>
                        <span>📅 {caseItem.deadlines?.length || 0} Deadlines</span>

                      </div>

                    </div>

                    {/* FOOTER */}
                    <div className="card-footer bg-light">
                      <small className="text-muted">
                        Updated {updatedDate}
                      </small>
                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* MODAL */}
      <CreateCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateCase={handleCreateCase}
      />

    </div>
  );
}

export default Dashboard;