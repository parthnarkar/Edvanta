import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import {
  Brain,
  Palette,
  MessageSquare,
  Mic,
  MapPin,
  FileText,
  TrendingUp,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
  Activity
} from 'lucide-react'

const quickActions = [
  {
    icon: Palette,
    title: 'Generate Visual Lesson',
    description: 'Create animated content from your notes',
    href: '/tools/visual-generator',
    color: 'bg-pink-100 text-pink-700'
  },
  {
    icon: Brain,
    title: 'Take a Quiz',
    description: 'Test your knowledge with AI quizzes',
    href: '/tools/quizzes',
    color: 'bg-green-100 text-green-700'
  },
  {
    icon: MessageSquare,
    title: 'Ask Questions',
    description: 'Get help from our AI tutor',
    href: '/tools/doubt-solving',
    color: 'bg-blue-100 text-blue-700'
  },
  {
    icon: MapPin,
    title: 'Plan Career Path',
    description: 'Create your learning roadmap',
    href: '/tools/roadmap',
    color: 'bg-purple-100 text-purple-700'
  }
]

const recentActivities = [
  {
    type: 'quiz',
    title: 'JavaScript Fundamentals Quiz',
    score: '85%',
    time: '2 hours ago',
    icon: Brain
  },
  {
    type: 'lesson',
    title: 'React Components Visual Guide',
    status: 'Generated',
    time: '1 day ago',
    icon: Palette
  },
  {
    type: 'chat',
    title: 'Asked about API Integration',
    status: 'Resolved',
    time: '2 days ago',
    icon: MessageSquare
  }
]

export function Dashboard() {
  const { user, userProfile } = useAuth()

  const stats = [
    { label: 'Quizzes Taken', value: '24', icon: Brain, change: '+3 this week' },
    { label: 'Lessons Generated', value: '12', icon: Palette, change: '+2 this week' },
    { label: 'Learning Hours', value: '47', icon: Clock, change: '+8 this week' },
    { label: 'Roadmap Progress', value: '68%', icon: TrendingUp, change: '+12% this month' }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {userProfile?.name || user?.displayName || 'Learner'}! 👋
            </h1>
            <p className="text-blue-100">
              Ready to continue your learning journey? Let's make today productive!
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-12 h-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Jump into your favorite learning tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className="group p-4 rounded-lg border hover:shadow-md transition-all bg-white hover:bg-gray-50"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
                <ArrowRight className="h-4 w-4 text-gray-400 mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Continue Learning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest learning sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <activity.icon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{activity.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{activity.time}</span>
                    {activity.score && (
                      <Badge variant="success" className="text-xs">
                        {activity.score}
                      </Badge>
                    )}
                    {activity.status && (
                      <Badge variant="secondary" className="text-xs">
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Continue Learning */}
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Web Development Roadmap</h4>
                <Badge variant="secondary">68% Complete</Badge>
              </div>
              <Progress value={68} className="mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                Next: Learn about API Integration and Database Design
              </p>
              <Button size="sm" asChild>
                <Link to="/tools/roadmap">Continue</Link>
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Recommended for You</h4>
              <div className="space-y-2">
                <div className="text-sm">
                  📚 Machine Learning Quiz - Test your ML knowledge
                </div>
                <div className="text-sm">
                  🎨 Create visuals for Data Structures topic
                </div>
                <div className="text-sm">
                  🗣️ Practice explaining algorithms with Voice Tutor
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}