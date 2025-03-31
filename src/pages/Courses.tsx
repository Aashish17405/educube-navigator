import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, GraduationCap, Users, Video, ImageIcon } from "lucide-react";
import { courseService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: {
    url: string;
    publicId: string;
  };
  instructor: {
    _id: string;
    username: string;
  };
  enrolledStudents: string[];
  resources: {
    title: string;
    fileUrl: string;
    uploadedAt: string;
  }[];
  progress?: number;
  score?: number;
  isEnrolled?: boolean;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await courseService.getCourses();
      setCourses(data);
      console.log(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await courseService.enrollInCourse(courseId);
      toast({
        title: "Success",
        description: "Successfully enrolled in course",
      });
      loadCourses(); // Reload courses to update enrollment status
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll in course",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {user?.role === 'instructor' ? 'My Created Courses' : 'Available Courses'}
            </h1>
            <p className="text-muted-foreground">
              {user?.role === 'instructor' 
                ? 'Manage your courses and track student progress'
                : 'Browse courses and continue your learning journey'}
            </p>
          </div>
          {user?.role === 'instructor' && (
            <Button asChild>
              <Link to="/create-course" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Create Course
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20">
            <GraduationCap className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No courses yet</h2>
            <p className="mt-2 text-center text-muted-foreground">
              {user?.role === 'instructor'
                ? "You haven't created any courses yet. Create your first course to get started."
                : "No courses available yet. Check back later for new courses."}
            </p>
            {user?.role === 'instructor' && (
              <Button asChild className="mt-4">
                <Link to="/create-course">Create Course</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course._id} className="flex flex-col">
                <Link to={`/courses/${course._id}`}>
                  <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail.url}
                        alt={course.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-muted">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                </Link>
                <CardContent className="flex-grow">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">
                        {course.enrolledStudents?.length || 0} students enrolled
                      </span>
                    </div>
                    {course.progress !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{Math.round(course.progress)}%</span>
                        </div>
                        <Progress value={course.progress} />
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  {user?.role === 'learner' && !course.isEnrolled && (
                    <Button 
                      className="w-full" 
                      onClick={() => handleEnroll(course._id)}
                    >
                      Enroll Now
                    </Button>
                  )}
                  {(user?.role === 'instructor' || course.isEnrolled) && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      asChild
                    >
                      <Link to={`/courses/${course._id}`}>
                        {user?.role === 'instructor' ? 'Manage Course' : 'Continue Learning'}
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
