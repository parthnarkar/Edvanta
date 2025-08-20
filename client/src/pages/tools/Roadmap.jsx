import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import {
  MapPin,
  Target,
  CheckCircle,
  Clock,
  Star,
  BookOpen,
  Code,
  Palette,
  TrendingUp,
  Users,
  Award,
  ArrowRight,
  Plus,
  Filter
} from 'lucide-react'

export function Roadmap() {
  const [selectedCareer, setSelectedCareer] = useState('frontend')
  const [selectedLevel, setSelectedLevel] = useState('beginner')
  const [searchTerm, setSearchTerm] = useState('')

  const careerPaths = [
    {
      id: 'frontend',
      name: 'Frontend Developer',
      icon: Code,
      color: 'blue',
      description: 'Build user interfaces and web experiences',
      duration: '6-12 months',
      difficulty: 'Beginner Friendly'
    },
    {
      id: 'backend',
      name: 'Backend Developer',
      icon: BookOpen,
      color: 'green',
      description: 'Create server-side logic and databases',
      duration: '8-14 months',
      difficulty: 'Intermediate'
    },
    {
      id: 'fullstack',
      name: 'Full Stack Developer',
      icon: TrendingUp,
      color: 'purple',
      description: 'Master both frontend and backend development',
      duration: '12-18 months',
      difficulty: 'Advanced'
    },
    {
      id: 'designer',
      name: 'UI/UX Designer',
      icon: Palette,
      color: 'pink',
      description: 'Design beautiful and functional user experiences',
      duration: '4-8 months',
      difficulty: 'Beginner Friendly'
    },
    {
      id: 'data',
      name: 'Data Scientist',
      icon: TrendingUp,
      color: 'indigo',
      description: 'Analyze data and build machine learning models',
      duration: '10-16 months',
      difficulty: 'Advanced'
    },
    {
      id: 'devops',
      name: 'DevOps Engineer',
      icon: Users,
      color: 'orange',
      description: 'Manage infrastructure and deployment pipelines',
      duration: '8-12 months',
      difficulty: 'Intermediate'
    }
  ]

  const roadmapSteps = {
    frontend: [
      {
        phase: 'Foundation',
        duration: '2-3 months',
        progress: 100,
        skills: ['HTML', 'CSS', 'JavaScript Basics', 'Git/GitHub'],
        status: 'completed'
      },
      {
        phase: 'Core Development',
        duration: '3-4 months',
        progress: 60,
        skills: ['React/Vue', 'Responsive Design', 'CSS Frameworks', 'API Integration'],
        status: 'in-progress'
      },
      {
        phase: 'Advanced Skills',
        duration: '2-3 months',
        progress: 0,
        skills: ['State Management', 'Testing', 'Performance Optimization', 'Build Tools'],
        status: 'upcoming'
      },
      {
        phase: 'Professional',
        duration: '2-3 months',
        progress: 0,
        skills: ['Portfolio Projects', 'Interview Prep', 'Industry Best Practices'],
        status: 'upcoming'
      }
    ]
  }

  const currentRoadmap = roadmapSteps[selectedCareer] || roadmapSteps.frontend

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Career Roadmap</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Personalized learning paths and career guidance to achieve your goals
        </p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search career paths..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>
            <Button variant="outline" className="text-sm sm:text-base">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Career Paths Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {careerPaths
          .filter(path => 
            path.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            path.description.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((path) => (
          <Card 
            key={path.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedCareer === path.id 
                ? 'ring-2 ring-blue-500 shadow-md' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedCareer(path.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${path.color}-100`}>
                  <path.icon className={`h-5 w-5 text-${path.color}-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg truncate">{path.name}</CardTitle>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {path.duration}
                    </Badge>
                    <Badge 
                      variant={path.difficulty === 'Beginner Friendly' ? 'default' : 
                               path.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {path.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs sm:text-sm text-gray-600 mb-3">{path.description}</p>
              <Button 
                size="sm" 
                className={`w-full text-xs sm:text-sm ${
                  selectedCareer === path.id ? 'bg-blue-600' : ''
                }`}
              >
                {selectedCareer === path.id ? 'Selected' : 'View Roadmap'}
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Roadmap Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MapPin className="h-5 w-5" />
            {careerPaths.find(p => p.id === selectedCareer)?.name} Roadmap
          </CardTitle>
          <CardDescription>
            Follow this structured path to become a professional {careerPaths.find(p => p.id === selectedCareer)?.name.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Overall Progress */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">40% Complete</span>
            </div>
            <Progress value={40} className="mb-2" />
            <p className="text-xs sm:text-sm text-gray-600">
              Keep going! You're making great progress on your journey.
            </p>
          </div>

          {/* Roadmap Steps */}
          <div className="space-y-4 sm:space-y-6">
            {currentRoadmap.map((step, index) => (
              <div key={index} className="relative">
                {/* Connection Line */}
                {index < currentRoadmap.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200 z-0"></div>
                )}
                
                <div className="flex gap-4">
                  {/* Step Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-4 z-10 ${
                    step.status === 'completed' 
                      ? 'bg-green-500 border-green-500' 
                      : step.status === 'in-progress'
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-gray-200 border-gray-200'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : step.status === 'in-progress' ? (
                      <Clock className="h-5 w-5 text-white" />
                    ) : (
                      <Target className="h-5 w-5 text-gray-500" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <Card className={`${
                      step.status === 'in-progress' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <CardTitle className="text-base sm:text-lg">{step.phase}</CardTitle>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              {step.duration}
                            </Badge>
                            <Badge 
                              variant={
                                step.status === 'completed' ? 'default' :
                                step.status === 'in-progress' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {step.status === 'completed' ? 'Completed' :
                               step.status === 'in-progress' ? 'In Progress' : 'Upcoming'}
                            </Badge>
                          </div>
                        </div>
                        {step.status === 'in-progress' && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">Progress</span>
                              <span className="text-xs text-gray-600">{step.progress}%</span>
                            </div>
                            <Progress value={step.progress} className="h-2" />
                          </div>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Skills to Learn:</h4>
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {step.skills.map((skill, skillIndex) => (
                                <Badge 
                                  key={skillIndex} 
                                  variant="secondary" 
                                  className="text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {step.status === 'in-progress' && (
                            <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                              Continue Learning
                              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 border-t">
            <Button className="flex-1 text-sm sm:text-base">
              <Plus className="h-4 w-4 mr-2" />
              Customize Roadmap
            </Button>
            <Button variant="outline" className="flex-1 text-sm sm:text-base">
              <Award className="h-4 w-4 mr-2" />
              View Achievements
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">1,250</p>
                <p className="text-xs sm:text-sm text-gray-600">XP Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">12</p>
                <p className="text-xs sm:text-sm text-gray-600">Skills Mastered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">45h</p>
                <p className="text-xs sm:text-sm text-gray-600">Learning Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
