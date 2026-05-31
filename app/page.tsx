"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Clock,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Search,
  Hourglass,
  Gamepad2,
  X,
  User,
  ChevronDown,
  UserPlus,
  Layers,
  Info,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface CS2AccountTracker {
  id: string;
  accountName: string;
  category: string;
  createdAt: number;
  targetAt: number;
  totalDuration: number;
  notes?: string;
}

interface SavedProfile {
  id: string;
  name: string;
}

const COOLDOWN_OPTIONS = [
  {
    label: "Competitive Cooldown (แบนแข่งสั้น 2 ชม.)",
    days: 0,
    hours: 2,
    minutes: 0,
  },
  {
    label: "Competitive Cooldown (แบนแข่ง 24 ชม.)",
    days: 1,
    hours: 0,
    minutes: 0,
  },
  {
    label: "7-Day Competitive Ban (แบนหนักสุด 7 วัน)",
    days: 7,
    hours: 0,
    minutes: 0,
  },
  { label: "Trade Hold (งดแลกเปลี่ยน 7 วัน)", days: 7, hours: 0, minutes: 0 },
  {
    label: "Weekly Case Reset (เวลารีเซ็ตดรอบเคส 7 วัน)",
    days: 7,
    hours: 0,
    minutes: 0,
  },
  { label: "Custom Cooldown (กำหนดเวลาเอง)", days: 0, hours: 0, minutes: 0 },
];

