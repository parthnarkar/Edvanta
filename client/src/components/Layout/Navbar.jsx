import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuth } from "../../hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { BookOpen, User, LogOut, Menu, Bell, X } from "lucide-react";
import { getUserProfileImage } from "../../lib/utils";

export function Navbar() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
              <img
                src="/edvanta-logo.png"
                alt="Edvanta Logo"
                className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12"
              />
              <span
                className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600"
                style={{
                  fontFamily:
                    "Poppins, Inter, system-ui, -apple-system, sans-serif",
                }}
              >
                Edvanta
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {user && (
                <Link to="/dashboard" className="nav-link">
                  Dashboard
                </Link>
              )}
            </div>

            {/* Desktop User Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <Bell className="h-5 w-5 text-gray-500 cursor-pointer hover:text-blue-600 transition-colors duration-300" />
                  <div className="flex items-center space-x-2">
                    <img
                      src={getUserProfileImage(user, userProfile)}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border border-blue-500"
                      onError={(e) => {
                        console.error("Error loading profile image:", e.target.src);
                        e.target.src = '/default-avatar.svg';
                      }}
                    />
                    <span className="text-sm font-medium text-gray-900 hidden lg:inline">
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

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {user && (
                <Bell className="h-5 w-5 text-gray-500 cursor-pointer hover:text-blue-600 transition-colors duration-300" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 max-w-[85vw] bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* User Profile Section */}
            {user && (
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center space-x-3">
                  <img
                    src={getUserProfileImage(user, userProfile)}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                    onError={(e) => {
                      console.error("Error loading profile image:", e.target.src);
                      e.target.src = '/default-avatar.svg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userProfile?.name || user.displayName || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                      onClick={closeMobileMenu}
                    >
                      Dashboard
                    </Link>
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Learning Tools
                      </p>
                      <div className="space-y-2">
                        <Link
                          to="/tools/visual-generator"
                          className="block px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                          onClick={closeMobileMenu}
                        >
                          Visual Generator
                        </Link>
                        <Link
                          to="/tools/doubt-solving"
                          className="block px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                          onClick={closeMobileMenu}
                        >
                          Doubt Solving
                        </Link>
                        <Link
                          to="/tools/quizzes"
                          className="block px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                          onClick={closeMobileMenu}
                        >
                          Quizzes
                        </Link>
                        <Link
                          to="/tools/conversational-tutor"
                          className="block px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                          onClick={closeMobileMenu}
                        >
                          Voice Tutor
                        </Link>
                        <Link
                          to="/tools/roadmap"
                          className="block px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                          onClick={closeMobileMenu}
                        >
                          Career Roadmap
                        </Link>
                        <Link
                          to="/tools/resume-builder"
                          className="block px-4 py-3 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                          onClick={closeMobileMenu}
                        >
                          Resume Builder
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      to="/auth/login"
                      className="block px-4 py-3 text-base font-medium text-gray-900 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors duration-200"
                      onClick={closeMobileMenu}
                    >
                      Login
                    </Link>
                    <Link
                      to="/auth/signup"
                      className="block px-4 py-3 text-base font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors duration-200"
                      onClick={closeMobileMenu}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Sign Out Button (for authenticated users) */}
            {user && (
              <div className="p-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
