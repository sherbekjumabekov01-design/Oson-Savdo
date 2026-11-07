'use client';

import React from 'react';
import { X, ShoppingBag, Calendar, User, CreditCard, DollarSign } from 'lucide-react';
import { SaleResponseDto } from '@/types/api';

interface Props {
  isOpen: boolean;
  sale: SaleResponseDto | null;
  onClose: () => void;
}

export function SaleDetailModal({ isOpen, sale, onClose }: Props) {
  if (!isOpen || !sale) return null;

  const totalGrossProfit = sale.items.reduce((sum, item) => sum + item.grossProfit, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Savdo Cheki #{sale.id}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Batafsil tovarlar va to&apos;lov holati</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-4 p-5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-slate-400">Vaqt:</p>
              <p className="font-medium text-slate-700 dark:text-slate-200">{new Date(sale.createdAt).toLocaleString('uz-UZ')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-slate-400">To&apos;lov turi:</p>
              <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-md font-semibold text-[11px] ${
                sale.paymentType === 'Cash'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : sale.paymentType === 'Card'
                  ? 'bg-blue-500/10 text-blue-600'
                  : sale.paymentType === 'Debt'
                  ? 'bg-rose-500/10 text-rose-600'
                  : 'bg-amber-500/10 text-amber-600'
              }`}>
                {sale.paymentType === 'Cash' ? 'Naqd' : sale.paymentType === 'Card' ? 'Karta' : sale.paymentType === 'Debt' ? 'Nasiya (Qarz)' : 'Aralash'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-slate-400">Mijoz:</p>
              <p className="font-medium text-slate-700 dark:text-slate-200">{sale.customerName || 'Oddiy xaridor'}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                <th className="pb-3 font-medium">Tovar nomi</th>
                <th className="pb-3 font-medium text-center">Soni</th>
                <th className="pb-3 font-medium text-right">Narxi</th>
                <th className="pb-3 font-medium text-right">Jami</th>
                <th className="pb-3 font-medium text-right text-emerald-600 dark:text-emerald-400">Foyda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sale.items.map(item => (
                <tr key={item.id} className="text-slate-700 dark:text-slate-300">
                  <td className="py-3 font-medium">
                    {item.productName}
                    <span className="block text-[11px] text-slate-400 font-mono">{item.productBarcode}</span>
                  </td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">{item.unitSellingPrice.toLocaleString()} so&apos;m</td>
                  <td className="py-3 text-right font-semibold">{item.subtotal.toLocaleString()} so&apos;m</td>
                  <td className="py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                    +{item.grossProfit.toLocaleString()} so&apos;m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Umumiy tovar summasi:</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{sale.totalAmount.toLocaleString()} so&apos;m</span>
          </div>

          <div className="flex justify-between text-xs text-slate-500">
            <span>To&apos;langan summa:</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{sale.paidAmount.toLocaleString()} so&apos;m</span>
          </div>

          {sale.debtAmount > 0 && (
            <div className="flex justify-between text-xs text-slate-500">
              <span>Qarzga yozilgan summa:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{sale.debtAmount.toLocaleString()} so&apos;m</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700 text-sm">
            <span className="font-semibold text-slate-800 dark:text-white">Ushbu savdodan foyda (Gross Profit):</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              {totalGrossProfit.toLocaleString()} so&apos;m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
