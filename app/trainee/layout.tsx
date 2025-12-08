"use client";

import { usePathname, useRouter } from "next/navigation";
import { 
  Settings, Home, Apple, FileText, LogOut, Dumbbell, ChevronRight, BarChart3
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardHeader } from "@/components/trainee/DashboardHeader";
import { BottomNavigation } from "@/components/trainee/BottomNavigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function TraineeLayout({
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
    if (label === "Home") return pathname === "/trainee/dashboard";
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: "/trainee/dashboard", icon: Home, label: "Home" },
    { href: "/trainee/workout", icon: Dumbbell, label: "Workout" },
    { href: "/trainee/nutrition", icon: Apple, label: "Nutrition" },
    { href: "/trainee/history", icon: BarChart3, label: "Progress" },
    { href: "/trainee/settings", icon: Settings, label: "Settings" },
  ];

  const isTraineePage = pathname.startsWith("/trainee");
  const isDashboard = pathname === "/trainee/dashboard";
  const isWorkoutPage = pathname === "/trainee/workout" || pathname.startsWith("/trainee/workout/");
  const isWorkoutsPage = pathname === "/trainee/workouts";
  const isSettingsPage = pathname === "/trainee/settings";
  const isAchievementsPage = pathname === "/trainee/achievements";
  const isHistoryPage = pathname === "/trainee/history";

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isTraineePage ? 'bg-[#1A1D2E]' : 'bg-gray-50 dark:bg-slate-950'}`} dir={isTraineePage ? 'ltr' : 'rtl'}>
      
      {/* --- Dashboard Header (All Trainee Pages except dashboard, workout, workouts, settings, achievements, and history - they have their own) --- */}
      {isTraineePage && !isDashboard && !isWorkoutPage && !isWorkoutsPage && !isSettingsPage && !isAchievementsPage && !isHistoryPage && <DashboardHeader />}

      {/* --- Desktop Sidebar Navigation (Hidden on Mobile) --- */}
      {!isTraineePage && (
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
      )}

      {/* --- Main Content Area --- */}
      <div className={cn("flex-1 flex w-full", isTraineePage ? "w-full relative" : "max-w-screen-xl mx-auto")}>
        <main className={cn(
          "flex-1 w-full transition-all",
          isTraineePage 
            ? (isDashboard ? "p-0" : "pb-20") 
            : "pb-24 pt-6 px-4 lg:mr-64" // Add margin for sidebar on desktop
        )}>
          <ProtectedRoute requiredRole="trainee">
            {children}
          </ProtectedRoute>
        </main>
      </div>

      {/* --- Bottom Navigation (All Trainee Pages) --- */}
      {isTraineePage && <BottomNavigation />}

    </div>
  );
}