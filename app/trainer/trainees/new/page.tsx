"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createTraineeAccount } from "@/lib/auth";
import { AddTraineeForm, CredentialsDisplay } from "@/components/trainer/AddTraineeForm";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

function NewTraineeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTraineeCredentials, setNewTraineeCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const handleAddTrainee = async (email: string, password: string, name: string) => {
    if (!name || !email || !password) {
      setError("אנא מלא את כל השדות");
      showToast('אנא מלא את כל השדות', 'error');
      return;
    }
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      showToast('הסיסמה חייבת להכיל לפחות 6 תווים', 'error');
      return;
    }
    try {
      setAdding(true);
      setError(null);
      await createTraineeAccount(email, password, name);
      setNewTraineeCredentials({ email, password });
      showToast('מתאמן נוסף בהצלחה!', 'success');
    } catch (err: any) {
      console.error("Error adding trainee:", err);
      setError(err.message || "שגיאה בהוספת מתאמן");
      showToast(err.message || 'שגיאה בהוספת מתאמן', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleCloseCredentials = () => {
    setNewTraineeCredentials(null);
    router.push("/trainer/trainees");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-32" dir="rtl">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <Link href="/trainer/trainees">
              <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl">
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-slate-400" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">הוסף מתאמן חדש</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">צור חשבון חדש למתאמן</p>
            </div>
          </div>
        </div>

        {/* Add Trainee Form */}
        <AddTraineeForm
          onAdd={handleAddTrainee}
          onCancel={() => router.push("/trainer/trainees")}
          adding={adding}
          error={error}
        />
      </div>

      {/* Credentials Display Dialog */}
      {newTraineeCredentials && (
        <Dialog open={!!newTraineeCredentials} onOpenChange={(open) => !open && handleCloseCredentials()}>
          <DialogContent dir="rtl">
            <CredentialsDisplay
              email={newTraineeCredentials.email}
              password={newTraineeCredentials.password}
              onClose={handleCloseCredentials}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function NewTraineePage() {
  return (
    <ProtectedRoute requiredRole="trainer">
      <NewTraineeContent />
    </ProtectedRoute>
  );
}
