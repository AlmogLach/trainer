"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { getTrainerTraineesWithDetails } from "@/lib/db";
import { createTraineeAccount } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TraineeCard } from "@/components/trainer/TraineeCard";
import { AddTraineeForm, CredentialsDisplay } from "@/components/trainer/AddTraineeForm";

function TraineesManagementContent() {
  const { user } = useAuth();
  const [showAddTraineeForm, setShowAddTraineeForm] = useState(false);
  const [trainees, setTrainees] = useState<Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
    planActive: boolean;
    planName: string | null;
    lastWorkout: string | null;
  }>>([]);
  const [newTraineeCredentials, setNewTraineeCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trainerId = user?.id || "";

  useEffect(() => {
    if (trainerId) {
      loadTrainees();
    }
  }, [trainerId]);

  const loadTrainees = async () => {
    if (!trainerId) return;

    try {
      setLoading(true);
      setError(null);

      // Use optimized function that fetches all data in parallel queries
      const traineesWithDetails = await getTrainerTraineesWithDetails(trainerId);
      setTrainees(traineesWithDetails);
    } catch (err: any) {
      console.error("Error loading trainees:", err);
      setError(err.message || "שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrainee = async (email: string, password: string, name: string) => {
    if (!name || !email || !password) {
      setError("אנא מלא את כל השדות");
      return;
    }
    
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    
    try {
      setAdding(true);
      setError(null);
      
      // trainerId is no longer needed - it's taken from the authenticated session
      await createTraineeAccount(email, password, name);
      
      // Store credentials for display/sending
      setNewTraineeCredentials({
        email,
        password,
      });
      
      setShowAddTraineeForm(false);
      await loadTrainees();
    } catch (err: any) {
      console.error("Error adding trainee:", err);
      setError(err.message || "שגיאה בהוספת מתאמן");
    } finally {
      setAdding(false);
    }
  };

  return (
    <main className="p-5 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-card via-card to-accent/10 rounded-[2rem] p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="relative z-10">
          <p className="text-primary font-bold text-sm uppercase tracking-wider mb-1">FitLog Trainer 👥</p>
          <h2 className="text-4xl font-black text-foreground">ניהול מתאמנים</h2>
          <p className="text-muted-foreground text-sm mt-2">נהל את כל המתאמנים שלך במקום אחד</p>
        </div>
      </div>

      {/* Trainees Management Section */}
      <Card className="bg-card border-border shadow-lg rounded-[2rem]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2.5 rounded-2xl">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-foreground text-2xl font-black">המתאמנים שלי</CardTitle>
            </div>
            {trainees.length > 0 && (
              <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/30">
                <span className="text-primary font-black text-lg">{trainees.length}</span>
                <span className="text-muted-foreground text-sm mr-1">מתאמנים</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
              </div>
              <p className="text-muted-foreground font-medium">טוען מתאמנים...</p>
            </div>
          ) : trainees.length > 0 ? (
            <div className="space-y-4">
              {trainees.map((trainee, index) => (
                <div 
                  key={trainee.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TraineeCard trainee={trainee} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 space-y-6">
              <div className="bg-accent/30 p-8 rounded-3xl inline-block">
                <Plus className="h-16 w-16 text-muted-foreground mx-auto" />
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-black text-xl">אין מתאמנים עדיין</p>
                <p className="text-muted-foreground">התחל להוסיף מתאמנים כדי לנהל את האימונים שלהם</p>
              </div>
              <Button 
                onClick={() => setShowAddTraineeForm(true)}
                className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Plus className="ml-2 h-5 w-5" />
                הוסף מתאמן חדש
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Trainee Section */}
      {showAddTraineeForm && (
        <AddTraineeForm
          onAdd={handleAddTrainee}
          onCancel={() => {
            setShowAddTraineeForm(false);
            setError(null);
          }}
          adding={adding}
          error={error}
        />
      )}

      {/* Credentials Display */}
      {newTraineeCredentials && (
        <CredentialsDisplay
          email={newTraineeCredentials.email}
          password={newTraineeCredentials.password}
          onClose={() => setNewTraineeCredentials(null)}
        />
      )}

      {/* Enhanced Add Trainee Button (when form is not shown) */}
      {!showAddTraineeForm && trainees.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-dashed border-primary/30 shadow-lg rounded-[2rem] hover:border-primary/50 transition-all">
          <CardContent className="pt-6">
            <Button 
              className="w-full h-20 text-lg bg-transparent hover:bg-primary/10 text-foreground border-2 border-transparent hover:border-primary/20 font-black rounded-2xl transition-all active:scale-98"
              onClick={() => setShowAddTraineeForm(true)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-3 rounded-xl">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <span>הוסף מתאמן חדש</span>
              </div>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

export default function TraineesManagementPage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <TraineesManagementContent />
    </ProtectedRoute>
  );
}

