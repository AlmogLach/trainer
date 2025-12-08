"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  User, Loader2, LogOut, Bell, Globe, HelpCircle, 
  Edit, Save, X, Lock, Mail, AlertCircle, CheckCircle2
} from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
      {label && <span className="text-gray-900 dark:text-white text-sm font-medium">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-slate-700'}
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

function TrainerSettingsContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");
  const [editedEmail, setEditedEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Settings state - load from localStorage
  const [generalSettings, setGeneralSettings] = useState({
    notifications: true,
    emailNotifications: true,
    language: "עברית",
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedGeneralSettings = localStorage.getItem('trainerGeneralSettings');
    if (savedGeneralSettings) {
      setGeneralSettings(JSON.parse(savedGeneralSettings));
    }
  }, []);

  // Update local state when user changes
  useEffect(() => {
    if (user) {
      setEditedName(user.name || "");
      setEditedEmail(user.email || "");
    }
  }, [user]);

  // Save settings to localStorage
  const saveGeneralSettings = (newSettings: typeof generalSettings) => {
    setGeneralSettings(newSettings);
    localStorage.setItem('trainerGeneralSettings', JSON.stringify(newSettings));
  };

  const handleLogout = async () => {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
      setLoading(true);
      try {
        await signOut();
        router.push('/auth/login');
      } catch (error) {
        console.error('Error signing out:', error);
        setError('שגיאה בהתנתקות');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditProfile = async () => {
    if (!user?.id) return;
    
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Update user in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          name: editedName,
          email: editedEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update email in auth if changed
      if (editedEmail !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editedEmail
        });
        if (emailError) {
          console.error('Error updating email in auth:', emailError);
          // Don't fail the whole operation if email update fails
        }
      }

      setSuccess('הפרופיל עודכן בהצלחה');
      
      // Update local state immediately for better UX
      // The auth state change listener will update the global user state
      setEditedName(editedName);
      setEditedEmail(editedEmail);
      setShowEditProfile(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'שגיאה בעדכון הפרופיל');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('אנא מלא את כל השדות');
      return;
    }

    if (newPassword.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (passwordError) throw passwordError;

      setSuccess('הסיסמה עודכנה בהצלחה');
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'שגיאה בשינוי הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-32" dir="rtl">
      {/* --- Page Header --- */}
      <div className="pb-4 border-b border-gray-200 dark:border-slate-800 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">הגדרות מאמן</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">נהל את החשבון וההעדפות שלך</p>
      </div>
      {/* Success/Error Messages */}
      {success && (
        <Card className="border-none shadow-sm bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-bold text-sm">{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-none shadow-sm bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/30 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span className="font-bold text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Section */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
        <CardHeader className="p-5">
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">פרופיל</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5 pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{user?.name || "מאמן"}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">{user?.email || ""}</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setShowEditProfile(true);
                setError(null);
                setSuccess(null);
              }}
              className="gap-2 shadow-sm rounded-xl h-10 px-5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white border-none w-full sm:w-auto"
            >
              <Edit className="h-4 w-4" />
              <span>ערוך פרופיל</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
        <CardHeader className="p-5">
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">הגדרות חשבון</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-0">
          <Button
            onClick={() => {
              setShowChangePassword(true);
              setError(null);
              setSuccess(null);
            }}
            variant="outline"
            className="w-full justify-start bg-white dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white h-auto py-3 rounded-xl transition-all"
          >
            <Lock className="h-4 w-4 ml-2 text-gray-600 dark:text-slate-400" />
            <div className="text-right">
              <p className="font-bold text-sm">שינוי סיסמה</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">עדכן את סיסמת החשבון שלך</p>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
        <CardHeader className="p-5">
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">הגדרות כלליות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-0">
          <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-gray-600 dark:text-slate-400" />
              <span className="text-gray-900 dark:text-white text-sm font-bold">התראות</span>
            </div>
            <ToggleSwitch
              checked={generalSettings.notifications}
              onChange={(checked) => saveGeneralSettings({ ...generalSettings, notifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-600 dark:text-slate-400" />
              <span className="text-gray-900 dark:text-white text-sm font-bold">התראות אימייל</span>
            </div>
            <ToggleSwitch
              checked={generalSettings.emailNotifications}
              onChange={(checked) => saveGeneralSettings({ ...generalSettings, emailNotifications: checked })}
            />
          </div>
          <Button
            onClick={() => {
              showToast('שינוי שפה יושם בקרוב', 'info');
            }}
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 bg-white dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 rounded-xl transition-all"
          >
            <Globe className="h-5 w-5 ml-2 text-gray-600 dark:text-slate-400" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">שפה ({generalSettings.language})</span>
          </Button>
          <Button
            onClick={() => {
              showToast('עזרה ותמיכה יושם בקרוב', 'info');
            }}
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 bg-white dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800 rounded-xl transition-all"
          >
            <HelpCircle className="h-5 w-5 ml-2 text-gray-600 dark:text-slate-400" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">עזרה ותמיכה</span>
          </Button>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl">
        <CardContent className="p-5">
          <Button
            onClick={handleLogout}
            disabled={loading}
            className="w-full h-12 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-bold rounded-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                מתנתק...
              </>
            ) : (
              <>
                <LogOut className="h-5 w-5 ml-2" />
                התנתק מהמערכת
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Version */}
      <div className="text-center">
        <div className="inline-block bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800">
          <p className="text-gray-500 dark:text-slate-400 text-xs font-bold">FitLog גרסה 1.2.0</p>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-md shadow-2xl rounded-2xl">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white text-xl font-bold">ערוך פרופיל</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowEditProfile(false);
                    setEditedName(user?.name || "");
                    setEditedEmail(user?.email || "");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm text-gray-500 dark:text-slate-400 mb-2 block font-bold">שם</label>
                <Input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl h-12 font-medium focus:border-blue-500 transition-all"
                  placeholder="הזן שם"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-slate-400 mb-2 block font-bold">אימייל</label>
                <Input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl h-12 font-medium focus:border-blue-500 transition-all"
                  placeholder="הזן אימייל"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleEditProfile}
                  disabled={loading || !editedName || !editedEmail}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-xl transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                      שומר...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 ml-2" />
                      שמור
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditProfile(false);
                    setEditedName(user?.name || "");
                    setEditedEmail(user?.email || "");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="flex-1 h-12 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-xl transition-all"
                >
                  ביטול
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 w-full max-w-md shadow-2xl rounded-2xl">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white text-xl font-bold">שינוי סיסמה</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm text-gray-500 dark:text-slate-400 mb-2 block font-bold">סיסמה חדשה</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl h-12 font-medium focus:border-blue-500 transition-all"
                  placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-slate-400 mb-2 block font-bold">אישור סיסמה</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl h-12 font-medium focus:border-blue-500 transition-all"
                  placeholder="הזן שוב את הסיסמה החדשה"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={loading || !newPassword || !confirmPassword}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-xl transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                      מעדכן...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 ml-2" />
                      עדכן סיסמה
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="flex-1 h-12 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 font-bold rounded-xl transition-all"
                >
                  ביטול
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function TrainerSettingsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TrainerSettingsContent />
    </ProtectedRoute>
  );
}
