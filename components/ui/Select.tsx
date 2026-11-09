"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  /** Small text on the right of the option. */
  meta?: string;
  /** Colored dot before the label. */
  dot?: string;
}

interface SelectProps<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  id?: string;
  /** Shown before the value inside the button, e.g. "เรียงตาม". */
  prefix?: string;
  ariaLabel?: string;
  className?: string;
  size?: "md" | "lg";
}

/** Fully custom listbox: keyboard (arrows, Home/End, Enter, Esc) and click-outside. */
export function Select<T extends string>({
  value,
  options,
  onChange,
  id,
  prefix,
  ariaLabel,
  className = "",
  size = "md",
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    listRef.current?.focus();
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openList = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const choose = (i: number) => {
    onChange(options[i].value);
    setOpen(false);
    rootRef.current?.querySelector("button")?.focus();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      setOpen(false);
      rootRef.current?.querySelector("button")?.focus();
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openList();
          }
        }}
        className={`w-full flex items-center gap-2.5 rounded-full border bg-card pl-4 pr-3 text-[15px] text-ink cursor-pointer transition-colors focus-ring ${size === "lg" ? "h-12" : "h-11"} ${open ? "border-espresso" : "border-line-2 hover:border-ink-2"}`}
      >
        {prefix && <span className="text-mute">{prefix}</span>}
        {selected?.dot && (
          <span className="size-2 rounded-full shrink-0" style={{ background: selected.dot }} />
        )}
        <span className="flex-1 text-left font-medium truncate">{selected?.label}</span>
        {selected?.meta && <span className="text-[13px] text-mute">{selected.meta}</span>}
        <ChevronDown
          aria-hidden
          className={`size-4 text-mute transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
          className="anim-pop absolute z-30 mt-2 left-0 min-w-full max-h-72 overflow-y-auto rounded-2xl border border-line-2 bg-white p-1.5 shadow-[0_16px_40px_rgba(43,35,32,0.12)] outline-none"
        >
          {options.map((o, i) => {
            const isSel = o.value === value;
            return (
              <li
                key={o.value}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex items-center gap-2.5 h-10 px-3 rounded-xl text-sm cursor-pointer whitespace-nowrap ${i === active ? "bg-soft" : ""}`}
              >
                {o.dot && <span className="size-2 rounded-full shrink-0" style={{ background: o.dot }} />}
                <span className="flex-1">{o.label}</span>
                {o.meta && <span className="text-xs text-mute">{o.meta}</span>}
                {isSel && <Check aria-hidden className="size-4 text-espresso" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
