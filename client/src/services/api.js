// ================= API SERVICE =================
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ================= AXIOS INSTANCE =================
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ================= TOKEN MANAGEMENT =================
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Load token on app start
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// ================= INTERCEPTORS =================

// Request interceptor (attach token)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle auth errors)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid → logout
      setAuthToken(null);
      window.location.href = '/auth';
    }

    return Promise.reject(error);
  }
);

// ================= AUTH =================
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getCurrentUser: () => apiClient.get('/auth/me'),
  updateProfile: (data) => apiClient.put('/auth/profile', data)
};

// ================= CASE =================
export const caseAPI = {
  getMyCases: () => apiClient.get('/cases'),
  getCaseById: (caseId) => apiClient.get(`/cases/${caseId}`),
  createCase: (data) => apiClient.post('/cases', data),
  updateCase: (caseId, data) => apiClient.put(`/cases/${caseId}`, data),
  changeStatus: (caseId, status) =>
    apiClient.put(`/cases/${caseId}/status`, { newStatus: status }),
  deleteCase: (caseId) => apiClient.delete(`/cases/${caseId}`),
  assignUser: (caseId, data) => apiClient.post(`/cases/${caseId}/assign`, data),
  removeUser: (caseId, userId) =>
    apiClient.delete(`/cases/${caseId}/users/${userId}`),

  // Notes
  addNote: (caseId, content) =>
    apiClient.post(`/cases/${caseId}/notes`, { content }),
  deleteNote: (caseId, noteId) =>
    apiClient.delete(`/cases/${caseId}/notes/${noteId}`),

  // Deadlines
  addDeadline: (caseId, data) =>
    apiClient.post(`/cases/${caseId}/deadlines`, data),
  deleteDeadline: (caseId, deadlineId) =>
    apiClient.delete(`/cases/${caseId}/deadlines/${deadlineId}`),

  // Case Base
  getCaseBase: (params) =>
    apiClient.get('/cases/base/list', { params }),
  publishToCaseBase: (caseId) =>
    apiClient.post(`/cases/${caseId}/publish`)
};

// ================= CHAT =================
export const chatAPI = {
  sendMessage: (data) => apiClient.post('/chat/send', data),

  startNewSession: (data) =>
    apiClient.post('/chat/sessions/new', data),

  getAllSessions: (archived = false) =>
    apiClient.get('/chat/sessions', { params: { archived } }),

  getSessionHistory: (sessionId) =>
    apiClient.get(`/chat/sessions/${sessionId}`),

  updateSession: (sessionId, data) =>
    apiClient.put(`/chat/sessions/${sessionId}`, data),

  deleteSession: (sessionId) =>
    apiClient.delete(`/chat/sessions/${sessionId}`),

  toggleArchiveSession: (sessionId) =>
    apiClient.put(`/chat/sessions/${sessionId}/toggle-archive`),

  deleteMessage: (sessionId, messageId) =>
    apiClient.delete(`/chat/sessions/${sessionId}/messages/${messageId}`)
};

// ================= DOCUMENTS =================
export const documentAPI = {
  generateDocument: (data) =>
    apiClient.post('/documents/generate', data)
};

// ================= ERROR HANDLER =================
export const handleAPIError = (error) => {
  return {
    message:
      error.response?.data?.error ||
      error.message ||
      'An error occurred',
    status: error.response?.status,
    details: error.response?.data
  };
};

export default apiClient;