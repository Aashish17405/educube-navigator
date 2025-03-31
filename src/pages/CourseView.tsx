import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Resource {
  title: string;
  type: 'pdf' | 'word' | 'excel' | 'bibtex' | 'link' | 'video';
  url: string;
  estimatedTime?: number;
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
  type: 'video' | 'quiz' | 'reading' | 'assignment';
  content: string;
  resources: Resource[];
  quiz?: Quiz;
  estimatedTime?: number;
  completionCriteria: 'view' | 'quiz' | 'time';
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

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: {
    url: string;
    publicId: string;
  };
  category: string;
  difficulty: string;
  instructor: {
    _id: string;
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
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const { toast } = useToast();
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`http://localhost:5000/api/courses/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch course');

        const data = await response.json();
        setCourse(data);
        
        // Set initial active module and lesson
        if (data.modules.length > 0) {
          setActiveModule(data.modules[0].id);
          if (data.modules[0].lessons.length > 0) {
            setActiveLesson(data.modules[0].lessons[0].id);
          }
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load course",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const updateProgress = async (moduleId: string, lessonId: string, progress: any) => {
    try {
      const token = getToken();
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`http://localhost:5000/api/courses/${id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          moduleId,
          lessonId,
          progress
        })
      });

      if (!response.ok) throw new Error('Failed to update progress');

      // Refresh course data to get updated progress
      const courseResponse = await fetch(`http://localhost:5000/api/courses/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!courseResponse.ok) throw new Error('Failed to fetch updated course data');

      const updatedCourse = await courseResponse.json();
      setCourse(updatedCourse);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    }
  };

  const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'word':
      case 'excel':
      case 'bibtex':
        return <File className="h-4 w-4" />;
      case 'link':
        return <LinkIcon className="h-4 w-4" />;
      case 'video':
        return <PlayCircle className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getCurrentModule = () => {
    if (!course || !activeModule) return null;
    return course.modules.find(m => m.id === activeModule);
  };

  const getCurrentLesson = () => {
    const module = getCurrentModule();
    if (!module || !activeLesson) return null;
    return module.lessons.find(l => l.id === activeLesson);
  };

  const getLessonProgress = (moduleId: string, lessonId: string) => {
    if (!course?.progress) return null;
    return course.progress.find(
      p => p.moduleId === moduleId && p.lessonId === lessonId
    );
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
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Estimated time: {course.estimatedTotalTime} minutes</span>
                  </div>
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

                <TabsContent value="content" className="h-full">
                  <div className="p-4">
                    {getCurrentLesson() ? (
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold">{getCurrentLesson()?.title}</h2>
                        <div className="prose max-w-none">
                          {getCurrentLesson()?.content}
                        </div>
                        {getCurrentLesson()?.resources && getCurrentLesson()?.resources.length > 0 && (
                          <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2">Lesson Resources</h3>
                            <div className="space-y-2">
                              {getCurrentLesson()?.resources.map((resource, index) => (
                                <a
                                  key={index}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                                >
                                  {getResourceIcon(resource.type)}
                                  <span>{resource.title}</span>
                                  {resource.estimatedTime && (
                                    <span className="text-sm text-muted-foreground">
                                      ({resource.estimatedTime} min)
                                    </span>
                                  )}
                                </a>
                              ))}
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
                    <h2 className="text-xl font-semibold mb-4">Course Resources</h2>
                    <div className="space-y-2">
                      {course.resources.map((resource, index) => (
                        <a
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 hover:bg-accent rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            {getResourceIcon(resource.type)}
                            <span>{resource.title}</span>
                          </div>
                          {resource.estimatedTime && (
                            <span className="text-sm text-muted-foreground">
                              {resource.estimatedTime} min
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Course Navigation */}
          <div className="col-span-12 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {course.modules.map((module) => (
                      <div key={module.id} className="space-y-2">
                        <div
                          className="font-medium cursor-pointer"
                          onClick={() => setActiveModule(module.id)}
                        >
                          {module.title}
                        </div>
                        {activeModule === module.id && (
                          <div className="pl-4 space-y-1">
                            {module.lessons.map((lesson) => {
                              const progress = getLessonProgress(module.id, lesson.id);
                              return (
                                <div
                                  key={lesson.id}
                                  className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${
                                    activeLesson === lesson.id
                                      ? 'bg-accent'
                                      : 'hover:bg-accent/50'
                                  }`}
                                  onClick={() => setActiveLesson(lesson.id)}
                                >
                                  {progress?.completed ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="text-sm">{lesson.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
