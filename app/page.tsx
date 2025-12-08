"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail } from "lucide-react";
import { isOnboardingCompleted } from "@/app/onboarding/page";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    // Check onboarding status first
    if (typeof window !== "undefined") {
      const onboardingCompleted = isOnboardingCompleted();
      if (!onboardingCompleted) {
        router.push("/onboarding");
        return;
      }
      setCheckingOnboarding(false);
    }
  }, [router]);

  useEffect(() => {
    // If user is logged in, redirect to appropriate dashboard
    if (!loading && !checkingOnboarding && user) {
      if (user.role === "trainer") {
        router.push("/trainer");
      } else if (user.role === "trainee") {
        router.push("/trainee/dashboard");
      }
    }
  }, [user, loading, checkingOnboarding, router]);

  // Show loading while checking onboarding or auth
  if (checkingOnboarding || loading) {
    return <LoadingSpinner fullScreen text="Loading..." size="md" dir="ltr" />;
  }

  // Don't show home page if user is logged in (will redirect)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grey-g6" dir="ltr">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-g4" />
          <p className="mt-2 text-grey-g2 font-outfit font-normal">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden" dir="ltr">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"></div>
        <img
          src="https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&h=1200&fit=crop&q=80"
          alt="Runner on road"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 1 }}
          onError={(e) => {
            // Fallback if image fails
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40" style={{ zIndex: 2 }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Logo */}
        <div className="flex justify-center pt-20 pb-12">
          <div className="flex flex-col items-center">
            {/* Stylized F/Wave Logo */}
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Two curved parallel horizontal lines (wave/F shape) */}
              <path
                d="M15 30 Q40 20, 65 30"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M15 45 Q40 35, 65 45"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              {/* Small solid circle directly below the lower line */}
              <circle cx="40" cy="58" r="5" fill="white" />
            </svg>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-end px-6 pb-12">
          <div className="space-y-6">
            {/* Welcome Text */}
            <div className="space-y-3 text-left">
              <h1 className="text-4xl font-outfit font-bold text-white">
                Welcome
              </h1>
              <p className="text-base font-outfit font-normal text-white leading-relaxed max-w-sm">
                Hop in to achieve your fitness dreams with our carefully crafted fitness programs for you
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-4">
              {/* Continue with E-mail Button */}
              <Link href="/auth/login" className="block">
                <Button
                  className="w-full h-14 bg-primary-g4 hover:bg-primary-g4/90 text-white font-outfit font-semibold rounded-xl transition-all flex items-center justify-start gap-3 pl-4"
                >
                  <Mail className="h-5 w-5" />
                  Continue with E-mail
                </Button>
              </Link>

              {/* Continue with Google Button */}
              <Button
                variant="outline"
                className="w-full h-14 border-2 border-white/30 bg-grey-g5/50 backdrop-blur-sm hover:bg-grey-g5/70 text-white font-outfit font-semibold rounded-xl transition-all flex items-center justify-start gap-3 pl-4"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Google login - coming soon');
                }}
              >
                <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-[#4285F4] font-bold text-xs">G</span>
                </div>
                Continue with Google
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
