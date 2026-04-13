import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function EvidenceUpload({ caseId, onDocumentAdded }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/documents/${caseId}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        onDocumentAdded?.(response.data.document);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileChange(e.dataTransfer.files);
  };

  return (
    <div className="evidence-upload">
      <div
        className={`upload-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-input"
          onChange={(e) => handleFileChange(e.target.files)}
          disabled={loading}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" className="upload-label">
          <div className="upload-content">
            <span className="upload-icon">📎</span>
            <h4>Upload Evidence/ Documents</h4>
            <p>Drag and drop or click to select</p>
            <span className="file-types">
              Supported: PDF, DOC, DOCX, JPG, PNG, TXT (Max 10MB)
            </span>
          </div>
        </label>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-message">Uploading...</div>}
    </div>
  );
}

export default EvidenceUpload;
