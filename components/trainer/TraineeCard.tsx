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
    <Card className="bg-card border-2 border-border hover:border-primary/50 transition-all shadow-md hover:shadow-lg rounded-2xl group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Enhanced Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center text-primary font-black text-3xl border-2 border-primary/30 shadow-lg group-hover:scale-105 transition-transform">
              {trainee.name.charAt(0)}
            </div>
            
            <div className="flex-1 space-y-3">
              {/* Name */}
              <h3 className="text-2xl font-black text-foreground">{trainee.name}</h3>
              
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Email */}
                <div className="flex items-center gap-2 text-sm">
                  <div className="bg-blue-500/20 p-1.5 rounded-lg">
                    <Mail className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <span className="text-muted-foreground font-medium truncate">{trainee.email}</span>
                </div>
                
                {/* Join Date */}
                <div className="flex items-center gap-2 text-sm">
                  <div className="bg-purple-500/20 p-1.5 rounded-lg">
                    <Calendar className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                  <span className="text-muted-foreground font-medium">הצטרף: {formatJoinDate(trainee.created_at)}</span>
                </div>
                
                {/* Active Plan */}
                <div className="flex items-center gap-2 text-sm">
                  <div className={`${trainee.planActive ? 'bg-green-500/20' : 'bg-gray-500/20'} p-1.5 rounded-lg`}>
                    <Dumbbell className={`h-3.5 w-3.5 ${trainee.planActive ? 'text-green-500' : 'text-gray-500'}`} />
                  </div>
                  <span className={`font-bold ${trainee.planActive ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {trainee.planName || "אין תוכנית"}
                  </span>
                </div>
                
                {/* Last Workout */}
                {trainee.lastWorkout && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="bg-orange-500/20 p-1.5 rounded-lg">
                      <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                    </div>
                    <span className="text-muted-foreground font-medium">אימון אחרון: {formatJoinDate(trainee.lastWorkout)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {trainee.planActive && (
              <Link href={`/trainer/workout-plans/${trainee.id}/edit`}>
                <Button className="h-11 px-5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-background font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
                  <Eye className="ml-2 h-4 w-4" />
                  צפה בתוכנית
                </Button>
              </Link>
            )}
            <Link href={`/trainer/trainee/${trainee.id}`}>
              <Button className="h-11 px-5 bg-accent/50 hover:bg-accent text-foreground font-black rounded-xl border-2 border-border hover:border-primary/30 transition-all active:scale-95 whitespace-nowrap">
                <Settings className="ml-2 h-4 w-4" />
                ניהול מתאמן
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

