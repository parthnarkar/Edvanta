import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../../lib/firebase";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { UserInterestForm } from "../../components/ui/UserInterestForm";
import { BookOpen, Mail, Lock } from "lucide-react";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (
        userDoc.exists() &&
        Array.isArray(userDoc.data().interests) &&
        userDoc.data().interests.length > 0
      ) {
        navigate("/dashboard");
      } else {
        setGoogleUser(user);
        setShowInterestForm(true);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (showInterestForm && googleUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-xs sm:max-w-lg my-20">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl">Choose Your Interests</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Help us personalize your learning experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            <UserInterestForm
              loading={loading}
              onSubmit={async (selectedInterests) => {
                setLoading(true);
                setError("");
                try {
                  await setDoc(
                    doc(db, "users", googleUser.uid),
                    {
                      name: googleUser.displayName,
                      email: googleUser.email,
                      role: "Student",
                      interests: selectedInterests,
                      photoURL: googleUser.photoURL || null,
                      createdAt: new Date(),
                    },
                    { merge: true }
                  );
                  navigate("/dashboard");
                } catch (error) {
                  setError(error.message);
                } finally {
                  setLoading(false);
                }
              }}
            />
            {error && (
              <div className="bg-primary-50 border border-primary-200 rounded-md p-3 text-xs sm:text-sm text-primary-600">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-xs sm:max-w-md my-20">
        <CardHeader className="text-center px-4 sm:px-6">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <img
              src="/edvanta-logo.png"
              alt="Edvanta Logo"
              className="h-8 w-8 sm:h-10 sm:w-10 mr-2"
            />
            <span className="text-xl sm:text-2xl font-bold text-primary">Edvanta</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl">Welcome Back</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Sign in to continue your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          {error && (
            <div className="bg-primary-50 border border-primary-200 rounded-md p-3 text-xs sm:text-sm text-primary-600">
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            variant="outline"
            className="w-full flex items-center justify-center text-sm sm:text-base py-2 sm:py-3"
          >
            <img
              src="/src/assets/google-icon.png"
              alt="Google"
              className="h-3 w-3 sm:h-4 sm:w-4 mr-2"
            />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-3 sm:space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 sm:pl-10 text-sm sm:text-base py-2 sm:py-3"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 sm:pl-10 text-sm sm:text-base py-2 sm:py-3"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full text-sm sm:text-base py-2 sm:py-3" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/auth/signup"
                className="font-medium text-primary hover:text-primary-700"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
