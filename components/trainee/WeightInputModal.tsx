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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card className="bg-card border-border w-full max-w-md shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">הוסף משקל</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {weightError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive-foreground text-sm">
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
            className="w-full px-4 py-8 text-3xl font-bold bg-secondary/50 border-input text-foreground text-center"
            autoFocus
            disabled={savingWeight}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12"
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
              className="flex-1 border-input text-muted-foreground hover:bg-accent h-12"
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

