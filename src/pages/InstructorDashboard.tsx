import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import {
  Clock,
  Users,
  Trophy,
  BookOpen,
  ArrowRight,
  GraduationCap,
  BarChart4,
  Layers,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CourseStats {
  _id: string;
  title: string;
  description: string;
  thumbnail: {
    url: string;
  };
  category: string;
  enrollmentCount: number;
  completionCount: number;
  completionRate: number;
  avgProgress: number;
  totalModules: number;
  totalLessons: number;
  totalResources: number;
  createdAt: string;
  updatedAt: string;
}

interface InstructorStats {
  totalCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
  avgCompletionRate: number;
  recentEnrollments: number;
  coursesWithHighestEnrollment: CourseStats[];
  coursesWithLowestCompletion: CourseStats[];
}

export default function InstructorDashboard() {
  const [instructorStats, setInstructorStats] = useState<InstructorStats>({
    totalCourses: 0,
    totalEnrollments: 0,
    totalCompletions: 0,
    avgCompletionRate: 0,
    recentEnrollments: 0,
    coursesWithHighestEnrollment: [],
    coursesWithLowestCompletion: [],
  });
  const [courses, setCourses] = useState<CourseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, getToken, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchInstructorData = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) throw new Error("No authentication token found");

        // Fetch instructor's courses
        const coursesResponse = await fetch(
          "http://localhost:5000/api/courses/instructor",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Fetch instructor dashboard stats
        const statsResponse = await fetch(
          "http://localhost:5000/api/courses/instructor/stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!coursesResponse.ok || !statsResponse.ok) {
          throw new Error("Failed to fetch instructor data");
        }

        const coursesData = await coursesResponse.json();
        const statsData = await statsResponse.json();

        setCourses(coursesData);
        setInstructorStats(statsData);
      } catch (error) {
        console.error("Error fetching instructor data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorData();
  }, [getToken]);

  // Ensure only instructors can access this page
  if (isAuthenticated && user?.role !== "instructor") {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your courses and student statistics
            </p>
          </div>
          <Button asChild>
            <Link to="/create-course">
              <GraduationCap className="mr-2 h-4 w-4" />
              Create New Course
            </Link>
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Courses
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {instructorStats.totalCourses}
              </div>
              <p className="text-xs text-muted-foreground">Created courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Enrollments
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {instructorStats.totalEnrollments}
              </div>
              <p className="text-xs text-muted-foreground">Students enrolled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {instructorStats.avgCompletionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average across all courses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Enrollments
              </CardTitle>
              <BarChart4 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {instructorStats.recentEnrollments}
              </div>
              <p className="text-xs text-muted-foreground">
                In the last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Course Tabs */}
        <Tabs defaultValue="all-courses" className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="all-courses">All Courses</TabsTrigger>
            <TabsTrigger value="highest-enrollment">
              Highest Enrollment
            </TabsTrigger>
            <TabsTrigger value="lowest-completion">Needs Attention</TabsTrigger>
          </TabsList>

          {/* All Courses Tab */}
          <TabsContent value="all-courses">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course._id} className="overflow-hidden">
                  {course.thumbnail && (
                    <div className="h-48 w-full overflow-hidden">
                      <img
                        src={course.thumbnail.url}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{course.title}</CardTitle>
                      <Badge variant="outline">{course.category}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Enrolled
                        </p>
                        <p className="text-lg font-medium">
                          {course.enrollmentCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Completed
                        </p>
                        <p className="text-lg font-medium">
                          {course.completionCount}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Completion Rate</span>
                        <span>{course.completionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={course.completionRate} />
                    </div>

                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Layers className="mr-1 h-3.5 w-3.5" />
                        <span>{course.totalModules} modules</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="mr-1 h-3.5 w-3.5" />
                        <span>{course.totalLessons} lessons</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild size="sm" className="w-full">
                      <Link to={`/courses/${course._id}`}>
                        View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {courses.length === 0 && (
              <Card>
                <CardContent className="py-10 flex flex-col items-center justify-center">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground mb-4">
                    You haven't created any courses yet.
                  </p>
                  <Button asChild>
                    <Link to="/create-course">Create Your First Course</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Highest Enrollment Tab */}
          <TabsContent value="highest-enrollment">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructorStats.coursesWithHighestEnrollment.map((course) => (
                <Card key={course._id} className="overflow-hidden">
                  {course.thumbnail && (
                    <div className="h-48 w-full overflow-hidden">
                      <img
                        src={course.thumbnail.url}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{course.title}</CardTitle>
                      <Badge variant="outline" className="bg-blue-50">
                        Top Enrollment
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Enrolled
                        </p>
                        <p className="text-lg font-medium">
                          {course.enrollmentCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Completed
                        </p>
                        <p className="text-lg font-medium">
                          {course.completionCount}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Completion Rate</span>
                        <span>{course.completionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={course.completionRate} />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button asChild size="sm" className="w-full">
                      <Link to={`/courses/${course._id}`}>
                        View Details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {instructorStats.coursesWithHighestEnrollment.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-10">
                    <p className="text-center text-muted-foreground">
                      No enrollment data available yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Lowest Completion Tab */}
          <TabsContent value="lowest-completion">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructorStats.coursesWithLowestCompletion.map((course) => (
                <Card key={course._id} className="overflow-hidden">
                  {course.thumbnail && (
                    <div className="h-48 w-full overflow-hidden">
                      <img
                        src={course.thumbnail.url}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{course.title}</CardTitle>
                      <Badge variant="outline" className="bg-amber-50">
                        Needs Attention
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Enrolled
                        </p>
                        <p className="text-lg font-medium">
                          {course.enrollmentCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Completed
                        </p>
                        <p className="text-lg font-medium">
                          {course.completionCount}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Completion Rate</span>
                        <span>{course.completionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={course.completionRate} />
                    </div>

                    <p className="text-sm text-amber-600">
                      This course has a low completion rate. Consider reviewing
                      the content or structure.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild size="sm" className="w-full">
                      <Link to={`/courses/${course._id}`}>
                        Review Course{" "}
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {instructorStats.coursesWithLowestCompletion.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-10">
                    <p className="text-center text-muted-foreground">
                      No completion data available yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
