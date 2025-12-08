"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, History, X, Apple, Plus } from "lucide-react";
import type { FoodHistoryItem } from "@/lib/db";

interface FoodHistorySidebarProps {
  foodHistory: FoodHistoryItem[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMealId: string | null;
  mealName: string | null;
  onAddFood: (food: FoodHistoryItem) => void;
  onClose: () => void;
  onCancelSelection: () => void;
}

export function FoodHistorySidebar({
  foodHistory,
  loading,
  searchQuery,
  onSearchChange,
  selectedMealId,
  mealName,
  onAddFood,
  onClose,
  onCancelSelection,
}: FoodHistorySidebarProps) {
  const filteredHistory = foodHistory.filter(food =>
    food.foodName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className={`
      flex flex-col bg-white dark:bg-slate-900/50 border-l border-gray-200 dark:border-slate-800
      fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto w-full lg:w-80
    `}>
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <History className="h-4 w-4 sm:h-5 sm:w-5" />
          היסטוריית מזונות
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl"
          onClick={onClose}
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
      
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-slate-800">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="חפש מזון..."
            className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl focus:border-blue-600 dark:focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : (
          <>
            {selectedMealId && mealName && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">מוסיף לארוחה:</p>
                <p className="text-sm text-gray-900 dark:text-white font-medium">{mealName}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelSelection}
                  className="mt-2 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white h-6 px-2 rounded-xl"
                >
                  <X className="h-3 w-3 ml-1" />
                  ביטול בחירה
                </Button>
              </div>
            )}
            
            {filteredHistory.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-slate-400 py-8">
                {searchQuery ? 'לא נמצאו תוצאות' : 'אין היסטוריית מזונות'}
              </div>
            ) : (
              filteredHistory.map((food, index) => (
                <div
                  key={`${food.foodName}-${index}`}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer border border-gray-200 dark:border-slate-800 transition-colors"
                  onClick={() => onAddFood(food)}
                >
                  <Apple className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white text-xs sm:text-sm font-medium truncate">{food.foodName}</p>
                    {food.amount && (
                      <p className="text-gray-500 dark:text-slate-400 text-xs">כמות: {food.amount} גרם</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl shadow-sm flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddFood(food);
                    }}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </aside>
  );
}

