import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  Sparkles,
  BookOpen,
  Users,
  Brain
} from 'lucide-react'

export function ConversationalTutor() {
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedMode, setSelectedMode] = useState('tutor')
  const [selectedSubject, setSelectedSubject] = useState('general')

  const modes = [
    { id: 'tutor', name: 'Personal Tutor', icon: BookOpen, description: 'One-on-one learning sessions' },
    { id: 'conversation', name: 'Conversation Practice', icon: MessageSquare, description: 'Practice speaking and listening' },
    { id: 'debate', name: 'Debate Partner', icon: Users, description: 'Structured argument practice' },
    { id: 'interview', name: 'Interview Prep', icon: Brain, description: 'Job interview simulation' }
  ]

  const subjects = [
    { id: 'general', name: 'General Knowledge' },
    { id: 'programming', name: 'Programming' },
    { id: 'science', name: 'Science' },
    { id: 'history', name: 'History' },
    { id: 'language', name: 'Language Learning' },
    { id: 'business', name: 'Business' }
  ]

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Voice Tutor</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Interactive voice-based learning with AI-powered conversation
        </p>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            Choose Learning Mode
          </CardTitle>
          <CardDescription>
            Select how you'd like to interact with your AI tutor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {modes.map((mode) => (
              <div
                key={mode.id}
                className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedMode === mode.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedMode(mode.id)}
              >
                <mode.icon className={`h-6 w-6 mb-2 ${
                  selectedMode === mode.id ? 'text-blue-600' : 'text-gray-600'
                }`} />
                <h3 className="font-medium text-sm sm:text-base mb-1">{mode.name}</h3>
                <p className="text-xs sm:text-sm text-gray-500">{mode.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subject Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Subject Focus</CardTitle>
          <CardDescription>
            Choose the topic you'd like to practice or learn about
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <Badge
                key={subject.id}
                variant={selectedSubject === subject.id ? "default" : "secondary"}
                className={`cursor-pointer px-3 py-1 text-xs sm:text-sm ${
                  selectedSubject === subject.id
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'hover:bg-gray-200'
                }`}
                onClick={() => setSelectedSubject(subject.id)}
              >
                {subject.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Voice Interface</CardTitle>
          <CardDescription>
            Start speaking with your AI tutor using voice commands
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Voice Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Button
              size="lg"
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              onClick={() => setIsRecording(!isRecording)}
            >
              {isRecording ? (
                <MicOff className="h-8 w-8 sm:h-10 sm:w-10" />
              ) : (
                <Mic className="h-8 w-8 sm:h-10 sm:w-10" />
              )}
            </Button>
            
            <div className="text-center">
              <p className="text-sm sm:text-base font-medium">
                {isRecording ? 'Listening...' : 'Click to start speaking'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {selectedMode === 'tutor' && 'Ask questions or request explanations'}
                {selectedMode === 'conversation' && 'Start a conversation about ' + subjects.find(s => s.id === selectedSubject)?.name}
                {selectedMode === 'debate' && 'Present your argument'}
                {selectedMode === 'interview' && 'Answer interview questions'}
              </p>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex justify-center items-center gap-3 sm:gap-4">
            <Button variant="outline" size="sm">
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">
                {isSpeaking ? 'Mute' : 'Unmute'}
              </span>
            </Button>
            
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Reset</span>
            </Button>
          </div>

          {/* Current Session Status */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Session</span>
              <Badge variant="secondary" className="text-xs">
                {modes.find(m => m.id === selectedMode)?.name}
              </Badge>
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              <p>Subject: {subjects.find(s => s.id === selectedSubject)?.name}</p>
              <p>Status: {isRecording ? 'Active - Listening' : 'Ready to start'}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              Ask Question
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              Get Hint
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              Explain More
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              Change Topic
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Voice Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Speaking Tips:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Speak clearly and at normal pace</li>
                <li>• Use specific questions</li>
                <li>• Ask for clarification if needed</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Commands:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• "Explain [topic]"</li>
                <li>• "Give me an example"</li>
                <li>• "Test my knowledge"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
