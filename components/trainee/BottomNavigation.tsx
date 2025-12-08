"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/trainee/dashboard", icon: Home, label: "Home" },
    { href: "/trainee/workouts", icon: Dumbbell, label: "Workout" },
    { href: "/trainee/history", icon: BarChart3, label: "Progress" },
    { href: "/trainee/settings", icon: User, label: "Profile" },
  ];

  const isActive = (href: string) => {
    // Exact match for dashboard
    if (href === "/trainee/dashboard") {
      return pathname === "/trainee/dashboard";
    }
    // For workout pages (both list and execution), "Workout" should be active
    if (href === "/trainee/workouts") {
      return pathname === "/trainee/workouts" || pathname.startsWith("/trainee/workout");
    }
    // For other pages, use startsWith
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full h-20 bg-[#1A1D2E] border-t border-[#2D3142] z-50">
      <nav className="flex h-full items-center justify-around px-4 max-w-[393px] mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center transition-all"
            >
              {active ? (
                <div className="w-14 h-9 bg-[#5B7FFF] rounded-full flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <Icon className="w-7 h-7 text-[#9CA3AF]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}