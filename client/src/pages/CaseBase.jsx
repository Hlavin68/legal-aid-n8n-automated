import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

/**
 * CaseBase Page
 * Displays a library of legal precedent cases
 * Available to: Clients (read-only) and Lawyers (read + upload)
 */
export function CaseBase() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/case-base/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        // Fallback categories
        setCategories([
          "Property Law",
          "Employment Law",
          "Family Law",
          "Criminal Law",
          "Business & Contracts",
          "Corporate Law",
          "Immigration",
          "Intellectual Property",
          "Constitutional Law",
          "Environmental Law",
          "Tax Law",
          "Other"
        ]);
      }
    };

    fetchCategories();
  }, [token]);

  // Fetch cases with search and filters
  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory) params.append("category", selectedCategory);
      params.append("page", currentPage);
      params.append("limit", 12);

      const res = await axios.get(
        `${API_URL}/case-base/list?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        setCases(res.data.cases);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error("Error fetching cases:", err);
      setError("Failed to load cases. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, currentPage, token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setCurrentPage(1);
  };

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1">📚 Legal Case Library</h1>
          <p className="text-muted">
            Case Summaries and Court Judgments
            Discover a comprehensive resource for Case Summaries and Court Judgments in Kenya. 
            This section provides access to a wide range of legal decisions from various Kenyan courts. 
            We offer both detailed case summaries and full-text judgments. The content is suitable for legal professionals, students and researchers. 
            Explore significant rulings, 
            understand key legal principles and stay updated with the latest judicial decisions.
          </p>
        </div>
        {user?.role === "lawyer" && (
          <button
            className="btn btn-primary"
            onClick={() => navigate("/lawyer/upload-case")}
          >
            ➕ Upload New Case
          </button>
        )}
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* FILTERS SECTION */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* SEARCH */}
            <div className="col-md-6">
              <label className="form-label fw-bold">Search Cases</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by title, keywords, court, or judge..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            {/* CATEGORY FILTER */}
            <div className="col-md-6">
              <label className="form-label fw-bold">Category</label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={handleCategoryChange}
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

          {/* CLEAR FILTERS */}
          {(searchTerm || selectedCategory) && (
            <div className="mt-3">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading cases...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="text-center py-5">
          <h4 className="mb-2">📋 No Cases Found</h4>
          <p className="text-muted mb-3">
            {searchTerm || selectedCategory
              ? "Try adjusting your search or filters"
              : "No cases available in the library"}
          </p>
          {(searchTerm || selectedCategory) && (
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* CASES GRID */}
          <div className="row g-4 mb-4">
            {cases.map((caseItem) => (
              <div className="col-lg-4 col-md-6" key={caseItem._id}>
                <div className="card shadow-sm border-0 h-100 d-flex flex-column">
                  <div className="card-body d-flex flex-column">
                    {/* CATEGORY BADGE */}
                    <div className="mb-2">
                      <span className="badge bg-secondary me-2">
                        {caseItem.category}
                      </span>
                      <span className="badge bg-light text-dark">
                        {caseItem.year}
                      </span>
                    </div>

                    {/* TITLE */}
                    <h5 className="card-title fw-bold mb-2 flex-grow-1">
                      {caseItem.title}
                    </h5>

                    {/* BRIEF */}
                    <p className="card-text text-muted small mb-3">
                      {caseItem.brief}
                    </p>

                    {/* METADATA */}
                    <div className="small text-muted mb-3">
                      {caseItem.court && (
                        <div className="mb-1">
                          <strong>Court:</strong> {caseItem.court}
                        </div>
                      )}
                      {caseItem.judge && (
                        <div className="mb-1">
                          <strong>Judge:</strong> {caseItem.judge}
                        </div>
                      )}
                      {caseItem.citation && (
                        <div className="mb-1">
                          <strong>Citation:</strong> {caseItem.citation}
                        </div>
                      )}
                      {caseItem.createdBy && (
                        <div>
                          <strong>By:</strong> {caseItem.createdBy.name}
                        </div>
                      )}
                      <div className="mt-1 text-muted">
                        👁️ {caseItem.views} views
                      </div>
                    </div>

                    {/* VIEW DETAILS BUTTON */}
                    <button
                      className="btn btn-primary btn-sm mt-auto"
                      onClick={() =>
                        navigate(
                          `/${user?.role || "client"}/case-base/${caseItem._id}`
                        )
                      }
                    >
                      View Full Case →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <nav aria-label="Page navigation" className="d-flex justify-content-center">
              <ul className="pagination">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                </li>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <li
                      key={page}
                      className={`page-item ${currentPage === page ? "active" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </li>
                  )
                )}

                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      setCurrentPage(prev => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default CaseBase;