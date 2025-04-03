import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  File,
  Link as LinkIcon,
  PlayCircle,
  Clock,
  CheckCircle,
  XCircle,
  Video,
  ArrowRight,
  ExternalLink,
  Timer,
  Trophy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatTime } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VisuallyHidden } from "../components/ui/visually-hidden";

interface Resource {
  id?: string;
  title: string;
  type: "pdf" | "word" | "excel" | "bibtex" | "link" | "video";
  url: string;
  publicId: string;
  fileName?: string;
  mimeType?: string;
  provider?: "cloudinary" | "imagekit";
  estimatedTime?: number;
  completed?: boolean;
  // These are added dynamically when marking a resource as complete
  moduleId?: string;
  lessonId?: string;
}

interface Quiz {
  title: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
    points: number;
  }[];
  passingScore: number;
  timeLimit: number;
}

interface Lesson {
  id: string;
  title: string;
  type: "video" | "quiz" | "reading" | "assignment";
  content: string;
  resources: Resource[];
  quiz?: Quiz;
  estimatedTime?: number;
  completionCriteria: "view" | "quiz" | "time";
  requiredScore?: number;
  requiredTime?: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  prerequisites: string[];
}

interface EnrollmentStatus {
  id: string;
  progress: number;
  totalTimeSpent: number;
  completed: boolean;
  resourceTimeSpent?: number; // Time spent on resources
  resourcesCompleted?: number; // Number of completed resources
  // Course-level completed resources
  completedResources?: {
    resourceId: string;
    completedAt: string;
    timeSpent: number;
  }[];
  modules: {
    moduleId: string;
    completed: boolean;
    lessons: {
      lessonId: string;
      timeSpent: number;
      completed: boolean;
      resources: {
        resourceId: string;
        completed: boolean;
      }[];
    }[];
  }[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: {
    url: string;
    publicId: string;
  };
  category: string;
  difficulty: string;
  instructor: {
    id: string;
    username: string;
  };
  resources: Resource[];
  modules: Module[];
  estimatedTotalTime: number;
  learningPath: {
    moduleId: string;
    requiredModules: string[];
  }[];
  progress?: {
    moduleId: string;
    lessonId: string;
    completed: boolean;
    timeSpent: number;
    quizScore?: number;
  }[];
}

export default function CourseView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentStatus | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [timeSpentInput, setTimeSpentInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [completedResources, setCompletedResources] = useState<
    Record<string, boolean>
  >({});
  const [resourceTimeInput, setResourceTimeInput] = useState<string>("");
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [completingResourceId, setCompletingResourceId] = useState<
    string | null
  >(null);
  const [isCompletingCourse, setIsCompletingCourse] = useState(false);
  const { toast } = useToast();
  const { getToken, user } = useAuth();
  const [apiState, setApiState] = useState<"unknown" | "ok" | "error">(
    "unknown"
  );
  const [apiErrorDetails, setApiErrorDetails] = useState<string | null>(null);

  // Fetch course data
  const fetchCourse = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(`http://localhost:5000/api/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch course: ${response.statusText}`);
      }

      const data = await response.json();
      setCourse(data);

