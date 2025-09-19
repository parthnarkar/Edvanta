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
  Upload,
  FileText,
  Wand2,
  Image,
  Video,
  Download,
  ArrowRight,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import backEndURL from "../../hooks/helper";
import { useEffect } from "react";

const steps = [
  { id: "input", title: "Input Content", icon: FileText, status: "completed" },
  { id: "summarize", title: "Summarize", icon: Wand2, status: "active" },
  {
    id: "storyboard",
    title: "Create Storyboard",
    icon: Image,
    status: "pending",
  },
  {
    id: "generate",
    title: "Generate Assets",
    icon: Sparkles,
    status: "pending",
  },
  { id: "download", title: "Download", icon: Download, status: "pending" },
];

export function VisualGenerator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(20);
  const [pdfFile, setPdfFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  // const [pdfUrl, setPdfUrl] = useState("");
  // const [audioUrl, setAudioUrl] = useState("");

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  async function postJSON(path, body) {
    setError("");
    try {
      const res = await fetch(backEndURL + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }

  async function uploadToCloudinary(file) {
    if (!file) throw new Error("No file provided");
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);
    const resourceType = file.type.startsWith("audio")
      ? "video"
      : file.type.startsWith("video")
        ? "video"
        : file.type === "application/pdf"
          ? "raw"
          : "image";
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
    const res = await fetch(endpoint, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Upload failed");
    }
    return data.secure_url;
  }

  const handleTextSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setProgress(10);
    try {
      const { url } = await postJSON("/api/visual/text-to-video", {
        text: content,
      });
      setProgress(90);
      setVideoUrl(url);
      setCurrentStep(steps.length - 1);
      setProgress(100);
    } catch (_) {
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfSubmit = async () => {
    if (!pdfFile) return;
    setLoading(true);
    setProgress(5);
    try {
      const uploadedUrl = await uploadToCloudinary(pdfFile); // returns secure_url
      setProgress(30);
      const { url } = await postJSON("/api/visual/pdf-url-to-video", {
        pdf_url: uploadedUrl,
      });
      setProgress(90);
      setVideoUrl(url);
      setCurrentStep(steps.length - 1);
      setProgress(100);
    } catch (_) {
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioSubmit = async () => {
    if (!audioFile) return;
    setLoading(true);
    setProgress(5);
    try {
      const uploadedUrl = await uploadToCloudinary(audioFile);
      setProgress(30);
      const { url } = await postJSON("/api/visual/audio-url-to-video", {
        audio_url: uploadedUrl,
      });
      setProgress(90);
      setVideoUrl(url);
      setCurrentStep(steps.length - 1);
      setProgress(100);
    } catch (_) {
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const generateContent = () => {
    setLoading(true);
    // Simulate content generation
    setTimeout(() => {
      setLoading(false);
      setCurrentStep(currentStep + 1);
      setProgress(progress + 20);
    }, 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Visual Content Generator
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Transform your text and documents into engaging animated lessons with
          AI-powered visuals.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 text-xs sm:text-sm rounded bg-red-100 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Progress Steps */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />
            Generation Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""
                  }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${index <= currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                    }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="h-3 w-3 sm:h-5 sm:w-5" />
                  ) : index === currentStep ? (
                    <Clock className="h-3 w-3 sm:h-5 sm:w-5" />
                  ) : (
                    <step.icon className="h-3 w-3 sm:h-5 sm:w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 sm:mx-4 ${index < currentStep ? "bg-blue-600" : "bg-gray-200"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="mb-2" />
          <p className="text-xs sm:text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}:{" "}
            {steps[currentStep]?.title}
          </p>
        </CardContent>
      </Card>

      {currentStep === 0 && (
        <Tabs defaultValue="text" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="text-xs sm:text-sm">
              Text Input
            </TabsTrigger>
            <TabsTrigger value="pdf" className="text-xs sm:text-sm">
              PDF Upload
            </TabsTrigger>
            <TabsTrigger value="audio" className="text-xs sm:text-sm">
              Audio Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">
                  Enter Your Content
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Paste your text, notes, or topic description to generate
                  visual content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <textarea
                  className="w-full h-48 sm:h-64 p-3 sm:p-4 text-sm sm:text-base border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your text content here... For example: 'Explain the concept of machine learning algorithms including supervised, unsupervised, and reinforcement learning with examples.'"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <Button
                  onClick={handleTextSubmit}
                  disabled={loading || !content.trim()}
                  className="w-full text-sm sm:text-base py-2 sm:py-3"
                >
                  {loading ? "Processing..." : "Generate Visual Content"}
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pdf">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">PDF Upload</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Upload a PDF document; it will be sent to Cloudinary then
                  processed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag & drop or click to select a PDF
                  </p>
                  <input
                    type="file"
                    accept="application/pdf"
                    id="pdf-file"
                    className="hidden"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <label
                      htmlFor="pdf-file"
                      className="cursor-pointer w-full h-full flex items-center justify-center"
                    >
                      Select PDF
                    </label>
                  </Button>
                  {pdfFile && (
                    <p className="mt-2 text-xs text-blue-600">
                      Selected: {pdfFile.name}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handlePdfSubmit}
                  disabled={loading || !pdfFile}
                  className="w-full text-sm sm:text-base py-2 sm:py-3"
                >
                  {loading ? "Uploading & Processing..." : "Process PDF"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audio">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">
                  Audio Upload
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Upload an audio file (mp3/wav/m4a) to generate a video.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag & drop or click to select audio
                  </p>
                  <input
                    type="file"
                    accept="audio/*"
                    id="audio-file"
                    className="hidden"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <label
                      htmlFor="audio-file"
                      className="cursor-pointer w-full h-full flex items-center justify-center"
                    >
                      Select Audio
                    </label>
                  </Button>
                  {audioFile && (
                    <p className="mt-2 text-xs text-blue-600">
                      Selected: {audioFile.name}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleAudioSubmit}
                  disabled={loading || !audioFile}
                  className="w-full text-sm sm:text-base py-2 sm:py-3"
                >
                  {loading ? "Uploading & Processing..." : "Process Audio"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />
              Content Summary & Outline
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              AI has analyzed your content and created a structured outline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">
                Generated Summary
              </h3>
              <p className="text-blue-800 text-xs sm:text-sm">
                This content covers machine learning fundamentals including
                three main types of algorithms: supervised learning (with
                labeled data), unsupervised learning (pattern finding), and
                reinforcement learning (reward-based learning).
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-sm sm:text-base">
                Content Outline
              </h3>
              <div className="space-y-2">
                {[
                  "Introduction to Machine Learning",
                  "Supervised Learning Algorithms",
                  "Unsupervised Learning Techniques",
                  "Reinforcement Learning Concepts",
                  "Real-world Examples & Applications",
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 sm:gap-3 p-2 border rounded"
                  >
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-xs sm:text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={generateContent}
              className="w-full text-sm sm:text-base py-2 sm:py-3"
              disabled={loading}
            >
              {loading ? "Creating Storyboard..." : "Create Storyboard"}
              <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {videoUrl && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">
              Generated Video
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Preview and download your AI generated video.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={videoUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full text-sm sm:text-base py-2 sm:py-3">
                  Download Video
                </Button>
              </a>
              <Button
                variant="outline"
                onClick={() => {
                  setVideoUrl("");
                  setCurrentStep(0);
                  setProgress(20);
                }}
                className="text-sm sm:text-base py-2 sm:py-3"
              >
                Generate Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
