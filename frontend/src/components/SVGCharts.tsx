import React, { useState } from 'react';

// ==========================================
// 1. Donut Chart Component
// ==========================================
interface DonutChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  title?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, title }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let accumulatedPercent = 0;

  // Render slices using SVG path
  const slices = data.map((item, idx) => {
    if (item.value === 0) return null;

    const percentage = item.value / total;
    const startAngle = accumulatedPercent * 360;
    accumulatedPercent += percentage;
    const endAngle = accumulatedPercent * 360;

    // Convert angles to radians
    const radStart = ((startAngle - 90) * Math.PI) / 180;
    const radEnd = ((endAngle - 90) * Math.PI) / 180;

    const r = 38; // Radius
    const cx = 50;
    const cy = 50;

    // Start/End coordinates
    const x1 = cx + r * Math.cos(radStart);
    const y1 = cy + r * Math.sin(radStart);
    const x2 = cx + r * Math.cos(radEnd);
    const y2 = cy + r * Math.sin(radEnd);

    // Flag for arc greater than 180 degrees
    const largeArcFlag = percentage > 0.5 ? 1 : 0;

    // Path command
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

    const isHovered = activeIndex === idx;

    return (
      <path
        key={idx}
        d={d}
        fill="none"
        stroke={item.color}
        strokeWidth={isHovered ? 12 : 8}
        strokeLinecap="round"
        className="transition-all duration-200 cursor-pointer origin-center"
        onMouseEnter={() => setActiveIndex(idx)}
        onMouseLeave={() => setActiveIndex(null)}
      />
    );
  });

  const activeItem = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col items-center">
      {title && <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider self-start mb-4">{title}</span>}
      
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
          {slices}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-100">
            {activeItem ? activeItem.value : total}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            {activeItem ? activeItem.label : 'Total'}
          </span>
        </div>
      </div>

      {/* Legends */}
      <div className="mt-5 w-full grid grid-cols-2 gap-3 text-xs">
        {data.map((item, idx) => {
          const pct = total === 0 ? 0 : Math.round((item.value / total) * 100);
          return (
            <div
              key={idx}
              className={`flex items-center gap-2 p-1.5 rounded transition ${
                activeIndex === idx ? 'bg-slate-800/50' : ''
              }`}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-400 truncate">{item.label}</span>
              <span className="ml-auto font-bold text-slate-300">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 2. Bar Chart Component
// ==========================================
interface BarChartProps {
  data: {
    label: string;
    valueA: number; // Valid
    valueB: number; // Invalid
  }[];
  title?: string;
  valueSuffix?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title, valueSuffix = '' }) => {
  const maxVal = Math.max(...data.map((d) => Math.max(d.valueA, d.valueB)), 1);
  const roundedMax = Math.ceil(maxVal / 100) * 100;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
      {title && <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-5">{title}</span>}

      <div className="h-44 flex items-end justify-between gap-4 mt-2">
        {/* Y Axis labels */}
        <div className="flex flex-col justify-between h-full text-[10px] text-slate-500 font-semibold pr-2">
          <span>{roundedMax}{valueSuffix}</span>
          <span>{Math.round(roundedMax / 2)}{valueSuffix}</span>
          <span>0</span>
        </div>

        {/* Bars Container */}
        <div className="flex-1 h-full flex items-end justify-around border-b border-slate-700 pb-1">
          {data.map((item, idx) => {
            const heightA = (item.valueA / roundedMax) * 100;
            const heightB = (item.valueB / roundedMax) * 100;

            return (
              <div key={idx} className="flex flex-col items-center flex-1 max-w-[60px] group">
                <div className="flex items-end justify-center gap-1.5 w-full h-32 relative">
                  
                  {/* Tooltip */}
                  <div className="absolute -top-10 scale-0 group-hover:scale-100 transition duration-150 bg-slate-955 border border-slate-700 px-2 py-1 rounded text-[10px] text-slate-200 z-10 whitespace-nowrap shadow-xl">
                    <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"/> Valid: {item.valueA}</div>
                    <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full"/> Errors: {item.valueB}</div>
                  </div>

                  {/* Bar A */}
                  <div
                    className="w-3.5 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t hover:brightness-110 transition-all duration-500"
                    style={{ height: `${heightA}%` }}
                  />
                  {/* Bar B */}
                  <div
                    className="w-3.5 bg-gradient-to-t from-rose-600 to-rose-450 rounded-t hover:brightness-110 transition-all duration-500"
                    style={{ height: `${heightB}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-semibold mt-2 truncate w-full text-center">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Legend */}
      <div className="flex items-center gap-4 mt-4 text-[10px] font-semibold tracking-wider text-slate-400 uppercase justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-400" />
          <span>Valid records</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-rose-500" />
          <span>Errors / Exceptions</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. Line Chart Component
// ==========================================
interface LineChartProps {
  data: {
    label: string;
    value: number;
  }[];
  title?: string;
  valueSuffix?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ data, title, valueSuffix = '' }) => {
  const minVal = Math.min(...data.map((d) => d.value), 0);
  const maxVal = Math.max(...data.map((d) => d.value), 100);
  const diff = maxVal - minVal;

  const points = data
    .map((item, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = 90 - ((item.value - minVal) / diff) * 80;
      return `${x},${y}`;
    })
    .join(' ');

  // Gradient area path definition
  const areaPoints = `${points} 100,95 0,95`;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
      {title && <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-4">{title}</span>}

      <div className="relative h-44 mt-3">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#19C3B1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#19C3B1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="10" x2="100" y2="10" stroke="#283338" strokeWidth="0.5" strokeDasharray="3,3" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#283338" strokeWidth="0.5" strokeDasharray="3,3" />
          <line x1="0" y1="90" x2="100" y2="90" stroke="#283338" strokeWidth="0.5" />

          {/* Area Fill */}
          {data.length > 0 && <polygon points={areaPoints} fill="url(#areaGrad)" />}

          {/* Polyline Curve */}
          {data.length > 0 && (
            <polyline
              fill="none"
              stroke="#19C3B1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          )}

          {/* Markers */}
          {data.map((item, idx) => {
            const x = (idx / (data.length - 1)) * 100;
            const y = 90 - ((item.value - minVal) / diff) * 80;

            return (
              <g key={idx} className="group cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill="#11171B"
                  stroke="#22D6C3"
                  strokeWidth="1.5"
                  className="transition duration-150 hover:r-4"
                />
                <text
                  x={x}
                  y={y - 6}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="4"
                  fontWeight="bold"
                  className="opacity-0 group-hover:opacity-100 transition duration-150 bg-slate-900 pointer-events-none"
                >
                  {item.value}{valueSuffix}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* X axis labels */}
      <div className="flex justify-between mt-3 text-[10px] text-slate-500 font-semibold px-1">
        {data.map((d, idx) => (
          <span key={idx}>{d.label}</span>
        ))}
      </div>
    </div>
  );
};
export default DonutChart;
