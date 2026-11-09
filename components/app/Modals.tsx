"use client";

import React, { useState } from "react";
import type { Account, AccountTag, RankMode, Reason, ResetSettings } from "@/lib/cooldown/types";
import { REASONS } from "@/lib/cooldown/types";
import type { AccountView } from "@/lib/cooldown/derive";
import { DAY, HOUR, MINUTE, formatCompact, formatDateTime, pad, TH_DAYS_LONG } from "@/lib/cooldown/time";
import { Button } from "@/components/ui/Button";
import { Chip, Segmented, Stepper, Switch } from "@/components/ui/Choice";
import { STATUS_COLOR } from "@/components/ui/Display";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

// ---------- Add / edit account ----------

export interface AccountInput {
  name: string;
  tag: AccountTag;
  prime: boolean;
  rankMode?: RankMode;
  rating?: string;
  steamUrl?: string;
  note?: string;
}

export function AccountModal({
  initial,
  existingNames,
  onClose,
  onSubmit,
}: {
  initial?: Account;
  existingNames: string[];
  onClose: () => void;
  onSubmit: (input: AccountInput) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [tag, setTag] = useState<AccountTag>(initial?.tag ?? "Smurf");
  const [prime, setPrime] = useState(initial ? initial.prime !== false : true);
  const [rankMode, setRankMode] = useState<RankMode>(initial?.rankMode ?? "Premier");
  const [rating, setRating] = useState(initial?.rating ?? "");
  const [steamUrl, setSteamUrl] = useState(initial?.steamUrl ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState<string>();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("ใส่ชื่อไอดีก่อน");
    const clash = existingNames.some(
      (n) => n.toLowerCase() === trimmed.toLowerCase() && n.toLowerCase() !== initial?.name.toLowerCase(),
    );
    if (clash) return setError(`มี ${trimmed} ในรายชื่ออยู่แล้ว ลองใช้ชื่ออื่น`);
    onSubmit({
      name: trimmed,
      tag,
      prime,
      rankMode: rating.trim() ? rankMode : undefined,
      rating: rating.trim() || undefined,
      steamUrl: steamUrl.trim() || undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <Modal
      title={initial ? "แก้ไขไอดี" : "เพิ่มไอดี"}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" form="account-form">
            {initial ? "บันทึกการแก้ไข" : "เพิ่มไอดี"}
          </Button>
        </>
      }
    >
      <form id="account-form" onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <Field label="ชื่อไอดี" error={error}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              data-autofocus
              aria-describedby={describedBy}
              invalid={invalid}
              value={name}
              placeholder="เช่น Smurf_03"
              autoComplete="off"
              onChange={(e) => {
                setName(e.target.value);
                setError(undefined);
              }}
            />
          )}
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium">ประเภท</p>
          <Segmented<AccountTag>
            full
            ariaLabel="ประเภทไอดี"
            value={tag}
            onChange={setTag}
            options={[
              { value: "Main", label: "Main" },
              { value: "Smurf", label: "Smurf" },
              { value: "Alt", label: "Alt" },
            ]}
          />
        </div>
        <Switch
          checked={prime}
          onChange={setPrime}
          label="มี Prime Status"
          description="ไอดีที่ไม่มี Prime จะไม่ได้รับดรอปรายสัปดาห์และเลเวลอัป"
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="โหมดแรงก์">
            {({ id }) => (
              <Select<RankMode>
                id={id}
                size="lg"
                value={rankMode}
                onChange={setRankMode}
                options={[
                  { value: "Premier", label: "Premier" },
                  { value: "Competitive", label: "Competitive" },
                  { value: "Wingman", label: "Wingman" },
                ]}
              />
            )}
          </Field>
          <Field label="แรงก์หรือเรตติ้ง" optional>
            {({ id }) => (
              <TextInput id={id} value={rating} placeholder="เช่น 15,200" onChange={(e) => setRating(e.target.value)} />
            )}
          </Field>
        </div>
        <Field label="ลิงก์โปรไฟล์ Steam" optional>
          {({ id }) => (
            <TextInput
              id={id}
              type="url"
              value={steamUrl}
              placeholder="https://steamcommunity.com/id/..."
              onChange={(e) => setSteamUrl(e.target.value)}
            />
          )}
        </Field>
        <Field label="หมายเหตุ" optional>
          {({ id }) => (
            <TextArea id={id} rows={2} value={note} placeholder="เช่น ไอดีไว้เล่นกับเพื่อน" onChange={(e) => setNote(e.target.value)} />
          )}
        </Field>
      </form>
    </Modal>
  );
}

// ---------- Log cooldown ----------

const PRESETS = [1, 2, 3, 4, 7] as const;
type DurationChoice = `${(typeof PRESETS)[number]}` | "custom";

export interface LogInput {
  accountId: string;
  durationMs: number;
  reason: Reason;
  note?: string;
}

