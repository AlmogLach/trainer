"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is logged in, redirect to appropriate dashboard
    if (!loading && user) {
      if (user.role === "trainer") {
        router.push("/trainer");
      } else if (user.role === "trainee") {
        router.push("/trainee/dashboard");
      }
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  // Don't show home page if user is logged in (will redirect)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-muted-foreground">מעביר...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl border-border bg-card">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-500">
            <span className="text-4xl">💪</span>
          </div>
          <CardTitle className="text-4xl font-black text-foreground">
            FitLog
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground font-medium">
            פלטפורמה מתקדמת לניהול אימונים ותזונה
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/auth/login" className="w-full">
            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-black bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background shadow-lg shadow-primary/20 transition-all active:scale-95 rounded-xl"
            >
              התחברות למערכת
            </Button>
          </Link>
          <Link href="/auth/register" className="w-full">
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full h-14 text-lg font-black border-2 border-border hover:bg-accent text-foreground transition-all active:scale-95 rounded-xl"
            >
              הרשמה למערכת
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
