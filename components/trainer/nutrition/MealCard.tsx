"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, History, X } from "lucide-react";

export interface Meal {
  id: string;
  mealName: string;
  foods: Array<{
    id: string;
    foodName: string;
    amount: string;
  }>;
}

interface MealCardProps {
  meal: Meal;
  isOnlyMeal: boolean;
  onUpdateName: (id: string, name: string) => void;
  onAddFood: (id: string) => void;
  onRemoveFood: (mealId: string, foodId: string) => void;
  onUpdateFood: (mealId: string, foodId: string, field: "foodName" | "amount", value: string) => void;
  onRemove: (id: string) => void;
  onOpenFoodHistory: (mealId: string) => void;
}

export function MealCard({
  meal,
  isOnlyMeal,
  onUpdateName,
  onAddFood,
  onRemoveFood,
  onUpdateFood,
  onRemove,
  onOpenFoodHistory,
}: MealCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(meal.mealName);

  const handleSaveName = () => {
    if (editingName.trim()) {
      onUpdateName(meal.id, editingName.trim());
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingName(meal.mealName);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="border border-gray-800 rounded-lg p-4 bg-[#0f1a2a]">
      <div className="flex items-center justify-between mb-4">
        {isEditingName ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-[#1a2332] border-gray-700 text-white flex-1 max-w-xs"
            />
            <Button
              size="sm"
              onClick={handleSaveName}
              className="bg-[#00ff88] hover:bg-[#00e677] text-black"
            >
              שמור
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <h3 
              className="text-lg font-semibold text-white cursor-pointer hover:text-[#00ff88] transition-colors"
              onClick={() => {
                setIsEditingName(true);
                setEditingName(meal.mealName);
              }}
            >
              {meal.mealName}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditingName(true);
                  setEditingName(meal.mealName);
                }}
                className="text-gray-400 hover:text-white"
              >
                <Edit className="h-4 w-4" />
              </Button>
              {!isOnlyMeal && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(meal.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenFoodHistory(meal.id)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  title="הוסף מהיסטוריה"
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAddFood(meal.id)}
                  className="bg-[#00ff88] hover:bg-[#00e677] text-black font-semibold"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף מזון
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {meal.foods.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">אין מזונות בארוחה זו</p>
      ) : (
        <div className="space-y-3">
          {meal.foods.map((food) => (
            <div key={food.id} className="flex items-center gap-3 p-3 bg-[#1a2332] rounded-lg border border-gray-800">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">שם המזון:</label>
                  <Input
                    value={food.foodName}
                    onChange={(e) => onUpdateFood(meal.id, food.id, "foodName", e.target.value)}
                    placeholder="לדוגמה: חזה עוף"
                    className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">כמות (גרם):</label>
                  <Input
                    type="number"
                    value={food.amount}
                    onChange={(e) => onUpdateFood(meal.id, food.id, "amount", e.target.value)}
                    placeholder="200"
                    className="bg-[#0f1a2a] border-gray-700 text-white text-sm"
                  />
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveFood(meal.id, food.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

