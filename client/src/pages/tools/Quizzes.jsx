import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Brain,
  Clock,
  CheckCircle,
  X,
  Trophy,
  Target,
  BarChart,
  PlayCircle,
  Plus,
  FileText
} from 'lucide-react'

const sampleQuizzes = [
  {
    id: 1,
    title: 'JavaScript Fundamentals',
    category: 'Programming',
    questions: 15,
    difficulty: 'Beginner',
    duration: '20 min',
    score: 85,
    completed: true,
    description: 'Test your knowledge of JavaScript basics including variables, functions, and control flow.'
  },
  {
    id: 2,
    title: 'React Component Patterns',
    category: 'Frontend',
    questions: 12,
    difficulty: 'Intermediate',
    duration: '15 min',
    score: null,
    completed: false,
    description: 'Advanced React concepts including hooks, context, and component composition.'
  },
  {
    id: 3,
    title: 'Machine Learning Basics',
    category: 'AI/ML',
    questions: 20,
    difficulty: 'Advanced',
    duration: '30 min',
    score: 92,
    completed: true,
    description: 'Fundamental concepts of machine learning algorithms and applications.'
  }
]

const sampleQuestions = [
  {
    id: 1,
    question: "What is the correct way to declare a variable in JavaScript?",
    type: "mcq",
    options: [
      "var myVar = 'hello';",
      "variable myVar = 'hello';", 
      "v myVar = 'hello';",
      "declare myVar = 'hello';"
    ],
    correct: 0,
    explanation: "The 'var' keyword is used to declare variables in JavaScript, though 'let' and 'const' are preferred in modern JavaScript."
  },
  {
    id: 2,
    question: "JavaScript is a statically typed language.",
    type: "boolean",
    correct: false,
    explanation: "JavaScript is a dynamically typed language, meaning variable types are determined at runtime."
  },
  {
    id: 3,
    question: "What does DOM stand for?",
    type: "short",
    answer: "Document Object Model",
    explanation: "DOM stands for Document Object Model, which represents the structure of HTML documents."
  }
]

export function Quizzes() {
  const [activeTab, setActiveTab] = useState('browse')
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState(1200) // 20 minutes
  const [newQuizTopic, setNewQuizTopic] = useState('')

  const startQuiz = (quiz) => {
    setCurrentQuiz(quiz)
    setCurrentQuestion(0)
    setAnswers({})
    setShowResults(false)
    setActiveTab('take')
  }

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const nextQuestion = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      setShowResults(true)
    }
  }

  const calculateScore = () => {
    let correct = 0
    sampleQuestions.forEach(q => {
      if (q.type === 'mcq' && answers[q.id] === q.correct) correct++
      if (q.type === 'boolean' && answers[q.id] === q.correct) correct++
      if (q.type === 'short' && answers[q.id]?.toLowerCase().includes(q.answer.toLowerCase())) correct++
    })
    return Math.round((correct / sampleQuestions.length) * 100)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (activeTab === 'take' && currentQuiz && !showResults) {
    const question = sampleQuestions[currentQuestion]
    const progress = ((currentQuestion + 1) / sampleQuestions.length) * 100

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Quiz Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {currentQuiz.title}
                </CardTitle>
                <CardDescription>
                  Question {currentQuestion + 1} of {sampleQuestions.length}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(timeLeft)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('browse')}
                >
                  Exit Quiz
                </Button>
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.type === 'mcq' && (
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      answers[question.id] === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={index}
                      checked={answers[question.id] === index}
                      onChange={() => handleAnswer(question.id, index)}
                      className="mr-3"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'boolean' && (
              <div className="flex gap-4">
                <Button
                  variant={answers[question.id] === true ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleAnswer(question.id, true)}
                >
                  True
                </Button>
                <Button
                  variant={answers[question.id] === false ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleAnswer(question.id, false)}
                >
                  False
                </Button>
              </div>
            )}

            {question.type === 'short' && (
              <Input
                placeholder="Type your answer here..."
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
              />
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              <Button
                onClick={nextQuestion}
                disabled={answers[question.id] === undefined}
              >
                {currentQuestion === sampleQuestions.length - 1 ? 'Finish Quiz' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showResults) {
    const score = calculateScore()
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Results Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
            <CardDescription>
              You scored {score}% on {currentQuiz?.title}
            </CardDescription>
            <div className="mt-4">
              <div className={`text-4xl font-bold ${
                score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {score}%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-4">
              <Button onClick={() => setActiveTab('browse')}>
                Back to Quizzes
              </Button>
              <Button variant="outline" onClick={() => startQuiz(currentQuiz)}>
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle>Review Answers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sampleQuestions.map((question, index) => {
              const userAnswer = answers[question.id]
              const isCorrect = question.type === 'mcq' 
                ? userAnswer === question.correct
                : question.type === 'boolean'
                ? userAnswer === question.correct
                : userAnswer?.toLowerCase().includes(question.answer.toLowerCase())

              return (
                <div key={question.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">{question.question}</p>
                      <p className="text-sm text-gray-600 mb-2">{question.explanation}</p>
                      {question.type === 'mcq' && (
                        <div className="text-sm">
                          <span className="text-gray-500">Correct answer: </span>
                          <span className="font-medium">{question.options[question.correct]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interactive Quizzes</h1>
        <p className="text-gray-600">
          Test your knowledge with AI-generated quizzes and track your progress.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">Browse Quizzes</TabsTrigger>
          <TabsTrigger value="create">Create Quiz</TabsTrigger>
          <TabsTrigger value="history">Quiz History</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary">{quiz.category}</Badge>
                    {quiz.completed && (
                      <Badge variant="success" className="text-xs">
                        <Trophy className="h-3 w-3 mr-1" />
                        {quiz.score}%
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  <CardDescription>{quiz.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        {quiz.questions} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {quiz.duration}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={
                        quiz.difficulty === 'Beginner' ? 'secondary' :
                        quiz.difficulty === 'Intermediate' ? 'warning' : 'destructive'
                      }>
                        {quiz.difficulty}
                      </Badge>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => startQuiz(quiz)}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      {quiz.completed ? 'Retake Quiz' : 'Start Quiz'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Generate New Quiz
              </CardTitle>
              <CardDescription>
                Create a custom quiz from any topic or upload your notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quiz Topic</label>
                <Input
                  placeholder="Enter a topic (e.g., Python loops, React hooks, etc.)"
                  value={newQuizTopic}
                  onChange={(e) => setNewQuizTopic(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Questions</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>5 questions</option>
                    <option>10 questions</option>
                    <option>15 questions</option>
                    <option>20 questions</option>
                  </select>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Or upload your study materials</p>
                <Button variant="outline" size="sm">
                  Upload Files (PDF, TXT)
                </Button>
              </div>

              <Button className="w-full" disabled={!newQuizTopic.trim()}>
                Generate Quiz
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Quiz Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">15</div>
                  <div className="text-sm text-gray-600">Total Quizzes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">78%</div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">5h 30m</div>
                  <div className="text-sm text-gray-600">Total Time</div>
                </div>
              </div>

              <div className="space-y-3">
                {sampleQuizzes.filter(quiz => quiz.completed).map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{quiz.title}</h4>
                      <p className="text-sm text-gray-600">{quiz.category}</p>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        quiz.score >= 80 ? 'text-green-600' : 
                        quiz.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {quiz.score}%
                      </div>
                      <div className="text-sm text-gray-500">{quiz.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}