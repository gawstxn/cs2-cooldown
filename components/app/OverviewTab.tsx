import React from "react";
import { UserPlus } from "lucide-react";
import type { AppState } from "@/lib/cooldown/types";
import { type AccountView, isLongBan, recentActivity, weeklyMarks } from "@/lib/cooldown/derive";
import {
  DAY,
  formatClock,
  formatClockInline,
  formatCompact,
  formatDuration,
  formatWhen,
  nextReset,
  startOfDay,
  TH_DAYS_SHORT,
} from "@/lib/cooldown/time";
import { Button } from "@/components/ui/Button";
import { Card, Dot, Progress, STATUS_COLOR, StatusPill } from "@/components/ui/Display";
import type { AppActions } from "./shared";

interface Props {
  state: AppState;
  views: AccountView[];
  now: number;
  actions: AppActions;
}

export function OverviewTab({ state, views, now, actions }: Props) {
  const cooling = views
    .filter((v) => v.status !== "ready")
    .sort((a, b) => a.remainingMs - b.remainingMs);
  const ready = views.filter((v) => v.status === "ready");
  const next = cooling[0];
  const reset = nextReset(now, state.reset);
  const { marks } = weeklyMarks(state, now);
  const dropsDone = views.filter((v) => marks[v.account.id]?.drop).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <NextUnlock next={next} now={now} reset={reset} total={views.length} actions={actions} />

        <div className="flex-[1_1_300px] flex flex-col gap-4">
          <Card className="p-6 flex-1">
            <h2 className="text-sm font-medium text-ink-2">พร้อมเล่นตอนนี้</h2>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-[52px] leading-none font-semibold text-sage tabular">{ready.length}</span>
              <span className="text-lg text-mute">จาก {views.length} ไอดี</span>
            </p>
            {ready.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {ready.slice(0, 8).map((v) => (
                  <li
                    key={v.account.id}
                    className="inline-flex items-center gap-1.5 max-w-40 rounded-full bg-sage/12 text-sage px-3 py-1 text-[13px] font-medium"
                  >
                    <Dot color={STATUS_COLOR.ready} className="size-1.5" />
                    <span className="truncate">{v.account.name}</span>
                  </li>
                ))}
                {ready.length > 8 && <li className="px-2 py-1 text-[13px] text-mute">+{ready.length - 8}</li>}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-mute">
                {views.length === 0 ? "ยังไม่มีไอดีในรายชื่อ" : "ทุกไอดียังติดคูลดาวน์"}
              </p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-ink-2">รีเซ็ตรายสัปดาห์ในอีก</h2>
              <button
                type="button"
                onClick={() => actions.goTab("weekly")}
                className="text-sm font-semibold text-berry-ink hover:underline cursor-pointer rounded focus-ring"
              >
                ดู Weekly Drop
              </button>
            </div>
            <p className="text-[28px] font-semibold tabular">{formatClockInline(reset - now)}</p>
            <div className="flex gap-1 mt-3" aria-hidden>
              {views.map((v, i) => (
                <span
                  key={v.account.id}
                  className={`flex-1 h-1.5 rounded-full ${i < dropsDone ? "bg-caramel" : "bg-soft"}`}
                />
              ))}
            </div>
            <p className="mt-2 text-[13px] text-ink-2">
              รับดรอปแล้ว {dropsDone} จาก {views.length} ไอดี
            </p>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {cooling.length > 0 && <Timeline cooling={cooling} now={now} reset={reset} />}
        <Activity state={state} now={now} />
      </div>
    </div>
  );
}

