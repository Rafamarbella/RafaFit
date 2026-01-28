import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  label: string;
  color?: string;
  unit?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, label, color = "bg-brand-500", unit = "g" }) => {
  const percentage = Math.min((current / max) * 100, 100);
  
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500 text-xs">{Math.round(current)} / {max}{unit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${color}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;