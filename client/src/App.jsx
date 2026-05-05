import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CaseProvider } from "./context/CaseContext";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import LoginPage from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import CaseDetails from "./pages/CaseDetails";
import DraftingPleadings from "./pages/DraftingPleadings";
import DocumentGenerator from "./pages/DocumentGenerator";
import CaseBase from "./pages/CaseBase";
import CaseBaseDetails from "./pages/CaseBaseDetails";
import UploadCase from "./pages/UploadCase";
import TriageCase from "./pages/TriageCase";
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
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* ✅ PROTECTED APP WRAPPER */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>

                  {/* ================= CLIENT ================= */}
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
                    path="/client/triage"
                    element={<ProtectedRoute requiredRole="client"><TriageCase /></ProtectedRoute>}
                  />
                  <Route
                    path="/client/case-base"
                    element={<ProtectedRoute requiredRole="client"><CaseBase /></ProtectedRoute>}
                  />
                  <Route
                    path="/client/case-base/:caseId"
                    element={<ProtectedRoute requiredRole="client"><CaseBaseDetails /></ProtectedRoute>}
                  />

                  {/* ================= LAWYER ================= */}
                  <Route
                    path="/lawyer/dashboard"
                    element={<ProtectedRoute requiredRole="lawyer"><Dashboard /></ProtectedRoute>}
                  />
                  <Route
                    path="/lawyer/case/:caseId"
                    element={<ProtectedRoute requiredRole="lawyer"><CaseDetails /></ProtectedRoute>}
                  />
                  <Route
                    path="/lawyer/case/:caseId/pleadings"
                    element={<ProtectedRoute requiredRole="lawyer"><DraftingPleadings /></ProtectedRoute>}
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

                  {/* ================= PARALEGAL ================= */}
                  <Route
                    path="/staff/dashboard"
                    element={<ProtectedRoute requiredRole="paralegal"><Dashboard /></ProtectedRoute>}
                  />
                  <Route
                    path="/staff/case/:caseId"
                    element={<ProtectedRoute requiredRole="paralegal"><CaseDetails /></ProtectedRoute>}
                  />
                  <Route
                    path="/staff/case/:caseId/pleadings"
                    element={<ProtectedRoute requiredRole="paralegal"><DraftingPleadings /></ProtectedRoute>}
                  />
                  <Route
                    path="/staff/chat"
                    element={<ProtectedRoute requiredRole="paralegal"><ChatPage /></ProtectedRoute>}
                  />
                  <Route
                    path="/staff/case-base"
                    element={<ProtectedRoute requiredRole="paralegal"><CaseBase /></ProtectedRoute>}
                  />

                  {/* ================= ADMIN ================= */}
                  <Route
                    path="/admin/dashboard"
                    element={<ProtectedRoute requiredRole="admin"><Dashboard /></ProtectedRoute>}
                  />

                </Route>
              </Route>

              {/* ✅ FALLBACK */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </div>
        </Router>
      </CaseProvider>
    </AuthProvider>
  );
}

export default App;