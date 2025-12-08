"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  User, Loader2, LogOut, Bell, Globe, HelpCircle, 
  Edit, Settings as SettingsIcon, Dumbbell, Apple,
  Camera, Trophy, Award, Clock, ChevronRight, Target
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getWorkoutLogs } from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

// Toggle Switch Component
const ToggleSwitch = ({ 
  checked, 
  onChange, 
  label 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  label?: string;
}) => {
  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-white text-sm font-medium">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked ? 'bg-[#5B7FFF]' : 'bg-[#3D4058]'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
};

function SettingsPageContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Settings state
  const [workoutSettings, setWorkoutSettings] = useState({
    useKg: true,
    defaultTimer: true,
  });

  const [nutritionSettings, setNutritionSettings] = useState({
    dailyCalorieTarget: 2500,
  });
  const [showCalorieDialog, setShowCalorieDialog] = useState(false);
  const [calorieInput, setCalorieInput] = useState("");

  const [generalSettings, setGeneralSettings] = useState({
    notifications: true,
    language: "English",
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedWorkout = localStorage.getItem("workoutSettings");
    const savedNutrition = localStorage.getItem("nutritionSettings");
    const savedGeneral = localStorage.getItem("generalSettings");

    if (savedWorkout) setWorkoutSettings(JSON.parse(savedWorkout));
    if (savedNutrition) setNutritionSettings(JSON.parse(savedNutrition));
    if (savedGeneral) setGeneralSettings(JSON.parse(savedGeneral));
  }, []);

  // Load workout logs for stats
  useEffect(() => {
    if (!user?.id) return;

    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const logs = await getWorkoutLogs(user.id, 365); // Last year
        setWorkoutLogs(logs || []);
      } catch (err) {
        console.error("Error loading workout stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [user?.id]);

  const saveWorkoutSettings = (settings: typeof workoutSettings) => {
    setWorkoutSettings(settings);
    localStorage.setItem("workoutSettings", JSON.stringify(settings));
  };

  const saveNutritionSettings = (settings: typeof nutritionSettings) => {
    setNutritionSettings(settings);
    localStorage.setItem("nutritionSettings", JSON.stringify(settings));
  };

  const saveGeneralSettings = (settings: typeof generalSettings) => {
    setGeneralSettings(settings);
    localStorage.setItem("generalSettings", JSON.stringify(settings));
  };

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    router.push("/auth/login");
  };

  const handleSaveProfile = () => {
    // TODO: Implement profile update
    setShowEditProfile(false);
    showToast('Profile update coming soon', "info", 3000);
  };

  const handleChangePassword = () => {
    // TODO: Implement password change
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Passwords do not match', "error", 3000);
      return;
    }
    setShowChangePassword(false);
    showToast('Password change coming soon', "info", 3000);
  };

  // Calculate real stats from workout logs
  const calculateStats = () => {
    const completedLogs = workoutLogs.filter(log => log.completed);
    
    // Calculate total time in hours
    const totalMinutes = completedLogs.reduce((total, log: any) => {
      if (log.duration_seconds) {
        return total + (log.duration_seconds / 60);
      } else if (log.start_time && log.end_time) {
        const start = new Date(log.start_time).getTime();
        const end = new Date(log.end_time).getTime();
        return total + ((end - start) / (1000 * 60));
      }
      return total + 45; // Default 45 minutes
    }, 0);
    const totalTimeHours = Math.round(totalMinutes / 60);

    // Personal goals: completed workouts / target (assuming 4 per week = ~208 per year)
    const completedWorkouts = completedLogs.length;
    const personalGoals = { completed: completedWorkouts, total: 208 };

    // Badges: milestones (1st workout, 10th, 25th, 50th, 100th, etc.)
    const milestones = [1, 10, 25, 50, 100, 200];
    const collectedBadges = milestones.filter(m => completedWorkouts >= m).length;
    const badgesCollected = { collected: collectedBadges, total: milestones.length };

    // Recent achievements (last 3 completed workouts)
    const recentAchievements = completedLogs
      .slice(0, 3)
      .map((log: any, idx) => {
        const date = new Date(log.date || log.start_time);
        const achievementImages = [
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop",
          "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=100&h=100&fit=crop",
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=100&h=100&fit=crop",
        ];
        return {
          id: log.id,
          title: log.routine?.name || `אימון ${log.routine?.letter || ''}` || `אימון ${idx + 1}`,
          date: date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }),
          image: achievementImages[idx % achievementImages.length],
        };
      });

    return { totalTimeHours, personalGoals, badgesCollected, achievements: recentAchievements };
  };

  const stats = calculateStats();
  const { totalTimeHours, personalGoals, badgesCollected, achievements } = stats;

  return (
    <div className="relative bg-[#1A1D2E] w-full min-h-screen">
      {/* Main Content */}
      <div className="w-full overflow-y-auto pb-24">
        <div className="w-full max-w-[393px] mx-auto px-5 pt-12">
          <div className="flex flex-col items-start w-full gap-6">
            
            {/* Profile Header */}
            <div className="w-full flex flex-col items-center gap-5">
              <div className="w-full flex items-center justify-between">
                <h1 className="text-[28px] font-outfit font-bold text-white">פרופיל</h1>
                {/* Logout button */}
                <button 
                  onClick={handleLogout} 
                  disabled={loading} 
                  className="w-10 h-10 bg-[#2D3142] rounded-full flex items-center justify-center hover:bg-[#3D4058] transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <LogOut className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
              
              {/* Profile Picture with Camera Icon */}
              <div className="relative">
                <Avatar className="w-28 h-28 border-4 border-[#2D3142]">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-[#2D3142] text-white text-3xl font-outfit font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-[#5B7FFF] rounded-full flex items-center justify-center border-4 border-[#1A1D2E] hover:bg-[#6B8EFF] transition-colors">
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>
              
              {/* Name and Email */}
              <div className="flex flex-col items-center gap-1">
                <h2 className="text-2xl font-outfit font-bold text-white">{user?.name || "John Doe"}</h2>
                <p className="text-base font-outfit font-normal text-[#9CA3AF]">{user?.email || "john.doe@email.com"}</p>
              </div>
            </div>

            {/* User Statistics */}
            <div className="w-full bg-[#2D3142] rounded-2xl p-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Total Time */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-[#EF4444] rounded-xl flex items-center justify-center">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-2xl font-outfit font-bold text-white">{statsLoading ? '...' : `${totalTimeHours}h`}</div>
                  <div className="text-xs font-outfit font-medium text-[#9CA3AF] text-center leading-tight">זמן כולל</div>
                </div>
                
                {/* Personal Goals */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-[#4CAF50] rounded-xl flex items-center justify-center">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-2xl font-outfit font-bold text-white">{statsLoading ? '...' : `${personalGoals.completed}/${personalGoals.total}`}</div>
                  <div className="text-xs font-outfit font-medium text-[#9CA3AF] text-center leading-tight">מטרות</div>
                </div>
                
                {/* Badges Collected */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-[#FF8A00] rounded-xl flex items-center justify-center">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-2xl font-outfit font-bold text-white">{statsLoading ? '...' : `${badgesCollected.collected}/${badgesCollected.total}`}</div>
                  <div className="text-xs font-outfit font-medium text-[#9CA3AF] text-center leading-tight">תגים</div>
                </div>
              </div>
            </div>

            {/* Achievements Section */}
            <div className="w-full flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-outfit font-bold text-white">הישגים</h2>
                <Link href="/trainee/achievements" className="text-sm font-outfit font-semibold text-[#5B7FFF] hover:text-[#6B8EFF] transition-colors">
                  צפה בהכל
                </Link>
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-5 px-5">
                {achievements.length > 0 ? achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex-shrink-0 bg-[#2D3142] rounded-2xl p-4 flex flex-col items-center gap-3 w-[130px]"
                  >
                    <div 
                      className="w-20 h-20 rounded-full bg-cover bg-center border-4 border-[#1A1D2E]"
                      style={{ backgroundImage: `url(${achievement.image})` }}
                    />
                    <div className="text-sm font-outfit font-bold text-white text-center">{achievement.title}</div>
                    <div className="text-xs font-outfit font-normal text-[#9CA3AF] text-center">{achievement.date}</div>
                  </div>
                )) : (
                  <div className="flex-shrink-0 w-[130px] bg-[#2D3142] rounded-2xl p-4 flex flex-col items-center justify-center">
                    <p className="text-[#9CA3AF] text-xs text-center">אין הישגים עדיין</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Section */}
            <div className="w-full flex flex-col gap-4">
              <h2 className="text-lg font-outfit font-bold text-white">חשבון</h2>
              <div className="w-full bg-[#2D3142] rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setShowEditProfile(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#3D4058] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#5B7FFF] rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-base font-outfit font-medium text-white">ערוך פרופיל</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
                </button>
                <div className="w-full h-px bg-[#3D4058]"></div>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[#3D4058] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#5B7FFF] rounded-xl flex items-center justify-center">
                      <Edit className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-base font-outfit font-medium text-white">ערוך פרטים אישיים</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
                </button>
              </div>
            </div>

            {/* General Section */}
            <div className="w-full flex flex-col gap-4">
              <h2 className="text-lg font-outfit font-bold text-white">כללי</h2>
              <div className="w-full bg-[#2D3142] rounded-2xl overflow-hidden">
                <button className="w-full flex items-center justify-between p-4 hover:bg-[#3D4058] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#5B7FFF] rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-base font-outfit font-medium text-white">התראות</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#2D3142] border-2 border-[#3D4058] w-full max-w-md shadow-2xl rounded-2xl">
            <div className="p-6 border-b border-[#3D4058]">
              <h3 className="text-white text-2xl font-outfit font-bold">ערוך פרופיל</h3>
            </div>
            <div className="space-y-5 p-6">
              <div>
                <label className="text-sm text-[#9CA3AF] mb-2 block font-outfit font-semibold">שם מלא</label>
                <Input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white rounded-xl h-12 font-outfit font-normal focus:border-[#5B7FFF]"
                />
              </div>
              <div>
                <label className="text-sm text-[#9CA3AF] mb-2 block font-outfit font-semibold">אימייל</label>
                <Input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="bg-[#1A1D2E] border-2 border-[#3D4058] text-white rounded-xl h-12 font-outfit font-normal focus:border-[#5B7FFF]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 h-12 bg-[#5B7FFF] hover:bg-[#6B8EFF] text-white font-outfit font-bold rounded-xl"
                >
                  שמור
                </Button>
                <Button
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 h-12 bg-[#1A1D2E] border-2 border-[#3D4058] text-white hover:bg-[#3D4058] font-outfit font-bold rounded-xl"
                >
                  ביטול
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRole="trainee">
      <SettingsPageContent />
    </ProtectedRoute>
  );
}