"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion"; // אנימציות חלקות
import { 
  Check, 
  ChevronDown, 
  Trophy, 
  Clock, 
  Info, 
  Minus, 
  Plus, 
  Dumbbell,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// --- Types (אותם טייפים כמו אצלך) ---
interface ExerciseData {
  heaviestWeight: string;
  heaviestReps: string;
  heaviestRir: string;
  totalSetsDone: number;
  isComplete: boolean;
}

interface Exercise {
  id: string;
  name: string;
  specialInstructions: string;
  targetSets: number;
  targetReps: string;
  restTime: number;
  exerciseId: string;
  previousBest?: { weight: number; reps: number };
}

// --- Component: Stepper Input (במקום הקלדה רגילה) ---
const StepperInput = ({ 
  value, 
  onChange, 
  label, 
  step = 1, 
  suffix = "" 
}: { 
  value: string | number; 
  onChange: (val: string) => void; 
  label: string; 
  step?: number;
  suffix?: string;
}) => {
  const numValue = parseFloat(value.toString()) || 0;
  
  // פונקציה לשינוי מהיר בלחיצה ארוכה
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const adjust = (amount: number) => {
    const newVal = Math.max(0, Number((numValue + amount).toFixed(1)));
    onChange(newVal.toString());
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center bg-accent/50 rounded-2xl p-1 border border-border/50">
        <button 
          onClick={() => adjust(-step)}
          className="w-10 h-10 flex items-center justify-center bg-background rounded-xl shadow-sm border border-border/50 active:scale-90 transition-transform text-foreground"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <div className="w-16 text-center font-black text-lg tabular-nums">
          {value || 0}<span className="text-xs text-muted-foreground ml-0.5">{suffix}</span>
        </div>

        <button 
          onClick={() => adjust(step)}
          className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-xl shadow-sm shadow-primary/20 active:scale-90 transition-transform"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// --- Component: Modern Exercise Card ---

export const ModernExerciseCard = ({ 
  exercise, 
  data, 
  onUpdate,
  isExpanded,
  onToggle
}: { 
  exercise: Exercise; 
  data: ExerciseData; 
  onUpdate: (field: keyof ExerciseData, value: any) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const isOverTarget = data.totalSetsDone >= exercise.targetSets;
  const progress = Math.min(100, (data.totalSetsDone / exercise.targetSets) * 100);

  // בדיקת שיא אישי
  const currentWeight = parseFloat(data.heaviestWeight) || 0;
  const currentReps = parseInt(data.heaviestReps) || 0;
  const beatPrevious = exercise.previousBest && (
    currentWeight > exercise.previousBest.weight || 
    (currentWeight === exercise.previousBest.weight && currentReps > exercise.previousBest.reps)
  );

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border transition-all duration-300 mb-3",
        data.isComplete 
          ? "bg-green-500/5 border-green-500/30" 
          : isExpanded 
            ? "bg-card border-primary/50 shadow-lg shadow-primary/5 ring-1 ring-primary/20" 
            : "bg-card border-border shadow-sm"
      )}
    >
      {/* 1. Compact Header (תמיד מוצג) */}
      <div 
        onClick={onToggle}
        className="p-5 flex items-center justify-between cursor-pointer active:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Status Icon */}
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
            data.isComplete 
              ? "bg-green-500 text-white shadow-lg shadow-green-500/30" 
              : "bg-secondary text-muted-foreground"
          )}>
            {data.isComplete ? <Check className="w-6 h-6" /> : <Dumbbell className="w-5 h-5" />}
          </div>

          <div>
            <h3 className={cn("font-black text-lg leading-tight", data.isComplete && "text-green-600 dark:text-green-400")}>
              {exercise.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span className="bg-secondary px-2 py-0.5 rounded text-xs font-bold text-foreground">
                {exercise.targetSets} סטים
              </span>
              <span>•</span>
              <span>{exercise.targetReps} חזרות</span>
            </div>
          </div>
        </div>

        {/* Progress Circle (Mini) */}
        {!isExpanded && !data.isComplete && (
           <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
             {data.totalSetsDone}/{exercise.targetSets}
           </div>
        )}
        
        <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} />
      </div>

      {/* 2. Expanded Content (Animate Height) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-6">
              
              {/* Previous Stats & Info */}
              <div className="flex gap-2">
                {exercise.previousBest && (
                  <div className="flex-1 bg-secondary/50 p-3 rounded-2xl flex items-center gap-3 border border-border/50">
                    <History className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">שיא קודם</p>
                      <p className="text-sm font-black">{exercise.previousBest.weight}kg × {exercise.previousBest.reps}</p>
                    </div>
                  </div>
                )}
                <div className="flex-1 bg-secondary/50 p-3 rounded-2xl flex items-center gap-3 border border-border/50">
                   <Clock className="w-4 h-4 text-blue-500" />
                   <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">מנוחה</p>
                      <p className="text-sm font-black">{exercise.restTime} שנ׳</p>
                   </div>
                </div>
              </div>
              
              {exercise.specialInstructions && (
                 <div className="flex gap-2 text-xs text-muted-foreground bg-accent/30 p-3 rounded-xl">
                    <Info className="w-4 h-4 shrink-0" />
                    {exercise.specialInstructions}
                 </div>
              )}

              {/* Main Inputs */}
              <div className="grid grid-cols-2 gap-4">
                 <StepperInput 
                   label="משקל (ק״ג)" 
                   value={data.heaviestWeight} 
                   onChange={(v) => onUpdate("heaviestWeight", v)}
                   step={1.25}
                 />
                 <StepperInput 
                   label="חזרות" 
                   value={data.heaviestReps} 
                   onChange={(v) => onUpdate("heaviestReps", v)}
                   step={1}
                 />
              </div>

              {/* Sets Progress & Controls */}
              <div className="bg-secondary/30 rounded-3xl p-4 border border-border/50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold">התקדמות סטים</span>
                  <span className={cn("text-xl font-black", isOverTarget ? "text-green-500" : "text-primary")}>
                    {data.totalSetsDone} <span className="text-sm text-muted-foreground font-medium">/ {exercise.targetSets}</span>
                  </span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="h-4 bg-secondary rounded-full overflow-hidden mb-6 relative">
                  <motion.div 
                    className={cn("absolute inset-0 bg-primary/20", data.isComplete && "bg-green-500/20")}
                  />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={cn(
                      "h-full rounded-full shadow-lg transition-all", 
                      isOverTarget 
                        ? "bg-gradient-to-r from-green-500 to-emerald-400" 
                        : "bg-gradient-to-r from-primary to-purple-400"
                    )}
                  />
                  {/* Tick Marks for sets */}
                  <div className="absolute inset-0 flex justify-between px-[1px]">
                     {Array.from({ length: exercise.targetSets }).map((_, i) => (
                       <div key={i} className={cn("w-[2px] h-full", i===0 ? "bg-transparent" : "bg-background/30")} />
                     ))}
                  </div>
                </div>

                <div className="flex gap-3">
                   <Button 
                     variant="outline" 
                     className="flex-1 h-12 rounded-2xl border-2 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                     onClick={() => onUpdate("totalSetsDone", Math.max(0, data.totalSetsDone - 1))}
                     disabled={data.totalSetsDone === 0}
                   >
                     <Minus className="w-5 h-5" />
                   </Button>
                   <Button 
                     className="flex-[2] h-12 rounded-2xl text-lg font-black shadow-lg shadow-primary/20"
                     onClick={() => {
                        onUpdate("totalSetsDone", data.totalSetsDone + 1);
                        // Optional: Trigger global vibration/sound here
                     }}
                   >
                     סיימתי סט <Plus className="w-5 h-5 mr-2" />
                   </Button>
                </div>
              </div>

              {/* New Record Badge */}
              {beatPrevious && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 p-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-yellow-500/20"
                >
                  <Trophy className="w-5 h-5 fill-current" />
                  שברת שיא אישי!
                </motion.div>
              )}

              {/* Complete Exercise Checkbox */}
              <div 
                onClick={() => onUpdate("isComplete", !data.isComplete)}
                className={cn(
                  "flex items-center justify-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2",
                  data.isComplete 
                    ? "bg-green-500 border-green-500 text-white" 
                    : "bg-background border-dashed border-muted hover:border-primary/50 text-muted-foreground"
                )}
              >
                 <div className={cn(
                   "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                   data.isComplete ? "border-white bg-white/20" : "border-muted-foreground"
                 )}>
                    {data.isComplete && <Check className="w-4 h-4" />}
                 </div>
                 <span className="font-bold">
                   {data.isComplete ? "התרגיל הושלם" : "סמן תרגיל כהושלם"}
                 </span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

