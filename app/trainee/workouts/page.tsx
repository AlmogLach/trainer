"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Filter, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getActiveWorkoutPlan, getRoutinesWithExercises } from "@/lib/db";
import type { RoutineWithExercises } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [showFilter, setShowFilter] = useState(false);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [loading, setLoading] = useState(true);

  const traineeId = user?.id || "";

  useEffect(() => {
    if (!traineeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        const plan = await getActiveWorkoutPlan(traineeId);
        if (plan) {
          const routinesData = await getRoutinesWithExercises(plan.id);
          if (!cancelled) {
            setRoutines(routinesData);
          }
        }
      } catch (err) {
        console.error("Error loading workouts:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [traineeId]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
      case "A":
      case "B":
        return "bg-[#4CAF50]";
      case "Intermediate":
      case "C":
      case "D":
        return "bg-[#FF8A00]";
      case "Advanced":
      case "E":
        return "bg-[#EF4444]";
      default:
        return "bg-[#FF8A00]";
    }
  };

  const getDifficultyLabel = (letter: string) => {
    if (letter === "A" || letter === "B") return "מתחיל";
    if (letter === "C" || letter === "D") return "בינוני";
    if (letter === "E") return "מתקדם";
    return "בינוני";
  };

  // Workout images pool
  const routineImages = [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=240&fit=crop",
    "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=400&h=240&fit=crop",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=240&fit=crop",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=240&fit=crop",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=240&fit=crop"
  ];

  if (loading) {
    return <LoadingSpinner fullScreen text="טוען אימונים..." size="lg" />;
  }

  return (
    <div className="relative bg-[#1A1D2E] w-full min-h-screen">
      {/* Main Content */}
      <div className="w-full overflow-y-auto pb-24">
        <div className="w-full max-w-[393px] mx-auto px-5 pt-12">
          <div className="flex flex-col items-start w-full gap-6">
            
            {/* Header with Title and Filter Icon */}
            <div className="w-full flex items-center justify-between">
              <h1 className="text-[28px] font-outfit font-bold text-white">אימונים</h1>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="w-10 h-10 bg-[#2D3142] rounded-full flex items-center justify-center hover:bg-[#3D4058] transition-colors"
              >
                <Filter className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Workout Cards List */}
            {routines.length > 0 ? (
              <div className="w-full flex flex-col gap-5">
                {routines.map((routine, index) => (
                  <Link
                    key={routine.id}
                    href={`/trainee/workout?routine=${routine.id}`}
                    className="w-full rounded-2xl relative overflow-hidden hover:scale-[1.02] transition-transform"
                    style={{ height: '240px' }}
                  >
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${routineImages[index % routineImages.length]})`,
                        zIndex: 0,
                      }}
                    />

                    {/* Dark gradient overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(180deg, rgba(26, 29, 46, 0.3) 0%, rgba(26, 29, 46, 0.8) 70%, rgba(26, 29, 46, 0.95) 100%)',
                        zIndex: 1
                      }}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col h-full justify-between p-5">
                      <div className="flex items-start justify-between">
                        {/* Difficulty Badge */}
                        <div className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 ${getDifficultyColor(routine.letter || "C")}`}>
                          <span className="text-white text-xs font-outfit font-medium">
                            {getDifficultyLabel(routine.letter || "C")}
                          </span>
                        </div>

                      </div>

                      {/* Title */}
                      <div className="flex flex-col gap-1">
                        <h3 className="text-white text-2xl font-outfit font-bold leading-tight">
                          {routine.name || `אימון ${routine.letter}`}
                        </h3>
                        <p className="text-[#9CA3AF] text-sm font-outfit font-normal">
                          {routine.routine_exercises?.length || 0} תרגילים
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="w-full text-center py-12">
                <div className="bg-[#2D3142] rounded-2xl p-8">
                  <p className="text-[#9CA3AF] text-base font-outfit">אין אימונים זמינים</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}