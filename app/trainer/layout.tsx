"use client";

import { usePathname, useRouter } from "next/navigation";
import { 
  Settings, Users, Home, Apple, FileText, LogOut, Dumbbell, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const isActive = (path: string, label: string) => {
    if (label === "דף בית") return pathname === "/trainer";
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: "/trainer", icon: Home, label: "דף בית" },
    { href: "/trainer/trainees", icon: Users, label: "מתאמנים" },
    { href: "/trainer/nutrition-plans", icon: Apple, label: "תזונה" },
    { href: "/trainer/reports", icon: FileText, label: "דוחות" },
    { href: "/trainer/settings", icon: Settings, label: "הגדרות" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col transition-colors duration-300" dir="rtl">
      
      {/* --- Header (Mobile & Desktop) - Enhanced --- */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-all duration-300 shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 mx-auto max-w-screen-xl">
          
          {/* Left Side: Logo - Enhanced with better hover */}
          <Link 
            href="/trainer" 
            className="flex items-center gap-2.5 group transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
              <Dumbbell className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              FitLog <span className="text-blue-600 dark:text-blue-500">Pro</span>
            </span>
          </Link>

          {/* Right Side: User Profile with Enhanced Dropdown */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-all hover:scale-105 active:scale-95">
                  <Avatar className="h-9 w-9 cursor-pointer border-2 border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm hover:shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-600 dark:text-blue-400 font-bold text-sm">
                      {user?.name?.charAt(0).toUpperCase() || "M"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-64 rounded-xl shadow-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2" 
                sideOffset={8}
              >
                <DropdownMenuLabel className="px-3 py-3 mb-1">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {user?.name || "משתמש"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                      {user?.email || ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-slate-800 my-1" />
                <DropdownMenuItem asChild>
                  <Link 
                    href="/trainer/settings" 
                    className="flex items-center gap-3 cursor-pointer px-3 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:bg-gray-100 dark:focus:bg-slate-800"
                  >
                    <Settings className="h-4 w-4" />
                    <span>הגדרות</span>
                    <ChevronRight className="h-4 w-4 mr-auto opacity-50" />
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-slate-800 my-1" />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="flex items-center gap-3 cursor-pointer px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:bg-red-50 dark:focus:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  <span>התנתק</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* --- Desktop Sidebar Navigation (Hidden on Mobile) --- */}
      <div className="hidden lg:flex fixed right-0 top-16 bottom-0 w-64 border-l border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-30">
        <nav className="w-full p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.label);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  active
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
                    : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110"
                )} />
                <span className="text-sm font-medium">{item.label}</span>
                {active && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                )}
                {!active && (
                  <ChevronRight className="h-4 w-4 mr-auto opacity-0 group-hover:opacity-50 transition-opacity" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex max-w-screen-xl mx-auto w-full">
        <main className={cn(
          "flex-1 w-full pb-24 pt-6 px-4 transition-all",
          "lg:mr-64" // Add margin for sidebar on desktop
        )}>
          <ProtectedRoute requiredRole="trainer">
            {children}
          </ProtectedRoute>
        </main>
      </div>

      {/* --- Mobile Bottom Navigation (Enhanced) --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-safe transition-colors duration-300 shadow-lg">
        <nav className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.label);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-1.5 px-1 transition-all duration-200 relative",
                  active
                    ? "text-blue-600 dark:text-blue-500 scale-105"
                    : "text-gray-400 hover:text-gray-900 dark:text-slate-500 dark:hover:text-white scale-100 active:scale-95"
                )}
              >
                <div className={cn(
                  "relative transition-all duration-200",
                  active && "scale-110"
                )}>
                  <Icon className={cn(
                    "h-6 w-6 transition-all duration-200",
                    active && "fill-blue-600/20 dark:fill-blue-500/20 drop-shadow-sm"
                  )} />
                  {active && (
                    <div className="absolute inset-0 bg-blue-600/10 dark:bg-blue-500/10 rounded-full blur-md -z-10" />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  active ? "opacity-100 font-semibold" : "opacity-70"
                )}>
                  {item.label}
                </span>
                {active && (
                  <span className="absolute -bottom-[18px] w-1.5 h-1.5 bg-blue-600 dark:bg-blue-500 rounded-full animate-pulse shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

    </div>
  );
}