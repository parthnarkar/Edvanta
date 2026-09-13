import { useState, useEffect } from "react";
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

import {
  MapPin,
  Target,
  CheckCircle,
  Clock,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Loader2,
  X,
  Route,
  Milestone,
  FileText,
  Calendar,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { getCachedData, setCachedData, queueSyncAction } from "../../lib/offlineStorage";
import { edvantaAPI, api } from "../../lib/api";

const enforceMinimumLoadingTime = async (startTime, minimumTime = 1000) => {
  const timeElapsed = Date.now() - startTime;
  if (timeElapsed < minimumTime) {
    await new Promise((resolve) =>
      setTimeout(resolve, minimumTime - timeElapsed)
    );
  }
};

const getRoadmapProgress = (nodes) => {
  if (!nodes || !Array.isArray(nodes)) return 0;
  // The first node (index 0) is the start point and has no checkbox, so filter it out.
  // Also filter out any node with id "start" to be safe.
  const targetNodes = nodes.filter((n, idx) => idx !== 0 && n.id !== "start");
  if (targetNodes.length === 0) return 0;
  const completedNodes = targetNodes.filter((n) => n.completed).length;
  return Math.round((completedNodes / targetNodes.length) * 100);
};

const getTargetCompletionDate = (roadmap) => {
  if (!roadmap) return "N/A";
  const dateSource = roadmap.created_at || roadmap.dateCreated;
  if (!dateSource) return "N/A";
  
  const baseDate = new Date(dateSource);
  if (isNaN(baseDate.getTime())) {
    // Try to manually parse DD/MM/YYYY
    const parts = String(dateSource).split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed month
      const year = parseInt(parts[2], 10);
      const parsedDate = new Date(year, month, day);
      if (!isNaN(parsedDate.getTime())) {
        return new Date(
          parsedDate.getTime() + (roadmap.duration || 12) * 7 * 24 * 60 * 60 * 1000
        ).toLocaleDateString();
      }
    }
    return "N/A";
  }
  
  return new Date(
    baseDate.getTime() + (roadmap.duration || 12) * 7 * 24 * 60 * 60 * 1000
  ).toLocaleDateString();
};

