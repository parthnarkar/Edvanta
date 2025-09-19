import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
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
  Download,
  ArrowRight,
  CheckCircle,
  Clock,
  Sparkles,
  History,
  Mic,
  Square,
  Play,
  Trash2,
} from "lucide-react";
import backEndURL from "../../hooks/helper";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

const steps = [
  { id: "input", title: "Input", icon: FileText },
  { id: "summarize", title: "Summarize", icon: Wand2 },
  { id: "storyboard", title: "Storyboard", icon: Image },
  { id: "generate", title: "Generate", icon: Sparkles },
  { id: "download", title: "Download", icon: Download },
];

export function VisualGenerator() {
  const { user } = useAuth();

  // Core inputs
  const [content, setContent] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState("");
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordedAudioElementRef = useRef(null);

  // UI / progress state
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [historyVideos, setHistoryVideos] = useState([]);

  // Derived step index from progress (simple thresholds)
  const currentStep = (() => {
    if (progress >= 100) return 4; // download
    if (progress >= 70) return 3; // generate
    if (progress >= 40) return 2; // storyboard
    if (progress >= 10) return 1; // summarize
    return 0; // input
  })();

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

  const saveVideoRecord = async (meta) => {
    if (!user || !meta.videoUrl) return;
    try {
      setSaving(true);
      await addDoc(collection(db, "visual_videos"), {
        ...meta,
        userId: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setHistoryVideos([]);
      return;
    }
    let unsub = null;

    const fallbackLoadWithoutIndex = async () => {
      try {
        // Plain query without orderBy (no composite index required)
        const qPlain = query(
          collection(db, "visual_videos"),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(qPlain);
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        // Client-side sort by createdAt (desc)
        list.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        setHistoryVideos(list);
      } catch (e) {
        console.error("History fallback failed", e);
      }
    };

    try {
      const qFull = query(
        collection(db, "visual_videos"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      unsub = onSnapshot(
        qFull,
        (snap) => {
          const list = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
          setHistoryVideos(list);
        },
        (err) => {
          if (err?.code === "failed-precondition") {
            fallbackLoadWithoutIndex();
          } else {
            console.error("History listener error", err);
          }
        }
      );
    } catch (err) {
      if (err?.code === "failed-precondition") {
        fallbackLoadWithoutIndex();
      } else {
        console.error("History init error", err);
      }
    }
    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
        setAudioFile(
          new File([blob], `recording-${Date.now()}.webm`, {
            type: "audio/webm",
          })
        );
      };
      rec.start();
      mediaRecorderRef.current = rec;
      setIsRecording(true);
      setRecordSeconds(0);
    } catch (e) {
      setError(e.message || "Microphone denied");
    }
  };
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  };
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);
  const formatTime = (t) =>
    `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(
      2,
      "0"
    )}`;
  const discardRecording = () => {
    setRecordedAudioUrl("");
    setAudioFile(null);
    recordedChunksRef.current = [];
  };

  async function uploadToCloudinary(file) {
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
    if (!res.ok) throw new Error(data.error?.message || "Upload failed");
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
      setVideoUrl(url);
      setProgress(100);
      await saveVideoRecord({
        sourceType: "text",
        inputSample: content.slice(0, 180),
        videoUrl: url,
      });
    } catch (e) {
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
      const pdfUrl = await uploadToCloudinary(pdfFile);
      const { url } = await postJSON("/api/visual/pdf-url-to-video", {
        pdf_url: pdfUrl,
      });
      setVideoUrl(url);
      setProgress(100);
      await saveVideoRecord({
        sourceType: "pdf",
        inputSample: pdfFile.name,
        videoUrl: url,
        sourceFileName: pdfFile.name,
      });
    } catch {
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
      const audUrl = await uploadToCloudinary(audioFile);
      const { url } = await postJSON("/api/visual/audio-url-to-video", {
        audio_url: audUrl,
      });
      setVideoUrl(url);
      setProgress(100);
      await saveVideoRecord({
        sourceType: recordedAudioUrl ? "recorded-audio" : "audio-file",
        inputSample: audioFile.name,
        videoUrl: url,
        sourceFileName: audioFile.name,
      });
    } catch {
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Visual Content Generator</h1>
        <p className="text-sm text-gray-600">
          Convert Text / PDF / Audio (upload or record) into video.
        </p>
      </div>
      {error && (
        <div className="text-xs p-2 rounded bg-red-100 text-red-700 border border-red-200">
          {error}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4 overflow-x-auto">
            {steps.map((step, index) => {
              const active = index === currentStep;
              const complete = index < currentStep;
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center ${
                    index < steps.length - 1 ? "flex-1" : ""
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-medium transition-colors duration-300 ${
                      complete
                        ? "bg-blue-600 text-white"
                        : active
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {complete ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : active ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full overflow-hidden bg-gray-200`}
                    >
                      <div
                        className={`h-full transition-all duration-500 ${
                          index < currentStep ? "bg-blue-600 w-full" : "w-0"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="mb-1" />
          <p className="text-xs text-gray-500">Progress: {progress}%</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="text" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="pdf">PDF</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
        </TabsList>
        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Text Input</CardTitle>
              <CardDescription>Paste or type your content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full h-48 p-3 border rounded"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Explain neural networks..."
              />
              <Button
                onClick={handleTextSubmit}
                disabled={loading || !content.trim()}
                className="w-full"
              >
                {loading ? "Processing..." : "Generate"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pdf">
          <Card>
            <CardHeader>
              <CardTitle>PDF Upload</CardTitle>
              <CardDescription>
                Upload a PDF (sent to Cloudinary)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-2 border-dashed p-4 text-center rounded">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-2">Select a PDF</p>
                <input
                  id="pdf-file"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                />
                <Button asChild variant="outline" size="sm" className="w-full">
                  <label htmlFor="pdf-file">Choose PDF</label>
                </Button>
                {pdfFile && (
                  <p className="mt-2 text-[10px] text-blue-600">
                    {pdfFile.name}
                  </p>
                )}
              </div>
              <Button
                onClick={handlePdfSubmit}
                disabled={loading || !pdfFile}
                className="w-full"
              >
                {loading ? "Uploading..." : "Process PDF"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audio">
          <Card>
            <CardHeader>
              <CardTitle>Audio Upload / Record</CardTitle>
              <CardDescription>
                Upload an audio file or record now.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed p-4 rounded">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Upload Audio</p>
                      <p className="text-[11px] text-gray-500">
                        MP3 / WAV / M4A
                      </p>
                    </div>
                  </div>
                  <div>
                    <input
                      id="audio-file"
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setAudioFile(f);
                        if (f) setRecordedAudioUrl("");
                      }}
                    />
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      disabled={isRecording}
                    >
                      <label htmlFor="audio-file">Choose</label>
                    </Button>
                  </div>
                </div>
                {audioFile && !recordedAudioUrl && (
                  <p className="mt-2 text-[11px] text-blue-600">
                    {audioFile.name}
                  </p>
                )}
              </div>
              <div className="border p-4 rounded bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Mic className="h-4 w-4" /> Record
                  </p>
                  <span className="text-xs font-mono px-2 py-1 rounded bg-white border">
                    {isRecording ? formatTime(recordSeconds) : "00:00"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isRecording && (
                    <Button size="sm" onClick={startRecording}>
                      <Mic className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {isRecording && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={stopRecording}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  )}
                  {recordedAudioUrl && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (recordedAudioElementRef.current) {
                            recordedAudioElementRef.current.currentTime = 0;
                            recordedAudioElementRef.current.play();
                          }
                        }}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={discardRecording}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Discard
                      </Button>
                    </>
                  )}
                </div>
                {isRecording && (
                  <p className="mt-2 text-[11px] text-red-600 animate-pulse">
                    Recording...
                  </p>
                )}
                {recordedAudioUrl && (
                  <audio
                    ref={recordedAudioElementRef}
                    controls
                    src={recordedAudioUrl}
                    className="w-full mt-3"
                  />
                )}
              </div>
              <Button
                onClick={handleAudioSubmit}
                disabled={loading || !audioFile}
                className="w-full"
              >
                {loading
                  ? "Uploading..."
                  : recordedAudioUrl
                  ? "Process Recording"
                  : "Process Audio"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {videoUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Video</CardTitle>
            <CardDescription>Preview & download.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video w-full bg-black rounded overflow-hidden">
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
                <Button className="w-full">Download</Button>
              </a>
              <Button
                variant="outline"
                onClick={() => {
                  // Reset all state for a fresh run
                  setVideoUrl("");
                  setContent("");
                  setPdfFile(null);
                  setAudioFile(null);
                  setRecordedAudioUrl("");
                  setProgress(0);
                  setError("");
                }}
              >
                New
              </Button>
            </div>
            {user ? (
              <p className="text-xs text-gray-500">
                Saved to history {saving && "(saving...)"}
              </p>
            ) : (
              <p className="text-xs text-gray-500">Login to save history</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Video History</h2>
        </div>
        {!user && (
          <p className="text-xs text-gray-500">Login to view history</p>
        )}
        {user && historyVideos.length === 0 && (
          <p className="text-xs text-gray-500">No videos yet.</p>
        )}
        {user && historyVideos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {historyVideos.map((v) => (
              <div key={v.id} className="border rounded p-3 bg-white space-y-2">
                <div className="aspect-video bg-black/80 rounded overflow-hidden">
                  <video
                    src={v.videoUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {v.sourceType}
                  </Badge>
                  {v.createdAt?.seconds && (
                    <span className="text-[10px] text-gray-500">
                      {new Date(
                        v.createdAt.seconds * 1000
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-700 line-clamp-2">
                  {v.inputSample || v.sourceFileName || "(no sample)"}
                </p>
                <div className="flex gap-2">
                  <a
                    href={v.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button size="sm" className="w-full text-xs">
                      Open
                    </Button>
                  </a>
                  <a href={v.videoUrl} download className="flex-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                    >
                      Download
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
