"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleClose = () => {
    router.push("/auth/login");
  };

  // Show loading while checking auth
  if (authLoading) {
    return <LoadingSpinner fullScreen text="Checking authentication..." size="lg" dir="ltr" />;
  }

  // Don't show register form if already logged in
  if (user) {
    return (
      <div className="min-h-screen bg-grey-g6 flex items-center justify-center p-4" dir="ltr">
        <div className="w-full max-w-md bg-grey-g5 rounded-xl p-6 shadow-lg">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-outfit font-semibold text-white">Already Logged In!</h2>
            <p className="text-grey-g2 font-outfit font-normal">
              You are logged in as <span className="font-semibold text-white">{user.name}</span>
            </p>
            <Button
              onClick={() => {
                if (user.role === "trainer") {
                  router.push("/trainer");
                } else {
                  router.push("/trainee/dashboard");
                }
              }}
              className="w-full h-12 bg-primary-g4 hover:bg-primary-g4/90 text-white font-outfit font-semibold"
            >
              Go to My Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!agreeToTerms) {
      alert("Please agree to the terms and privacy policy");
      return;
    }

    setLoading(true);

    // Registration is handled via WhatsApp contact
    const phoneNumber = "972522249162";
    const message = encodeURIComponent(`Hi! I want to register for FitLog\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#1A1D2E] flex flex-col overflow-x-hidden" dir="ltr">
      {/* Back Button - Absolute positioning */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Spacer to push card down */}
      <div className="flex-shrink-0 h-[20vh]"></div>

      {/* Card Container - Full width, no horizontal padding on container */}
      <div className="w-full bg-[#252837] rounded-t-[32px] flex-1">
        {/* Inner content with padding */}
        <div className="px-6 py-10 pb-16">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-[26px] font-outfit font-semibold text-white leading-tight">
              Create your<br />Account
            </h1>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#A0A0A0] z-10 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  required
                  className="w-full h-[56px] pl-12 pr-4 bg-[#3D4058] border-0 text-white placeholder:text-[#A0A0A0] focus:ring-2 focus:ring-[#5B7FFF]/30 transition-all outline-none font-outfit font-normal text-[15px] rounded-xl"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#A0A0A0] z-10 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full h-[56px] pl-12 pr-4 bg-[#3D4058] border-0 text-white placeholder:text-[#A0A0A0] focus:ring-2 focus:ring-[#5B7FFF]/30 transition-all outline-none font-outfit font-normal text-[15px] rounded-xl"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#A0A0A0] z-10 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  required
                  className="w-full h-[56px] pl-12 pr-4 bg-[#3D4058] border-0 text-white placeholder:text-[#A0A0A0] focus:ring-2 focus:ring-[#5B7FFF]/30 transition-all outline-none font-outfit font-normal text-[15px] rounded-xl"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#A0A0A0] z-10 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create Password"
                  required
                  className="w-full h-[56px] pl-12 pr-12 bg-[#3D4058] border-0 text-white placeholder:text-[#A0A0A0] focus:ring-2 focus:ring-[#5B7FFF]/30 transition-all outline-none font-outfit font-normal text-[15px] rounded-xl"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-white transition-colors active:scale-95 z-10"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#A0A0A0] z-10 pointer-events-none" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  required
                  className="w-full h-[56px] pl-12 pr-12 bg-[#3D4058] border-0 text-white placeholder:text-[#A0A0A0] focus:ring-2 focus:ring-[#5B7FFF]/30 transition-all outline-none font-outfit font-normal text-[15px] rounded-xl"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-white transition-colors active:scale-95 z-10"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Privacy Agreement */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-[18px] h-[18px] mt-0.5 rounded border-2 border-[#6B7280] bg-transparent checked:bg-[#5B7FFF] checked:border-[#5B7FFF] focus:ring-2 focus:ring-[#5B7FFF]/20 transition-all cursor-pointer flex-shrink-0"
              />
              <label className="text-[14px] text-white font-outfit font-normal leading-relaxed cursor-pointer">
                I agree to the company's{" "}
                <Link href="#" className="text-[#5B7FFF] hover:text-[#5B7FFF]/80 font-medium">
                  Term of use
                </Link>
                {" "}and{" "}
                <Link href="#" className="text-[#5B7FFF] hover:text-[#5B7FFF]/80 font-medium">
                  Privacy policy
                </Link>
              </label>
            </div>

            {/* Sign Up Button */}
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-[54px] bg-[#6B8EFF] hover:bg-[#5B7FFF] text-white font-outfit font-semibold text-[16px] rounded-[30px] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-none border-0" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Signing up...
                  </>
                ) : (
                  "Sign up"
                )}
              </Button>
            </div>
          </form>

          {/* Login Link */}
          <div className="text-center pt-8">
            <p className="text-[15px] text-[#9CA3AF] font-outfit font-normal">
              Already have an account?{" "}
              <Link 
                href="/auth/login" 
                className="text-[#5B7FFF] hover:text-[#5B7FFF]/80 font-semibold transition-colors"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}