export function Roadmap() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [customBackground, setCustomBackground] = useState("");
  const [customDuration, setCustomDuration] = useState(null);
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingRoadmapId, setDeletingRoadmapId] = useState(null);
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

  // Background synchronization listener
  useEffect(() => {
    const handleSyncComplete = (event) => {
      if (event.detail && event.detail.type === "roadmap") {
        if (user?.email) {
          fetchUserRoadmaps();
        }
      }
    };
    window.addEventListener("edvanta-sync-complete", handleSyncComplete);
    return () => window.removeEventListener("edvanta-sync-complete", handleSyncComplete);
  }, [user?.email]);

  // Function to fetch user's roadmaps from the database
  const fetchUserRoadmaps = async () => {
    if (!user?.email) return;

    try {
      setIsLoadingRoadmaps(true);
      const startTime = Date.now();

      if (!navigator.onLine) {
        const roadmapsData = getCachedData(user.email, "user_roadmaps", []);
        const transformedRoadmaps = roadmapsData.map((roadmap) => ({
          id: roadmap.id,
          title: roadmap.title,
          description: roadmap.description,
          duration: roadmap.duration_weeks,
          created_at: roadmap.created_at,
          dateCreated: new Date(roadmap.created_at).toLocaleDateString(),
          data: roadmap.data,
          skills: roadmap.data?.nodes
            ? roadmap.data.nodes
                .filter((node) => node.id !== "start")
                .slice(0, 3)
                .map((node) => node.title)
            : [],
        }));

        await enforceMinimumLoadingTime(startTime, 2000);
        setSavedRoadmaps(transformedRoadmaps);
        setIsLoadingRoadmaps(false);
        return;
      }

      const result = await edvantaAPI.getUserRoadmaps(user.email);

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch roadmaps");
      }

      const roadmapsData = result.data || [];
      setCachedData(user.email, "user_roadmaps", roadmapsData);

      // Transform the data to match the expected format
      const transformedRoadmaps = roadmapsData.map((roadmap) => ({
        id: roadmap.id,
        title: roadmap.title,
        description: roadmap.description,
        duration: roadmap.duration_weeks,
        created_at: roadmap.created_at,
        dateCreated: new Date(roadmap.created_at).toLocaleDateString(),
        data: roadmap.data,
        skills: roadmap.data?.nodes
          ? roadmap.data.nodes
              .filter((node) => node.id !== "start")
              .slice(0, 3)
              .map((node) => node.title)
          : [],
      }));

      // Wait for minimum loading time to ensure consistent UI animation behavior
      await enforceMinimumLoadingTime(startTime, 2000);

      setSavedRoadmaps(transformedRoadmaps);
    } catch (err) {
      console.error("Error fetching roadmaps:", err);
      // Fallback to cache on error
      if (user?.email) {
        const roadmapsData = getCachedData(user.email, "user_roadmaps", []);
        const transformedRoadmaps = roadmapsData.map((roadmap) => ({
          id: roadmap.id,
          title: roadmap.title,
          description: roadmap.description,
          duration: roadmap.duration_weeks,
          created_at: roadmap.created_at,
          dateCreated: new Date(roadmap.created_at).toLocaleDateString(),
          data: roadmap.data,
          skills: roadmap.data?.nodes
            ? roadmap.data.nodes
                .filter((node) => node.id !== "start")
                .slice(0, 3)
                .map((node) => node.title)
            : [],
        }));
        setSavedRoadmaps(transformedRoadmaps);
      }
    } finally {
      setIsLoadingRoadmaps(false);
    }
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

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

      const result = await edvantaAPI.generateRoadmap(
        customGoal,
        customBackground,
        parseInt(customDuration),
        user.email
      );

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to generate roadmap");
      }

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

    // If offline, try loading from cache
    if (!navigator.onLine) {
      const detailedRoadmap = getCachedData(user.email, `roadmap_detail_${roadmap.id}`);
      if (detailedRoadmap) {
        const transformedRoadmap = {
          id: detailedRoadmap.id,
          title: detailedRoadmap.title,
          description: detailedRoadmap.description,
          duration: detailedRoadmap.duration_weeks,
          created_at: detailedRoadmap.created_at,
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
      } else {
        // Fallback to selecting what we have in the list item
        setSelectedRoadmap(roadmap);
      }
      setShowRoadmapModal(true);
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
      const result = await edvantaAPI.getRoadmapDetails(roadmap.id, user.email);

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch roadmap details");
      }

      const detailedRoadmap = result.data;
      setCachedData(user.email, `roadmap_detail_${roadmap.id}`, detailedRoadmap);

      // Transform to match expected format if needed
      const transformedRoadmap = {
        id: detailedRoadmap.id,
        title: detailedRoadmap.title,
        description: detailedRoadmap.description,
        duration: detailedRoadmap.duration_weeks,
        created_at: detailedRoadmap.created_at,
        dateCreated: new Date(detailedRoadmap.created_at).toLocaleDateString(),
        data: detailedRoadmap.data,
        skills: detailedRoadmap.data?.nodes
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

    if (!navigator.onLine) {
      // Remove from state immediately
      const updatedSaved = savedRoadmaps.filter(r => r.id !== roadmapId);
      setSavedRoadmaps(updatedSaved);
      
      // Update cache
      const cachedRaw = getCachedData(user.email, "user_roadmaps", []);
      const updatedRaw = cachedRaw.filter(r => r.id !== roadmapId);
      setCachedData(user.email, "user_roadmaps", updatedRaw);

      // Queue background deletion task
      queueSyncAction(user.email, "DELETE_ROADMAP", { roadmapId, userEmail: user.email });

      if (selectedRoadmap && selectedRoadmap.id === roadmapId) {
        setSelectedRoadmap(null);
        setShowRoadmapModal(false);
      }
      return;
    }

    try {
      setDeletingRoadmapId(roadmapId);
      const result = await edvantaAPI.deleteRoadmap(roadmapId, user.email);

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to delete roadmap");
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
      setDeletingRoadmapId(null);
    }
  };

  // Calculate total duration of a roadmap
  const calculateTotalDuration = (nodes, roadmapDuration) => {
    // If we have the duration from the roadmap data, use it
    if (roadmapDuration && typeof roadmapDuration === 'number') {
      return roadmapDuration === 1 ? "1 week" : `${roadmapDuration} weeks`;
    }
    
    // Fallback: try to calculate from nodes if available
    if (!nodes || !Array.isArray(nodes)) return "N/A";

    // Look for week property (timeline position) or recommended_weeks property
    const totalWeeks = nodes.reduce((sum, node) => {
      const weeks = parseInt(node.recommended_weeks) || parseInt(node.week) || 0;
      return Math.max(sum, weeks); // Use max week number as total duration
    }, 0);

    return totalWeeks ? (totalWeeks === 1 ? "1 week" : `${totalWeeks} weeks`) : "N/A";
  };

  // Function to download roadmap as PDF
  const downloadRoadmap = async () => {
    if (!selectedRoadmap || !user?.email) return;

    try {
      const response = await api.fetchWithRetry(
        `${api.baseURL}/api/roadmap/download/${selectedRoadmap.id}?user_email=${encodeURIComponent(user.email)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `roadmap_${selectedRoadmap.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading roadmap:", error);
      alert("Failed to download roadmap. Please try again.");
    }
  };

  const toggleMilestone = async (roadmapId, nodeId) => {
    if (!selectedRoadmap || !user?.email) return;

    // Toggle completed state on the node
    const updatedNodes = selectedRoadmap.data.nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, completed: !node.completed };
      }
      return node;
    });

    const updatedRoadmap = {
      ...selectedRoadmap,
      data: {
        ...selectedRoadmap.data,
        nodes: updatedNodes,
      },
    };

    // Update state immediately for responsive feel
    setSelectedRoadmap(updatedRoadmap);

    // Update the list of saved roadmaps so the main view updates as well
    setSavedRoadmaps((prev) =>
      prev.map((r) => (r.id === roadmapId ? updatedRoadmap : r))
    );

    if (!navigator.onLine) {
      // Save locally to cache
      const cachedRaw = getCachedData(user.email, "user_roadmaps", []);
      const updatedRaw = cachedRaw.map((r) =>
        r.id === roadmapId ? { ...r, data: updatedRoadmap.data } : r
      );
      setCachedData(user.email, "user_roadmaps", updatedRaw);
      setCachedData(user.email, `roadmap_detail_${roadmapId}`, {
        ...selectedRoadmap,
        data: updatedRoadmap.data,
      });

      // Queue background sync task
      queueSyncAction(user.email, "UPDATE_ROADMAP_PROGRESS", {
        roadmapId,
        progressData: { data: updatedRoadmap.data },
        userEmail: user.email,
      });
      return;
    }

    try {
      const response = await edvantaAPI.updateRoadmapProgress(
        roadmapId,
        { data: updatedRoadmap.data },
        user.email
      );

      if (response.success) {
        // Save to cache
        const cachedRaw = getCachedData(user.email, "user_roadmaps", []);
        const updatedRaw = cachedRaw.map((r) =>
          r.id === roadmapId ? { ...r, data: updatedRoadmap.data } : r
        );
        setCachedData(user.email, "user_roadmaps", updatedRaw);
        setCachedData(user.email, `roadmap_detail_${roadmapId}`, {
          ...selectedRoadmap,
          data: updatedRoadmap.data,
        });
      } else {
        console.error("Failed to update roadmap progress on server:", response.error);
      }
    } catch (error) {
      console.error("Error updating roadmap progress:", error);
    }
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
              {!navigator.onLine && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-orange-500 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Offline Mode</span>
                    <span>AI Career roadmap generation requires an active internet connection. You can still browse and explore your previously saved career roadmaps below.</span>
                  </div>
                </div>
              )}

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
                  disabled={!navigator.onLine}
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
                  disabled={!navigator.onLine}
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
                  disabled={!navigator.onLine}
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
                  !customBackground?.trim() ||
                  !navigator.onLine
                }
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating your roadmap...
                  </>
                ) : !navigator.onLine ? (
                  <>
                    Offline (Disabled)
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
              placeholder="Search by goal..."
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
                (roadmap) => {
                  const searchLower = searchTerm.toLowerCase().trim();
                  if (!searchLower) return true;
                  
                  // Search primarily based on goal (title) with higher priority
                  const titleMatch = roadmap.title.toLowerCase().includes(searchLower);
                  
                  // Also check if any skills/topics in the roadmap match the search
                  const skillsMatch = roadmap.skills && roadmap.skills.some(skill => 
                    skill.toLowerCase().includes(searchLower)
                  );
                  
                  // Check if any node titles match (these represent learning goals/topics)
                  const nodesMatch = roadmap.data?.nodes && roadmap.data.nodes.some(node => 
                    node.title && node.title.toLowerCase().includes(searchLower)
                  );
                  
                  // Secondary: check description for broader context
                  const descriptionMatch = roadmap.description.toLowerCase().includes(searchLower);
                  
                  return titleMatch || skillsMatch || nodesMatch || descriptionMatch;
                }
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
                      {calculateTotalDuration(roadmap.data.nodes, roadmap.duration)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 flex-grow flex flex-col">
                    {roadmap.data.nodes && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{getRoadmapProgress(roadmap.data.nodes)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden border border-gray-200/50">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-500" 
                            style={{ width: `${getRoadmapProgress(roadmap.data.nodes)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
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
                        disabled={deletingRoadmapId !== null}
                      >
                        {deletingRoadmapId === roadmap.id ? (
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
                        {calculateTotalDuration(selectedRoadmap.data.nodes, selectedRoadmap.duration)}
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
                        {getTargetCompletionDate(selectedRoadmap)}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Modal Progress Bar */}
                <div className="mt-4 pt-4 border-t border-blue-200/50">
                  <div className="flex justify-between text-xs font-semibold text-blue-800 mb-1">
                    <span>Learning Progress</span>
                    <span>{getRoadmapProgress(selectedRoadmap.data.nodes)}% Completed</span>
                  </div>
                  <div className="w-full bg-blue-100/70 rounded-full h-2 overflow-hidden border border-blue-200/40">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${getRoadmapProgress(selectedRoadmap.data.nodes)}%` }}
                    ></div>
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
                                <CardTitle 
                                  className={`text-xs xs:text-sm sm:text-base md:text-lg text-gray-800 flex items-center gap-2 select-none ${index > 0 ? "cursor-pointer hover:text-primary" : ""}`}
                                  onClick={() => index > 0 && toggleMilestone(selectedRoadmap.id, node.id)}
                                >
                                  {index > 0 && (
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${
                                      node.completed 
                                        ? "bg-green-500 border-green-600 text-white" 
                                        : "border-gray-300 bg-white"
                                    }`}>
                                      {node.completed ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                      ) : null}
                                    </div>
                                  )}
                                  <span className={node.completed ? "line-through text-gray-400" : ""}>
                                    {node.title}
                                  </span>
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
                  onClick={downloadRoadmap}
                >
                  <FileText className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1.5 xs:mr-2" />
                  Download PDF
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
