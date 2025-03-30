
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  course: string;
  date: string;
  time: string;
  duration: string;
}

const upcomingLessons: Lesson[] = [
  {
    id: 1,
    title: "Introduction to Machine Learning",
    course: "Data Science Fundamentals",
    date: "Today",
    time: "2:00 PM",
    duration: "60m"
  },
  {
    id: 2,
    title: "React Hooks Deep Dive",
    course: "Advanced React",
    date: "Tomorrow",
    time: "10:00 AM",
    duration: "45m"
  },
  {
    id: 3,
    title: "Statistical Analysis Methods",
    course: "Data Science Fundamentals",
    date: "Mar 15",
    time: "4:30 PM",
    duration: "90m"
  }
];

export function UpcomingLessons() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-xl font-medium">Upcoming Lessons</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingLessons.map((lesson) => (
            <div 
              key={lesson.id} 
              className="p-4 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-sm">{lesson.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{lesson.course}</p>
                </div>
                <div className="bg-primary-50 text-primary-700 rounded-md px-2 py-1 text-xs font-medium">
                  {lesson.date}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{lesson.time}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{lesson.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
