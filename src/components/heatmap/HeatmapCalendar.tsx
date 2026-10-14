import React, { useState } from 'react';
import {
  format,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  getDay,
  isSameDay,
} from 'date-fns';
import { formatCurrency, toLocalDateString } from '../../utils/calculations';
import { DayActivity } from '../../types';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface HeatmapCalendarProps {
  year: number;
  daysData: Record<string, DayActivity>;
  dailyGoalCents: number;
  onYearChange: (newYear: number) => void;
  onDayClick: (dateStr: string, dayActivity?: DayActivity) => void;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  year,
  daysData,
  dailyGoalCents,
  onYearChange,
  onDayClick,
}) => {
  const [hoveredDay, setHoveredDay] = useState<{
    x: number;
    y: number;
    dateStr: string;
    activity?: DayActivity;
  } | null>(null);

  const today = new Date();
  const currentYear = today.getFullYear();
  const isCurrentYear = year === currentYear;

  const start = startOfYear(new Date(year, 0, 1));
  // If viewing current year, only show days up to today (GitHub style: appends new square as new day starts)
  const end = isCurrentYear ? today : endOfYear(new Date(year, 11, 31));
  const daysInYear = eachDayOfInterval({ start, end });

  const firstDayOfWeek = getDay(start);
  const leadingBlanks = Array.from({ length: firstDayOfWeek });

  // Luxury emerald precision scale on OLED black, red for net negative (withdrawals > deposits)
  const getLevelColor = (level: number, activity?: DayActivity) => {
    if (activity && activity.isNetNegative) {
      return 'bg-red-500 border-red-400 shadow-md shadow-red-500/40';
    }
    switch (level) {
      case 4:
        return 'bg-emerald-400 border-emerald-300 shadow-md shadow-emerald-400/30';
      case 3:
        return 'bg-emerald-500/80 border-emerald-500/80';
      case 2:
        return 'bg-emerald-600/50 border-emerald-600/50';
      case 1:
        return 'bg-emerald-800/40 border-emerald-700/30';
      default:
        return 'bg-white/[0.03] border-white/[0.05] hover:border-white/30';
    }
  };

  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Calculate exact week column for each month's arrival (GitHub style)
  const monthOffsets: { name: string; col: number }[] = [];
  let lastMonth = -1;
  daysInYear.forEach((d, idx) => {
    const m = d.getMonth();
    if (m !== lastMonth) {
      const col = Math.floor((firstDayOfWeek + idx) / 7);
      monthOffsets.push({ name: allMonths[m], col });
      lastMonth = m;
    }
  });

  const cardRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={cardRef} className="sq-card p-8 relative">
      {/* Heatmap Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-editorial text-xl font-normal text-white flex items-center space-x-2.5">
            <span>Yearly Distribution.</span>
            <span className="text-[11px] px-3 py-0.5 rounded-full bg-white/[0.06] text-white border border-white/10 font-sans font-medium">
              {year}
            </span>
          </h3>
          <p className="text-[12px] text-neutral-400 mt-1">
            Visual activity based on your daily savings goal ({formatCurrency(dailyGoalCents)})
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center space-x-1.5 bg-black/60 border border-white/10 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => onYearChange(year - 1)}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition"
            title="Previous Year"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[12px] font-semibold text-white px-3 font-sans">{year}</span>
          <button
            onClick={() => onYearChange(year + 1)}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition"
            title="Next Year"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-block">
          {/* Month labels aligned to columns */}
          <div className="relative h-5 mb-2 pl-[38px] text-[11px] font-medium text-neutral-400 select-none">
            {monthOffsets.map((mo, idx) => (
              <span
                key={idx}
                className="absolute font-sans"
                style={{ left: `${38 + mo.col * 17.5}px` }}
              >
                {mo.name}
              </span>
            ))}
          </div>

          <div className="flex">
            {/* Weekday labels */}
            <div className="flex flex-col justify-between text-[10px] font-medium text-neutral-400 pr-2.5 select-none h-[115px] py-0.5 font-sans w-[38px] shrink-0">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            {/* Squares Grid: the exact working 7-row column flow */}
            <div
              className="grid grid-rows-7 grid-flow-col gap-[3.5px]"
              onMouseLeave={() => setHoveredDay(null)}
            >
              {leadingBlanks.map((_, i) => (
                <div key={`blank-${i}`} className="w-3.5 h-3.5" />
              ))}

              {daysInYear.map((dayDate) => {
                const dateStr = toLocalDateString(dayDate);
                const activity = daysData[dateStr];
                const level = activity ? activity.level : 0;
                const isCurrentToday = isSameDay(dayDate, new Date());

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => onDayClick(dateStr, activity)}
                    onMouseEnter={(e) => {
                      if (!cardRef.current) return;
                      const cardRect = cardRef.current.getBoundingClientRect();
                      const buttonRect = e.currentTarget.getBoundingClientRect();
                      setHoveredDay({
                        x: buttonRect.left - cardRect.left + buttonRect.width / 2,
                        y: buttonRect.top - cardRect.top,
                        dateStr,
                        activity,
                      });
                    }}
                    className={`w-3.5 h-3.5 rounded-[3px] border transition-transform duration-150 focus:outline-none ${getLevelColor(
                      level,
                      activity
                    )} ${
                      isCurrentToday ? 'ring-1 ring-white ring-offset-1 ring-offset-black' : ''
                    } hover:scale-125 hover:z-10`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-white/[0.05] text-[12px] text-neutral-400">
        <div className="flex items-center space-x-1.5 font-sans">
          <Info className="w-3.5 h-3.5 text-neutral-400" />
          <span>Click any square to inspect details</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 font-sans">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-[2px] bg-red-500 border border-red-400" />
            <span className="text-red-400">Net Withdrawal</span>
          </div>

          <div className="flex items-center space-x-2">
            <span>Less</span>
            <div className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded-[2px] border ${getLevelColor(0)}`} />
              <div className={`w-3 h-3 rounded-[2px] border ${getLevelColor(1)}`} />
              <div className={`w-3 h-3 rounded-[2px] border ${getLevelColor(2)}`} />
              <div className={`w-3 h-3 rounded-[2px] border ${getLevelColor(3)}`} />
              <div className={`w-3 h-3 rounded-[2px] border ${getLevelColor(4)}`} />
            </div>
            <span>Goal Reached</span>
          </div>
        </div>
      </div>

      {/* Floating Dark Tooltip anchored relative to card and centered right on square */}
      {hoveredDay && (() => {
        const tooltipWidth = 220;
        const halfWidth = tooltipWidth / 2;
        const cardWidth = cardRef.current?.clientWidth || 900;
        // Clamp relative to card so it never clips left or right edge
        const clampedX = Math.max(halfWidth + 16, Math.min(cardWidth - halfWidth - 16, hoveredDay.x));

        return (
          <div
            className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-[#0c0d12] border border-white/20 text-white px-4 py-3 rounded-2xl shadow-2xl text-[12px] backdrop-blur-2xl w-[220px]"
            style={{
              left: `${clampedX}px`,
              top: `${hoveredDay.y - 8}px`,
              filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.9))',
            }}
          >
            <p className="font-editorial text-sm text-white tracking-tight">
              {format(new Date(hoveredDay.dateStr + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
            </p>
            <div className="mt-1.5 space-y-0.5 text-[11px] font-sans">
              <p className={hoveredDay.activity?.isNetNegative ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>
                {hoveredDay.activity?.isNetNegative
                  ? `Net: -${formatCurrency((hoveredDay.activity?.withdrawalAmount || 0) - (hoveredDay.activity?.savedAmount || 0))}`
                  : `Saved: ${formatCurrency(hoveredDay.activity?.savedAmount || 0)}`}
              </p>
              {hoveredDay.activity?.withdrawalAmount ? (
                <p className="text-amber-400/90">
                  Withdrawn: {formatCurrency(hoveredDay.activity.withdrawalAmount)}
                </p>
              ) : null}
              <p className="text-neutral-400">
                Contributions: {hoveredDay.activity?.contributionCount || 0}
              </p>
              <p className="text-neutral-400">
                Daily Target: {formatCurrency(dailyGoalCents)}
              </p>
              <p
                className={`font-semibold ${
                  hoveredDay.activity?.isNetNegative
                    ? 'text-red-400'
                    : hoveredDay.activity?.reachedTarget
                    ? 'text-emerald-300'
                    : 'text-neutral-400'
                }`}
              >
                Status: {hoveredDay.activity?.isNetNegative
                  ? 'Withdrawals Exceeded'
                  : hoveredDay.activity?.reachedTarget
                  ? 'Target Achieved'
                  : hoveredDay.activity?.savedAmount
                  ? 'In Progress'
                  : 'No activity'}
              </p>
            </div>
            {/* Arrow indicator */}
            <div
              className="absolute top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#0c0d12]"
              style={{
                left: `${halfWidth + (hoveredDay.x - clampedX)}px`,
                transform: 'translateX(-50%)',
              }}
            />
          </div>
        );
      })()}
    </div>
  );
};
