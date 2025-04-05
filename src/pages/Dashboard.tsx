import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, BookOpen, Trophy, Timer, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: {
    url: string;
  };
  instructor: {
    _id: string;
    username: string;
  };
  estimatedTotalTime: number;
}

interface Enrollment {
  _id: string;
  course: {
    _id: string;
    title: string;
    description: string;
    thumbnail: {
      url: string;
    };
    category: string;
  };
  progress: number;
  totalTimeSpent: number;
  completed: boolean;
  updatedAt: string;
  modules: {
    moduleId: string;
    completed: boolean;
    lessons: {
      lessonId: string;
      timeSpent: number;
      completed: boolean;
    }[];
  }[];
}

interface DashboardData {
  enrollments: Enrollment[];
  availableCourses: Course[];
  stats: {
    totalTimeSpent: number;
    coursesInProgress: number;
    completedCourses: number;
    averageProgress: number;
  };
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    enrollments: [],
    availableCourses: [],
    stats: {
      totalTimeSpent: 0,
      coursesInProgress: 0,
      completedCourses: 0,
      averageProgress: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const { getToken, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/signin");
    } else if (user.role === "instructor") {
      navigate("/instructor/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) throw new Error("No authentication token found");

        // Fetch enrollments
        const enrollmentsResponse = await fetch(
          "http://localhost:5000/api/enrollments/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Fetch available courses
        const coursesResponse = await fetch(
          "http://localhost:5000/api/courses",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!enrollmentsResponse.ok || !coursesResponse.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const enrollments = await enrollmentsResponse.json();
        const courses = await coursesResponse.json();

        // Calculate stats
        const totalTimeSpent = enrollments.reduce(
          (total, enrollment) => total + enrollment.totalTimeSpent,
          0
        );
        const coursesInProgress = enrollments.filter(
          (e) => e.progress > 0 && e.progress < 100
        ).length;
        const completedCourses = enrollments.filter((e) => e.completed).length;
        const averageProgress =
          enrollments.length > 0
            ? enrollments.reduce(
                (total, enrollment) => total + enrollment.progress,
                0
              ) / enrollments.length
            : 0;

        setDashboardData({
          enrollments,
          availableCourses: courses.filter(
            (course) =>
              !enrollments.some(
                (enrollment) => enrollment.course._id === course._id
              )
          ),
          stats: {
            totalTimeSpent,
            coursesInProgress,
            completedCourses,
            averageProgress,
          },
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [getToken]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Learning Dashboard</h1>

        {/* Learning Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Time Spent
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(dashboardData.stats.totalTimeSpent)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Courses in Progress
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.stats.coursesInProgress}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Courses
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.stats.completedCourses}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Average Progress
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(dashboardData.stats.averageProgress)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses */}
        <h2 className="text-2xl font-semibold mt-8 mb-4">
          My Enrolled Courses
        </h2>
        {dashboardData.enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.enrollments.map((enrollment) => (
              <Card key={enrollment._id} className="overflow-hidden">
                {enrollment.course.thumbnail && (
                  <div className="h-48 w-full overflow-hidden">
                    <img
                      src={enrollment.course.thumbnail.url}
                      alt={enrollment.course.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{enrollment.course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {enrollment.course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Progress
                      </span>
                      <span className="text-sm font-medium">
                        {Math.round(enrollment.progress)}%
                      </span>
                    </div>
                    <Progress value={enrollment.progress} />
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatTime(enrollment.totalTimeSpent)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {enrollment.completed ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Trophy className="h-3.5 w-3.5" />
                            <span>Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Timer className="h-3.5 w-3.5" />
                            <span>In Progress</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/courses/${enrollment.course._id}`}>
                        {enrollment.completed
                          ? "Review Course"
                          : "Continue Learning"}{" "}
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-muted-foreground">
                You haven't enrolled in any courses yet.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Available Courses */}
        {dashboardData.availableCourses.length > 0 && (
          <>
            <h2 className="text-2xl font-semibold mt-8 mb-4">
              Available Courses
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.availableCourses.map((course) => (
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
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {formatTime(course.estimatedTotalTime || 0)}
                        </span>
                      </div>
                      <Button asChild size="sm">
                        <Link to={`/courses/${course._id}`}>
                          View Details{" "}
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
