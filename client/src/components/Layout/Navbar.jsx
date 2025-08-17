import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuth } from "../../hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { BookOpen, User, LogOut, Menu, Bell } from "lucide-react";

export function Navbar() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="border-b border-border bg-surface/95 backdrop-blur-sm sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/edvanta-logo.png"
              alt="Edvanta Logo"
              className="h-12 w-12"
            />
            <span
              className="text-2xl font-bold text-primary"
              style={{
                fontFamily:
                  "Poppins, Inter, system-ui, -apple-system, sans-serif",
              }}
            >
              Edvanta
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="nav-link">
              Home
            </Link>
            {user && (
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-text-secondary cursor-pointer hover:text-primary transition-colors duration-300" />
                <div className="flex items-center space-x-2">
                  {userProfile?.photoURL || user?.photoURL ? (
                    <img
                      src={userProfile?.photoURL || user?.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border border-primary"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-text-primary">
                    {userProfile?.name || user.displayName || "User"}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" asChild>
                  <Link to="/auth/login">Login</Link>
                </Button>
                <Button variant="gradient" asChild>
                  <Link to="/auth/signup">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
