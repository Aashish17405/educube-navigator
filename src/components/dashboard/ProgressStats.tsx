
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, Target } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
}

const StatCard = ({ title, value, icon, description }: StatCardProps) => (
  <Card className="stat-card">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="rounded-full bg-primary-50 p-2.5">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export function ProgressStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard
        title="Courses In Progress"
        value="4"
        icon={<BookOpen className="h-5 w-5 text-primary-600" />}
        description="2 courses near completion"
      />
      <StatCard
        title="Total Learning Time"
        value="32h 15m"
        icon={<Clock className="h-5 w-5 text-primary-600" />}
        description="7h 20m this week"
      />
      <StatCard
        title="Completion Rate"
        value="78%"
        icon={<Target className="h-5 w-5 text-primary-600" />}
        description="Up 12% from last month"
      />
    </div>
  );
}
