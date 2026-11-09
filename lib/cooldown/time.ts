import type { ResetSettings } from "./types";

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;

export const TH_DAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
export const TH_DAYS_LONG = [
  "วันอาทิตย์",
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์",
];
const TH_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export const pad = (n: number) => n.toString().padStart(2, "0");

export function splitMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

/** "04:11:57" plus a separate day count, for big countdowns. */
export function formatClock(ms: number) {
  const { d, h, m, s } = splitMs(ms);
  return { days: d, time: `${pad(h)}:${pad(m)}:${pad(s)}` };
}

/** "1 วัน 13:42:10" */
export function formatClockInline(ms: number) {
  const { days, time } = formatClock(ms);
  return days > 0 ? `${days} วัน ${time}` : time;
}

/** Short human duration: "2 วัน 3 ชม.", "4 ชม. 12 น.", "12 น. 05 วิ" */
export function formatCompact(ms: number) {
  const { d, h, m, s } = splitMs(ms);
  if (d > 0) return h > 0 ? `${d} วัน ${h} ชม.` : `${d} วัน`;
  if (h > 0) return m > 0 ? `${h} ชม. ${m} น.` : `${h} ชม.`;
  if (m > 0) return `${m} น. ${pad(s)} วิ`;
  return `${s} วิ`;
}

/** Whole-unit duration for set lengths: "7 วัน", "20 ชม.", "1 วัน 12 ชม.", "30 นาที" */
export function formatDuration(ms: number) {
  const { d, h, m } = splitMs(ms);
  const parts: string[] = [];
  if (d) parts.push(`${d} วัน`);
  if (h) parts.push(`${h} ชม.`);
  if (m) parts.push(`${m} นาที`);
  return parts.join(" ") || "0 นาที";
}

export function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatTime(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(ts: number) {
  const d = new Date(ts);
  return `${TH_DAYS_SHORT[d.getDay()]} ${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]}`;
}

export function formatDayMonth(ts: number) {
  const d = new Date(ts);
  return `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]}`;
}

export function formatDateTime(ts: number) {
  return `${formatDate(ts)} ${formatTime(ts)}`;
}

/** "วันนี้ 21:30 น.", "พรุ่งนี้ 08:00 น.", "เมื่อวาน 17:18 น.", or a full date. */
export function formatWhen(ts: number, now: number) {
  const diff = Math.round((startOfDay(ts) - startOfDay(now)) / DAY);
  const time = `${formatTime(ts)} น.`;
  if (diff === 0) return `วันนี้ ${time}`;
  if (diff === 1) return `พรุ่งนี้ ${time}`;
  if (diff === -1) return `เมื่อวาน ${time}`;
  return `${formatDate(ts)} ${time}`;
}

/** "3 วันก่อน", "5 ชม. ก่อน" */
export function formatAgo(ts: number, now: number) {
  const ms = Math.max(0, now - ts);
  if (ms >= DAY) return `${Math.floor(ms / DAY)} วันก่อน`;
  if (ms >= HOUR) return `${Math.floor(ms / HOUR)} ชม. ก่อน`;
  return `${Math.max(1, Math.floor(ms / MINUTE))} นาทีก่อน`;
}

/** Next weekly reset strictly after `now`, in local time. */
export function nextReset(now: number, r: ResetSettings) {
  const d = new Date(now);
  d.setHours(r.hour, r.minute, 0, 0);
  const diff = (r.day - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  if (d.getTime() <= now) d.setDate(d.getDate() + 7);
  return d.getTime();
}

/** Start of the weekly period `now` falls in. */
export function currentPeriodStart(now: number, r: ResetSettings) {
  return nextReset(now, r) - WEEK;
}
