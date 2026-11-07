'use client';

import React, { useState } from 'react';
import {
  X,
  DollarSign,
  UserCheck,
  AlertCircle,
  Banknote,
  CreditCard,
  Printer,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { CustomerDebtSummaryDto, RepayDebtDto, PaymentType, DebtTransactionResponseDto } from '@/types/api';

interface Props {
  isOpen: boolean;
  customer: CustomerDebtSummaryDto | null;
  cashierName?: string;
  activeShiftId?: number | null;
  onClose: () => void;
  onSubmit: (dto: RepayDebtDto, printReceipt: boolean) => Promise<DebtTransactionResponseDto | void>;
}

export function RepayDebtModal({
  isOpen,
  customer,
  cashierName = 'Kassir',
  activeShiftId,
  onClose,
  onSubmit
}: Props) {
  const [amount, setAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<PaymentType>('Cash');
  const [note, setNote] = useState<string>('');
  const [printReceipt, setPrintReceipt] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !customer) return null;

  const currentDebt = customer.totalDebt;
  const remainingDebt = Math.max(0, currentDebt - (amount || 0));
  const isFullRepay = (amount || 0) >= currentDebt && currentDebt > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError("To'lov summasi 0 dan katta bo'lishi kerak.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit(
        {
          customerId: customer.customerId,
          amount,
          paymentType,
          cashShiftId: activeShiftId,
          cashierName,
          note: note.trim() || `Nasiya to'lovi (${paymentType === 'Cash' ? 'Naqd' : 'Karta'})`
        },
        printReceipt
      );
      setAmount(0);
      setNote('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const setPresetAmount = (val: number) => {
    setAmount(Math.min(customer.totalDebt, Math.max(0, val)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Qarz To&apos;lash (Nasiya)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mijoz hisobidan pul qabul qilish va kassa kirimi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Balance Banner */}
        <div className="px-6 py-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20">
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Mijoz:</span>
            <span className="font-bold text-slate-900 dark:text-white">{customer.customerName}</span>
          </div>
          <div className="flex justify-between items-center mb-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Telefon:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{customer.phone}</span>
          </div>
          <div className="pt-2 border-t border-amber-500/20 flex justify-between items-center">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-400">Joriy umumiy qarz:</span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-400">
              {currentDebt.toLocaleString()} so&apos;m
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              To&apos;lov Turi
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentType('Cash')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border-2 font-bold text-xs transition ${
                  paymentType === 'Cash'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <Banknote className="w-4 h-4" />
                Naqd pul (Kassaga)
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('Card')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border-2 font-bold text-xs transition ${
                  paymentType === 'Card'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Plastik Karta
              </button>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                To&apos;lanayotgan Summa (so&apos;m)
              </label>
              <button
                type="button"
                onClick={() => setPresetAmount(customer.totalDebt)}
                className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                To&apos;liq to&apos;lash
              </button>
            </div>
            <div className="relative">
              <DollarSign className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="number"
                min="100"
                step="500"
                required
                placeholder="0"
                value={amount || ''}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 text-base font-bold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Quick Amount Pills */}
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={() => setPresetAmount(customer.totalDebt)}
                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-500/20 transition"
              >
                100% ({customer.totalDebt.toLocaleString()})
              </button>
              {customer.totalDebt > 10000 && (
                <button
                  type="button"
                  onClick={() => setPresetAmount(Math.round(customer.totalDebt / 2))}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition"
                >
                  50% ({Math.round(customer.totalDebt / 2).toLocaleString()})
                </button>
              )}
              {[100000, 200000, 500000].map(val => (
                val < customer.totalDebt && (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPresetAmount(val)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition"
                  >
                    {val.toLocaleString()}
                  </button>
                )
              ))}
            </div>
          </div>

          {/* Real-time Calculation Summary Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Oldingi qarz:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{currentDebt.toLocaleString()} so&apos;m</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Ushbu to&apos;lov:</span>
              <span className="font-bold text-emerald-600">-{amount.toLocaleString()} so&apos;m</span>
            </div>
            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-bold">
              <span className="text-slate-800 dark:text-white">To&apos;lovdan so&apos;ng qoldiq:</span>
              <span className={remainingDebt === 0 ? "text-emerald-600 font-black text-sm flex items-center gap-1" : "text-amber-600 font-extrabold text-sm"}>
                {remainingDebt === 0 && <CheckCircle2 className="w-4 h-4" />}
                {remainingDebt === 0 ? "0 so'm (To'liq uziladi)" : `${remainingDebt.toLocaleString()} so'm`}
              </span>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Izoh (Ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="Masalan: Bank ilovasi orqali yoki do'konga kelib to'ladi"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Receipt Checkbox Option */}
          <label className="flex items-center gap-3 p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <input
              type="checkbox"
              checked={printReceipt}
              onChange={e => setPrintReceipt(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
            />
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>To&apos;lovdan so&apos;ng chek (kvitansiya) oynasini ochish</span>
            </div>
          </label>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading || amount <= 0}
              className="px-6 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg shadow-amber-600/20 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? "To'lanmoqda..." : "To'lovni Tasdiqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