export function LogModal({
  views,
  now,
  initialAccountId,
  onClose,
  onSubmit,
  onAddAccount,
}: {
  views: AccountView[];
  now: number;
  initialAccountId?: string;
  onClose: () => void;
  onSubmit: (input: LogInput) => void;
  onAddAccount: () => void;
}) {
  const firstReady = views.find((v) => v.status === "ready") ?? views[0];
  const [accountId, setAccountId] = useState(initialAccountId ?? firstReady?.account.id ?? "");
  const [choice, setChoice] = useState<DurationChoice>("1");
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(0);
  const [reason, setReason] = useState<Reason>(REASONS[0]);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const durationMs =
    choice === "custom" ? days * DAY + hours * HOUR + minutes * MINUTE : Number(choice) * DAY;
  const selected = views.find((v) => v.account.id === accountId);
  const stillCooling = selected?.status !== "ready";
  const error = !submitted
    ? undefined
    : durationMs < MINUTE
      ? "ระยะเวลาต้องอย่างน้อย 1 นาที"
      : undefined;

  if (views.length === 0) {
    return (
      <Modal title="บันทึกคูลดาวน์" onClose={onClose} width="sm">
        <p className="text-ink-2">ยังไม่มีไอดีในรายชื่อ เพิ่มไอดีก่อนแล้วค่อยบันทึกคูลดาวน์</p>
        <Button className="mt-5" full onClick={onAddAccount}>
          เพิ่มไอดี
        </Button>
      </Modal>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (durationMs < MINUTE || stillCooling) return;
    onSubmit({ accountId, durationMs, reason, note: note.trim() || undefined });
  };

  return (
    <Modal
      title="บันทึกคูลดาวน์"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" form="log-form" disabled={stillCooling}>
            เริ่มนับถอยหลัง
          </Button>
        </>
      }
    >
      <form id="log-form" onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <Field
          label="ไอดี"
          error={
            stillCooling && selected?.active
              ? `ไอดีนี้ยังติดคูลดาวน์อีก ${formatCompact(selected.remainingMs)} ยกเลิกคูลดาวน์เดิมก่อนถ้าต้องการบันทึกใหม่`
              : undefined
          }
        >
          {({ id }) => (
            <Select
              id={id}
              size="lg"
              value={accountId}
              onChange={setAccountId}
              options={views.map((v) => ({
                value: v.account.id,
                label: v.account.name,
                dot: STATUS_COLOR[v.status],
                meta: v.status === "ready" ? "พร้อมเล่น" : `อีก ${formatCompact(v.remainingMs)}`,
              }))}
            />
          )}
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">ระยะเวลา</legend>
          <div className="grid grid-cols-3 gap-2">
            {[...PRESETS.map((d) => `${d}` as DurationChoice), "custom" as const].map((c) => {
              const on = c === choice;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setChoice(c)}
                  className={`h-12 rounded-2xl border text-[15px] font-medium transition-colors cursor-pointer focus-ring ${on ? "bg-espresso border-espresso text-on-dark" : "bg-cream border-line-2 text-ink hover:border-ink-2"}`}
                >
                  {c === "custom" ? "กำหนดเอง" : `${c} วัน`}
                </button>
              );
            })}
          </div>
          {choice === "custom" && (
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              <Stepper label="วัน" value={days} max={30} onChange={setDays} />
              <Stepper label="ชั่วโมง" value={hours} max={23} onChange={setHours} />
              <Stepper label="นาที" value={minutes} max={59} onChange={setMinutes} />
            </div>
          )}
          {error && <p className="mt-2 text-[13px] text-berry-ink">{error}</p>}
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">สาเหตุ</legend>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <Chip key={r} selected={r === reason} onClick={() => setReason(r)}>
                {r}
              </Chip>
            ))}
          </div>
        </fieldset>

        <Field label="หมายเหตุ" optional>
          {({ id }) => (
            <TextArea id={id} rows={2} value={note} placeholder="เช่น เน็ตหลุดตอนรอบ 14" onChange={(e) => setNote(e.target.value)} />
          )}
        </Field>

        <div className="flex items-center justify-between gap-3 flex-wrap rounded-2xl bg-blush px-4 py-3.5">
          <span className="text-sm text-warn-body">จะปลดล็อก</span>
          <span className="text-lg font-semibold text-caramel">
            {durationMs >= MINUTE ? `${formatDateTime(now + durationMs)} น.` : "ใส่ระยะเวลาก่อน"}
          </span>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Weekly reset settings ----------

export function ResetModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: ResetSettings;
  onClose: () => void;
  onSubmit: (r: ResetSettings) => void;
}) {
  const [day, setDay] = useState(String(initial.day));
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  return (
    <Modal
      title="ตั้งค่ารอบรีเซ็ตรายสัปดาห์"
      onClose={onClose}
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={() => onSubmit({ day: Number(day), hour, minute })}>บันทึก</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-ink-2">
          ตั้งให้ตรงกับเวลาที่เกมรีเซ็ตดรอปและ XP รายสัปดาห์ ตามเวลาในเครื่องนี้
        </p>
        <Field label="วัน">
          {({ id }) => (
            <Select
              id={id}
              size="lg"
              value={day}
              onChange={setDay}
              options={TH_DAYS_LONG.map((label, i) => ({ value: String(i), label }))}
            />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Stepper label="ชั่วโมง" value={hour} max={23} onChange={setHour} />
          <Stepper label="นาที" value={minute} max={59} onChange={setMinute} />
        </div>
        <p className="text-sm text-ink-2">
          รีเซ็ตทุก{TH_DAYS_LONG[Number(day)]} {pad(hour)}:{pad(minute)} น.
        </p>
      </div>
    </Modal>
  );
}

// ---------- Confirm ----------

export function ConfirmModal({
  title,
  body,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      width="sm"
      role="alertdialog"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} data-autofocus>
            ไม่ใช่ตอนนี้
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[15px] text-ink-2 leading-relaxed">{body}</p>
    </Modal>
  );
}
