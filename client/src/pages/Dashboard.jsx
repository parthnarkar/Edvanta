import React, { useState, useEffect, useRef } from 'react'
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
    title: 'Voice Tutor',
    description: 'Create your learning roadmap',
    href: '/tools/conversational-tutor',
    color: 'bg-purple-100 text-purple-700'
  },
  {
    icon: Award,
    title: 'Home Page',
    description: 'Explore all features',
    href: '/',
    color: 'bg-orange-100 text-orange-700'
  },
  {
    icon: FileText,
    title: 'Resume Builder',
    description: 'Build your resume with AI',
    href: '/tools/resume-builder',
    color: 'bg-yellow-100 text-yellow-700'
  },

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
  const { user, userProfile } = useAuth();

  const mobileStats = [
    { label: 'Quizzes Taken', value: '24', icon: Brain, change: '+3 this week' },
    { label: 'Learning Hours', value: '47', icon: Clock, change: '+8 this week' },
    { label: 'Lessons Generated', value: '12', icon: Palette, change: '+2 this week' },
    { label: 'Roadmap Progress', value: '68%', icon: TrendingUp, change: '+12% this month' }
  ];

  const laptopStats = [
    { label: 'Quizzes Taken', value: '24', icon: Brain, change: '+3 this week' },
    { label: 'Learning Hours', value: '47', icon: Clock, change: '+8 this week' },
    { label: 'Lessons Generated', value: '12', icon: Palette, change: '+2 this week' },
    { label: 'Roadmap Progress', value: '68%', icon: TrendingUp, change: '+12% this month' }
  ];

  // Responsive stats selection
  const [stats, setStats] = React.useState(mobileStats);

  React.useEffect(() => {
    // Use window.matchMedia to detect screen size
    const mq = window.matchMedia("(min-width: 1024px)");
    const handleResize = () => {
      setStats(mq.matches ? laptopStats : mobileStats);
    };
    handleResize();
    mq.addEventListener("change", handleResize);
    return () => mq.removeEventListener("change", handleResize);
  }, []);

  // Quick Actions Carousel State
  const [quickIndex, setQuickIndex] = useState(0);
  const quickLength = quickActions.length;
  const visibleCards = 4;
  const intervalRef = useRef();
  const [isHovered, setIsHovered] = useState(false);

  // Auto-slide logic (stops on hover)
  useEffect(() => {
    if (!isHovered) {
      intervalRef.current = setInterval(() => {
        setQuickIndex((prev) => (prev + visibleCards) % quickLength);
      }, 6000); // Increased duration to 6 seconds
    }
    return () => clearInterval(intervalRef.current);
  }, [quickLength, isHovered]);

  // Manual navigation
  const handlePrev = () => {
    setQuickIndex((prev) =>
      prev - visibleCards < 0
        ? quickLength - (quickLength % visibleCards || visibleCards)
        : prev - visibleCards
    );
  };

  const handleNext = () => {
    setQuickIndex((prev) =>
      (prev + visibleCards) % quickLength
    );
  };

  // Slice for visible cards
  const currentCards = quickActions.slice(quickIndex, quickIndex + visibleCards);
  // If at end, wrap around
  const cardsToShow =
    currentCards.length < visibleCards
      ? [...currentCards, ...quickActions.slice(0, visibleCards - currentCards.length)]
      : currentCards;

  // Responsive grid for Quick Actions (mobile view)
  const isMobile = window.matchMedia("(max-width: 640px)").matches;

  // For mobile: 2 columns x 2 rows grid, icon + title only (show only first 4 actions)
  const mobileQuickActions = quickActions.slice(0, 4); // Show first 4 actions

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Welcome Header */}
      <div className="bg-primary rounded-xl p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-white">
              Welcome back, {userProfile?.name || user?.displayName || 'Learner'}! 👋
            </h1>
            <p className="text-sm sm:text-base text-blue-100">
              Ready to continue your learning journey? Let's make today productive!
            </p>
          </div>
          <div className="hidden sm:block flex-shrink-0 ml-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 ">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{stat.change}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Carousel */}
      <Card
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
            Quick Actions
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Jump into your favorite learning tools
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {isMobile ? (
            <div
              className="grid grid-cols-2 grid-rows-2 gap-3"
              style={{
                minHeight: '120px',
                transition: 'opacity 0.7s, transform 0.7s'
              }}
            >
              {mobileQuickActions.map((action, index) => (
                <Link
                  key={action.title + index}
                  to={action.href}
                  className="group flex flex-col items-center justify-center p-3 rounded-lg border hover:shadow-lg transition-all bg-white hover:bg-gray-50 animate-fadeIn"
                  style={{
                    transition: 'transform 0.5s, box-shadow 0.5s'
                  }}
                >
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-xs text-center">{action.title}</h3>
                </Link>
              ))}
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 transition-all duration-3000"
              style={{
                minHeight: '180px',
                opacity: 1,
                transform: 'translateY(0)',
                transition: 'opacity 1.5s, transform 2s'
              }}
            >
              {cardsToShow.map((action, index) => (
                <Link
                  key={action.title + index}
                  to={action.href}
                  className="group p-3 sm:p-4 rounded-lg border hover:shadow-lg transition-all bg-white hover:bg-gray-50"
                  style={{
                    transition: 'transform 0.5s, box-shadow 0.5s',
                    animation: 'fadeIn 0.7s'
                  }}
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{action.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{action.description}</p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity & Continue Learning */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
            <CardDescription className="text-sm sm:text-base">Your latest learning sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg bg-gray-50">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <activity.icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{activity.title}</h4>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
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
            <Button variant="outline" className="w-full text-sm sm:text-base">
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Continue Learning */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Continue Learning</CardTitle>
            <CardDescription className="text-sm sm:text-base">Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm sm:text-base">Web Development Roadmap</h4>
                <Badge variant="secondary" className="text-xs">68% Complete</Badge>
              </div>
              <Progress value={68} className="mb-2" />
              <p className="text-xs sm:text-sm text-gray-600 mb-3">
                Next: Learn about API Integration and Database Design
              </p>
              <Button size="sm" asChild className="text-xs sm:text-sm">
                <Link to="/tools/roadmap">Continue</Link>
              </Button>
            </div>

            <div className="p-3 sm:p-4 border rounded-lg">
              <h4 className="font-medium mb-2 text-sm sm:text-base">Recommended for You</h4>
              <div className="space-y-2">
                <div className="text-xs sm:text-sm">
                  📚 Machine Learning Quiz - Test your ML knowledge
                </div>
                <div className="text-xs sm:text-sm">
                  🎨 Create visuals for Data Structures topic
                </div>
                <div className="text-xs sm:text-sm">
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

// Add this CSS to your global styles or inside a <style> tag if needed:
/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px);}
  to { opacity: 1; transform: translateY(0);}
}
.animate-fadeIn {
  animation: fadeIn 0.7s;
}
*/