"use client";

import { memo, useMemo, useState, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export type DayActivity = {
  level: ContributionLevel;
  xpEarned?: number;
  quizzesCompleted?: number;
  questionsSolved?: number;
  studyTimeMinutes?: number;
  label?: string;
};

export type ContributionData = {
  [date: string]: DayActivity;
};

export type ThemeColors = {
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
};

export type CellShape = "rounded" | "circle";

export type GithubCalendarProps = {
  profile?: any;
  stats?: any;
  cellSize?: number;
  cellGap?: number;
  cellShape?: CellShape;
  showMonthLabels?: boolean;
  showStats?: boolean;
  showLegend?: boolean;
  className?: string;
};

// ─── QuizArena Theme Palette ─────────────────────────────────────────────────

const ACTIVE_THEME: ThemeColors = {
  level0: "#18182b",
  level1: "rgba(145, 94, 255, 0.15)",
  level2: "rgba(145, 94, 255, 0.40)",
  level3: "rgba(145, 94, 255, 0.70)",
  level4: "#915EFF",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const FULL_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function formatTooltipDate(dateStr: string): string {
  try {
    const date = parseDate(dateStr);
    const month = FULL_MONTH_NAMES[date.getMonth()];
    const day = date.getDate();
    const suffix = getOrdinalSuffix(day);
    return `${month} ${day}${suffix}, ${date.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

// ─── Build calendar grid ──────────────────────────────────────────────────────

function buildGrid(
  startDate: string,
  endDate: string,
  startsOnSunday: boolean,
): {
  weeks: (string | null)[][];
  monthLabels: { label: string; weekIndex: number }[];
  gridStart: string;
} {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  const startDay = startsOnSunday ? 0 : 1;
  const startDow = start.getDay();
  const offset = (startDow - startDay + 7) % 7;
  const gridStart = addDays(start, -offset);

  const weeks: (string | null)[][] = [];
  const monthLabels: { label: string; weekIndex: number }[] = [];

  let current = new Date(gridStart);
  let weekIndex = 0;
  let lastMonth = -1;

  while (
    current <= end ||
    (weeks.length > 0 && (weeks[weeks.length - 1]?.length ?? 0) < 7)
  ) {
    const week: (string | null)[] = [];

    for (let d = 0; d < 7; d++) {
      const dateStr = formatDate(current);
      const isInRange = current >= start && current <= end;
      week.push(isInRange ? dateStr : null);

      if (isInRange && current.getMonth() !== lastMonth) {
        lastMonth = current.getMonth();
        monthLabels.push({
          label: MONTH_NAMES[current.getMonth()]!,
          weekIndex,
        });
      }

      current = addDays(current, 1);
    }

    weeks.push(week);
    weekIndex++;

    if (
      current > end &&
      weeks.length > 0 &&
      (weeks[weeks.length - 1]?.every(
        (d) => d === null || parseDate(d) > end,
      ) ??
        false)
    )
      break;
  }

  return { weeks, monthLabels, gridStart: formatDate(gridStart) };
}

// ─── Tooltip state type ───────────────────────────────────────────────────────

type TooltipState = {
  visible: boolean;
  date: string;
  data: DayActivity | null;
  x: number;
  y: number;
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function CalendarSkeleton({
  cellSize = 9,
  cellGap = 3,
  className,
}: {
  cellSize?: number;
  cellGap?: number;
  className?: string;
}) {
  const step = cellSize + cellGap;
  const weeks = 53;
  const days = 7;
  return (
    <div className={cn("w-full space-y-4 animate-pulse", className)}>
      <div className="flex justify-between items-center">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
      </div>
      <div className="overflow-x-auto">
        <svg
          width={32 + weeks * step - cellGap}
          height={20 + days * step - cellGap}
          className="overflow-visible"
        >
          {Array.from({ length: weeks }).map((_, wi) =>
            Array.from({ length: days }).map((_, di) => (
              <rect
                key={`${wi}-${di}`}
                x={32 + wi * step}
                y={20 + di * step}
                width={cellSize}
                height={cellSize}
                rx={cellSize * 0.2}
                className="fill-[#202038]/50"
              />
            )),
          )}
        </svg>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const GithubCalendar = memo(function GithubCalendar({
  cellSize = 9,
  cellGap = 3,
  cellShape = "rounded",
  showMonthLabels = true,
  showStats = true,
  showLegend = true,
  className,
}: GithubCalendarProps) {
  const id = useId();
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Fetch state ────────────────────────────────────────────────────────
  const [activityData, setActivityData] = useState<ContributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setFetchError(null);

    fetch("/api/users/calendar-activity")
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch learning activity.");
        return res.json();
      })
      .then((d) => {
        setActivityData(d);
      })
      .catch((e) => setFetchError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  // ── Resolve dates ──────────────────────────────────────────────────────
  const resolvedEnd = formatDate(new Date());
  const resolvedStart = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  }, []);

  // ── Tooltip state ──────────────────────────────────────────────────────
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    date: "",
    data: null,
    x: 0,
    y: 0,
  });

  // ── Build grid ─────────────────────────────────────────────────────────
  const { weeks, monthLabels, gridStart } = useMemo(
    () => buildGrid(resolvedStart, resolvedEnd, true),
    [resolvedStart, resolvedEnd],
  );

  // ── Stats Summation ─────────────────────────────────────────────────────
  const aggregateStats = useMemo(() => {
    if (!activityData) return { totalQuestions: 0, totalQuizzes: 0, totalXp: 0, activeDays: 0, studyHours: 0 };
    const entries = Object.values(activityData);
    const totalQuestions = entries.reduce((sum, v) => sum + (v.questionsSolved || 0), 0);
    const totalQuizzes = entries.reduce((sum, v) => sum + (v.quizzesCompleted || 0), 0);
    const totalXp = entries.reduce((sum, v) => sum + (v.xpEarned || 0), 0);
    const activeDays = entries.filter((v) => v.level > 0).length;
    const studyHours = Math.ceil(entries.reduce((sum, v) => sum + (v.studyTimeMinutes || 0), 0) / 60);

    return { totalQuestions, totalQuizzes, totalXp, activeDays, studyHours };
  }, [activityData]);

  // ── Dimensions ────────────────────────────────────────────────────────
  const step = cellSize + cellGap;
  const gridOffsetX = 32; // Offset for Mon/Wed/Fri labels on left
  const monthLabelHeight = showMonthLabels ? 20 : 0;
  const svgWidth = gridOffsetX + weeks.length * step - cellGap;
  const svgHeight = monthLabelHeight + 7 * step - cellGap;

  // Auto-scroll to the right end (most recent months)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [activityData]);

  // ── Loading / error states ───────────────────────────
  if (loading) {
    return <CalendarSkeleton cellSize={cellSize} cellGap={cellGap} className={className} />;
  }

  if (fetchError || !activityData) {
    return (
      <div className={cn("w-full p-6 text-center text-xs text-red-400 border border-red-500/25 bg-red-500/5 rounded-xl", className)}>
        <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-red-500" />
        <p>Failed to load learning consistency records.</p>
      </div>
    );
  }

  const cellRx = cellShape === "circle" ? cellSize / 2 : 2.5;

  return (
    <div className={cn("w-full transition-all duration-300 relative", className)}>
      {/* Dynamic Month Labels Column Grid */}
      <div className="w-full">
        <div
          ref={scrollRef}
          className="relative overflow-x-auto no-scrollbar transition-all duration-300"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="overflow-visible"
          >
            {/* Weekday indicator labels (Mon, Wed, Fri) */}
            {showMonthLabels && (
              <>
                <text x={0} y={monthLabelHeight + 1 * step + cellSize/2 + 3.5} fontSize={10} fill="#6b7280" className="font-semibold select-none">Mon</text>
                <text x={0} y={monthLabelHeight + 3 * step + cellSize/2 + 3.5} fontSize={10} fill="#6b7280" className="font-semibold select-none">Wed</text>
                <text x={0} y={monthLabelHeight + 5 * step + cellSize/2 + 3.5} fontSize={10} fill="#6b7280" className="font-semibold select-none">Fri</text>
              </>
            )}

            {/* Month labels on top */}
            {showMonthLabels &&
              (() => {
                const byWeek = new Map<number, string>();
                monthLabels.forEach(({ label, weekIndex }) => byWeek.set(weekIndex, label));
                const entries = Array.from(byWeek.entries());
                const validEntries: [number, string][] = [];
                for (let i = 0; i < entries.length; i++) {
                  const current = entries[i]!;
                  const next = entries[i + 1];
                  if (i === 0 && next && next[0] - current[0] < 3) continue;
                  const lastValid = validEntries[validEntries.length - 1];
                  if (lastValid && current[0] - lastValid[0] < 3) continue;
                  validEntries.push(current);
                }
                return validEntries.map(([weekIndex, label]) => (
                  <text
                    key={`${label}-${weekIndex}`}
                    x={gridOffsetX + weekIndex * step}
                    y={12}
                    fontSize={10.5}
                    fontWeight="600"
                    fill="#a27eff"
                    className="select-none"
                  >
                    {label}
                  </text>
                ));
              })()}

            {/* Grid squares */}
            {weeks.map((week, wi) =>
              week.map((date, di) => {
                const entry = date ? activityData[date] : undefined;
                const level: ContributionLevel = entry?.level ?? 0;
                const cellTopY = monthLabelHeight + di * step;

                if (!date) {
                  const cellDate = formatDate(addDays(parseDate(gridStart), wi * 7 + di));
                  if (cellDate > resolvedEnd) return null;
                }

                return (
                  <rect
                    key={`${wi}-${di}`}
                    id={date ? `cell-${id}-${date}` : undefined}
                    x={gridOffsetX + wi * step}
                    y={cellTopY}
                    width={cellSize}
                    height={cellSize}
                    rx={cellRx}
                    fill={ACTIVE_THEME[`level${level}` as keyof ThemeColors]}
                    style={{
                      transition: "opacity 0.1s, fill 0.2s",
                      cursor: date ? "pointer" : "default"
                    }}
                    onMouseEnter={(e) => {
                      if (!date) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        visible: true,
                        date,
                        data: entry || { level: 0 },
                        x: rect.left + rect.width / 2 + window.scrollX,
                        y: rect.top + window.scrollY,
                      });
                    }}
                    onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
                  />
                );
              }),
            )}
          </svg>
        </div>

        {/* Floating Tooltip details - Rendered via React Portal to prevent overflow clipping */}
        {tooltip.visible && tooltip.data && typeof document !== "undefined" && createPortal(
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="pointer-events-none absolute z-[9999] rounded-xl bg-[#161630]/95 backdrop-blur-md border border-[#915EFF]/30 p-3.5 text-xs text-white shadow-[0_12px_24px_rgba(0,0,0,0.65)] whitespace-nowrap space-y-1.5 min-w-[155px]"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, calc(-100% - 14px))",
            }}
          >
            <p className="font-bold text-gray-200 border-b border-[#2a2a40]/60 pb-1 text-[11px] font-sans">
              {formatTooltipDate(tooltip.date)}
            </p>
            <div className="space-y-0.5 text-[10px] text-gray-400 font-sans">
              <p>Questions Solved: <span className="text-white font-bold">{tooltip.data.questionsSolved ?? 0}</span></p>
              <p>Quizzes Completed: <span className="text-white font-bold">{tooltip.data.quizzesCompleted ?? 0}</span></p>
              <p>XP Earned: <span className="text-yellow-500 font-bold">+{tooltip.data.xpEarned ?? 0} XP</span></p>
              <p>Study Duration: <span className="text-white font-bold">{tooltip.data.studyTimeMinutes ?? 0} min</span></p>
              <p>Daily Streak: <span className={tooltip.data.level > 0 ? "text-orange-400 font-bold" : "text-gray-500"}>
                {tooltip.data.level > 0 ? "Active" : "Inactive"}
              </span></p>
            </div>
            {/* Small arrow pointing down */}
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-2 h-2 rotate-45 bg-[#161630]/95 border-r border-b border-[#915EFF]/30" />
          </motion.div>,
          document.body
        )}

        {/* Legend panel and aggregate statistics */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-3 border-t border-[#2a2a40]/30 pt-3">
          {/* Legend indicator */}
          {showLegend && (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 tracking-wider uppercase font-semibold">
              <span>Less</span>
              {([0, 1, 2, 3, 4] as ContributionLevel[]).map((level) => (
                <svg key={level} width={cellSize} height={cellSize}>
                  <rect
                    width={cellSize}
                    height={cellSize}
                    rx={cellRx}
                    fill={ACTIVE_THEME[`level${level}`]}
                  />
                </svg>
              ))}
              <span>More</span>
            </div>
          )}

          {/* Aggregate metrics line */}
          {showStats && (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-gray-500 font-sans tracking-wide">
              <span>ACTIVE DAYS: <strong className="text-white font-bold">{aggregateStats.activeDays}</strong></span>
              <span>•</span>
              <span>XP RECORD: <strong className="text-yellow-500 font-bold">+{aggregateStats.totalXp} XP</strong></span>
              <span>•</span>
              <span>QUESTIONS: <strong className="text-white font-bold">{aggregateStats.totalQuestions}</strong></span>
              <span>•</span>
              <span>STUDY TIME: <strong className="text-white font-bold">{aggregateStats.studyHours}h</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default GithubCalendar;
