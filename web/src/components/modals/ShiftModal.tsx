'use client';

import React, { useState } from 'react';
import {
  Clock,
  DollarSign,
  X,
  CheckCircle,
  AlertTriangle,
  History,
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { CurrentShiftSummaryDto, CashShiftResponseDto, CashOperationType } from '@/types/api';
import { apiService } from '@/services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shiftSummary: CurrentShiftSummaryDto | null;
  onOpenShift: (openingBalance: number, note?: string) => Promise<void>;
  onCloseShift: (shiftId: number, closingCash: number, note?: string) => Promise<void>;
  shiftHistory: CashShiftResponseDto[];
  onRefreshHistory: () => void;
  onRefreshShift?: () => Promise<void>;
}

export function ShiftModal({
  isOpen,
  onClose,
  shiftSummary,
  onOpenShift,
  onCloseShift,
  shiftHistory,
  onRefreshHistory,
  onRefreshShift
}: Props) {
  const [tab, setTab] = useState<'current' | 'history'>('current');
  const [openingBalance, setOpeningBalance] = useState<string>('200000');
  const [closingCash, setClosingCash] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Cash Operation Modal (Vnesenie / Inkassatsiya)
  const [operationType, setOperationType] = useState<CashOperationType | null>(null);
  const [operationAmount, setOperationAmount] = useState<string>('');
  const [operationReason, setOperationReason] = useState<string>('');
  const [submittingOperation, setSubmittingOperation] = useState(false);

  if (!isOpen) return null;

  const currentShift = shiftSummary?.shift;
  const isShiftOpen = shiftSummary?.isOpen && currentShift;

  const handleAddOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift || !operationType) return;
    const amount = parseFloat(operationAmount) || 0;
    if (amount <= 0) {
      alert("Summa 0 dan katta bo'lishi kerak!");
      return;
    }
    setSubmittingOperation(true);
    try {
      await apiService.addCashOperation(currentShift.id, {
        type: operationType,
        amount,
        reason: operationReason
      });
      alert(operationType === 'CashIn' || operationType === 1 ? "Kassaga pul muvaffaqiyatli kiritildi!" : "Inkassatsiya muvaffaqiyatli qayd etildi!");
      setOperationType(null);
      setOperationAmount('');
      setOperationReason('');
      if (onRefreshShift) {
        await onRefreshShift();
      }
    } catch (err: any) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setSubmittingOperation(false);
    }
  };

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(openingBalance) || 0;
    setLoading(true);
    try {
      await onOpenShift(val, note);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    const val = parseFloat(closingCash) || 0;
    setLoading(true);
    try {
      await onCloseShift(currentShift.id, val, note);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const countedCashNum = parseFloat(closingCash) || 0;
  const expectedCashNum = shiftSummary?.currentCalculatedCash || 0;
  const difference = countedCashNum - expectedCashNum;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isShiftOpen ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Kassa Smenasi (Z-Hisobot)</h2>
              <p className="text-xs text-slate-400">
                Holat:{' '}
                <span className={`font-semibold ${isShiftOpen ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {isShiftOpen ? 'Smena Ochiq' : 'Smena Yopiq'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-medium">
              <button
                onClick={() => setTab('current')}
                className={`px-3 py-1 rounded-lg transition ${
                  tab === 'current'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500'
                }`}
              >
                Amaldagi
              </button>
              <button
                onClick={() => {
                  setTab('history');
                  onRefreshHistory();
                }}
                className={`px-3 py-1 rounded-lg transition ${
                  tab === 'history'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500'
                }`}
              >
                Tarix
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {tab === 'history' ? (
            <div className="space-y-3">
              {shiftHistory.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">Oldingi smenalar tarixi mavjud emas.</p>
              ) : (
                shiftHistory.map(sh => (
                  <div
                    key={sh.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>Smena #{sh.id} ({sh.cashierName})</span>
                      <span className={sh.status === 'Open' ? 'text-emerald-500' : 'text-slate-400'}>
                        {sh.status === 'Open' ? 'OCHIQ' : 'YOPILGAN'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Ochildi: {new Date(sh.openedAt).toLocaleString('uz-UZ')}
                      {sh.closedAt && ` • Yopildi: ${new Date(sh.closedAt).toLocaleString('uz-UZ')}`}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                      <div>Naqd savdo: <span className="font-semibold text-slate-800 dark:text-white">{sh.totalCashSales.toLocaleString()}</span></div>
                      <div>Karta savdo: <span className="font-semibold text-slate-800 dark:text-white">{sh.totalCardSales.toLocaleString()}</span></div>
                      <div>Kutilgan: <span className="font-semibold">{sh.expectedCash.toLocaleString()}</span></div>
                      <div>Farq: <span className={`font-bold ${sh.cashDifference >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{sh.cashDifference > 0 ? `+${sh.cashDifference.toLocaleString()}` : sh.cashDifference.toLocaleString()}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : !isShiftOpen ? (
            /* Smena OCHISH FORM */
            <form onSubmit={handleOpen} className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-700 dark:text-amber-400 text-xs flex gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>
                  Kassa smenasi yopiq. Savdo qilishdan oldin yangi smena oching va kassadagi boshlang&apos;ich mayda pulni kiriting.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Boshlang&apos;ich kassa qoldig&apos;i (so&apos;m)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    required
                    min="0"
                    step="1000"
                    placeholder="200000"
                    className="w-full px-4 py-3 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-semibold">so&apos;m</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[100000, 200000, 500000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setOpeningBalance(amt.toString())}
                      className="px-2.5 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 transition"
                    >
                      {amt.toLocaleString()} so&apos;m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Izoh (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Masalan: ertalabki smena"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                {loading ? 'Ochilmoqda...' : 'Smenani Boshlash (Ochish)'}
              </button>
            </form>
          ) : (
            /* Smena YOPISH FORM (Active shift) */
            <form onSubmit={handleClose} className="space-y-4">
              {/* Shift Live Statistics Card */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Kassir:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{currentShift.cashierName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Ochilgan vaqt:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {new Date(currentShift.openedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Boshlang&apos;ich naqd pul:</span>
                  <span className="font-bold">{currentShift.openingBalance.toLocaleString()} so&apos;m</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Naqd savdolar (+):</span>
                  <span className="font-bold text-emerald-600">+{currentShift.totalCashSales.toLocaleString()} so&apos;m</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Karta savdolar:</span>
                  <span className="font-bold text-blue-600">{currentShift.totalCardSales.toLocaleString()} so&apos;m</span>
                </div>
                {(currentShift.totalDebtRepaidCash ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Nasiya to&apos;lovi (Naqd +):</span>
                    <span className="font-bold text-amber-600">+{currentShift.totalDebtRepaidCash!.toLocaleString()} so&apos;m</span>
                  </div>
                )}
                {(currentShift.totalDebtRepaidCard ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Nasiya to&apos;lovi (Karta):</span>
                    <span className="font-bold text-indigo-600">+{currentShift.totalDebtRepaidCard!.toLocaleString()} so&apos;m</span>
                  </div>
                )}
                {currentShift.totalRefunds > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Vozvrat qaytarishlar (-):</span>
                    <span className="font-bold text-rose-600">-{currentShift.totalRefunds.toLocaleString()} so&apos;m</span>
                  </div>
                )}
                {(currentShift.totalExpensesCash ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Kassadan xarajat (Chiqim -):</span>
                    <span className="font-bold text-rose-600">-{currentShift.totalExpensesCash!.toLocaleString()} so&apos;m</span>
                  </div>
                )}
                {(currentShift.totalCashIn ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Kassaga kiritildi (Vnesenie +):</span>
                    <span className="font-bold text-teal-600">+{currentShift.totalCashIn!.toLocaleString()} so&apos;m</span>
                  </div>
                )}
                {(currentShift.totalCashOut ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Inkassatsiya (Chiqim -):</span>
                    <span className="font-bold text-amber-700">-{currentShift.totalCashOut!.toLocaleString()} so&apos;m</span>
                  </div>
                )}
                <div className="pt-2 border-t border-emerald-200/80 dark:border-emerald-800/80 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-800 dark:text-white">Kassada bo&apos;lishi kerak:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {expectedCashNum.toLocaleString()} so&apos;m
                  </span>
                </div>
              </div>

              {/* Vnesenie va Inkassatsiya Tugmalari */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOperationType('CashIn');
                    setOperationAmount('');
                    setOperationReason('Mayda pul kiritildi');
                  }}
                  className="py-2.5 px-3 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-teal-100 transition shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Pul Kiritish (Vnesenie)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOperationType('CashOut');
                    setOperationAmount('');
                    setOperationReason('Do\'kon egasi inkassatsiya qildi');
                  }}
                  className="py-2.5 px-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-amber-100 transition shadow-xs"
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>Inkassatsiya (Chiqim)</span>
                </button>
              </div>

              {/* Vnesenie / Inkassatsiya mini-formasi */}
              {operationType && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
                      {operationType === 'CashIn' ? (
                        <>
                          <PlusCircle className="w-4 h-4 text-teal-600" />
                          <span>Kassaga Pul Kiritish (Vnesenie)</span>
                        </>
                      ) : (
                        <>
                          <MinusCircle className="w-4 h-4 text-amber-600" />
                          <span>Inkassatsiya (Kassadan Pul Olish)</span>
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOperationType(null)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Summa (so&apos;m):</label>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      placeholder="Masalan: 100000"
                      value={operationAmount}
                      onChange={e => setOperationAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500">Sabab / Izoh:</label>
                    <input
                      type="text"
                      placeholder="Sabab..."
                      value={operationReason}
                      onChange={e => setOperationReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOperation}
                    disabled={submittingOperation}
                    className={`w-full py-2.5 text-white font-bold text-xs rounded-xl transition ${
                      operationType === 'CashIn'
                        ? 'bg-teal-600 hover:bg-teal-700'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {submittingOperation ? 'Qayd etilmoqda...' : 'Tasdiqlash'}
                  </button>
                </div>
              )}

              {/* Counting Cash Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kassada haqiqiy sanalgan naqd pul:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={closingCash}
                    onChange={e => setClosingCash(e.target.value)}
                    required
                    min="0"
                    placeholder={expectedCashNum.toString()}
                    className="w-full px-4 py-3 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-semibold">so&apos;m</span>
                </div>
              </div>

              {/* Discrepancy indicator */}
              {closingCash !== '' && (
                <div
                  className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                    difference === 0
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold'
                      : difference > 0
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 font-bold'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-600 font-bold'
                  }`}
                >
                  <span>
                    {difference === 0
                      ? 'Kassa to\'liq mos keldi!'
                      : difference > 0
                      ? 'Ortiqcha pul:'
                      : 'Kamomad (Yetishmovchilik):'}
                  </span>
                  <span>{difference > 0 ? `+${difference.toLocaleString()}` : difference.toLocaleString()} so&apos;m</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Yopilish izohi (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Kassa topshirildi..."
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2"
              >
                {loading ? 'Yopilmoqda...' : 'Smenani Yopish & Z-Hisobot'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
