import React, { useState, useEffect } from "react";
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
import { useAuth } from "../../hooks/useAuth";
import {
  Brain,
  CheckCircle,
  X,
  Trophy,
  Target,
  BarChart,
  PlayCircle,
  Plus,
  FileText,
  Loader2,
  XCircle,
  Trash2,
} from "lucide-react";
import backEndURL from "../../hooks/helper";

export function Quizzes() {
  const [activeTab, setActiveTab] = useState("browse");
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Create quiz form state
  const [newQuizTopic, setNewQuizTopic] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);

  // Quiz history state
  const [quizHistory, setQuizHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Get user data from Firebase authentication
  const { user, userProfile, loading: authLoading } = useAuth();

  // Create current user object from Firebase auth data
  const currentUser = {
    email: user?.email || "anonymous@example.com",
    name:
      userProfile?.displayName ||
      user?.displayName ||
      userProfile?.name ||
      "Anonymous User",
    uid: user?.uid,
    photoURL: userProfile?.photoURL || user?.photoURL,
  };

  // Load quizzes when component mounts or user changes
  useEffect(() => {
    if (!authLoading) {
      loadQuizzes();
    }
  }, [user?.email, authLoading]);

  // Load history when history tab is active or user changes
  useEffect(() => {
    if (activeTab === "history" && !authLoading) {
      loadQuizHistory();
    }
  }, [activeTab, user?.email, authLoading]);

  const loadQuizzes = async () => {
    try {
      setIsLoading(true);
      // Only fetch quizzes if user is authenticated
      if (!user?.email) {
        setQuizzes([]);
        return;
      }

      const response = await fetch(
        `${backEndURL}/api/tools/quizzes?user_email=${encodeURIComponent(
          user.email
        )}`
      );
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error("Failed to load quizzes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuizHistory = async () => {
    try {
      setIsLoadingHistory(true);
      // Only fetch quiz history if user is authenticated
      if (!user?.email) {
        setQuizHistory([]);
        return;
      }

      const response = await fetch(
        `${backEndURL}/api/quiz-history?user_email=${encodeURIComponent(
          user.email
        )}`
      );
      if (response.ok) {
        const data = await response.json();
        setQuizHistory(data);
      }
    } catch (error) {
      console.error("Failed to load quiz history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const clearQuizHistory = async () => {
    try {
      // Show confirmation dialog
      if (
        !window.confirm(
          "Are you sure you want to clear all quiz history? This action cannot be undone."
        )
      ) {
        return;
      }

      // Only allow clearing if user is authenticated
      if (!user?.email) {
        alert("Please login to manage quiz history.");
        return;
      }

      const response = await fetch(
        `${backEndURL}/api/quiz-history?user_email=${encodeURIComponent(
          user.email
        )}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Clear local state
        setQuizHistory([]);
        console.log("✅ Quiz history cleared successfully");
      } else {
        throw new Error("Failed to clear quiz history");
      }
    } catch (error) {
      console.error("Failed to clear quiz history:", error);
      alert("Failed to clear quiz history. Please try again.");
    }
  };

  const generateQuiz = async () => {
    if (!newQuizTopic.trim()) return;

    // Check if user is authenticated before generating quiz
    if (!user) {
      alert("Please login to generate and save quizzes.");
      return;
    }

    try {
      setIsGenerating(true);

      // Generate quiz
      const generateResponse = await fetch(
        `${backEndURL}/api/quizzes/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: newQuizTopic,
            difficulty: difficulty,
            numberOfQuestions: numberOfQuestions,
          }),
        }
      );

      if (!generateResponse.ok) {
        throw new Error("Failed to generate quiz");
      }

      const quizData = await generateResponse.json();

      // Add user email to quiz data
      quizData.user_email = currentUser.email;

      // Save quiz to browsing list
      const saveResponse = await fetch(`${backEndURL}/api/tools/quizzes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quizData),
      });

      if (saveResponse.ok) {
        // Reload quizzes
        await loadQuizzes();
        // Reset form
        setNewQuizTopic("");
        setDifficulty("easy");
        setNumberOfQuestions(10);
        // Switch to browse tab
        setActiveTab("browse");
      }
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startQuiz = (quiz) => {
    if (!quiz.quiz_data) return;

    setCurrentQuiz(quiz);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setResults(null);
    setShowQuizModal(true);
  };

  const closeQuizModal = () => {
    setShowQuizModal(false);
    setCurrentQuiz(null);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setResults(null);
  };

  const deleteQuiz = async (quizId) => {
    try {
      // Show confirmation dialog
      if (
        !window.confirm(
          "Are you sure you want to delete this quiz? This action cannot be undone."
        )
      ) {
        return;
      }

      const response = await fetch(
        `${backEndURL}/api/tools/quizzes/${quizId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Reload quizzes to update the list
        await loadQuizzes();
      } else {
        throw new Error("Failed to delete quiz");
      }
    } catch (error) {
      console.error("Failed to delete quiz:", error);
      alert("Failed to delete quiz. Please try again.");
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (currentQuestion < currentQuiz.quiz_data.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      submitQuiz();
    }
  };

  const prevQuestion = () => {
    setCurrentQuestion((prev) => Math.max(0, prev - 1));
  };

  const logQuizCompletion = async (quizData, results) => {
    const completionData = {
      quizId: quizData.id,
      quizTitle: quizData.title,
      topic: quizData.quiz_data.topic,
      difficulty: quizData.quiz_data.difficulty,
      totalQuestions: results.total,
      correctAnswers: results.score,
      percentage: results.percentage,
      completedAt: new Date().toISOString(),
      timeTaken: "Not tracked", // Could be enhanced to track actual time
      userId: currentUser.email, // Use actual user email from Firebase
      userUid: currentUser.uid, // Also store Firebase UID for better user identification
    };

    try {
      console.log("🎉 Quiz Completed!", completionData);

      // Post to quiz-history endpoint
      const response = await fetch(`${backEndURL}/api/quiz-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completionData),
      });

      if (response.ok) {
        console.log("✅ Quiz completion logged to history successfully");
        // Reload history if on history tab
        if (activeTab === "history") {
          await loadQuizHistory();
        }
      } else {
        console.warn(
          "⚠️ Failed to log quiz completion to history:",
          response.statusText
        );
      }
    } catch (error) {
      console.error("❌ Error logging quiz completion to history:", error);
    }
  };

  const submitQuiz = async () => {
    try {
      const answersArray = Object.entries(answers).map(([id, answer]) => ({
        id: parseInt(id),
        answer: answer,
      }));

      const response = await fetch(`${backEndURL}/api/quizzes/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quiz_id: currentQuiz.id,
          answers: answersArray,
        }),
      });

      if (response.ok) {
        const resultData = await response.json();

        // Log quiz completion to history endpoint
        await logQuizCompletion(currentQuiz, resultData);

        setResults(resultData);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    }
  };

  // Glassmorphic Quiz Modal
  const QuizModal = () => {
    if (!showQuizModal || !currentQuiz) return null;

    if (showResults && results) {
      return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white/90 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl max-w-xs sm:max-w-2xl lg:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Results Header */}
            <div className="p-4 sm:p-6 text-center border-b border-white/20">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                Quiz Complete!
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-2">
                You scored {results.percentage}% on {currentQuiz.title}
              </p>
              <div
                className={`text-3xl sm:text-4xl font-bold ${
                  results.percentage >= 80
                    ? "text-green-600"
                    : results.percentage >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {results.score}/{results.total}
              </div>
            </div>

            {/* Results Content */}
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-h-60 sm:max-h-96 overflow-y-auto">
              {results.feedback.map((item, index) => (
                <div
                  key={item.question_id}
                  className="p-3 sm:p-4 border border-white/20 rounded-lg bg-white/50"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    {item.is_correct ? (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium mb-2 break-words">
                        {item.question}
                      </p>
                      <div className="text-xs sm:text-sm space-y-1">
                        <p className="break-words">
                          <span className="font-medium">Your answer:</span>{" "}
                          {item.user_answer || "Not answered"}
                        </p>
                        <p className="break-words">
                          <span className="font-medium">Correct answer:</span>{" "}
                          {item.correct_answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Results Footer */}
            <div className="p-4 sm:p-6 border-t border-white/20 flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
              <Button onClick={closeQuizModal} className="text-md">
                Back to Quizzes
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const question = currentQuiz.quiz_data.questions[currentQuestion];
    const progress =
      ((currentQuestion + 1) / currentQuiz.quiz_data.questions.length) * 100;

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white/90 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl max-w-xs sm:max-w-2xl lg:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          {/* Quiz Header */}
          <div className="p-4 sm:p-6 border-b border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 truncate">
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">{currentQuiz.title}</span>
                </h2>
                <p className="text-sm text-gray-600">
                  Question {currentQuestion + 1} of{" "}
                  {currentQuiz.quiz_data.questions.length}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeQuizModal}
                  className="text-xs"
                >
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Exit Quiz</span>
                  <span className="sm:hidden">Exit</span>
                </Button>
              </div>
            </div>
            <Progress value={progress} className="bg-white/30" />
          </div>

          {/* Question Content */}
          <div className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium mb-4 sm:mb-6 break-words">
              {question.question}
            </h3>

            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              {question.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-start p-3 sm:p-4 border border-white/20 rounded-lg cursor-pointer transition-all ${
                    answers[question.id] === option
                      ? "border-blue-500 bg-blue-50/50 backdrop-blur-sm"
                      : "hover:bg-white/30 backdrop-blur-sm"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={() => handleAnswer(question.id, option)}
                    className="mr-2 sm:mr-3 mt-0.5 flex-shrink-0"
                  />
                  <span className="text-sm sm:text-base break-words">
                    {option}
                  </span>
                </label>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                className="text-sm order-2 sm:order-1"
              >
                Previous
              </Button>
              <Button
                onClick={nextQuestion}
                disabled={answers[question.id] === undefined}
                className="bg-blue-600 hover:bg-blue-700 text-sm order-1 sm:order-2"
              >
                {currentQuestion ===
                currentQuiz.quiz_data.questions.length - 1 ? (
                  <>
                    <span className="hidden sm:inline">Submit Quiz</span>
                    <span className="sm:hidden">Submit</span>
                  </>
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Don't render until auth state is determined
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Interactive Quizzes
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          Test your knowledge with AI-generated quizzes and track your progress.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex gap-1">
          <TabsTrigger value="browse" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">Browse Quizzes</span>
            <span className="sm:hidden">Browse</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">Create Quiz</span>
            <span className="sm:hidden">Create</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm py-2">
            <span className="hidden sm:inline">Quiz History</span>
            <span className="sm:hidden">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4 sm:space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
              <span className="ml-2 text-sm sm:text-base">
                Loading quizzes...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {quizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/60 hover:border-primary/20"
                >
                  {/* Card Header - Redesigned */}
                  <CardHeader className="pb-3 sm:pb-4">
                    {/* Top Row - Category & Status */}
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <Badge
                        variant="secondary"
                        className="text-[10px] sm:text-xs px-2 py-1 bg-primary/10 text-primary border-primary/20 font-medium"
                      >
                        {quiz.category}
                      </Badge>
                      {quiz.completed && (
                        <Badge
                          variant="success"
                          className="text-[10px] sm:text-xs px-2 py-1 bg-green-100 text-green-700 border-green-200"
                        >
                          <Trophy className="h-3 w-3 mr-1" />
                          <span className="hidden xs:inline">
                            {quiz.score}%
                          </span>
                          <span className="xs:hidden">{quiz.score}</span>
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 line-clamp-2 leading-tight mb-1 sm:mb-2 group-hover:text-primary transition-colors">
                      {quiz.title}
                    </CardTitle>

                    {/* Description */}
                    <CardDescription className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                      {quiz.description}
                    </CardDescription>
                  </CardHeader>

                  {/* Card Content - Redesigned */}
                  <CardContent className="flex-1 flex flex-col justify-between pt-0">
                    {/* Quiz Stats */}
                    <div className="space-y-2 sm:space-y-3 mb-4">
                      {/* Stats Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Questions Count */}
                          <div className="flex items-center gap-1 text-gray-600">
                            <div className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-blue-50 rounded-full">
                              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                            </div>
                            <span className="text-xs sm:text-sm font-medium">
                              <span className="hidden xs:inline">
                                {quiz.questions} questions
                              </span>
                              <span className="xs:hidden">
                                {quiz.questions}q
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Difficulty Badge */}
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            quiz.difficulty === "Easy"
                              ? "secondary"
                              : quiz.difficulty === "Medium"
                              ? "warning"
                              : "destructive"
                          }
                          className={`text-xs px-2 py-1 font-medium ${
                            quiz.difficulty === "Easy"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : quiz.difficulty === "Medium"
                              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                              : "bg-red-100 text-red-700 border-red-200"
                          }`}
                        >
                          {quiz.difficulty}
                        </Badge>

                        {/* Progress indicator for completed quizzes */}
                        {quiz.completed && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium hidden sm:inline">
                              Completed
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - Redesigned */}
                    <div className="flex flex-col xs:flex-row gap-2">
                      <Button
                        className="flex-1 h-9 sm:h-10 text-xs sm:text-sm font-medium bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md transition-all duration-200"
                        onClick={() => startQuiz(quiz)}
                      >
                        <span>Start</span>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuiz(quiz.id);
                        }}
                        className="xs:w-auto w-full h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 border-gray-300 transition-all duration-200"
                        title="Delete quiz"
                      >
                        <span>Delete</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && quizzes.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <Brain className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              {user ? (
                <>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    No quizzes available yet.
                  </p>
                  <Button
                    onClick={() => setActiveTab("create")}
                    className="text-sm"
                  >
                    Create Your First Quiz
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    Please login to view and create quizzes.
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Your quizzes will be saved to your account.
                  </p>
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                Generate New Quiz
              </CardTitle>
              <CardDescription className="text-sm">
                Create a custom quiz from any topic using AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quiz Topic</label>
                <Input
                  placeholder="Enter a topic (e.g., Python loops, React hooks, etc.)"
                  value={newQuizTopic}
                  onChange={(e) => setNewQuizTopic(e.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <select
                    className="w-full p-2 text-sm sm:text-base border rounded-md"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Number of Questions
                  </label>
                  <select
                    className="w-full p-2 text-sm sm:text-base border rounded-md"
                    value={numberOfQuestions}
                    onChange={(e) =>
                      setNumberOfQuestions(parseInt(e.target.value))
                    }
                  >
                    <option value={5}>5 questions</option>
                    <option value={10}>10 questions</option>
                    <option value={15}>15 questions</option>
                    <option value={20}>20 questions</option>
                  </select>
                </div>
              </div>

              <Button
                className="w-full text-sm sm:text-base"
                disabled={!newQuizTopic.trim() || isGenerating || !user}
                onClick={generateQuiz}
                title={!user ? "Please login to generate quizzes" : ""}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Generating Quiz...</span>
                    <span className="sm:hidden">Generating...</span>
                  </>
                ) : !user ? (
                  <>
                    <span className="hidden sm:inline">
                      Login to Generate Quiz
                    </span>
                    <span className="sm:hidden">Login Required</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Generate Quiz</span>
                    <span className="sm:hidden">Generate</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <BarChart className="h-4 w-4 sm:h-5 sm:w-5" />
                    Quiz History
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Track your quiz performance over time and review your
                    progress.
                  </CardDescription>
                </div>
                {quizHistory.length > 0 && user && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearQuizHistory}
                    className="text-xs sm:text-sm text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 border-red-200 self-start sm:self-center"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Clear History</span>
                    <span className="sm:hidden">Clear</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
                  <span className="ml-2 text-sm sm:text-base">
                    Loading history...
                  </span>
                </div>
              ) : quizHistory.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg border border-blue-200">
                      <div className="text-xl sm:text-2xl font-bold text-blue-700">
                        {quizHistory.length}
                      </div>
                      <div className="text-xs sm:text-sm text-blue-600">
                        Total Quizzes
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 sm:p-4 rounded-lg border border-green-200">
                      <div className="text-xl sm:text-2xl font-bold text-green-700">
                        {quizHistory.length > 0
                          ? Math.round(
                              quizHistory.reduce(
                                (acc, quiz) => acc + quiz.percentage,
                                0
                              ) / quizHistory.length
                            )
                          : 0}
                        %
                      </div>
                      <div className="text-xs sm:text-sm text-green-600">
                        Average Score
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 sm:p-4 rounded-lg border border-purple-200">
                      <div className="text-xl sm:text-2xl font-bold text-purple-700">
                        {
                          quizHistory.filter((quiz) => quiz.percentage >= 80)
                            .length
                        }
                      </div>
                      <div className="text-xs sm:text-sm text-purple-600">
                        Excellent (80%+)
                      </div>
                    </div>
                  </div>

                  {/* History List */}
                  <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                    {quizHistory.map((historyItem) => (
                      <div
                        key={historyItem.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 sm:mb-2">
                              <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                                {historyItem.quizTitle}
                              </h3>
                              <Badge
                                variant={
                                  historyItem.difficulty === "easy"
                                    ? "secondary"
                                    : historyItem.difficulty === "medium"
                                    ? "warning"
                                    : "destructive"
                                }
                                className={`text-xs px-2 py-1 font-medium ${
                                  historyItem.difficulty === "easy"
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : historyItem.difficulty === "medium"
                                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                    : "bg-red-100 text-red-700 border-red-200"
                                }`}
                              >
                                {historyItem.difficulty
                                  .charAt(0)
                                  .toUpperCase() +
                                  historyItem.difficulty.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-1">
                              Topic: {historyItem.topic}
                            </p>
                            <p className="text-xs text-gray-500">
                              Completed:{" "}
                              {new Date(
                                historyItem.completedAt
                              ).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(
                                historyItem.completedAt
                              ).toLocaleTimeString()}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                            <div className="text-center">
                              <div className="text-xs text-gray-500">Score</div>
                              <div className="text-sm sm:text-base font-medium">
                                {historyItem.correctAnswers}/
                                {historyItem.totalQuestions}
                              </div>
                            </div>

                            <div className="text-center">
                              <div className="text-xs text-gray-500">
                                Percentage
                              </div>
                              <div
                                className={`text-sm sm:text-base font-bold ${
                                  historyItem.percentage >= 80
                                    ? "text-green-600"
                                    : historyItem.percentage >= 60
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                              >
                                {historyItem.percentage}%
                              </div>
                            </div>

                            <div className="flex items-center">
                              {historyItem.percentage >= 80 ? (
                                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                              ) : historyItem.percentage >= 60 ? (
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                              ) : (
                                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <BarChart className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  {user ? (
                    <>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">
                        No quiz history yet.
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mb-4">
                        Complete some quizzes to see your performance history
                        here.
                      </p>
                      <Button
                        onClick={() => setActiveTab("browse")}
                        className="text-sm"
                      >
                        Browse Quizzes
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">
                        Please login to view your quiz history.
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Your quiz progress will be tracked when you're logged
                        in.
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <QuizModal />
    </div>
  );
}