export default function App() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<CS2AccountTracker[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // ฟอร์มกรอกข้อมูลหลัก
  const [accountName, setAccountName] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState(COOLDOWN_OPTIONS[0]);
  const [durationDays, setDurationDays] = useState<number>(0);
  const [durationHours, setDurationHours] = useState<number>(2);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  // สำหรับการเพิ่มรายชื่อผู้ใช้งานด่วน
  const [newProfileName, setNewProfileName] = useState<string>("");

  // จัดการสถานะ Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isFilterDropdownOpen, setIsFilterDropdownOpen] =
    useState<boolean>(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // ตัวเลือกค้นหาและกรองสถานะ
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("All"); // All, Cooldown, Ready

  // ควบคุมโมดอลยืนยันความปลอดภัยเพื่อกันการมือลั่น
  const [accountToDelete, setAccountToDelete] =
    useState<CS2AccountTracker | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<SavedProfile | null>(
    null,
  );

  const [toasts, setToasts] = useState<
    { id: string; message: string; type: "success" | "info" | "warning" }[]
  >([]);

  const isLoadedRef = useRef<boolean>(false);

  // โหลดข้อมูลจาก LocalStorage หลัง mount เพื่อป้องกัน Hydration error
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAccs = localStorage.getItem("cs2_accounts_data_v2");
      if (savedAccs) {
        try {
          setAccounts(JSON.parse(savedAccs));
        } catch (e) {
          console.error(e);
        }
      }

      const savedProfs = localStorage.getItem("cs2_saved_profiles_v2");
      if (savedProfs) {
        try {
          setSavedProfiles(JSON.parse(savedProfs));
        } catch (e) {
          console.error(e);
        }
      }
    }

    setIsMounted(true);
    setCurrentTime(Date.now());
    isLoadedRef.current = true;

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // บันทึกข้อมูลเมื่อมีการเปลี่ยนแปลง และต้องโหลดเสร็จเรียบร้อยแล้วเท่านั้น
  useEffect(() => {
    if (isMounted && isLoadedRef.current) {
      localStorage.setItem("cs2_accounts_data_v2", JSON.stringify(accounts));
    }
  }, [accounts, isMounted]);

  useEffect(() => {
    if (isMounted && isLoadedRef.current) {
      localStorage.setItem(
        "cs2_saved_profiles_v2",
        JSON.stringify(savedProfiles),
      );
    }
  }, [savedProfiles, isMounted]);

  // ตรวจจับการคลิกภายนอก Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (
    message: string,
    type: "success" | "info" | "warning" = "info",
  ) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const handleSelectCategory = (option: (typeof COOLDOWN_OPTIONS)[0]) => {
    setSelectedCategory(option);
    setDurationDays(option.days);
    setDurationHours(option.hours);
    setDurationMinutes(option.minutes);
    setIsDropdownOpen(false);
  };

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProfileName.trim();
    if (!name) {
      showToast("กรุณากรอกชื่อโปรไฟล์ที่ต้องการบันทึก", "warning");
      return;
    }
    if (
      savedProfiles.some((p) => p.name.toLowerCase() === name.toLowerCase())
    ) {
      showToast("มีชื่อบัญชีนี้ในระบบรายชื่อแล้ว", "warning");
      return;
    }
    const newProfile: SavedProfile = {
      id: "profile-" + Date.now(),
      name,
    };
    setSavedProfiles((prev) => [...prev, newProfile]);
    setNewProfileName("");
    showToast(`บันทึกไอดี "${name}" ลงในบัญชีของฉันเรียบร้อย`, "success");
  };

  const handleConfirmDeleteProfile = () => {
    if (profileToDelete) {
      setSavedProfiles((prev) =>
        prev.filter((p) => p.id !== profileToDelete.id),
      );
      showToast(`ลบชื่อบัญชี "${profileToDelete.name}" ออกแล้ว`, "info");
      setProfileToDelete(null);
    }
  };

  const processedAccounts = useMemo(() => {
    if (!isMounted) return [];
    return accounts.map((acc) => {
      const remainingMs = acc.targetAt - currentTime;
      const isReady = remainingMs <= 0;
      return {
        ...acc,
        remainingMs,
        isReady,
        status: isReady ? "ready" : "cooldown",
      };
    });
  }, [accounts, currentTime, isMounted]);

  const stats = useMemo(() => {
    // 1. รายการในคิวทั้งหมด (จาก processedAccounts)
    const queueTotal = processedAccounts.length;

    // 2. อยู่ระหว่างคูลดาวน์ (รายการที่คูลดาวน์ยังไม่สิ้นสุด)
    const cooldownCount = processedAccounts.filter((a) => !a.isReady).length;

    // 3. สามารถเล่นได้ (คูลดาวน์หมดแล้ว หรือไม่ได้อยู่ในคิวคูลดาวน์เลย)
    const uniqueNames = new Set<string>();
    savedProfiles.forEach((p) => uniqueNames.add(p.name.toLowerCase().trim()));
    accounts.forEach((a) =>
      uniqueNames.add(a.accountName.toLowerCase().trim()),
    );

    const activeCooldownNames = new Set(
      processedAccounts
        .filter((a) => !a.isReady)
        .map((a) => a.accountName.toLowerCase().trim()),
    );

    let playableCount = 0;
    uniqueNames.forEach((name) => {
      if (!activeCooldownNames.has(name)) {
        playableCount++;
      }
    });

    return {
      queueTotal,
      cooldownCount,
      playableCount,
    };
  }, [savedProfiles, accounts, processedAccounts]);

  const filteredAccounts = useMemo(() => {
    return processedAccounts.filter((acc) => {
      const matchesSearch =
        acc.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (acc.notes &&
          acc.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        acc.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "All" ||
        (filterStatus === "Cooldown" && !acc.isReady) ||
        (filterStatus === "Ready" && acc.isReady);

      return matchesSearch && matchesStatus;
    });
  }, [processedAccounts, searchQuery, filterStatus]);

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "พร้อมเข้าเล่นแล้ว (READY)";

    const totalSecs = Math.floor(ms / 1000);
    const days = Math.floor(totalSecs / (3600 * 24));
    const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}วัน`);
    if (hours > 0 || days > 0) parts.push(`${hours}ชม.`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}น.`);
    parts.push(`${seconds}วิ`);

    return parts.join(" ");
  };

  const formatEndDatePrediction = (timestamp: number) => {
    const dateObj = new Date(timestamp);
    return (
      new Intl.DateTimeFormat("th-TH", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(dateObj) + " น."
    );
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountName.trim()) {
      showToast(
        'กรุณากรอกชื่อ Steam Account หรือเลือกจาก "บัญชีของฉัน"',
        "warning",
      );
      return;
    }

    const isDuplicate = accounts.some(
      (acc) =>
        acc.accountName.toLowerCase().trim() ===
        accountName.toLowerCase().trim(),
    );

    if (isDuplicate) {
      showToast(
        `บัญชี "${accountName.trim()}" มีอยู่ในรายการคูลดาวน์แล้ว`,
        "warning",
      );
      return;
    }

    const daysMs = durationDays * 24 * 60 * 60 * 1000;
    const hoursMs = durationHours * 60 * 60 * 1000;
    const minutesMs = durationMinutes * 60 * 1000;
    const totalDuration = daysMs + hoursMs + minutesMs;

    if (totalDuration <= 0) {
      showToast("กรุณากำหนดระยะเวลาคูลดาวน์ให้มากกว่า 1 นาที", "warning");
      return;
    }

    const now = Date.now();
    const targetAt = now + totalDuration;

    const newAccount: CS2AccountTracker = {
      id: "cs2-" + Math.random().toString(36).substring(2, 9),
      accountName: accountName.trim(),
      category: selectedCategory.label,
      createdAt: now,
      targetAt,
      totalDuration,
      notes: notes.trim() || undefined,
    };

    setAccounts((prev) => [newAccount, ...prev]);
    showToast(
      `บันทึกการนับถอยหลังไอดี "${newAccount.accountName}" สำเร็จแล้ว`,
      "success",
    );

    setAccountName("");
    setNotes("");
  };

  const confirmDeleteAccount = () => {
    if (accountToDelete) {
      setAccounts((prev) =>
        prev.filter((acc) => acc.id !== accountToDelete.id),
      );
      showToast(
        `ลบข้อมูลประวัติไอดี "${accountToDelete.accountName}" สำเร็จ`,
        "success",
      );
      setAccountToDelete(null);
    }
  };

  const filterLabels: Record<string, string> = {
    All: "ทั้งหมด",
    Cooldown: "กำลังคูลดาวน์",
    Ready: "พร้อมลงแข่ง",
  };

  // แผงเรนเดอร์ Skeletal Loader ในช่วงที่กำลังติดตั้งคอมโพเนนต์บน Client เพื่อตัดปัญหา Hydration mismatch 100%
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased flex flex-col justify-center items-center relative overflow-hidden">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
            <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-amber-600 shadow-md">
              <Gamepad2 className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-md font-bold tracking-widest text-slate-900 uppercase">
              CS2 Cooldown Tracker
            </h2>
            <p className="text-[10px] text-amber-600 font-mono mt-1 tracking-wider uppercase animate-pulse">
              CONNECTING TO HUD SYSTEMS...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-850 font-sans antialiased text-sm flex flex-col justify-between relative overflow-hidden dot-grid">
      {/* Background blobs for SaaS premium lighting */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/[0.04] blur-[120px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/[0.04] blur-[120px] animate-pulse duration-[10000ms]" />
      </div>

      <div className="relative z-10 w-full">
        {/* Header */}
        <header className="bg-white/70 backdrop-blur-md border-b border-slate-200/50 py-4 px-6 sticky top-0 z-20 shadow-[0_2px_15px_rgba(0,0,0,0.01)]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600 border border-amber-500/20 shadow-[0_4px_12px_rgba(245,158,11,0.05)]">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-950 tracking-wide flex items-center gap-2 uppercase">
                  CS2 Cooldown Tracker
                </h1>
                <p className="text-[11px] text-slate-500">
                  ระบบจัดการและบันทึกประวัติการติดคูลดาวน์ Steam Account
                  สำหรับแมทช์การเล่น CS2
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/80 border border-slate-200/60 rounded-xl px-3.5 py-2 shadow-sm backdrop-blur-sm">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-mono font-bold text-slate-700 tracking-wider">
                {new Intl.DateTimeFormat("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }).format(currentTime)}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Container */}
        <main className="max-w-6xl mx-auto px-4 mt-8">
          {/* Dashboard Statistics */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {/* รายการในคิวทั้งหมด */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:border-slate-300 hover:translate-y-[-2px] duration-300">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-slate-50 rounded-xl text-slate-600 border border-slate-200/40">
                  <Layers className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                    รายการในคิวทั้งหมด
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 mt-0.5 block leading-tight">
                    {stats.queueTotal}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      บัญชี
                    </span>
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded font-mono">
                QUEUE
              </span>
            </div>

            {/* อยู่ระหว่างคูลดาวน์ */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:border-amber-300 hover:translate-y-[-2px] duration-300">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20 shadow-[0_4px_12px_rgba(245,158,11,0.04)]">
                  <Hourglass className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-700 block uppercase tracking-wider">
                    อยู่ระหว่างคูลดาวน์
                  </span>
                  <span className="text-lg font-extrabold text-amber-600 mt-0.5 block leading-tight">
                    {stats.cooldownCount}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      บัญชี
                    </span>
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-amber-750 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono">
                COOLDOWN
              </span>
            </div>

            {/* สามารถลงเล่นได้ */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:border-emerald-300 hover:translate-y-[-2px] duration-300">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-500/20 shadow-[0_4px_12px_rgba(16,185,129,0.04)]">
                  <CheckCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700/80 block uppercase tracking-wider">
                    สามารถลงเล่นได้
                  </span>
                  <span className="text-lg font-extrabold text-emerald-600 mt-0.5 block leading-tight">
                    {stats.playableCount}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      บัญชี
                    </span>
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-emerald-750 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                PLAYABLE
              </span>
            </div>
          </section>

          {/* Layout Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: My Accounts & Registration Form */}
            <section className="lg:col-span-5 space-y-6">
              {/* Box 1: My Accounts */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <h3 className="text-[11px] font-bold text-slate-700 mb-4.5 flex items-center gap-2 uppercase tracking-widest border-b border-slate-100 pb-2.5">
                  <User className="w-4 h-4 text-amber-600" /> บัญชีของฉัน (My
                  Accounts)
                </h3>

                <form onSubmit={handleAddProfile} className="mb-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="เพิ่มชื่อไอดีไว้เซฟด่วน เช่น Main, Smurf_02"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200/80 rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium"
                  />
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-300 border border-amber-700/10 shadow-sm cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> บันทึก
                  </button>
                </form>

                {savedProfiles.length === 0 ? (
                  <div className="text-center py-5 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <HelpCircle className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-[11px] text-slate-450 italic">
                      พิมพ์ชื่อด้านบนและกดบันทึก
                      เพื่อเก็บรายชื่อบัญชีเรียกใช้ด่วน
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                    {savedProfiles.map((p) => {
                      const isSelected = accountName === p.name;
                      return (
                        <div
                          key={p.id}
                          className={`inline-flex items-center gap-2 rounded-lg pl-3 pr-1.5 py-1 text-xs transition-all border cursor-pointer select-none duration-250
                            ${
                              isSelected
                                ? "bg-amber-600 border-amber-700 text-white font-bold shadow-sm"
                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                            }
                          `}
                          onClick={() => setAccountName(p.name)}
                        >
                          <span className="truncate max-w-[120px] font-medium">
                            {p.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileToDelete(p);
                            }}
                            className="p-1 rounded-md hover:bg-rose-100 hover:text-rose-600 text-slate-400 transition-colors ml-0.5 cursor-pointer"
                            title={`ลบชื่อไอดี ${p.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {savedProfiles.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1.5 italic font-medium">
                    <Sparkles className="w-3 text-amber-500" />*
                    คลิกที่ชื่อบัญชีด้านบนเพื่อกรอกชื่อลงฟอร์มด้านล่างทันที
                  </p>
                )}
              </div>

              {/* Box 2: Cooldown Registration Form */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <h2 className="text-[11px] font-bold text-slate-700 mb-4.5 flex items-center gap-2 uppercase tracking-widest border-b border-slate-100 pb-2.5">
                  <Plus className="w-4 h-4 text-amber-500" />{" "}
                  บันทึกประวัติคูลดาวน์ใหม่
                </h2>

                <form onSubmit={handleAddAccount} className="space-y-4.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      ชื่อ Steam Account / บัญชีผู้เล่น{" "}
                      <span className="text-amber-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="กรอกชื่อไอดี หรือคลิกเลือกจากบัญชีด่วนด้านบน"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium"
                    />
                  </div>

                  {/* Custom dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      ประเภทการติดคูลดาวน์
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-4 py-2.5 text-xs text-slate-800 flex justify-between items-center focus:outline-none focus:border-amber-500 transition-all font-medium cursor-pointer"
                    >
                      <span className="truncate">{selectedCategory.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-250 ${isDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-1.5 duration-200">
                        {COOLDOWN_OPTIONS.map((opt, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSelectCategory(opt)}
                            className={`w-full text-left px-4 py-2.5 text-xs hover:bg-[#fafafa] transition-colors block cursor-pointer
                              ${selectedCategory.label === opt.label ? "bg-amber-50 font-bold text-amber-700" : "text-slate-600"}
                            `}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ระยะเวลานับถอยหลัง */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      ระยะเวลาคูลดาวน์ (ปรับแต่งได้ตามจริง)
                    </label>
                    <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-[9px] text-slate-400 block mb-1 text-center font-bold uppercase tracking-wider">
                          วัน
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={durationDays}
                          onChange={(e) =>
                            setDurationDays(
                              Math.max(0, parseInt(e.target.value) || 0),
                            )
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-1 text-center font-mono text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block mb-1 text-center font-bold uppercase tracking-wider">
                          ชั่วโมง
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={durationHours}
                          onChange={(e) =>
                            setDurationHours(
                              Math.max(
                                0,
                                Math.min(23, parseInt(e.target.value) || 0),
                              ),
                            )
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-1 text-center font-mono text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block mb-1 text-center font-bold uppercase tracking-wider">
                          นาที
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={durationMinutes}
                          onChange={(e) =>
                            setDurationMinutes(
                              Math.max(
                                0,
                                Math.min(59, parseInt(e.target.value) || 0),
                              ),
                            )
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-1 text-center font-mono text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* หมายเหตุ */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                      หมายเหตุ / สาเหตุการติดคูลดาวน์
                    </label>
                    <textarea
                      placeholder="ระบุหมายเหตุย่อ เช่น หลุดระหว่างโหลดแมทช์, ปากดีโดนใบเหลือง"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-xs flex items-center justify-center gap-2 border border-amber-500/20 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> เริ่มบันทึกนับเวลาถอยหลัง
                  </button>
                </form>
              </div>
            </section>

            {/* Right Column: Active Cooldown Timers List */}
            <section className="lg:col-span-7 space-y-5">
              {/* Filter and Search Panel */}
              <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl p-4.5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาตามไอดี หรือประเภทคูลดาวน์..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium"
                  />
                </div>

                {/* Filter Status */}
                <div
                  className="flex items-center gap-3 w-full sm:w-auto relative"
                  ref={filterDropdownRef}
                >
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">
                    สถานะ:
                  </span>

                  <div className="relative w-full sm:w-40">
                    <button
                      type="button"
                      onClick={() =>
                        setIsFilterDropdownOpen(!isFilterDropdownOpen)
                      }
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-4 py-2 text-xs text-slate-700 flex justify-between items-center focus:outline-none focus:border-amber-500 transition-all font-medium cursor-pointer"
                    >
                      <span>{filterLabels[filterStatus]}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-250 ${isFilterDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isFilterDropdownOpen && (
                      <div className="absolute right-0 left-0 sm:left-auto sm:w-40 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-1.5 duration-200">
                        {["All", "Cooldown", "Ready"].map((statusKey) => (
                          <button
                            key={statusKey}
                            type="button"
                            onClick={() => {
                              setFilterStatus(statusKey);
                              setIsFilterDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 transition-colors block cursor-pointer
                              ${filterStatus === statusKey ? "bg-amber-50 font-bold text-amber-700" : "text-slate-600"}
                            `}
                          >
                            {filterLabels[statusKey]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Display Active Cooldown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredAccounts.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl p-16 text-center text-slate-400 col-span-2 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                    <Hourglass className="w-10 h-10 text-slate-350 mx-auto mb-3 animate-pulse" />
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                      ไม่พบข้อมูลประวัติคูลดาวน์
                    </p>
                    <p className="text-[11px] text-slate-450 mt-1.5 max-w-xs mx-auto leading-relaxed">
                      กรุณากรอกชื่อและกติกาคูลดาวน์ด้านซ้ายมือ
                      เพื่อบันทึกและเปิดระบบจำลองตัวคูลดาวน์ของตัวละคร
                    </p>
                  </div>
                ) : (
                  filteredAccounts.map((acc) => {
                    const elapsed = currentTime - acc.createdAt;
                    const progress = Math.min(
                      100,
                      Math.max(0, (elapsed / acc.totalDuration) * 100),
                    );
                    const percentLeft = 100 - progress;

                    // แยกสีตามความสาหัสของการแบนเพื่อความสวยงามพรีเมียม
                    const isHighBan =
                      acc.category.toLowerCase().includes("7-day") ||
                      acc.category.toLowerCase().includes("7 วัน");
                    const borderClass = acc.isReady
                      ? "border-emerald-200 hover:border-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.03)]"
                      : isHighBan
                        ? "border-rose-200 hover:border-rose-400 shadow-[0_4px_20px_rgba(239,68,68,0.03)]"
                        : "border-amber-200 hover:border-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.03)]";

                    const barColorClass = acc.isReady
                      ? "bg-emerald-500"
                      : isHighBan
                        ? "bg-rose-500"
                        : "bg-amber-500";

                    const textBadgeColor = acc.isReady
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                      : isHighBan
                        ? "bg-rose-50 text-rose-700 border-rose-200/50"
                        : "bg-amber-50 text-amber-700 border-amber-200/50";

                    return (
                      <div
                        key={acc.id}
                        className={`bg-white/90 backdrop-blur-sm border rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between hover:shadow-[0_12px_30px_rgb(0,0,0,0.05)] hover:translate-y-[-2px] ${borderClass}`}
                      >
                        {/* Pulse Status Indicator line */}
                        <div
                          className={`absolute top-0 left-0 right-0 h-1.5 
                            ${acc.isReady ? "bg-emerald-500 animate-pulse" : isHighBan ? "bg-rose-500" : "bg-amber-500"}`}
                        />

                        <div>
                          <div className="flex justify-between items-start gap-3 mb-3">
                            <div className="min-w-0">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md inline-block truncate max-w-full uppercase tracking-wider border ${textBadgeColor}`}
                              >
                                {acc.category}
                              </span>
                              <h3 className="text-xs font-bold text-slate-800 mt-1.5 truncate tracking-wide uppercase">
                                {acc.accountName}
                              </h3>
                            </div>

                            <button
                              onClick={() => setAccountToDelete(acc)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-all duration-200 flex-shrink-0 border border-transparent hover:border-rose-100 cursor-pointer"
                              title="ลบข้อมูลบัญชีนี้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Remaining Time Box */}
                          <div
                            className={`rounded-xl p-3 mb-3.5 flex items-center justify-between text-xs border duration-300
                              ${
                                acc.isReady
                                  ? "bg-emerald-50/60 border-emerald-100/80 text-emerald-700 shadow-inner"
                                  : isHighBan
                                    ? "bg-rose-50/60 border-rose-100/80 text-rose-700 shadow-inner"
                                    : "bg-amber-50/60 border-amber-100/80 text-amber-700 shadow-inner"
                              }
                            `}
                          >
                            <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                              <Hourglass
                                className={`w-3.5 h-3.5 ${acc.isReady ? "text-emerald-500" : isHighBan ? "text-rose-500" : "text-amber-500"}`}
                              />
                              เวลาคงเหลือ:
                            </span>
                            <span className="font-mono text-xs font-black tracking-wide">
                              {formatCountdown(acc.remainingMs)}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          {!acc.isReady && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden border border-slate-200/40">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${barColorClass}`}
                                style={{ width: `${percentLeft}%` }}
                              />
                            </div>
                          )}

                          {acc.notes && (
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic mb-4 line-clamp-2 leading-relaxed flex items-start gap-1.5">
                              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                              <span>{acc.notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Prediction Target Time Footer */}
                        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            พ้นโทษแบน:
                          </span>
                          <span className="font-bold text-slate-700">
                            {formatEndDatePrediction(acc.targetAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Simple Centered Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200/60 py-8 text-center text-slate-500 text-xs mt-16 relative z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.015)]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-medium tracking-wide">
          <p>&copy; {new Date().getFullYear()} CS2 Cooldown Tracker</p>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100/60 px-2.5 py-0.5 rounded-full text-emerald-700 text-[10px] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>SYSTEM OPERATIONAL</span>
          </div>
        </div>
      </footer>

      {/* โมดอลยืนยันการลบประวัติคูลดาวน์ */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
                ยืนยันการลบประวัติคูลดาวน์?
              </h3>
              <p className="text-xs text-slate-500 mb-5 px-2 leading-relaxed">
                ต้องการลบข้อมูลเวลาและการนับถอยหลังของไอดี{" "}
                <strong className="text-slate-900">
                  "{accountToDelete.accountName}"
                </strong>{" "}
                ออกจากแผงควบคุมใช่หรือไม่?
              </p>

              <div className="flex gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAccountToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg transition-all duration-200 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAccount}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-lg transition-all duration-200 shadow-md shadow-rose-600/10 border border-rose-700/15 cursor-pointer"
                >
                  ยืนยัน, ลบข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* โมดอลยืนยันการลบบัญชีที่เซฟไว้ (My Accounts) */}
      {profileToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
                ต้องการลบชื่อบัญชีที่บันทึกไว้?
              </h3>
              <p className="text-xs text-slate-500 mb-5 px-2 leading-relaxed">
                คุณกำลังจะลบชื่อบัญชีผู้เล่น{" "}
                <strong className="text-slate-900">
                  "{profileToDelete.name}"
                </strong>{" "}
                ออกจากรายการเรียกใช้ด่วน
              </p>

              <div className="flex gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setProfileToDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg transition-all duration-200 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteProfile}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-lg transition-all duration-200 shadow-md shadow-amber-600/10 border border-amber-700/15 cursor-pointer"
                >
                  ยืนยันการลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-xs w-full px-4 sm:px-0">
        {toasts.map((toast) => {
          const toastStyles =
            toast.type === "success"
              ? "border-emerald-200 text-emerald-800 bg-emerald-50/95 shadow-md"
              : toast.type === "warning"
                ? "border-amber-200 text-amber-800 bg-amber-50/95 shadow-md"
                : "border-slate-200 text-slate-700 bg-white/95 shadow-md";

          return (
            <div
              key={toast.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all duration-300 backdrop-blur-md animate-in slide-in-from-bottom-3 duration-250 ${toastStyles}`}
            >
              <span className="flex items-center gap-2.5">
                {toast.type === "success" && (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
                {toast.type === "warning" && (
                  <AlertTriangle className="w-4 h-4 text-amber-550 flex-shrink-0" />
                )}
                {toast.type === "info" && (
                  <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
                <span className="tracking-wide">{toast.message}</span>
              </span>
              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="text-slate-400 hover:text-slate-600 ml-3 transition-colors duration-150 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
