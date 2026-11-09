"use client";

import React, { useMemo, useState } from "react";
import { BarChart3, Crosshair, Gift, LayoutGrid, Monitor, Moon, Plus, Sun, Users } from "lucide-react";
import { type ThemePref, setThemePref, useThemePref } from "@/lib/theme";
import { Menu } from "@/components/ui/Menu";
import type { Account, AppState } from "@/lib/cooldown/types";
import { setAppState, makeId, useAppState } from "@/lib/cooldown/store";
import { currentTime, useNow } from "@/lib/cooldown/clock";
import { type AccountView, buildAccountViews, weeklyMarks } from "@/lib/cooldown/derive";
import { formatDuration, formatTime, pad } from "@/lib/cooldown/time";
import { Button } from "@/components/ui/Button";
import { ToastViewport, useToasts } from "@/components/ui/Toast";
import { AccountsTab } from "./AccountsTab";
import { AccountModal, ConfirmModal, LogModal, ResetModal } from "./Modals";
import { OverviewTab } from "./OverviewTab";
import { StatsTab } from "./StatsTab";
import { WeeklyTab } from "./WeeklyTab";
import type { AppActions, TabId } from "./shared";

type ModalState =
  | { kind: "none" }
  | { kind: "add" }
  | { kind: "edit"; account: Account }
  | { kind: "log"; accountId?: string }
  | { kind: "reset" }
  | { kind: "confirm"; title: string; body: React.ReactNode; confirmLabel: string; onConfirm: () => void };

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "ภาพรวม", icon: <LayoutGrid aria-hidden className="size-4" /> },
  { id: "accounts", label: "ไอดี", icon: <Users aria-hidden className="size-4" /> },
  { id: "stats", label: "ประวัติและสถิติ", icon: <BarChart3 aria-hidden className="size-4" /> },
  { id: "weekly", label: "Weekly Drop", icon: <Gift aria-hidden className="size-4" /> },
];

export function CooldownApp() {
  const state = useAppState();
  const now = useNow();

  if (!state || now === 0) {
    return (
      <div className="min-h-screen grid place-items-center bg-cream">
        <div className="flex items-center gap-3 text-ink-2">
          <Crosshair aria-hidden className="size-5 text-caramel animate-spin [animation-duration:3s]" />
          <span className="font-medium">กำลังโหลดรายชื่อไอดี…</span>
        </div>
      </div>
    );
  }
  return <Shell state={state} now={now} />;
}

const THEME_OPTIONS: { value: ThemePref; label: string; icon: React.ReactNode }[] = [
  { value: "system", label: "ตามระบบ", icon: <Monitor aria-hidden className="size-4" /> },
  { value: "light", label: "สว่าง", icon: <Sun aria-hidden className="size-4" /> },
  { value: "dark", label: "มืด", icon: <Moon aria-hidden className="size-4" /> },
];

function ThemeMenu() {
  const pref = useThemePref();
  const current = THEME_OPTIONS.find((o) => o.value === pref) ?? THEME_OPTIONS[0];
  return (
    <Menu
      label={`ธีม: ${current.label}`}
      bordered
      icon={current.icon}
      items={THEME_OPTIONS.map((o) => ({
        label: o.label,
        icon: o.icon,
        checked: o.value === pref,
        onSelect: () => setThemePref(o.value),
      }))}
    />
  );
}

