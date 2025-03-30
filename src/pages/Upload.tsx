
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  FileUp, 
  Link, 
  Plus, 
  Trash2,
  BookOpen,
  Files,
  Clock
} from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useState } from "react";

const Upload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => file.name);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };
  
  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };
  
  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Upload Resources</h1>
          <p className="text-muted-foreground">Add learning materials for your courses</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload Learning Material</CardTitle>
                <CardDescription>Add files, links, or citations to your courses</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="file">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="file">File Upload</TabsTrigger>
                    <TabsTrigger value="link">External Link</TabsTrigger>
                    <TabsTrigger value="citation">Citation (BibTeX)</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="file">
                    <div className="space-y-6">
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor="title">Title</Label>
                          <Input id="title" placeholder="Enter resource title" className="mt-1" />
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" placeholder="Enter a brief description" className="mt-1" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="course">Course</Label>
                            <Select>
                              <SelectTrigger id="course" className="mt-1">
                                <SelectValue placeholder="Select course" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="data-science">Data Science Fundamentals</SelectItem>
                                <SelectItem value="react">Advanced React</SelectItem>
                                <SelectItem value="machine-learning">Machine Learning Algorithms</SelectItem>
                                <SelectItem value="ui-ux">UI/UX Design Principles</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="estimated-time">Estimated Time</Label>
                            <div className="flex mt-1">
                              <Input id="estimated-time" type="number" placeholder="Minutes" />
                              <div className="ml-2 px-3 bg-primary-50 flex items-center rounded-md">
                                <span className="text-sm text-primary-700">minutes</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Upload Files</Label>
                          <div className="mt-1 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                            <FileUp className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                            <p className="text-sm text-muted-foreground mb-4">
                              Drag and drop your files here, or click to browse
                            </p>
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              id="file-upload"
                              onChange={handleFileUpload}
                            />
                            <label htmlFor="file-upload">
                              <Button variant="outline" className="gap-2" onClick={() => document.getElementById('file-upload')?.click()}>
                                <Plus className="h-4 w-4" /> Select Files
                              </Button>
                            </label>
                          </div>
                        </div>
                        
                        {uploadedFiles.length > 0 && (
                          <div>
                            <Label>Selected Files</Label>
                            <div className="mt-1 space-y-2">
                              {uploadedFiles.map((file, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                                  <div className="flex items-center gap-2">
                                    <Files className="h-5 w-5 text-primary-600" />
                                    <span className="text-sm">{file}</span>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => removeFile(index)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <Button className="mt-2 w-full">Upload Resources</Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="link">
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="link-title">Title</Label>
                        <Input id="link-title" placeholder="Enter resource title" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label htmlFor="link-url">URL</Label>
                        <Input id="link-url" placeholder="https://example.com" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label htmlFor="link-description">Description</Label>
                        <Textarea id="link-description" placeholder="Enter a brief description" className="mt-1" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="link-course">Course</Label>
                          <Select>
                            <SelectTrigger id="link-course" className="mt-1">
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="data-science">Data Science Fundamentals</SelectItem>
                              <SelectItem value="react">Advanced React</SelectItem>
                              <SelectItem value="machine-learning">Machine Learning Algorithms</SelectItem>
                              <SelectItem value="ui-ux">UI/UX Design Principles</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="link-estimated-time">Estimated Time</Label>
                          <div className="flex mt-1">
                            <Input id="link-estimated-time" type="number" placeholder="Minutes" />
                            <div className="ml-2 px-3 bg-primary-50 flex items-center rounded-md">
                              <span className="text-sm text-primary-700">minutes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button className="w-full">Add Link Resource</Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="citation">
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="bibtex-title">Title</Label>
                        <Input id="bibtex-title" placeholder="Enter citation title" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label htmlFor="bibtex-content">BibTeX Content</Label>
                        <Textarea 
                          id="bibtex-content" 
                          placeholder="Paste BibTeX content here..." 
                          className="mt-1 font-mono text-sm" 
                          rows={8}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="bibtex-course">Course</Label>
                          <Select>
                            <SelectTrigger id="bibtex-course" className="mt-1">
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="data-science">Data Science Fundamentals</SelectItem>
                              <SelectItem value="react">Advanced React</SelectItem>
                              <SelectItem value="machine-learning">Machine Learning Algorithms</SelectItem>
                              <SelectItem value="ui-ux">UI/UX Design Principles</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="bibtex-estimated-time">Estimated Time</Label>
                          <div className="flex mt-1">
                            <Input id="bibtex-estimated-time" type="number" placeholder="Minutes" />
                            <div className="ml-2 px-3 bg-primary-50 flex items-center rounded-md">
                              <span className="text-sm text-primary-700">minutes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button className="w-full">Add Citation</Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resource Guidelines</CardTitle>
                <CardDescription>Tips for adding effective learning resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="bg-primary-50 p-2 rounded-full h-min">
                      <BookOpen className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Clear Titles</h3>
                      <p className="text-xs text-muted-foreground">
                        Use descriptive titles that clearly indicate the content
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="bg-primary-50 p-2 rounded-full h-min">
                      <Files className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">File Formats</h3>
                      <p className="text-xs text-muted-foreground">
                        We support PDFs, Word docs, Excel sheets, videos, and BibTeX
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="bg-primary-50 p-2 rounded-full h-min">
                      <Link className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Quality Links</h3>
                      <p className="text-xs text-muted-foreground">
                        Ensure external links point to reliable and relevant sources
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="bg-primary-50 p-2 rounded-full h-min">
                      <Clock className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Estimated Time</h3>
                      <p className="text-xs text-muted-foreground">
                        Provide realistic time estimates for consuming the content
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Upload;
