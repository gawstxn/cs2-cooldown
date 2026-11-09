import type {
  Account,
  AccountStatus,
  AppState,
  CooldownRecord,
  Reason,
} from "./types";
import { REASONS } from "./types";
import { DAY, WEEK, currentPeriodStart, formatDayMonth } from "./time";

export const isLongBan = (r: { durationMs: number }) => r.durationMs >= 7 * DAY;

/** Only Prime accounts get the weekly drop and level-up rewards. */
export const isPrime = (a: Account) => a.prime !== false;

/** When a record stopped counting down (early cancel or natural end). */
export const effectiveEnd = (r: CooldownRecord) => r.cancelledAt ?? r.endsAt;

export const isActive = (r: CooldownRecord, now: number) =>
  r.cancelledAt === undefined && r.endsAt > now;

export interface AccountView {
  account: Account;
  status: AccountStatus;
  active?: CooldownRecord;
  /** Latest finished or cancelled record. */
  last?: CooldownRecord;
  remainingMs: number;
  progress: number;
  count90: number;
}

export function buildAccountViews(state: AppState, now: number): AccountView[] {
  return state.accounts.map((account) => {
    const recs = state.records
      .filter((r) => r.accountId === account.id)
      .sort((a, b) => b.startedAt - a.startedAt);
    const active = recs.find((r) => isActive(r, now));
    const last = recs.find((r) => !isActive(r, now));
    const status: AccountStatus = active ? (isLongBan(active) ? "ban" : "cooldown") : "ready";
    const remainingMs = active ? active.endsAt - now : 0;
    const progress = active
      ? Math.min(100, Math.max(0, ((now - active.startedAt) / active.durationMs) * 100))
      : 0;
    const count90 = recs.filter((r) => r.startedAt >= now - 90 * DAY).length;
    return { account, status, active, last, remainingMs, progress, count90 };
  });
}

export type StatsRange = "30" | "90" | "all";

export interface HistoryRow {
  record: CooldownRecord;
  result: "active" | "done" | "cancelled";
}

export interface AccountStats {
  count: number;
  totalMs: number;
  longestMs: number;
  longestAt?: number;
  bestCleanMs: number;
  recent30: number;
  weeks: { start: number; count: number }[];
  reasons: { reason: Reason; count: number }[];
  history: HistoryRow[];
}

export function buildStats(
  state: AppState,
  account: Account,
  range: StatsRange,
  now: number,
): AccountStats {
  const all = state.records
    .filter((r) => r.accountId === account.id)
    .sort((a, b) => a.startedAt - b.startedAt);
  const from = range === "all" ? -Infinity : now - Number(range) * DAY;
  const inRange = all.filter((r) => r.startedAt >= from);

  let totalMs = 0;
  let longestMs = 0;
  let longestAt: number | undefined;
  inRange.forEach((r) => {
    totalMs += Math.max(0, Math.min(effectiveEnd(r), now) - r.startedAt);
    if (r.durationMs >= longestMs) {
      longestMs = r.durationMs;
      longestAt = r.startedAt;
    }
  });

  // Longest stretch without a cooldown, over the account's whole history.
  let bestCleanMs = 0;
  // Accounts migrated from the old format can have a createdAt later than their first record.
  let cursor = Math.min(account.createdAt, all[0]?.startedAt ?? account.createdAt);
  all.forEach((r) => {
    bestCleanMs = Math.max(bestCleanMs, r.startedAt - cursor);
    cursor = Math.max(cursor, effectiveEnd(r));
  });
  if (cursor < now) bestCleanMs = Math.max(bestCleanMs, now - cursor);

  const weeks = Array.from({ length: 12 }, (_, i) => {
    const start = now - (12 - i) * WEEK;
    const end = start + WEEK;
    return { start, count: all.filter((r) => r.startedAt >= start && r.startedAt < end).length };
  });

  const reasons = REASONS.map((reason) => ({
    reason,
    count: inRange.filter((r) => r.reason === reason).length,
  }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const history: HistoryRow[] = [...inRange].reverse().map((record) => ({
    record,
    result: isActive(record, now) ? "active" : record.cancelledAt ? "cancelled" : "done",
  }));

  return {
    count: inRange.length,
    totalMs,
    longestMs,
    longestAt,
    bestCleanMs,
    recent30: all.filter((r) => r.startedAt >= now - 30 * DAY).length,
    weeks,
    reasons,
    history,
  };
}

export const weekLabel = (start: number) => formatDayMonth(start);

export function weeklyMarks(state: AppState, now: number) {
  const key = String(currentPeriodStart(now, state.reset));
  return { key, marks: state.weekly[key] ?? {} };
}

/** Whether a drop was ticked in each of the last `n` periods (oldest first, current last). */
export function pastDrops(state: AppState, accountId: string, now: number, n = 8) {
  const current = currentPeriodStart(now, state.reset);
  return Array.from({ length: n }, (_, i) => {
    const key = String(current - (n - 1 - i) * WEEK);
    return !!state.weekly[key]?.[accountId]?.drop;
  });
}

export interface ActivityItem {
  id: string;
  at: number;
  kind: "start" | "end" | "cancel";
  name: string;
  record: CooldownRecord;
}

export function recentActivity(state: AppState, now: number, limit = 5): ActivityItem[] {
  const names = new Map(state.accounts.map((a) => [a.id, a.name]));
  const items: ActivityItem[] = [];
  state.records.forEach((r) => {
    const name = names.get(r.accountId);
    if (!name) return;
    items.push({ id: r.id + "-s", at: r.startedAt, kind: "start", name, record: r });
    if (r.cancelledAt) {
      items.push({ id: r.id + "-c", at: r.cancelledAt, kind: "cancel", name, record: r });
    } else if (r.endsAt <= now) {
      items.push({ id: r.id + "-e", at: r.endsAt, kind: "end", name, record: r });
    }
  });
  return items.sort((a, b) => b.at - a.at).slice(0, limit);
}
