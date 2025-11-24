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
      flex flex-col bg-[#1a2332] border-l border-gray-800
      fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto
    `}>
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <History className="h-5 w-5" />
          היסטוריית מזונות
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-white hover:bg-gray-800"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="חפש מזון..."
            className="bg-[#0f1a2a] border-gray-700 text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#00ff88]" />
          </div>
        ) : (
          <>
            {selectedMealId && mealName && (
              <div className="mb-3 p-3 bg-[#00ff88]/20 border border-[#00ff88]/50 rounded-lg">
                <p className="text-xs text-[#00ff88] font-semibold mb-1">מוסיף לארוחה:</p>
                <p className="text-sm text-white">{mealName}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancelSelection}
                  className="mt-2 text-xs text-gray-400 hover:text-white h-6 px-2"
                >
                  <X className="h-3 w-3 ml-1" />
                  ביטול בחירה
                </Button>
              </div>
            )}
            
            {filteredHistory.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {searchQuery ? 'לא נמצאו תוצאות' : 'אין היסטוריית מזונות'}
              </div>
            ) : (
              filteredHistory.map((food, index) => (
                <div
                  key={`${food.foodName}-${index}`}
                  className="flex items-center gap-3 p-3 bg-[#0f1a2a] rounded-lg hover:bg-[#1a2332] cursor-pointer border border-gray-800"
                  onClick={() => onAddFood(food)}
                >
                  <Apple className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-white text-sm">{food.foodName}</p>
                    {food.amount && (
                      <p className="text-gray-500 text-xs">כמות: {food.amount} גרם</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#00ff88] hover:bg-[#00e677] text-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddFood(food);
                    }}
                  >
                    <Plus className="h-4 w-4" />
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

