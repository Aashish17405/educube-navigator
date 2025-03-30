
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
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CourseProps {
  id: number;
  title: string;
  description: string;
  instructor: string;
  category: string;
  enrolled: number;
  modules: number;
  duration: string;
  progress: number;
  image: string;
  resources: {
    videos: number;
    documents: number;
  };
}

const courses: CourseProps[] = [
  {
    id: 1,
    title: "Data Science Fundamentals",
    description: "Learn the core concepts of data science including statistics, Python programming, and data analysis techniques.",
    instructor: "Dr. Alan Johnson",
    category: "Data Science",
    enrolled: 2547,
    modules: 12,
    duration: "36 hours",
    progress: 65,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    resources: {
      videos: 24,
      documents: 18
    }
  },
  {
    id: 2,
    title: "Advanced React",
    description: "Master advanced React concepts including hooks, context API, and performance optimization techniques.",
    instructor: "Sarah Miller",
    category: "Web Development",
    enrolled: 1893,
    modules: 10,
    duration: "28 hours",
    progress: 42,
    image: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    resources: {
      videos: 20,
      documents: 15
    }
  },
  {
    id: 3,
    title: "Machine Learning Algorithms",
    description: "Explore various machine learning algorithms and their applications in real-world scenarios.",
    instructor: "Dr. Michael Chen",
    category: "Data Science",
    enrolled: 3105,
    modules: 15,
    duration: "45 hours",
    progress: 78,
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    resources: {
      videos: 30,
      documents: 25
    }
  },
  {
    id: 4,
    title: "UI/UX Design Principles",
    description: "Learn essential UI/UX design principles and how to create intuitive user interfaces.",
    instructor: "Emily Rodriguez",
    category: "Design",
    enrolled: 1429,
    modules: 8,
    duration: "24 hours",
    progress: 23,
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    resources: {
      videos: 16,
      documents: 12
    }
  }
];

const CourseCard = ({ course }: { course: CourseProps }) => (
  <Card className="course-card overflow-hidden flex flex-col h-full">
    <div 
      className="w-full h-48 bg-center bg-cover"
      style={{ backgroundImage: `url(${course.image})` }}
    />
    <CardContent className="flex flex-col flex-1 p-5">
      <div className="flex items-start justify-between mb-3">
        <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-200">
          {course.category}
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
          <span>{course.duration}</span>
        </div>
        <div className="flex items-center text-sm">
          <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{course.modules} modules</span>
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

const Courses = () => {
  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Manage your enrolled courses and track your progress</p>
        </div>
        
        <Tabs defaultValue="in-progress" className="mb-6">
          <TabsList>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All Courses</TabsTrigger>
          </TabsList>
          
          <TabsContent value="in-progress" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-100 rounded-full p-6 mb-4">
                <GraduationCap className="h-12 w-12 text-primary-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">No completed courses yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Continue learning to complete your first course and earn your certificate
              </p>
              <Button variant="outline">Explore More Courses</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Courses;
