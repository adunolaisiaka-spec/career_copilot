"use client";

import { useId, useMemo, useState } from "react";

interface TrendChartProps {
  title: string;
  data: { date: string; value: number }[];
  color: string;
}

const WIDTH = 280;
const HEIGHT = 80;
const PAD_X = 4;
const PAD_Y = 8;

export function TrendChart({ title, data, color }: TrendChartProps) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { points, max, total } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.value));
    const step = data.length > 1 ? (WIDTH - PAD_X * 2) / (data.length - 1) : 0;
    const points = data.map((d, i) => ({
      x: PAD_X + i * step,
      y: PAD_Y + (1 - d.value / max) * (HEIGHT - PAD_Y * 2),
      ...d,
    }));
    const total = data.reduce((sum, d) => sum + d.value, 0);
    return { points, max, total };
  }, [data]);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1]?.x ?? 0},${HEIGHT - PAD_Y} L${points[0]?.x ?? 0},${HEIGHT - PAD_Y} Z`;

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
        <span className="text-lg font-semibold">{total}</span>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={`${title} trend over the last ${data.length} days, total ${total}`}
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
            let closest = 0;
            let closestDist = Infinity;
            points.forEach((p, i) => {
              const dist = Math.abs(p.x - relX);
              if (dist < closestDist) {
                closestDist = dist;
                closest = i;
              }
            });
            setHoverIndex(closest);
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <line
            x1={PAD_X}
            y1={HEIGHT - PAD_Y}
            x2={WIDTH - PAD_X}
            y2={HEIGHT - PAD_Y}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1}
          />
          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {hovered && (
            <>
              <line
                x1={hovered.x}
                y1={PAD_Y}
                x2={hovered.x}
                y2={HEIGHT - PAD_Y}
                stroke="currentColor"
                className="text-border"
                strokeWidth={1}
              />
              <circle cx={hovered.x} cy={hovered.y} r={3.5} fill={color} />
            </>
          )}
        </svg>
        {hovered && (
          <div
            className="bg-popover pointer-events-none absolute -top-1 rounded-md border px-2 py-1 text-xs shadow-sm"
            style={{
              left: `${(hovered.x / WIDTH) * 100}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-medium">{hovered.value}</div>
            <div className="text-muted-foreground">
              {new Date(hovered.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        )}
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Last {data.length} days · peak {max}
      </p>
    </div>
  );
}
