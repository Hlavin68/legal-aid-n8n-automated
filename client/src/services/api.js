/**
 * API Service for Legal Aid Application
 * Handles all HTTP requests to the backend
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.debug('✓ Auth token set in API client');
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    console.debug('✗ Auth token cleared from API client');
  }
};

// Auth Endpoints
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getCurrentUser: () => apiClient.get('/auth/me'),
  updateProfile: (data) => apiClient.put('/auth/profile', data)
};

// Case Endpoints
export const caseAPI = {
  getMyCases: () => apiClient.get('/cases'),
  getCaseById: (caseId) => apiClient.get(`/cases/${caseId}`),
  createCase: (data) => apiClient.post('/cases', data),
  updateCase: (caseId, data) => apiClient.put(`/cases/${caseId}`, data),
  changeStatus: (caseId, status) => apiClient.put(`/cases/${caseId}/status`, { newStatus: status }),
  deleteCase: (caseId) => apiClient.delete(`/cases/${caseId}`),
  assignUser: (caseId, data) => apiClient.post(`/cases/${caseId}/assign`, data),
  removeUser: (caseId, userId) => apiClient.delete(`/cases/${caseId}/users/${userId}`),
  
  // Notes
  addNote: (caseId, content) => apiClient.post(`/cases/${caseId}/notes`, { content }),
  deleteNote: (caseId, noteId) => apiClient.delete(`/cases/${caseId}/notes/${noteId}`),
  
  // Deadlines
  addDeadline: (caseId, data) => apiClient.post(`/cases/${caseId}/deadlines`, data),
  deleteDeadline: (caseId, deadlineId) => apiClient.delete(`/cases/${caseId}/deadlines/${deadlineId}`),
  
  // Case Base
  getCaseBase: (params) => apiClient.get('/cases/base/list', { params }),
  publishToCaseBase: (caseId) => apiClient.post(`/cases/${caseId}/publish`)
};

// Chat Endpoints
export const chatAPI = {
  sendMessage: (data) => apiClient.post('/chat/send', data)
};

// Documents Endpoints
export const documentAPI = {
  generateDocument: (data) => apiClient.post('/documents/generate', data)
};

// Error handler
export const handleAPIError = (error) => {
  const message = error.response?.data?.error || error.message || 'An error occurred';
  const status = error.response?.status;
  
  return {
    message,
    status,
    details: error.response?.data
  };
};

export default apiClient;
