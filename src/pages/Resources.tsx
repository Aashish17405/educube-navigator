
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  FileText, 
  FileUp, 
  Filter, 
  LinkIcon, 
  Search, 
  Video,
  Download,
  Share,
  EyeIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "doc" | "video" | "bibtex" | "link" | "excel";
  author: string;
  date: string;
  course: string;
  size?: string;
  estimatedTime?: string;
}

const resources: Resource[] = [
  {
    id: "r1",
    title: "Introduction to Machine Learning Algorithms",
    description: "Comprehensive guide to the most common machine learning algorithms and their applications.",
    type: "pdf",
    author: "Dr. Alan Johnson",
    date: "March 10, 2023",
    course: "Data Science Fundamentals",
    size: "4.2 MB",
    estimatedTime: "45m"
  },
  {
    id: "r2",
    title: "Building Reactive UIs with React Hooks",
    description: "Learn how to use React Hooks to create highly reactive user interfaces.",
    type: "video",
    author: "Sarah Miller",
    date: "February 22, 2023",
    course: "Advanced React",
    size: "856 MB",
    estimatedTime: "1h 20m"
  },
  {
    id: "r3",
    title: "Statistical Analysis Methods",
    description: "Guide to statistical methods used in data analysis and interpretation.",
    type: "doc",
    author: "Dr. Michael Chen",
    date: "March 5, 2023",
    course: "Data Science Fundamentals",
    size: "2.8 MB",
    estimatedTime: "30m"
  },
  {
    id: "r4",
    title: "Research Papers Collection",
    description: "Collection of important research papers in the field of machine learning and AI.",
    type: "bibtex",
    author: "Various Authors",
    date: "January 15, 2023",
    course: "Research Methods",
    size: "1.2 MB",
    estimatedTime: "2h"
  },
  {
    id: "r5",
    title: "Modern JavaScript Features",
    description: "Overview of modern JavaScript features and how to use them effectively.",
    type: "link",
    author: "Web Dev Team",
    date: "March 1, 2023",
    course: "Web Development",
    estimatedTime: "15m"
  },
  {
    id: "r6",
    title: "Data Analysis Results",
    description: "Spreadsheet containing the results of the data analysis exercise.",
    type: "excel",
    author: "Data Analysis Team",
    date: "March 12, 2023",
    course: "Data Science Fundamentals",
    size: "3.1 MB",
    estimatedTime: "25m"
  }
];

const getIconForType = (type: Resource["type"]) => {
  switch (type) {
    case "pdf":
    case "doc":
      return <FileText className="h-10 w-10 text-primary-600" />;
    case "video":
      return <Video className="h-10 w-10 text-primary-600" />;
    case "bibtex":
      return <FileUp className="h-10 w-10 text-primary-600" />;
    case "link":
      return <LinkIcon className="h-10 w-10 text-primary-600" />;
    case "excel":
      return <FileUp className="h-10 w-10 text-primary-600" />;
    default:
      return <FileText className="h-10 w-10 text-primary-600" />;
  }
};

const getTypeLabel = (type: Resource["type"]) => {
  switch (type) {
    case "pdf":
      return "PDF Document";
    case "doc":
      return "Word Document";
    case "video":
      return "Video";
    case "bibtex":
      return "BibTeX";
    case "link":
      return "External Link";
    case "excel":
      return "Excel Spreadsheet";
    default:
      return "Document";
  }
};

const ResourceItem = ({ resource }: { resource: Resource }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-5">
      <div className="flex">
        <div className="mr-5 p-2 bg-primary-50 rounded-lg">
          {getIconForType(resource.type)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{resource.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-3">{resource.description}</p>
            </div>
            <Badge variant="outline" className="ml-2 shrink-0">
              {getTypeLabel(resource.type)}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-3">
            <div>
              <span className="font-medium">Author:</span> {resource.author}
            </div>
            <div>
              <span className="font-medium">Added:</span> {resource.date}
            </div>
            <div>
              <span className="font-medium">Course:</span> {resource.course}
            </div>
            {resource.size && (
              <div>
                <span className="font-medium">Size:</span> {resource.size}
              </div>
            )}
            {resource.estimatedTime && (
              <div>
                <span className="font-medium">Est. Time:</span> {resource.estimatedTime}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="default">
              <EyeIcon className="h-4 w-4 mr-1" /> View
            </Button>
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
            <Button size="sm" variant="outline">
              <Share className="h-4 w-4 mr-1" /> Share
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const Resources = () => {
  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Learning Resources</h1>
          <p className="text-muted-foreground">Access all your learning materials in one place</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Search resources..." className="pl-9" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Type</DropdownMenuItem>
              <DropdownMenuItem>Course</DropdownMenuItem>
              <DropdownMenuItem>Date Added</DropdownMenuItem>
              <DropdownMenuItem>Author</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="gap-2">
            <FileUp className="h-4 w-4" /> Upload
          </Button>
        </div>
        
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              {resources.map(resource => (
                <ResourceItem key={resource.id} resource={resource} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="mt-6">
            <div className="space-y-4">
              {resources
                .filter(r => ["pdf", "doc", "bibtex", "excel"].includes(r.type))
                .map(resource => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))
              }
            </div>
          </TabsContent>
          
          <TabsContent value="videos" className="mt-6">
            <div className="space-y-4">
              {resources
                .filter(r => r.type === "video")
                .map(resource => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))
              }
            </div>
          </TabsContent>
          
          <TabsContent value="links" className="mt-6">
            <div className="space-y-4">
              {resources
                .filter(r => r.type === "link")
                .map(resource => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))
              }
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Resources;
