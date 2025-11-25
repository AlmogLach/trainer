"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BarChart3, Apple, Dumbbell, Settings, Menu, X, LogOut } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function TraineeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const navItems = [
    { href: "/trainee/dashboard", icon: Home, label: "דף בית" },
    { href: "/trainee/workout", icon: Dumbbell, label: "אימון" },
    { href: "/trainee/nutrition", icon: Apple, label: "תזונה" },
    { href: "/trainee/history", icon: BarChart3, label: "התקדמות" },
    { href: "/trainee/settings", icon: Settings, label: "הגדרות" },
  ];

  const isActive = (path: string, label: string) => {
    if (label === "דף בית") {
      return pathname === "/trainee/dashboard";
    }
    return pathname === path || pathname?.startsWith(path);
  };

  return (
    <ProtectedRoute requiredRole="trainee">
      <div className="min-h-screen bg-background flex" dir="rtl">
        {/* Enhanced Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-card to-card/95 border-l-2 border-border fixed right-0 top-0 h-full z-30 shadow-2xl">
          <div className="p-6 border-b-2 border-border bg-gradient-to-r from-primary/10 to-primary/5">
            <h2 className="text-2xl font-black text-foreground">
              <span className="text-primary">FitLog</span> 💪
            </h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Trainee Dashboard</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.label);
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    active
                      ? "bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary/30 text-primary font-black shadow-lg shadow-primary/10"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground font-bold"
                  }`}
                >
                  <div className={`${active ? 'bg-primary/20 p-1.5 rounded-lg' : ''}`}>
                    <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t-2 border-border">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10 font-bold rounded-xl transition-all active:scale-95"
            >
              <div className="bg-red-500/20 p-1.5 rounded-lg ml-2">
                <LogOut className="h-5 w-5 text-red-500" />
              </div>
              <span>התנתק</span>
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:mr-64 transition-all duration-200">
          {/* Enhanced Header */}
          <header className="bg-gradient-to-r from-card to-card/95 border-b-2 border-border sticky top-0 z-20 pt-safe shadow-lg backdrop-blur-sm">
            <div className="px-4 lg:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all active:scale-95"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-black lg:hidden">
                  <span className="text-primary">FitLog</span> 💪
                </h1>
              </div>
              
              {/* Enhanced User Profile Section */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <p className="text-sm font-bold text-foreground">
                    שלום, {user?.name || "מתאמן"}! 👋
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center text-primary font-black text-lg border-2 border-primary/30 shadow-lg hover:scale-105 transition-transform cursor-pointer">
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
                    <span className="text-primary">FitLog</span> 💪
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
          <div>
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

