"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isValidatingRole, setIsValidatingRole] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated (but not if we're validating role)
  useEffect(() => {
    if (!authLoading && user && !isValidatingRole && !loading) {
      if (user.role === "trainer") {
        router.push("/trainer");
      } else if (user.role === "trainee") {
        router.push("/trainee/dashboard");
      }
    }
  }, [user, authLoading, router, isValidatingRole, loading]);

  const handleClose = () => {
    router.push("/");
  };

  // Show loading while checking auth
  if (authLoading) {
    return <LoadingSpinner fullScreen text="Checking authentication..." size="lg" dir="ltr" />;
  }

  // Show already logged in state
  if (user && !isValidatingRole && !loading) {
    return (
      <div className="min-h-screen bg-grey-g6 flex items-center justify-center p-4" dir="ltr">
        <div className="w-full max-w-md bg-grey-g5 rounded-xl p-6 shadow-lg">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-outfit font-semibold text-white">Already Logged In!</h2>
            <p className="text-grey-g2 font-outfit font-normal">
              You are logged in as <span className="font-semibold text-white">{user.name}</span> ({user.role === "trainer" ? "Trainer" : "Trainee"})
            </p>
            <div className="space-y-3 pt-4">
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
              <Button
                onClick={async () => {
                  await signOut();
                  router.refresh();
                }}
                variant="outline"
                className="w-full h-12 border-grey-g3 bg-grey-g6 text-white hover:bg-grey-g5 font-outfit font-semibold"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting login for:', email);
      
      // Clear any existing session to start fresh
      await supabase.auth.signOut();
      await new Promise(resolve => setTimeout(resolve, 200));

      setIsValidatingRole(true);

      // Use API route to avoid CORS issues (server-side auth)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (parseError) {
          setError('Server error - invalid response. Please try again later.');
          setIsValidatingRole(false);
          setLoading(false);
          return;
        }
      } else {
        setError(`Login error (${response.status}). Please try again or contact support.`);
        setIsValidatingRole(false);
        setLoading(false);
        return;
      }

      if (!response.ok || !result.success) {
        setError(result?.error || `Login error (${response.status})`);
        setIsValidatingRole(false);
        setLoading(false);
        return;
      }

      // Get user data and session from API response
      const userData = result.user;
      const accessToken = result.session?.access_token;
      const refreshToken = result.session?.refresh_token;

      // If we have session tokens, set them on the client
      if (accessToken && refreshToken) {
        try {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } catch (sessionErr) {
          console.error('Error setting session:', sessionErr);
        }
      }

      // Wait a moment for session to be set and cookies to sync
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!userData) {
        setError('Login succeeded but user data not received. Please try again.');
        setIsValidatingRole(false);
        setLoading(false);
        return;
      }

      // Validate user has a role
      if (!userData.role) {
        await supabase.auth.signOut();
        setError(`Error: User role not defined in database.`);
        setIsValidatingRole(false);
        setLoading(false);
        return;
      }

      // Auto-detect role from user data (no manual selection needed)
      // Role validation is handled server-side

      setIsValidatingRole(false);
      
      if (userData.role === "trainer") {
        window.location.href = "/trainer";
      } else if (userData.role === "trainee") {
        window.location.href = "/trainee/dashboard";
      } else {
        await supabase.auth.signOut();
        setError(`Error: User role not defined. Current role: ${userData.role || 'not defined'}`);
        setIsValidatingRole(false);
        setLoading(false);
      }
    } catch (err: any) {
      setIsValidatingRole(false);
      
      if (err.message?.includes("Email not confirmed") || err.message?.includes("email not confirmed")) {
        setError("⚠️ Your email is not yet verified. Please check your email and click the verification link.\n\nIf you didn't receive an email, you can request a resend.");
      } else {
        setError(err.message || "Login error");
      }
    } finally {
      setLoading(false);
      setIsValidatingRole(false);
    }
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
      <div className="flex-shrink-0 h-[22vh]"></div>

      {/* Card Container - Full width, no horizontal padding on container */}
      <div className="w-full bg-[#2D3142] rounded-t-[32px] flex-1">
        {/* Inner content with padding */}
        <div className="px-6 pt-12 pb-16">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-[28px] font-outfit font-semibold text-white leading-tight">
              Login to your<br />Account
            </h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-outfit font-normal whitespace-pre-line mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 leading-relaxed">{error}</div>
                </div>
              </div>
            )}
            
            {/* Email Input */}
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#A0A0A0] z-10 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="Email"
                  required
                  className="w-full h-[52px] pl-12 pr-4 bg-[#4A4E69] border-0 text-white placeholder:text-[#9FA4B8] focus:ring-2 focus:ring-[#5B7FFF]/30 transition-all outline-none font-outfit font-normal text-[15px] rounded-xl"
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Create Password"
                  required
                  className="w-full h-[52px] pl-12 pr-12 bg-[#4A4E69] border-0 text-white placeholder:text-[#9FA4B8] focus:ring-2 focus:ring-[#5B7FFF]/30 transition-all outline-none font-outfit font-normal text-[15px] rounded-xl"
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

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between pt-2 pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-[18px] h-[18px] rounded border-2 border-[#6B7280] bg-transparent checked:bg-[#5B7FFF] checked:border-[#5B7FFF] focus:ring-2 focus:ring-[#5B7FFF]/20 transition-all cursor-pointer"
                />
                <span className="text-[14px] text-white font-outfit font-normal">Remember me</span>
              </label>
              <Link 
                href="#" 
                className="text-[14px] text-[#5B7FFF] font-outfit font-semibold hover:text-[#5B7FFF]/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            
            {/* Submit Button */}
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-[52px] bg-[#6B8EFF] hover:bg-[#5B7FFF] text-white font-outfit font-semibold text-[16px] rounded-[30px] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-none border-0" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#4A4E69]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#2D3142] text-[#9CA3AF] text-[14px] font-outfit font-normal">or</span>
            </div>
          </div>

          {/* Google Login Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-[52px] border-[1.5px] border-white/20 bg-transparent text-white hover:bg-white/5 font-outfit font-medium text-[16px] rounded-xl transition-all active:scale-[0.98] shadow-none"
            onClick={() => {
              alert('Google login - coming soon');
            }}
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <span>Continue with Google</span>
            </div>
          </Button>

          {/* Signup Link */}
          <div className="text-center pt-10">
            <p className="text-[14px] text-[#9CA3AF] font-outfit font-normal">
              Don't have an account?{" "}
              <Link 
                href="/auth/register" 
                className="text-[#5B7FFF] hover:text-[#5B7FFF]/80 font-semibold transition-colors"
              >
                Signup
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}