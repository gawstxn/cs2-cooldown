"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, Download } from "lucide-react";
import type { AppState } from "@/lib/cooldown/types";
import { type AccountView, type StatsRange, buildStats, isLongBan, weekLabel } from "@/lib/cooldown/derive";
import { DAY, MINUTE, formatDate, formatDateTime, formatDuration } from "@/lib/cooldown/time";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Choice";
import { Card, STATUS_COLOR } from "@/components/ui/Display";
import { Select } from "@/components/ui/Select";
import type { AppActions } from "./shared";

const RESULT_LABEL = { active: "กำลังนับ", done: "ครบเวลา", cancelled: "ยกเลิกก่อนกำหนด" } as const;

function daysText(ms: number) {
  const d = ms / DAY;
  if (d >= 1) return `${Math.floor(d)} วัน`;
  return formatDuration(ms);
}

/** "2.8 วัน" for a day or more, otherwise "5 ชม. 20 นาที". */
function averageText(ms: number) {
  return ms >= DAY ? `${(ms / DAY).toFixed(1)} วัน` : formatDuration(ms);
}

export function StatsTab({
  state,
  views,
  now,
  selectedId,
  onSelect,
  actions,
}: {
  state: AppState;
  views: AccountView[];
  now: number;
  selectedId?: string;
  onSelect: (id: string) => void;
  actions: AppActions;
}) {
  const [range, setRange] = useState<StatsRange>("90");
  const view = views.find((v) => v.account.id === selectedId) ?? views[0];
  const stats = useMemo(
    () => (view ? buildStats(state, view.account, range, now) : null),
    [state, view, range, now],
  );

  if (!view || !stats) {
    return (
      <Card className="border-dashed py-14 px-6 text-center">
        <p className="text-xl font-semibold">ยังไม่มีไอดีให้ดูสถิติ</p>
        <p className="text-sm text-ink-2 mt-1 mb-5">เพิ่มไอดีก่อน แล้วประวัติและสถิติจะขึ้นที่นี่</p>
        <Button onClick={actions.openAddAccount}>เพิ่มไอดี</Button>
      </Card>
    );
  }

  const maxWeek = Math.max(1, ...stats.weeks.map((w) => w.count));
  const maxReason = Math.max(1, ...stats.reasons.map((r) => r.count));
  const rangeText = range === "all" ? "ทั้งหมด" : `ใน ${range} วัน`;

  const exportCsv = () => {
    const rows = [
      ["เริ่มเมื่อ", "ปลดล็อก", "ระยะเวลา", "สาเหตุ", "หมายเหตุ", "ผล"],
      ...stats.history.map(({ record: r, result }) => [
        new Date(r.startedAt).toISOString(),
        new Date(r.endsAt).toISOString(),
        formatDuration(r.durationMs),
        r.reason,
        r.note ?? "",
        RESULT_LABEL[result],
      ]),
    ];
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `cooldown-${view.account.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[28px] font-semibold">ประวัติและสถิติ</h1>
          <p className="text-sm text-ink-2">ดูว่าแต่ละไอดีโดนบ่อยแค่ไหน และโดนเพราะอะไร</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            ariaLabel="เลือกไอดี"
            value={view.account.id}
            onChange={onSelect}
            className="w-64"
            options={views.map((v) => ({
              value: v.account.id,
              label: v.account.name,
              dot: STATUS_COLOR[v.status],
              meta: v.count90 ? `${v.count90} ครั้ง` : "ไม่เคยโดน",
            }))}
          />
          <Segmented
            ariaLabel="ช่วงเวลา"
            value={range}
            onChange={setRange}
            options={[
              { value: "30", label: "30 วัน" },
              { value: "90", label: "90 วัน" },
              { value: "all", label: "ทั้งหมด" },
            ]}
          />
        </div>
      </div>

      {stats.recent30 >= 3 && (
        <div role="status" className="flex gap-3.5 items-start rounded-[22px] border border-caramel/35 bg-caramel/8 px-5 py-4">
          <AlertTriangle aria-hidden className="size-5 mt-0.5 shrink-0 text-caramel" />
          <div>
            <p className="font-semibold text-warn-ink">โดน {stats.recent30} ครั้งใน 30 วันที่ผ่านมา</p>
            <p className="text-sm text-warn-body">
              ถ้าโดนอีกในช่วงนี้ คูลดาวน์ครั้งถัดไปมีแนวโน้มนานขึ้น ลองพักไอดีนี้หรือเล่นไอดีอื่นก่อน
            </p>
          </div>
        </div>
      )}

      {stats.count === 0 && stats.history.length === 0 ? (
        <Card className="border-dashed py-14 px-6 text-center">
          <p className="text-xl font-semibold">
            {view.account.name} ไม่มีคูลดาวน์{range === "all" ? "" : ` ${rangeText}`}
          </p>
          <p className="text-sm text-ink-2 mt-1 mb-5 max-w-md mx-auto">
            เมื่อบันทึกคูลดาวน์ให้ไอดีนี้ ประวัติ สาเหตุ และกราฟรายสัปดาห์จะขึ้นที่หน้านี้
          </p>
          <Button onClick={() => actions.openLog(view.account.id)}>บันทึกคูลดาวน์</Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <Tile label="โดนคูลดาวน์" value={`${stats.count} ครั้ง`} sub={rangeText} />
            <Tile
              label="เวลาที่ติดรวม"
              value={daysText(stats.totalMs)}
              sub={stats.count ? `เฉลี่ย ${averageText(stats.totalMs / stats.count)} ต่อครั้ง` : "-"}
            />
            <Tile
              label="นานที่สุด"
              value={formatDuration(stats.longestMs)}
              sub={stats.longestAt ? formatDate(stats.longestAt) : "-"}
              color={stats.longestMs >= 7 * DAY ? STATUS_COLOR.ban : STATUS_COLOR.cooldown}
            />
            <Tile
              label="เล่นไม่โดนติดกัน"
              value={stats.bestCleanMs >= MINUTE ? daysText(stats.bestCleanMs) : "-"}
              sub={stats.bestCleanMs >= MINUTE ? "สถิติดีที่สุด" : "ยังไม่มีช่วงที่เล่นได้ในประวัติ"}
              color={STATUS_COLOR.ready}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <Card className="flex-[2_1_520px] p-6" aria-labelledby="wk-chart-h">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="wk-chart-h" className="text-lg font-semibold">
                  จำนวนครั้งต่อสัปดาห์
                </h2>
                <span className="text-[13px] text-mute">12 สัปดาห์ล่าสุด</span>
              </div>
              <div
                role="img"
                aria-label={`กราฟจำนวนครั้งที่โดนคูลดาวน์ 12 สัปดาห์ล่าสุด รวม ${stats.weeks.reduce((s, w) => s + w.count, 0)} ครั้ง`}
                className="mt-5 grid grid-cols-12 gap-2 items-end h-40 border-b border-line"
              >
                {stats.weeks.map((w) => (
                  <div key={w.start} className="flex flex-col items-center justify-end gap-1 h-full">
                    <span className="text-xs text-ink-2">{w.count || ""}</span>
                    <span
                      className={`w-full max-w-9 rounded-t-lg ${w.count ? "bg-caramel" : "bg-soft"}`}
                      style={{ height: w.count ? `${(w.count / maxWeek) * 120}px` : "3px" }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 grid grid-cols-12 gap-2 text-[11px] text-mute">
                {stats.weeks.map((w, i) => (
                  <span key={w.start} className="text-center whitespace-nowrap">
                    {i % 4 === 0 || i === 11 ? weekLabel(w.start) : ""}
                  </span>
                ))}
              </div>
            </Card>

            <Card className="flex-[1_1_300px] p-6" aria-labelledby="reason-h">
              <h2 id="reason-h" className="text-lg font-semibold mb-4">
                สาเหตุที่โดน
              </h2>
              {stats.reasons.length === 0 ? (
                <p className="text-sm text-mute">ไม่มีข้อมูลในช่วงนี้</p>
              ) : (
                <ul className="flex flex-col gap-3.5">
                  {stats.reasons.map((r) => (
                    <li key={r.reason}>
                      <div className="flex justify-between text-sm">
                        <span>{r.reason}</span>
                        <span className="text-ink-2">{r.count} ครั้ง</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-cream overflow-hidden">
                        <div
                          className="h-full rounded-full bg-espresso"
                          style={{ width: `${(r.count / maxReason) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="pt-5 pb-2" aria-labelledby="hist-h">
            <div className="flex items-center justify-between gap-2 px-6 pb-3">
              <h2 id="hist-h" className="text-lg font-semibold">
                ประวัติคูลดาวน์
              </h2>
              <Button
                variant="secondary"
                size="sm"
                icon={<Download aria-hidden className="size-4" />}
                onClick={exportCsv}
                disabled={stats.history.length === 0}
              >
                ส่งออก CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[13px] text-mute">
                    <th scope="col" className="font-medium px-6 py-2.5 border-t border-line">เริ่มเมื่อ</th>
                    <th scope="col" className="font-medium px-3 py-2.5 border-t border-line">ระยะเวลา</th>
                    <th scope="col" className="font-medium px-3 py-2.5 border-t border-line">สาเหตุ</th>
                    <th scope="col" className="font-medium px-3 py-2.5 border-t border-line">หมายเหตุ</th>
                    <th scope="col" className="font-medium px-6 py-2.5 border-t border-line text-right">ผล</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.history.map(({ record: r, result }) => (
                    <tr key={r.id}>
                      <td className="px-6 py-3 border-t border-soft whitespace-nowrap">{formatDateTime(r.startedAt)}</td>
                      <td className={`px-3 py-3 border-t border-soft font-medium ${isLongBan(r) ? "text-berry-ink" : ""}`}>
                        {formatDuration(r.durationMs)}
                      </td>
                      <td className="px-3 py-3 border-t border-soft">{r.reason}</td>
                      <td className="px-3 py-3 border-t border-soft text-ink-2">{r.note || "-"}</td>
                      <td className="px-6 py-3 border-t border-soft text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${result === "active" ? "bg-caramel/12 text-caramel" : "bg-soft text-ink-2"}`}
                        >
                          {RESULT_LABEL[result]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Tile({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <Card as="div" className="p-5">
      <p className="text-[13px] text-ink-2">{label}</p>
      <p className="mt-1 text-[30px] leading-tight font-semibold" style={color ? { color } : undefined}>
        {value}
      </p>
      <p className="text-[13px] text-mute">{sub}</p>
    </Card>
  );
}
