
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { CircularProgress } from "@/components/dashboard/CircularProgress";
import { 
  BookOpen, 
  ChevronRight,
  Clock, 
  GraduationCap, 
  Users,
  PlayCircle,
  FileText,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCoursesStore, Course } from "@/store/coursesStore";
import { Link } from "react-router-dom";
import { useState } from "react";

const difficultyColors = {
  beginner: "bg-green-50 text-green-700 border-green-200",
  intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  advanced: "bg-red-50 text-red-700 border-red-200"
};

const categoryLabels: Record<string, string> = {
  "data-science": "Data Science",
  "web-development": "Web Development",
  "design": "Design",
  "business": "Business"
};

const CourseCard = ({ course }: { course: Course }) => {
  // Format category for display
  const displayCategory = categoryLabels[course.category] || course.category;
  
  return (
    <Card className="course-card overflow-hidden flex flex-col h-full">
      <div 
        className="w-full h-48 bg-center bg-cover"
        style={{ backgroundImage: `url(${course.thumbnail})` }}
      />
      <CardContent className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200">
            {displayCategory}
          </Badge>
          <div className="relative">
            <CircularProgress 
              progress={course.progress} 
              size={44}
              strokeWidth={4}
              textClassName="text-xs font-semibold"
            />
          </div>
        </div>
        
        <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <GraduationCap className="h-4 w-4 mr-1" />
          <span>{course.instructor}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{getTotalDuration(course)} min</span>
          </div>
          <div className="flex items-center text-sm">
            <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{course.modules.length} modules</span>
          </div>
          <div className="flex items-center text-sm">
            <PlayCircle className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{course.resources.videos} videos</span>
          </div>
          <div className="flex items-center text-sm">
            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{course.resources.documents} docs</span>
          </div>
        </div>
        
        <div className="mt-auto">
          <Button className="w-full gap-1 justify-between">
            Continue Learning <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate total duration
const getTotalDuration = (course: Course): number => {
  return course.modules.reduce((total, module) => {
    return total + module.lessons.reduce((lessonTotal, lesson) => {
      return lessonTotal + parseInt(lesson.estimatedTime || "0", 10);
    }, 0);
  }, 0);
};

const Courses = () => {
  const courses = useCoursesStore(state => state.courses);
  const [activeTab, setActiveTab] = useState("all");
  
  // Filter courses based on active tab
  const filteredCourses = courses.filter(course => {
    if (activeTab === "in-progress") {
      return course.progress > 0 && course.progress < 100;
    } else if (activeTab === "completed") {
      return course.progress === 100;
    }
    return true; // "all" tab
  });

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Courses</h1>
            <p className="text-muted-foreground">Manage your enrolled courses and track your progress</p>
          </div>
          <Button asChild>
            <Link to="/create-course">
              <Plus className="h-4 w-4 mr-2" /> Create Course
            </Link>
          </Button>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <BookOpen className="h-12 w-12 text-primary-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Start by creating your first course or exploring available courses
                </p>
                <Button asChild>
                  <Link to="/create-course">Create Your First Course</Link>
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="in-progress" className="mt-6">
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <BookOpen className="h-12 w-12 text-primary-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No courses in progress</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Start learning to see your in-progress courses here
                </p>
                <Button variant="outline" asChild>
                  <Link to="/create-course">Explore Courses</Link>
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <GraduationCap className="h-12 w-12 text-primary-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No completed courses yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Continue learning to complete your first course and earn your certificate
                </p>
                <Button variant="outline" asChild>
                  <Link to="/create-course">Explore More Courses</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Courses;
