
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularProgress } from "./CircularProgress";
import { CheckCircle, Circle } from "lucide-react";

interface ProfileTask {
  id: number;
  title: string;
  completed: boolean;
}

const profileTasks: ProfileTask[] = [
  { id: 1, title: "Complete your profile information", completed: true },
  { id: 2, title: "Set your learning goals", completed: true },
  { id: 3, title: "Connect with instructors", completed: false },
  { id: 4, title: "Join at least one course", completed: true },
  { id: 5, title: "Complete your first assessment", completed: false }
];

export function ProfileCompletion() {
  const completedTasks = profileTasks.filter(task => task.completed).length;
  const completionPercentage = Math.round((completedTasks / profileTasks.length) * 100);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">Profile Completion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <CircularProgress 
            progress={completionPercentage} 
            size={120} 
            strokeWidth={10}
            className="mb-2"
            textClassName="text-2xl font-bold"
          />
          <div className="w-full space-y-2.5">
            {profileTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3">
                {task.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                )}
                <span className={task.completed ? "text-sm" : "text-sm text-muted-foreground"}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
