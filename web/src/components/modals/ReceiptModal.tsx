'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Printer, X, CheckCircle, Copy, Sparkles, Check, CheckSquare, Square } from 'lucide-react';
import { SaleResponseDto } from '@/types/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleResponseDto | null;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
}

export function ReceiptModal({
  isOpen,
  onClose,
  sale,
  storeName = "OSON SAVDO",
  storePhone = "+998 91 802 8184",
  storeAddress = "Guliston shahar"
}: Props) {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [copied, setCopied] = useState(false);
  const [autoPrint, setAutoPrint] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('osonsavdo_auto_print');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });
  const receiptRef = useRef<HTMLDivElement>(null);

  // Avtomatik chop etish sozlamasini saqlash
  const handleToggleAutoPrint = (val: boolean) => {
    setAutoPrint(val);
    try {
      localStorage.setItem('osonsavdo_auto_print', val ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  // Chop etish funksiyasi
  const handlePrint = () => {
    window.print();
  };

  // Savdo yakunlanishi bilan avtomatik chop etish
  useEffect(() => {
    if (isOpen && sale && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, sale, autoPrint]);

  // Tezkor klaviatura tugmalari (Enter -> Print, Esc -> Yopish)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' || (e.ctrlKey && (e.key === 'p' || e.key === 'P'))) {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !sale) return null;

  const handleCopyText = () => {
    if (!sale) return;
    const lines = [
      `=== ${storeName.toUpperCase()} ===`,
      `Chek #${sale.id}`,
      `Sana: ${new Date(sale.createdAt).toLocaleString('uz-UZ')}`,
      `Kassir: ${sale.cashierName || 'Kassir'}`,
      '--------------------------------',
      ...sale.items.map(i => {
        const uPrice = i.unitSellingPrice || 0;
        const sub = i.subtotal ?? (i.quantity * uPrice - (i.discountAmount || 0));
        return `${i.productName}\n  ${i.quantity} x ${uPrice.toLocaleString()} = ${sub.toLocaleString()} so'm`;
      }),
      '--------------------------------',
      sale.discountAmount > 0 ? `Chegirma: -${sale.discountAmount.toLocaleString()} so'm` : '',
      `JAMI: ${sale.totalAmount.toLocaleString()} so'm`,
      `To'lov turi: ${sale.paymentType}`,
      sale.customerName ? `Mijoz: ${sale.customerName}` : '',
      '--------------------------------',
      'Xaridingiz uchun rahmat!'
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(sale.createdAt).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="print-modal-content bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Chekni Chop Etish</h2>
              <p className="text-xs text-slate-400">Termal printer (58mm / 80mm)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-print toggle */}
            <button
              type="button"
              onClick={() => handleToggleAutoPrint(!autoPrint)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition border ${autoPrint
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}
              title="Savdo yakunlanganda chek oynasi avtomatik ochilishi"
            >
              {autoPrint ? <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> : <Square className="w-3.5 h-3.5" />}
              <span>Avto-pechat</span>
            </button>

            {/* Width toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-medium">
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded-lg transition ${paperWidth === '58mm'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                58 mm
              </button>
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded-lg transition ${paperWidth === '80mm'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                80 mm
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

        {/* Receipt Preview Area (Scrollable in modal, full in print) */}
        <div className="print-modal-scroll flex-1 overflow-y-auto py-6 flex justify-center bg-slate-50 dark:bg-slate-950/50 rounded-2xl my-4 p-4 border border-dashed border-slate-200 dark:border-slate-800">
          <div
            id="printable-receipt"
            ref={receiptRef}
            style={{ width: paperWidth === '58mm' ? '280px' : '360px' }}
            className="bg-white text-black p-5 shadow-md font-mono text-[11px] leading-relaxed select-text"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-black">
              <h1 className="text-sm font-black tracking-wider uppercase">{storeName}</h1>
              <p className="text-[10px] text-gray-700">{storeAddress}</p>
              <p className="text-[10px] text-gray-700">
                Tel:{" "}
                <a
                  href="https://t.me/Jumabekov_014"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-bold text-sky-700"
                  title="Telegram orqali bog'lanish"
                >
                  {storePhone}
                </a>
              </p>
            </div>

            {/* Metadata */}
            <div className="py-2.5 border-b border-dashed border-black space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Chek raqami:</span>
                <span className="font-bold font-mono">#{sale.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Sana va vaqt:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Kassir:</span>
                <span>{sale.cashierName || 'Kassir'}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span>Mijoz:</span>
                  <span className="font-bold">{sale.customerName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-black space-y-2">
              <div className="flex justify-between font-bold text-[10px] border-b border-gray-400 pb-1">
                <span>Mahsulot</span>
                <span>Summa</span>
              </div>
              {sale.items.map((item, idx) => {
                const uPrice = item.unitSellingPrice || 0;
                const sub = item.subtotal ?? (item.quantity * uPrice - (item.discountAmount || 0));
                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-semibold text-black">{item.productName}</div>
                    <div className="flex justify-between text-gray-700 text-[10px]">
                      <span>
                        {item.quantity} x {uPrice.toLocaleString()}
                        {item.discountAmount > 0 ? ` (-${item.discountAmount.toLocaleString()})` : ''}
                      </span>
                      <span className="font-bold">{sub.toLocaleString()} so&apos;m</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-black space-y-1 text-xs">
              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-gray-700 text-[11px]">
                  <span>Chegirma (skidka):</span>
                  <span>-{sale.discountAmount.toLocaleString()} so&apos;m</span>
                </div>
              )}

              {sale.cashbackUsed > 0 && (
                <div className="flex justify-between text-gray-700 text-[11px]">
                  <span>Bonusdan to&apos;landi:</span>
                  <span>-{sale.cashbackUsed.toLocaleString()} so&apos;m</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black pt-1">
                <span>JAMI TO&apos;LOV:</span>
                <span>{sale.totalAmount.toLocaleString()} so&apos;m</span>
              </div>

              <div className="flex justify-between text-[11px] pt-1.5 border-t border-dotted border-gray-400">
                <span>To&apos;lov usuli:</span>
                <span className="font-bold uppercase">
                  {sale.paymentType === 'Mixed'
                    ? "ARALASH TO'LOV"
                    : sale.paymentType === 'Cash'
                      ? "NAQD PUL"
                      : sale.paymentType === 'Card'
                        ? "PLASTIK KARTA"
                        : "NASIYA (QARZ)"}
                </span>
              </div>

              {/* To'lov turlarining tafsilotlari */}
              {sale.paymentType === 'Cash' && sale.paidAmount > 0 && (
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Naqd to&apos;landi:</span>
                  <span>{sale.paidAmount.toLocaleString()} so&apos;m</span>
                </div>
              )}

              {sale.paymentType === 'Card' && sale.paidAmount > 0 && (
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Karta orqali:</span>
                  <span>{sale.paidAmount.toLocaleString()} so&apos;m</span>
                </div>
              )}

              {sale.paymentType === 'Mixed' && (
                <>
                  {sale.paidCash > 0 && (
                    <div className="flex justify-between text-[10px] text-gray-700">
                      <span>• Naqd qismi:</span>
                      <span>{sale.paidCash.toLocaleString()} so&apos;m</span>
                    </div>
                  )}
                  {sale.paidCard > 0 && (
                    <div className="flex justify-between text-[10px] text-gray-700">
                      <span>• Karta qismi:</span>
                      <span>{sale.paidCard.toLocaleString()} so&apos;m</span>
                    </div>
                  )}
                </>
              )}

              {sale.debtAmount > 0 && (
                <div className="flex justify-between text-[11px] font-bold text-red-600">
                  <span>Nasiyaga (Qarz):</span>
                  <span>{sale.debtAmount.toLocaleString()} so&apos;m</span>
                </div>
              )}

              {sale.cashbackEarned > 0 && (
                <div className="flex justify-between text-[10px] text-gray-700 pt-0.5">
                  <span>Keshbek bonus (+):</span>
                  <span>+{sale.cashbackEarned.toLocaleString()} so&apos;m</span>
                </div>
              )}
            </div>

            {/* Debt Signature block (agar nasiyaga berilgan bo'lsa) */}
            {sale.debtAmount > 0 && (
              <div className="py-3 border-b border-dashed border-black text-[10px] space-y-2.5">
                <p className="italic text-center text-gray-700">
                  Men {sale.customerName || 'xaridor'} yuqoridagi {sale.debtAmount.toLocaleString()} so&apos;m qarzni tan olaman.
                </p>
                <div className="pt-2 flex justify-between items-end">
                  <span>Xaridor imzosi:</span>
                  <span className="border-b border-black w-28 inline-block"></span>
                </div>
              </div>
            )}

            {/* Footer QR & Thanks */}
            <div className="pt-3 text-center space-y-1 text-[10px]">
              <p className="font-semibold tracking-wide">XARIDINGIZ UCHUN RAHMAT!</p>
              <p className="text-[9px] text-gray-600">Oson Savdo POS tizimi orqali chop etildi</p>
              <div className="pt-1.5 flex justify-center">
                <div className="font-mono text-[9px] text-gray-500 tracking-widest">
                  * * * #{sale.id.toString().padStart(6, '0')} * * *
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bottom Bar */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleCopyText}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Nusxalandi!' : 'Matn nusxasi'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Yopish (Esc)
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Chop Etish (Enter)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
