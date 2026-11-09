"use client";

import React, { useMemo, useState } from "react";
import { BarChart3, Pencil, Search, Trash2, UserPlus } from "lucide-react";
import type { AccountView } from "@/lib/cooldown/derive";
import { isLongBan, isPrime } from "@/lib/cooldown/derive";
import { formatAgo, formatCompact, formatDuration, formatWhen } from "@/lib/cooldown/time";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Choice";
import { Card, Dot, Progress, STATUS_COLOR } from "@/components/ui/Display";
import { Menu } from "@/components/ui/Menu";
import { Select } from "@/components/ui/Select";
import type { AppActions } from "./shared";

type Filter = "all" | "ready" | "cooldown";
type Sort = "unlock" | "name" | "count";

export function AccountsTab({
  views,
  now,
  actions,
}: {
  views: AccountView[];
  now: number;
  actions: AppActions;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("unlock");

  const readyCount = views.filter((v) => v.status === "ready").length;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return views
      .filter((v) => {
        const okFilter =
          filter === "all" || (filter === "ready" ? v.status === "ready" : v.status !== "ready");
        const okQuery =
          !q ||
          v.account.name.toLowerCase().includes(q) ||
          (v.account.note ?? "").toLowerCase().includes(q) ||
          (v.active?.note ?? "").toLowerCase().includes(q);
        return okFilter && okQuery;
      })
      .sort((a, b) => {
        if (sort === "name") return a.account.name.localeCompare(b.account.name);
        if (sort === "count") return b.count90 - a.count90;
        // Cooling accounts first, soonest unlock first; ready accounts after, by name.
        if (a.status !== "ready" && b.status !== "ready") return a.remainingMs - b.remainingMs;
        if (a.status !== b.status) return a.status === "ready" ? 1 : -1;
        return a.account.name.localeCompare(b.account.name);
      });
  }, [views, query, filter, sort]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[28px] font-semibold">ไอดีของฉัน</h1>
          <p className="text-sm text-ink-2">
            {views.length} ไอดี ติดคูลดาวน์อยู่ {views.length - readyCount}
          </p>
        </div>
        <Button icon={<UserPlus className="size-4" />} onClick={actions.openAddAccount}>
          เพิ่มไอดี
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <label className="relative flex-[1_1_260px]">
          <span className="sr-only">ค้นหาไอดี</span>
          <Search aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-mute" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อไอดีหรือหมายเหตุ"
            className="w-full h-11 rounded-full border border-line-2 bg-card pl-11 pr-4 text-[15px] placeholder:text-mute/80 outline-none focus:border-espresso focus:ring-2 focus:ring-espresso/10"
          />
        </label>
        <Segmented
          ariaLabel="กรองตามสถานะ"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "ทั้งหมด", count: views.length },
            { value: "ready", label: "พร้อมเล่น", count: readyCount },
            { value: "cooldown", label: "ติดคูลดาวน์", count: views.length - readyCount },
          ]}
        />
        <Select<Sort>
          ariaLabel="เรียงลำดับ"
          prefix="เรียงตาม"
          value={sort}
          onChange={setSort}
          className="w-60"
          options={[
            { value: "unlock", label: "ปลดล็อกเร็วสุด" },
            { value: "name", label: "ชื่อ A–Z" },
            { value: "count", label: "โดนบ่อยสุด" },
          ]}
        />
      </div>

      {views.length === 0 ? (
        <Card className="border-dashed py-14 px-6 text-center">
          <p className="text-xl font-semibold">ยังไม่มีไอดีในรายชื่อ</p>
          <p className="text-sm text-ink-2 mt-1 mb-5">เพิ่มไอดีที่ใช้เล่น แล้วบันทึกคูลดาวน์เมื่อโดน</p>
          <Button icon={<UserPlus className="size-4" />} onClick={actions.openAddAccount}>
            เพิ่มไอดี
          </Button>
        </Card>
      ) : shown.length === 0 ? (
        <Card className="border-dashed py-12 px-6 text-center">
          <p className="text-lg font-semibold">ไม่พบไอดีที่ตรงกับตัวกรอง</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            ล้างตัวกรอง
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-4">
          {shown.map((v) => (
            <AccountCard key={v.account.id} view={v} now={now} actions={actions} />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountCard({ view, now, actions }: { view: AccountView; now: number; actions: AppActions }) {
  const { account, status, active, last } = view;
  const color = STATUS_COLOR[status];
  const rank = [account.rankMode, account.rating].filter(Boolean).join(" ") || "ยังไม่ได้ใส่แรงก์";

  return (
    <Card as="article" className="p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Dot color={color} className="size-2.5 mt-2.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-lg font-semibold truncate">{account.name}</h3>
            <span className="shrink-0 rounded-full bg-soft px-2.5 py-0.5 text-xs text-ink-2">{account.tag}</span>
            {!isPrime(account) && (
              <span className="shrink-0 rounded-full border border-line-2 px-2.5 py-0.5 text-xs text-mute">
                ไม่มี Prime
              </span>
            )}
          </div>
          <p className="text-[13px] text-mute truncate">{rank}</p>
        </div>
        <Menu
          label={`ตัวเลือกของ ${account.name}`}
          items={[
            {
              label: "ดูประวัติและสถิติ",
              icon: <BarChart3 aria-hidden className="size-4" />,
              onSelect: () => actions.goTab("stats", account.id),
            },
            {
              label: "แก้ไขไอดี",
              icon: <Pencil aria-hidden className="size-4" />,
              onSelect: () => actions.openEditAccount(account),
            },
            {
              label: "ลบไอดี",
              icon: <Trash2 aria-hidden className="size-4" />,
              danger: true,
              onSelect: () => actions.askRemoveAccount(account),
            },
          ]}
        />
      </div>

      {active ? (
        <>
          <div className="rounded-2xl bg-cream p-4">
            <div className="flex items-baseline justify-between gap-2 text-[13px]">
              <span className="text-ink-2">เหลือเวลา</span>
              <span style={{ color }}>คูลดาวน์ {formatDuration(active.durationMs)}</span>
            </div>
            <p className="text-[28px] font-semibold tabular" style={{ color }}>
              {formatCompact(view.remainingMs)}
            </p>
            <Progress
              value={view.progress}
              color={isLongBan(active) ? STATUS_COLOR.ban : STATUS_COLOR.cooldown}
              className="h-1.5 mt-2"
              track="bg-soft"
              label="ความคืบหน้าคูลดาวน์"
            />
            <p className="mt-2 text-[13px] text-mute">ปลดล็อก{formatWhen(active.endsAt, now)}</p>
            {active.note && <p className="mt-1 text-[13px] text-ink-2 line-clamp-2">{active.note}</p>}
          </div>
          <Button variant="secondary" full onClick={() => actions.askCancelCooldown(view)}>
            ยกเลิกคูลดาวน์
          </Button>
        </>
      ) : (
        <>
          <div className="rounded-2xl bg-cream p-4">
            <p className="text-[13px] text-ink-2">สถานะ</p>
            <p className="text-[28px] font-semibold text-sage">พร้อมเล่น</p>
            <p className="mt-2 text-[13px] text-mute">
              {last ? `โดนล่าสุดเมื่อ ${formatAgo(last.startedAt, now)}` : "ยังไม่เคยโดนคูลดาวน์"}
            </p>
          </div>
          <Button full onClick={() => actions.openLog(account.id)}>
            บันทึกคูลดาวน์
          </Button>
        </>
      )}
    </Card>
  );
}
