import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

/**
 * UploadCase Component
 * Allows lawyers to upload new cases with PDF documents to the Case Base
 */
export default function UploadCase() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    brief: "",
    description: "",
    year: new Date().getFullYear(),
    court: "",
    judge: "",
    citation: "",
    keywords: "",
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect non-lawyers
  useEffect(() => {
    if (user && user.role !== "lawyer") {
      navigate("/");
    }
  }, [user, navigate]);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/case-base/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        console.error("Error loading categories:", err);

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
          "Other",
        ]);
      }
    };

    if (token) {
      fetchCategories();
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      setPdfFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("PDF must be less than 50MB.");
      setPdfFile(null);
      return;
    }

    setPdfFile(file);
    setError("");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      brief: "",
      description: "",
      year: new Date().getFullYear(),
      court: "",
      judge: "",
      citation: "",
      keywords: "",
    });

    setPdfFile(null);
    setUploadProgress(0);
  };

  const validateForm = () => {
    if (!formData.title.trim()) return "Case title is required.";
    if (!formData.category) return "Category is required.";
    if (!formData.brief.trim()) return "Brief summary is required.";
    if (!pdfFile) return "PDF document is required.";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      const uploadData = new FormData();
      uploadData.append("title", formData.title.trim());
      uploadData.append("category", formData.category);
      uploadData.append("brief", formData.brief.trim());
      uploadData.append("description", formData.description.trim());
      uploadData.append("year", formData.year);
      uploadData.append("court", formData.court.trim());
      uploadData.append("judge", formData.judge.trim());
      uploadData.append("citation", formData.citation.trim());
      uploadData.append("keywords", formData.keywords);
      uploadData.append("pdf", pdfFile);

      const res = await axios.post(
        `${API_URL}/case-base/cases`,
        uploadData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (event) => {
            if (!event.total) return;

            const percent = Math.round(
              (event.loaded * 100) / event.total
            );

            setUploadProgress(percent);
          },
        }
      );

      if (res.data.success) {
        setSuccess("Case uploaded successfully.");
        resetForm();

        setTimeout(() => {
          navigate("/lawyer/case-base");
        }, 1800);
      }
    } catch (err) {
      console.error("Upload error:", err);

      setError(
        err.response?.data?.error ||
          "Failed to upload case. Please try again."
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="mb-4">
        <h1 className="fw-bold mb-2">Upload New Case</h1>
        <p className="text-muted mb-0">
          Add a new legal case with PDF judgment to the Case Base.
        </p>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          <strong>Success!</strong> {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          ></button>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          <strong>Error!</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="card shadow-sm border-0"
      >
        <div className="card-body">
          {/* TITLE + CATEGORY */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">
                Case Title *
              </label>
              <input
                type="text"
                className="form-control"
                name="title"
                placeholder="e.g. Republic vs John Doe"
                value={formData.title}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">
                Category *
              </label>
              <select
                className="form-select"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">-- Select Category --</option>

                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* BRIEF */}
          <div className="mb-3">
            <label className="form-label fw-bold">
              Brief Summary *
            </label>

            <textarea
              className="form-control"
              rows="3"
              name="brief"
              maxLength="500"
              placeholder="Short summary of the case"
              value={formData.brief}
              onChange={handleInputChange}
              disabled={loading}
            />

            <small className="text-muted">
              {formData.brief.length}/500 characters
            </small>
          </div>

          {/* DESCRIPTION */}
          <div className="mb-3">
            <label className="form-label fw-bold">
              Full Description
            </label>

            <textarea
              className="form-control"
              rows="4"
              name="description"
              placeholder="Detailed explanation of the judgment and significance"
              value={formData.description}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* COURT / JUDGE / YEAR */}
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label fw-bold">
                Court
              </label>

              <input
                type="text"
                className="form-control"
                name="court"
                placeholder="High Court of Kenya"
                value={formData.court}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">
                Judge
              </label>

              <input
                type="text"
                className="form-control"
                name="judge"
                placeholder="Judge name"
                value={formData.judge}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">
                Year
              </label>

              <input
                type="number"
                className="form-control"
                name="year"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.year}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* CITATION / KEYWORDS */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">
                Citation
              </label>

              <input
                type="text"
                className="form-control"
                name="citation"
                placeholder="e.g. [2023] eKLR"
                value={formData.citation}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">
                Keywords
              </label>

              <input
                type="text"
                className="form-control"
                name="keywords"
                placeholder="contract, land dispute, fraud"
                value={formData.keywords}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* PDF FILE */}
          <div className="mb-4">
            <label className="form-label fw-bold">
              PDF Document *
            </label>

            <input
              type="file"
              className="form-control"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={loading}
            />

            {pdfFile && (
              <small className="text-success d-block mt-2">
                ✓ {pdfFile.name} (
                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
              </small>
            )}

            <small className="text-muted d-block mt-1">
              Maximum size: 50MB
            </small>
          </div>

          {/* PROGRESS */}
          {loading && uploadProgress > 0 && (
            <div className="mb-3">
              <div className="progress">
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  style={{ width: `${uploadProgress}%` }}
                >
                  {uploadProgress}%
                </div>
              </div>
            </div>
          )}

          {/* BUTTONS */}
          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Uploading...
                </>
              ) : (
                "Upload Case"
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/lawyer/case-base")}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      {/* TIPS */}
      <div className="card border-0 bg-light mt-4">
        <div className="card-body">
          <h6 className="fw-bold mb-2">
            📋 Tips for Uploading
          </h6>

          <ul className="small mb-0">
            <li>Upload the full judgment PDF</li>
            <li>Fill all required fields (*)</li>
            <li>Use searchable keywords</li>
            <li>Add court, judge and year</li>
            <li>Uploaded cases become available immediately</li>
          </ul>
        </div>
      </div>
    </div>
  );
}