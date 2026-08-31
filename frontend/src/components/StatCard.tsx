import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
  };
  sparklineData?: number[];
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  sparklineData
}) => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition duration-300 shadow-lg relative overflow-hidden group">
      {/* Background soft lighting effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-hover:to-indigo-500/5 transition duration-300 rounded-xl" />

      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="p-2 bg-slate-850 border border-slate-700 rounded-lg text-indigo-400 group-hover:text-indigo-300 transition duration-300">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-100 tracking-tight">{value}</span>
        {trend && (
          <span
            className={`text-xs font-bold ${
              trend.type === 'up'
                ? 'text-emerald-400'
                : trend.type === 'down'
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        {subtext && <span className="text-slate-500 text-xs">{subtext}</span>}
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-16 h-6">
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke={trend?.type === 'down' ? '#fb7185' : '#34d399'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklineData
                  .map((val, idx) => {
                    const x = (idx / (sparklineData.length - 1)) * 100;
                    const min = Math.min(...sparklineData);
                    const max = Math.max(...sparklineData);
                    const diff = max - min === 0 ? 1 : max - min;
                    // Invert y because SVG y goes down
                    const y = 28 - ((val - min) / diff) * 26;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
export default StatCard;
