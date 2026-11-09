"use client";

import { useSyncExternalStore } from "react";
import type { Account, AppState, CooldownRecord, Reason } from "./types";
import { REASONS } from "./types";

const STORAGE_KEY = "cs2_cooldown_v3";
// Data written by the previous versions of the app. Read once for migration, never modified.
const LEGACY_ACCOUNTS_KEY = "cs2_accounts_data_v2";
const LEGACY_PROFILES_KEY = "cs2_saved_profiles_v2";

const DEFAULT_STATE: AppState = {
  version: 3,
  accounts: [],
  records: [],
  weekly: {},
  // Wednesday 07:00 local time. Users can change it on the Weekly Drop tab.
  reset: { day: 3, hour: 7, minute: 0 },
};

export const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

interface LegacyTracker {
  id: string;
  accountName: string;
  category?: string;
  createdAt: number;
  targetAt: number;
  totalDuration: number;
  notes?: string;
}

interface LegacyProfile {
  id: string;
  name: string;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function migrateLegacy(): AppState {
  const profiles = readJson<LegacyProfile[]>(LEGACY_PROFILES_KEY) ?? [];
  const trackers = readJson<LegacyTracker[]>(LEGACY_ACCOUNTS_KEY) ?? [];
  const byName = new Map<string, Account>();
  const now = Date.now();

  const ensure = (name: string, createdAt: number) => {
    const key = name.trim().toLowerCase();
    let acc = byName.get(key);
    if (!acc) {
      acc = { id: makeId("acc"), name: name.trim(), tag: "Smurf", createdAt };
      byName.set(key, acc);
    }
    return acc;
  };

  profiles.forEach((p) => p?.name && ensure(p.name, now));
  const records: CooldownRecord[] = trackers
    .filter((t) => t?.accountName && t.targetAt && t.createdAt)
    .map((t) => {
      const acc = ensure(t.accountName, t.createdAt);
      return {
        id: makeId("cd"),
        accountId: acc.id,
        reason: "อื่น ๆ" as Reason,
        note: t.notes,
        startedAt: t.createdAt,
        endsAt: t.targetAt,
        durationMs: t.totalDuration || t.targetAt - t.createdAt,
      };
    });

  return { ...DEFAULT_STATE, accounts: [...byName.values()], records };
}

function sanitize(raw: Partial<AppState> | null): AppState | null {
  if (!raw || raw.version !== 3) return null;
  return {
    version: 3,
    accounts: Array.isArray(raw.accounts) ? raw.accounts : [],
    records: Array.isArray(raw.records)
      ? raw.records.map((r) => ({
          ...r,
          reason: (REASONS as readonly string[]).includes(r.reason) ? r.reason : "อื่น ๆ",
        }))
      : [],
    weekly: raw.weekly && typeof raw.weekly === "object" ? raw.weekly : {},
    reset: raw.reset ?? DEFAULT_STATE.reset,
  };
}

function load(): AppState {
  const saved = sanitize(readJson<Partial<AppState>>(STORAGE_KEY));
  if (saved) return saved;
  const migrated = migrateLegacy();
  persist(migrated);
  return migrated;
}

function persist(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
}

let current: AppState | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep several open tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    const next = sanitize(e.newValue ? JSON.parse(e.newValue) : null);
    if (next) {
      current = next;
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): AppState {
  if (current === null) current = load();
  return current;
}

function getServerSnapshot(): AppState | null {
  return null;
}

export function setAppState(updater: (prev: AppState) => AppState) {
  const next = updater(getSnapshot());
  current = next;
  persist(next);
  emit();
}

/** Returns null during server render and hydration, then the saved state. */
export function useAppState(): AppState | null {
  return useSyncExternalStore<AppState | null>(subscribe, getSnapshot, getServerSnapshot);
}
