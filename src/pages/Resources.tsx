import React, { useState, useEffect, ChangeEvent } from 'react';
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
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'other';
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
  createdAt: string;
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
    type: 'document',
    courseId: '',
    estimatedTime: '',
    file: null
  });
  const [courses, setCourses] = useState<Array<{ _id: string; title: string }>>([]);

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
      const response = await api.get('/courses');
      setCourses(response.data);
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
        type: 'document',
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

  const handleDownload = async (resource: Resource) => {
    try {
      const response = await api.get(`/resources/${resource._id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resource.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading resource:', err);
      setError('Failed to download resource');
    }
  };

  const handleView = async (resource: Resource) => {
    try {
      const response = await api.get(`/resources/${resource._id}/view`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error viewing resource:', err);
      setError('Failed to view resource');
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Resources</h1>
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
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="assignment">Assignment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
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
              <Card key={resource._id}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Type: {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                  </p>
                  <p className="text-sm mb-4">{resource.description}</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Course: {resource.course.title}</p>
                    <p>Size: {(resource.size / 1024 / 1024).toFixed(2)} MB</p>
                    {resource.estimatedTime && (
                      <p>Estimated Time: {resource.estimatedTime} minutes</p>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleView(resource)}
                    >
                      View Resource
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleDownload(resource)}
                    >
                      Download
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
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
