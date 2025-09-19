import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { useAuth } from '../hooks/useAuth'
import { Link, useNavigate } from 'react-router-dom'
import backEndURL from '../hooks/helper'  // Import the backend URL helper
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

// Function to format learning time with points for minutes
const formatLearningTime = (totalMinutes) => {
  if (!totalMinutes || totalMinutes === 0) {
    return "0m";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`; // Show only minutes if less than 1 hour
  } else if (minutes === 0) {
    return `${hours}h`; // Show only hours if no remaining minutes
  } else {
    return `${hours}.${minutes}h`; // Show hours with decimal points for minutes
  }
};

// Alternative format showing both hours and minutes separately
const formatLearningTimeDetailed = (totalMinutes) => {
  if (!totalMinutes || totalMinutes === 0) {
    return "0m";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

export function Dashboard() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  // State management
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState(false);

  // Add quiz history state
  const [quizHistory, setQuizHistory] = useState([]);
  const [userStats, setUserStats] = useState({
    totalLearningHours: 0,
    quizzesTaken: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Session tracking
  const [sessionStartTime] = useState(Date.now());

  // Quick Actions Carousel State - ADD THESE MISSING VARIABLES
  const [quickIndex, setQuickIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Mobile detection - ADD THIS
  const [isMobile, setIsMobile] = useState(false);

  // Quick actions for mobile (first 4 actions) - ADD THIS
  const mobileQuickActions = quickActions.slice(0, 4);

  // Carousel logic - ADD THIS
  const quickLength = quickActions.length;
  const visibleCards = 4;
  const intervalRef = useRef();

  // Calculate current cards to show - ADD THIS
  const currentCards = quickActions.slice(quickIndex, quickIndex + visibleCards);
  const cardsToShow = currentCards.length < visibleCards
    ? [...currentCards, ...quickActions.slice(0, visibleCards - currentCards.length)]
    : currentCards;

  // Mobile detection effect - ADD THIS
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 640px)").matches);
    };

    checkMobile();
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    mediaQuery.addEventListener('change', checkMobile);

    return () => mediaQuery.removeEventListener('change', checkMobile);
  }, []);

  // Auto-slide logic for carousel - ADD THIS
  useEffect(() => {
    if (!isHovered && !isMobile) {
      intervalRef.current = setInterval(() => {
        setQuickIndex((prev) => (prev + visibleCards) % quickLength);
      }, 6000);
    }
    return () => clearInterval(intervalRef.current);
  }, [quickLength, isHovered, isMobile]);

  // Manual navigation functions - ADD THESE
  const handlePrev = () => {
    setQuickIndex((prev) =>
      prev - visibleCards < 0
        ? quickLength - (quickLength % visibleCards || visibleCards)
        : prev - visibleCards
    );
  };

  const handleNext = () => {
    setQuickIndex((prev) => (prev + visibleCards) % quickLength);
  };

  // Fetch user data when component mounts or user changes
  useEffect(() => {
    if (user?.email) {
      fetchUserRoadmaps();
      fetchUserStats();
      fetchQuizHistory();
    }
  }, [user]);

  // Track session time and save on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.email) {
        saveSessionTime();
      }
    };

    // Save session time when user navigates away or closes tab
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function to save session time when component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (user?.email) {
        saveSessionTime();
      }
    };
  }, [user, sessionStartTime]);

  // Function to save session time to backend
  const saveSessionTime = async () => {
    if (!user?.email) return;

    try {
      const sessionEndTime = Date.now();
      const sessionDuration = Math.round((sessionEndTime - sessionStartTime) / (1000 * 60)); // Convert to minutes

      // Only save if session lasted more than 1 minute to avoid spam
      if (sessionDuration >= 1) {
        await fetch(`${backEndURL}/api/user-stats/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_email: user.email,
            session_duration: sessionDuration, // in minutes
            session_date: new Date().toISOString()
          }),
        });
      }
    } catch (error) {
      console.error('Failed to save session time:', error);
    }
  };

  // Function to fetch user statistics from backend
  const fetchUserStats = async () => {
    if (!user?.email) return;

    try {
      setIsLoadingStats(true);

      const response = await fetch(
        `${backEndURL}/api/user-stats?user_email=${encodeURIComponent(user.email)}`
      );

      if (response.ok) {
        const stats = await response.json();
        setUserStats({
          totalLearningHours: stats.total_learning_minutes || 0, // Keep as minutes for precise calculation
          quizzesTaken: stats.quizzes_taken || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Function to fetch quiz history
  const fetchQuizHistory = async () => {
    if (!user?.email) return;

    try {
      const response = await fetch(
        `${backEndURL}/api/quiz-history?user_email=${encodeURIComponent(user.email)}`
      );

      if (response.ok) {
        const history = await response.json();
        setQuizHistory(history);
      }
    } catch (error) {
      console.error('Error fetching quiz history:', error);
    }
  };

  // Fetch roadmaps when user changes
  useEffect(() => {
    if (user?.email) {
      fetchUserRoadmaps();
    }
  }, [user]);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Function to fetch user's roadmaps from the database - USING THE REAL API
  const fetchUserRoadmaps = async () => {
    if (!user?.email) return;

    try {
      setIsLoadingRoadmaps(true);
      const startTime = Date.now();

      const response = await fetch(
        `${backEndURL}/api/roadmap/user?user_email=${user.email}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch roadmaps");
      }

      const roadmapsData = await response.json();

      // Transform the data to match the expected format
      const transformedRoadmaps = roadmapsData.map((roadmap) => ({
        id: roadmap.id,
        title: roadmap.title,
        description: roadmap.description,
        duration: roadmap.duration_weeks,
        dateCreated: new Date(roadmap.created_at).toLocaleDateString(),
        data: roadmap.data,
        skills: roadmap.data.nodes
          ? roadmap.data.nodes
            .filter((node) => node.id !== "start")
            .slice(0, 3)
            .map((node) => node.title)
          : [],
      }));

      // Calculate time elapsed since starting the fetch
      const timeElapsed = Date.now() - startTime;
      const minimumLoadingTime = 2000; // 2 seconds in milliseconds

      // If fetch completed too quickly, wait until minimum loading time is reached
      if (timeElapsed < minimumLoadingTime) {
        await new Promise(resolve =>
          setTimeout(resolve, minimumLoadingTime - timeElapsed)
        );
      }

      setSavedRoadmaps(transformedRoadmaps);
    } catch (err) {
      console.error("Error fetching roadmaps:", err);
      // Keep any existing roadmaps if there was an error
    } finally {
      setIsLoadingRoadmaps(false);
    }
  };

  // Function to view roadmap details
  const viewRoadmapDetails = async (roadmap) => {
    if (!user?.email) {
      console.error("User not authenticated");
      return;
    }

    try {
      // If we already have the full roadmap data, just navigate or show modal
      if (roadmap.data && roadmap.data.nodes && roadmap.data.edges) {
        // Navigate to roadmap page or open modal
        console.log('Viewing roadmap:', roadmap);
        // You could navigate to a detailed view page
        // window.location.href = `/tools/roadmap?id=${roadmap.id}`;
        return;
      }

      // Otherwise fetch the detailed roadmap from the server
      const response = await fetch(
        `${backEndURL}/api/roadmap/${roadmap.id}?user_email=${user.email}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch roadmap details");
      }

      const detailedRoadmap = await response.json();
      console.log('Detailed roadmap:', detailedRoadmap);
      // Navigate or show modal with detailed roadmap
    } catch (error) {
      console.error("Error fetching roadmap details:", error);
      // Fallback to using the roadmap data we already have
      console.log('Using existing roadmap data:', roadmap);
    }
  };

  // Function to handle Take Quiz with roadmap context
  const handleTakeQuizWithRoadmap = (latestRoadmap) => {
    // Navigate to quizzes page with the roadmap title as state
    navigate('/tools/quizzes', {
      state: {
        quizTopic: latestRoadmap.title,
        fromRoadmap: true
      }
    });
  };

  // Calculate dynamic stats from roadmap data and quiz history
  const calculateDynamicStats = () => {
    if (!savedRoadmaps.length && !quizHistory.length) {
      return {
        totalRoadmaps: 0,
        totalSkills: 0,
        completedSkills: 0,
        quizzesTaken: 0,
        learningMinutes: 0, // Changed to minutes for precise display
        activeWeeks: 0
      };
    }

    // Calculate total skills across all roadmaps
    const totalSkills = savedRoadmaps.reduce((sum, roadmap) =>
      sum + (roadmap.data?.nodes?.length - 1 || 0), 0
    );

    // Calculate estimated completed skills based on time elapsed
    const completedSkills = savedRoadmaps.reduce((sum, roadmap) => {
      const daysSinceStart = Math.floor(
        (new Date() - new Date(roadmap.dateCreated)) / (1000 * 60 * 60 * 24)
      );
      const totalDays = (roadmap.duration || 12) * 7; // weeks to days
      const progressRatio = Math.min(daysSinceStart / totalDays, 1);
      const nodesCount = roadmap.data?.nodes?.length - 1 || 0;
      return sum + Math.floor(nodesCount * progressRatio);
    }, 0);

    // Calculate active weeks (total duration of all roadmaps)
    const activeWeeks = savedRoadmaps.reduce((sum, roadmap) =>
      sum + (roadmap.duration || 0), 0
    );

    return {
      totalRoadmaps: savedRoadmaps.length,
      totalSkills,
      completedSkills,
      quizzesTaken: quizHistory.length, // Real count from quiz history
      learningMinutes: userStats.totalLearningHours, // This is actually minutes from backend
      activeWeeks
    };
  };

  // Get calculated stats
  const dynamicStats = calculateDynamicStats();

  // Create dynamic stats array with formatted learning time
  const stats = [
    {
      label: 'Active Roadmaps',
      value: dynamicStats.totalRoadmaps,
      icon: MapPin,
      change: `${dynamicStats.activeWeeks} weeks total`,
      color: 'text-blue-600'
    },
    {
      label: 'Skills Learning',
      value: dynamicStats.totalSkills,
      icon: Award,
      change: `${dynamicStats.completedSkills} completed`,
      color: 'text-green-600'
    },
    {
      label: 'Quizzes Taken',
      value: dynamicStats.quizzesTaken,
      icon: Brain,
      change: quizHistory.length > 0
        ? `${Math.round(quizHistory.reduce((sum, quiz) => sum + quiz.percentage, 0) / quizHistory.length)}% avg score`
        : 'No quizzes yet',
      color: 'text-purple-600'
    },
    {
      label: 'Learning Time',
      value: formatLearningTime(dynamicStats.learningMinutes), // Use formatted time
      icon: Clock,
      change: dynamicStats.learningMinutes > 0
        ? `${formatLearningTimeDetailed(dynamicStats.learningMinutes)} total study`
        : 'Start learning today',
      color: 'text-orange-600'
    }
  ];

  // Loading skeleton for stats
  const statsLoadingSkeleton = Array.from({ length: 4 }).map((_, index) => (
    <Card key={index} className="animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="h-4 w-4 bg-gray-200 rounded"></div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </CardContent>
    </Card>
  ));

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Welcome Header */}
      <div className="bg-[#289da8] rounded-xl p-4 sm:p-6 text-white">
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

      {/* Dynamic Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {isLoadingRoadmaps || isLoadingStats ? (
          statsLoadingSkeleton
        ) : !user ? (
          // Not signed in - show placeholder stats
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="opacity-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">
                  {['Roadmaps', 'Skills', 'Quizzes', 'Hours'][index]}
                </CardTitle>
                <div className="h-3 w-3 sm:h-4 sm:w-4 bg-gray-300 rounded flex-shrink-0" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold text-gray-400">--</div>
                <p className="text-xs text-gray-400 flex items-center mt-1">
                  <span className="truncate">Sign in to view</span>
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color} flex-shrink-0`} />
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{stat.change}</span>
                </p>
              </CardContent>
            </Card>
          ))
        )}
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
                const latestRoadmap = savedRoadmaps[0]; // Get the first roadmap (latest)
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTakeQuizWithRoadmap(latestRoadmap)}
                          className="flex-1 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 cursor-pointer"
                        >
                          Take Quiz
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