      // If user is logged in, fetch enrollment status
      if (user) {
        const enrollmentResponse = await fetch(
          `http://localhost:5000/api/enrollments/status/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (enrollmentResponse.ok) {
          const enrollmentData = await enrollmentResponse.json();
          setEnrollment(enrollmentData);
        }
      }

      setApiState("ok");
    } catch (error) {
      console.error('Error fetching course:', error);
      setApiState("error");
      setApiErrorDetails(error instanceof Error ? error.message : 'Failed to fetch course');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch course data on mount
  useEffect(() => {
    fetchCourse();
  }, [id]);

  // Helper function to debug API connectivity
  const debugApiConnection = async () => {
    try {

      const testResponse = await fetch("http://localhost:5000/api/courses", {
        method: "GET",
      });

      if (testResponse.ok) {
        // Try to parse as JSON to verify it's returning properly formatted data
        try {
          const data = await testResponse.clone().json();
          setApiState("ok");
        } catch (e) {
          console.error("API is returning non-JSON data:", e);
          const text = await testResponse.text();
          console.log(
            "Response text (first 200 chars):",
            text.substring(0, 200)
          );

          // If it looks like HTML with a doctype, it might be hitting a web server instead of the API
          if (text.trim().toLowerCase().startsWith("<!doctype")) {
            console.error(
              "API is returning HTML instead of JSON - you might be hitting a web server"
            );
            setApiState("error");
            setApiErrorDetails(
              "The API is returning HTML instead of JSON. Check if your API server is running."
            );
            toast({
              title: "API Configuration Error",
              description:
                "The API appears to be returning HTML instead of JSON. This usually means the API server is not running or is misconfigured.",
              variant: "destructive",
            });
          }
        }
      } else {
        setApiState("error");
        const contentType = testResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await testResponse.json();
          console.log("Error data:", errorData);
          setApiErrorDetails(`API error: ${JSON.stringify(errorData)}`);
        } else {
          const text = await testResponse.text();
          console.log(
            "Response text (first 200 chars):",
            text.substring(0, 200)
          );
          setApiErrorDetails(
            `Non-JSON response with status ${testResponse.status}`
          );
        }
      }
    } catch (error) {
      console.error("Debug API connection error:", error);
      setApiState("error");

      // Network errors usually mean the server is completely unreachable
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.error("Network error - server might be down or unreachable");
        setApiErrorDetails(
          "Network error: The API server appears to be down or unreachable"
        );
        toast({
          title: "Server Unreachable",
          description:
            "Cannot connect to the API server. Please check if the server is running and your network connection is stable.",
          variant: "destructive",
        });
        setLoading(false);
      } else {
        setApiErrorDetails(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  };

  useEffect(() => {
    // Run API debug on component mount
    debugApiConnection();

    const fetchCourseAndEnrollment = async () => {
      try {
        const token = getToken();
        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please log in to view this course",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Try to fetch the course data
        try {
          const courseRes = await fetch(
            `http://localhost:5000/api/courses/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!courseRes.ok) {
            const contentType = courseRes.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const errorData = await courseRes.json();
              throw new Error(
                `Failed to fetch course: ${
                  errorData.message || courseRes.statusText
                }`
              );
            } else {
              // Handle non-JSON responses (like HTML error pages)
              const text = await courseRes.text();
              console.error(
                "Server returned non-JSON response:",
                text.substring(0, 100) + "..."
              );
              throw new Error(
                `Server error: Received HTML instead of JSON. Status: ${courseRes.status}`
              );
            }
          }

          // Process course data
          const courseData = await courseRes.json();
          setCourse(courseData);

