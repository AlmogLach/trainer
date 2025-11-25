"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Calendar, Mail, Dumbbell, TrendingUp, Eye } from "lucide-react";

interface TraineeCardProps {
  trainee: {
    id: string;
    name: string;
    email: string;
    created_at: string;
    planActive: boolean;
    planName: string | null;
    lastWorkout: string | null;
  };
}

export function TraineeCard({ trainee }: TraineeCardProps) {
  const formatJoinDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all shadow-md hover:shadow-lg rounded-xl sm:rounded-2xl group">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
            {/* Enhanced Avatar */}
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center text-primary font-black text-xl sm:text-3xl border-2 border-primary/30 shadow-lg group-hover:scale-105 transition-transform flex-shrink-0">
              {trainee.name.charAt(0)}
            </div>
            
            <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
              {/* Name */}
              <h3 className="text-lg sm:text-2xl font-black text-foreground truncate">{trainee.name}</h3>
              
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Email */}
                <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                  <div className="bg-blue-500/20 p-1 sm:p-1.5 rounded-lg flex-shrink-0">
                    <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" />
                  </div>
                  <span className="text-muted-foreground font-medium truncate">{trainee.email}</span>
                </div>
                
                {/* Join Date */}
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <div className="bg-purple-500/20 p-1 sm:p-1.5 rounded-lg flex-shrink-0">
                    <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-500" />
                  </div>
                  <span className="text-muted-foreground font-medium whitespace-nowrap">הצטרף: {formatJoinDate(trainee.created_at)}</span>
                </div>
                
                {/* Active Plan */}
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <div className={`${trainee.planActive ? 'bg-green-500/20' : 'bg-gray-500/20'} p-1 sm:p-1.5 rounded-lg flex-shrink-0`}>
                    <Dumbbell className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${trainee.planActive ? 'text-green-500' : 'text-gray-500'}`} />
                  </div>
                  <span className={`font-bold ${trainee.planActive ? 'text-green-500' : 'text-muted-foreground'} truncate`}>
                    {trainee.planName || "אין תוכנית"}
                  </span>
                </div>
                
                {/* Last Workout */}
                {trainee.lastWorkout && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <div className="bg-orange-500/20 p-1 sm:p-1.5 rounded-lg flex-shrink-0">
                      <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500" />
                    </div>
                    <span className="text-muted-foreground font-medium whitespace-nowrap">אימון אחרון: {formatJoinDate(trainee.lastWorkout)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
            {trainee.planActive && (
              <Link href={`/trainer/workout-plans/${trainee.id}/edit`} className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto h-10 sm:h-11 px-4 sm:px-5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-lg sm:rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm sm:text-base">
                  <Eye className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">צפה בתוכנית</span>
                  <span className="sm:hidden">תוכנית</span>
                </Button>
              </Link>
            )}
            <Link href={`/trainer/trainee/${trainee.id}`} className="flex-1 sm:flex-none">
              <Button className="w-full sm:w-auto h-10 sm:h-11 px-4 sm:px-5 bg-accent/50 hover:bg-accent text-foreground font-black rounded-lg sm:rounded-xl border-2 border-border hover:border-primary/30 transition-all active:scale-95 text-sm sm:text-base">
                <Settings className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">ניהול מתאמן</span>
                <span className="sm:hidden">ניהול</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

