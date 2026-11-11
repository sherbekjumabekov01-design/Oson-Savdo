'use client';

import React from 'react';
import {
  LayoutDashboard,
  Package,
  BookOpen,
  PieChart,
  ShoppingBag,
  Store,
  Layers,
  Sparkles,
  Truck,
  ScanLine,
  Shield,
  Download,
  Building2,
  ArrowLeft,
  BarChart3,
  ClipboardCheck,
  X
} from 'lucide-react';
import { apiService } from '@/services/api';

export type TabType =
  | 'saas'
  | 'pos'
  | 'dashboard'
  | 'inventory'
  | 'supply'
  | 'debts'
  | 'sales'
  | 'finance'
  | 'analytics'
  | 'audit';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lowStockCount?: number;
  totalDebtorsCount?: number;
  isCashierRole?: boolean;
  isSuperAdmin?: boolean;
  inspectingStoreName?: string | null;
  onExitStoreInspection?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  lowStockCount = 0,
  totalDebtorsCount = 0,
  isCashierRole = false,
  isSuperAdmin = false,
  inspectingStoreName = null,
  onExitStoreInspection,
  isOpen = false,
  onClose
}: SidebarProps) {
  const menuItems = [
    {
      id: 'saas' as TabType,
      label: "SaaS Do'konlar",
      icon: Building2,
      badge: 'Boshqaruv',
      badgeColor: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold',
      superAdminOnly: true
    },
    {
      id: 'pos' as TabType,
      label: 'Kassa & Savdo',
      icon: ScanLine,
      badge: 'Tezkor',
      badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold',
      storeOnly: true
    },
    {
      id: 'dashboard' as TabType,
      label: 'Boshqaruv Paneli',
      icon: LayoutDashboard,
      badge: null,
      adminOnly: true,
      storeOnly: true
    },
    {
      id: 'analytics' as TabType,
      label: 'Analitika & ABC',
      icon: BarChart3,
      badge: 'Yangi',
      badgeColor: 'bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold',
      adminOnly: true,
      storeOnly: true
    },
    {
      id: 'inventory' as TabType,
      label: 'Ombor & Tovarlar',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} kam` : null,
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      storeOnly: true
    },
    {
      id: 'audit' as TabType,
      label: 'Reviziya (Sanoq)',
      icon: ClipboardCheck,
      badge: null,
      adminOnly: true,
      storeOnly: true
    },
    {
      id: 'supply' as TabType,
      label: 'Ta\'minot & Kirim',
      icon: Truck,
      badge: null,
      adminOnly: true,
      storeOnly: true
    },
    {
      id: 'debts' as TabType,
      label: 'Qarz Daftari (Nasiya)',
      icon: BookOpen,
      badge: totalDebtorsCount > 0 ? `${totalDebtorsCount}` : null,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      storeOnly: true
    },
    {
      id: 'sales' as TabType,
      label: 'Sotuvlar Tarixi',
      icon: ShoppingBag,
      badge: null,
      storeOnly: true
    },
    {
      id: 'finance' as TabType,
      label: 'Moliya & Xarajatlar',
      icon: PieChart,
      badge: null,
      adminOnly: true,
      storeOnly: true
    }
  ];

  const visibleItems = menuItems.filter(item => {
    // Agar SuperAdmin bo'lsa va do'kon ko'rish rejimida bo'lmasa, faqat 'saas' ko'rinadi (yoki barchasi)
    if (isSuperAdmin && !inspectingStoreName && item.id !== 'saas') {
      return false;
    }
    // Agar SuperAdmin bo'lmasa, 'saas' yashiriladi
    if (!isSuperAdmin && item.superAdminOnly) {
      return false;
    }
    // Agar kassir bo'lsa, adminOnly yashiriladi
    if (isCashierRole && item.adminOnly) {
      return false;
    }
    return true;
  });

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Brand */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white flex items-center gap-1.5">
                Oson Savdo
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                  POS
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Do&apos;kon boshqaruv tizimi</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 -mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Do'konni ko'rish (Inspection) Rejimi Banneri */}
        {isSuperAdmin && inspectingStoreName && (
          <div className="m-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Monitoring Rejimi
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
              📍 {inspectingStoreName}
            </p>
            {onExitStoreInspection && (
              <button
                onClick={() => {
                  onExitStoreInspection();
                  if (onClose) onClose();
                }}
                className="w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>SaaS Markaziga Qaytish</span>
              </button>
            )}
          </div>
        )}

        {/* Navigation list */}
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {isSuperAdmin && !inspectingStoreName ? "SaaS Bo'limlari" : "Asosiy Bo'limlar"}
          </p>

          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info & Database Backup */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <a
          href={apiService.getBackupDownloadUrl()}
          download
          className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-2 transition"
          title="Baza zaxira nusxasini (.db) yuklab olish"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Baza Zaxira Nusxasi (Backup)</span>
        </a>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-[11px]">
            <p className="font-bold text-slate-800 dark:text-white">API Server</p>
            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              .NET 8 Web API
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md and up) */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col justify-between h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (opens on mobile when isOpen is true) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onClose}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
