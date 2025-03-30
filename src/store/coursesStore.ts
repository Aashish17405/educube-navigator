
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: "video" | "quiz" | "reading" | "assignment";
  estimatedTime: string;
  content?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  instructor: string;
  thumbnail?: string;
  modules: Module[];
  createdAt: string;
  enrolled: number;
  progress: number;
  resources: {
    videos: number;
    documents: number;
  };
}

interface CoursesStore {
  courses: Course[];
  addCourse: (course: Omit<Course, 'id' | 'createdAt' | 'enrolled' | 'progress' | 'resources'>) => void;
  getCourse: (id: string) => Course | undefined;
}

export const useCoursesStore = create<CoursesStore>()(
  persist(
    (set, get) => ({
      courses: [
        {
          id: '1',
          title: "Data Science Fundamentals",
          description: "Learn the core concepts of data science including statistics, Python programming, and data analysis techniques.",
          instructor: "Dr. Alan Johnson",
          category: "Data Science",
          difficulty: "intermediate",
          enrolled: 2547,
          modules: [
            {
              id: "module-1",
              title: "Introduction to Data Science",
              description: "An overview of data science concepts",
              lessons: [
                {
                  id: "lesson-1-1",
                  title: "What is Data Science?",
                  type: "video",
                  estimatedTime: "15",
                  content: "Welcome video introducing data science"
                }
              ]
            }
          ],
          createdAt: "2023-01-15T12:00:00Z",
          progress: 65,
          thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          resources: {
            videos: 24,
            documents: 18
          }
        },
        {
          id: '2',
          title: "Advanced React",
          description: "Master advanced React concepts including hooks, context API, and performance optimization techniques.",
          instructor: "Sarah Miller",
          category: "Web Development",
          difficulty: "advanced",
          enrolled: 1893,
          modules: [
            {
              id: "module-1",
              title: "React Hooks",
              description: "Understanding React hooks in depth",
              lessons: [
                {
                  id: "lesson-1-1",
                  title: "Introduction to Hooks",
                  type: "video",
                  estimatedTime: "20",
                  content: "Video introducing React hooks"
                }
              ]
            }
          ],
          createdAt: "2023-02-25T14:30:00Z",
          progress: 42,
          thumbnail: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          resources: {
            videos: 20,
            documents: 15
          }
        }
      ],
      addCourse: (courseData) => {
        const newCourse: Course = {
          ...courseData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          enrolled: 0,
          progress: 0,
          resources: {
            videos: courseData.modules.reduce((total, module) => {
              return total + module.lessons.filter(lesson => lesson.type === 'video').length;
            }, 0),
            documents: courseData.modules.reduce((total, module) => {
              return total + module.lessons.filter(lesson => lesson.type === 'reading').length;
            }, 0)
          }
        };
        
        set((state) => ({
          courses: [...state.courses, newCourse]
        }));
        
        return newCourse.id;
      },
      getCourse: (id) => {
        return get().courses.find(course => course.id === id);
      }
    }),
    {
      name: 'courses-store',
    }
  )
);