function Shell({ state, now }: { state: AppState; now: number }) {
  const [tab, setTab] = useState<TabId>("overview");
  const [statsAccountId, setStatsAccountId] = useState<string>();
  const [modal, setModal] = useState<ModalState>({ kind: "none" });
  const { toasts, show, dismiss } = useToasts();

  const views = useMemo(() => buildAccountViews(state, now), [state, now]);
  const close = () => setModal({ kind: "none" });

  /** Applies a change and offers to undo it from the toast. */
  const commitWithUndo = (message: string, change: (s: AppState) => AppState) => {
    const before = state;
    setAppState(change);
    show(message, "success", () => setAppState(() => before));
  };

  const actions: AppActions = {
    goTab: (t, accountId) => {
      setTab(t);
      if (accountId) setStatsAccountId(accountId);
    },
    openAddAccount: () => setModal({ kind: "add" }),
    openEditAccount: (account) => setModal({ kind: "edit", account }),
    openLog: (accountId) => setModal({ kind: "log", accountId }),
    openResetSettings: () => setModal({ kind: "reset" }),
    askCancelCooldown: (view: AccountView) => {
      const rec = view.active;
      if (!rec) return;
      setModal({
        kind: "confirm",
        title: "ยกเลิกคูลดาวน์?",
        body: (
          <>
            <strong className="text-ink">{view.account.name}</strong> จะกลับเป็นพร้อมเล่นทันที
            ประวัติครั้งนี้ยังเก็บไว้ในสถิติ
          </>
        ),
        confirmLabel: "ยกเลิกคูลดาวน์",
        onConfirm: () => {
          const at = currentTime();
          commitWithUndo(`ยกเลิกคูลดาวน์ของ ${view.account.name} แล้ว`, (s) => ({
            ...s,
            records: s.records.map((r) => (r.id === rec.id ? { ...r, cancelledAt: at } : r)),
          }));
        },
      });
    },
    askRemoveAccount: (account) =>
      setModal({
        kind: "confirm",
        title: "ลบไอดีออกจากรายชื่อ?",
        body: (
          <>
            <strong className="text-ink">{account.name}</strong> และประวัติคูลดาวน์ทั้งหมดของไอดีนี้จะถูกลบ
          </>
        ),
        confirmLabel: "ลบไอดี",
        onConfirm: () =>
          commitWithUndo(`ลบ ${account.name} แล้ว`, (s) => ({
            ...s,
            accounts: s.accounts.filter((a) => a.id !== account.id),
            records: s.records.filter((r) => r.accountId !== account.id),
          })),
      }),
    toggleWeekly: (accountId, key) => {
      const { key: period } = weeklyMarks(state, now);
      setAppState((s) => {
        const marks = s.weekly[period] ?? {};
        const prev = marks[accountId] ?? {};
        return {
          ...s,
          weekly: { ...s.weekly, [period]: { ...marks, [accountId]: { ...prev, [key]: !prev[key] } } },
        };
      });
    },
  };

  const weeklyLeft = (() => {
    const { marks } = weeklyMarks(state, now);
    return views.filter((v) => !marks[v.account.id]?.drop).length;
  })();

  return (
    <div className="min-h-screen bg-cream text-ink text-[15px]">
      <header className="sticky top-0 z-40 border-b border-line bg-cream-2/90 backdrop-blur">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 py-2.5">
          <div className="flex items-center gap-2.5 min-h-11">
            <span className="grid place-items-center size-9 rounded-xl bg-caramel text-on-dark">
              <Crosshair aria-hidden className="size-5" />
            </span>
            <span className="text-lg font-bold">CS2 Cooldown</span>
          </div>

          <nav aria-label="เมนูหลัก" className="order-3 lg:order-none w-full lg:w-auto lg:flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex gap-1 w-max rounded-full border border-line bg-card p-1">
              {TABS.map((t) => {
                const on = t.id === tab;
                const count = t.id === "accounts" ? views.length : t.id === "weekly" ? weeklyLeft : undefined;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      aria-current={on ? "page" : undefined}
                      onClick={() => setTab(t.id)}
                      className={`flex items-center gap-2 h-10 px-4 rounded-full text-[15px] font-medium whitespace-nowrap transition-colors cursor-pointer focus-ring ${on ? "bg-espresso text-on-dark" : "text-ink-2 hover:text-ink hover:bg-soft"}`}
                    >
                      {t.icon}
                      {t.label}
                      {!!count && (
                        <span
                          className={`min-w-6 h-[22px] px-1.5 rounded-full text-xs font-semibold inline-grid place-items-center tabular ${on ? "bg-on-dark/15 text-on-dark" : t.id === "weekly" ? "bg-caramel/15 text-caramel" : "bg-soft text-ink-2"}`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <time className="hidden sm:block text-[15px] font-medium text-ink-2 tabular">
              {formatTime(now)}:{pad(new Date(now).getSeconds())}
            </time>
            <ThemeMenu />
            <Button
              icon={<Plus aria-hidden className="size-4" strokeWidth={2.4} />}
              onClick={() => actions.openLog()}
              className="px-4 sm:px-5"
            >
              <span className="sm:hidden">บันทึก</span>
              <span className="hidden sm:inline">บันทึกคูลดาวน์</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-7 pb-20">
        {tab === "overview" && <OverviewTab state={state} views={views} now={now} actions={actions} />}
        {tab === "accounts" && <AccountsTab views={views} now={now} actions={actions} />}
        {tab === "stats" && (
          <StatsTab
            state={state}
            views={views}
            now={now}
            selectedId={statsAccountId}
            onSelect={setStatsAccountId}
            actions={actions}
          />
        )}
        {tab === "weekly" && <WeeklyTab state={state} views={views} now={now} actions={actions} />}
      </main>

      <footer className="border-t border-line py-5 text-center text-xs text-mute">
        ข้อมูลเก็บไว้ในเบราว์เซอร์นี้เท่านั้น
      </footer>

      {(modal.kind === "add" || modal.kind === "edit") && (
        <AccountModal
          initial={modal.kind === "edit" ? modal.account : undefined}
          existingNames={state.accounts.map((a) => a.name)}
          onClose={close}
          onSubmit={(input) => {
            if (modal.kind === "edit") {
              const id = modal.account.id;
              setAppState((s) => ({
                ...s,
                accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...input } : a)),
              }));
              show(`บันทึกการแก้ไข ${input.name} แล้ว`);
            } else {
              const account: Account = { id: makeId("acc"), createdAt: currentTime(), ...input };
              setAppState((s) => ({ ...s, accounts: [...s.accounts, account] }));
              show(`เพิ่ม ${input.name} เข้ารายชื่อแล้ว`);
            }
            close();
          }}
        />
      )}

      {modal.kind === "log" && (
        <LogModal
          views={views}
          now={now}
          initialAccountId={modal.accountId}
          onClose={close}
          onAddAccount={() => setModal({ kind: "add" })}
          onSubmit={({ accountId, durationMs, reason, note }) => {
            const startedAt = currentTime();
            const name = state.accounts.find((a) => a.id === accountId)?.name ?? "";
            commitWithUndo(`เริ่มนับ ${formatDuration(durationMs)} ให้ ${name} แล้ว`, (s) => ({
              ...s,
              records: [
                ...s.records,
                { id: makeId("cd"), accountId, reason, note, startedAt, endsAt: startedAt + durationMs, durationMs },
              ],
            }));
            close();
          }}
        />
      )}

      {modal.kind === "reset" && (
        <ResetModal
          initial={state.reset}
          onClose={close}
          onSubmit={(reset) => {
            setAppState((s) => ({ ...s, reset }));
            show("บันทึกรอบรีเซ็ตแล้ว");
            close();
          }}
        />
      )}

      {modal.kind === "confirm" && (
        <ConfirmModal
          title={modal.title}
          body={modal.body}
          confirmLabel={modal.confirmLabel}
          onClose={close}
          onConfirm={() => {
            modal.onConfirm();
            close();
          }}
        />
      )}

      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
