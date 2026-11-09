"use client";

import { useSyncExternalStore } from "react";

// One shared 1-second ticker for the whole app.
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

function getSnapshot() {
  if (now === 0) now = Date.now();
  return now;
}

/** Current time for event handlers (kept out of render to satisfy React purity rules). */
export const currentTime = () => Date.now();

export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}
