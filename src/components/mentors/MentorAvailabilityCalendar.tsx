import { useState, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay, startOfDay, getDay } from "date-fns";
import { Clock, Plus, X, CalendarIcon, Repeat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM",
  "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
  "09:00 PM",
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface AvailabilitySlot {
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // e.g. "09:00 AM"
}

export interface WeeklyPattern {
  [dayIndex: number]: string[]; // dayIndex 0-6 (Sun-Sat) -> array of time strings
}

interface MentorAvailabilityCalendarProps {
  slots: AvailabilitySlot[];
  onChange: (slots: AvailabilitySlot[]) => void;
  readOnly?: boolean;
  onSlotSelect?: (slot: AvailabilitySlot) => void;
  selectedSlot?: AvailabilitySlot | null;
  weeklyPattern?: WeeklyPattern;
  onWeeklyPatternChange?: (pattern: WeeklyPattern) => void;
}

export function slotsToStrings(slots: AvailabilitySlot[]): string[] {
  return slots.map(s => `${s.date}|${s.time}`);
}

export function stringsToSlots(strings: string[]): AvailabilitySlot[] {
  return strings
    .filter(s => s.includes("|"))
    .map(s => {
      const [date, time] = s.split("|");
      return { date, time };
    });
}

export function weeklyPatternToString(pattern: WeeklyPattern): string {
  return JSON.stringify(pattern);
}

export function stringToWeeklyPattern(str: string | null): WeeklyPattern {
  if (!str) return {};
  try { return JSON.parse(str); } catch { return {}; }
}

/** Generate concrete slots from a weekly pattern for the next N weeks */
export function generateSlotsFromPattern(pattern: WeeklyPattern, weeks: number = 4): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const today = startOfDay(new Date());
  const totalDays = weeks * 7;

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(today, i);
    const dayIndex = getDay(date);
    const times = pattern[dayIndex];
    if (times && times.length > 0) {
      const dateStr = format(date, "yyyy-MM-dd");
      times.forEach(time => {
        slots.push({ date: dateStr, time });
      });
    }
  }
  return slots;
}

