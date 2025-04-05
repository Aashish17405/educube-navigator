import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  GraduationCap,
  Users,
  Video,
  ImageIcon,
  Trash2,
} from "lucide-react";
import { courseService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  actualEnrollmentCount?: number;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(
    null
  );
  const { user, getToken } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      // First fetch all courses
      const allCourses = await courseService.getCourses();
      console.log("Courses data with API enrollment status:", allCourses);

      // For learners, also fetch their enrolled courses from the dedicated endpoint
      if (user?.role === "learner") {
        const enrolledCoursesData = await courseService.getEnrolledCourses();
        console.log("Directly fetched enrolled courses:", enrolledCoursesData);

        // Create a set of enrolled course IDs for faster lookups
        const enrolledCourseIds = new Set(
          enrolledCoursesData.map((enrollment: any) => enrollment.course._id)
        );
        setEnrolledCourses(enrolledCoursesData);

        // Mark courses as enrolled using both the isEnrolled flag and our enrolledCourseIds
        const coursesWithUpdatedStatus = allCourses.map((course: Course) => ({
          ...course,
          isEnrolled: course.isEnrolled || enrolledCourseIds.has(course._id),
        }));

        setCourses(coursesWithUpdatedStatus);
      } else {
        // For instructors, just use the original courses
        setCourses(allCourses);
      }
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

  // Improved helper function to check enrollment status
  const isUserEnrolledInCourse = (course: Course) => {
    // First check the isEnrolled flag from the API response
    if (course.isEnrolled === true) {
      return true;
    }

    // Then check our separately fetched enrollments
    if (enrolledCourses.length > 0) {
      const isEnrolled = enrolledCourses.some(
        (enrollment) => enrollment.course._id === course._id
      );
      if (isEnrolled) return true;
    }

    // As a fallback, check if the user's ID is in the enrolledStudents array
    if (user && course.enrolledStudents && course.enrolledStudents.length > 0) {
      // Check if user._id exists in enrolledStudents array (MongoDB IDs are stored as strings)
      return course.enrolledStudents.some(
        (studentId) => studentId.toString() === user.id.toString()
      );
    }

    return false;
  };

  const handleEnroll = async (courseId: string) => {
    try {
      // Find the course in our local state
      const courseToEnroll = courses.find((course) => course._id === courseId);

      // Check if already enrolled before making API call
      if (courseToEnroll && isUserEnrolledInCourse(courseToEnroll)) {
        toast({
          title: "Already Enrolled",
          description: "You are already enrolled in this course.",
          variant: "default",
        });
        return;
      }

      setEnrollingCourseId(courseId);
      const token = getToken();

      // Use the same API endpoint pattern as CourseView.tsx
      const response = await fetch(
        `http://localhost:5000/api/enrollments/${courseId}/enroll`,
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
        throw new Error(errorData.message || "Failed to enroll in course");
      }

      const enrollmentData = await response.json();

      // Update the course in the local state to reflect enrollment
      setCourses((prevCourses) =>
        prevCourses.map((course) => {
          if (course._id === courseId) {
            return {
              ...course,
              isEnrolled: true,
              enrolledStudents: [...(course.enrolledStudents || []), user?.id], // Add current user ID to enrolled students
            };
          }
          return course;
        })
      );

      toast({
        title: "Enrolled Successfully",
        description: "You are now enrolled in this course",
      });
    } catch (error: any) {
      console.error("Enrollment error:", error);
      toast({
        title: "Enrollment Failed",
        description:
          error instanceof Error ? error.message : "Failed to enroll in course",
        variant: "destructive",
      });
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    setCourseToDelete(courseId);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      setIsDeleting(true);
      await courseService.deleteCourse(courseToDelete);

      // Update the local state to remove the deleted course
      setCourses((prevCourses) =>
        prevCourses.filter((course) => course._id !== courseToDelete)
      );

      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete course",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setCourseToDelete(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {user?.role === "instructor"
                ? "My Created Courses"
                : "Available Courses"}
            </h1>
            <p className="text-muted-foreground">
              {user?.role === "instructor"
                ? "Manage your courses and track student progress"
                : "Browse courses and continue your learning journey"}
            </p>
          </div>
          {user?.role === "instructor" && (
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
              {user?.role === "instructor"
                ? "You haven't created any courses yet. Create your first course to get started."
                : "No courses available yet. Check back later for new courses."}
            </p>
            {user?.role === "instructor" && (
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
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                </Link>
                <CardContent className="flex-grow">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm text-muted-foreground">
                          <span className="font-medium">
                            {course.actualEnrollmentCount !== undefined
                              ? course.actualEnrollmentCount
                              : course.enrolledStudents?.length || 0}
                          </span>{" "}
                          learners enrolled
                        </span>
                      </div>
                      {isUserEnrolledInCourse(course) && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          Enrolled
                        </Badge>
                      )}
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
                <CardFooter className="flex flex-col space-y-2">
                  {user?.role === "learner" && (
                    <>
                      {isUserEnrolledInCourse(course) ? (
                        // Show the "Continue Learning" button for enrolled courses
                        <Button variant="outline" className="w-full" asChild>
                          <Link to={`/courses/${course._id}`}>
                            Continue Learning
                          </Link>
                        </Button>
                      ) : (
                        // Show "Enroll Now" button only if not enrolled
                        <Button
                          className="w-full"
                          onClick={() => handleEnroll(course._id)}
                          disabled={
                            enrollingCourseId === course._id ||
                            isUserEnrolledInCourse(course)
                          }
                        >
                          {enrollingCourseId === course._id ? (
                            <div className="flex items-center justify-center">
                              <span className="mr-2 animate-spin">↻</span>
                              Enrolling...
                            </div>
                          ) : isUserEnrolledInCourse(course) ? (
                            "Already Enrolled"
                          ) : (
                            "Enroll Now"
                          )}
                        </Button>
                      )}
                    </>
                  )}

                  {user?.role === "instructor" && (
                    <div className="w-full flex flex-col gap-2">
                      <Button variant="outline" className="w-full" asChild>
                        <Link to={`/courses/${course._id}`}>Manage Course</Link>
                      </Button>

                      {user.id === course.instructor._id && (
                        <Button
                          variant="destructive"
                          className="w-full"
                          onClick={() => handleDeleteCourse(course._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Course
                        </Button>
                      )}
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Course Confirmation Dialog */}
      <AlertDialog
        open={!!courseToDelete}
        onOpenChange={(open) => !open && setCourseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              course and all associated data including student enrollments and
              progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCourse}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Course"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
