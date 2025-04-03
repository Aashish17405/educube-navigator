import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { 
  Grip, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown,
  FileUp,
  PlayCircle,
  FileQuestion,
  BookText,
  Link as LinkIcon,
  Timer,
  FileText,
  File,
  Loader2
} from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { courseService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";

interface Resource {
  title: string;
  type: 'pdf' | 'word' | 'excel' | 'bibtex' | 'link' | 'video';
  url: string;
  publicId: string;
  fileName?: string;
  mimeType?: string;
  estimatedTime?: number;
}

interface Lesson {
  title: string;
  type: 'video' | 'quiz' | 'reading' | 'assignment';
  content: string;
  resources: Resource[];
  estimatedTime?: number;
  completionCriteria: 'view' | 'quiz' | 'time';
  requiredScore?: number;
  requiredTime?: number;
  url?: string;
  publicId?: string;
  fileName?: string;
  mimeType?: string;
}

interface Module {
  title: string;
  description: string;
  lessons: Lesson[];
  prerequisites: string[];
}

interface Quiz {
  title: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
    points: number;
  }[];
  passingScore: number;
  timeLimit: number;
}

const CreateCourse = () => {
  const [courseTitle, setCourseTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [thumbnailPublicId, setThumbnailPublicId] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [learningPath, setLearningPath] = useState<{ moduleId: string; requiredModules: string[] }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const handleFileUpload = async (file: File, type: 'thumbnail' | 'resource'): Promise<{ url: string; publicId: string; fileName?: string; mimeType?: string }> => {
    console.log(`Starting ${type} upload:`, file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Sending file to server...', {
        type: file.type,
        size: file.size,
        name: file.name
      });

      const response = await api.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload successful:', response.data);
      return {
        url: response.data.url,
        publicId: response.data.publicId,
        fileName: response.data.fileName,
        mimeType: response.data.mimeType
      };
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || error.message || 'Upload failed',
        variant: "destructive"
      });
      throw new Error('Upload failed');
    }
  };

  const handleThumbnailChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Error",
            description: "Please select an image file (JPEG, PNG, etc.)",
            variant: "destructive",
          });
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setThumbnailPreview(response.data.url);
        setThumbnailPublicId(response.data.publicId);
        
        toast({
          title: "Success",
          description: "Thumbnail uploaded successfully",
        });
      } catch (error) {
        console.error('Thumbnail upload error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to upload thumbnail",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddResource = async (resourceData: { title: string; type: Resource['type']; file?: File; url?: string; estimatedTime?: number }) => {
    try {
      if (resourceData.file) {
        const { url, publicId, fileName, mimeType } = await handleFileUpload(resourceData.file, 'resource');
        setResources(prev => [...prev, {
          title: resourceData.title,
          type: resourceData.type,
          url,
          publicId,
          fileName,
          mimeType,
          estimatedTime: resourceData.estimatedTime
        }]);
      } else if (resourceData.url) {
        // For external links, generate a unique publicId
        const uniqueId = `external_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        setResources(prev => [...prev, {
          title: resourceData.title,
          type: resourceData.type,
          url: resourceData.url,
          publicId: uniqueId,
          estimatedTime: resourceData.estimatedTime
        }]);
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add resource",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!courseTitle.trim()) {
      toast({
        title: "Error",
        description: "Course title is required",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Course description is required",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    if (!difficulty) {
      toast({
        title: "Error",
        description: "Please select a difficulty level",
        variant: "destructive",
      });
      return;
    }

    // Validate that there is at least one module with one lesson
    if (modules.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one module to the course",
        variant: "destructive",
      });
      return;
    }

    // Check if any module has no lessons
    const emptyModules = modules.filter(module => !module.lessons || module.lessons.length === 0);
    if (emptyModules.length > 0) {
      toast({
        title: "Error",
        description: `Please add at least one lesson to the following modules: ${emptyModules.map(m => m.title).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const courseData = {
        title: courseTitle,
        description,
        category,
        difficulty,
        thumbnail: thumbnailPreview ? {
          url: thumbnailPreview,
          publicId: thumbnailPublicId
        } : undefined,
        resources: resources.map(resource => ({
          title: resource.title,
          type: resource.type,
          url: resource.url,
          publicId: resource.publicId,
          fileName: resource.fileName,
          mimeType: resource.mimeType,
          estimatedTime: resource.estimatedTime || 0
        })),
        modules: modules.map(module => ({
          title: module.title,
          description: module.description || '',
          prerequisites: module.prerequisites || [],
          lessons: module.lessons.map(lesson => ({
            title: lesson.title,
            type: lesson.type,
            content: lesson.content || '',
            estimatedTime: lesson.estimatedTime || 0,
            resources: lesson.resources?.map(resource => ({
              title: resource.title,
              type: resource.type,
              url: resource.url,
              publicId: resource.publicId,
              fileName: resource.fileName,
              mimeType: resource.mimeType,
              estimatedTime: resource.estimatedTime || 0
            })) || [],
            completionCriteria: lesson.completionCriteria || 'view',
            requiredScore: lesson.requiredScore,
            requiredTime: lesson.requiredTime
          }))
        })),
        estimatedTotalTime: modules.reduce((total, module) => 
          total + module.lessons.reduce((lessonTotal, lesson) => 
            lessonTotal + (lesson.estimatedTime || 0), 0), 0),
        learningPath: modules.map((module, index) => ({
          moduleId: module.title,
          requiredModules: module.prerequisites || []
        })),
        isDraft: false
      };

      console.log('Creating course with data:', courseData);
      const response = await api.post('/courses', courseData);

      if (!response.data) throw new Error('Failed to create course');

      toast({
        title: "Success",
        description: "Course created successfully",
      });
      navigate('/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create course",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>Provide basic information about your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic fields (title, description, etc.) */}
              <div>
                <Label htmlFor="course-title">Course Title</Label>
                <Input 
                  id="course-title" 
                  placeholder="Enter course title" 
                  className="mt-1" 
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Course Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Enter course description" 
                  className="mt-1"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category" className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data-science">Data Science</SelectItem>
                      <SelectItem value="web-development">Web Development</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger id="difficulty" className="mt-1">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="thumbnail">Course Thumbnail</Label>
                <div className="mt-1 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  {thumbnailPreview ? (
                    <div className="mb-4">
                      <img 
                        src={thumbnailPreview} 
                        alt="Course thumbnail preview" 
                        className="max-h-40 mx-auto rounded-md" 
                      />
                    </div>
                  ) : (
                    <FileUp className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                  )}
                  <p className="text-sm text-muted-foreground mb-4">
                    {thumbnailPreview ? "Change thumbnail image" : "Upload a thumbnail image for your course"}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="thumbnail-upload"
                    onChange={handleThumbnailChange}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('thumbnail-upload')?.click();
                    }}
                  >
                    {thumbnailPreview ? "Change Image" : "Upload Image"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Resources Card */}
          <Card>
            <CardHeader>
              <CardTitle>Course Resources</CardTitle>
              <CardDescription>Upload or link to course materials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  type="file"
                  id="resource-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    handleAddResource({ title: file.name, type: 'pdf', file });
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.bibtex,.mp4,.webm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const url = prompt('Enter URL:');
                    const title = prompt('Enter title:');
                    if (url && title) handleAddResource({ title, type: 'video', url });
                  }}
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('resource-upload')?.click()}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </div>

              {/* Resource List */}
              <div className="space-y-2">
                {resources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {resource.type === 'pdf' && <FileText className="w-4 h-4" />}
                      {resource.type === 'word' && <File className="w-4 h-4" />}
                      {resource.type === 'excel' && <FileText className="w-4 h-4" />}
                      {resource.type === 'bibtex' && <FileText className="w-4 h-4" />}
                      {resource.type === 'link' && <LinkIcon className="w-4 h-4" />}
                      {resource.type === 'video' && <PlayCircle className="w-4 h-4" />}
                      <span>{resource.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Est. time (min)"
                        className="w-32"
                        value={resource.estimatedTime || ''}
                        onChange={(e) => {
                          const time = parseInt(e.target.value);
                          setResources(prev => prev.map((r, i) => 
                            i === index ? { ...r, estimatedTime: time } : r
                          ));
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setResources(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Modules and Lessons */}
          <Card>
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
              <CardDescription>Organize your course into modules and lessons</CardDescription>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={(result) => console.log(result)}>
                <Droppable droppableId="modules" type="module">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {modules.map((module, moduleIndex) => (
                        <Draggable
                          key={module.title}
                          draggableId={module.title}
                          index={moduleIndex}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="border rounded-lg overflow-hidden"
                            >
                              <div className="p-4 bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div {...provided.dragHandleProps}>
                                    <Grip className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <div>
                                    <Input
                                      value={module.title}
                                      onChange={(e) => {
                                        setModules(prev => prev.map((m, i) => 
                                          i === moduleIndex ? { ...m, title: e.target.value } : m
                                        ));
                                      }}
                                      className="font-medium border-0 bg-transparent p-0 text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
                                      placeholder="Module Title"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setModules(prev => prev.filter((_, i) => i !== moduleIndex));
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="p-4">
                                <Textarea
                                  value={module.description}
                                  onChange={(e) => {
                                    setModules(prev => prev.map((m, i) => 
                                      i === moduleIndex ? { ...m, description: e.target.value } : m
                                    ));
                                  }}
                                  placeholder="Module description..."
                                  className="mb-4 resize-none"
                                  rows={2}
                                />
                                
                                <Accordion type="multiple" className="w-full">
                                  <AccordionItem value="lessons" className="border-none">
                                    <AccordionTrigger className="py-2 px-0">
                                      <span className="text-sm font-medium">Lessons ({module.lessons.length})</span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <Droppable droppableId={module.title} type="lesson">
                                        {(provided) => (
                                          <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="space-y-2"
                                          >
                                            {module.lessons.map((lesson, lessonIndex) => (
                                              <Draggable
                                                key={lesson.title}
                                                draggableId={lesson.title}
                                                index={lessonIndex}
                                              >
                                                {(provided) => (
                                                  <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="border rounded-md p-3"
                                                  >
                                                    <div className="flex items-center justify-between mb-2">
                                                      <div className="flex items-center gap-2">
                                                        <div {...provided.dragHandleProps}>
                                                          <Grip className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                        <PlayCircle className="h-4 w-4 text-blue-500" />
                                                        <Input
                                                          value={lesson.title}
                                                          onChange={(e) => {
                                                            setModules(prev => prev.map((m, i) => 
                                                              i === moduleIndex ? { 
                                                                ...m, 
                                                                lessons: m.lessons.map((l, j) => 
                                                                  j === lessonIndex ? { ...l, title: e.target.value } : l
                                                                ) 
                                                              } : m
                                                            ));
                                                          }}
                                                          className="font-medium border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                                                          placeholder="Lesson Title"
                                                        />
                                                      </div>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                          setModules(prev => prev.map((m, i) => 
                                                            i === moduleIndex ? { 
                                                              ...m, 
                                                              lessons: m.lessons.filter((_, j) => j !== lessonIndex) 
                                                            } : m
                                                          ));
                                                        }}
                                                        className="h-6 w-6 p-0"
                                                      >
                                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                      </Button>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-2">
                                                      <Select
                                                        value={lesson.type}
                                                        onValueChange={(value: any) => {
                                                          setModules(prev => prev.map((m, i) => 
                                                            i === moduleIndex ? { 
                                                              ...m, 
                                                              lessons: m.lessons.map((l, j) => 
                                                                j === lessonIndex ? { 
                                                                  ...l, 
                                                                  type: value,
                                                                  content: "", // Reset content when type changes
                                                                  url: "",
                                                                  publicId: ""
                                                                } : l
                                                              ) 
                                                            } : m
                                                          ));
                                                        }}
                                                      >
                                                        <SelectTrigger className="h-8 text-xs">
                                                          <SelectValue placeholder="Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          <SelectItem value="video">Video</SelectItem>
                                                          <SelectItem value="reading">Reading</SelectItem>
                                                          <SelectItem value="assignment">Assignment</SelectItem>
                                                        </SelectContent>
                                                      </Select>
                                                      
                                                      {lesson.type === 'assignment' ? (
                                                        <div className="mt-2">
                                                          <Textarea
                                                            placeholder="Enter assignment details and instructions..."
                                                            className="min-h-[100px] text-sm"
                                                            value={lesson.content}
                                                            onChange={(e) => {
                                                              setModules(prev => prev.map((m, i) => 
                                                                i === moduleIndex ? { 
                                                                  ...m, 
                                                                  lessons: m.lessons.map((l, j) => 
                                                                    j === lessonIndex ? { 
                                                                      ...l, 
                                                                      content: e.target.value
                                                                    } : l
                                                                  ) 
                                                                } : m
                                                              ));
                                                            }}
                                                          />
                                                        </div>
                                                      ) : (lesson.type === 'video' || lesson.type === 'reading') && (
                                                        <div className="flex items-center gap-2 mt-2">
                                                          <Input
                                                            type="file"
                                                            className="h-8 text-xs"
                                                            accept={lesson.type === 'video' ? 'video/*' : '.pdf,.doc,.docx'}
                                                            onChange={async (e) => {
                                                              const file = e.target.files?.[0];
                                                              if (!file) return;

                                                              try {
                                                                const formData = new FormData();
                                                                formData.append('file', file);

                                                                const response = await api.post('/uploads', formData, {
                                                                  headers: {
                                                                    'Content-Type': 'multipart/form-data'
                                                                  }
                                                                });

                                                                setModules(prev => prev.map((m, i) => 
                                                                  i === moduleIndex ? { 
                                                                    ...m, 
                                                                    lessons: m.lessons.map((l, j) => 
                                                                      j === lessonIndex ? { 
                                                                        ...l, 
                                                                        content: response.data.url,
                                                                        url: response.data.url,
                                                                        publicId: response.data.publicId,
                                                                        fileName: file.name,
                                                                        mimeType: file.type
                                                                      } : l
                                                                    ) 
                                                                  } : m
                                                                ));

                                                                toast({
                                                                  title: "Success",
                                                                  description: `${lesson.type === 'video' ? 'Video' : 'Document'} uploaded successfully`,
                                                                });
                                                              } catch (error) {
                                                                console.error('File upload error:', error);
                                                                toast({
                                                                  title: "Error",
                                                                  description: error instanceof Error ? error.message : "Failed to upload file",
                                                                  variant: "destructive",
                                                                });
                                                              }
                                                            }}
                                                          />
                                                          {lesson.fileName && (
                                                            <div className="text-xs text-gray-500">
                                                              {lesson.fileName}
                                                            </div>
                                                          )}
                                                        </div>
                                                      )}

                                                      <div className="flex mt-2">
                                                        <Input 
                                                          type="number"
                                                          className="h-8 text-xs"
                                                          value={lesson.estimatedTime || ''}
                                                          onChange={(e) => {
                                                            const time = parseInt(e.target.value);
                                                            setModules(prev => prev.map((m, i) => 
                                                              i === moduleIndex ? { 
                                                                ...m, 
                                                                lessons: m.lessons.map((l, j) => 
                                                                  j === lessonIndex ? { ...l, estimatedTime: time } : l
                                                                ) 
                                                              } : m
                                                            ));
                                                          }}
                                                          placeholder="Time"
                                                        />
                                                        <div className="ml-1 px-2 bg-gray-100 rounded flex items-center">
                                                          <span className="text-xs">min</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                              </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setModules(prev => prev.map((m, i) => 
                                                  i === moduleIndex ? { 
                                                    ...m, 
                                                    lessons: [...m.lessons, {
                                                      title: `Lesson ${m.lessons.length + 1}`,
                                                      type: "video",
                                                      content: "",
                                                      resources: [],
                                                      estimatedTime: 0,
                                                      completionCriteria: 'view',
                                                      requiredScore: undefined,
                                                      requiredTime: undefined
                                                    } as Lesson]
                                                  } : m
                                                ));
                                              }}
                                              className="w-full mt-2"
                                            >
                                              <Plus className="h-4 w-4 mr-2" /> Add Lesson
                                            </Button>
                                          </div>
                                        )}
                                      </Droppable>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  setModules(prev => [...prev, {
                    title: `Module ${prev.length + 1}`,
                    description: "",
                    lessons: [],
                    prerequisites: []
                  } as Module]);
                }}
                className="mt-4 w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Module
              </Button>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => handleSubmit({ preventDefault: () => {} } as any)}
              disabled={isSubmitting}
            >
              Publish Course
            </Button>
          </div>
        </div>
      </form>
    </MainLayout>
  );
};

export default CreateCourse;
