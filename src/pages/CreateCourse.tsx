import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  BookText
} from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useCoursesStore, Module, Lesson } from "@/store/coursesStore";

const CreateCourse = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const addCourse = useCoursesStore(state => state.addCourse);
  
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  
  const [modules, setModules] = useState<Module[]>([
    {
      id: "module-1",
      title: "Introduction to the Course",
      description: "An overview of what you'll learn",
      lessons: [
        {
          id: "lesson-1-1",
          title: "Welcome and Course Overview",
          type: "video",
          estimatedTime: "15",
          content: "Welcome video introducing the course"
        },
        {
          id: "lesson-1-2",
          title: "Getting Started",
          type: "reading",
          estimatedTime: "20",
          content: "Essential reading material to get started"
        }
      ]
    }
  ]);
  
  const addModule = () => {
    const newModule: Module = {
      id: `module-${modules.length + 1}`,
      title: `Module ${modules.length + 1}`,
      description: "",
      lessons: []
    };
    setModules([...modules, newModule]);
  };
  
  const removeModule = (moduleId: string) => {
    setModules(modules.filter(module => module.id !== moduleId));
  };
  
  const addLesson = (moduleId: string) => {
    const updatedModules = modules.map(module => {
      if (module.id === moduleId) {
        const newLesson: Lesson = {
          id: `lesson-${moduleId}-${module.lessons.length + 1}`,
          title: `Lesson ${module.lessons.length + 1}`,
          type: "reading",
          estimatedTime: "30"
        };
        return {
          ...module,
          lessons: [...module.lessons, newLesson]
        };
      }
      return module;
    });
    setModules(updatedModules);
  };
  
  const removeLesson = (moduleId: string, lessonId: string) => {
    const updatedModules = modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
        };
      }
      return module;
    });
    setModules(updatedModules);
  };
  
  const updateModule = (moduleId: string, field: keyof Module, value: string) => {
    const updatedModules = modules.map(module => {
      if (module.id === moduleId) {
        return { ...module, [field]: value };
      }
      return module;
    });
    setModules(updatedModules);
  };
  
  const updateLesson = (
    moduleId: string, 
    lessonId: string, 
    field: keyof Lesson, 
    value: string
  ) => {
    const updatedModules = modules.map(module => {
      if (module.id === moduleId) {
        const updatedLessons = module.lessons.map(lesson => {
          if (lesson.id === lessonId) {
            return { ...lesson, [field]: value };
          }
          return lesson;
        });
        return { ...module, lessons: updatedLessons };
      }
      return module;
    });
    setModules(updatedModules);
  };
  
  const onDragEnd = (result: DropResult) => {
    const { destination, source, type } = result;
    
    if (!destination) return;
    
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    if (type === "module") {
      const reorderedModules = Array.from(modules);
      const [removed] = reorderedModules.splice(source.index, 1);
      reorderedModules.splice(destination.index, 0, removed);
      setModules(reorderedModules);
      return;
    }
    
    const sourceModuleId = source.droppableId;
    const destModuleId = destination.droppableId;
    
    const sourceModule = modules.find(m => m.id === sourceModuleId);
    const destModule = modules.find(m => m.id === destModuleId);
    
    if (!sourceModule || !destModule) return;
    
    if (sourceModuleId === destModuleId) {
      const newLessons = Array.from(sourceModule.lessons);
      const [removed] = newLessons.splice(source.index, 1);
      newLessons.splice(destination.index, 0, removed);
      
      const newModules = modules.map(module => {
        if (module.id === sourceModuleId) {
          return { ...module, lessons: newLessons };
        }
        return module;
      });
      
      setModules(newModules);
    } else {
      const sourceModuleLessons = Array.from(sourceModule.lessons);
      const [removed] = sourceModuleLessons.splice(source.index, 1);
      
      const destModuleLessons = Array.from(destModule.lessons);
      destModuleLessons.splice(destination.index, 0, removed);
      
      const newModules = modules.map(module => {
        if (module.id === sourceModuleId) {
          return { ...module, lessons: sourceModuleLessons };
        }
        if (module.id === destModuleId) {
          return { ...module, lessons: destModuleLessons };
        }
        return module;
      });
      
      setModules(newModules);
    }
  };
  
  const getLessonIcon = (type: Lesson["type"]) => {
    switch (type) {
      case "video":
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case "quiz":
        return <FileQuestion className="h-4 w-4 text-green-500" />;
      case "reading":
        return <BookText className="h-4 w-4 text-amber-500" />;
      case "assignment":
        return <FileUp className="h-4 w-4 text-purple-500" />;
      default:
        return <BookText className="h-4 w-4" />;
    }
  };
  
  const handleSaveAsDraft = () => {
    if (!courseTitle) {
      toast({
        title: "Missing Information",
        description: "Please provide a course title",
        variant: "destructive"
      });
      return;
    }
    
    const courseId = addCourse({
      title: courseTitle,
      description: courseDescription,
      category: category || "Uncategorized",
      difficulty: difficulty || "beginner",
      instructor: "Jane Doe",
      modules,
      thumbnail: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    });
    
    toast({
      title: "Success!",
      description: "Course saved as draft"
    });
    
    navigate("/courses");
  };
  
  const handlePublish = () => {
    if (!courseTitle || !courseDescription || !category || !difficulty) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (modules.length === 0) {
      toast({
        title: "No Modules",
        description: "Your course needs at least one module",
        variant: "destructive"
      });
      return;
    }
    
    const emptyModules = modules.filter(module => module.lessons.length === 0);
    if (emptyModules.length > 0) {
      toast({
        title: "Empty Modules",
        description: `${emptyModules.length} module(s) have no lessons`,
        variant: "destructive"
      });
      return;
    }
    
    const courseId = addCourse({
      title: courseTitle,
      description: courseDescription,
      category,
      difficulty,
      instructor: "Jane Doe",
      modules,
      thumbnail: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    });
    
    toast({
      title: "Success!",
      description: "Course published successfully"
    });
    
    navigate("/courses");
  };
  
  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create Learning Path</h1>
          <p className="text-muted-foreground">Design and structure a new course for your learners</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
                <CardDescription>Basic information about your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label htmlFor="description">Course Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Enter course description" 
                    className="mt-1"
                    rows={4}
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="thumbnail">Course Thumbnail</Label>
                  <div className="mt-1 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <FileUp className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a thumbnail image for your course
                    </p>
                    <Button variant="outline">Upload Image</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>Organize your course into modules and lessons</CardDescription>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="modules" type="module">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {modules.map((module, moduleIndex) => (
                          <Draggable
                            key={module.id}
                            draggableId={module.id}
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
                                        onChange={(e) => updateModule(module.id, "title", e.target.value)}
                                        className="font-medium border-0 bg-transparent p-0 text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
                                        placeholder="Module Title"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeModule(module.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="p-4">
                                  <Textarea
                                    value={module.description}
                                    onChange={(e) => updateModule(module.id, "description", e.target.value)}
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
                                        <Droppable droppableId={module.id} type="lesson">
                                          {(provided) => (
                                            <div
                                              {...provided.droppableProps}
                                              ref={provided.innerRef}
                                              className="space-y-2"
                                            >
                                              {module.lessons.map((lesson, lessonIndex) => (
                                                <Draggable
                                                  key={lesson.id}
                                                  draggableId={lesson.id}
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
                                                          {getLessonIcon(lesson.type)}
                                                          <Input
                                                            value={lesson.title}
                                                            onChange={(e) => updateLesson(module.id, lesson.id, "title", e.target.value)}
                                                            className="font-medium border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                                                            placeholder="Lesson Title"
                                                          />
                                                        </div>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => removeLesson(module.id, lesson.id)}
                                                          className="h-6 w-6 p-0"
                                                        >
                                                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                        </Button>
                                                      </div>
                                                      
                                                      <div className="grid grid-cols-2 gap-2">
                                                        <Select
                                                          value={lesson.type}
                                                          onValueChange={(value: any) => updateLesson(
                                                            module.id, 
                                                            lesson.id, 
                                                            "type", 
                                                            value
                                                          )}
                                                        >
                                                          <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue placeholder="Type" />
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            <SelectItem value="video">Video</SelectItem>
                                                            <SelectItem value="reading">Reading</SelectItem>
                                                            <SelectItem value="quiz">Quiz</SelectItem>
                                                            <SelectItem value="assignment">Assignment</SelectItem>
                                                          </SelectContent>
                                                        </Select>
                                                        
                                                        <div className="flex">
                                                          <Input 
                                                            type="number"
                                                            className="h-8 text-xs"
                                                            value={lesson.estimatedTime}
                                                            onChange={(e) => updateLesson(
                                                              module.id, 
                                                              lesson.id, 
                                                              "estimatedTime", 
                                                              e.target.value
                                                            )}
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
                                                onClick={() => addLesson(module.id)}
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
                  variant="outline"
                  onClick={addModule}
                  className="mt-4 w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Module
                </Button>
              </CardContent>
            </Card>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleSaveAsDraft}>Save as Draft</Button>
              <Button onClick={handlePublish}>Publish Course</Button>
            </div>
          </div>
          
          <div>
            <div className="sticky top-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Path Preview</CardTitle>
                  <CardDescription>Module and lesson structure</CardDescription>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto pr-0">
                  {modules.map((module, index) => (
                    <div key={module.id} className="mb-4">
                      <div className="font-medium text-sm mb-2 flex items-center gap-2">
                        <div className="bg-primary-100 text-primary-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <span>{module.title}</span>
                      </div>
                      
                      <div className="pl-8 border-l border-gray-200 ml-3 space-y-1.5">
                        {module.lessons.map((lesson, i) => (
                          <div key={lesson.id} className="text-sm flex items-center gap-2">
                            {getLessonIcon(lesson.type)}
                            <span className="text-muted-foreground">{lesson.title}</span>
                          </div>
                        ))}
                        
                        {module.lessons.length === 0 && (
                          <div className="text-xs text-muted-foreground italic">
                            No lessons added yet
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Course Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Modules:</span>
                      <span className="font-medium">{modules.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Lessons:</span>
                      <span className="font-medium">
                        {modules.reduce((total, module) => total + module.lessons.length, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Est. Duration:</span>
                      <span className="font-medium">
                        {modules.reduce((total, module) => {
                          return total + module.lessons.reduce((lessonTotal, lesson) => {
                            return lessonTotal + parseInt(lesson.estimatedTime || "0", 10);
                          }, 0);
                        }, 0)} minutes
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateCourse;
