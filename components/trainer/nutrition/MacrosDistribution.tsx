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
      <label className="text-sm text-gray-400 mb-2 block">חלוקת מקרונוטריינטים:</label>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">חלבון (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={proteinPercent}
            onChange={(e) => handleProteinChange(parseInt(e.target.value) || 0)}
            className="bg-[#0f1a2a] border-gray-700 text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">פחמימות (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={carbsPercent}
            onChange={(e) => handleCarbsChange(parseInt(e.target.value) || 0)}
            className="bg-[#0f1a2a] border-gray-700 text-white"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">שומן (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={fatPercent}
            onChange={(e) => handleFatChange(parseInt(e.target.value) || 0)}
            className="bg-[#0f1a2a] border-gray-700 text-white"
          />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#00ff88]"></div>
          <span className="text-gray-400">חלבון: {proteinPercent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#ffa500]"></div>
          <span className="text-gray-400">פחמימות: {carbsPercent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#ff6b6b]"></div>
          <span className="text-gray-400">שומן: {fatPercent}%</span>
        </div>
        <span className={`text-xs ${isValid ? 'text-[#00ff88]' : 'text-red-400'}`}>
          סה"כ: {total}%
        </span>
      </div>
    </div>
  );
}

