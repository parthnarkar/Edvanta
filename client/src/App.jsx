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
import { ConversationalTutor } from "./pages/tools/ConversationalTutor";
import { Roadmap } from "./pages/tools/Roadmap";
import { ResumeBuilder } from "./pages/tools/ResumeBuilder";

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
        <main className="flex-1 p-3 sm:p-4 md:p-6 min-h-[calc(100vh-4rem)] overflow-x-hidden">
          {children}
        </main>
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

        <Route
          path="/tools/conversational-tutor"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ConversationalTutor />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/roadmap"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Roadmap />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tools/resume-builder"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ResumeBuilder />
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
