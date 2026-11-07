'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  PiggyBank,
  Plus,
  Trash2,
  Tag,
  Calendar,
  Layers,
  Banknote,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { ExpenseResponseDto, DailyReportDto, type PaymentType } from '@/types/api';
import { StatCard } from '@/components/StatCard';

interface Props {
  expenses: ExpenseResponseDto[];
  dailyReport: DailyReportDto | null;
  loading: boolean;
  onOpenAddExpenseModal: () => void;
  onDeleteExpense: (id: number) => Promise<void>;
}

export function FinanceView({
  expenses,
  dailyReport,
  loading,
  onOpenAddExpenseModal,
  onDeleteExpense
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');

  const categories = ['Barchasi', 'Ijara', 'Ish haqi', 'Kommunal', 'Soliq', 'Ta\'mirlash', 'Boshqa'];

  const filteredExpenses = expenses.filter(e => {
    if (selectedCategory === 'Barchasi') return true;
    return e.category === selectedCategory;
  });

  const totalFilteredExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const rev = dailyReport?.totalRevenue || 0;
  const cost = dailyReport?.totalCost || 0;
  const gross = dailyReport?.grossProfit || 0;
  const exp = dailyReport?.totalExpenses || 0;
  const net = dailyReport?.netProfit || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Financial P&L KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Jami Tushum (Oborot)"
          value={`${rev.toLocaleString()} so'm`}
          subtitle="Kunlik jami sotuvlar"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Tannarx Chiqimi"
          value={`${cost.toLocaleString()} so'm`}
          subtitle="Sotilgan tovarlar tannarxi"
          icon={Layers}
          color="blue"
        />
        <StatCard
          title="Yalpi Foyda (Gross)"
          value={`${gross.toLocaleString()} so'm`}
          subtitle="Tushum - Tannarx"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Do'kon Chiqimlari"
          value={`${exp.toLocaleString()} so'm`}
          subtitle="Jami operatsion xarajatlar"
          icon={Receipt}
          color="rose"
        />
        <StatCard
          title="Sof Foyda (Net Profit)"
          value={`${net.toLocaleString()} so'm`}
          subtitle="Yalpi foyda - Xarajatlar"
          icon={PiggyBank}
          color={net >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Expenses Management Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-500" />
              Do&apos;kon Xarajatlari va Chiqimlar Ro&apos;yxati
            </h3>
            <p className="text-xs text-slate-400">Ijara, xodimlar maoshi, kommunal va mayda chiqimlar</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">
              Jami sarflangan:{' '}
              <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">
                {totalFilteredExpenses.toLocaleString()} so&apos;m
              </span>
            </span>

            <button
              onClick={onOpenAddExpenseModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs shadow-rose-600/20 flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi Xarajat</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="py-3 px-4 font-semibold">Xarajat Nomi</th>
                <th className="py-3 px-4 font-semibold">Kategoriya</th>
                <th className="py-3 px-4 font-semibold">To&apos;lov Turi</th>
                <th className="py-3 px-4 font-semibold text-right">Summa</th>
                <th className="py-3 px-4 font-semibold text-center">Mas&apos;ul / Sana</th>
                <th className="py-3 px-4 font-semibold text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Xarajatlar yuklanmoqda...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Ushbu kategoriyada xarajatlar yo&apos;q.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-white">
                      {e.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {e.paymentType === 'Card' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                          <CreditCard className="w-3 h-3" />
                          Bank / Karta
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                          <Banknote className="w-3 h-3" />
                          Kassadan Naqd
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400 font-mono text-sm">
                      {e.amount.toLocaleString()} so&apos;m
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400 text-[11px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          {e.createdByName || 'Admin'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(e.createdAt).toLocaleDateString('uz-UZ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`'${e.title}' xarajatini o'chirmoqchimisiz?`)) {
                            onDeleteExpense(e.id);
                          }
                        }}
                        title="O'chirish"
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
