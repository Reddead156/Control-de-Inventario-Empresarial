/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface ChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
}

export function SVGBarChart({ data, color = "#3b82f6", height = 200 }: ChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 10);
  const chartHeight = height - 40; // reserve space for text below
  const chartWidth = 500;
  const numBars = data.length;
  const barPadding = 12;
  const totalPadding = barPadding * (numBars + 1);
  const availableWidth = chartWidth - totalPadding;
  const barWidth = availableWidth / numBars;

  return (
    <div className="relative w-full" id="svg-bar-chart-container">
      <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full h-auto text-gray-500 font-sans">
        {/* Draw subtle grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = 10 + ratio * chartHeight;
          const val = Math.round(maxValue * (1 - ratio));
          return (
            <g key={ratio} className="opacity-30">
              <line x1="40" y1={y} x2={chartWidth - 10} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
              <text x="10" y={y + 4} className="text-[10px] select-none fill-gray-500">{val}</text>
            </g>
          );
        })}

        {/* Draw Bars */}
        {data.map((d, idx) => {
          const ratio = d.value / maxValue;
          const barHeight = ratio * chartHeight;
          const x = 40 + idx * (barWidth + barPadding) + barPadding;
          const y = chartHeight - barHeight + 10;
          const isHovered = hoveredIdx === idx;

          return (
            <g 
              key={idx} 
              onMouseEnter={() => setHoveredIdx(idx)} 
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer transition-transform duration-200"
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 4)} // at least 4px tall
                rx="4"
                fill={isHovered ? "#1d4ed8" : color}
                className="transition-colors duration-150"
              />
              {/* Tooltip value */}
              {isHovered && (
                <g>
                  <rect 
                    x={x + barWidth/2 - 35} 
                    y={Math.max(y - 28, 5)} 
                    width="70" 
                    height="20" 
                    rx="3" 
                    fill="#1f2937" 
                  />
                  <text 
                    x={x + barWidth/2} 
                    y={Math.max(y - 15, 18)} 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    className="text-[10px] font-medium"
                  >
                    {d.value}
                  </text>
                </g>
              )}
              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 25}
                textAnchor="middle"
                className="text-[10px] font-medium fill-gray-600 select-none"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function SVGLineChart({ data, color = "#10b981", height = 200 }: ChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 10);
  const chartHeight = height - 40;
  const chartWidth = 500;
  
  const points = data.map((d, idx) => {
    const x = 40 + (idx / (data.length - 1 || 1)) * (chartWidth - 60);
    const y = chartHeight - (d.value / maxValue) * chartHeight + 10;
    return { x, y, label: d.label, val: d.value };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
    : "";

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight + 10} L ${points[0].x} ${chartHeight + 10} Z`
    : "";

  return (
    <div className="relative w-full" id="svg-line-chart-container">
      <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full h-auto text-gray-500 font-sans">
        {/* Draw subtle grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = 10 + ratio * chartHeight;
          const val = Math.round(maxValue * (1 - ratio));
          return (
            <g key={ratio} className="opacity-30">
              <line x1="40" y1={y} x2={chartWidth - 10} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
              <text x="10" y={y + 4} className="text-[10px] select-none fill-gray-500">{val}</text>
            </g>
          );
        })}

        {/* Shaded Area under spline */}
        {points.length > 1 && (
          <path
            d={areaD}
            fill={`url(#lineGradient-${color.replace("#","col-")})`}
            opacity="0.15"
          />
        )}

        {/* Linear Gradient config */}
        <defs>
          <linearGradient id={`lineGradient-${color.replace("#","col-")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Line Stroke */}
        {points.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Draw interaction nodes */}
        {points.map((p, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <g key={idx} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : 4}
                fill={isHovered ? "#ffffff" : color}
                stroke={color}
                strokeWidth={isHovered ? 3 : 2}
                className="cursor-pointer transition-all duration-150"
              />
              {isHovered && (
                <g>
                  <rect 
                    x={p.x - 35} 
                    y={Math.max(p.y - 32, 2)} 
                    width="70" 
                    height="20" 
                    rx="3" 
                    fill="#1f2937" 
                  />
                  <text 
                    x={p.x} 
                    y={Math.max(p.y - 19, 15)} 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    className="text-[10px] font-bold"
                  >
                    {p.val}
                  </text>
                </g>
              )}
              {/* Stagger labels periodically if many */}
              <text
                x={p.x}
                y={chartHeight + 25}
                textAnchor="middle"
                className="text-[9px] font-medium fill-gray-500 select-none"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function SVGDonutChart({ data, height = 200 }: ChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = 50;
  const strokeWidth = 14;
  const cx = 90;
  const cy = 100;
  const circumference = 2 * Math.PI * radius;

  // Colors mapping for pie slices (Enterprise SaaS palette)
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#6b7280"];

  let accumulatedAngle = 0;

  return (
    <div className="flex items-center gap-6 w-full" id="svg-donut-chart-container">
      {/* SVG Ring */}
      <div className="w-1/2 flex justify-center">
        <svg viewBox="0 0 180 200" className="w-[150px] h-[150px]">
          {data.map((d, idx) => {
            const percentage = d.value / total;
            const strokeDashoffset = circumference * (1 - percentage);
            const rotationAngle = (accumulatedAngle / total) * 360;
            accumulatedAngle += d.value;

            const isHovered = hoveredIdx === idx;
            const finalStrokeWidth = isHovered ? strokeWidth + 4 : strokeWidth;

            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={radius}
                fill="transparent"
                stroke={colors[idx % colors.length]}
                strokeWidth={finalStrokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(${rotationAngle - 90} ${cx} ${cy})`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-all duration-200"
              />
            );
          })}
          
          {/* Centered overall indicator */}
          <text x={cx} y={cy - 4} textAnchor="middle" className="text-sm font-semibold fill-gray-800">
            Total
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" className="text-xs font-bold fill-indigo-600">
            {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
          </text>
        </svg>
      </div>

      {/* Narrative Legend block */}
      <div className="w-1/2 flex flex-col gap-2">
        {data.map((d, idx) => {
          const pct = ((d.value / total) * 100).toFixed(1);
          return (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-1 rounded transition-colors ${hoveredIdx === idx ? "bg-gray-50" : ""}`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                <span className="text-xs text-gray-700 truncate max-w-[90px]" title={d.label}>{d.label}</span>
              </div>
              <span className="text-xs font-semibold text-gray-800">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

