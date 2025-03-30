
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Course {
  id: number;
  title: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  category: string;
}

const courses: Course[] = [
  {
    id: 1,
    title: "Data Science Fundamentals",
    progress: 65,
    totalModules: 12,
    completedModules: 8,
    category: "Data Science"
  },
  {
    id: 2,
    title: "Advanced React",
    progress: 42,
    totalModules: 10,
    completedModules: 4,
    category: "Web Development"
  },
  {
    id: 3,
    title: "Machine Learning Algorithms",
    progress: 78,
    totalModules: 15,
    completedModules: 12,
    category: "Data Science"
  },
  {
    id: 4,
    title: "UI/UX Design Principles",
    progress: 23,
    totalModules: 8,
    completedModules: 2,
    category: "Design"
  }
];

export function CourseProgress() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">Course Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {courses.map((course) => (
            <div key={course.id} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{course.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {course.completedModules} of {course.totalModules} modules
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100">
                      {course.category}
                    </span>
                  </div>
                </div>
                <span 
                  className={cn(
                    "text-xs font-medium",
                    course.progress > 66 ? "text-green-600" :
                    course.progress > 33 ? "text-amber-600" : "text-red-600"
                  )}
                >
                  {course.progress}%
                </span>
              </div>
              <Progress 
                value={course.progress} 
                className={cn(
                  "h-2",
                  course.progress > 66 ? "bg-green-100" :
                  course.progress > 33 ? "bg-amber-100" : "bg-red-100"
                )} 
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
