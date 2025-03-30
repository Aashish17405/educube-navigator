
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCoursesStore } from "@/store/coursesStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, GraduationCap, Users, Video } from "lucide-react";

export default function Courses() {
  const { courses } = useCoursesStore();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground">
            Browse your enrolled courses and continue your learning journey
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20">
            <GraduationCap className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No courses yet</h2>
            <p className="mt-2 text-center text-muted-foreground">
              You haven't enrolled in any courses yet. Browse available courses or create your own.
            </p>
            <Button className="mt-6">Browse Courses</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                {course.thumbnail && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title} 
                      className="object-cover w-full h-full" 
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="capitalize">
                      {course.difficulty}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {course.category}
                    </Badge>
                  </div>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.enrolled}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Video className="h-4 w-4" />
                        <span>{course.resources.videos}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{course.resources.documents}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link to={`/courses/${course.id}`}>Continue Learning</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
