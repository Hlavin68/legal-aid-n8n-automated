import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CaseProvider } from './context/CaseContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import LoginPage from './pages/Auth';

// Client Pages
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import CaseDetails from './pages/CaseDetails';
import DocumentGenerator from './pages/DocumentGenerator';
import CaseBase from './pages/CaseBase';
import CaseBaseDetails from './pages/CaseBaseDetails';
import UploadCase from './pages/UploadCase';

function App() {
  return (
    <AuthProvider>
      <CaseProvider>
        <Router>
          <div className="d-flex flex-column min-vh-100">
            <Routes>
              {/* Auth */}
              <Route path="/auth" element={<LoginPage />} />

              {/* Protected Routes Wrapper */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Navigation />
                    <main className="flex-grow-1">
                      <Routes>
                        {/* Default redirect */}
                        <Route path="/" element={<Navigate to="/client/dashboard" replace />} />

                        {/* CLIENT ROUTES */}
                        <Route
                          path="/client/dashboard"
                          element={
                            <ProtectedRoute requiredRole="client">
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/client/case/:caseId"
                          element={
                            <ProtectedRoute requiredRole="client">
                              <CaseDetails />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/client/documents"
                          element={
                            <ProtectedRoute requiredRole="client">
                              <DocumentGenerator />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/client/chat"
                          element={
                            <ProtectedRoute requiredRole="client">
                              <ChatPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/client/case-base"
                          element={
                            <ProtectedRoute requiredRole="client">
                              <CaseBase />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/client/case-base/:caseId"
                          element={
                            <ProtectedRoute requiredRole="client">
                              <CaseBaseDetails />
                            </ProtectedRoute>
                          }
                        />

                        {/* LAWYER ROUTES */}
                        <Route
                          path="/lawyer/dashboard"
                          element={
                            <ProtectedRoute requiredRole="lawyer">
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/lawyer/case/:caseId"
                          element={
                            <ProtectedRoute requiredRole="lawyer">
                              <CaseDetails />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/lawyer/chat"
                          element={
                            <ProtectedRoute requiredRole="lawyer">
                              <ChatPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/lawyer/case-base"
                          element={
                            <ProtectedRoute requiredRole="lawyer">
                              <CaseBase />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/lawyer/case-base/:caseId"
                          element={
                            <ProtectedRoute requiredRole="lawyer">
                              <CaseBaseDetails />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/lawyer/upload-case"
                          element={
                            <ProtectedRoute requiredRole="lawyer">
                              <UploadCase />
                            </ProtectedRoute>
                          }
                        />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </main>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </CaseProvider>
    </AuthProvider>
  );
}

export default App;