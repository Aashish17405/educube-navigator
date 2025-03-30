
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  Upload,
  Compass,
  Users,
  GraduationCap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppSidebar() {
  const isMobile = useIsMobile();
  const [role, setRole] = useState<"instructor" | "learner">("learner");

  const toggleRole = () => {
    setRole(role === "instructor" ? "learner" : "instructor");
  };

  // Common navigation items
  const commonItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "My Courses",
      url: "/courses",
      icon: BookOpen,
    },
    {
      title: "Resources",
      url: "/resources",
      icon: FileText,
    },
  ];

  // Instructor-specific items
  const instructorItems = [
    {
      title: "Create Course",
      url: "/create-course",
      icon: Compass,
    },
    {
      title: "Upload Resources",
      url: "/upload",
      icon: Upload,
    },
    {
      title: "Students",
      url: "/students",
      icon: Users,
    },
  ];

  // Determine which menu items to show based on role
  const menuItems = [...commonItems, ...(role === "instructor" ? instructorItems : [])];

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="py-4 px-6 flex flex-col items-center gap-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary-600" />
            <span className="font-semibold text-lg">EduCube</span>
          </div>
          {isMobile && <SidebarTrigger />}
        </div>
        
        <div className="w-full pt-4">
          <Button
            onClick={toggleRole}
            variant="outline"
            className="w-full text-sm"
          >
            Switch to {role === "instructor" ? "Learner" : "Instructor"} View
          </Button>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 rounded-md p-2">
          <Avatar>
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Jane Doe</span>
            <span className="text-xs text-muted-foreground capitalize">{role}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
