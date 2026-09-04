import * as React from "react";
import { Clock2Icon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

function toTimeString(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

// so "before" bounds don't exclude today
function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function combineDateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":");
  const merged = new Date(date);
  merged.setHours(Number(hours), Number(minutes), 0, 0);
  return merged;
}

export interface DateTimePreset {
  label: string;
  getDate: () => Date;
}

export function DateTimeField({
  id,
  label,
  value,
  onChange,
  minDate,
  defaultTime = "09:00",
  presets,
}: {
  id: string;
  label: string;
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
  // cannot select days in the past
  minDate?: Date;
  defaultTime?: string;
  presets?: DateTimePreset[];
}) {
  const [time, setTime] = React.useState(
    value ? toTimeString(value) : defaultTime,
  );

  React.useEffect(() => {
    if (value) setTime(toTimeString(value));
  }, [value]);

  const selectDay = (day: Date | undefined) => {
    onChange(day ? combineDateTime(day, time) : undefined);
  };

  const changeTime = (next: string) => {
    setTime(next);
    if (value && next) onChange(combineDateTime(value, next));
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-neutral-800">{label}</span>

      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.getDate())}
              className="rounded-full border border-muted/40 px-3 py-1 text-xs"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <Calendar
        mode="single"
        selected={value}
        onSelect={selectDay}
        defaultMonth={value ?? minDate ?? new Date()}
        disabled={minDate ? { before: startOfDay(minDate) } : undefined}
        className="rounded-lg border border-muted/40 bg-input p-2 [--cell-size:--spacing(8)] [--primary:var(--color-emphasis)] [--primary-foreground:#1a1a1a] [--accent:var(--color-card)] [--accent-foreground:var(--color-muted)]"
        modifiersClassNames={{
          today: "text-muted font-semibold ring-1 ring-muted/40",
        }}
      />

      <InputGroup>
        <InputGroupInput
          id={id}
          type="time"
          step="60"
          value={time}
          onChange={(e) => changeTime(e.target.value)}
          className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
        />
        <InputGroupAddon>
          <Clock2Icon className="text-muted-foreground" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}