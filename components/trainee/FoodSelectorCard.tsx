"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

export interface FoodSelectorCardProps {
  title: string;
  foodName: string | null;
  amount?: string | null;
  icon: LucideIcon;
  onSelect: () => void;
  className?: string;
}

export function FoodSelectorCard({
  title,
  foodName,
  amount,
  icon: Icon,
  onSelect,
  className = "",
}: FoodSelectorCardProps) {
  return (
    <Card className={`border-none shadow-sm bg-white dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden rounded-2xl ${className}`}>
      <CardHeader className="pb-3 p-5">
        <CardTitle className="text-gray-900 dark:text-white text-sm font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-0">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <Icon className="h-8 w-8 text-gray-600 dark:text-slate-400" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-900 dark:text-white font-semibold text-lg">
            {foodName || "בחר מזון"}
          </p>
          {foodName && amount && (
            <div className="mt-1">
              <p className="text-blue-600 dark:text-blue-400 font-bold text-base">
                {title === "יעד:" ? `~${amount}` : amount} גרם
              </p>
              {title === "יעד:" && (
                <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                  כמות משוערת לערכים דומים
                </p>
              )}
            </div>
          )}
        </div>
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold h-9 rounded-xl"
          onClick={onSelect}
        >
          שינוי
        </Button>
      </CardContent>
    </Card>
  );
}

