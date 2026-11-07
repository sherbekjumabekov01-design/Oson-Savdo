'use client';

import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  PiggyBank,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Package,
  ShoppingBag
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { DashboardSummaryDto, SaleResponseDto, CustomerDebtSummaryDto } from '@/types/api';
import { TabType } from '@/components/Sidebar';

interface Props {
  summary: DashboardSummaryDto | null;
  recentSales: SaleResponseDto[];
  debtors: CustomerDebtSummaryDto[];
  onNavigate: (tab: TabType) => void;
  onViewSale: (sale: SaleResponseDto) => void;
}

export function DashboardView({ summary, recentSales, debtors, onNavigate, onViewSale }: Props) {
  const rev = summary?.todayRevenue || 0;
  const gross = summary?.todayGrossProfit || 0;
  const exp = summary?.todayExpenses || 0;
  const net = summary?.todayNetProfit || 0;
  const debt = summary?.totalSystemDebt || 0;
  const lowStock = summary?.lowStockProductsCount || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Bugungi Tushum"
          value={`${rev.toLocaleString()} so'm`}
          subtitle="Jami sotuv hajmi"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Yalpi Foyda"
          value={`${gross.toLocaleString()} so'm`}
          subtitle="(Sotuv - Tannarx)"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Xarajatlar"
          value={`${exp.toLocaleString()} so'm`}
          subtitle="Operatsion chiqimlar"
          icon={Receipt}
          color="rose"
        />
        <StatCard
          title="Sof Foyda"
          value={`${net.toLocaleString()} so'm`}
          subtitle="Yalpi foyda - Chiqimlar"
          icon={PiggyBank}
          color="purple"
        />
        <StatCard
          title="Nasiyalar (Qarz)"
          value={`${debt.toLocaleString()} so'm`}
          subtitle="Bozorda qolgan pul"
          icon={BookOpen}
          color="amber"
        />
        <StatCard
          title="Kam Qolgan Tovar"
          value={`${lowStock} ta`}
          subtitle="Zudlik bilan to'ldirish kerak"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Grid: Recent Sales & Top Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
                Oxirgi Savdolar Monitoringi
              </h3>
              <p className="text-xs text-slate-400">POS kassadan amalga oshirilgan oxirgi kvitansiyalar</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Barchasini ko&apos;rish <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <th className="pb-2.5 font-medium">Chek ID</th>
                  <th className="pb-2.5 font-medium">Vaqt</th>
                  <th className="pb-2.5 font-medium">Mijoz</th>
                  <th className="pb-2.5 font-medium">To&apos;lov</th>
                  <th className="pb-2.5 font-medium text-right">Summa</th>
                  <th className="pb-2.5 font-medium text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentSales.slice(0, 5).map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-mono font-medium text-slate-700 dark:text-slate-200">
                      #{s.id}
                    </td>
                    <td className="py-2.5 text-slate-400">
                      {new Date(s.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 font-medium text-slate-700 dark:text-slate-300">
                      {s.customerName || 'Oddiy xaridor'}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        s.paymentType === 'Cash'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : s.paymentType === 'Card'
                          ? 'bg-blue-500/10 text-blue-600'
                          : s.paymentType === 'Debt'
                          ? 'bg-rose-500/10 text-rose-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {s.paymentType === 'Cash' ? 'Naqd' : s.paymentType === 'Card' ? 'Karta' : s.paymentType === 'Debt' ? 'Nasiya' : 'Aralash'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-800 dark:text-white">
                      {s.totalAmount.toLocaleString()} so&apos;m
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onViewSale(s)}
                        className="px-2 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-lg transition"
                      >
                        Chek
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Debtors Quick Card (1 col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  Yirik Nasiyadorlar
                </h3>
                <p className="text-xs text-slate-400">Eng ko&apos;p qarzi bor mijozlar</p>
              </div>
              <button
                onClick={() => onNavigate('debts')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                Barchasi <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {debtors.slice(0, 4).map(d => (
                <div
                  key={d.customerId}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-white">{d.customerName}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{d.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      {d.totalDebt.toLocaleString()} so&apos;m
                    </p>
                    <p className="text-[10px] text-slate-400">Qarz</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Jami Nasiyalar soni:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{debtors.length} ta mijoz</span>
          </div>
        </div>
      </div>
    </div>
  );
}
