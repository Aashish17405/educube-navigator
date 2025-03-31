import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/OIP-removebg-preview.png"
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
  PlusCircle,
  Users,
  GraduationCap,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  // Common navigation items (available to both learners and instructors)
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
      icon: PlusCircle,
    }
  ];

  // Determine which menu items to show based on user role
  const menuItems = [...commonItems, ...(user?.role === "instructor" ? instructorItems : [])];

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="py-4 px-6 flex flex-col items-center gap-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} width={32} height={32} />
            <span className="font-semibold text-lg">EduCube</span>
          </div>
          {isMobile && <SidebarTrigger />}
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
                    <Link 
                      to={item.url} 
                      className="flex items-center gap-3"
                    >
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

      <SidebarFooter className="p-4 space-y-4">
        <div className="flex items-center gap-3 rounded-md p-2">
          <Avatar>
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.username || 'User'}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role || 'Guest'}</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full flex items-center gap-2" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
