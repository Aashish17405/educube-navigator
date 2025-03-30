
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  FileText, 
  FileUp, 
  Filter, 
  LinkIcon, 
  Search, 
  Video,
  Download,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  url?: string;
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
    estimatedTime: "45m",
    url: "https://arxiv.org/pdf/1803.08823.pdf"
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
    estimatedTime: "1h 20m",
    url: "https://www.youtube.com/watch?v=TNhaISOUy6Q"
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
    estimatedTime: "30m",
    url: "https://www.mathworks.com/help/pdf_doc/stats/stats.pdf"
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
    estimatedTime: "2h",
    url: "https://arxiv.org/abs/1912.01703"
  },
  {
    id: "r5",
    title: "Modern JavaScript Features",
    description: "Overview of modern JavaScript features and how to use them effectively.",
    type: "link",
    author: "Web Dev Team",
    date: "March 1, 2023",
    course: "Web Development",
    estimatedTime: "15m",
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
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
    estimatedTime: "25m",
    url: "https://www.kaggle.com/datasets"
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

const ResourceItem = ({ resource }: { resource: Resource }) => {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleView = () => {
    if (resource.url) {
      if (resource.type === "video" || resource.type === "link") {
        window.open(resource.url, "_blank");
      } else {
        setViewDialogOpen(true);
      }
    } else {
      toast({
        title: "Resource unavailable",
        description: "This resource cannot be viewed at the moment.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (resource.url) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = resource.url;
      link.download = resource.title;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: `Downloading ${resource.title}`,
      });
    } else {
      toast({
        title: "Download unavailable",
        description: "This resource cannot be downloaded at the moment.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
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
                <Button size="sm" variant="default" onClick={handleView}>
                  <EyeIcon className="h-4 w-4 mr-1" /> View
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{resource.title}</DialogTitle>
          </DialogHeader>
          <div className="h-full w-full overflow-auto">
            {resource.url && (
              <iframe
                src={resource.url}
                className="w-full h-full"
                title={resource.title}
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.course.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "documents") return matchesSearch && ["pdf", "doc", "bibtex", "excel"].includes(resource.type);
    if (activeTab === "videos") return matchesSearch && resource.type === "video";
    if (activeTab === "links") return matchesSearch && resource.type === "link";
    
    return matchesSearch;
  });

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
            <Input 
              placeholder="Search resources..." 
              className="pl-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
        
        <Tabs defaultValue="all" className="mb-6" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              {filteredResources.length > 0 ? (
                filteredResources.map(resource => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">No resources found matching your search criteria.</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="mt-6">
            <div className="space-y-4">
              {filteredResources.length > 0 ? (
                filteredResources.map(resource => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">No document resources found matching your search criteria.</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="videos" className="mt-6">
            <div className="space-y-4">
              {filteredResources.length > 0 ? (
                filteredResources.map(resource => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">No video resources found matching your search criteria.</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="links" className="mt-6">
            <div className="space-y-4">
              {filteredResources.length > 0 ? (
                filteredResources.map(resource => (
                  <ResourceItem key={resource.id} resource={resource} />
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">No link resources found matching your search criteria.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Resources;

