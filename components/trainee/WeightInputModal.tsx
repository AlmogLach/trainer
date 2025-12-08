"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, X, CheckCircle2 } from "lucide-react";
import { validateBodyWeight } from "@/lib/utils";

interface WeightInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weight: number) => Promise<void>;
}

export function WeightInputModal({ isOpen, onClose, onSave }: WeightInputModalProps) {
  const [bodyWeight, setBodyWeight] = useState<string>("");
  const [weightError, setWeightError] = useState<string | null>(null);
  const [savingWeight, setSavingWeight] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!bodyWeight) return;

    setWeightError(null);
    setSavingWeight(true);

    try {
      const weight = parseFloat(bodyWeight);
      const validation = validateBodyWeight(weight);
      
      if (!validation.isValid) {
        setWeightError(validation.error || 'שגיאה בוולידציה');
        setSavingWeight(false);
        return;
      }

      await onSave(weight);
      
      setBodyWeight("");
      setWeightError(null);
      onClose();
    } catch (error: any) {
      console.error('Error saving weight:', error);
      setWeightError('שגיאה בשמירת המשקל: ' + (error.message || 'שגיאה לא ידועה'));
    } finally {
      setSavingWeight(false);
    }
  };

  const handleClose = () => {
    setBodyWeight("");
    setWeightError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl">
        <CardHeader className="p-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 dark:text-white font-bold">הוסף משקל</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5 pt-0">
          {weightError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
              {weightError}
            </div>
          )}
          <Input
            type="number"
            step="0.1"
            value={bodyWeight}
            onChange={(e) => {
              setBodyWeight(e.target.value);
              setWeightError(null);
            }}
            placeholder="הזן משקל (ק״ג)"
            className="w-full px-4 py-8 text-3xl font-bold bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white text-center rounded-xl"
            autoFocus
            disabled={savingWeight}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold h-12 rounded-xl"
              disabled={!bodyWeight || savingWeight}
            >
              {savingWeight ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                  שמור
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 h-12 rounded-xl"
              disabled={savingWeight}
            >
              ביטול
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

