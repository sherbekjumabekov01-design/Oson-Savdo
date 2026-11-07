'use client';

import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, X, Check } from 'lucide-react';
import { SaleResponseDto, CreateRefundDto } from '@/types/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleResponseDto | null;
  onConfirmRefund: (dto: CreateRefundDto) => Promise<void>;
}

export function RefundModal({ isOpen, onClose, sale, onConfirmRefund }: Props) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState<string>('Xaridor fikridan qaytdi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !sale) return null;

  const eligibleItems = sale.items.filter(i => (i.quantity - (i.refundedQuantity || 0)) > 0);

  const selectedItem = eligibleItems.find(i => i.productId === selectedProductId) || eligibleItems[0];
  const maxAvailable = selectedItem ? selectedItem.quantity - (selectedItem.refundedQuantity || 0) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const qty = parseFloat(quantity) || 0;
    if (qty <= 0 || qty > maxAvailable) {
      setError(`Miqdor 1 va ${maxAvailable} orasida bo'lishi kerak`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirmRefund({
        saleId: sale.id,
        reason: reason.trim() || 'Tovarni qaytarish (vozvrat)',
        cashierName: sale.cashierName || 'Kassir',
        items: [
          {
            productId: selectedItem.productId,
            quantity: qty,
            refundPrice: selectedItem.unitSellingPrice
          }
        ]
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Qaytarishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const refundTotal = selectedItem ? (parseFloat(quantity) || 0) * selectedItem.unitSellingPrice : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 text-rose-600 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Tovarni Qaytarish (Vozvrat)</h2>
              <p className="text-xs text-slate-400">Chek #{sale.id} bo&apos;yicha</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {eligibleItems.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Bu chekdagi barcha tovarlar allaqachon qaytarilgan.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Qaytariladigan mahsulot
              </label>
              <select
                value={selectedItem?.productId || ''}
                onChange={e => {
                  setSelectedProductId(parseInt(e.target.value));
                  setQuantity('1');
                }}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {eligibleItems.map(item => (
                  <option key={item.productId} value={item.productId}>
                    {item.productName} (Sotilgan: {item.quantity}, Qaytishi mumkin: {item.quantity - (item.refundedQuantity || 0)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qaytarish miqdori (max: {maxAvailable})
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  min="0.1"
                  max={maxAvailable}
                  step="any"
                  required
                  className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qaytariladigan summa
                </label>
                <div className="px-3 py-2 text-xs font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center h-[38px]">
                  {refundTotal.toLocaleString()} so&apos;m
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Qaytarish sababi
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Yaroqsiz / xaridor qaytardi..."
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 space-y-1">
              <p>✓ Mahsulot avtomatik ravishda ombor qoldig&apos;iga qaytadi.</p>
              {sale.debtAmount > 0 && (
                <p className="text-amber-600 font-semibold">
                  ✓ Ushbu savdo nasiyaga qilingan, mijozning qarzidan tegishli summa ayirib tashlanadi.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2"
              >
                {loading ? 'Bajarilmoqda...' : 'Vozvratni Tasdiqlash'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
