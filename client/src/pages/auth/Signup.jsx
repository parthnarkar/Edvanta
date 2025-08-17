import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
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
import {
  BookOpen,
  Mail,
  Lock,
  User,
  GraduationCap,
  Briefcase,
} from "lucide-react";

export function Signup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Student",
    interests: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/edvanta-logo.png"
                alt="Edvanta Logo"
                className="h-10 w-10 mr-2"
              />
              <span className="text-2xl font-bold text-primary">Edvanta</span>
            </div>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Start your AI-powered learning journey today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-primary-50 border border-primary-200 rounded-md p-3 text-sm text-primary-600">
                {error}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={
                      formData.role === "Student" ? "default" : "outline"
                    }
                    className="flex-1"
                    onClick={() => handleInputChange("role", "Student")}
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Student
                  </Button>
                  <Button
                    type="button"
                    variant={
                      formData.role === "Professional" ? "default" : "outline"
                    }
                    className="flex-1"
                    onClick={() => handleInputChange("role", "Professional")}
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Professional
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/auth/login"
                  className="font-medium text-primary hover:text-primary-700"
                >
                  Login here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Your Interests</CardTitle>
          <CardDescription>
            Help us personalize your learning experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <UserInterestForm
            initialInterests={formData.interests}
            loading={loading}
            onBack={() => setStep(1)}
            onSubmit={async (selectedInterests) => {
              setLoading(true);
              setError("");
              try {
                const userCredential = await createUserWithEmailAndPassword(
                  auth,
                  formData.email,
                  formData.password
                );
                await updateProfile(userCredential.user, {
                  displayName: formData.name,
                });
                await setDoc(doc(db, "users", userCredential.user.uid), {
                  name: formData.name,
                  email: formData.email,
                  role: formData.role,
                  interests: selectedInterests,
                  createdAt: new Date(),
                });
                navigate("/dashboard");
              } catch (error) {
                setError(error.message);
              } finally {
                setLoading(false);
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
