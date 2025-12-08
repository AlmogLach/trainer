"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "fitlog_onboarding_completed";

const onboardingScreens = [
  {
    id: 1,
    title: "Workout Anywhere",
    description: "Be comfortable working out from anyplace convenient for you",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=1200&fit=crop",
    buttonText: "Next",
  },
  {
    id: 2,
    title: "Set Goals",
    description: "Create personal fitness goals to push yourself a little extra mile",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=1200&fit=crop",
    buttonText: "Next",
  },
  {
    id: 3,
    title: "Track your Progress",
    description: "Monitor your progress and compare to see how better you're becoming",
    image: "https://images.unsplash.com/photo-1549472654-76a7a9190e53?w=800&h=1200&fit=crop",
    buttonText: "Get Started",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState(0);

  const handleNext = () => {
    if (currentScreen < onboardingScreens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      // Mark onboarding as completed
      if (typeof window !== "undefined") {
        localStorage.setItem(ONBOARDING_KEY, "true");
      }
      router.push("/");
    }
  };

  const handleSkip = () => {
    // Mark onboarding as completed
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_KEY, "true");
    }
    router.push("/");
  };

  const current = onboardingScreens[currentScreen];

  return (
    <div className="relative w-full h-screen overflow-hidden" dir="ltr">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={current.image}
          alt={current.title}
          className="w-full h-full object-cover"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Skip Button */}
        {currentScreen < onboardingScreens.length - 1 && (
          <div className="absolute top-6 right-4 z-20">
            <button
              onClick={handleSkip}
              className="text-white text-sm font-outfit font-semibold hover:opacity-80 transition-opacity"
            >
              Skip
            </button>
          </div>
        )}

        {/* Progress Indicators */}
        <div className="flex items-center justify-center gap-2 px-4 pt-8">
          {onboardingScreens.map((_, index) => (
            <div
              key={index}
              className={`
                transition-all duration-300
                ${index === currentScreen 
                  ? "w-8 h-1.5 bg-white rounded-full" 
                  : "w-1.5 h-1.5 bg-white/50 rounded-full"
                }
              `}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-end px-6 pb-8">
          <div className="space-y-4 mb-8">
            <h1 className="text-3xl font-outfit font-bold text-white text-center">
              {current.title}
            </h1>
            <p className="text-base font-outfit font-normal text-white text-center leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Next/Get Started Button */}
          <Button
            onClick={handleNext}
            className="w-full h-12 bg-primary-g4 hover:bg-primary-g4/90 text-white font-outfit font-semibold rounded-xl transition-all"
          >
            {current.buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Export function to check if onboarding is completed
export function isOnboardingCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

// Export function to reset onboarding (for testing)
export function resetOnboarding() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ONBOARDING_KEY);
  }
}

