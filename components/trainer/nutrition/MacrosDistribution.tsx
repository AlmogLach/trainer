"use client";

import { Input } from "@/components/ui/input";

interface MacrosDistributionProps {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  onProteinChange: (value: number) => void;
  onCarbsChange: (value: number) => void;
  onFatChange: (value: number) => void;
}

export function MacrosDistribution({
  proteinPercent,
  carbsPercent,
  fatPercent,
  onProteinChange,
  onCarbsChange,
  onFatChange,
}: MacrosDistributionProps) {
  const total = proteinPercent + carbsPercent + fatPercent;
  const isValid = total === 100;

  const handleProteinChange = (value: number) => {
    const remaining = 100 - value - carbsPercent;
    onProteinChange(value);
    if (remaining >= 0 && remaining <= 100) {
      onFatChange(remaining);
    }
  };

  const handleCarbsChange = (value: number) => {
    const remaining = 100 - proteinPercent - value;
    onCarbsChange(value);
    if (remaining >= 0 && remaining <= 100) {
      onFatChange(remaining);
    }
  };

  const handleFatChange = (value: number) => {
    const remaining = 100 - proteinPercent - carbsPercent;
    onFatChange(value);
    if (remaining >= 0 && remaining <= 100) {
      onCarbsChange(remaining);
    }
  };

  return (
    <div>
      <label className="text-sm text-gray-900 dark:text-white mb-2 block font-bold">חלוקת מקרונוטריינטים:</label>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">חלבון (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={proteinPercent}
            onChange={(e) => handleProteinChange(parseInt(e.target.value) || 0)}
            className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl focus:border-blue-600 dark:focus:border-blue-500 transition-all"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">פחמימות (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={carbsPercent}
            onChange={(e) => handleCarbsChange(parseInt(e.target.value) || 0)}
            className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl focus:border-blue-600 dark:focus:border-blue-500 transition-all"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block font-medium">שומן (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={fatPercent}
            onChange={(e) => handleFatChange(parseInt(e.target.value) || 0)}
            className="bg-white dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl focus:border-blue-600 dark:focus:border-blue-500 transition-all"
          />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-600 dark:bg-blue-400"></div>
          <span className="text-gray-900 dark:text-white font-bold">חלבון: {proteinPercent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500 dark:bg-orange-400"></div>
          <span className="text-gray-900 dark:text-white font-bold">פחמימות: {carbsPercent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500 dark:bg-red-400"></div>
          <span className="text-gray-900 dark:text-white font-bold">שומן: {fatPercent}%</span>
        </div>
        <span className={`text-xs font-bold ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          סה"כ: {total}%
        </span>
      </div>
    </div>
  );
}

