
import { useParams } from "react-router-dom";
import { useCoursesStore } from "@/store/coursesStore";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, FileText, Video } from "lucide-react";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { getCourse } = useCoursesStore();
  const course = getCourse(id || "");

  if (!course) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <p className="text-muted-foreground mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <a href="/courses">Back to Courses</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
            <p className="text-muted-foreground">{course.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{course.difficulty}</Badge>
            <Badge variant="secondary" className="capitalize">{course.category}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{course.progress}%</div>
              <Progress value={course.progress} className="h-2 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{course.enrolled}</div>
              <p className="text-xs text-muted-foreground mt-1">Enrolled students</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{course.resources.videos}</div>
              <p className="text-xs text-muted-foreground mt-1">Video lessons</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{course.resources.documents}</div>
              <p className="text-xs text-muted-foreground mt-1">Reading materials</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="modules">
          <TabsList>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="info">Course Info</TabsTrigger>
          </TabsList>
          <TabsContent value="modules" className="space-y-4 mt-6">
            {course.modules.map((module) => (
              <Card key={module.id}>
                <CardHeader>
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id} className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors">
                        {lesson.type === 'video' && <Video className="w-5 h-5 text-blue-500" />}
                        {lesson.type === 'reading' && <FileText className="w-5 h-5 text-amber-500" />}
                        {lesson.type === 'quiz' && <BookOpen className="w-5 h-5 text-green-500" />}
                        {lesson.type === 'assignment' && <BookOpen className="w-5 h-5 text-purple-500" />}
                        <div className="flex-1">
                          <div className="font-medium">{lesson.title}</div>
                          <div className="text-xs text-muted-foreground">
                            <span className="capitalize">{lesson.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{lesson.estimatedTime} min</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="resources" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Resources</CardTitle>
                <CardDescription>All materials for this course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-500" />
                      Videos
                    </h3>
                    <p className="text-sm text-muted-foreground">{course.resources.videos} video lessons</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      Documents
                    </h3>
                    <p className="text-sm text-muted-foreground">{course.resources.documents} reading materials</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="info" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Instructor</h3>
                  <p>{course.instructor}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Category</h3>
                  <p>{course.category}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Difficulty</h3>
                  <p className="capitalize">{course.difficulty}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Created</h3>
                  <p>{new Date(course.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
