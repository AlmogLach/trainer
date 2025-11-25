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
      {label && <span className="text-white text-sm">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked ? 'bg-[#00ff88]' : 'bg-gray-700'}
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
    <main className="p-5 lg:p-6 space-y-6" dir="rtl">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-card via-card to-accent/10 rounded-[2rem] p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="relative z-10">
          <p className="text-primary font-bold text-sm uppercase tracking-wider mb-1">FitLog Settings ⚙️</p>
          <h2 className="text-4xl font-black text-foreground">הגדרות מאמן</h2>
          <p className="text-muted-foreground text-sm mt-2">נהל את החשבון וההעדפות שלך</p>
        </div>
      </div>

      {/* Enhanced Success/Error Messages */}
      {success && (
        <Card className="bg-green-500/10 border-2 border-green-500/30 shadow-lg rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-green-500">
              <div className="bg-green-500/20 p-2 rounded-xl">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="font-bold">{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="bg-red-500/10 border-2 border-red-500/30 shadow-lg rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="bg-red-500/20 p-2 rounded-xl">
                <AlertCircle className="h-5 w-5" />
              </div>
              <span className="font-bold">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Profile Section */}
      <Card className="bg-card border-2 border-border shadow-lg rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2.5 rounded-2xl">
              <User className="h-6 w-6 text-blue-500" />
            </div>
            <CardTitle className="text-foreground text-2xl font-black">פרופיל</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/20 border-2 border-primary/30 flex items-center justify-center shadow-lg">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-black text-foreground">{user?.name || "מאמן"}</p>
              <p className="text-sm text-muted-foreground font-medium mt-1">{user?.email || ""}</p>
            </div>
            <Button
              onClick={() => {
                setShowEditProfile(true);
                setError(null);
                setSuccess(null);
              }}
              className="h-11 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Edit className="h-5 w-5 ml-2" />
              ערוך פרופיל
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Account Settings */}
      <Card className="bg-card border-2 border-border shadow-lg rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2.5 rounded-2xl">
              <Lock className="h-6 w-6 text-purple-500" />
            </div>
            <CardTitle className="text-foreground text-2xl font-black">הגדרות חשבון</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => {
              setShowChangePassword(true);
              setError(null);
              setSuccess(null);
            }}
            variant="outline"
            className="w-full justify-start bg-accent/30 hover:bg-accent border-2 border-border text-foreground h-auto py-4 rounded-xl transition-all active:scale-98"
          >
            <div className="bg-purple-500/20 p-2 rounded-lg ml-3">
              <Lock className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-right">
              <p className="font-black">שינוי סיסמה</p>
              <p className="text-xs text-muted-foreground font-medium">עדכן את סיסמת החשבון שלך</p>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Enhanced General Settings */}
      <Card className="bg-card border-2 border-border shadow-lg rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-2.5 rounded-2xl">
              <Globe className="h-6 w-6 text-orange-500" />
            </div>
            <CardTitle className="text-foreground text-2xl font-black">הגדרות כלליות</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between bg-accent/20 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Bell className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-foreground text-sm font-bold">התראות</span>
            </div>
            <ToggleSwitch
              checked={generalSettings.notifications}
              onChange={(checked) => saveGeneralSettings({ ...generalSettings, notifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between bg-accent/20 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Mail className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-foreground text-sm font-bold">התראות אימייל</span>
            </div>
            <ToggleSwitch
              checked={generalSettings.emailNotifications}
              onChange={(checked) => saveGeneralSettings({ ...generalSettings, emailNotifications: checked })}
            />
          </div>
          <Button
            onClick={() => {
              alert('שינוי שפה יושם בקרוב');
            }}
            variant="outline"
            className="w-full justify-start h-auto py-4 px-4 bg-card hover:bg-accent border-2 border-border rounded-xl transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <Globe className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm font-bold text-foreground">שפה ({generalSettings.language})</span>
            </div>
          </Button>
          <Button
            onClick={() => {
              alert('עזרה ותמיכה יושם בקרוב');
            }}
            variant="outline"
            className="w-full justify-start h-auto py-4 px-4 bg-card hover:bg-accent border-2 border-border rounded-xl transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-orange-500/20 p-2 rounded-lg">
                <HelpCircle className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-sm font-bold text-foreground">עזרה ותמיכה</span>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Enhanced Logout Button */}
      <Card className="bg-gradient-to-r from-red-500/10 to-red-500/5 border-2 border-red-500/30 shadow-lg rounded-2xl">
        <CardContent className="pt-6">
          <Button
            onClick={handleLogout}
            disabled={loading}
            className="w-full h-14 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-black rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-95 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-6 w-6 ml-2 animate-spin" />
                מתנתק...
              </>
            ) : (
              <>
                <LogOut className="h-6 w-6 ml-2" />
                התנתק מהמערכת
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Enhanced Version */}
      <div className="text-center">
        <div className="inline-block bg-accent/30 px-6 py-3 rounded-xl border border-border">
          <p className="text-muted-foreground text-sm font-bold">FitLog גרסה 1.2.0</p>
        </div>
      </div>

      {/* Enhanced Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="bg-card border-2 border-border w-full max-w-md shadow-2xl rounded-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground text-2xl font-black">ערוך פרופיל</CardTitle>
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
                  className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl text-red-500 text-sm font-bold">
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block font-bold uppercase tracking-wider">שם</label>
                <Input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-accent/30 border-2 border-border text-foreground rounded-xl h-12 font-medium focus:border-primary transition-all"
                  placeholder="הזן שם"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block font-bold uppercase tracking-wider">אימייל</label>
                <Input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className="bg-accent/30 border-2 border-border text-foreground rounded-xl h-12 font-medium focus:border-primary transition-all"
                  placeholder="הזן אימייל"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleEditProfile}
                  disabled={loading || !editedName || !editedEmail}
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
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
                  className="flex-1 h-12 border-2 border-border text-foreground hover:bg-accent font-black rounded-xl transition-all active:scale-95"
                >
                  ביטול
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="bg-card border-2 border-border w-full max-w-md shadow-2xl rounded-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground text-2xl font-black">שינוי סיסמה</CardTitle>
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
                  className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl text-red-500 text-sm font-bold">
                  {error}
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block font-bold uppercase tracking-wider">סיסמה חדשה</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-accent/30 border-2 border-border text-foreground rounded-xl h-12 font-medium focus:border-primary transition-all"
                  placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block font-bold uppercase tracking-wider">אישור סיסמה</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-accent/30 border-2 border-border text-foreground rounded-xl h-12 font-medium focus:border-primary transition-all"
                  placeholder="הזן שוב את הסיסמה החדשה"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={loading || !newPassword || !confirmPassword}
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
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
                  className="flex-1 h-12 border-2 border-border text-foreground hover:bg-accent font-black rounded-xl transition-all active:scale-95"
                >
                  ביטול
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

export default function TrainerSettingsPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TrainerSettingsContent />
    </ProtectedRoute>
  );
}

