import React, { useState, useMemo } from "react";

interface ChartDataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  color?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 600,
  height = 300,
  color = "#007A33",
}) => {
  const [activePoint, setActivePoint] = useState<ChartDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { path, points, gridLines, xLabels, yLabels } = useMemo(() => {
    const maxValue = Math.max(...data.map((d) => d.value), 0);
    const yTickValue =
      maxValue > 0
        ? Math.pow(10, Math.floor(Math.log10(maxValue) || 0)) / 2
        : 500;
    const roundedMax = Math.ceil(maxValue / yTickValue) * yTickValue;

    const xScale = (index: number) =>
      padding.left +
      (index / (data.length > 1 ? data.length - 1 : 1)) * chartWidth;
    const yScale = (value: number) =>
      padding.top +
      chartHeight -
      (roundedMax > 0 ? (value / roundedMax) * chartHeight : chartHeight);

    const path = data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.value)}`)
      .join(" ");

    const points = data.map((d, i) => ({
      x: xScale(i),
      y: yScale(d.value),
      data: d,
    }));

    const yLabelCount = 5;
    const yLabels = Array.from({ length: yLabelCount + 1 }).map((_, i) => {
      const value = (roundedMax / yLabelCount) * i;
      return { y: yScale(value), label: value.toLocaleString() };
    });

    const xLabels = data.map((d, i) => ({
      x: xScale(i),
      label: d.label,
    }));

    const gridLines = yLabels.map((label) => ({
      y1: label.y,
      y2: label.y,
      x1: padding.left,
      x2: padding.left + chartWidth,
    }));

    return { path, points, gridLines, xLabels, yLabels };
  }, [data, chartWidth, chartHeight, padding.left, padding.top]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (data.length === 0) return;
    const svg = e.currentTarget;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const { x } = point.matrixTransform(svg.getScreenCTM()?.inverse());

    const closestPoint = points.reduce((prev, curr) =>
      Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev
    );

    setActivePoint(closestPoint.data);
    setTooltipPos({ x: closestPoint.x, y: closestPoint.y });
  };

  const handleMouseLeave = () => {
    setActivePoint(null);
  };

  const lineLength = useMemo(() => {
    if (typeof document !== "undefined" && path) {
      const pathElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      pathElement.setAttribute("d", path);
      return pathElement.getTotalLength();
    }
    return 1000;
  }, [path]);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-auto"
      >
        {/* Y Axis Grid Lines & Labels */}
        <g>
          {gridLines.map((line, i) => (
            <line
              key={i}
              {...line}
              className="stroke-slate-200 dark:stroke-slate-700 animate-fade-in-chart"
            />
          ))}
          {yLabels.map((label, i) => (
            <text
              key={i}
              x={padding.left - 8}
              y={label.y + 4}
              textAnchor="end"
              className="text-xs fill-slate-500 dark:fill-slate-400"
            >
              {label.label}
            </text>
          ))}
        </g>

        {/* X Axis Labels */}
        <g>
          {xLabels.map((label, i) => (
            <text
              key={i}
              x={label.x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-slate-500 dark:fill-slate-400"
            >
              {label.label}
            </text>
          ))}
        </g>

        {/* Data Line */}
        {data.length > 1 && (
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={lineLength}
            strokeDashoffset={lineLength}
            className="animate-draw-chart"
          />
        )}

        {/* Data Points for interaction */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="10" fill="transparent" />
        ))}

        {/* Tooltip Indicator */}
        {activePoint && (
          <g className="pointer-events-none animate-fade-in-chart">
            <line
              x1={tooltipPos.x}
              y1={padding.top}
              x2={tooltipPos.x}
              y2={padding.top + chartHeight}
              className="stroke-slate-300 dark:stroke-slate-600"
              strokeDasharray="4 4"
            />
            <circle
              cx={tooltipPos.x}
              cy={tooltipPos.y}
              r="5"
              fill="white"
              stroke={color}
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
      {/* Tooltip */}
      {activePoint && (
        <div
          className="absolute p-2 text-sm bg-slate-800 text-white rounded-md shadow-lg pointer-events-none transition-transform duration-100"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: `translate(-50%, -120%)`,
          }}
        >
          <div className="font-bold">{activePoint.label}</div>
          <div>{activePoint.value.toLocaleString()} ج.س</div>
        </div>
      )}
    </div>
  );
};

export default LineChart;
