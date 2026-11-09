"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, MoreVertical } from "lucide-react";
import { IconButton } from "./Button";

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
  /** Set for single-choice menus; renders as a radio item with a check mark. */
  checked?: boolean;
}

const ITEM_SELECTOR = '[role^="menuitem"]';

/** Popover menu (kebab by default); arrow keys move between items, Esc closes. */
export function Menu({
  label,
  items,
  icon,
  bordered,
}: {
  label: string;
  items: MenuItem[];
  icon?: React.ReactNode;
  bordered?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    const items = root?.querySelectorAll<HTMLElement>(ITEM_SELECTOR);
    const current = root?.querySelector<HTMLElement>('[aria-checked="true"]');
    (current ?? items?.[0])?.focus();
    const onDown = (e: MouseEvent) => {
      if (!root?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onKey = (e: React.KeyboardEvent) => {
    const els = [...(rootRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [])];
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      els[(i + 1) % els.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      els[(i - 1 + els.length) % els.length]?.focus();
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      rootRef.current?.querySelector<HTMLElement>("button")?.focus();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        label={label}
        bordered={bordered}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {icon ?? <MoreVertical className="size-[18px]" />}
      </IconButton>
      {open && (
        <div
          role="menu"
          aria-label={label}
          onKeyDown={onKey}
          className="anim-pop absolute right-0 z-30 mt-1 min-w-44 rounded-2xl border border-line-2 bg-card p-1.5 shadow-[0_16px_40px_rgba(43,35,32,0.12)]"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role={item.checked === undefined ? "menuitem" : "menuitemradio"}
              aria-checked={item.checked}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={`w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-sm text-left whitespace-nowrap cursor-pointer outline-none hover:bg-soft focus-visible:bg-soft ${item.danger ? "text-berry-ink" : "text-ink"}`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.checked && <Check aria-hidden className="size-4 text-ink" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
