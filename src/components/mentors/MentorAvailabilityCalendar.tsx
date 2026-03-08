import { useState, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { Clock, Plus, X, CalendarIcon } from "lucide-react";
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

export interface AvailabilitySlot {
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // e.g. "09:00 AM"
}

interface MentorAvailabilityCalendarProps {
  slots: AvailabilitySlot[];
  onChange: (slots: AvailabilitySlot[]) => void;
  readOnly?: boolean;
  onSlotSelect?: (slot: AvailabilitySlot) => void;
  selectedSlot?: AvailabilitySlot | null;
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

export default function MentorAvailabilityCalendar({
  slots,
  onChange,
  readOnly = false,
  onSlotSelect,
  selectedSlot,
}: MentorAvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

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

  const removeSlot = (slot: AvailabilitySlot) => {
    if (readOnly) return;
    onChange(slots.filter(s => !(s.date === slot.date && s.time === slot.time)));
  };

  const hasSlots = (date: Date) => {
    const ds = format(date, "yyyy-MM-dd");
    return (datesWithSlots[ds]?.length || 0) > 0;
  };

  return (
    <div className="space-y-4">
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
            modifiersClassNames={{
              hasSlots: "bg-warning/20 text-warning font-bold",
            }}
          />
        </div>

        {/* Time Slots */}
        <div className="flex-1 rounded-xl border border-border/50 bg-card/60 p-4">
          {selectedDate ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="w-4 h-4 text-warning" />
                <h4 className="text-sm font-semibold">{format(selectedDate, "EEEE, MMM d, yyyy")}</h4>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                {readOnly ? "Select an available time slot:" : "Click to toggle time slots:"}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[280px] overflow-y-auto">
                {TIME_SLOTS.map(time => {
                  const isActive = timeSlotsForDate.includes(time);
                  const isSelected = selectedSlot?.date === selectedDateStr && selectedSlot?.time === time;
                  
                  if (readOnly && !isActive) return null;

                  return (
                    <button
                      key={time}
                      onClick={() => toggleTimeSlot(time)}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : isActive
                          ? "bg-warning/15 text-warning border-warning/30 hover:bg-warning/25"
                          : "bg-secondary/30 text-muted-foreground border-border/30 hover:bg-secondary/50"
                      )}
                    >
                      <Clock className="w-3 h-3 inline mr-1" />
                      {time}
                    </button>
                  );
                })}
                {readOnly && timeSlotsForDate.length === 0 && (
                  <p className="col-span-full text-xs text-muted-foreground py-4 text-center">
                    No slots available on this date
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Select a date to manage time slots
            </div>
          )}
        </div>
      </div>

      {/* Summary of all slots */}
      {!readOnly && slots.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card/60 p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            All Available Slots ({slots.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence>
              {slots
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
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
          </div>
        </div>
      )}
    </div>
  );
}
