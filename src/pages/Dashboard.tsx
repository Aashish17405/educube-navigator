import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, BookOpen, Trophy, Timer } from "lucide-react";

interface Course {
  _id: string;
  title: string;
  instructor: {
    _id: string;
    username: string;
  };
}

interface Progress {
  _id: string;
  student: string;
  course: string;
  progress: number;
  timeSpent: number;
  lastAccessed: string;
  completedResources: {
    resourceId: string;
    completedAt: string;
  }[];
}

interface Resource {
  _id: string;
  title: string;
  course: {
    _id: string;
    title: string;
  };
  createdAt: string;
}

interface DashboardData {
  courses: Course[];
  progress: Progress[];
  recentResources: Resource[];
  stats: {
    totalTimeSpent: number;
    coursesInProgress: number;
    completedCourses: number;
    averageQuizScore: number;
  };
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    courses: [],
    progress: [],
    recentResources: [],
    stats: {
      totalTimeSpent: 0,
      coursesInProgress: 0,
      completedCourses: 0,
      averageQuizScore: 0,
    }
  });
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');

        console.log('Fetching dashboard data...');
        const response = await fetch('http://localhost:5000/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.error('Failed to fetch dashboard data:', response.status);
          throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        console.log('Dashboard data received:', data);
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [getToken]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCourseProgress = (courseId: string) => {
    const courseProgress = dashboardData.progress.find(p => p.course === courseId);
    return courseProgress?.progress || 0;
  };

  const getCourseTimeSpent = (courseId: string) => {
    const courseProgress = dashboardData.progress.find(p => p.course === courseId);
    return courseProgress?.timeSpent || 0;
  };

  const getCourseLastAccessed = (courseId: string) => {
    const courseProgress = dashboardData.progress.find(p => p.course === courseId);
    return courseProgress?.lastAccessed || '';
  };

  const getCompletedResources = (courseId: string) => {
    const courseProgress = dashboardData.progress.find(p => p.course === courseId);
    return courseProgress?.completedResources.length || 0;
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Learning Dashboard</h1>

        {/* Learning Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Time Spent</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(dashboardData.stats.totalTimeSpent)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Courses in Progress</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.coursesInProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.completedCourses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Quiz Score</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.averageQuizScore}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Course Progress */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {dashboardData.courses.map((course) => (
                  <div key={course._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{course.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Timer className="h-4 w-4" />
                          <span>{formatTime(getCourseTimeSpent(course._id))} spent learning</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{getCompletedResources(course._id)} resources completed</div>
                        <div className="text-sm text-muted-foreground">
                          {getCourseLastAccessed(course._id) 
                            ? `Last accessed ${new Date(getCourseLastAccessed(course._id)).toLocaleDateString()}`
                            : 'Not started yet'}
                        </div>
                      </div>
                    </div>
                    <Progress value={getCourseProgress(course._id)} />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                {dashboardData.recentResources.map((resource) => (
                  <div key={resource._id} className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{resource.title}</h4>
                      <p className="text-sm text-muted-foreground">{resource.course.title}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
