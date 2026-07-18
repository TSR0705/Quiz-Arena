"use client";

import { memo, useMemo, useState, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

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
  profile?: any; // Auth profile containing streaks
  stats?: any;   // Overview aggregate stats
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
  profile,
  stats: userStats,
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
  const [gameActive, setGameActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
  const monthLabelHeight = showMonthLabels && !gameActive ? 20 : 0;
  const svgWidth = gridOffsetX + weeks.length * step - cellGap;
  const svgHeight = monthLabelHeight + 7 * step - cellGap;

  // Auto-scroll to the right end (most recent months)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [activityData]);

  // Game loop and autoplay logic (styled for QuizArena brand)
  useEffect(() => {
    if (!gameActive || !activityData) {
      weeks.forEach((week) => {
        week.forEach((date) => {
          if (!date) return;
          const rect = document.getElementById(`cell-${id}-${date}`);
          if (rect) {
            rect.style.opacity = "1";
            rect.style.pointerEvents = "auto";
            const originalLevel = activityData?.[date]?.level ?? 0;
            const originalColor =
              ACTIVE_THEME[`level${originalLevel}` as keyof ThemeColors] ||
              ACTIVE_THEME.level0;
            rect.setAttribute("fill", originalColor);
          }
        });
      });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const width = svgWidth;
    const height = svgHeight + 80;
    canvas.width = width;
    canvas.height = height;

    const cellLevels = new Map<string, number>();
    weeks.forEach((week) => {
      week.forEach((date) => {
        if (!date) return;
        const entry = activityData[date];
        const initialLevel = entry?.level ?? 0;
        cellLevels.set(date, initialLevel);
        const rect = document.getElementById(`cell-${id}-${date}`);
        if (rect) {
          if (initialLevel === 0) {
            rect.style.opacity = "0";
            rect.style.pointerEvents = "none";
          } else {
            rect.style.opacity = "1";
            rect.style.pointerEvents = "auto";
          }
        }
      });
    });

    const player = {
      x: width / 2 - 15,
      y: height - 25,
      width: 30,
      height: 20,
      speed: 4,
      direction: 1, // 1 = right, -1 = left
      color: "#915EFF", // Brand accent purple
    };

    type GameBullet = {
      x: number;
      y: number;
      vy: number;
      width: number;
      height: number;
      color: string;
    };
    let bullets: GameBullet[] = [];
    let lastShot = 0;
    const cooldown = 140;

    const shoot = () => {
      bullets.push({
        x: player.x + player.width / 2 - 1.5,
        y: player.y - 4,
        vy: -6,
        width: 3,
        height: 8,
        color: "#cbd5e1", // White/silver laser
      });
    };

    const stars = Array.from({ length: 100 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: Math.random() * 0.4 + 0.1,
      size: Math.random() * 1.2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    type GameParticle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      alpha: number;
      life: number;
      maxLife: number;
    };
    let particles: GameParticle[] = [];
    const explode = (x: number, y: number, color: string) => {
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5 + 1.2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: Math.random() * 2 + 1,
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 15 + 15,
        });
      }
    };

    const update = () => {
      let minWi = -1;
      let maxWi = -1;
      weeks.forEach((week, wi) => {
        week.forEach((date) => {
          if (!date) return;
          if ((cellLevels.get(date) ?? 0) > 0) {
            if (minWi === -1) minWi = wi;
            minWi = Math.min(minWi, wi);
            maxWi = Math.max(maxWi, wi);
          }
        });
      });

      let minX = gridOffsetX;
      let maxX = width - player.width;
      if (minWi !== -1 && maxWi !== -1) {
        minX = gridOffsetX + minWi * step;
        maxX = Math.max(
          minX,
          Math.min(width - player.width, gridOffsetX + (maxWi + 1) * step - player.width),
        );
      }

      player.x = Math.max(minX, Math.min(maxX, player.x));
      player.x += player.speed * player.direction;
      if (player.x >= maxX) {
        player.x = maxX;
        player.direction = -1;
      } else if (player.x <= minX) {
        player.x = minX;
        player.direction = 1;
      }

      const now = Date.now();
      if (now - lastShot >= cooldown) {
        shoot();
        lastShot = now;
      }

      let anyActive = false;
      cellLevels.forEach((level) => {
        if (level > 0) anyActive = true;
      });

      if (!anyActive) {
        weeks.forEach((week) => {
          week.forEach((date) => {
            if (!date) return;
            const originalLevel = activityData[date]?.level ?? 0;
            cellLevels.set(date, originalLevel);
            const rect = document.getElementById(`cell-${id}-${date}`);
            if (rect) {
              const originalColor =
                ACTIVE_THEME[`level${originalLevel}` as keyof ThemeColors] ||
                ACTIVE_THEME.level0;
              rect.setAttribute("fill", originalColor);
              if (originalLevel === 0) {
                rect.style.opacity = "0";
                rect.style.pointerEvents = "none";
              } else {
                rect.style.opacity = "1";
                rect.style.pointerEvents = "auto";
              }
            }
          });
        });
      }

      stars.forEach((s) => {
        s.y += s.speed;
        if (s.y > height) {
          s.y = 0;
          s.x = Math.random() * width;
        }
      });

      bullets = bullets.filter((b) => {
        b.y += b.vy;
        return b.y > 0;
      });

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;
      });
      particles = particles.filter((p) => p.life < p.maxLife);

      bullets.forEach((bullet, bulletIdx) => {
        weeks.forEach((week, wi) => {
          week.forEach((date, di) => {
            if (!date) return;

            const currentLevel = cellLevels.get(date) ?? 0;
            if (currentLevel === 0) return;

            const cellX = gridOffsetX + wi * step;
            const cellY = monthLabelHeight + di * step;

            if (
              bullet.x < cellX + cellSize &&
              bullet.x + bullet.width > cellX &&
              bullet.y < cellY + cellSize &&
              bullet.y + bullet.height > cellY
            ) {
              bullets.splice(bulletIdx, 1);

              const newLevel = currentLevel - 1;
              cellLevels.set(date, newLevel);

              const rect = document.getElementById(`cell-${id}-${date}`);
              if (rect) {
                if (newLevel === 0) {
                  rect.style.opacity = "0";
                  rect.style.pointerEvents = "none";
                } else {
                  const newColor =
                    ACTIVE_THEME[`level${newLevel}` as keyof ThemeColors] ||
                    ACTIVE_THEME.level0;
                  rect.setAttribute("fill", newColor);
                }
              }

              const hitColor =
                ACTIVE_THEME[`level${currentLevel}` as keyof ThemeColors] ||
                ACTIVE_THEME.level0;
              explode(cellX + cellSize / 2, cellY + cellSize / 2, hitColor);
            }
          });
        });
      });
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = "#ffffff";
      stars.forEach((s) => {
        ctx.globalAlpha = s.alpha;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });
      ctx.globalAlpha = 1.0;

      bullets.forEach((b) => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
      });

      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      ctx.globalAlpha = 1.0;

      ctx.fillStyle = player.color;
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(player.x + player.width / 2, player.y);
      ctx.lineTo(player.x + player.width, player.y + player.height);
      ctx.lineTo(player.x + player.width * 0.7, player.y + player.height * 0.75);
      ctx.lineTo(player.x + player.width * 0.3, player.y + player.height * 0.75);
      ctx.lineTo(player.x, player.y + player.height);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const loop = () => {
      update();
      render();
      if (gameActive) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameActive, activityData, weeks, step, cellSize, cellGap, monthLabelHeight, id]);

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
    <div className={cn("w-full transition-all duration-300 relative", gameActive ? "bg-black/90 p-4 rounded-2xl border border-neutral-800" : "", className)}>
      
      {/* Dynamic Month Labels Column Grid */}
      <div className="w-full">
        <div
          ref={scrollRef}
          className={cn("relative overflow-x-auto no-scrollbar transition-all duration-300", gameActive ? "pb-[80px]" : "")}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="overflow-visible"
          >
            {/* Weekday indicator labels (Mon, Wed, Fri) */}
            {showMonthLabels && !gameActive && (
              <>
                <text x={0} y={monthLabelHeight + 1 * step + cellSize/2 + 3.5} fontSize={10} fill="#6b7280" className="font-semibold select-none">Mon</text>
                <text x={0} y={monthLabelHeight + 3 * step + cellSize/2 + 3.5} fontSize={10} fill="#6b7280" className="font-semibold select-none">Wed</text>
                <text x={0} y={monthLabelHeight + 5 * step + cellSize/2 + 3.5} fontSize={10} fill="#6b7280" className="font-semibold select-none">Fri</text>
              </>
            )}

            {/* Month labels on top */}
            {showMonthLabels && !gameActive &&
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
                const cellCenterX = gridOffsetX + wi * step + cellSize / 2;
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
                      opacity: gameActive ? (level === 0 || !date ? 0 : 1) : 1,
                      pointerEvents: gameActive ? (level === 0 || !date ? "none" : "auto") : "auto",
                      cursor: date ? "pointer" : "default"
                    }}
                    onMouseEnter={() => {
                      if (!date || gameActive) return;
                      setTooltip({
                        visible: true,
                        date,
                        data: entry || { level: 0 },
                        x: cellCenterX,
                        y: cellTopY,
                      });
                    }}
                    onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
                  />
                );
              }),
            )}
          </svg>

          {/* Spaceship Game overlay canvas */}
          {gameActive && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-auto z-10 cursor-crosshair"
              style={{ width: svgWidth, height: svgHeight + 80 }}
            />
          )}

          {/* Floating Tooltip details */}
          {tooltip.visible && tooltip.data && (
            <div
              className="pointer-events-none absolute z-50 rounded-xl bg-[#131326] border border-[#2a2a40] p-3.5 text-xs text-white shadow-2xl whitespace-nowrap space-y-1.5 min-w-[150px]"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: "translate(-50%, calc(-100% - 12px))",
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
              <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-2 h-2 rotate-45 bg-[#131326] border-r border-b border-[#2a2a40]" />
            </div>
          )}
        </div>

        {/* Legend panel and game switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-3 border-t border-[#2a2a40]/30 pt-3">
          {/* Legend indicator */}
          {showLegend && (
            <div className="flex items-center gap-4 text-[10px] text-gray-500 tracking-wider uppercase font-semibold">
              <div className="flex items-center gap-1.5">
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

              {/* Game Mode switch trigger */}
              <div className="flex items-center gap-2 border-l border-[#2a2a40]/70 pl-4">
                <span className="text-[10px] text-gray-400 select-none uppercase font-bold">Game Mode</span>
                <button
                  onClick={() => setGameActive(!gameActive)}
                  className={cn(
                    "relative inline-flex h-4.5 w-8.5 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-150 ease-in-out focus:outline-none",
                    gameActive ? "bg-[#915EFF]" : "bg-[#202038]"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-150 ease-in-out",
                      gameActive ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Aggregate metrics line */}
          {showStats && (
            <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-gray-500 font-sans tracking-wide">
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
