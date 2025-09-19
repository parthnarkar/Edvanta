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
  Activity,
  Loader2,
  Target,
  Star,
  Plus
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

  // Roadmaps state management
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState(false);

  // Fetch roadmaps when user changes
  useEffect(() => {
    if (user) {
      fetchUserRoadmaps();
    }
  }, [user]);

  // Function to fetch user's roadmaps
  const fetchUserRoadmaps = async () => {
    try {
      setIsLoadingRoadmaps(true);
      // Replace this with your actual API call
      // const response = await fetch(`/api/roadmaps?userId=${user.uid}`);
      // const data = await response.json();
      // setSavedRoadmaps(data);

      // For now, using mock data - replace with actual API call
      setTimeout(() => {
        setSavedRoadmaps([
          {
            id: '1',
            title: 'Full Stack Web Development',
            description: 'Complete roadmap for becoming a full stack developer with React, Node.js, and databases.',
            dateCreated: new Date().toISOString().split('T')[0],
            data: {
              nodes: [
                { id: '1', data: { label: 'HTML/CSS' } },
                { id: '2', data: { label: 'JavaScript' } },
                { id: '3', data: { label: 'React' } },
                { id: '4', data: { label: 'Node.js' } },
                { id: '5', data: { label: 'Database' } }
              ]
            }
          }
        ]);
        setIsLoadingRoadmaps(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
      setIsLoadingRoadmaps(false);
    }
  };

  // Function to view roadmap details
  const viewRoadmapDetails = (roadmap) => {
    // Navigate to roadmap detail page or open modal
    console.log('Viewing roadmap:', roadmap);
    // You can implement navigation or modal opening here
  };

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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
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
        <Card className="overflow-hidden">
          <CardHeader className="px-4 sm:px-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Continue Learning
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {savedRoadmaps.length > 0 ? "Pick up where you left off" : "Start your learning journey"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-4 sm:px-6 pb-6">
            {!user ? (
              // Not signed in state
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Sign in to continue learning</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Access your personalized roadmaps and track your progress
                </p>
                <Button size="sm" variant="outline" className="bg-white">
                  Sign In to Continue
                </Button>
              </div>
            ) : isLoadingRoadmaps ? (
              // Loading state
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Loading your progress...</h3>
                <p className="text-sm text-gray-600">
                  Fetching your learning roadmaps
                </p>
              </div>
            ) : savedRoadmaps.length > 0 ? (
              // Has roadmaps - show the latest one
              (() => {
                const latestRoadmap = savedRoadmaps[0]; // Assuming they're sorted by creation date
                const progressPercentage = Math.min(
                  Math.round((new Date() - new Date(latestRoadmap.dateCreated)) / (1000 * 60 * 60 * 24 * 7) * 10),
                  100
                ); // Rough progress calculation

                return (
                  <>
                    {/* Latest Roadmap Progress */}
                    <div className="p-4 border-2 border-blue-100 rounded-xl bg-gradient-to-br from-blue-50/30 to-indigo-50/20 hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1">
                              {latestRoadmap.title}
                            </h4>
                            <p className="text-xs text-gray-600">
                              Started {latestRoadmap.dateCreated}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700 border-blue-200"
                        >
                          {progressPercentage}% Complete
                        </Badge>
                      </div>

                      <Progress
                        value={progressPercentage}
                        className="mb-3 h-2 bg-blue-100"
                      />

                      <p className="text-xs sm:text-sm text-gray-600 mb-4 line-clamp-2">
                        {latestRoadmap.description}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          asChild
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                        >
                          <Link to="/tools/roadmap">
                            Continue Learning
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewRoadmapDetails(latestRoadmap)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <Target className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-xs font-medium text-green-700">Total Roadmaps</span>
                        </div>
                        <p className="text-lg font-bold text-green-800">{savedRoadmaps.length}</p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-3 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <Award className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="text-xs font-medium text-purple-700">Skills Learning</span>
                        </div>
                        <p className="text-lg font-bold text-purple-800">
                          {savedRoadmaps.reduce((total, roadmap) =>
                            total + (roadmap.data?.nodes?.length - 1 || 0), 0
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Recommended Actions */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-100">
                      <h4 className="font-semibold mb-3 text-sm flex items-center gap-2 text-amber-800">
                        <Star className="h-4 w-4 text-amber-600" />
                        Recommended for You
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                          <Brain className="h-4 w-4 text-pink-500 flex-shrink-0" />
                          <span>Take a quiz on your current roadmap topics</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                          <Palette className="h-4 w-4 text-purple-500 flex-shrink-0" />
                          <span>Generate visual lessons for complex concepts</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                          <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span>Ask AI tutor about roadmap challenges</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" asChild className="flex-1 text-xs border-amber-200 text-amber-700 hover:bg-amber-50">
                          <Link to="/tools/quizzes">Take Quiz</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild className="flex-1 text-xs border-amber-200 text-amber-700 hover:bg-amber-50">
                          <Link to="/tools/visual-generator">Create Visuals</Link>
                        </Button>
                      </div>
                    </div>
                  </>
                );
              })()
            ) : (
              // No roadmaps - encourage creation
              <div className="text-center py-8">
                <div className="relative mb-6">
                  {/* Animated background circles */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full animate-pulse"></div>
                    <div className="absolute w-16 h-16 bg-indigo-200 rounded-full animate-pulse delay-75"></div>
                    <div className="absolute w-12 h-12 bg-purple-200 rounded-full animate-pulse delay-150"></div>
                  </div>

                  {/* Main icon */}
                  <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                </div>

                <h3 className="font-bold text-xl text-gray-900 mb-2">
                  Ready to start your journey?
                </h3>
                <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto leading-relaxed">
                  Create your first personalized learning roadmap and unlock your potential with AI-guided career paths
                </p>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 gap-3 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Personalized learning paths</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Track your progress over time</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Award className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">AI-powered skill recommendations</span>
                  </div>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link to="/tools/roadmap">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Roadmap
                  </Link>
                </Button>

                <p className="text-xs text-gray-500 mt-3">
                  It takes less than 2 minutes to get started
                </p>
              </div>
            )}
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