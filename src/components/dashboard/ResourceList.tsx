
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileIcon, FileText, FileUp, Link as LinkIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface Resource {
  id: number;
  title: string;
  type: "pdf" | "video" | "doc" | "bibtex" | "link";
  course: string;
  timeAdded: string;
  estimatedTime?: string;
}

const resources: Resource[] = [
  {
    id: 1,
    title: "Introduction to Machine Learning Algorithms",
    type: "pdf",
    course: "Data Science Fundamentals",
    timeAdded: "2 days ago",
    estimatedTime: "45m"
  },
  {
    id: 2,
    title: "Building Reactive UIs with React Hooks",
    type: "video",
    course: "Advanced React",
    timeAdded: "1 week ago",
    estimatedTime: "1h 20m"
  },
  {
    id: 3,
    title: "Statistical Analysis Methods",
    type: "doc",
    course: "Data Science Fundamentals",
    timeAdded: "3 days ago",
    estimatedTime: "30m"
  },
  {
    id: 4,
    title: "Research Papers Collection",
    type: "bibtex",
    course: "Research Methods",
    timeAdded: "Yesterday",
    estimatedTime: "2h"
  },
  {
    id: 5,
    title: "Modern JavaScript Features",
    type: "link",
    course: "Web Development",
    timeAdded: "5 days ago",
    estimatedTime: "15m"
  }
];

const getIconForType = (type: Resource["type"]) => {
  switch (type) {
    case "pdf":
      return <FileText className="h-10 w-10 text-red-500" />;
    case "video":
      return <Video className="h-10 w-10 text-blue-500" />;
    case "doc":
      return <FileIcon className="h-10 w-10 text-blue-700" />;
    case "bibtex":
      return <FileUp className="h-10 w-10 text-amber-500" />;
    case "link":
      return <LinkIcon className="h-10 w-10 text-green-500" />;
    default:
      return <FileText className="h-10 w-10 text-gray-500" />;
  }
};

export function ResourceList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-medium">Recent Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {resources.map((resource) => (
            <div 
              key={resource.id} 
              className="flex items-center p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-gray-50 transition-all cursor-pointer"
            >
              <div className="mr-4 p-2 bg-gray-50 rounded-lg">
                {getIconForType(resource.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{resource.title}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {resource.course}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Added {resource.timeAdded}
                  </span>
                  {resource.estimatedTime && (
                    <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full">
                      {resource.estimatedTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
