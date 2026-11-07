'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  RefreshCw,
  Calendar,
  Clock,
  Store,
  Wifi,
  WifiOff,
  User,
  Shield,
  Layers,
  Sparkles,
  Settings
} from 'lucide-react';
import { CurrentShiftSummaryDto, LoginResponseDto } from '@/types/api';

interface NavbarProps {
  title: string;
  description: string;
  onRefresh: () => void;
  loading?: boolean;
  isOnline: boolean;
  pendingSalesCount: number;
  onSyncPendingSales: () => void;
  shiftSummary: CurrentShiftSummaryDto | null;
  onOpenShiftModal: () => void;
  currentUser: LoginResponseDto | null;
  onOpenLoginModal: () => void;
  onOpenStoreSettings?: () => void;
}

export function Navbar({
  title,
  description,
  onRefresh,
  loading,
  isOnline,
  pendingSalesCount,
  onSyncPendingSales,
  shiftSummary,
  onOpenShiftModal,
  currentUser,
  onOpenLoginModal,
  onOpenStoreSettings
}: NavbarProps) {
  const [time, setTime] = useState<string>('');
  const [todayStr, setTodayStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTodayStr(
        now.toLocaleDateString('uz-UZ', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isShiftOpen = shiftSummary?.isOpen;

  return (
    <header className="h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">{title}</h2>
        <p className="text-xs text-slate-400">{description}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Offline / Online Indicator */}
        <div
          title={isOnline ? 'Server bilan aloqa faol' : 'Server aloqasi uzilgan (Lokal rejim)'}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Pending Offline Sales Sync button */}
        {pendingSalesCount > 0 && (
          <button
            onClick={onSyncPendingSales}
            title="Navbatdagi offline savdolarni serverga yuborish"
            className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 flex items-center gap-1.5 animate-bounce transition"
          >
            <span>{pendingSalesCount} ta sinxronizatsiyada</span>
          </button>
        )}

        {/* Kassa Smena Statusi Tugmasi */}
        <button
          onClick={onOpenShiftModal}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
            isShiftOpen
              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>
            {isShiftOpen
              ? `Smena: Ochiq (${shiftSummary?.currentCalculatedCash.toLocaleString()} so'm)`
              : 'Smena: Yopiq (Ochish)'}
          </span>
        </button>

        {/* Date & Time pill */}
        <div className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300">
          <span>{todayStr}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">{time}</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Ma'lumotlarni yangilash"
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
        </button>

        {/* Store Settings button */}
        {onOpenStoreSettings && (
          <button
            onClick={onOpenStoreSettings}
            title="Do'kon sozlamalari (Telegram Bot, Keshbek & Tarozi)"
            className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* User / Role Profile Button */}
        <button
          onClick={onOpenLoginModal}
          className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800 text-left hover:opacity-85 transition"
        >
          <div className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-sm ${
            currentUser?.role === 'SuperAdmin'
              ? 'bg-gradient-to-tr from-indigo-600 to-violet-600'
              : 'bg-emerald-600'
          }`}>
            {currentUser?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="font-bold text-xs text-slate-800 dark:text-white truncate max-w-[140px]">
              {currentUser?.fullName || "Foydalanuvchi"}
            </p>
            <p className={`text-[10px] font-bold ${
              currentUser?.role === 'SuperAdmin'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {currentUser?.role === 'SuperAdmin'
                ? '👑 Platforma Egasi'
                : currentUser?.storeName
                ? `📍 ${currentUser.storeName}`
                : currentUser?.role === 'Admin'
                ? "Do'kon Admini"
                : "Kassir"}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
