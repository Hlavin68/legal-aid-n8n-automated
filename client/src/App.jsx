import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CaseProvider } from "./context/CaseContext";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import LoginPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import CaseDetails from "./pages/CaseDetails";
import DocumentGenerator from "./pages/DocumentGenerator";
import CaseBase from "./pages/CaseBase";
import CaseBaseDetails from "./pages/CaseBaseDetails";
import UploadCase from "./pages/UploadCase";
import Home from "./pages/Home";

function App() {
  return (
    <AuthProvider>
      <CaseProvider>
        <Router>
          <div className="d-flex flex-column min-vh-100">
            <Routes>
              {/* ✅ PUBLIC ROUTES */}
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<LoginPage />} />

              {/* ✅ PROTECTED ROUTES */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>

                  {/* CLIENT */}
                  <Route
                    path="/client/dashboard"
                    element={<ProtectedRoute requiredRole="client"><Dashboard /></ProtectedRoute>}
                  />
                  <Route
                    path="/client/case/:caseId"
                    element={<ProtectedRoute requiredRole="client"><CaseDetails /></ProtectedRoute>}
                  />
                  <Route
                    path="/client/documents"
                    element={<ProtectedRoute requiredRole="client"><DocumentGenerator /></ProtectedRoute>}
                  />
                  <Route
                    path="/client/chat"
                    element={<ProtectedRoute requiredRole="client"><ChatPage /></ProtectedRoute>}
                  />
                  <Route
                    path="/client/case-base"
                    element={<ProtectedRoute requiredRole="client"><CaseBase /></ProtectedRoute>}
                  />
                  <Route
                    path="/client/case-base/:caseId"
                    element={<ProtectedRoute requiredRole="client"><CaseBaseDetails /></ProtectedRoute>}
                  />

                  {/* LAWYER */}
                  <Route
                    path="/lawyer/dashboard"
                    element={<ProtectedRoute requiredRole="lawyer"><Dashboard /></ProtectedRoute>}
                  />
                  <Route
                    path="/lawyer/case/:caseId"
                    element={<ProtectedRoute requiredRole="lawyer"><CaseDetails /></ProtectedRoute>}
                  />
                  <Route
                    path="/lawyer/documents"
                    element={<ProtectedRoute requiredRole="lawyer"><DocumentGenerator /></ProtectedRoute>}
                  />
                  <Route
                    path="/lawyer/chat"
                    element={<ProtectedRoute requiredRole="lawyer"><ChatPage /></ProtectedRoute>}
                  />
                  <Route
                    path="/lawyer/case-base"
                    element={<ProtectedRoute requiredRole="lawyer"><CaseBase /></ProtectedRoute>}
                  />
                  <Route
                    path="/lawyer/case-base/:caseId"
                    element={<ProtectedRoute requiredRole="lawyer"><CaseBaseDetails /></ProtectedRoute>}
                  />
                  <Route
                    path="/lawyer/upload-case"
                    element={<ProtectedRoute requiredRole="lawyer"><UploadCase /></ProtectedRoute>}
                  />

                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </CaseProvider>
    </AuthProvider>
  );
}

export default App;