export default function MentorAvailabilityCalendar({
  slots,
  onChange,
  readOnly = false,
  onSlotSelect,
  selectedSlot,
  weeklyPattern,
  onWeeklyPatternChange,
}: MentorAvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [mode, setMode] = useState<"calendar" | "weekly">(weeklyPattern && Object.keys(weeklyPattern).length > 0 ? "weekly" : "calendar");
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday default

  const today = startOfDay(new Date());

  const datesWithSlots = slots.reduce<Record<string, string[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s.time);
    return acc;
  }, {});

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const timeSlotsForDate = datesWithSlots[selectedDateStr] || [];

  const toggleTimeSlot = (time: string) => {
    if (readOnly) {
      if (onSlotSelect) onSlotSelect({ date: selectedDateStr, time });
      return;
    }
    const exists = slots.some(s => s.date === selectedDateStr && s.time === time);
    if (exists) {
      onChange(slots.filter(s => !(s.date === selectedDateStr && s.time === time)));
    } else {
      onChange([...slots, { date: selectedDateStr, time }]);
    }
  };

  const toggleWeeklySlot = (dayIndex: number, time: string) => {
    if (!onWeeklyPatternChange || !weeklyPattern) return;
    const current = weeklyPattern[dayIndex] || [];
    const exists = current.includes(time);
    const updated = exists ? current.filter(t => t !== time) : [...current, time];
    const newPattern = { ...weeklyPattern, [dayIndex]: updated };
    onWeeklyPatternChange(newPattern);
    // Regenerate concrete slots
    onChange(generateSlotsFromPattern(newPattern, 4));
  };

  const removeSlot = (slot: AvailabilitySlot) => {
    if (readOnly) return;
    onChange(slots.filter(s => !(s.date === slot.date && s.time === slot.time)));
  };

  const hasSlots = (date: Date) => {
    const ds = format(date, "yyyy-MM-dd");
    return (datesWithSlots[ds]?.length || 0) > 0;
  };

  const weeklyTimesForDay = weeklyPattern?.[selectedDay] || [];

  // Read-only mode: always show calendar
  if (readOnly) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="rounded-xl border border-border/50 bg-card/60 p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < today}
              className={cn("p-3 pointer-events-auto")}
              modifiers={{ hasSlots }}
              modifiersClassNames={{ hasSlots: "bg-warning/20 text-warning font-bold" }}
            />
          </div>
          <div className="flex-1 rounded-xl border border-border/50 bg-card/60 p-4">
            {selectedDate ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="w-4 h-4 text-warning" />
                  <h4 className="text-sm font-semibold">{format(selectedDate, "EEEE, MMM d, yyyy")}</h4>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">Select an available time slot:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[280px] overflow-y-auto">
                  {TIME_SLOTS.map(time => {
                    const isActive = timeSlotsForDate.includes(time);
                    const isSelected = selectedSlot?.date === selectedDateStr && selectedSlot?.time === time;
                    if (!isActive) return null;
                    return (
                      <button key={time} onClick={() => toggleTimeSlot(time)}
                        className={cn("px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                          isSelected ? "bg-primary text-primary-foreground border-primary"
                            : "bg-warning/15 text-warning border-warning/30 hover:bg-warning/25"
                        )}>
                        <Clock className="w-3 h-3 inline mr-1" />{time}
                      </button>
                    );
                  })}
                  {timeSlotsForDate.length === 0 && (
                    <p className="col-span-full text-xs text-muted-foreground py-4 text-center">No slots available on this date</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Select a date to see available slots</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      {onWeeklyPatternChange && (
        <div className="flex gap-2">
          <button onClick={() => setMode("weekly")}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
              mode === "weekly" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            )}>
            <Repeat className="w-3 h-3" /> Weekly Recurring
          </button>
          <button onClick={() => setMode("calendar")}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
              mode === "calendar" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            )}>
            <CalendarIcon className="w-3 h-3" /> Specific Dates
          </button>
        </div>
      )}

      {mode === "weekly" && onWeeklyPatternChange && weeklyPattern !== undefined ? (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Day selector */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-4 min-w-[180px]">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Day of Week</h4>
            <div className="space-y-1">
              {DAY_NAMES.map((day, i) => {
                const count = (weeklyPattern[i] || []).length;
                return (
                  <button key={i} onClick={() => setSelectedDay(i)}
                    className={cn("w-full px-3 py-2 rounded-lg text-xs font-medium text-left transition-all flex items-center justify-between",
                      selectedDay === i ? "bg-primary text-primary-foreground" : "hover:bg-secondary/50 text-foreground"
                    )}>
                    <span>{day}</span>
                    {count > 0 && (
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
                        selectedDay === i ? "bg-primary-foreground/20 text-primary-foreground" : "bg-warning/15 text-warning"
                      )}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots for selected day */}
          <div className="flex-1 rounded-xl border border-border/50 bg-card/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Repeat className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">Every {DAY_NAMES[selectedDay]}</h4>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">Click to toggle recurring time slots (auto-generates for next 4 weeks):</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[280px] overflow-y-auto">
              {TIME_SLOTS.map(time => {
                const isActive = weeklyTimesForDay.includes(time);
                return (
                  <button key={time} onClick={() => toggleWeeklySlot(selectedDay, time)}
                    className={cn("px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                      isActive ? "bg-warning/15 text-warning border-warning/30 hover:bg-warning/25"
                        : "bg-secondary/30 text-muted-foreground border-border/30 hover:bg-secondary/50"
                    )}>
                    <Clock className="w-3 h-3 inline mr-1" />{time}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Calendar */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < today}
              className={cn("p-3 pointer-events-auto")}
              modifiers={{ hasSlots }}
              modifiersClassNames={{ hasSlots: "bg-warning/20 text-warning font-bold" }}
            />
          </div>
          <div className="flex-1 rounded-xl border border-border/50 bg-card/60 p-4">
            {selectedDate ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="w-4 h-4 text-warning" />
                  <h4 className="text-sm font-semibold">{format(selectedDate, "EEEE, MMM d, yyyy")}</h4>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">Click to toggle time slots:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[280px] overflow-y-auto">
                  {TIME_SLOTS.map(time => {
                    const isActive = timeSlotsForDate.includes(time);
                    return (
                      <button key={time} onClick={() => toggleTimeSlot(time)}
                        className={cn("px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                          isActive ? "bg-warning/15 text-warning border-warning/30 hover:bg-warning/25"
                            : "bg-secondary/30 text-muted-foreground border-border/30 hover:bg-secondary/50"
                        )}>
                        <Clock className="w-3 h-3 inline mr-1" />{time}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Select a date to manage time slots</div>
            )}
          </div>
        </div>
      )}

      {/* Weekly pattern summary */}
      {mode === "weekly" && weeklyPattern && Object.values(weeklyPattern).some(v => v.length > 0) && (
        <div className="rounded-xl border border-border/50 bg-card/60 p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Repeat className="w-3 h-3 inline mr-1" /> Weekly Schedule Summary
          </h4>
          <div className="space-y-1.5">
            {DAY_NAMES.map((day, i) => {
              const times = weeklyPattern[i] || [];
              if (times.length === 0) return null;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-20 text-muted-foreground">{DAY_SHORT[i]}</span>
                  <div className="flex flex-wrap gap-1">
                    {times.sort().map(t => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary of all concrete slots */}
      {!readOnly && slots.length > 0 && mode === "calendar" && (
        <div className="rounded-xl border border-border/50 bg-card/60 p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            All Available Slots ({slots.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence>
              {slots
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .slice(0, 20)
                .map(s => (
                  <motion.div
                    key={`${s.date}-${s.time}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge
                      variant="secondary"
                      className="text-[10px] gap-1 cursor-pointer hover:bg-destructive/20 transition-colors"
                      onClick={() => removeSlot(s)}
                    >
                      {format(new Date(s.date + "T00:00:00"), "MMM d")} · {s.time}
                      <X className="w-2.5 h-2.5" />
                    </Badge>
                  </motion.div>
                ))}
            </AnimatePresence>
            {slots.length > 20 && <span className="text-[10px] text-muted-foreground self-center">+{slots.length - 20} more</span>}
          </div>
        </div>
      )}
    </div>
  );
}
