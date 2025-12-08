"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
  dir?: "ltr" | "rtl";
}

export function LoadingSpinner({ 
  size = "md", 
  text, 
  fullScreen = false,
  className = "",
  dir = "ltr"
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const containerClass = fullScreen 
    ? "min-h-screen w-full bg-[#1A1D2E] flex items-center justify-center"
    : "flex items-center justify-center";

  return (
    <div className={`${containerClass} ${className}`} dir={dir}>
      <div className="text-center space-y-4">
        <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto text-[#5B7FFF]`} />
        {text && (
          <p className="text-[#9CA3AF] font-outfit font-normal text-sm">{text}</p>
        )}
      </div>
    </div>
  );
}

