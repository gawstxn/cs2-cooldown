"use client";

import { useCallback, useRef, useState } from "react";
import { AlertTriangle, Check, Info, Undo2, X } from "lucide-react";

export interface Toast {
  id: string;
  message: string;
  tone: "success" | "info" | "warning";
  undo?: () => void;
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: Toast["tone"] = "success", undo?: () => void) => {
      counter.current += 1;
      const id = `toast-${counter.current}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone, undo }]);
      setTimeout(() => dismiss(id), undo ? 6000 : 3500);
    },
    [dismiss],
  );

  return { toasts, show, dismiss };
}

export function ToastViewport({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="fixed z-[60] bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-md"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="anim-pop flex items-center gap-3 rounded-full bg-espresso text-on-dark pl-5 pr-2 py-2 shadow-[0_16px_40px_rgba(43,35,32,0.25)]"
        >
          {t.tone === "success" && <Check aria-hidden className="size-4 shrink-0 text-mint" strokeWidth={2.6} />}
          {t.tone === "warning" && <AlertTriangle aria-hidden className="size-4 shrink-0 text-pink" />}
          {t.tone === "info" && <Info aria-hidden className="size-4 shrink-0 text-on-dark/70" />}
          <span className="flex-1 text-sm font-medium py-1">{t.message}</span>
          {t.undo && (
            <button
              type="button"
              onClick={() => {
                t.undo?.();
                dismiss(t.id);
              }}
              className="flex items-center gap-1 h-9 px-3 rounded-full text-sm font-semibold text-pink hover:bg-on-dark/10 cursor-pointer focus-ring"
            >
              <Undo2 aria-hidden className="size-3.5" /> เลิกทำ
            </button>
          )}
          <button
            type="button"
            aria-label="ปิดข้อความ"
            onClick={() => dismiss(t.id)}
            className="grid place-items-center size-9 rounded-full text-on-dark/60 hover:text-on-dark hover:bg-on-dark/10 cursor-pointer focus-ring"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
