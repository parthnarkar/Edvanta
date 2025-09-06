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
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MessageSquare,
  Sparkles,
  BookOpen,
  Users,
  Brain,
  LogIn,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import backEndURL from "../../hooks/helper";
import { useAuth } from "../../hooks/useAuth";

// UI text constants to avoid hardcoding
const UI_TEXT = {
  loading: "Loading Voice Tutor...",
  loginRequired: "Login Required",
  loginMessage:
    "Please log in to access the Voice Tutor. Your sessions will be personalized and saved.",
  loginButton: "Go to Login",
  voiceTutor: "Voice Tutor",
  welcome: "Welcome",
  interactiveVoice: "Interactive voice-based learning",
  startButton: "Start",
  stopButton: "Stop",
  chooseLearningMode: "Choose Learning Mode",
  selectInteraction: "Select how you'd like to interact with your AI tutor",
  subjectFocus: "Subject Focus",
  enterTopic: "Enter the topic you'd like to practice or learn about",
  subjectPlaceholder:
    "e.g., Mathematics, Python Programming, World History, Spanish Grammar...",
  subjectHint: "Be specific to get the most relevant tutoring experience",
  voiceInteraction: "Voice Interaction",
  voiceDescription: "This tutor uses voice for natural conversation",
  howItWorks: "How it works:",
  stepOne: "Press the microphone button and speak your question",
  stepTwo: "Your speech is converted to text and sent to the AI",
  stepThree:
    "The AI response will be spoken back to you using your device's speakers",
  deviceCheck: "Make sure your microphone and speakers are working correctly",
  noSubject: "No subject",
  speaking: "Speaking...",
  voiceMessage: "Voice message",
  speakAgain: "Speak again",
  tutorThinking: "Tutor is thinking...",
  recording: "Recording...",
  speakClearly: "Speak clearly and click the button when done",
  aiSpeaking: "AI is speaking...",
  stopSpeaking: "Stop Speaking",
  pressToAsk: "Press to ask another question",
  pressToStart: "Press the microphone button and speak your question",
  connectionError: "Connection error. Please try again.",
};

