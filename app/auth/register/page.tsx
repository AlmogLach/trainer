"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, MessageCircle, ArrowRight, CheckCircle2, Users } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "trainer") {
        router.push("/trainer");
      } else if (user.role === "trainee") {
        router.push("/trainee/dashboard");
      }
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary relative" />
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">בודק התחברות...</p>
        </div>
      </div>
    );
  }

  // Don't show register form if already logged in
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md shadow-xl border-border bg-card">
          <CardHeader className="text-center space-y-3 pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">אתה כבר מחובר!</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              אתה מחובר כ-<span className="font-semibold text-foreground">{user.name}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                if (user.role === "trainer") {
                  router.push("/trainer");
                } else {
                  router.push("/trainee/dashboard");
                }
              }}
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all"
            >
              עבור לדף שלי
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleWhatsAppClick = () => {
    const phoneNumber = "972522249162";
    const message = encodeURIComponent("היי! אני מעוניין/ת להירשם למערכת FitLog");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header with Logo */}
      <div className="pt-8 pb-4 px-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          FitLog
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-border bg-card">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-500">
              <Users className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-black text-foreground">
              הצטרף ל-FitLog
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              מאמנים ומתאמנים - צרו איתנו קשר להצטרפות!
            </CardDescription>
            <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-3">
              <p className="text-sm font-bold text-primary">
                💡 ההרשמה למערכת מתבצעת באישור אישי
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Benefits Section */}
            <div className="space-y-4 bg-accent/30 rounded-2xl p-5 border-2 border-border">
              <h3 className="font-black text-foreground text-lg mb-3">מה תקבל במערכת?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-green-500/20 p-1.5 rounded-lg mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">מעקב אימונים מתקדם</p>
                    <p className="text-sm text-muted-foreground">תיעוד מפורט של כל אימון והתקדמות</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-500/20 p-1.5 rounded-lg mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">תוכניות תזונה מותאמות</p>
                    <p className="text-sm text-muted-foreground">תפריט יומי עם מעקב קלוריות</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-500/20 p-1.5 rounded-lg mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">ליווי אישי של מאמן</p>
                    <p className="text-sm text-muted-foreground">תמיכה מקצועית לאורך כל הדרך</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-500/20 p-1.5 rounded-lg mt-0.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">גרפים והתקדמות</p>
                    <p className="text-sm text-muted-foreground">מעקב ויזואלי אחר השיפור שלך</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Button */}
            <Button
              onClick={handleWhatsAppClick}
              className="w-full h-16 text-lg font-black bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl shadow-green-500/30 transition-all active:scale-95 rounded-xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <div className="relative flex items-center justify-center gap-2">
                <MessageCircle className="h-6 w-6" />
                <span>שלח הודעה בווצאפ להרשמה</span>
              </div>
            </Button>

            {/* Contact Info */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                או התקשר ישירות:
              </p>
              <a 
                href="tel:+972522249162"
                className="text-primary font-bold text-lg hover:underline"
              >
                052-224-9162
              </a>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground font-medium">
                  כבר יש לך חשבון?
                </span>
              </div>
            </div>

            {/* Login Link */}
            <Link href="/auth/login" className="block">
              <Button
                variant="outline"
                className="w-full h-12 text-base border-2 border-border hover:bg-accent text-foreground font-bold transition-all rounded-xl"
              >
                התחבר למערכת
                <ArrowRight className="h-5 w-5 mr-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2024 FitLog. כל הזכויות שמורות.
        </p>
      </div>
    </div>
  );
}
