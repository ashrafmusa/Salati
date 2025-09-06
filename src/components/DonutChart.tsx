import React, { useMemo } from "react";

interface ChartData {
  value: number;
  label: string;
  color: string;
}

interface DonutChartProps {
  data: ChartData[];
  size?: number;
  strokeWidth?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 200,
  strokeWidth = 25,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  );

  let accumulatedPercentage = 0;

  const segments = data.map((item) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const dashOffset =
      circumference - (accumulatedPercentage / 100) * circumference;
    const dashArray = (percentage / 100) * circumference;

    accumulatedPercentage += percentage;

    return {
      ...item,
      dashArray: `${dashArray} ${circumference - dashArray}`,
      dashOffset,
    };
  });

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        {segments.map((segment, index) => (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            className="animate-draw-chart"
            style={{
              strokeDashoffset: segment.dashOffset,
              transition: "stroke-dashoffset 2s ease-out",
            }}
          />
        ))}
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          {total}
        </span>
        <span className="block text-sm text-slate-500 dark:text-slate-400">
          إجمالي الطلبات
        </span>
      </div>
    </div>
  );
};

export default DonutChart;
