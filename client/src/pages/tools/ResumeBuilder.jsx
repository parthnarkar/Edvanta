import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  FileText,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Star,
  Award,
  Target,
  TrendingUp,
  CheckCircle,
  Plus,
  Save,
  Share,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";
import backEndURL from "../../hooks/helper";

export function ResumeBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [activeSection, setActiveSection] = useState("personal");
  const [resumeData, setResumeData] = useState({
    personal: {
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      website: "johndoe.dev",
    },
  });
  const [analyzeTab, setAnalyzeTab] = useState({
    file: null,
    text: "",
    job: "",
  });
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState(null);

  const templates = [
    {
      id: "modern",
      name: "Modern Professional",
      preview: "/api/placeholder/300/400",
      description: "Clean and contemporary design",
      category: "Professional",
    },
    {
      id: "creative",
      name: "Creative Designer",
      preview: "/api/placeholder/300/400",
      description: "Colorful and artistic layout",
      category: "Creative",
    },
    {
      id: "minimal",
      name: "Minimal Classic",
      preview: "/api/placeholder/300/400",
      description: "Simple and elegant format",
      category: "Classic",
    },
    {
      id: "technical",
      name: "Technical Expert",
      preview: "/api/placeholder/300/400",
      description: "Perfect for developers and engineers",
      category: "Technical",
    },
  ];

  const sections = [
    { id: "personal", name: "Personal Info", icon: User, completed: true },
    {
      id: "summary",
      name: "Professional Summary",
      icon: FileText,
      completed: false,
    },
    {
      id: "experience",
      name: "Work Experience",
      icon: Briefcase,
      completed: false,
    },
    {
      id: "education",
      name: "Education",
      icon: GraduationCap,
      completed: false,
    },
    { id: "skills", name: "Skills", icon: Star, completed: false },
    { id: "projects", name: "Projects", icon: Target, completed: false },
  ];

  const atsScore = 85;

  async function uploadResumeFile(file) {
    const form = new FormData();
    form.append("resume", file);
    const res = await fetch(`${backEndURL}/api/resume/upload`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  }

  async function analyzeResume() {
    setAnalyzeError("");
    setAnalyzeResult(null);
    if (!analyzeTab.job.trim()) {
      setAnalyzeError("Job description is required");
      return;
    }
    setAnalyzeLoading(true);
    try {
      let payload;
      if (analyzeTab.text.trim()) {
        payload = {
          resume_text: analyzeTab.text.trim(),
          job_description: analyzeTab.job.trim(),
        };
      } else if (analyzeTab.file) {
        const uploaded = await uploadResumeFile(analyzeTab.file);
        payload = {
          public_id: uploaded.public_id,
          file_format: analyzeTab.file.name.toLowerCase().endsWith(".docx")
            ? "docx"
            : "pdf",
          job_description: analyzeTab.job.trim(),
        };
      } else {
        throw new Error("Provide resume text or upload a file");
      }
      const res = await fetch(`${backEndURL}/api/resume/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setAnalyzeResult(data.analysis);
    } catch (e) {
      setAnalyzeError(e.message);
    } finally {
      setAnalyzeLoading(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Resume Builder
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          AI-powered resume optimization and ATS scoring to land your dream job
        </p>
      </div>

      <Tabs defaultValue="analyze" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex gap-1">
          <TabsTrigger value="analyze" className="text-xs sm:text-sm py-2">
            Analyze
          </TabsTrigger>
          <TabsTrigger value="builder" className="text-xs sm:text-sm py-2">
            Builder
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs sm:text-sm py-2">
            Templates
          </TabsTrigger>
          <TabsTrigger value="optimize" className="text-xs sm:text-sm py-2">
            Optimize
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-4 sm:space-y-6">
          {analyzeError && (
            <div className="p-3 text-xs sm:text-sm rounded bg-red-100 text-red-700 border border-red-200">
              {analyzeError}
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Analyze Resume vs Job Description
              </CardTitle>
              <CardDescription>
                Upload a PDF/DOCX or paste your resume text, and provide the job
                description (required).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Upload Resume (PDF/DOCX)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag & drop or click to select file
                    </p>
                    <input
                      type="file"
                      accept="application/pdf,.docx"
                      id="resume-file"
                      className="hidden"
                      onChange={(e) =>
                        setAnalyzeTab((prev) => ({
                          ...prev,
                          file: e.target.files?.[0] || null,
                        }))
                      }
                    />
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <label
                        htmlFor="resume-file"
                        className="cursor-pointer w-full h-full flex items-center justify-center"
                      >
                        Select File
                      </label>
                    </Button>
                    {analyzeTab.file && (
                      <p className="mt-2 text-xs text-blue-600">
                        Selected: {analyzeTab.file.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Or Paste Resume Text
                    </label>
                    <textarea
                      className="w-full h-40 p-3 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Paste your resume text here..."
                      value={analyzeTab.text}
                      onChange={(e) =>
                        setAnalyzeTab((prev) => ({
                          ...prev,
                          text: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Job Description (required)
                  </label>
                  <textarea
                    className="w-full h-64 p-3 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Paste the job description here..."
                    value={analyzeTab.job}
                    onChange={(e) =>
                      setAnalyzeTab((prev) => ({
                        ...prev,
                        job: e.target.value,
                      }))
                    }
                  />
                  <Button
                    onClick={analyzeResume}
                    disabled={
                      analyzeLoading ||
                      !analyzeTab.job.trim() ||
                      (!analyzeTab.file && !analyzeTab.text.trim())
                    }
                    className="w-full text-sm sm:text-base py-2 sm:py-3"
                  >
                    {analyzeLoading ? "Analyzing..." : "Analyze Resume"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {analyzeResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Analysis Result
                </CardTitle>
                <CardDescription>
                  Insights and recommendations tailored to the job description.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Top row: Score + Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative inline-flex">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            className="text-gray-200"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r="44"
                            cx="48"
                            cy="48"
                          />
                          <circle
                            className="text-blue-600"
                            strokeWidth="8"
                            strokeDasharray={`${
                              Math.min(
                                100,
                                Math.max(0, analyzeResult.match_score ?? 0)
                              ) * 2.76
                            } 276`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="44"
                            cx="48"
                            cy="48"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                          {typeof analyzeResult.match_score !== "undefined"
                            ? analyzeResult.match_score
                            : "--"}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Match Score
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    {analyzeResult.summary && (
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">
                          Summary
                        </h4>
                        <p className="text-sm text-blue-800">
                          {analyzeResult.summary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle: Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">Strengths</h4>
                    <div className="space-y-2">
                      {(analyzeResult.strengths || []).map((s, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-md bg-green-50 border border-green-100 text-sm text-green-900"
                        >
                          {s}
                        </div>
                      ))}
                      {(!analyzeResult.strengths ||
                        analyzeResult.strengths.length === 0) && (
                        <p className="text-xs text-gray-500">
                          No strengths identified.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">Improvements</h4>
                    <div className="space-y-2">
                      {(analyzeResult.improvements || []).map((s, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-md bg-yellow-50 border border-yellow-100 text-sm text-yellow-900"
                        >
                          {s}
                        </div>
                      ))}
                      {(!analyzeResult.improvements ||
                        analyzeResult.improvements.length === 0) && (
                        <p className="text-xs text-gray-500">
                          No improvement suggestions.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="builder" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Resume Sections */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Resume Sections
                  </CardTitle>
                  <CardDescription>
                    Complete each section to build your resume
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        activeSection === section.id
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <section.icon
                        className={`h-4 w-4 mr-3 ${
                          section.completed ? "text-green-600" : "text-gray-400"
                        }`}
                      />
                      <span className="flex-1 text-sm font-medium">
                        {section.name}
                      </span>
                      {section.completed && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  ))}

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Completion</span>
                      <span className="text-sm text-gray-600">17%</span>
                    </div>
                    <Progress value={17} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs sm:text-sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import from LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs sm:text-sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Import Existing Resume
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs sm:text-sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Auto-Fill
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Section Editor */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    {sections.find((s) => s.id === activeSection)?.icon &&
                      React.createElement(
                        sections.find((s) => s.id === activeSection).icon,
                        { className: "h-5 w-5" }
                      )}
                    {sections.find((s) => s.id === activeSection)?.name}
                  </CardTitle>
                  <CardDescription>
                    Fill in your information for this section
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeSection === "personal" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input
                          value={resumeData.personal.name}
                          onChange={(e) =>
                            setResumeData({
                              ...resumeData,
                              personal: {
                                ...resumeData.personal,
                                name: e.target.value,
                              },
                            })
                          }
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="email"
                            value={resumeData.personal.email}
                            className="pl-10 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            value={resumeData.personal.phone}
                            className="pl-10 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            value={resumeData.personal.location}
                            className="pl-10 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium">
                          Website/Portfolio
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            value={resumeData.personal.website}
                            className="pl-10 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === "summary" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Professional Summary
                        </label>
                        <textarea
                          placeholder="Write a compelling summary of your professional experience and goals..."
                          className="w-full h-32 p-3 border rounded-lg text-sm sm:text-base resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs sm:text-sm"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate with AI
                      </Button>
                    </div>
                  )}

                  {activeSection === "experience" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">
                          Work Experience
                        </h3>
                        <Button size="sm" className="text-xs sm:text-sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Experience
                        </Button>
                      </div>
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600 text-center">
                          No work experience added yet. Click "Add Experience"
                          to get started.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 border-t">
                    <Button className="flex-1 text-sm sm:text-base">
                      <Save className="h-4 w-4 mr-2" />
                      Save Section
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-sm sm:text-base"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Resume
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Choose Template
              </CardTitle>
              <CardDescription>
                Select a professional template that matches your industry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`cursor-pointer group ${
                      selectedTemplate === template.id
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                      <div className="aspect-[3/4] bg-gray-100 rounded-t-lg flex items-center justify-center">
                        <FileText className="h-12 w-12 text-gray-400" />
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm sm:text-base">
                            {template.name}
                          </h3>
                          {selectedTemplate === template.id && (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                          {template.description}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimize" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* ATS Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Award className="h-5 w-5" />
                  ATS Score
                </CardTitle>
                <CardDescription>
                  How well your resume performs with Applicant Tracking Systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="relative inline-flex">
                    <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90">
                      <circle
                        className="text-gray-200"
                        strokeWidth="6"
                        stroke="currentColor"
                        fill="transparent"
                        r="34"
                        cx="48"
                        cy="48"
                      />
                      <circle
                        className="text-green-500"
                        strokeWidth="6"
                        strokeDasharray={`${atsScore * 2.14} 214`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="34"
                        cx="48"
                        cy="48"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl font-bold">
                      {atsScore}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-600">
                      Excellent
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Your resume is highly optimized for ATS systems
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimization Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Optimization Tips
                </CardTitle>
                <CardDescription>
                  Suggestions to improve your resume
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Good keyword usage</p>
                    <p className="text-xs text-gray-600">
                      Your resume includes relevant industry keywords
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      Add more quantifiable achievements
                    </p>
                    <p className="text-xs text-gray-600">
                      Include numbers and metrics in your experience
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      Tailor for specific roles
                    </p>
                    <p className="text-xs text-gray-600">
                      Customize your resume for each job application
                    </p>
                  </div>
                </div>

                <Button className="w-full text-sm sm:text-base">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto-Optimize Resume
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button className="flex-1 text-sm sm:text-base">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" className="flex-1 text-sm sm:text-base">
              <Share className="h-4 w-4 mr-2" />
              Share Resume
            </Button>
            <Button variant="outline" className="flex-1 text-sm sm:text-base">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
