'use client';

import React, { useState } from 'react';
import { X, Receipt, DollarSign, Tag, AlertCircle, Banknote, CreditCard, Info } from 'lucide-react';
import { CreateExpenseDto, type PaymentType } from '@/types/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateExpenseDto) => Promise<void>;
  cashierName?: string;
}

export function AddExpenseModal({ isOpen, onClose, onSubmit, cashierName }: Props) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState('Ijara');
  const [paymentType, setPaymentType] = useState<PaymentType>('Cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const quickCategories = [
    'Ijara',
    'Ish haqi',
    'Kommunal',
    'Transport / Yetkazish',
    'Paket / Qadoq',
    'Tushlik / Oziq-ovqat',
    'Ta\'mirlash',
    'Boshqa'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || amount <= 0) {
      setError("Iltimos, xarajat nomi va summasini to'g'ri kiriting.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        title,
        amount,
        category,
        paymentType,
        createdByName: cashierName
      });
      setTitle('');
      setAmount(0);
      setCategory('Ijara');
      setPaymentType('Cash');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Yangi Xarajat / Chiqim</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Do&apos;kon operatsion chiqimlari hisobi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* To'lov manbasi (Naqd kassa vs Bank hisobi) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Chiqim Manbasi (To&apos;lov turi)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('Cash')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition ${
                  paymentType === 'Cash'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Kassadan Naqd</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('Card')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition ${
                  paymentType === 'Card'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Bank / Karta</span>
              </button>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-start gap-1.5 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
              <span>
                {paymentType === 'Cash'
                  ? "Kassadan olingan naqd pul kassa smenasining kutilgan naqdidan avtomatik chegiriladi."
                  : "Bank hisobi yoki kartadan to'langan xarajat kassa naqd puliga ta'sir qilmaydi."}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Xarajat Nomi / Sababi
            </label>
            <input
              type="text"
              required
              placeholder="Masalan: Tushlik yoki Mayda xarajat"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Xarajat Summasi (so&apos;m)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="number"
                min="1"
                step="1000"
                required
                placeholder="0"
                value={amount || ''}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Kategoriya
            </label>
            <div className="relative mb-2">
              <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {quickCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickCategories.slice(0, 5).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border transition ${
                    category === cat
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/20 disabled:opacity-50 transition"
            >
              {loading ? "Saqlanmoqda..." : "Xarajatni Kiritish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
