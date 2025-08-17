import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Navbar } from "./components/Layout/Navbar";
import { Sidebar } from "./components/Layout/Sidebar";
import { useAuth } from "./hooks/useAuth";

// Pages
import Home from "./pages/Home";
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { Dashboard } from "./pages/Dashboard";
import { VisualGenerator } from "./pages/tools/VisualGenerator";
import { DoubtSolving } from "./pages/tools/DoubtSolving";
import { Quizzes } from "./pages/tools/Quizzes";

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/auth/login" />;
}

// Layout Component for Dashboard Pages
function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

// Layout Component for Public Pages
function PublicLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
    </div>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />

        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/visual-generator"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <VisualGenerator />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/doubt-solving"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DoubtSolving />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/quizzes"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Quizzes />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Placeholder routes for remaining tools */}
        <Route
          path="/tools/conversational-tutor"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <div className="text-center py-20">
                  <h1 className="text-2xl font-bold mb-4">Voice Tutor</h1>
                  <p className="text-gray-600">
                    Coming Soon - Interactive voice-based learning with AI
                  </p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/roadmap"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <div className="text-center py-20">
                  <h1 className="text-2xl font-bold mb-4">Career Roadmap</h1>
                  <p className="text-gray-600">
                    Coming Soon - Personalized learning paths and career
                    guidance
                  </p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/resume-builder"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <div className="text-center py-20">
                  <h1 className="text-2xl font-bold mb-4">Resume Builder</h1>
                  <p className="text-gray-600">
                    Coming Soon - AI-powered resume optimization and ATS scoring
                  </p>
                </div>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
