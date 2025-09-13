import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Navbar } from "./components/Layout/Navbar";
import { Sidebar } from "./components/Layout/Sidebar";
import { useAuth } from "./hooks/useAuth";
import { PageTransition } from "./components/ui/PageTransition";
import { LoadingIndicator } from "./components/ui/LoadingIndicator";

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-gray-50">
        <LoadingIndicator 
          message="Verifying access..." 
          size="default"
        />
      </div>
    );
  }

  return user ? children : <Navigate to="/" replace />;
}

// Layout Component for Dashboard Pages
function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16"> {/* Added pt-16 to account for fixed navbar height */}
        <Sidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 min-h-[calc(100vh-4rem)] overflow-x-hidden">
          <PageTransition>
            {children}
          </PageTransition>
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
      <div className="pt-16"> {/* Added pt-16 to account for fixed navbar height */}
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </div>
  );
}

function App() {
  const { loading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);
  const startTimeRef = useRef(Date.now());
  
  // Ensure loading state shows for at least 1.5 seconds
  useEffect(() => {
    if (!loading) {
      const elapsedTime = Date.now() - startTimeRef.current;
      const minimumLoadingTime = 1500; // 1.5 seconds minimum loading time
      const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime); 
      
      console.log(`App loading time: ${elapsedTime}ms, waiting additional: ${remainingTime}ms`);
      
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, remainingTime);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || showLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-gray-50">
        <LoadingIndicator 
          message="Loading your experience..." 
          size="large"
        />
        <p className="mt-1 text-xs text-gray-500">Preparing personalized learning tools</p>
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

        <Route 
          path="/auth/login" 
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          } 
        />
        <Route 
          path="/auth/signup" 
          element={
            <PageTransition>
              <Signup />
            </PageTransition>
          } 
        />

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

        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
