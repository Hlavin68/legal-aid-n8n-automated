import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export function CaseBase() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (searchTerm) params.append("search", searchTerm);

      const res = await axios.get(
        `${API_URL}/cases/base/list?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        setCases(res.data.cases);
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm, token]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const categories = [
    "Property Law",
    "Employment Law",
    "Family Law",
    "Criminal Law",
    "Business & Contracts",
    "Corporate Law",
    "Immigration",
    "Intellectual Property"
  ];

  return (
    <div className="container py-4">

      {/* HEADER */}
      <div className="text-center mb-4">
        <h1 className="fw-bold">📚 Case Library</h1>
        <p className="text-muted">
          Learn from completed cases in Kenya legal system
        </p>
      </div>

      {/* FILTERS */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">

          <div className="row g-3">

            {/* SEARCH */}
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* CATEGORY */}
            <div className="col-md-6">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
          <p className="mt-3 text-muted">Loading cases...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-5">
          <div style={{ fontSize: "3rem" }}>📋</div>
          <h4 className="mt-2">No cases found</h4>
          <p className="text-muted">
            Try adjusting your filters or search term
          </p>
        </div>
      ) : (
        <div className="row g-4">

          {cases.map((caseItem) => (
            <div className="col-lg-6" key={caseItem._id}>
              <div className="card shadow-sm border-0 h-100">

                <div className="card-body">

                  {/* HEADER */}
                  <div className="d-flex justify-content-between align-items-start mb-2">

                    <div>
                      <h5 className="mb-1">{caseItem.title}</h5>
                      <span className="badge bg-secondary">
                        {caseItem.category}
                      </span>
                    </div>

                    <span className="badge bg-success">
                      Closed
                    </span>

                  </div>

                  {/* DESCRIPTION */}
                  <p className="text-muted small">
                    {caseItem.description}
                  </p>

                  {/* META */}
                  <div className="d-flex flex-wrap gap-3 text-muted small mb-2">

                    <span>
                      📅{" "}
                      {new Date(caseItem.createdAt).toLocaleDateString("en-KE")}
                    </span>

                    {caseItem.lawyerId && (
                      <span>👨‍⚖️ {caseItem.lawyerId.name}</span>
                    )}

                  </div>

                  {/* SUMMARY */}
                  {caseItem.summary && (
                    <div className="mb-3 p-2 bg-light rounded">
                      <h6 className="mb-1">Summary</h6>
                      <p className="mb-0 small">
                        {caseItem.summary}
                      </p>
                    </div>
                  )}

                  {/* DETAILS */}
                  <div className="small text-muted">

                    {caseItem.documents?.length > 0 && (
                      <div>
                        📄 Documents: {caseItem.documents.length}
                      </div>
                    )}

                    {caseItem.notes?.length > 0 && (
                      <div>
                        📝 Notes: {caseItem.notes.length}
                      </div>
                    )}

                  </div>

                  {/* VIEW DETAILS BUTTON */}
                  <div className="mt-3">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate(`${user.role === 'client' ? '/client' : '/lawyer'}/case-base/${caseItem._id}`)}
                    >
                      View Details
                    </button>
                  </div>

                </div>

              </div>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default CaseBase;