function NextUnlock({
  next,
  now,
  reset,
  total,
  actions,
}: {
  next?: AccountView;
  now: number;
  reset: number;
  total: number;
  actions: AppActions;
}) {
  if (!next?.active) {
    return (
      <section className="flex-[2_1_520px] rounded-[26px] border border-blush-line bg-blush p-7 flex flex-col justify-center gap-3">
        <p className="text-sm text-warn-body">{total === 0 ? "ยินดีต้อนรับ" : "ไม่มีไอดีติดคูลดาวน์"}</p>
        <p className="text-[36px] sm:text-[44px] font-semibold leading-tight">
          {total === 0 ? "เริ่มจากเพิ่มไอดีแรก" : "ทุกไอดีพร้อมเล่น"}
        </p>
        <p className="text-[15px] text-warn-body max-w-md">
          {total === 0
            ? "เพิ่มชื่อไอดีที่ใช้เล่น แล้วบันทึกคูลดาวน์เมื่อโดน ระบบจะนับถอยหลังให้"
            : "เมื่อโดนคูลดาวน์ กดบันทึกคูลดาวน์ แล้วเลือกจำนวนวัน"}
        </p>
        <div className="mt-2">
          {total === 0 ? (
            <Button icon={<UserPlus className="size-4" />} onClick={actions.openAddAccount}>
              เพิ่มไอดี
            </Button>
          ) : (
            <Button onClick={() => actions.openLog()}>บันทึกคูลดาวน์</Button>
          )}
        </div>
      </section>
    );
  }

  const a = next.active;
  const clock = formatClock(next.remainingMs);
  const long = isLongBan(a);
  return (
    <section
      aria-labelledby="next-h"
      className="flex-[2_1_520px] rounded-[26px] border border-blush-line bg-blush p-7 flex flex-col"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 id="next-h" className="text-sm font-medium text-warn-body">
          ไอดีถัดไปที่จะปลดล็อก
        </h2>
        <StatusPill status={next.status}>คูลดาวน์ {formatDuration(a.durationMs)}</StatusPill>
      </div>
      <p className="mt-1 flex items-baseline gap-2 min-w-0">
        <span className="text-[26px] font-semibold truncate">{next.account.name}</span>
        <span className="text-[13px] text-warn-body">{next.account.tag}</span>
      </p>
      <p className="mt-3 font-semibold leading-none tracking-tight tabular text-[56px] sm:text-[80px]" aria-live="off">
        {clock.days > 0 && (
          <>
            {clock.days}
            <span className="text-[0.38em] font-medium text-warn-body ml-1.5 mr-3">วัน</span>
          </>
        )}
        {clock.time}
      </p>
      <Progress
        value={next.progress}
        color={long ? STATUS_COLOR.ban : STATUS_COLOR.cooldown}
        track="bg-card/70"
        className="h-2 mt-6"
        label="ความคืบหน้าคูลดาวน์"
      />
      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-warn-body">
          ปลดล็อก{formatWhen(a.endsAt, now)}{" "}
          {a.endsAt < reset ? "ยังทันก่อนรีเซ็ตรายสัปดาห์" : "หลังรีเซ็ตรายสัปดาห์"}
        </p>
        <Button variant="secondary" size="sm" onClick={() => actions.goTab("accounts")}>
          ดูไอดีทั้งหมด
        </Button>
      </div>
    </section>
  );
}

