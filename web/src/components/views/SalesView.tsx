'use client';

import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  CreditCard,
  Banknote,
  BookOpen,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Printer,
  RotateCcw
} from 'lucide-react';
import { SaleResponseDto } from '@/types/api';

interface Props {
  sales: SaleResponseDto[];
  loading: boolean;
  onViewSale: (sale: SaleResponseDto) => void;
  onPrintReceipt: (sale: SaleResponseDto) => void;
  onOpenRefund: (sale: SaleResponseDto) => void;
}

export function SalesView({ sales, loading, onViewSale, onPrintReceipt, onOpenRefund }: Props) {
  const [search, setSearch] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const paymentFilters = [
    { id: 'All', label: 'Barchasi' },
    { id: 'Cash', label: 'Naqd' },
    { id: 'Card', label: 'Karta' },
    { id: 'Debt', label: 'Nasiya (Qarz)' },
    { id: 'Mixed', label: 'Aralash' }
  ];

  const filtered = sales.filter(s => {
    const matchesSearch =
      s.id.toString().includes(search) ||
      (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (s.cashierName && s.cashierName.toLowerCase().includes(search.toLowerCase()));

    const matchesType = selectedPaymentType === 'All' ? true : s.paymentType === selectedPaymentType;

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalSalesRevenue = filtered.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Search & Payment Type Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Chek raqami (#), kassir yoki mijoz ismi..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {paymentFilters.map(filter => (
            <button
              key={filter.id}
              onClick={() => {
                setSelectedPaymentType(filter.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition shrink-0 ${
                selectedPaymentType === filter.id
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="py-3 px-4 font-semibold">Chek #</th>
                <th className="py-3 px-4 font-semibold">Sana</th>
                <th className="py-3 px-4 font-semibold">Mijoz / Kassir</th>
                <th className="py-3 px-4 font-semibold">To&apos;lov Turi</th>
                <th className="py-3 px-4 font-semibold">Holat</th>
                <th className="py-3 px-4 font-semibold text-right">Jami Summa</th>
                <th className="py-3 px-4 font-semibold text-right">To&apos;langan</th>
                <th className="py-3 px-4 font-semibold text-right">Qarz Qoldig&apos;i</th>
                <th className="py-3 px-4 font-semibold text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    Savdolar tarixi yuklanmoqda...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    Mos keluvchi savdolar topilmadi.
                  </td>
                </tr>
              ) : (
                paginated.map(s => {
                  const itemsCount = s.items.reduce((sum, it) => sum + it.quantity, 0);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-200">
                        #{s.id}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(s.createdAt).toLocaleString('uz-UZ', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {s.customerName || <span className="text-slate-400">Oddiy xaridor</span>}
                        </p>
                        <p className="text-[10px] text-slate-400">Kassir: {s.cashierName || 'Kassir'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            s.paymentType === 'Cash'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : s.paymentType === 'Card'
                              ? 'bg-blue-500/10 text-blue-600'
                              : s.paymentType === 'Debt'
                              ? 'bg-rose-500/10 text-rose-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {s.paymentType === 'Cash'
                            ? 'Naqd'
                            : s.paymentType === 'Card'
                            ? 'Karta'
                            : s.paymentType === 'Debt'
                            ? 'Nasiya'
                            : 'Aralash'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            s.status === 'Refunded'
                              ? 'bg-rose-500/10 text-rose-600'
                              : s.status === 'PartiallyRefunded'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-emerald-500/10 text-emerald-600'
                          }`}
                        >
                          {s.status === 'Refunded'
                            ? 'Qaytarilgan (Vozvrat)'
                            : s.status === 'PartiallyRefunded'
                            ? 'Qisman qaytgan'
                            : 'Bajarildi'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-800 dark:text-white font-mono">
                        {s.totalAmount.toLocaleString()} so&apos;m
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                        {s.paidAmount.toLocaleString()} so&apos;m
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {s.debtAmount > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {s.debtAmount.toLocaleString()} so&apos;m
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPrintReceipt(s)}
                            title="Chekni chop etish"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {s.status !== 'Refunded' && (
                            <button
                              onClick={() => onOpenRefund(s)}
                              title="Tovarni qaytarish (Vozvrat)"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onViewSale(s)}
                            title="Tafsilotlar"
                            className="px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition"
                          >
                            Ko&apos;rish
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Revenue Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Filtr bo&apos;yicha jami savdo:{' '}
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              {totalSalesRevenue.toLocaleString()} so&apos;m
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
