import React, { useState, useEffect, ChangeEvent, useMemo } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface Resource {
  _id: string;
  title: string;
  description: string;
  type: 'pdf' | 'word' | 'excel' | 'bibtex' | 'video' | 'link';
  url: string;
  fileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  estimatedTime?: number;
  author: {
    _id: string;
    username: string;
  };
  course: {
    _id: string;
    title: string;
  };
}

interface UploadData {
  title: string;
  description: string;
  type: Resource['type'];
  courseId: string;
  estimatedTime: string;
  file: File | null;
}

const Resources: React.FC = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | Resource['type']>('all');
  const [uploadData, setUploadData] = useState<UploadData>({
    title: '',
    description: '',
    type: 'pdf',
    courseId: '',
    estimatedTime: '',
    file: null
  });
  const [courses, setCourses] = useState<Array<{ _id: string; title: string; resources: Resource[] }>>([]);

  useEffect(() => {
    fetchResources();
    fetchCourses();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await api.get<Resource[]>('/resources');
      setResources(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/all');
      const coursesWithResources = response.data;
      setCourses(coursesWithResources);
      
      // Log all course resources
      console.log('=== Course Resources ===');
      console.log(response.data)
      coursesWithResources.forEach(course => {
        console.log(`\nCourse: ${course.title}`);
        console.log('Resources:', course.resources);
      });
      
      // Log total resources count
      const totalResources = coursesWithResources.reduce((total, course) => total + (course.resources?.length || 0), 0);
      console.log('\nTotal course resources:', totalResources);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const handleUpload = async () => {
    try {
      if (!uploadData.file || !uploadData.courseId) {
        setError('Please fill in all required fields');
        return;
      }

      const formData = new FormData();
      Object.entries(uploadData).forEach(([key, value]) => {
        if (value !== null) {
          formData.append(key, value);
        }
      });

      await api.post('/resources', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setOpenDialog(false);
      setUploadData({
        title: '',
        description: '',
        type: 'pdf',
        courseId: '',
        estimatedTime: '',
        file: null
      });
      fetchResources();
      setError(null);
    } catch (err) {
      console.error('Error uploading resource:', err);
      setError('Failed to upload resource');
    }
  };

  const handleView = async (resource: Resource) => {
    try {
      // All resources now have direct URLs from ImageKit
      window.open(resource.url, '_blank');
    } catch (err) {
      console.error('Error viewing resource:', err);
      setError('Failed to view resource');
    }
  };

  const isDocumentType = (type: string) => {
    return ['pdf', 'word', 'excel', 'bibtex'].includes(type);
  };

  const filteredResources = useMemo(() => {
    // Combine standalone resources and course resources
    const allResources = [
      ...resources,
      ...courses.flatMap(course => 
        (course.resources || []).map(resource => ({
          ...resource,
          course: {
            _id: course._id,
            title: course.title
          }
        }))
      )
    ];

    // Remove duplicates based on _id
    const uniqueResources = allResources.filter((resource, index, self) =>
      index === self.findIndex((r) => r._id === resource._id)
    );

    // Apply search and type filters
    return uniqueResources.filter(resource => {
      const matchesSearch = resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Handle document type filtering
      const matchesType = selectedType === 'all' || 
        (selectedType === 'pdf' ? isDocumentType(resource.type) : resource.type === selectedType);
      
      return matchesSearch && matchesType;
    });
  }, [resources, courses, searchQuery, selectedType]);

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Resources</h1>
            <p className="text-muted-foreground mt-1">
              {filteredResources.length} resources found
            </p>
          </div>
          {user?.role === 'instructor' && (
            <Button onClick={() => setOpenDialog(true)}>
              Add Resource
            </Button>
          )}
        </div>

        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as 'all' | Resource['type'])}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pdf">Documents (PDF, Word, Excel, BibTeX)</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="link">Link</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <Card key={resource._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm px-2 py-1 bg-accent rounded-md">
                      {isDocumentType(resource.type) 
                        ? 'Document' 
                        : resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                      {isDocumentType(resource.type) && (
                        <span className="text-xs ml-1 text-muted-foreground">
                          ({resource.type.toUpperCase()})
                        </span>
                      )}
                    </span>
                    {resource.estimatedTime && (
                      <span className="text-sm text-muted-foreground">
                        {resource.estimatedTime} min
                      </span>
                    )}
                  </div>
                  <p className="text-sm mb-4 line-clamp-2">{resource.description}</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1">
                      <span className="font-medium">Course:</span>
                      {resource.course.title}
                    </p>
                    {resource.size && (
                      <p className="flex items-center gap-1">
                        <span className="font-medium">Size:</span>
                        {(resource.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleView(resource)}
                    >
                      {isDocumentType(resource.type) ? 'Open Document' : 'Open Resource'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={uploadData.type}
                  onValueChange={(value) => setUploadData({ ...uploadData, type: value as Resource['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="word">Word</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="bibtex">BibTeX</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="course">Course</Label>
                <Select
                  value={uploadData.courseId}
                  onValueChange={(value) => setUploadData({ ...uploadData, courseId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  value={uploadData.estimatedTime}
                  onChange={(e) => setUploadData({ ...uploadData, estimatedTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadData.title || !uploadData.description || !uploadData.file || !uploadData.courseId}
              >
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Resources;