function Timeline({ cooling, now, reset }: { cooling: AccountView[]; now: number; reset: number }) {
  // Yesterday 00:00 through the end of six days from now: eight day columns.
  const start = startOfDay(now) - DAY;
  const span = 8 * DAY;
  const pct = (ts: number) => Math.max(0, Math.min(100, ((ts - start) / span) * 100));
  const nowPos = pct(now);
  const resetPos = reset < start + span ? pct(reset) : null;
  const days = Array.from({ length: 8 }, (_, i) => {
    const ts = start + i * DAY;
    const d = new Date(ts);
    return { ts, label: i === 1 ? "วันนี้" : `${TH_DAYS_SHORT[d.getDay()]} ${d.getDate()}`, today: i === 1 };
  });
  const LABEL_COL = "grid grid-cols-[110px_minmax(0,1fr)_92px] gap-3";

  return (
    <Card className="flex-[2_1_560px] min-w-0 p-6" aria-labelledby="tl-h">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 id="tl-h" className="text-lg font-semibold">
          ไทม์ไลน์ปลดล็อก
        </h2>
        <div className="flex gap-4 flex-wrap text-xs text-ink-2">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded-sm bg-caramel" />
            คูลดาวน์
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded-sm bg-berry" />7 วัน
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 border-l-2 border-dashed border-espresso" />
            รีเซ็ตรายสัปดาห์
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className={`${LABEL_COL} items-end`}>
            <span />
            <div className="grid grid-cols-8 text-xs">
              {days.map((d) => (
                <span key={d.ts} className={`text-center ${d.today ? "text-ink font-semibold" : "text-mute"}`}>
                  {d.label}
                </span>
              ))}
            </div>
            <span className="text-xs text-mute text-right">เหลือ</span>
          </div>
          <ul className="mt-2 flex flex-col gap-2">
            {cooling.map((v) => {
              const a = v.active!;
              const long = isLongBan(a);
              const st = pct(a.startedAt);
              const en = pct(a.endsAt);
              return (
                <li key={v.account.id} className={`${LABEL_COL} items-center`}>
                  <span className="text-sm font-medium truncate">{v.account.name}</span>
                  <div className="relative h-8 rounded-xl bg-cream overflow-hidden">
                    <div aria-hidden className="absolute inset-0 grid grid-cols-8">
                      {days.map((d, i) => (
                        <span
                          key={d.ts}
                          className={`${i < 7 ? "border-r border-line" : ""} ${d.today ? "bg-blush/50" : ""}`}
                        />
                      ))}
                    </div>
                    <span
                      className={`absolute top-2 bottom-2 rounded-l-md ${long ? "bg-berry/25" : "bg-caramel/25"}`}
                      style={{ left: `${st}%`, width: `${Math.max(0, nowPos - st)}%` }}
                    />
                    <span
                      className={`absolute top-2 bottom-2 rounded-r-md ${long ? "bg-berry" : "bg-caramel"}`}
                      style={{ left: `${nowPos}%`, width: `${Math.max(0.6, en - nowPos)}%` }}
                    />
                    {resetPos !== null && (
                      <span
                        aria-hidden
                        className="absolute inset-y-0 border-l-2 border-dashed border-espresso/70"
                        style={{ left: `${resetPos}%` }}
                      />
                    )}
                    <span aria-hidden className="absolute inset-y-0 w-0.5 bg-espresso" style={{ left: `${nowPos}%` }} />
                  </div>
                  <span
                    className={`text-right text-sm font-semibold tabular ${long ? "text-berry-ink" : "text-caramel"}`}
                  >
                    {formatCompact(v.remainingMs)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Card>
  );
}

function Activity({ state, now }: { state: AppState; now: number }) {
  const items = recentActivity(state, now);
  return (
    <Card className="flex-[1_1_300px] p-6" aria-labelledby="act-h">
      <h2 id="act-h" className="text-lg font-semibold mb-2">
        ล่าสุด
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-mute py-3">ยังไม่มีประวัติ เมื่อบันทึกคูลดาวน์จะขึ้นที่นี่</p>
      ) : (
        <ul>
          {items.map((it) => {
            const color =
              it.kind === "start"
                ? isLongBan(it.record)
                  ? STATUS_COLOR.ban
                  : STATUS_COLOR.cooldown
                : STATUS_COLOR.ready;
            const text =
              it.kind === "start"
                ? `${it.name} โดนคูลดาวน์ ${formatDuration(it.record.durationMs)}`
                : it.kind === "cancel"
                  ? `${it.name} ยกเลิกคูลดาวน์`
                  : `${it.name} พ้นคูลดาวน์แล้ว`;
            return (
              <li key={it.id} className="flex gap-3 py-2.5 border-t border-soft first:border-t-0">
                <Dot color={color} className="size-2 mt-2" />
                <div className="min-w-0">
                  <p className="text-sm truncate">{text}</p>
                  <p className="text-xs text-mute">{formatWhen(it.at, now)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
