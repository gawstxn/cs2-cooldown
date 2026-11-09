"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { IconButton } from "./Button";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md";
  role?: "dialog" | "alertdialog";
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Custom dialog: Esc to close, focus trap, restores focus and body scroll on close. */
export function Modal({ title, onClose, children, footer, width = "md", role = "dialog" }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first =
      panel?.querySelector<HTMLElement>("[data-autofocus]") ??
      panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Let an open listbox inside the modal handle its own Escape first.
        const target = e.target;
        if (target instanceof HTMLElement && target.getAttribute("role") === "listbox") return;
        onCloseRef.current();
      } else if (e.key === "Tab" && panel) {
        const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (items.length === 0) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-espresso/30 p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        className={`anim-pop w-full ${width === "sm" ? "sm:max-w-sm" : "sm:max-w-[540px]"} max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-line bg-card shadow-[0_24px_60px_rgba(43,35,32,0.18)]`}
      >
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-line">
          <h2 id={titleId} className="text-xl font-semibold">
            {title}
          </h2>
          <IconButton label="ปิด" onClick={onClose}>
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-line">{footer}</div>
        )}
      </div>
    </div>
  );
}
