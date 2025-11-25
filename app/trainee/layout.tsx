"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BarChart3, Apple, Dumbbell, Settings } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TraineeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { href: "/trainee/dashboard", icon: Home, label: "בית" },
    { href: "/trainee/history", icon: BarChart3, label: "התקדמות" },
    { href: "/trainee/nutrition", icon: Apple, label: "תזונה" },
    { href: "/trainee/workout", icon: Dumbbell, label: "אימון" },
    { href: "/trainee/settings", icon: Settings, label: "הגדרות" },
  ];

  // פונקציה לברכת שלום לפי שעה
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "בוקר טוב";
    if (hour < 18) return "צהריים טובים";
    return "ערב טוב";
  };

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <ProtectedRoute requiredRole="trainee">
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex flex-col relative overflow-hidden" dir="rtl">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />

        {/* Enhanced Header with FitLog Branding */}
        <header className="bg-gradient-to-r from-card/95 via-card/90 to-card/95 backdrop-blur-xl border-b border-border/50 sticky top-0 z-20 pt-safe shadow-lg relative">
          {/* Header glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
          
          <div className="px-5 py-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              {/* FitLog Logo */}
              <div className="bg-gradient-to-br from-primary via-primary to-primary/80 p-2.5 rounded-2xl shadow-lg shadow-primary/25 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 animate-pulse" />
                <Dumbbell className="w-6 h-6 text-background relative z-10" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  FitLog
                </h1>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Workout Tracker</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground font-medium">{getGreeting()},</p>
                <p className="font-bold text-foreground text-sm">{user?.name || 'מתאמן'}</p>
              </div>
              <Link href="/trainee/settings">
                <Avatar className="h-11 w-11 border-2 border-primary/30 cursor-pointer hover:border-primary transition-all hover:scale-105 active:scale-95 shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-black text-base">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-24 relative min-h-0 z-10">
          {children}
        </main>

        {/* Enhanced Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card/95 to-card/90 backdrop-blur-xl border-t border-border/50 pb-safe z-50 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.2)]">
          {/* Top glow line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="flex items-center justify-around max-w-lg mx-auto relative px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/trainee/dashboard' && pathname?.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className="flex flex-col items-center gap-1.5 py-3 px-3 flex-1 relative group transition-all"
                >
                  {/* Active Indicator - animated dot */}
                  <div className={`absolute top-1 w-1 h-1 bg-primary rounded-full transition-all duration-300 ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  }`} />
                  
                  {/* Icon Container with background */}
                  <div className={`relative transition-all duration-300 ${
                    isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'
                  }`}>
                    {/* Background glow for active */}
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md scale-150" />
                    )}
                    
                    {/* Icon */}
                    <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary/15' 
                        : 'bg-transparent group-hover:bg-accent/50'
                    }`}>
                      <Icon 
                        className={`h-5 w-5 transition-all duration-300 ${
                          isActive 
                            ? 'text-primary' 
                            : 'text-muted-foreground group-hover:text-foreground'
                        }`} 
                        fill={isActive ? "currentColor" : "none"}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </div>
                  </div>
                  
                  {/* Label */}
                  <span className={`text-[10px] font-bold transition-all duration-300 ${
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

