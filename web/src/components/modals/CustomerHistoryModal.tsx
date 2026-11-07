'use client';

import React, { useEffect, useState } from 'react';
import { X, History, ArrowDownLeft, ArrowUpRight, Calendar, FileText } from 'lucide-react';
import { CustomerDebtSummaryDto, DebtTransactionResponseDto } from '@/types/api';
import { apiService } from '@/services/api';

interface Props {
  isOpen: boolean;
  customer: CustomerDebtSummaryDto | null;
  onClose: () => void;
  onViewReceipt?: (transaction: DebtTransactionResponseDto) => void;
}

export function CustomerHistoryModal({ isOpen, customer, onClose, onViewReceipt }: Props) {
  const [transactions, setTransactions] = useState<DebtTransactionResponseDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      setLoading(true);
      apiService
        .getCustomerTransactions(customer.customerId)
        .then(data => setTransactions(data))
        .finally(() => setLoading(false));
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white">{customer.customerName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Nasiya va to&apos;lovlar xronologiyasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Balance Banner */}
        <div className="px-6 py-4 bg-slate-100/60 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Telefon raqami</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{customer.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">Hozirgi qarz balansi</p>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400">
              {customer.totalDebt.toLocaleString()} so&apos;m
            </p>
          </div>
        </div>

        {/* Timeline Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Tarix yuklanmoqda...</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">Hozircha tranzaksiyalar mavjud emas.</div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {transactions.map(tx => {
                const isRepay = tx.type === 'RepayDebt' || (tx.type as unknown as number) === 2;
                const isCash = tx.paymentType === 'Cash' || (tx.paymentType as unknown as number) === 1;

                return (
                  <div key={tx.id} className="relative group">
                    {/* Timeline bullet */}
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-900 ${
                        isRepay
                          ? 'border-emerald-500 text-emerald-500'
                          : 'border-rose-500 text-rose-500'
                      }`}
                    >
                      {isRepay ? (
                        <ArrowDownLeft className="w-3 h-3 stroke-[3]" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                      )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 transition">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                              isRepay
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isRepay ? "Qarz To'landi" : 'Qarz Olindi (Savdo)'}
                          </span>

                          {isRepay && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {isCash ? '💵 Naqd' : '💳 Karta'}
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-sm font-black ${
                            isRepay
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isRepay ? '-' : '+'}
                          {tx.amount.toLocaleString()} so&apos;m
                        </span>
                      </div>

                      {/* Remaining balance info if available */}
                      {isRepay && tx.remainingDebt !== undefined && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Qoldiq qarz: <span className="font-semibold text-slate-700 dark:text-slate-200">{tx.remainingDebt.toLocaleString()} so&apos;m</span>
                          {tx.cashierName && <span className="ml-2 text-slate-400">• Kassir: {tx.cashierName}</span>}
                        </div>
                      )}

                      {tx.note && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{tx.note}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(tx.createdAt).toLocaleString('uz-UZ')}</span>
                        </div>

                        {isRepay && onViewReceipt && (
                          <button
                            type="button"
                            onClick={() => onViewReceipt(tx)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            🧾 Chekni ko&apos;rish
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
