"use client";

import { useState, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Bell, Search, Settings, Play, Heart, Footprints,
  Home, Eye, BarChart3, User, Clock, Dumbbell, Flame
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveWorkoutPlan, getRoutinesWithExercises, getWorkoutLogs } from "@/lib/db";
import type { WorkoutPlan, RoutineWithExercises } from "@/lib/types";

export default function TraineeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([]);
  const [activeTab, setActiveTab] = useState<"discover" | "my-workouts">("discover");

  const traineeId = user?.id || "";

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!traineeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [plan, logs] = await Promise.all([
          getActiveWorkoutPlan(traineeId),
          getWorkoutLogs(traineeId, 30),
        ]);
        
        if (!cancelled) {
          setWorkoutPlan(plan);
          if (plan) {
            const routinesData = await getRoutinesWithExercises(plan.id);
            if (!cancelled) {
              setRoutines(routinesData);
            }
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [traineeId, authLoading]);

  // Mock data for activity stats
  const steps = 223430;
  const stepsProgress = 85; // 85% of goal
  const heartRate = 105;

  if (loading || authLoading) {
    return (
      <div className="w-full h-screen bg-grey-g6 flex items-center justify-center">
        <div className="text-grey-g1">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-grey-g6" style={{ maxWidth: '393px', margin: '0 auto' }}>
      {/* Mobile Header - Status Bar */}
      <div className="absolute top-0 left-0 w-full h-[46px] flex items-center justify-between px-5 pt-[18px] pb-3">
        <div className="text-white text-xs font-semibold font-open-sans">08:45</div>
        <div className="flex items-center gap-2">
          {/* Signal, WiFi, Battery icons - simplified */}
          <div className="w-4 h-3 bg-white rounded-sm"></div>
          <div className="w-4 h-4 bg-white rounded-full"></div>
          <div className="w-6 h-3 bg-white rounded-sm"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="absolute top-[46px] left-0 w-full overflow-y-auto" style={{ height: 'calc(100vh - 118px)' }}>
        <div className="flex flex-col items-start px-5 pt-6 gap-5">
          
          {/* Header with Avatar and Notification */}
          <div className="flex flex-row justify-between items-center w-full gap-[38px]">
            <div className="flex items-center gap-3 mx-auto">
              <Avatar className="w-14 h-14">
                <AvatarFallback className="bg-grey-g5 text-grey-g1">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5">
                <div className="text-grey-g1 text-xs font-outfit font-normal">Welcome</div>
                <div className="text-white text-2xl font-outfit font-semibold leading-[30px]">
                  {user?.name || 'Stephen'}
                </div>
              </div>
            </div>
            <div className="w-8 h-8 bg-grey-g5 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Tabs */}
          <div className="w-full border-b border-grey-g1/50 pb-3.5">
            <div className="flex">
              <button
                onClick={() => setActiveTab("discover")}
                className={`flex-1 flex flex-col items-center justify-between pb-3.5 px-3.5 ${
                  activeTab === "discover" ? "border-b-[3px] border-primary-g3" : ""
                }`}
              >
                <span className={`text-sm font-outfit leading-[18px] ${
                  activeTab === "discover" 
                    ? "text-primary-g3 font-semibold" 
                    : "text-grey-g1 font-normal"
                }`}>
                  Discover
                </span>
              </button>
              <button
                onClick={() => setActiveTab("my-workouts")}
                className={`flex-1 flex flex-col items-center justify-between pb-3.5 px-3.5 ${
                  activeTab === "my-workouts" ? "border-b-[3px] border-primary-g3" : ""
                }`}
              >
                <span className={`text-sm font-outfit leading-[18px] ${
                  activeTab === "my-workouts" 
                    ? "text-primary-g3 font-semibold" 
                    : "text-grey-g1 font-normal"
                }`}>
                  My Workouts
                </span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="w-full h-[42px] bg-grey-g5 rounded-lg flex items-center gap-2 px-3">
            <Search className="w-[18px] h-[18px] text-grey-g2" />
            <input
              type="text"
              placeholder="Search"
              className="flex-1 bg-transparent text-grey-g1 text-xs font-outfit font-normal outline-none"
            />
          </div>

          {/* Your Activity Section */}
          <div className="w-full flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <h2 className="text-grey-g1 text-sm font-outfit font-semibold leading-[18px]">
                Your Activity
              </h2>
              <button className="w-5 h-5 rounded-full">
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex gap-4">
              {/* Steps Card */}
              <div className="flex-1 bg-grey-g5 rounded-xl p-3 flex flex-col gap-2.5">
                <div className="text-grey-g1 text-xs font-outfit font-normal">Steps</div>
                <div className="flex flex-col items-center gap-3.5">
                  {/* Circular Progress */}
                  <div className="relative w-[124px] h-[124px]">
                    <svg className="w-[124px] h-[124px] transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="62"
                        cy="62"
                        r="54"
                        fill="none"
                        stroke="#8D8DAF"
                        strokeWidth="8"
                        opacity="0.3"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="62"
                        cy="62"
                        r="54"
                        fill="none"
                        stroke="#146BE6"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 54}`}
                        strokeDashoffset={`${2 * Math.PI * 54 * (1 - stepsProgress / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <div className="text-primary-g4 text-lg font-outfit font-semibold leading-[22px] text-center">
                        {steps.toLocaleString()}
                      </div>
                      <div className="text-grey-g2 text-xs font-outfit font-normal text-center">
                        Steps
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Heart Rate Card */}
              <div className="flex-1 bg-grey-g5 rounded-xl p-3 flex flex-col justify-between">
                <div className="text-grey-g1 text-xs font-outfit font-normal text-center">Heart</div>
                <div className="flex flex-col items-center gap-2.5">
                  {/* Line Graph - simplified */}
                  <div className="relative w-full h-[68px]">
                    <svg className="w-full h-full" viewBox="0 0 143 68">
                      <polyline
                        points="0,60 20,50 40,45 60,40 80,35 100,30 120,25 143,20"
                        fill="none"
                        stroke="#146BE6"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-primary-g4 text-lg font-outfit font-semibold leading-[22px]">
                      {heartRate}
                    </div>
                    <div className="text-grey-g2 text-xs font-outfit font-normal">bpm</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Workouts Section */}
          <div className="w-full flex flex-col gap-3">
            <h2 className="text-grey-g1 text-sm font-open-sans font-semibold leading-[19px]">
              Popular Workouts
            </h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide">
              {routines.slice(0, 3).map((routine, idx) => (
                <div
                  key={routine.id}
                  className="flex-shrink-0 w-[240px] h-[122px] bg-grey-g5 rounded-xl p-3 relative overflow-hidden"
                >
                  {/* Background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-grey-g6/80 to-transparent"></div>
                  
                  <div className="relative z-10 flex flex-col gap-2 h-full">
                    <h3 className="text-white text-base font-outfit font-semibold leading-5">
                      {routine.name || `Workout ${routine.letter}`}
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1 bg-grey-g1 rounded-xl px-1.5 py-1 w-fit">
                        <Flame className="w-3.5 h-3.5 text-grey-g6" />
                        <span className="text-grey-g6 text-[10px] font-outfit font-normal">542 KCal</span>
                      </div>
                      <div className="flex items-center gap-1 bg-grey-g1 rounded-xl px-1.5 py-1 w-fit">
                        <Clock className="w-3.5 h-3.5 text-grey-g6" />
                        <span className="text-grey-g6 text-[10px] font-outfit font-normal">35 mins</span>
                      </div>
                    </div>
                    <div className="mt-auto ml-auto">
                      <button className="w-8 h-8 bg-primary-g4 rounded-full flex items-center justify-center">
                        <Play className="w-4.5 h-4.5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Plan Section */}
          <div className="w-full flex flex-col gap-3">
            <h2 className="text-grey-g1 text-sm font-open-sans font-semibold leading-[19px]">
              Today's Plan
            </h2>
            <div className="flex flex-col gap-4">
              {routines.slice(0, 3).map((routine, idx) => (
                <div
                  key={routine.id}
                  className="w-full h-[105px] bg-grey-g5 rounded-lg p-2 flex items-center gap-3.5"
                >
                  {/* Image placeholder */}
                  <div className="w-[102px] h-[89px] bg-grey-g2 rounded-md flex-shrink-0"></div>
                  
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="text-white text-lg font-outfit font-semibold leading-[22px]">
                      {routine.name || 'Push Up'}
                    </div>
                    <div className={`inline-flex items-center justify-center px-2 py-1.5 rounded ${
                      idx === 0 ? 'bg-accent-orange' : idx === 1 ? 'bg-accent-green' : 'bg-accent-orange'
                    }`}>
                      <span className="text-white text-[10px] font-outfit font-normal">
                        {idx === 0 ? 'Intermediate' : idx === 1 ? 'Beginner' : 'Intermediate'}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="relative w-full h-[19px] bg-grey-g3 rounded">
                      <div 
                        className="absolute left-0 top-0 h-full bg-grey-g1 rounded"
                        style={{ width: `${25 + idx * 25}%` }}
                      >
                        <div className="absolute left-0 top-0 h-full w-[55px] bg-grey-g1 rounded flex items-center justify-center">
                          <span className="text-grey-g6 text-[10px] font-outfit font-normal">
                            {25 + idx * 25}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 w-full h-[72px] bg-grey-g6 rounded-t-[24px] shadow-[0px_-4px_12px_rgba(17,17,24,0.18)]">
        <div className="flex justify-between items-center px-[15px] py-3 pb-5 gap-2.5">
          <Link href="/trainee/dashboard" className="flex flex-col items-center gap-1.5 px-3 py-1.5 bg-primary-g4 rounded-[20px]">
            <Home className="w-6 h-6 text-white" />
            <span className="text-white text-xs font-outfit font-normal leading-[15px]">Home</span>
          </Link>
          <Link href="/trainee/workout" className="flex flex-col items-center gap-1.5 px-3 py-2">
            <Eye className="w-6 h-6 text-grey-g1" />
          </Link>
          <Link href="/trainee/workout" className="flex flex-col items-center gap-1.5 px-3 py-2">
            <Dumbbell className="w-6 h-6 text-grey-g1" />
          </Link>
          <Link href="/trainee/history" className="flex flex-col items-center gap-1.5 px-3 py-2">
            <BarChart3 className="w-6 h-6 text-grey-g1" />
          </Link>
          <Link href="/trainee/settings" className="flex flex-col items-center gap-1.5 px-3 py-2">
            <User className="w-6 h-6 text-grey-g1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

