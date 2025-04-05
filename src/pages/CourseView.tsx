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
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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
import { courseService, enrollmentService, API_URL } from "@/services/api";

interface Resource {
  _id: string; // MongoDB's _id
  id?: string; // Optional id for backward compatibility
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
  _id: string;
  id?: string;
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
  _id: string;
  id?: string;
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
  const [pdfLoading, setPdfLoading] = useState(true);
  const [resourcePdfLoading, setResourcePdfLoading] = useState(true);

  // Fetch course data
  const fetchCourse = async () => {
    try {
      setLoading(true);

      // Use the getCourseById function to fetch course data
      const courseData = await courseService.getCourseById(id!);
      setCourse(courseData);

      // If user is logged in, fetch enrollment status using enrollmentService
      if (user) {
        try {
          const enrollmentData = await enrollmentService.getEnrollmentStatus(
            id!
          );
          setEnrollment(enrollmentData);
        } catch (error) {
          console.log("User not enrolled in this course yet");
        }
      }

      setApiState("ok");
    } catch (error) {
      console.error("Error fetching course:", error);
      setApiState("error");
      setApiErrorDetails(
        error instanceof Error ? error.message : "Failed to fetch course"
      );
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch course data on mount and initialize state
  useEffect(() => {
    const initializeCourse = async () => {
      await fetchCourse();

      // Set initial active module and lesson
      if (course && course.modules.length > 0) {
        const firstModule = course.modules[0];
        setActiveModule(firstModule.id);

        if (firstModule.lessons.length > 0) {
          setActiveLesson(firstModule.lessons[0].id);
        }
      }
    };

    initializeCourse();
  }, [id]);

  // Handle module selection
  const handleModuleSelect = (moduleId: string) => {
    setActiveModule(moduleId);

    // Set first lesson of module as active
    const selectedModule = course?.modules.find((m) => m.id === moduleId);
    if (selectedModule && selectedModule.lessons.length > 0) {
      setActiveLesson(selectedModule.lessons[0].id);
    }
  };

  // Helper function to debug API connectivity
  const debugApiConnection = async () => {
    try {
      const testResponse = await fetch(`${API_URL}/courses`, {
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
            setApiErrorDetails("The API is returning HTML instead of JSON.");
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
          description: "Cannot connect to the API server.",
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
          const courseRes = await fetch(`${API_URL}/courses/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

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
              console.log(text);
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
          console.log("Course Data:", courseData);

          // Set active module to first module if none is selected
          if (!activeModule && courseData.modules.length > 0) {
            setActiveModule(courseData.modules[0].id);

            // Set active lesson to first lesson if none is selected
            if (courseData.modules[0].lessons.length > 0) {
              setActiveLesson(courseData.modules[0].lessons[0].id);
            }
          }

          setCourse(courseData);

          // Now fetch enrollment data
          const enrollmentRes = await fetch(
            `${API_URL}/enrollments/status/${id}`,
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
      if (
        enrollment.completedResources &&
        enrollment.completedResources.length > 0
      ) {
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

      // Use the enrollmentService to enroll in course
      const enrollmentData = await enrollmentService.enrollInCourse(id!);
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
      console.log(
        `Updating progress with moduleId=${moduleId}, lessonId=${lessonId}, completed=${completed}`
      );

      const progressData = {
        moduleId,
        lessonId,
        timeSpent,
        completed,
      };

      const updatedEnrollment = await enrollmentService.updateProgress(
        id,
        progressData
      );
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
      console.error("Error updating progress:", error);
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

  // Add this function to mark a lesson as completed
  const handleMarkLessonCompleted = async (
    moduleId: string,
    lessonId: string
  ) => {
    try {
      console.log("Marking lesson as completed:", { moduleId, lessonId });

      // Show immediate feedback
      toast({
        title: "Processing...",
        description: "Marking lesson as complete...",
      });

      const progressData = {
        moduleId,
        lessonId,
        timeSpent: 0,
        completed: true,
      };

      console.log("API request payload:", progressData);

      // Use enrollmentService to update progress
      const updatedEnrollment = await enrollmentService.updateProgress(
        id,
        progressData
      );

      console.log(
        "Lesson completion successful, updated enrollment:",
        updatedEnrollment
      );

      setEnrollment(updatedEnrollment);

      toast({
        title: "Lesson Completed",
        description: "You have successfully completed this lesson.",
      });
    } catch (error) {
      console.error("Error in lesson completion process:", error);
      toast({
        title: "Operation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to mark lesson as complete.",
        variant: "destructive",
      });
    }
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

  const isAllContentCompleted = () => {
    if (!enrollment || !course) return false;

    const allModulesCompleted = enrollment.modules.every(
      (module) => module.completed
    );

    const allLessonsCompleted = enrollment.modules.every((module) =>
      module.lessons.every((lesson) => lesson.completed)
    );

    const allLessonResourcesCompleted = enrollment.modules.every((module) =>
      module.lessons.every((lesson) =>
        lesson.resources.every((resource) => resource.completed)
      )
    );

    const totalCourseResources = course.resources ? course.resources.length : 0;
    const completedCourseResources = enrollment.completedResources
      ? enrollment.completedResources.length
      : 0;
    const allCourseResourcesCompleted =
      totalCourseResources > 0
        ? completedCourseResources === totalCourseResources
        : true;

    return (
      allModulesCompleted &&
      allLessonsCompleted &&
      allLessonResourcesCompleted &&
      allCourseResourcesCompleted
    );
  };

  const handleCompleteEntireCourse = async () => {
    try {
      // Double-check that all content is completed
      if (!isAllContentCompleted()) {
        toast({
          title: "Cannot Complete Course",
          description:
            "You must complete all modules, lessons, and resources before marking the course as completed.",
          variant: "destructive",
        });
        return;
      }

      setIsCompletingCourse(true);
      const token = getToken();
      const response = await fetch(
        `https://educube-navigator.onrender.com/api/enrollments/${id}/complete`,
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
      moduleId, // This might be undefined for course-level resources
      lessonId, // This might be undefined for course-level resources
    };

    setCurrentResource(enhancedResource);
    setShowTimeInput(true);
  };

  const handleSubmitResourceCompletion = async () => {
    if (!resourceTimeInput || !currentResource) {
      return;
    }

    try {
      setCompletingResourceId(currentResource._id);

      const timeSpent = parseInt(resourceTimeInput);
      const resourceId = currentResource._id || currentResource.id;

      if (!resourceId) {
        throw new Error("Missing resource data");
      }

      // Get module and lesson info if available from active state
      const resourceData = {
        resourceId,
        timeSpent: timeSpent,
        moduleId: activeModule,
        lessonId: activeLesson,
      };

      // Call the API to mark the resource as completed
      const updatedEnrollment = await enrollmentService.completeResource(
        id,
        resourceData
      );

      // Update UI state
      setCompletedResources((prev) => ({
        ...prev,
        [resourceId]: true,
      }));

      setResourceTimeInput("");
      setShowTimeInput(false);
      setCurrentResource(null);

      // Show success message
      toast({
        title: "Resource Completed",
        description: `You've completed this resource and logged ${timeSpent} minutes.`,
      });
    } catch (error) {
      console.error("Error completing resource:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to mark resource as completed",
        variant: "destructive",
      });
    } finally {
      setCompletingResourceId(null);
    }
  };

  const renderLessonContent = (lesson: any) => {
    console.log("Rendering lesson content:", lesson);

    if (!lesson) return null;

    // Helper function to find the URL from various possible properties
    const findUrl = (obj: any): string | null => {
      // Check all possible property names that might contain a URL
      const possibleUrlProps = [
        "url",
        "contentUrl",
        "videoUrl",
        "fileUrl",
        "src",
        "resourceUrl",
        "link",
      ];

      for (const prop of possibleUrlProps) {
        if (obj[prop] && typeof obj[prop] === "string") {
          console.log(`Found URL in property: ${prop}`, obj[prop]);
          return obj[prop];
        }
      }

      if (
        obj.content &&
        typeof obj.content === "string" &&
        (obj.content.startsWith("http://") ||
          obj.content.startsWith("https://"))
      ) {
        return obj.content;
      }

      if (
        obj.resources &&
        Array.isArray(obj.resources) &&
        obj.resources.length > 0
      ) {
        const resource = obj.resources[0];
        if (resource.url) return resource.url;
      }

      return null;
    };

    const lessonUrl = findUrl(lesson);
    console.log("Found lesson URL:", lessonUrl);

    switch (lesson.type) {
      case "video":
        if (!lessonUrl) {
          console.error("Missing URL for video lesson:", lesson);
          return (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-red-500">Video URL is missing. Debug info:</p>
              <pre className="mt-2 text-xs overflow-auto max-h-32 bg-gray-100 p-2 rounded">
                {JSON.stringify(lesson, null, 2)}
              </pre>
            </div>
          );
        }
        return (
          <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
            <video
              src={lessonUrl}
              controls
              className="w-full h-full rounded-lg"
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

      case "reading":
        if (!lessonUrl) {
          console.error("Missing URL for reading lesson:", lesson);
          return (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-red-500">
                Reading URL is missing. Debug info:
              </p>
              <pre className="mt-2 text-xs overflow-auto max-h-32 bg-gray-100 p-2 rounded">
                {JSON.stringify(lesson, null, 2)}
              </pre>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(lessonUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
            <div className="min-h-[400px] w-full bg-gray-100 rounded-lg overflow-hidden relative">
              {pdfLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                </div>
              )}
              <iframe
                src={
                  "https://docs.google.com/gview?embedded=true&url=" +
                  encodeURIComponent(lessonUrl)
                }
                className="w-full h-full min-h-[400px] rounded-lg"
                title={lesson.title}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                onLoad={() => setPdfLoading(false)}
              />
            </div>
          </div>
        );

      case "assignment":
        if (!lesson.content) {
          console.error("Missing content for assignment lesson:", lesson);
          return (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <p className="text-red-500">
                Assignment content is missing. Debug info:
              </p>
              <pre className="mt-2 text-xs overflow-auto max-h-32 bg-gray-100 p-2 rounded">
                {JSON.stringify(lesson, null, 2)}
              </pre>
            </div>
          );
        }
        return (
          <div className="prose max-w-none">
            <div className="bg-gray-50 p-4 rounded-lg">{lesson.content}</div>
          </div>
        );

      default:
        console.warn("Unknown lesson type:", lesson.type);
        // If we have a URL but no specific handler, show a generic viewer
        if (lessonUrl) {
          return (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Lesson Content</h3>
                <p className="text-sm text-gray-500 mb-4">
                  This content can be viewed externally or in the frame below.
                </p>
                <a
                  href={lessonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Open in New Tab
                </a>
              </div>

              <div className="min-h-[400px] w-full bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  src={lessonUrl}
                  className="w-full h-full min-h-[400px] rounded-lg"
                  title={lesson.title || "Lesson Content"}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            </div>
          );
        }

        // If we have content but no URL, show the content
        if (lesson.content) {
          return (
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-4 rounded-lg">{lesson.content}</div>
            </div>
          );
        }

        // Last resort - show the lesson data for debugging
        return (
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Unknown Lesson Format</h3>
            <p className="text-red-500 mb-2">
              Could not determine how to display this lesson. Debug info:
            </p>
            <pre className="mt-2 text-xs overflow-auto max-h-32 bg-gray-100 p-2 rounded">
              {JSON.stringify(lesson, null, 2)}
            </pre>
          </div>
        );
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

  if (!course) {
    return (
      <MainLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Course not found</h1>
        </div>
      </MainLayout>
    );
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Content */}
            <div className="md:col-span-2 space-y-2">
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
                          <span>{enrollment?.progress.toFixed(2) || 0}%</span>
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
                          {isAllContentCompleted()
                            ? "Mark Course as Completed"
                            : "Complete all content to finish course"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Course Content</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Course Info */}
                  <div className="mb-6 bg-gray-50 rounded-lg">
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
                              Estimated time: {course.estimatedTotalTime}{" "}
                              minutes
                            </span>
                          </div>
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
                              {
                                !enrollment.completed && null
                                // <Button
                                //   variant="outline"
                                //   onClick={handleCompleteEntireCourse}
                                //   disabled={
                                //     isCompletingCourse ||
                                //     !isAllContentCompleted()
                                //   }
                                //   title={
                                //     !isAllContentCompleted()
                                //       ? "Complete all lessons and resources first"
                                //       : ""
                                //   }
                                // >
                                //   {isCompletingCourse
                                //     ? "Completing..."
                                //     : "Mark Course as Completed"}
                                // </Button>
                              }
                            </div>
                          ) : user && user.role === "learner" ? (
                            <Button
                              onClick={handleEnroll}
                              disabled={isEnrolling}
                            >
                              {isEnrolling ? "Enrolling..." : "Enroll Now"}
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Modules List */}
                  <div className="space-y-6">
                    {course.modules.map((module) => (
                      <div
                        key={module.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <div
                          className={`p-4 cursor-pointer flex items-center justify-between ${
                            activeModule === module.id
                              ? "bg-blue-50"
                              : "bg-gray-50"
                          }`}
                          onClick={() => handleModuleSelect(module.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{module.title}</span>
                            {enrollment?.modules.find(
                              (m) => m.moduleId === module.id
                            )?.completed && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>

                        {/* Lessons List */}
                        {activeModule === module.id && (
                          <div className="divide-y">
                            {module.lessons.map((lesson) => {
                              const isActive = activeLesson === lesson._id;
                              const moduleProgress = enrollment?.modules.find(
                                (m) => m.moduleId === module._id
                              );
                              const lessonProgress =
                                moduleProgress?.lessons.find(
                                  (l) => l.lessonId === lesson._id
                                );

                              return (
                                <div
                                  key={lesson._id}
                                  className={`p-4 ${
                                    isActive ? "bg-blue-50" : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <h3 className="font-medium mb-1">
                                        {lesson.title}
                                      </h3>
                                      <p className="text-sm text-gray-500">
                                        {lesson.type}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {lessonProgress?.completed ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                      ) : (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setActiveLesson(lesson._id)
                                            }
                                          >
                                            {isActive ? "In Progress" : "Start"}
                                          </Button>
                                          {isActive && (
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              onClick={() =>
                                                handleMarkLessonCompleted(
                                                  module._id,
                                                  lesson._id
                                                )
                                              }
                                            >
                                              Mark as Completed
                                            </Button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  {isActive && (
                                    <div className="mt-4">
                                      {renderLessonContent(lesson)}
                                      {!lessonProgress?.completed && (
                                        <div className="mt-4 flex justify-end">
                                          <Button
                                            onClick={() =>
                                              handleMarkLessonCompleted(
                                                module._id,
                                                lesson._id
                                              )
                                            }
                                          >
                                            Mark Lesson as Completed
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Course Not Found</h2>
          <p className="text-gray-600">
            The course you're looking for doesn't exist or you don't have access
            to it.
          </p>
        </div>
      )}
      <div className="container mx-auto ">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-12">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Course Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4">
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
                              <h4 className="font-medium">{resource.title}</h4>
                              {resource.estimatedTime && (
                                <p className="text-sm text-muted-foreground">
                                  Est. time: {resource.estimatedTime} min
                                </p>
                              )}
                            </div>
                            {completedResources[resource._id] && (
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
                            {enrollment &&
                              (completedResources[resource._id] ? (
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
                                    completingResourceId === resource._id
                                  }
                                >
                                  {completingResourceId === resource._id ? (
                                    <span className="flex items-center gap-1">
                                      <Timer className="h-3.5 w-3.5 animate-spin" />
                                      Processing...
                                    </span>
                                  ) : (
                                    "Mark as Done"
                                  )}
                                </Button>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
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
              <div className="h-full flex flex-col">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedResource.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden">
                  {selectedResource.url.endsWith(".pdf") ? (
                    <div className="relative w-full h-full">
                      {resourcePdfLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                        </div>
                      )}
                      <iframe
                        src={`${selectedResource.url}#toolbar=0&navpanes=0`}
                        className="w-full h-full border-0"
                        title={selectedResource.title}
                        onLoad={() => setResourcePdfLoading(false)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-4">
                        <p className="mb-4 text-gray-600">
                          Preview not available
                        </p>
                        <Button
                          onClick={() =>
                            window.open(selectedResource.url, "_blank")
                          }
                        >
                          Open Document
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {(selectedResource?.type === "word" ||
              selectedResource?.type === "excel" ||
              selectedResource?.type === "bibtex") && (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="mb-4 text-gray-600">
                  This file type cannot be previewed directly.
                </p>
                <div className="space-x-4">
                  <Button
                    onClick={() => window.open(selectedResource.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button asChild variant="outline">
                    <a
                      href={selectedResource.url}
                      download
                      onClick={(e) => e.stopPropagation()}
                    >
                      Download File
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setSelectedResource(null)}>
              Close
            </Button>
            {selectedResource?.type === "pdf" && (
              <Button asChild>
                <a
                  href={selectedResource.url}
                  download
                  onClick={(e) => e.stopPropagation()}
                >
                  Download PDF
                </a>
              </Button>
            )}
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
                    if (e.key === "Enter") {
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
                disabled={
                  !resourceTimeInput || parseInt(resourceTimeInput) <= 0
                }
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