export function ConversationalTutor() {
  // Core state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedMode, setSelectedMode] = useState("tutor");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Voice synthesis related
  const speechSynthesisRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Use authentication
  const { user, loading: authLoading } = useAuth();

  // Initialize speech synthesis
  useEffect(() => {
    if ("speechSynthesis" in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    } else {
      console.error("Text-to-speech not supported in this browser");
    }

    return () => {
      // Stop any ongoing speech when component unmounts
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-speak the latest AI response
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && !lastMessage.isSystemMessage) {
        speakText(lastMessage.content);
      }
    }
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    // Check if the browser supports SpeechRecognition
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = "en-US";

      speechRecognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");

        setTranscript(transcript);
        setCurrentInput(transcript);
      };

      speechRecognitionRef.current.onend = () => {
        if (isRecording) {
          // Restart recognition if it was supposed to be recording
          speechRecognitionRef.current.start();
        }
      };

      speechRecognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
    } else {
      console.error("Speech recognition not supported in this browser");
    }

    // Cleanup
    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, []);

  // Handle recording state changes
  useEffect(() => {
    if (isRecording) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.start();
      }
    } else {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();

        // If there's transcript and we're in an active session, send it
        if (transcript.trim() && isSessionActive) {
          sendVoiceMessage(transcript);
          setTranscript("");
        }
      }
    }
  }, [isRecording]);

  // Text-to-speech function using Web Speech API
  const speakText = (text) => {
    if (!speechSynthesisRef.current) {
      console.error("Text-to-speech not available");
      return;
    }

    // Cancel any ongoing speech
    speechSynthesisRef.current.cancel();

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Set speech properties
    utterance.rate = 1.0; // Speed of speech (0.1 to 10)
    utterance.pitch = 1.0; // Pitch of speech (0 to 2)
    utterance.volume = 1.0; // Volume (0 to 1)

    // Add event listeners
    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log("Started speaking");
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      console.log("Finished speaking");
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
    };

    // Speak the text
    speechSynthesisRef.current.speak(utterance);
  };

  // Function to stop the AI from speaking
  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
      console.log("Speech stopped by user");
    }
  };

  // Mode definitions for the UI
  const modes = [
    {
      id: "tutor",
      name: "Personal Tutor",
      icon: BookOpen,
      description: "One-on-one learning sessions",
    },
    {
      id: "conversation",
      name: "Conversation Practice",
      icon: MessageSquare,
      description: "Practice speaking and listening",
    },
    {
      id: "debate",
      name: "Debate Partner",
      icon: Users,
      description: "Structured argument practice",
    },
    {
      id: "interview",
      name: "Interview Prep",
      icon: Brain,
      description: "Job interview simulation",
    },
  ];

  // Send voice message to tutor
  const sendVoiceMessage = async (voiceText) => {
    if (!voiceText.trim() || !user?.email || !isSessionActive) return;

    // Stop any ongoing speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }

    // Add user message to chat
    const userMessage = {
      role: "user",
      content: voiceText,
      timestamp: new Date().toISOString(),
      isVoiceInput: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${backEndURL}/api/tutor/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: voiceText,
          mode: selectedMode,
          subject: selectedSubject,
          isVoiceInput: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const assistantMessage = {
            role: "assistant",
            content: data.response,
            timestamp: data.timestamp,
            isVoiceInput: false,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          // Text-to-speech is handled by the useEffect that watches for new messages
        }
      }
    } catch (error) {
      console.error("Failed to send voice message:", error);

      // Instead of hardcoded message, show a generic system message and let user retry
      setIsLoading(false);

      // Show toast or notification instead of hardcoded message in chat
      if (typeof window !== "undefined" && window.alert) {
        window.alert(UI_TEXT.connectionError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Start a new tutoring session
  const startSession = async () => {
    if (!user?.email || !selectedSubject.trim()) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${backEndURL}/api/tutor/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: selectedMode,
          subject: selectedSubject,
          userEmail: user.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSessionId(data.session_id);
          setIsSessionActive(true);
          setMessages([
            {
              role: "assistant",
              content: data.message,
              timestamp: data.timestamp,
              isSystemMessage: false, // Welcome message should be spoken
            },
          ]);
          // Text-to-speech is handled by the useEffect that watches for new messages
        }
      }
    } catch (error) {
      console.error("Failed to start session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // End the current session
  const endSession = async () => {
    if (!sessionId) return;

    // Stop any ongoing speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }

    try {
      const response = await fetch(`${backEndURL}/api/tutor/session/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (response.ok) {
        setSessionId(null);
        setIsSessionActive(false);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  };

  // Send message to tutor (for future text input if needed)
  const sendMessage = async (prompt = currentInput) => {
    if (!prompt.trim() || !user?.email || !isSessionActive) return;

    // Stop any ongoing speech
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }

    // Add user message to chat
    const userMessage = {
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${backEndURL}/api/tutor/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          mode: selectedMode,
          subject: selectedSubject,
          isVoiceInput: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const assistantMessage = {
            role: "assistant",
            content: data.response,
            timestamp: data.timestamp,
            isVoiceInput: false,
          };
          setMessages((prev) => [...prev, assistantMessage]);
          // Text-to-speech is handled by the useEffect that watches for new messages
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);

      // Instead of hardcoded message, show a generic system message and let user retry
      setIsLoading(false);

      // Show toast or notification instead of hardcoded message in chat
      if (typeof window !== "undefined" && window.alert) {
        window.alert(UI_TEXT.connectionError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press in input
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show login prompt if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-blue-600 mb-4 animate-pulse" />
          <p className="text-sm sm:text-base text-gray-600">
            {UI_TEXT.loading}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center p-6 sm:p-8 bg-white rounded-lg shadow-lg max-w-sm sm:max-w-md mx-auto w-full">
          <LogIn className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-blue-600 mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {UI_TEXT.loginRequired}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            {UI_TEXT.loginMessage}
          </p>
          <Button
            onClick={() => (window.location.href = "/auth/login")}
            className="w-full text-sm sm:text-base"
          >
            {UI_TEXT.loginButton}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-white p-2 sm:p-3 lg:p-4 flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 truncate">
                {UI_TEXT.voiceTutor}
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 truncate">
                {UI_TEXT.welcome}{" "}
                <span className="hidden sm:inline">{user.displayName || user.email?.split("@")[0]}!</span>
                <span className="inline sm:hidden">!</span>{" "}
                {UI_TEXT.interactiveVoice}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {!isSessionActive ? (
              <Button
                onClick={startSession}
                disabled={isLoading || !selectedSubject.trim()}
                className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 h-auto py-1.5"
              >
                <span className="text-xs sm:text-sm">{UI_TEXT.startButton}</span>
                <Play className="h-3 w-3 flex-shrink-0" />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={endSession}
                className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 h-auto py-1.5"
              >
                <span className="text-xs sm:text-sm">{UI_TEXT.stopButton}</span>
                <Pause className="h-3 w-3 flex-shrink-0" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {!isSessionActive ? (
        /* Setup Phase */
        <div className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6 overflow-auto">
          <div className="flex flex-col gap-4 sm:gap-6 flex-1">
            {/* Mode Selection */}
            <Card className="flex flex-col flex-shrink-0">
              <CardHeader className="flex flex-col space-y-1.5 pb-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="flex-1 truncate">{UI_TEXT.chooseLearningMode}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">{UI_TEXT.selectInteraction}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  {modes.map((mode) => (
                    <div
                      key={mode.id}
                      className={`flex flex-col p-2 sm:p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedMode === mode.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedMode(mode.id)}
                    >
                      <mode.icon
                        className={`h-5 w-5 sm:h-6 sm:w-6 mb-1.5 ${
                          selectedMode === mode.id
                            ? "text-blue-600"
                            : "text-gray-600"
                        }`}
                      />
                      <h3 className="font-medium text-xs sm:text-sm mb-0.5">
                        {mode.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 flex-1">
                        {mode.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Subject Selection */}
            <Card className="flex flex-col flex-shrink-0">
              <CardHeader className="flex flex-col space-y-1.5 pb-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-blue-600" />
                  <span className="flex-1 truncate">{UI_TEXT.subjectFocus}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">{UI_TEXT.enterTopic}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col gap-2">
                <Input
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  placeholder={UI_TEXT.subjectPlaceholder}
                  className="w-full text-xs sm:text-sm flex-1"
                />
                <p className="text-xs text-gray-500">
                  {UI_TEXT.subjectHint}
                </p>
              </CardContent>
            </Card>

            {/* Voice Instructions Card */}
            <Card className="flex flex-col mt-auto flex-shrink-0">
              <CardHeader className="flex flex-col space-y-1.5 pb-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-blue-600" />
                  <span className="flex-1 truncate">{UI_TEXT.voiceInteraction}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">{UI_TEXT.voiceDescription}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col items-center p-2 sm:p-3">
                  <div className="flex justify-center mb-2 sm:mb-3">
                    <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                  <p className="mb-2 font-medium text-xs sm:text-sm text-center">{UI_TEXT.howItWorks}</p>
                  <ul className="text-xs w-full text-left space-y-1.5 mb-3 flex flex-col">
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-medium flex-shrink-0">1.</span>
                      <span className="flex-1">{UI_TEXT.stepOne}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-medium flex-shrink-0">2.</span>
                      <span className="flex-1">{UI_TEXT.stepTwo}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-medium flex-shrink-0">3.</span>
                      <span className="flex-1">{UI_TEXT.stepThree}</span>
                    </li>
                  </ul>
                  <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 p-2 rounded-md w-full">
                    {UI_TEXT.deviceCheck}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Active Session */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Session Header */}
          <div className="bg-blue-50 border-b p-2 sm:p-3 flex-shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <Badge variant="default" className="text-xs flex items-center h-auto py-0.5">
                  {modes.find((m) => m.id === selectedMode)?.name}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs truncate max-w-[120px] sm:max-w-[160px] md:max-w-[240px] h-auto py-0.5"
                >
                  {selectedSubject || UI_TEXT.noSubject}
                </Badge>
              </div>
              {isSpeaking && (
                <Badge
                  variant="outline"
                  className="animate-pulse flex items-center gap-1 h-auto py-0.5"
                >
                  <Volume2 className="h-3 w-3 flex-shrink-0" />
                  <span className="text-xs">{UI_TEXT.speaking}</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col overflow-y-auto p-2 sm:p-3 lg:p-4 gap-2 sm:gap-3 lg:gap-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-1.5 sm:gap-2 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 border-2 border-gray-200 overflow-hidden">
                    <img
                      src="/edvanta-logo.png"
                      alt="Edvanta Tutor"
                      className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 object-contain"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[80%] sm:max-w-[85%] lg:max-w-[75%] p-3 sm:p-4 rounded-lg flex flex-col ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 shadow-sm"
                  }`}
                >
                  {message.role === "user" && message.isVoiceInput && (
                    <div className="mb-1.5 flex items-center">
                      <Mic className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span className="text-xs opacity-80 truncate">
                        {UI_TEXT.voiceMessage}
                      </span>
                    </div>
                  )}
                  
                  {message.role === "assistant" ? (
                    <div className="text-xs sm:text-sm lg:text-base leading-relaxed flex-1 break-words prose prose-sm max-w-none">
                      {message.content.split('\n').map((paragraph, i) => {
                        // Check if this is a list item
                        if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('* ')) {
                          return (
                            <div key={i} className="flex items-start gap-1.5 mb-1.5">
                              <span className="text-blue-600 mt-0.5">•</span>
                              <span>{paragraph.trim().substring(2)}</span>
                            </div>
                          );
                        }
                        
                        // Check if this might be a heading (shorter text ending with a colon)
                        else if (paragraph.trim().length < 50 && paragraph.trim().endsWith(':')) {
                          return <p key={i} className="font-medium text-gray-800 mb-1.5">{paragraph}</p>;
                        }
                        
                        // Regular paragraph with proper spacing
                        else if (paragraph.trim().length > 0) {
                          return <p key={i} className="mb-1.5">{paragraph}</p>;
                        }
                        
                        // Empty line creates spacing
                        return <div key={i} className="h-1"></div>;
                      })}
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm lg:text-base leading-relaxed flex-1 break-words">
                      {message.content}
                    </div>
                  )}

                  {message.role === "assistant" && !message.isSystemMessage && (
                    <div className="mt-3 pt-2 border-t border-gray-100 flex justify-start">
                      {isSpeaking &&
                      message === messages[messages.length - 1] ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs h-auto py-1 px-2 flex items-center"
                          onClick={stopSpeaking}
                        >
                          <VolumeX className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{UI_TEXT.stopSpeaking}</span>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-blue-600 h-auto py-1 px-2 flex items-center"
                          onClick={() => speakText(message.content)}
                          disabled={isSpeaking}
                        >
                          <Volume2 className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{UI_TEXT.speakAgain}</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-blue-200">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs sm:text-sm font-medium">
                          {(user?.displayName || user?.email)
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-1.5 sm:gap-2 items-start">
                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 border-2 border-gray-200 overflow-hidden">
                  <img
                    src="/edvanta-logo.png"
                    alt="Edvanta Tutor"
                    className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 object-contain"
                  />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm flex items-center">
                  <div className="flex items-center">
                    <div className="flex space-x-1.5 mr-2.5">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {UI_TEXT.tutorThinking}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-0 w-full" />
          </div>

          {/* Input Area */}
          <div className="border-t bg-white p-2 sm:p-3 lg:p-4 flex-shrink-0">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <div
                className={`relative flex items-center justify-center ${
                  isRecording
                    ? "before:absolute before:inset-0 before:rounded-full before:animate-ping before:bg-red-400 before:opacity-75"
                    : ""
                }`}
              >
                <Button
                  size="lg"
                  className={`min-w-[3.5rem] min-h-[3.5rem] w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-md ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-blue-600 hover:bg-blue-700"
                  } ${isSpeaking ? "opacity-70 cursor-not-allowed" : ""}`}
                  onClick={() => !isSpeaking && setIsRecording(!isRecording)}
                  disabled={isLoading || isSpeaking}
                >
                  {isRecording ? (
                    <MicOff className="min-w-[1.5rem] min-h-[1.5rem] h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10" />
                  ) : (
                    <Mic className="min-w-[1.5rem] min-h-[1.5rem] h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10" />
                  )}
                </Button>
              </div>

              <div className="mt-1 sm:mt-2 text-center w-full flex flex-col items-center">
                {isRecording ? (
                  <div className="flex flex-col items-center w-full">
                    <p className="text-xs sm:text-sm font-semibold text-red-600 mb-1 min-w-max">
                      {UI_TEXT.recording}
                    </p>
                    <p className="text-[10px] xs:text-xs text-gray-500 max-w-[200px] sm:max-w-[300px] mx-auto line-clamp-2">
                      {transcript ? transcript : UI_TEXT.speakClearly}
                    </p>
                  </div>
                ) : isSpeaking ? (
                  <div className="flex flex-col items-center w-full">
                    <p className="text-xs sm:text-sm font-semibold text-blue-600 animate-pulse mb-1 sm:mb-2 min-w-max">
                      {UI_TEXT.aiSpeaking}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={stopSpeaking}
                      className="flex items-center gap-1 h-auto py-1 px-2 text-[10px] xs:text-xs min-w-max"
                    >
                      <VolumeX className="h-3 w-3 mr-1 flex-shrink-0 min-w-[0.75rem]" />
                      <span>{UI_TEXT.stopSpeaking}</span>
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-700 max-w-[300px] truncate min-w-max">
                    {messages.length === 0
                      ? UI_TEXT.pressToStart
                      : UI_TEXT.pressToAsk}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
