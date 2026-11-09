import React from "react";
import { Pencil } from "lucide-react";
import type { AppState } from "@/lib/cooldown/types";
import { type AccountView, isPrime, pastDrops, weeklyMarks } from "@/lib/cooldown/derive";
import { formatClockInline, formatDateTime, formatWhen, nextReset, pad, TH_DAYS_LONG } from "@/lib/cooldown/time";
import { Button } from "@/components/ui/Button";
import { CheckToggle } from "@/components/ui/Choice";
import { Card } from "@/components/ui/Display";
import type { AppActions } from "./shared";

const ROW = "grid grid-cols-[minmax(0,1.8fr)_88px_88px_minmax(0,1.2fr)] gap-4 items-center";

export function WeeklyTab({
  state,
  views,
  now,
  actions,
}: {
  state: AppState;
  views: AccountView[];
  now: number;
  actions: AppActions;
}) {
  const reset = nextReset(now, state.reset);
  const { marks } = weeklyMarks(state, now);
  const eligible = views.filter((v) => isPrime(v.account));
  const nonPrime = views.filter((v) => !isPrime(v.account));
  const drops = eligible.filter((v) => marks[v.account.id]?.drop).length;
  const levels = eligible.filter((v) => marks[v.account.id]?.level).length;
  const r = state.reset;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] font-semibold">Weekly Drop</h1>
        <p className="text-sm text-ink-2">
          ติ๊กไอดีที่รับดรอปประจำสัปดาห์และเลเวลอัปแล้ว ช่องติ๊กจะว่างให้เองเมื่อถึงรอบรีเซ็ต
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <section className="flex-[3_1_460px] rounded-[26px] border border-blush-line bg-blush p-7" aria-labelledby="reset-h">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 id="reset-h" className="text-sm font-medium text-warn-body">
              รีเซ็ตรอบถัดไปในอีก
            </h2>
            <Button
              variant="secondary"
              size="sm"
              icon={<Pencil aria-hidden className="size-3.5" />}
              onClick={actions.openResetSettings}
            >
              ทุก{TH_DAYS_LONG[r.day]} {pad(r.hour)}:{pad(r.minute)} น.
            </Button>
          </div>
          <p className="mt-3 text-[44px] sm:text-[60px] leading-tight font-semibold tabular">
            {formatClockInline(reset - now)}
          </p>
          <p className="text-sm text-warn-body">{formatDateTime(reset)} น.</p>
        </section>

        <Card className="flex-[2_1_300px] p-7 flex flex-col gap-5">
          <div>
            <h2 className="text-sm font-medium text-ink-2">รับดรอปแล้ว</h2>
            <p className="flex items-baseline gap-2">
              <span className="text-[44px] font-semibold text-caramel tabular">{drops}</span>
              <span className="text-lg text-mute">จาก {eligible.length} ไอดีที่มี Prime</span>
            </p>
            <div className="flex gap-1 mt-2" aria-hidden>
              {eligible.map((v, i) => (
                <span key={v.account.id} className={`flex-1 h-2 rounded-full ${i < drops ? "bg-caramel" : "bg-soft"}`} />
              ))}
            </div>
          </div>
          <div className="flex justify-between border-t border-line pt-4 text-sm text-ink-2">
            <span>เลเวลอัปแล้ว</span>
            <span className="font-semibold text-ink">
              {levels} จาก {eligible.length}
            </span>
          </div>
          {nonPrime.length > 0 && (
            <p className="text-[13px] text-mute -mt-2">
              ไม่นับ {nonPrime.length} ไอดีที่ไม่มี Prime เพราะรับดรอปและเลเวลอัปไม่ได้
            </p>
          )}
        </Card>
      </div>

      <Card className="pt-5 pb-1" aria-labelledby="wk-list-h">
        <h2 id="wk-list-h" className="px-6 pb-3 text-lg font-semibold">
          สัปดาห์นี้
        </h2>
        {views.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-mute">เพิ่มไอดีก่อน แล้วรายการจะขึ้นที่นี่</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div className={`${ROW} px-6 py-2.5 border-t border-line text-[13px] text-mute`}>
                <span>ไอดี</span>
                <span className="text-center">ดรอป</span>
                <span className="text-center">เลเวลอัป</span>
                <span>8 สัปดาห์ล่าสุด</span>
              </div>
              {eligible.length === 0 && (
                <p className="px-6 py-4 border-t border-soft text-sm text-mute">
                  ยังไม่มีไอดีที่มี Prime เปิด Prime Status ได้ที่เมนูแก้ไขไอดีในแท็บไอดี
                </p>
              )}
              {eligible.map((v) => {
                const m = marks[v.account.id] ?? {};
                const past = pastDrops(state, v.account.id, now);
                const afterReset = v.active && v.active.endsAt > reset;
                const note = v.active
                  ? afterReset
                    ? "ปลดล็อกหลังรีเซ็ต สัปดาห์นี้ฟาร์มไม่ทัน"
                    : `ปลดล็อก${formatWhen(v.active.endsAt, now)} ยังทันก่อนรีเซ็ต`
                  : "พร้อมเล่น";
                return (
                  <div key={v.account.id} className={`${ROW} px-6 py-3.5 border-t border-soft`}>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{v.account.name}</p>
                      <p className={`text-xs truncate ${afterReset ? "text-berry-ink" : "text-mute"}`}>{note}</p>
                    </div>
                    <div className="flex justify-center">
                      <CheckToggle
                        tone="caramel"
                        label={`รับดรอปแล้ว ${v.account.name}`}
                        checked={!!m.drop}
                        onChange={() => actions.toggleWeekly(v.account.id, "drop")}
                      />
                    </div>
                    <div className="flex justify-center">
                      <CheckToggle
                        tone="sage"
                        label={`เลเวลอัปแล้ว ${v.account.name}`}
                        checked={!!m.level}
                        onChange={() => actions.toggleWeekly(v.account.id, "level")}
                      />
                    </div>
                    <div
                      className="flex gap-1.5"
                      role="img"
                      aria-label={`รับดรอป ${past.filter(Boolean).length} จาก 8 สัปดาห์ล่าสุด`}
                    >
                      {past.map((got, i) => (
                        <span key={i} className={`size-3.5 rounded ${got ? "bg-caramel" : "bg-line"}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {nonPrime.map((v) => (
                <div key={v.account.id} className={`${ROW} px-6 py-3.5 border-t border-soft`}>
                  <div className="min-w-0">
                    <p className="font-medium truncate text-ink-2">{v.account.name}</p>
                    <p className="text-xs truncate text-mute">ไม่มี Prime รับดรอปและเลเวลอัปไม่ได้</p>
                  </div>
                  <span className="text-center text-mute" aria-label="ไม่มีสิทธิ์รับดรอป">
                    –
                  </span>
                  <span className="text-center text-mute" aria-label="ไม่มีสิทธิ์เลเวลอัป">
                    –
                  </span>
                  <span className="text-mute" aria-label="ไม่มีประวัติดรอป">
                    –
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
