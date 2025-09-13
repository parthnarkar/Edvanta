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
  Filter,
  AlertCircle,
  Loader2,
  X,
  Route,
  Milestone,
  FileText,
  Calendar,
} from "lucide-react";

import backEndURL from "../../hooks/helper";
import { useAuth } from "../../hooks/useAuth";

export function Roadmap() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [customBackground, setCustomBackground] = useState("");
  const [customDuration, setCustomDuration] = useState(null);
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [customRoadmap, setCustomRoadmap] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);

  // Fetch user's roadmaps when component mounts or user changes
  useEffect(() => {
    if (user?.email) {
      fetchUserRoadmaps();
    }
  }, [user]);

  // Function to fetch user's roadmaps from the database
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

  // Function to generate a custom roadmap using the backend API
  const generateCustomRoadmap = async () => {
    if (!customGoal || !customBackground) {
      setError("Please enter both your goal and your background");
      return;
    }

    if (!user?.email) {
      setError("Please sign in to create roadmaps");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch(`${backEndURL}/api/roadmap/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: customGoal,
          background: customBackground,
          duration_weeks: parseInt(customDuration),
          user_email: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate roadmap");
      }

      const data = await response.json();

      // Process the roadmap data
      const parsedRoadmap = data.roadmap;
      setCustomRoadmap(parsedRoadmap);

      // Fetch updated roadmaps after successful generation
      fetchUserRoadmaps();

      // Clear input fields after successful generation
      setCustomGoal("");
      setCustomBackground("");
      setCustomDuration(""); // Reset to default duration
    } catch (err) {
      console.error("Error generating roadmap:", err);
      setError(
        err.message || "An error occurred while generating your roadmap"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to open the roadmap detail modal
  const viewRoadmapDetails = async (roadmap) => {
    if (!user?.email) {
      console.error("User not authenticated");
      return;
    }

    try {
      // If we already have the full roadmap data, just use it
      if (roadmap.data && roadmap.data.nodes && roadmap.data.edges) {
        setSelectedRoadmap(roadmap);
        setShowRoadmapModal(true);
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

      // Transform to match expected format if needed
      const transformedRoadmap = {
        id: detailedRoadmap.id,
        title: detailedRoadmap.title,
        description: detailedRoadmap.description,
        duration: detailedRoadmap.duration_weeks,
        dateCreated: new Date(detailedRoadmap.created_at).toLocaleDateString(),
        data: detailedRoadmap.data,
        skills: detailedRoadmap.data.nodes
          ? detailedRoadmap.data.nodes
              .filter((node) => node.id !== "start")
              .slice(0, 3)
              .map((node) => node.title)
          : [],
      };

      setSelectedRoadmap(transformedRoadmap);
      setShowRoadmapModal(true);
    } catch (error) {
      console.error("Error fetching roadmap details:", error);
      // Fallback to using the roadmap data we already have
      setSelectedRoadmap(roadmap);
      setShowRoadmapModal(true);
    }
  };

  // Function to delete a roadmap
  const deleteRoadmap = async (roadmapId) => {
    if (!user?.email || !roadmapId) {
      console.error("User not authenticated or missing roadmap ID");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this roadmap? This action cannot be undone."
      )
    ) {
      return; // User cancelled the deletion
    }

    try {
      setIsDeleting(true);
      const response = await fetch(
        `${backEndURL}/api/roadmap/${roadmapId}?user_email=${user.email}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete roadmap");
      }

      // If the deleted roadmap is currently selected, close the modal
      if (selectedRoadmap && selectedRoadmap.id === roadmapId) {
        setSelectedRoadmap(null);
        setShowRoadmapModal(false);
      }

      // Refetch all roadmaps from the database to ensure UI is in sync with backend
      await fetchUserRoadmaps();
    } catch (error) {
      console.error("Error deleting roadmap:", error);
      alert("Failed to delete roadmap. Please try again later.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate total duration of a roadmap
  const calculateTotalDuration = (nodes) => {
    if (!nodes || !Array.isArray(nodes)) return "N/A";

    const totalWeeks = nodes.reduce((sum, node) => {
      return sum + (parseInt(node.recommended_weeks) || 0);
    }, 0);

    return totalWeeks ? `${totalWeeks} weeks` : "N/A";
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Career Roadmap
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4">
          Personalized learning paths and career guidance to achieve your goals
        </p>
      </div>

      {/* Custom Roadmap Generator - Moved to Top */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MapPin className="h-5 w-5" />
            Generate Your Custom Roadmap
          </CardTitle>
          <CardDescription>
            Tell us about your goals and current skills to get a personalized
            learning path
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 text-center">
              <p className="text-sm text-yellow-800 mb-2">
                Please sign in to create roadmaps
              </p>
              <Button
                variant="outline"
                className="bg-white"
                onClick={() => {
                  // Navigate to login page or trigger login modal
                  window.location.href = "/auth/login";
                }}
              >
                Sign In
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="goal"
                  className="block text-sm font-medium mb-1"
                >
                  What's your learning goal?
                </label>
                <Input
                  id="goal"
                  placeholder="Eg. Become a Data Scientist"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="background"
                  className="block text-sm font-medium mb-1"
                >
                  What's your current background?
                </label>
                <Input
                  id="background"
                  placeholder="Eg. 3 years in software development, familiar with Python and data analysis"
                  value={customBackground}
                  onChange={(e) => setCustomBackground(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium mb-1"
                >
                  Target completion time (weeks)
                </label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="Eg. 12"
                  value={customDuration || ""}
                  onChange={(e) =>
                    setCustomDuration(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  min="1"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                className="w-full"
                onClick={generateCustomRoadmap}
                disabled={
                  isGenerating ||
                  !user ||
                  !customGoal?.trim() ||
                  !customBackground?.trim()
                }
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating your roadmap...
                  </>
                ) : (
                  <>
                    Generate Custom Roadmap
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Roadmaps Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            Your Generated Roadmaps
          </h2>

          {/* Search Bar for Generated Roadmaps */}
          <div className="w-full max-w-xs">
            <Input
              placeholder="Search your roadmaps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {!user ? (
          <div className="bg-yellow-50 border border-dashed border-yellow-200 rounded-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Please sign in to view your roadmaps
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Sign in to create and view your personalized learning roadmaps.
            </p>
          </div>
        ) : isLoadingRoadmaps ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-8 text-center">
            <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Loading your roadmaps
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Please wait while we fetch your learning roadmaps...
            </p>
          </div>
        ) : savedRoadmaps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* While comparing strings - No extra spaces after string ends */}
            {savedRoadmaps
              .filter(
                (roadmap) =>
                  roadmap.title
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase().trim()) ||
                  roadmap.description
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase().trim())
              )
              .map((roadmap) => (
                <Card
                  key={roadmap.id}
                  className="hover:shadow-md transition-all duration-200 flex flex-col h-full"
                >
                  <CardHeader className="pb-3 px-4 pt-4">
                    <CardTitle className="text-base sm:text-lg line-clamp-1">
                      {roadmap.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Created: {roadmap.dateCreated} • Duration:{" "}
                      {calculateTotalDuration(roadmap.data.nodes)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 flex-grow flex flex-col">
                    <div className="mb-4 flex-grow">
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {roadmap.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {roadmap.skills.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {roadmap.data.nodes &&
                          roadmap.data.nodes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{roadmap.data.nodes.length - 3} more
                            </Badge>
                          )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-auto">
                      <Button
                        size="sm"
                        className="w-full text-xs sm:text-sm h-9"
                        onClick={() => viewRoadmapDetails(roadmap)}
                      >
                        View Roadmap
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs sm:text-sm text-red-600 hover:bg-red-50 border-red-200 h-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRoadmap(roadmap.id);
                        }}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            Delete Roadmap
                            <X className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-8 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No roadmaps generated yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Fill out the form above to generate your first personalized career
              roadmap.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Create Your First Roadmap
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>

      {/* Roadmap Details Modal */}
      {showRoadmapModal && selectedRoadmap && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-100 p-2 sm:p-4 transition-all duration-300 overflow-hidden">
          <div className="bg-white/95 backdrop-filter rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] xs:max-h-[95vh] overflow-hidden border border-gray-100 flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 border-b p-3 sm:p-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3 max-w-[80%]">
                  <div className="bg-blue-500/10 p-1.5 sm:p-2 rounded-lg hidden xs:block">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900 line-clamp-1">
                      {selectedRoadmap.title}
                    </h2>
                    <p className="text-xs xs:text-sm text-gray-500">
                      Created on {selectedRoadmap.dateCreated}
                    </p>
                  </div>
                </div>
                <button
                  className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => setShowRoadmapModal(false)}
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4 my-1 sm:my-2 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
              {/* Roadmap Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 sm:p-3 md:p-5 rounded-xl shadow-sm border border-blue-100">
                <h3 className="font-semibold text-sm xs:text-base sm:text-lg text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                  <Target className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Overview</span>
                </h3>
                <p className="text-xs xs:text-sm text-gray-700 mb-2 sm:mb-3 md:mb-4 leading-relaxed break-words">
                  {selectedRoadmap.description}
                </p>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-white/80 backdrop-blur-sm p-2 sm:p-3 rounded-lg flex items-center gap-2 sm:gap-3 shadow-sm">
                    <div className="bg-blue-100 p-1 xs:p-1.5 sm:p-2 rounded-full flex-shrink-0">
                      <Clock className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        Total Duration
                      </p>
                      <p className="text-xs xs:text-sm sm:text-base font-medium truncate">
                        {calculateTotalDuration(selectedRoadmap.data.nodes)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-2 sm:p-3 rounded-lg flex items-center gap-2 sm:gap-3 shadow-sm">
                    <div className="bg-green-100 p-1 xs:p-1.5 sm:p-2 rounded-full flex-shrink-0">
                      <Target className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        Skills to Learn
                      </p>
                      <p className="text-xs xs:text-sm sm:text-base font-medium truncate">
                        {selectedRoadmap.data.nodes?.length - 1 || 0}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-2 sm:p-3 rounded-lg flex items-center gap-2 sm:gap-3 shadow-sm">
                    <div className="bg-purple-100 p-1 xs:p-1.5 sm:p-2 rounded-full flex-shrink-0">
                      <Calendar className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        Target Completion
                      </p>
                      <p className="text-xs xs:text-sm sm:text-base font-medium truncate">
                        {new Date(
                          new Date(selectedRoadmap.dateCreated).getTime() +
                            selectedRoadmap.duration * 7 * 24 * 60 * 60 * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Roadmap Timeline */}
              <div>
                <h3 className="font-semibold text-sm xs:text-base sm:text-lg text-gray-800 mb-2 xs:mb-3 sm:mb-5 flex items-center gap-2">
                  <Milestone className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Learning Path</span>
                </h3>
                <div className="space-y-4 xs:space-y-5 sm:space-y-6">
                  {selectedRoadmap.data.nodes?.map((node, index) => (
                    <div key={node.id || index} className="relative">
                      {/* Connection Line */}
                      {index < selectedRoadmap.data.nodes.length - 1 && (
                        <div className="absolute left-3 xs:left-4 sm:left-6 top-8 xs:top-10 sm:top-14 h-[calc(100%-32px)] xs:h-[calc(100%-40px)] sm:h-[calc(100%-56px)] w-1 bg-gradient-to-b from-blue-400 to-blue-100 rounded-full z-0"></div>
                      )}

                      <div className="flex gap-2 xs:gap-3 sm:gap-5">
                        {/* Step Icon */}
                        <div
                          className={`flex-shrink-0 w-6 h-6 xs:w-8 xs:h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md z-[5] ${
                            index === 0
                              ? "bg-gradient-to-br from-green-400 to-green-600 text-white"
                              : index === selectedRoadmap.data.nodes.length - 1
                              ? "bg-gradient-to-br from-blue-400 to-indigo-600 text-white"
                              : "bg-gradient-to-br from-blue-300 to-blue-500 text-white"
                          }`}
                        >
                          {index === 0 ? (
                            <MapPin className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-5 sm:w-5" />
                          ) : index ===
                            selectedRoadmap.data.nodes.length - 1 ? (
                            <CheckCircle className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-5 sm:w-5" />
                          ) : (
                            <Milestone className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-5 sm:w-5" />
                          )}
                        </div>

                        {/* Node Content */}
                        <div className="flex-1 min-w-0">
                          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative z-[1] overflow-hidden">
                            <CardHeader className="pb-1 xs:pb-2 sm:pb-3 px-2 xs:px-3 sm:px-6 pt-2 xs:pt-3 sm:pt-4">
                              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 sm:gap-2">
                                <CardTitle className="text-xs xs:text-sm sm:text-base md:text-lg text-gray-800 line-clamp-2 break-words">
                                  {node.title}
                                </CardTitle>
                                {node.recommended_weeks && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] xs:text-xs whitespace-nowrap bg-blue-50 text-blue-600 border-blue-200 w-fit flex-shrink-0"
                                  >
                                    {node.recommended_weeks}{" "}
                                    {node.recommended_weeks === 1
                                      ? "week"
                                      : "weeks"}
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2 xs:space-y-3 sm:space-y-4 px-2 xs:px-3 sm:px-6 pb-2 xs:pb-3 sm:pb-4">
                              <p className="text-[10px] xs:text-xs sm:text-sm text-gray-600 leading-relaxed break-words">
                                {node.description}
                              </p>

                              {node.resources && node.resources.length > 0 && (
                                <div className="bg-gray-50/80 rounded-lg p-1.5 xs:p-2 sm:p-3">
                                  <h4 className="text-[10px] xs:text-xs sm:text-sm font-medium mb-1 xs:mb-1.5 sm:mb-2 flex items-center gap-1 xs:gap-1.5">
                                    <BookOpen className="h-2.5 w-2.5 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                                    <span className="truncate">Resources:</span>
                                  </h4>
                                  <ul className="text-[10px] xs:text-xs sm:text-sm text-gray-600 space-y-1 xs:space-y-1.5 sm:space-y-2 pl-3 xs:pl-4 sm:pl-5">
                                    {node.resources.map((resource, i) => (
                                      <li
                                        key={i}
                                        className="list-disc marker:text-blue-400 break-words"
                                      >
                                        <span className="text-gray-700 break-words">
                                          {typeof resource === "string"
                                            ? resource
                                            : resource.name ||
                                              resource.title ||
                                              "Resource"}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connections/Dependencies Visualization */}
              {selectedRoadmap.data.edges &&
                selectedRoadmap.data.edges.length > 0 && (
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-2 xs:p-3 sm:p-5 rounded-xl shadow-sm border border-indigo-100">
                    <h3 className="font-semibold text-sm xs:text-base sm:text-lg text-gray-800 mb-2 xs:mb-3 sm:mb-4 flex items-center gap-2">
                      <Route className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                      <span className="truncate">Skill Dependencies</span>
                    </h3>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                      {selectedRoadmap.data.edges.map((edge, index) => {
                        const fromNode = selectedRoadmap.data.nodes.find(
                          (n) => n.id === edge.from
                        );
                        const toNode = selectedRoadmap.data.nodes.find(
                          (n) => n.id === edge.to
                        );

                        if (!fromNode || !toNode) return null;

                        return (
                          <div
                            key={index}
                            className="bg-white/80 backdrop-blur-sm p-1.5 xs:p-2 sm:p-3 rounded-lg flex items-center gap-1.5 xs:gap-2 shadow-sm overflow-hidden"
                          >
                            <div className="flex-shrink-0 w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <Route className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 text-indigo-600" />
                            </div>
                            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 text-[10px] xs:text-xs sm:text-sm overflow-hidden min-w-0 flex-1">
                              <span className="font-medium text-gray-800 line-clamp-1 min-w-0 flex-shrink truncate">
                                {fromNode.title}
                              </span>
                              <ArrowRight className="h-2 w-2 xs:h-2.5 xs:w-2.5 sm:h-3 sm:w-3 text-gray-400 flex-shrink-0 mx-0.5 xs:mx-1" />
                              <span className="font-medium text-gray-800 line-clamp-1 min-w-0 flex-shrink truncate">
                                {toNode.title}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm z-10 border-t shadow-md p-3 xs:p-4 rounded-b-xl w-full">
              <div className="flex gap-3 flex-col sm:flex-row">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs xs:text-sm py-2 px-3 xs:px-4"
                  onClick={() => {
                    setShowRoadmapModal(false);
                    // Could add more actions here like printing, sharing, etc.
                  }}
                >
                  <FileText className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1.5 xs:mr-2" />
                  Export PDF (Coming Soon)
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-100 text-xs xs:text-sm py-2 px-3 xs:px-4 text-gray-700"
                  onClick={() => setShowRoadmapModal(false)}
                >
                  <X className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1.5 xs:mr-2" />
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
