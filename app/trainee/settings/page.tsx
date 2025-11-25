"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  User, Loader2, LogOut, Bell, Globe, HelpCircle, 
  Edit, Settings as SettingsIcon, Dumbbell, Apple
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

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
      {label && <span className="text-foreground text-sm font-medium">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked ? 'bg-primary' : 'bg-accent'}
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
  const [loading, setLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Settings state
  const [workoutSettings, setWorkoutSettings] = useState({
    useKg: true,
    defaultTimer: true,
  });

  const [nutritionSettings, setNutritionSettings] = useState({
    dailyCalorieTarget: 2500,
  });

  const [generalSettings, setGeneralSettings] = useState({
    notifications: true,
    language: "עברית",
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
    alert('עדכון פרופיל יושם בקרוב');
  };

  const handleChangePassword = () => {
    // TODO: Implement password change
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('הסיסמאות אינן תואמות');
      return;
    }
    setShowChangePassword(false);
    alert('שינוי סיסמה יושם בקרוב');
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Enhanced Header - Connected to top header */}
      <div className="bg-gradient-to-r from-card to-card/95 border-b-2 border-border rounded-b-2xl sm:rounded-b-[2.5rem] px-4 sm:px-6 py-4 sm:py-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="max-w-2xl mx-auto flex items-center gap-2 sm:gap-3 relative z-10">
          <div className="bg-gradient-to-br from-primary to-primary/80 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-lg">
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-background" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">הגדרות</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Settings</p>
          </div>
        </div>
      </div>

      {/* Content with padding */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 lg:px-5 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-6">
        {/* Profile Section */}
        <Card className="bg-card border-2 border-border shadow-lg rounded-xl sm:rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center text-primary font-black text-2xl sm:text-3xl border-2 border-primary/30 shadow-lg flex-shrink-0">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 text-center sm:text-right min-w-0">
                <h2 className="text-lg sm:text-xl font-black text-foreground mb-1 truncate">{user?.name || "מתאמן"}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{user?.email || "אין אימייל"}</p>
              </div>
              <Button
                onClick={() => setShowEditProfile(true)}
                className="w-full sm:w-auto h-10 sm:h-11 px-4 sm:px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-lg sm:rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm sm:text-base"
              >
                <Edit className="h-4 w-4 ml-1.5 sm:ml-2" />
                ערוך
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workout Settings */}
        <Card className="bg-card border-2 border-border shadow-lg rounded-xl sm:rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '50ms' }}>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-orange-500/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              </div>
              <CardTitle className="text-base sm:text-lg font-black text-foreground">הגדרות אימון</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
            <div className="bg-accent/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border">
              <ToggleSwitch
                checked={workoutSettings.useKg}
                onChange={(checked) => saveWorkoutSettings({ ...workoutSettings, useKg: checked })}
                label="יחידות מידה (ק״ג)"
              />
            </div>
            <div className="bg-accent/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border">
              <ToggleSwitch
                checked={workoutSettings.defaultTimer}
                onChange={(checked) => saveWorkoutSettings({ ...workoutSettings, defaultTimer: checked })}
                label="טיימר ברירת מחדל (60ש)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Settings */}
        <Card className="bg-card border-2 border-border shadow-lg rounded-xl sm:rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '100ms' }}>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-green-500/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <Apple className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              <CardTitle className="text-base sm:text-lg font-black text-foreground">הגדרות תזונה</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Button
              onClick={() => {
                const newTarget = prompt('הזן יעד קלורי יומי:', nutritionSettings.dailyCalorieTarget.toString());
                if (newTarget && !isNaN(Number(newTarget))) {
                  saveNutritionSettings({ ...nutritionSettings, dailyCalorieTarget: Number(newTarget) });
                }
              }}
              variant="outline"
              className="w-full justify-between h-auto py-3 sm:py-4 px-3 sm:px-4 bg-card hover:bg-accent border-2 border-border rounded-lg sm:rounded-xl transition-all"
            >
              <span className="text-xs sm:text-sm font-bold text-foreground">יעד קלורי יומי</span>
              <span className="text-primary font-black text-xs sm:text-sm">{nutritionSettings.dailyCalorieTarget} קק״ל</span>
            </Button>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card className="bg-card border-2 border-border shadow-lg rounded-xl sm:rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '150ms' }}>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-blue-500/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <CardTitle className="text-base sm:text-lg font-black text-foreground">כללי</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
            <div className="w-full flex items-center justify-between text-foreground bg-accent/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-primary/20 p-1 sm:p-1.5 rounded-lg">
                  <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <span className="text-xs sm:text-sm font-bold">התראות</span>
              </div>
              <ToggleSwitch
                checked={generalSettings.notifications}
                onChange={(checked) => saveGeneralSettings({ ...generalSettings, notifications: checked })}
              />
            </div>
            <Button
              onClick={() => {
                alert('שינוי שפה יושם בקרוב');
              }}
              variant="outline"
              className="w-full justify-between h-auto py-3 sm:py-4 px-3 sm:px-4 bg-card hover:bg-accent border-2 border-border rounded-lg sm:rounded-xl transition-all"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-purple-500/20 p-1 sm:p-1.5 rounded-lg">
                  <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-foreground">שפה</span>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground font-bold">{generalSettings.language}</span>
            </Button>
            <Button
              onClick={() => {
                alert('עזרה ותמיכה יושם בקרוב');
              }}
              variant="outline"
              className="w-full justify-between h-auto py-3 sm:py-4 px-3 sm:px-4 bg-card hover:bg-accent border-2 border-border rounded-lg sm:rounded-xl transition-all"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-amber-500/20 p-1 sm:p-1.5 rounded-lg">
                  <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-foreground">עזרה ותמיכה</span>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          disabled={loading}
          className="w-full h-12 sm:h-14 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-black rounded-lg sm:rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-2 duration-300 text-sm sm:text-base"
          style={{ animationDelay: '200ms' }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 ml-1.5 sm:ml-2 animate-spin" />
              מתנתק...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5 ml-1.5 sm:ml-2" />
              התנתק
            </>
          )}
        </Button>

        {/* Version */}
        <div className="text-center text-muted-foreground text-xs sm:text-sm py-2 font-medium">
          FitLog גרסה 1.2.0
        </div>

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md border-2 border-border shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-lg sm:text-xl font-black text-foreground mb-3 sm:mb-4">ערוך פרופיל</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs sm:text-sm text-muted-foreground mb-2 block font-bold">שם מלא:</label>
                  <Input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="bg-accent/30 border-2 border-border text-foreground rounded-lg sm:rounded-xl h-11 sm:h-12 font-medium text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm text-muted-foreground mb-2 block font-bold">אימייל:</label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="bg-accent/30 border-2 border-border text-foreground rounded-lg sm:rounded-xl h-11 sm:h-12 font-medium text-sm sm:text-base"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <Button
                    onClick={handleSaveProfile}
                    className="flex-1 h-11 sm:h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-lg sm:rounded-xl text-sm sm:text-base"
                  >
                    שמור
                  </Button>
                  <Button
                    onClick={() => setShowEditProfile(false)}
                    variant="outline"
                    className="flex-1 h-11 sm:h-12 border-2 border-border text-foreground hover:bg-accent font-black rounded-lg sm:rounded-xl text-sm sm:text-base"
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
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
