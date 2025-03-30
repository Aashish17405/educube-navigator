
import { MainLayout } from "@/components/layout/MainLayout";
import { ProgressStats } from "@/components/dashboard/ProgressStats";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { UpcomingLessons } from "@/components/dashboard/UpcomingLessons";
import { CourseProgress } from "@/components/dashboard/CourseProgress";
import { ResourceList } from "@/components/dashboard/ResourceList";
import { ProfileCompletion } from "@/components/dashboard/ProfileCompletion";

const Index = () => {
  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Learning Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and manage your learning journey</p>
        </div>
        
        <ProgressStats />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <ProgressChart />
          <UpcomingLessons />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <CourseProgress />
          <ResourceList />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProfileCompletion />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
