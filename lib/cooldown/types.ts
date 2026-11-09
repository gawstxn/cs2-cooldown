export type AccountTag = "Main" | "Smurf" | "Alt";
export type RankMode = "Premier" | "Competitive" | "Wingman";

export interface Account {
  id: string;
  name: string;
  tag: AccountTag;
  rankMode?: RankMode;
  rating?: string;
  steamUrl?: string;
  note?: string;
  createdAt: number;
}

export const REASONS = [
  "หลุดระหว่างแมตช์",
  "AFK",
  "ทีมดาเมจ",
  "โดนโหวตเตะ",
  "อื่น ๆ",
] as const;
export type Reason = (typeof REASONS)[number];

export interface CooldownRecord {
  id: string;
  accountId: string;
  reason: Reason;
  note?: string;
  startedAt: number;
  endsAt: number;
  durationMs: number;
  /** Set when the user ends the cooldown early. */
  cancelledAt?: number;
}

export interface WeeklyMark {
  drop?: boolean;
  level?: boolean;
}

export interface ResetSettings {
  /** 0 = Sunday … 6 = Saturday, local time. */
  day: number;
  hour: number;
  minute: number;
}

export interface AppState {
  version: 3;
  accounts: Account[];
  records: CooldownRecord[];
  /** Keyed by the start timestamp of each weekly period, then by account id. */
  weekly: Record<string, Record<string, WeeklyMark>>;
  reset: ResetSettings;
}

export type AccountStatus = "ready" | "cooldown" | "ban";
