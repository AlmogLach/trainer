"use client";

import React, { useState, useRef, useEffect } from "react";

export interface SimpleLineChartProps {
  // Support both { date, value } and { date, weight } formats
  data: Array<{ date: string; value?: number; weight?: number }>;
  currentValue?: number | null;
  unit?: string;
  height?: number;
  color?: string;
  className?: string;
  chartWidth?: number;
  yAxisSteps?: number;
  useThemeColors?: boolean; // Use theme classes instead of hardcoded colors
  label?: string; // Optional label at the bottom
  showGradient?: boolean; // Show gradient fill under the line
  showTooltip?: boolean; // Show interactive tooltip
  showXAxis?: boolean; // Show X-axis date labels
}

export function SimpleLineChart({ 
  data, 
  currentValue, 
  unit = "kg", 
  height = 180,
  color = "#00ff88",
  className = "",
  chartWidth: propChartWidth,
  yAxisSteps = 3,
  useThemeColors = false,
  label,
  showGradient = true,
  showTooltip = true,
  showXAxis = true
}: SimpleLineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (data.length === 0) {
    return (
      <div style={{ height }} className={`flex items-center justify-center ${useThemeColors ? 'text-muted-foreground' : 'text-gray-500'} ${className}`}>
        אין נתונים להצגה
      </div>
    );
  }

  // Normalize data - support both 'value' and 'weight' properties
  const normalizedData = data.map(d => ({
    date: d.date,
    value: d.value ?? d.weight ?? 0
  }));

  // Responsive padding based on screen size
  const padding = { 
    top: isMobile ? 15 : 20, 
    right: isMobile ? 10 : 20, 
    bottom: showXAxis ? (isMobile ? 35 : 40) : (isMobile ? 15 : 20), 
    left: isMobile ? 45 : 60 
  };
  // Use larger default width for better scaling
  const defaultChartWidth = 600;
  const chartWidth = propChartWidth ?? defaultChartWidth;
  const chartHeight = height;
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const values = normalizedData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  
  // Add some padding to the range for better visualization
  const paddedMin = minValue - (range * 0.1);
  const paddedMax = maxValue + (range * 0.1);
  const paddedRange = paddedMax - paddedMin || 1;

  // Generate Y-axis labels
  const yLabels = [];
  for (let i = 0; i <= yAxisSteps; i++) {
    const value = paddedMin + (paddedRange * i / yAxisSteps);
    yLabels.push(value);
  }

  const points = normalizedData.map((d, i) => {
    const x = padding.left + (i / (normalizedData.length - 1 || 1)) * graphWidth;
    const y = padding.top + graphHeight - ((d.value - paddedMin) / paddedRange) * graphHeight;
    return { x, y, value: d.value, date: d.date, index: i };
  });

  // Create smooth curve path using quadratic bezier
  type Point = { x: number; y: number; value: number; date: string; index: number };
  const createSmoothPath = (points: Point[]) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const current = points[i];
      
      if (i === 1) {
        // First segment - simple line or curve
        const midX = (prev.x + current.x) / 2;
        const midY = (prev.y + current.y) / 2;
        path += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
      } else if (i === points.length - 1) {
        // Last segment
        const prevPrev = points[i - 2];
        const controlX = (prevPrev.x + prev.x + current.x) / 3;
        const controlY = (prevPrev.y + prev.y + current.y) / 3;
        path += ` Q ${controlX} ${controlY} ${current.x} ${current.y}`;
      } else {
        // Middle segments - smooth curves
        const prevPrev = points[i - 2];
        const controlX = (prevPrev.x + prev.x + current.x) / 3;
        const controlY = (prevPrev.y + prev.y + current.y) / 3;
        path += ` Q ${controlX} ${controlY} ${current.x} ${current.y}`;
      }
    }
    
    return path;
  };

  const smoothPath = createSmoothPath(points);
  const linearPath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const path = normalizedData.length > 2 ? smoothPath : linearPath;

  // Create area path for gradient fill
  const areaPath = path + ` L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;

  const lineColor = useThemeColors ? undefined : color;
  const gridColor = useThemeColors ? undefined : "#e5e7eb";
  const textColor = useThemeColors ? undefined : "#6b7280";
  const pointStrokeColor = useThemeColors ? undefined : "#ffffff";
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  // Use responsive width when chartWidth is not provided
  const svgWidth = propChartWidth || chartWidth;
  const isResponsive = !propChartWidth;

  // Handle mouse/touch move for tooltip
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || !showTooltip) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Find closest point
    let closestPoint = points[0];
    let minDistance = Math.abs(x - points[0].x);
    
    points.forEach(point => {
      const distance = Math.abs(x - point.x);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    const threshold = isMobile ? 40 : 50;
    if (minDistance < threshold) {
      setHoveredPoint(closestPoint.index);
      setTooltipPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setHoveredPoint(null);
      setTooltipPosition(null);
    }
  };

  const handlePointerLeave = () => {
    setHoveredPoint(null);
    setTooltipPosition(null);
  };

  // Format date for X-axis
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
  };
  
  return (
    <div className={`w-full relative ${isResponsive ? '' : 'overflow-x-auto'} ${className}`} style={{ height: `${height}px` }}>
      <svg 
        ref={svgRef}
        width="100%" 
        height={chartHeight} 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        style={{ height: `${height}px` }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onTouchStart={(e) => {
          // Handle touch for mobile
          if (svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const touch = e.touches[0];
            if (touch) {
              const x = touch.clientX - rect.left;
              let closestPoint = points[0];
              let minDistance = Math.abs(x - points[0].x);
              
              points.forEach(point => {
                const distance = Math.abs(x - point.x);
                if (distance < minDistance) {
                  minDistance = distance;
                  closestPoint = point;
                }
              });
              
              if (minDistance < 40) {
                setHoveredPoint(closestPoint.index);
                setTooltipPosition({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
              }
            }
          }
        }}
        onTouchEnd={() => {
          // Keep tooltip visible for a moment on touch end
          setTimeout(() => {
            setHoveredPoint(null);
            setTooltipPosition(null);
          }, 2000);
        }}
      >
        <defs>
          {/* Gradient for area fill */}
          {showGradient && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={lineColor || "currentColor"} stopOpacity="0.3" />
              <stop offset="100%" stopColor={lineColor || "currentColor"} stopOpacity="0.05" />
            </linearGradient>
          )}
          {/* Drop shadow filter */}
          <filter id={`shadow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines and Y-axis labels */}
        {yLabels.map((value, idx) => {
          const ratio = (value - paddedMin) / paddedRange;
          const y = padding.top + graphHeight - (ratio * graphHeight);
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + graphWidth}
                y2={y}
                stroke={gridColor}
                className={useThemeColors ? "stroke-border" : undefined}
                strokeWidth="1"
                strokeDasharray={idx === yLabels.length - 1 ? "0" : "4 4"}
                opacity="0.5"
              />
              <text 
                x={padding.left - (isMobile ? 8 : 12)} 
                y={y + 4} 
                fontSize={isMobile ? "10" : (propChartWidth ? "12" : "11")}
                textAnchor="end" 
                fill={textColor}
                className={useThemeColors ? "fill-muted-foreground" : undefined}
                fontWeight="500"
              >
                {value.toFixed(unit === "kg" ? 1 : 0)}
              </text>
            </g>
          );
        })}

        {/* Gradient area fill */}
        {showGradient && (
          <path
            d={areaPath}
            fill={`url(#${gradientId})`}
            className="transition-opacity duration-300"
          />
        )}

        {/* Data line with shadow */}
        <path
          d={path}
          fill="none"
          stroke={lineColor}
          className={useThemeColors ? "stroke-primary" : undefined}
          strokeWidth={isMobile ? "2.5" : "3"}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#shadow-${gradientId})`}
          style={{ 
            transition: 'all 0.3s ease'
          }}
        />

        {/* Data points with hover effect */}
        {points.map((point, i) => {
          const isHovered = hoveredPoint === i;
          const basePointSize = isMobile ? (isHovered ? 6 : 4) : (isHovered ? (propChartWidth ? 8 : 7) : (propChartWidth ? 5 : 4));
          const hoverRadius = isMobile ? 20 : 15;
          
          return (
            <g key={i}>
              {/* Hover circle (larger, transparent) - bigger on mobile for touch */}
              <circle
                cx={point.x}
                cy={point.y}
                r={hoverRadius}
                fill="transparent"
                className="cursor-pointer touch-none"
              />
              {/* Main point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={basePointSize}
                fill={lineColor}
                stroke={pointStrokeColor}
                className={useThemeColors ? "fill-primary stroke-background" : undefined}
                strokeWidth={isHovered ? (isMobile ? "2.5" : "3") : (isMobile ? "1.5" : "2")}
                style={{
                  transition: 'all 0.2s ease',
                  transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                  filter: isHovered ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))' : 'none'
                }}
              />
              {/* Tooltip on hover - shows on native hover */}
              <title>
                {new Date(point.date).toLocaleDateString("he-IL")}: {point.value.toFixed(unit === "kg" ? 1 : 0)} {unit}
              </title>
            </g>
          );
        })}

        {/* X-axis date labels */}
        {showXAxis && points.length > 0 && (
          <g>
            {points.map((point, i) => {
              // Show fewer labels on mobile to avoid crowding
              const maxLabels = isMobile ? 5 : 7;
              const showLabel = points.length <= maxLabels || i % Math.ceil(points.length / maxLabels) === 0 || i === points.length - 1;
              if (!showLabel) return null;
              
              return (
                <text
                  key={i}
                  x={point.x}
                  y={chartHeight - padding.bottom + (isMobile ? 15 : 20)}
                  fontSize={isMobile ? "9" : "10"}
                  textAnchor="middle"
                  fill={textColor}
                  className={useThemeColors ? "fill-muted-foreground" : undefined}
                  transform={isMobile ? `rotate(-45 ${point.x} ${chartHeight - padding.bottom + 15})` : `rotate(-45 ${point.x} ${chartHeight - padding.bottom + 20})`}
                >
                  {formatDate(point.date)}
                </text>
              );
            })}
          </g>
        )}
        
        {/* Optional label at the bottom */}
        {label && (
          <text
            x={chartWidth / 2}
            y={chartHeight - (showXAxis ? 5 : 10)}
            fontSize="12"
            textAnchor="middle"
            fill={textColor}
            className={useThemeColors ? "fill-muted-foreground font-medium" : undefined}
          >
            {label}
          </text>
        )}
      </svg>

      {/* Interactive Tooltip */}
      {showTooltip && hoveredPoint !== null && tooltipPosition && (
        <div
          className={`absolute z-10 bg-gray-900 dark:bg-gray-800 text-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-lg pointer-events-none border border-gray-700 ${
            isMobile ? 'text-[10px]' : 'text-xs'
          }`}
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - (isMobile ? 40 : 50)}px`,
            transform: 'translateX(-50%)',
            maxWidth: isMobile ? '140px' : 'auto'
          }}
        >
          <div className={`font-bold ${isMobile ? 'mb-0.5 text-[10px]' : 'mb-1'}`}>
            {new Date(points[hoveredPoint].date).toLocaleDateString("he-IL", {
              year: 'numeric',
              month: isMobile ? 'short' : 'long',
              day: 'numeric'
            })}
          </div>
          <div className={`text-blue-300 ${isMobile ? 'font-medium' : 'font-semibold'}`}>
            {points[hoveredPoint].value.toFixed(unit === "kg" ? 1 : 0)} {unit}
          </div>
        </div>
      )}
    </div>
  );
}

