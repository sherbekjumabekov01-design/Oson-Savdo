'use client';

import React from 'react';
import { AlertTriangle, Lock, Phone, MessageCircle, LogOut } from 'lucide-react';

interface Props {
  isOpen: boolean;
  storeName?: string;
  expiredAt?: string | null;
  monthlyFee?: number;
  onLogout: () => void;
}

export function SubscriptionExpiredModal({
  isOpen,
  storeName = "Do'kon",
  expiredAt,
  monthlyFee = 150000,
  onLogout
}: Props) {
  if (!isOpen) return null;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 text-center border-2 border-rose-500/30 shadow-2xl shadow-rose-500/10 space-y-5">
        {/* Pulsing Lock Icon */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-rose-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Lock className="w-8 h-8" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-1.5">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-500/10 text-rose-600 border border-rose-500/20">
            Avtomatik Bloklanish (SIM-karta modeli)
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            1 Oylik Obuna Muddati Tugadi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <b>&quot;{storeName}&quot;</b> do&apos;koni uchun oylik xizmat ko&apos;rsatish muddati {formatDate(expiredAt)} sanasida yakunlandi va tizim avtomatik to&apos;xtatildi.
          </p>
        </div>

        {/* Pricing / Payment Info */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Oylik obuna to&apos;lovi:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{formatMoney(monthlyFee)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Xizmat muddati:</span>
            <span className="font-semibold text-rose-500">Tugagan (To&apos;xtatilgan)</span>
          </div>
        </div>

        {/* Contact info to renew */}
        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200 text-left space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300">
            <Phone className="w-3.5 h-3.5 text-indigo-600" />
            Xizmatni qayta yoqish uchun:
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            To&apos;lovni amalga oshirib, platforma administratori bilan bog&apos;laning. To&apos;lov tasdiqlangach, tizim avtomatik ravishda ochiladi va yana 1 oy davomida faol bo&apos;ladi.
          </p>
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Tizimdan Chiqish</span>
        </button>
      </div>
    </div>
  );
}
