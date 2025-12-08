"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, X, Share2, Trophy, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getWorkoutLogs } from "@/lib/db";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type Achievement = {
  id: string;
  title: string;
  date: string;
  image: string;
  description?: string;
};

export default function AchievementsPage() {
  const { user } = useAuth();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load workout logs
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const logs = await getWorkoutLogs(user.id, 365); // Last year
        setWorkoutLogs(logs || []);
      } catch (err) {
        console.error("Error loading achievements:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Calculate Personal Records from workout logs (best performances)
  const personalRecords = useMemo(() => {
    const completedLogs = workoutLogs.filter(log => log.completed);
    if (completedLogs.length === 0) return [];

    const achievementImages = [
      "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=300&h=300&fit=crop",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&h=300&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop",
    ];

    // Get first workout
    const firstWorkout = completedLogs[completedLogs.length - 1]; // Oldest
    if (!firstWorkout) return [];

    const records: Achievement[] = [];

    // First workout achievement
    if (firstWorkout) {
      const date = new Date(firstWorkout.date || firstWorkout.start_time);
      records.push({
        id: firstWorkout.id,
        title: "אימון ראשון",
        date: date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }),
        image: achievementImages[0],
        description: `סיימת את האימון הראשון שלך: ${firstWorkout.routine?.name || `אימון ${firstWorkout.routine?.letter || ''}`}`
      });
    }

    // Milestone achievements (10th, 25th, 50th, 100th workout)
    const milestones = [10, 25, 50, 100];
    milestones.forEach((milestone, idx) => {
      if (completedLogs.length >= milestone) {
        const milestoneLog = completedLogs[completedLogs.length - milestone];
        if (milestoneLog) {
          const date = new Date(milestoneLog.date || milestoneLog.start_time);
          records.push({
            id: `${milestoneLog.id}-${milestone}`,
            title: `אימון ${milestone}`,
            date: date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }),
            image: achievementImages[(idx + 1) % achievementImages.length],
            description: `סיימת ${milestone} אימונים!`
          });
        }
      }
    });

    return records.slice(0, 3); // Show max 3
  }, [workoutLogs]);

  // Calculate Awards (milestones and special achievements)
  const awards = useMemo(() => {
    const completedLogs = workoutLogs.filter(log => log.completed);
    if (completedLogs.length === 0) return [];

    const awardImages = [
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&h=300&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop",
      "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=300&h=300&fit=crop",
    ];

    const awardsList: Achievement[] = [];

    // Weekly streak (7 workouts in a row)
    // Monthly consistency (4+ workouts in a month)
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthLogs = completedLogs.filter(log => {
      const logDate = new Date(log.date || log.start_time);
      return logDate >= thisMonth;
    });

    if (thisMonthLogs.length >= 4) {
      awardsList.push({
        id: 'monthly-consistency',
        title: "עקביות חודשית",
        date: now.toLocaleDateString('he-IL', { month: 'short', year: 'numeric' }),
        image: awardImages[0],
        description: "ביצעת 4+ אימונים החודש!"
      });
    }

    // Total workouts milestones
    if (completedLogs.length >= 50) {
      awardsList.push({
        id: 'power-machine',
        title: "מכונת כוח",
        date: completedLogs[0] ? new Date(completedLogs[0].date || completedLogs[0].start_time).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
        image: awardImages[1],
        description: "סיימת 50+ אימונים!"
      });
    }

    if (completedLogs.length >= 100) {
      awardsList.push({
        id: 'challenger',
        title: "אתגר",
        date: completedLogs[0] ? new Date(completedLogs[0].date || completedLogs[0].start_time).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
        image: awardImages[2],
        description: "סיימת 100+ אימונים!"
      });
    }

    // Fill up to 4 if needed
    while (awardsList.length < 4 && completedLogs.length > 0) {
      const log = completedLogs[Math.floor(Math.random() * completedLogs.length)];
      const date = new Date(log.date || log.start_time);
      awardsList.push({
        id: `award-${awardsList.length}`,
        title: log.routine?.name || `אימון ${log.routine?.letter || ''}`,
        date: date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }),
        image: awardImages[awardsList.length % awardImages.length],
        description: `סיימת את האימון: ${log.routine?.name || `אימון ${log.routine?.letter || ''}`}`
      });
    }

    return awardsList.slice(0, 4);
  }, [workoutLogs]);

  const handleShare = () => {
    if (navigator.share && selectedAchievement) {
      navigator.share({
        title: selectedAchievement.title,
        text: selectedAchievement.description || `השיגתי הישג: ${selectedAchievement.title}`,
      }).catch(console.error);
    } else {
      console.log("Share:", selectedAchievement);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="טוען הישגים..." size="lg" />;
  }

  return (
    <div className="relative bg-[#1A1D2E] w-full min-h-screen">
      {/* Main Content */}
      <div className="w-full overflow-y-auto pb-24">
        <div className="w-full max-w-[393px] mx-auto px-5 pt-12">
          <div className="flex flex-col items-start w-full gap-6">
            
            {/* Header with Back Button and Title */}
            <div className="w-full flex items-center gap-4">
              <Link href="/trainee/settings">
                <button className="w-10 h-10 bg-[#2D3142] rounded-full flex items-center justify-center hover:bg-[#3D4058] transition-colors">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              </Link>
              <h1 className="text-[28px] font-outfit font-bold text-white">הישגים</h1>
            </div>

            {/* Personal Records Section */}
            <div className="w-full flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#FF8A00]" />
                <h2 className="text-lg font-outfit font-bold text-white">שיאים אישיים</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-5 px-5">
                {personalRecords.length > 0 ? personalRecords.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => setSelectedAchievement(record)}
                    className="flex-shrink-0 bg-[#2D3142] rounded-2xl p-4 flex flex-col items-center hover:bg-[#3D4058] transition-all active:scale-95 w-[130px] gap-3"
                  >
                    <div 
                      className="w-20 h-20 rounded-full bg-cover bg-center border-4 border-[#1A1D2E]"
                      style={{ backgroundImage: `url(${record.image})` }}
                    />
                    <div className="text-sm font-outfit font-bold text-white text-center">{record.title}</div>
                    <div className="text-xs font-outfit font-normal text-[#9CA3AF] text-center">{record.date}</div>
                  </button>
                )) : (
                  <div className="flex-shrink-0 w-[130px] bg-[#2D3142] rounded-2xl p-4 flex flex-col items-center justify-center">
                    <p className="text-[#9CA3AF] text-xs text-center">אין שיאים עדיין</p>
                  </div>
                )}
              </div>
            </div>

            {/* Awards Section */}
            <div className="w-full flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#5B7FFF]" />
                <h2 className="text-lg font-outfit font-bold text-white">פרסים</h2>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full">
                {awards.length > 0 ? awards.map((award) => (
                  <button
                    key={award.id}
                    onClick={() => setSelectedAchievement(award)}
                    className="bg-[#2D3142] rounded-2xl p-3 flex flex-col items-center hover:bg-[#3D4058] transition-all active:scale-95 gap-3"
                  >
                    <div 
                      className="w-16 h-16 rounded-full bg-cover bg-center border-4 border-[#1A1D2E]"
                      style={{ backgroundImage: `url(${award.image})` }}
                    />
                    <div className="text-xs font-outfit font-bold text-white text-center leading-tight">{award.title}</div>
                    <div className="text-[10px] font-outfit font-normal text-[#9CA3AF] text-center">{award.date}</div>
                  </button>
                )) : (
                  <div className="col-span-3 bg-[#2D3142] rounded-2xl p-6 flex items-center justify-center">
                    <p className="text-[#9CA3AF] text-sm text-center">אין פרסים עדיין</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div 
          className="fixed inset-0 z-50 bg-[#1A1D2E] flex flex-col items-center justify-center"
          dir="ltr"
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedAchievement(null)}
            className="absolute top-6 left-6 w-12 h-12 bg-[#2D3142] rounded-full flex items-center justify-center z-10 hover:bg-[#3D4058] transition-colors active:scale-95"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Content */}
          <div className="flex flex-col items-center justify-center flex-1 w-full px-6 gap-6">
            {/* Circular Image with glow effect */}
            <div className="relative">
              <div 
                className="w-72 h-72 rounded-full bg-cover bg-center border-8 border-[#2D3142]"
                style={{ backgroundImage: `url(${selectedAchievement.image})` }}
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-[#5B7FFF]/20 to-transparent"></div>
            </div>

            {/* Title */}
            <div className="text-3xl font-outfit font-bold text-white text-center">
              {selectedAchievement.title}
            </div>

            {/* Date with icon */}
            <div className="flex items-center gap-2 bg-[#2D3142] px-4 py-2 rounded-full">
              <Trophy className="w-4 h-4 text-[#FF8A00]" />
              <span className="text-sm font-outfit font-semibold text-white">
                {selectedAchievement.date}
              </span>
            </div>

            {/* Description */}
            <div className="text-lg font-outfit font-normal text-[#9CA3AF] text-center px-6 max-w-md leading-relaxed">
              {selectedAchievement.description || `השיגת את ההישג: ${selectedAchievement.title}`}
            </div>
          </div>

          {/* Share Button */}
          <div className="w-full px-6 pb-8">
            <button
              onClick={handleShare}
              className="w-full bg-[#5B7FFF] hover:bg-[#6B8EFF] rounded-2xl flex items-center justify-center gap-2 py-4 transition-all active:scale-95"
            >
              <Share2 className="w-5 h-5 text-white" />
              <span className="text-white text-lg font-outfit font-bold">שתף הישג</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}