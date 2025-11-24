"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  User, Settings, Menu, X, Mail, Bell, 
  Users, Home, Apple, FileText, LogOut
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const isActive = (path: string, label: string) => {
    // Special handling for home page - only active on exact match
    if (label === "דף בית") {
      return pathname === "/trainer";
    }
    // Special handling for "ניהול מתאמנים" - active on /trainer/trainees
    if (label === "ניהול מתאמנים") {
      return pathname === "/trainer/trainees" || pathname.startsWith("/trainer/trainees/");
    }
    // Special handling for "הגדרות" - active on /trainer/settings
    if (label === "הגדרות") {
      return pathname === "/trainer/settings" || pathname.startsWith("/trainer/settings/");
    }
    // Special handling for "דוחות" - active on /trainer/reports
    if (label === "דוחות") {
      return pathname === "/trainer/reports" || pathname.startsWith("/trainer/reports/");
    }
    // For other items that point to /trainer, they should not be active unless we're on that exact page
    // Since they don't have dedicated pages yet, they should not be active
    if (path === "/trainer" && label !== "דף בית") {
      return false;
    }
    // For other items with specific paths, check if pathname starts with the path
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: "/trainer", icon: Home, label: "דף בית" },
    { href: "/trainer/trainees", icon: Users, label: "ניהול מתאמנים" },
    { href: "/trainer/nutrition-plans", icon: Apple, label: "תוכניות תזונה" },
    { href: "/trainer/reports", icon: FileText, label: "דוחות" },
    { href: "/trainer/settings", icon: Settings, label: "הגדרות" },
  ];

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-l border-border fixed right-0 top-0 h-full z-30 shadow-xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            Universal <span className="text-primary">FitLog</span>
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.label);
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  active
                    ? "bg-primary/10 border border-primary/20 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 ml-2" />
            <span>התנתק</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:mr-64 transition-all duration-200">
        {/* Header */}
        <header className="bg-card border-b border-border sticky top-0 z-20 pt-safe">
          <div className="px-4 lg:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-muted-foreground hover:text-foreground"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <h1 className="text-xl font-bold lg:hidden">
                <span className="text-foreground">Universal </span>
                <span className="text-primary">FitLog</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                <Mail className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20">
                {user?.name?.charAt(0) || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
              onClick={() => setSidebarOpen(false)}
            ></div>
            <aside className="absolute right-0 top-0 w-72 h-full bg-card border-l border-border shadow-2xl animate-in slide-in-from-right">
              <div className="p-6 border-b border-border flex items-center justify-between pt-safe">
                <h2 className="text-xl font-bold text-foreground">
                  Universal <span className="text-primary">FitLog</span>
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.label);
                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        active
                          ? "bg-primary/10 border border-primary/20 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-border absolute bottom-0 left-0 right-0 pb-safe">
                <Button
                  variant="ghost"
                  onClick={async () => {
                    setSidebarOpen(false);
                    await handleSignOut();
                  }}
                  className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-5 w-5 ml-2" />
                  <span>התנתק</span>
                </Button>
              </div>
            </aside>
          </div>
        )}

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
