'use client';

import React, { useRef, useState } from 'react';
import { Printer, X, CheckCircle, Copy, Share2, CreditCard, Banknote, ShieldCheck } from 'lucide-react';
import { DebtTransactionResponseDto } from '@/types/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: DebtTransactionResponseDto | null;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
}

export function DebtReceiptModal({
  isOpen,
  onClose,
  transaction,
  storeName = "OSON SAVDO",
  storePhone = "+998 71 200-00-00",
  storeAddress = "Toshkent sh., Savdo markazi"
}: Props) {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCash = transaction.paymentType === 'Cash' || (transaction.paymentType as unknown as number) === 1;
  const paymentTypeName = isCash ? "Naqd pul" : "Plastik karta";

  const handleCopyText = () => {
    if (!transaction) return;
    const lines = [
      `=== ${storeName.toUpperCase()} ===`,
      `NASIYA TO'LOVI KVITANSIYASI`,
      `Chek #: QT-${transaction.id}`,
      `Sana: ${new Date(transaction.createdAt).toLocaleString('uz-UZ')}`,
      `Kassir: ${transaction.cashierName || 'Kassir'}`,
      '--------------------------------',
      `Mijoz: ${transaction.customerName}`,
      transaction.customerPhone ? `Tel: ${transaction.customerPhone}` : '',
      `To'lov usuli: ${paymentTypeName}`,
      '--------------------------------',
      transaction.previousDebt !== undefined ? `Oldingi qarz: ${transaction.previousDebt.toLocaleString()} so'm` : '',
      `TO'LANGAN SUMMA: ${transaction.amount.toLocaleString()} so'm`,
      transaction.remainingDebt !== undefined ? `QOLGAN QARZ: ${transaction.remainingDebt.toLocaleString()} so'm` : '',
      transaction.note ? `Izoh: ${transaction.note}` : '',
      '--------------------------------',
      transaction.remainingDebt === 0 ? 'Qarz to\'liq so\'ndirildi!' : 'O\'z vaqtida to\'laganingiz uchun rahmat!',
      'Xaridingiz uchun rahmat!'
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTelegram = () => {
    if (!transaction) return;
    const text = encodeURIComponent(
      `🏪 ${storeName}\n` +
      `🧾 Nasiya to'lovi cheki: #QT-${transaction.id}\n` +
      `👤 Mijoz: ${transaction.customerName}\n` +
      `💰 To'langan summa: ${transaction.amount.toLocaleString()} so'm (${paymentTypeName})\n` +
      (transaction.remainingDebt !== undefined ? `📉 Qolgan qarz: ${transaction.remainingDebt.toLocaleString()} so'm\n` : '') +
      `📅 Sana: ${new Date(transaction.createdAt).toLocaleString('uz-UZ')}\n` +
      `✅ To'lov qabul qilindi. Rahmat!`
    );
    window.open(`https://t.me/share/url?url=&text=${text}`, '_blank');
  };

  const formattedDate = new Date(transaction.createdAt).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="print-modal-content bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Qarz To&apos;lovi Cheki</h2>
              <p className="text-xs text-slate-400">Termal kvitansiya chop etish</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  paperWidth === '58mm'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                    : 'text-slate-400'
                }`}
              >
                58 mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  paperWidth === '80mm'
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                    : 'text-slate-400'
                }`}
              >
                80 mm
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="print-modal-scroll overflow-y-auto flex-1 my-4 p-4 bg-slate-100/60 dark:bg-slate-950/60 rounded-2xl flex justify-center items-start">
          <div
            ref={receiptRef}
            id="printable-debt-receipt"
            className={`bg-white text-slate-900 shadow-md font-mono text-xs p-5 transition-all duration-200 border border-slate-200 rounded-sm select-none ${
              paperWidth === '58mm' ? 'w-[280px]' : 'w-[360px]'
            }`}
          >
            {/* Store Header */}
            <div className="text-center space-y-1 mb-3">
              <h1 className="font-extrabold text-sm tracking-wider uppercase text-slate-900">
                {storeName}
              </h1>
              <p className="text-[10px] text-slate-600 leading-tight">{storeAddress}</p>
              <p className="text-[10px] text-slate-600">Tel: {storePhone}</p>
              <div className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                NASIYA TO&apos;LOVI KVITANSIYASI
              </div>
            </div>

            {/* Separator */}
            <div className="border-b border-dashed border-slate-400 my-2.5" />

            {/* Meta Information */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Chek raqami:</span>
                <span className="font-bold">#QT-{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Sana:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Kassir:</span>
                <span className="font-semibold">{transaction.cashierName || 'Kassir'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">To&apos;lov turi:</span>
                <span className="font-bold uppercase text-emerald-700">
                  {isCash ? '💵 Naqd pul' : '💳 Plastik karta'}
                </span>
              </div>
            </div>

            {/* Customer Box */}
            <div className="my-2.5 p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Mijoz:</span>
                <span className="font-bold text-slate-900">{transaction.customerName}</span>
              </div>
              {transaction.customerPhone && (
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Telefon:</span>
                  <span>{transaction.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Balance Breakdown */}
            <div className="space-y-1.5 pt-1 text-[11px]">
              {transaction.previousDebt !== undefined && (
                <div className="flex justify-between text-slate-600">
                  <span>Avvalgi qarz balansi:</span>
                  <span className="font-semibold">{transaction.previousDebt.toLocaleString()} so&apos;m</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1.5 px-2 bg-emerald-50 border border-emerald-200 rounded font-bold text-emerald-900 text-xs">
                <span>TO&apos;LANGAN SUMMA:</span>
                <span className="text-sm">{transaction.amount.toLocaleString()} so&apos;m</span>
              </div>

              {transaction.remainingDebt !== undefined && (
                <div className="flex justify-between pt-1 font-bold text-[11px]">
                  <span>Qolgan qarz balansi:</span>
                  <span className={transaction.remainingDebt === 0 ? "text-emerald-700" : "text-amber-800 font-extrabold"}>
                    {transaction.remainingDebt === 0 ? "0 so'm (To'liq yopildi)" : `${transaction.remainingDebt.toLocaleString()} so'm`}
                  </span>
                </div>
              )}

              {transaction.note && (
                <div className="text-[10px] text-slate-500 italic pt-1">
                  Izoh: {transaction.note}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-b border-dashed border-slate-400 my-3" />

            {/* Barcode Simulation */}
            <div className="flex flex-col items-center justify-center space-y-1 my-2">
              <div className="flex items-center gap-[2px] h-7">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2].map((w, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 h-full"
                    style={{ width: `${w}px` }}
                  />
                ))}
              </div>
              <span className="text-[9px] tracking-widest text-slate-500">
                *QT{String(transaction.id).padStart(6, '0')}*
              </span>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[10px] text-slate-600 pt-1 space-y-0.5">
              <p className="font-semibold text-slate-800">
                {transaction.remainingDebt === 0 ? "Qarzingiz to'liq so'ndirildi!" : "O'z vaqtida to'laganingiz uchun rahmat!"}
              </p>
              <p className="text-[9px] text-slate-400">Tizim: Oson Savdo POS</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Nusxalandi' : 'Nusxa olish'}
          </button>

          <button
            type="button"
            onClick={handleShareTelegram}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 text-sky-600 dark:text-sky-400 transition"
          >
            <Share2 className="w-4 h-4" />
            Telegram
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition"
          >
            <Printer className="w-4 h-4" />
            Chop Etish
          </button>
        </div>
      </div>
    </div>
  );
}