          // Now fetch enrollment data
          const enrollmentRes = await fetch(
            `http://localhost:5000/api/enrollments/${id}/status`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (enrollmentRes.ok) {
            const enrollmentData = await enrollmentRes.json();
            setEnrollment(enrollmentData);
          }
        } catch (error) {
          throw error; // Re-throw to be caught by the outer try/catch
        }
      } catch (error) {
        console.error("Error loading course:", error);

        // Provide more helpful error messages based on the error type
        let errorMessage = "Failed to load course. Please try again later.";
        if (error instanceof SyntaxError) {
          errorMessage =
            "Server returned invalid data. This might be a server configuration issue.";
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast({
          title: "Error Loading Course",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndEnrollment();
  }, [id]);

  useEffect(() => {
    if (course && enrollment) {
      // Find the first incomplete module
      const firstIncompleteModule = course.modules.find((module) => {
        const moduleProgress = enrollment.modules.find(
          (m) => m.moduleId === module.id
        );
        return !moduleProgress || !moduleProgress.completed;
      });

      if (firstIncompleteModule) {
        setActiveModule(firstIncompleteModule.id);

        // Find the first incomplete lesson in this module
        const firstIncompleteLesson = firstIncompleteModule.lessons.find(
          (lesson) => {
            const moduleProgress = enrollment.modules.find(
              (m) => m.moduleId === firstIncompleteModule.id
            );
            if (!moduleProgress) return true;

            const lessonProgress = moduleProgress.lessons.find(
              (l) => l.lessonId === lesson.id
            );
            return !lessonProgress || !lessonProgress.completed;
          }
        );

        if (firstIncompleteLesson) {
          setActiveLesson(firstIncompleteLesson.id);
        } else if (firstIncompleteModule.lessons.length > 0) {
          setActiveLesson(firstIncompleteModule.lessons[0].id);
        }
      } else if (course.modules.length > 0) {
        setActiveModule(course.modules[0].id);
        if (course.modules[0].lessons.length > 0) {
          setActiveLesson(course.modules[0].lessons[0].id);
        }
      }

      // Initialize completed resources state
      const completedResourcesMap: Record<string, boolean> = {};

      // Track module/lesson resources
      enrollment.modules.forEach((module) => {
        module.lessons.forEach((lesson) => {
          if (lesson.resources && lesson.resources.length > 0) {
            lesson.resources.forEach((resource) => {
              if (resource.completed) {
                completedResourcesMap[resource.resourceId.toString()] = true;
              }
            });
          }
        });
      });
      
      // Track course-level resources (if they exist)
      if (enrollment.completedResources && enrollment.completedResources.length > 0) {
        enrollment.completedResources.forEach((resource) => {
          completedResourcesMap[resource.resourceId.toString()] = true;
        });
      }
      setCompletedResources(completedResourcesMap);
    }
  }, [course, enrollment]);

  const handleEnroll = async () => {
    try {
      setIsEnrolling(true);
      const token = getToken();
      const response = await fetch(
        `http://localhost:5000/api/enrollments/${id}/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to enroll");
      }

      const enrollmentData = await response.json();
      setEnrollment(enrollmentData);
      toast({
        title: "Enrolled Successfully",
        description: "You are now enrolled in this course",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to enroll in the course",
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const updateProgress = async (
    moduleId: string,
    lessonId: string,
    timeSpent: number,
    completed: boolean
  ) => {
    try {
      const token = getToken();
      const response = await fetch(
        `http://localhost:5000/api/enrollments/${id}/progress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            moduleId,
            lessonId,
            timeSpent,
            completed,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update progress");
      }

      const updatedEnrollment = await response.json();
      setEnrollment(updatedEnrollment);

      if (completed) {
        toast({
          title: "Progress Updated",
          description: "Lesson marked as completed",
        });
      } else {
        toast({
          title: "Time Logged",
          description: `Added ${timeSpent} minutes to your progress`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update progress",
        variant: "destructive",
      });
    }
  };

  const handleLessonClick = (moduleId: string, lessonId: string) => {
    setActiveModule(moduleId);
    setActiveLesson(lessonId);
  };

  const getResourceIcon = (type: Resource["type"]) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "word":
      case "excel":
      case "bibtex":
        return <File className="h-4 w-4" />;
      case "link":
        return <LinkIcon className="h-4 w-4" />;
      case "video":
        return <PlayCircle className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getResourceUrl = (resource: Resource) => {
    // For external resources (links), use the direct URL
    if (resource.type === "link") {
      return resource.url;
    }

    // For uploaded resources, use the provider's URL
    if (resource.url) {
      return resource.url;
    }

    console.error("Resource missing URL:", resource);
    return "";
  };

  const getCurrentModule = () => {
    if (!course || !activeModule) return null;
    return course.modules.find((m) => m.id === activeModule);
  };

  const getCurrentLesson = () => {
    const module = getCurrentModule();
    if (!module || !activeLesson) return null;
    return module.lessons.find((l) => l.id === activeLesson);
  };

  const getLessonProgress = (moduleId: string, lessonId: string) => {
    if (!course?.progress) return null;
    return course.progress.find(
      (p) => p.moduleId === moduleId && p.lessonId === lessonId
    );
  };

  // Check if all course content is completed
  const isAllContentCompleted = () => {
    if (!enrollment || !course) return false;
    
    // Check if all modules are completed
    const allModulesCompleted = enrollment.modules.every(module => module.completed);
    
    // Check if all lessons in all modules are completed
    const allLessonsCompleted = enrollment.modules.every(module => 
      module.lessons.every(lesson => lesson.completed)
    );
    
    // Check if all resources in all lessons are completed
    const allLessonResourcesCompleted = enrollment.modules.every(module => 
      module.lessons.every(lesson => 
        lesson.resources.every(resource => resource.completed)
      )
    );
    
    // Check if all course-level resources are completed
    const totalCourseResources = course.resources ? course.resources.length : 0;
    const completedCourseResources = enrollment.completedResources ? enrollment.completedResources.length : 0;
    const allCourseResourcesCompleted = totalCourseResources > 0 ? 
      completedCourseResources === totalCourseResources : true;
    
    return allModulesCompleted && allLessonsCompleted && 
           allLessonResourcesCompleted && allCourseResourcesCompleted;
  };

  const handleCompleteEntireCourse = async () => {
    try {
      // Double-check that all content is completed
      if (!isAllContentCompleted()) {
        toast({
          title: "Cannot Complete Course",
          description: "You must complete all modules, lessons, and resources before marking the course as completed.",
          variant: "destructive",
        });
        return;
      }
      
      setIsCompletingCourse(true);
      const token = getToken();
      const response = await fetch(
        `http://localhost:5000/api/enrollments/${id}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to complete course");
      }

      const updatedEnrollment = await response.json();
      setEnrollment(updatedEnrollment);
      toast({
        title: "Course Completed",
        description: "Congratulations! You have completed this course.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to complete course",
        variant: "destructive",
      });
    } finally {
      setIsCompletingCourse(false);
    }
  };

  const handleResourceClick = (resource: Resource) => {
    if (resource.type === "link") {
      window.open(resource.url, "_blank");
    } else if (resource.type === "video") {
      window.open(resource.url, "_blank");
    } else {
      setSelectedResource(resource);
    }
  };

  const handleMarkResourceComplete = (
    resource: Resource,
    moduleId?: string,
    lessonId?: string
  ) => {
    console.log("handleMarkResourceComplete called with:", {
      resourceId: resource.id,
      resourceTitle: resource.title,
      providedModuleId: moduleId,
      providedLessonId: lessonId,
    });

    // Store the resource info and any provided module/lesson IDs
    const enhancedResource = {
      ...resource,
      moduleId,  // This might be undefined for course-level resources
      lessonId   // This might be undefined for course-level resources
    };

    setCurrentResource(enhancedResource);
    setShowTimeInput(true);
  };

  const handleSubmitResourceCompletion = async () => {
    console.log(
      "handleSubmitResourceCompletion called with resource:",
      currentResource
    );

    if (!currentResource || !currentResource.id) {
      console.error("Missing resource data for completion", {
        currentResource,
      });
      toast({
        title: "Error",
        description:
          "Unable to mark resource as complete. Missing resource data.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if the resource is already completed
    if (completedResources[currentResource.id]) {
      toast({
        title: "Already Completed",
        description: "This resource has already been marked as complete.",
      });
      setShowTimeInput(false);
      return;
    }

    // Get moduleId and lessonId if they exist
    // For course-level resources, these might be undefined
    const moduleId = currentResource.moduleId;
    const lessonId = currentResource.lessonId;

    try {
      setCompletingResourceId(currentResource.id);
      const token = getToken();
      if (!token) {
        console.error("No authentication token found");
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }

      // Parse the time input as a number
      const timeSpent = parseInt(resourceTimeInput) || 0;

      if (timeSpent <= 0) {
        toast({
          title: "Invalid Time",
          description: "Please enter a valid time (greater than 0 minutes).",
          variant: "destructive",
        });
        return;
      }

      // Prepare request data - only include moduleId and lessonId if they exist
      const requestData: any = {
        resourceId: currentResource.id,
        timeSpent,
      };
      
      // Only add moduleId and lessonId if they exist
      if (moduleId) requestData.moduleId = moduleId;
      if (lessonId) requestData.lessonId = lessonId;

      // Close the dialog immediately to improve UX
      setShowTimeInput(false);

      // Show immediate feedback
      toast({
        title: "Processing...",
        description: `Marking resource as complete and adding ${timeSpent} minutes to your progress.`,
      });

      // Make the API call
      const apiUrl = `http://localhost:5000/api/enrollments/${id}/resource-complete`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });
      console.log("API response headers:", {
        contentType: response.headers.get("content-type"),
        statusText: response.statusText,
      });

      // Handle response
      if (!response.ok) {
        let errorMessage = `Server error (${response.status})`;

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            console.error("API error response:", errorData);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error("Failed to parse error response as JSON:", e);
          }
        } else {
          const errorText = await response.text();
          console.error("API error response (text):", errorText);
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      // Process successful response
      try {
        const updatedEnrollment = await response.json();
        console.log(
          "Resource completion successful, updated enrollment:",
          updatedEnrollment
        );

        // Update local state
        setEnrollment(updatedEnrollment);

        // Update completed resources
        setCompletedResources((prev) => ({
          ...prev,
          [currentResource.id || ""]: true,
        }));

        // Show success message
        toast({
          title: "Resource Completed",
          description: `Added ${timeSpent} minutes to your course time. Total: ${formatTime(
            updatedEnrollment.totalTimeSpent
          )}`,
        });
      } catch (e) {
        console.error("Error parsing successful response:", e);
        toast({
          title: "Warning",
          description:
            "Resource marked as complete, but there was an issue updating the UI.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in resource completion process:", error);

      // Update UI to show completion locally even if server failed
      if (enrollment && currentResource.id) {
        // Add time locally
        const updatedTotalTime =
          (enrollment.totalTimeSpent || 0) + (parseInt(resourceTimeInput) || 0);

        // Create temporary updated enrollment
        const tempUpdatedEnrollment = {
          ...enrollment,
          totalTimeSpent: updatedTotalTime,
          resourceTimeSpent:
            (enrollment.resourceTimeSpent || 0) +
            (parseInt(resourceTimeInput) || 0),
          resourcesCompleted: (enrollment.resourcesCompleted || 0) + 1,
        };

        // Update local state
        setEnrollment(tempUpdatedEnrollment);
        setCompletedResources((prev) => ({
          ...prev,
          [currentResource.id || ""]: true,
        }));

        toast({
          title: "Local Update Only",
          description:
            error instanceof Error
              ? `Server error: ${error.message}. Changes saved locally only.`
              : "Your time was recorded locally but couldn't be saved to the server.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Operation Failed",
          description:
            error instanceof Error
              ? error.message
              : "Failed to mark resource as complete.",
          variant: "destructive",
        });
      }
    } finally {
      setCompletingResourceId(null);
      setResourceTimeInput("");
      setCurrentResource(null);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (apiState === "error") {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500">
                API Connection Error
              </CardTitle>
              <CardDescription>
                Unable to connect to the API server properly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-red-300 bg-red-50 rounded-md">
                <p className="font-medium">Error Details:</p>
                <p className="text-sm mt-2">
                  {apiErrorDetails || "Unknown error"}
                </p>
              </div>

              <div className="p-4 border rounded-md">
                <p className="font-medium">Troubleshooting steps:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Check if your backend server is running</li>
                  <li>
                    Verify the API base URL in your environment configuration
                  </li>
                  <li>Look for CORS issues in the browser console</li>
                  <li>
                    Check if the server is returning HTML instead of JSON (often
                    means you're hitting a different server)
                  </li>
                </ul>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!course) {
    return (
      <MainLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Course not found</h1>
        </div>
      </MainLayout>
    );
  }

  const renderLessonContent = (lesson: any) => {
    switch (lesson.type) {
      case 'video':
        return (
          <div className="aspect-w-16 aspect-h-9">
            <video
              src={lesson.url}
              controls
              className="w-full rounded-lg"
              onTimeUpdate={(e) => {
                // Handle video progress tracking
                const video = e.target as HTMLVideoElement;
                if (video.currentTime >= video.duration * 0.9) {
                  // Mark as completed when 90% watched
                  // You can call your completion API here
                }
              }}
            />
          </div>
        );
      case 'reading':
        return (
          <div className="min-h-[500px] w-full">
            <iframe
              src={lesson.url}
              className="w-full h-full min-h-[500px] rounded-lg"
              title={lesson.title}
            />
          </div>
        );
      case 'assignment':
        return (
          <div className="prose max-w-none">
            <div className="bg-gray-50 p-4 rounded-lg">
              {lesson.content}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin">
            <Timer className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      ) : course ? (
        <div className="container mx-auto py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Course Content */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Modules Accordion */}
                  <Accordion type="single" collapsible defaultValue={activeModule || undefined}>
                    {course.modules.map((module) => (
                      <AccordionItem key={module.id} value={module.id}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <span>{module.title}</span>
                            {enrollment?.modules.find(m => m.moduleId === module.id)?.completed && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 py-2">
                            {module.lessons.map((lesson) => {
                              const isActive = activeLesson === lesson.id;
                              const moduleProgress = enrollment?.modules.find(m => m.moduleId === module.id);
                              const lessonProgress = moduleProgress?.lessons.find(l => l.lessonId === lesson.id);

                              return (
                                <div
                                  key={lesson.id}
                                  className={`p-4 rounded-lg border ${isActive ? 'bg-gray-50' : ''}`}
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                      <h3 className="font-medium">{lesson.title}</h3>
                                      {isActive && renderLessonContent(lesson)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {lessonProgress?.completed ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setActiveLesson(lesson.id)}
                                        >
                                          Start
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            {/* Course Progress */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Progress</span>
                        <span>{enrollment?.progress || 0}%</span>
                      </div>
                      <Progress value={enrollment?.progress || 0} />
                    </div>
                    {enrollment?.completed ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <Trophy className="h-5 w-5" />
                        <span>Course Completed!</span>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        disabled={!isAllContentCompleted()}
                        onClick={handleCompleteEntireCourse}
                      >
                        {isAllContentCompleted() ? 
                          'Mark Course as Completed' : 
                          'Complete all content to finish course'
                        }
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Course Not Found</h2>
          <p className="text-gray-600">The course you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      )}
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Course Overview */}
          <div className="col-span-12">
            <Card>
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Estimated time: {course.estimatedTotalTime} minutes
                    </span>
                  </div>
                  {/* Show different UI based on user role and enrollment status */}
                  {user && course.instructor.id === user.id ? (
                    <div className="flex items-center">
                      <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        You are the instructor
                      </span>
                    </div>
                  ) : enrollment ? (
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">
                          Progress
                        </span>
                        <Progress
                          value={enrollment.progress}
                          className="w-32 h-2"
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(enrollment.progress)}%
                      </span>
                      {!enrollment.completed && (
                        <Button
                          variant="outline"
                          onClick={handleCompleteEntireCourse}
                          disabled={isCompletingCourse || !isAllContentCompleted()}
                          title={!isAllContentCompleted() ? "Complete all lessons and resources first" : ""}
                        >
                          {isCompletingCourse
                            ? "Completing..."
                            : "Mark Course as Completed"}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button onClick={handleEnroll} disabled={isEnrolling}>
                      {isEnrolling ? "Enrolling..." : "Enroll Now"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Content */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="h-full">
              <Tabs defaultValue="content" className="h-full">
                <TabsList>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="mt-0">
                  {enrollment && getCurrentLesson() && (
                    <div className="mb-4 p-4 border rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Time Spent (minutes)
                          </label>
                          <input
                            type="number"
                            value={timeSpentInput}
                            onChange={(e) => setTimeSpentInput(e.target.value)}
                            className="w-20 px-2 py-1 border rounded-md"
                            min="0"
                          />
                        </div>
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (
                                timeSpentInput &&
                                getCurrentModule() &&
                                getCurrentLesson()
                              ) {
                                updateProgress(
                                  getCurrentModule().id,
                                  getCurrentLesson().id,
                                  parseInt(timeSpentInput),
                                  false
                                );
                                setTimeSpentInput("");
                              }
                            }}
                          >
                            Log Time
                          </Button>
                          <Button
                            onClick={() => {
                              if (getCurrentModule() && getCurrentLesson()) {
                                updateProgress(
                                  getCurrentModule().id,
                                  getCurrentLesson().id,
                                  parseInt(timeSpentInput) || 0,
                                  true
                                );
                                setTimeSpentInput("");
                              }
                            }}
                          >
                            Mark as Completed
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    {getCurrentLesson() ? (
                      <div className="space-y-4 mt-4">
                        <h2 className="text-xl font-semibold">
                          {getCurrentLesson()?.title}
                        </h2>
                        <div className="prose max-w-none">
                          {getCurrentLesson()?.content}
                        </div>
                        {getCurrentLesson()?.resources &&
                          getCurrentLesson()?.resources.length > 0 && (
                            <div className="mt-6">
                              <h3 className="text-lg font-semibold mb-2">
                                Lesson Resources
                              </h3>
                              <div className="space-y-3">
                                {getCurrentLesson()?.resources.map(
                                  (resource) => (
                                    <Card
                                      key={resource.id}
                                      className="hover:bg-accent/10 transition-colors"
                                    >
                                      <CardContent className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                          {getResourceIcon(resource.type)}
                                          <div className="flex-1">
                                            <h4 className="font-medium">
                                              {resource.title}
                                            </h4>
                                            {resource.estimatedTime && (
                                              <p className="text-sm text-muted-foreground">
                                                Est. time:{" "}
                                                {resource.estimatedTime} min
                                              </p>
                                            )}
                                          </div>
                                          {completedResources[
                                            resource.id || ""
                                          ] && (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                          )}
                                        </div>
                                        <div className="flex justify-between gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() =>
                                              handleResourceClick(resource)
                                            }
                                          >
                                            View Resource
                                          </Button>
                                          {enrollment &&
                                            !completedResources[
                                              resource.id || ""
                                            ] && (
                                              <Button
                                                variant="secondary"
                                                size="sm"
                                                className="flex items-center gap-1"
                                                onClick={() =>
                                                  handleMarkResourceComplete(
                                                    resource,
                                                    getCurrentModule().id,
                                                    getCurrentLesson().id
                                                  )
                                                }
                                                disabled={
                                                  completingResourceId ===
                                                  resource.id
                                                }
                                              >
                                                {completingResourceId ===
                                                resource.id ? (
                                                  <span className="flex items-center gap-1">
                                                    <Timer className="h-3.5 w-3.5 animate-spin" />
                                                    Processing...
                                                  </span>
                                                ) : (
                                                  "Mark as Done"
                                                )}
                                              </Button>
                                            )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        Select a lesson to begin
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="resources">
                  <div className="p-4">
                    <h2 className="text-xl font-semibold mb-4">
                      Course Resources
                    </h2>
                    <div className="space-y-3">
                      {course.resources.map((resource) => (
                        <Card
                          key={resource.id}
                          className="hover:bg-accent/10 transition-colors"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                              {getResourceIcon(resource.type)}
                              <div className="flex-1">
                                <h4 className="font-medium">
                                  {resource.title}
                                </h4>
                                {resource.estimatedTime && (
                                  <p className="text-sm text-muted-foreground">
                                    Est. time: {resource.estimatedTime} min
                                  </p>
                                )}
                              </div>
                              {completedResources[resource.id || ""] && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                            <div className="flex justify-between gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleResourceClick(resource)}
                              >
                                View Resource
                              </Button>
                              {enrollment && (
                                completedResources[resource.id || ""] ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center gap-1 text-green-600"
                                    disabled={true}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    Completed
                                  </Button>
                                ) : (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() =>
                                      handleMarkResourceComplete(
                                        resource,
                                        undefined,
                                        undefined
                                      )
                                    }
                                    disabled={
                                      completingResourceId === resource.id
                                    }
                                  >
                                    {completingResourceId === resource.id ? (
                                      <span className="flex items-center gap-1">
                                        <Timer className="h-3.5 w-3.5 animate-spin" />
                                        Processing...
                                      </span>
                                    ) : (
                                      "Mark as Done"
                                    )}
                                  </Button>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
      {/* Resource Viewer Dialog */}
      <Dialog
        open={!!selectedResource}
        onOpenChange={(open) => !open && setSelectedResource(null)}
      >
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedResource?.title}</DialogTitle>
            <DialogDescription>
              {selectedResource?.type.toUpperCase()} Resource
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {selectedResource?.type === "pdf" && (
              <iframe
                src={selectedResource.url}
                className="w-full h-full"
                title={selectedResource.title}
              />
            )}
            {(selectedResource?.type === "word" ||
              selectedResource?.type === "excel" ||
              selectedResource?.type === "bibtex") && (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="mb-4">
                  This file type cannot be previewed directly.
                </p>
                <Button asChild>
                  <a
                    href={selectedResource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    Download File
                  </a>
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button asChild variant="outline">
              <a
                href={selectedResource?.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in New Tab <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time input dialog */}
      <Dialog
        open={showTimeInput}
        onOpenChange={(open) => {
          if (!open) {
            setShowTimeInput(false);
            setResourceTimeInput("");
            if (currentResource) {
              setCurrentResource(null);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              
              // Validate time input
              const timeValue = parseInt(resourceTimeInput) || 0;
              if (timeValue <= 0) {
                toast({
                  title: "Invalid Time",
                  description: "Please enter a time greater than 0 minutes.",
                  variant: "destructive",
                });
                return;
              }
              
              // All validation passed, proceed with submission
              handleSubmitResourceCompletion();
            }}
          >
            <DialogHeader>
              <DialogTitle>
                How long did you spend on this resource?
              </DialogTitle>
              <DialogDescription>
                Enter the time in minutes you spent reading or using this
                resource. This will be added to your course completion time.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="timeSpent">Time spent (minutes)</Label>
                <Input
                  id="timeSpent"
                  type="number"
                  min="1"
                  placeholder="Enter time in minutes"
                  value={resourceTimeInput}
                  onChange={(e) => setResourceTimeInput(e.target.value)}
                  onKeyPress={(e) => {
                    // Allow submission with Enter key
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (parseInt(resourceTimeInput) > 0) {
                        handleSubmitResourceCompletion();
                      }
                    }
                  }}
                  autoFocus
                  required
                />
                {currentResource && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Marking: {currentResource.title}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowTimeInput(false);
                  setResourceTimeInput("");
                  setCurrentResource(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!resourceTimeInput || parseInt(resourceTimeInput) <= 0}
              >
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
