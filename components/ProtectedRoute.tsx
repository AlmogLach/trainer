"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "trainer" | "trainee";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Wait for loading to complete
    if (loading) {
      setRedirecting(false);
      return;
    }

    // Don't redirect if already redirecting
    if (redirecting) return;

    // Small delay to ensure React has processed all state updates
    // This prevents race condition where loading=false but user is still null
    const timeoutId = setTimeout(() => {
      if (!user) {
        setRedirecting(true);
        router.push("/auth/login");
      } else if (user && requiredRole && user.role !== requiredRole) {
        setRedirecting(true);
        // Redirect to appropriate dashboard
        if (user.role === "trainer") {
          router.push("/trainer");
        } else {
          router.push("/trainee/dashboard");
        }
      }
    }, 300); // Delay to ensure state is fully settled and user is loaded

    return () => clearTimeout(timeoutId);
  }, [user, loading, router, requiredRole, redirecting]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-6">
          <div className="relative">
            {/* Outer pulsing circle */}
            <div className="absolute inset-0 rounded-full bg-blue-500/20 dark:bg-blue-500/10 animate-ping" />
            {/* Middle pulsing circle */}
            <div className="absolute inset-2 rounded-full bg-blue-500/30 dark:bg-blue-500/20 animate-pulse" />
            {/* Spinner */}
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-base font-bold text-gray-900 dark:text-white">טוען...</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">בודק הרשאות</p>
          </div>
          {/* Loading dots */}
          <div className="flex gap-2 justify-center">
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}

