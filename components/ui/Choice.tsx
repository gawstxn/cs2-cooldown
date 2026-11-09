import React from "react";
import { Check } from "lucide-react";

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: React.ReactNode; count?: number }[];
  onChange: (v: T) => void;
  ariaLabel: string;
  full?: boolean;
}

/** Pill track with one selected segment. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  full,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex gap-1 rounded-full border border-line bg-cream p-1 ${full ? "w-full" : "w-fit max-w-full overflow-x-auto"}`}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer focus-ring ${full ? "flex-1" : ""} ${on ? "bg-espresso text-on-dark" : "text-ink-2 hover:text-ink"}`}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={`ml-1.5 tabular ${on ? "text-on-dark/70" : "text-mute"}`}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function Chip({ selected, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`h-10 px-4 rounded-full border text-sm transition-colors cursor-pointer focus-ring ${selected ? "bg-espresso border-espresso text-on-dark" : "border-line-2 text-ink-2 hover:border-ink-2 hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

interface CheckToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  tone: "caramel" | "sage";
}

/** Large custom checkbox, used for weekly drop / level-up ticks. */
export function CheckToggle({ checked, onChange, label, tone }: CheckToggleProps) {
  const on = tone === "caramel" ? "bg-caramel border-caramel" : "bg-sage border-sage";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={() => onChange(!checked)}
      className={`grid place-items-center size-11 rounded-2xl border-2 transition-colors cursor-pointer focus-ring ${checked ? `${on} text-on-dark` : "border-unchecked bg-card hover:border-ink-2"}`}
    >
      {checked && <Check aria-hidden className="size-5" strokeWidth={3} />}
    </button>
  );
}

interface StepperProps {
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
}

export function Stepper({ label, value, min = 0, max, onChange }: StepperProps) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div>
      <div className="text-xs text-ink-2 mb-1">{label}</div>
      <div className="flex items-center h-12 rounded-full border border-line-2 bg-cream">
        <button
          type="button"
          aria-label={`ลด${label}`}
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          className="size-11 grid place-items-center rounded-full text-xl text-ink-2 hover:text-ink disabled:opacity-40 cursor-pointer focus-ring"
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(clamp(parseInt(e.target.value.replace(/\D/g, "")) || 0))}
          className="flex-1 min-w-0 bg-transparent text-center text-lg font-semibold tabular outline-none"
        />
        <button
          type="button"
          aria-label={`เพิ่ม${label}`}
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          className="size-11 grid place-items-center rounded-full text-xl text-ink-2 hover:text-ink disabled:opacity-40 cursor-pointer focus-ring"
        >
          +
        </button>
      </div>
    </div>
  );
}
