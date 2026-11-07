'use client';

import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  DollarSign,
  History,
  Phone,
  UserCheck,
  Calendar,
  AlertCircle,
  Send,
  MessageSquare,
  Check,
  Copy,
  X
} from 'lucide-react';
import { CustomerDebtSummaryDto, DebtReminderResponseDto } from '@/types/api';
import { apiService } from '@/services/api';

interface Props {
  debtors: CustomerDebtSummaryDto[];
  loading: boolean;
  onOpenRepayModal: (customer: CustomerDebtSummaryDto) => void;
  onOpenHistoryModal: (customer: CustomerDebtSummaryDto) => void;
}

export function DebtView({ debtors, loading, onOpenRepayModal, onOpenHistoryModal }: Props) {
  const [search, setSearch] = useState('');
  const [sendingDebtId, setSendingDebtId] = useState<number | null>(null);
  const [reminderModalData, setReminderModalData] = useState<{
    debtor: CustomerDebtSummaryDto;
    result: DebtReminderResponseDto;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSendReminder = async (debtor: CustomerDebtSummaryDto) => {
    try {
      setSendingDebtId(debtor.customerId);
      const res = await apiService.sendDebtReminder(debtor.customerId);
      setReminderModalData({ debtor, result: res });
      setCopied(false);
    } catch (err: any) {
      alert(`Eslatma shakllantirishda xatolik: ${err.message}`);
    } finally {
      setSendingDebtId(null);
    }
  };

  const filtered = debtors.filter(
    d =>
      d.customerName.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search)
  );

  const totalMarketDebt = debtors.reduce((sum, d) => sum + d.totalDebt, 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Bozordagi Umumiy Nasiya (Qarz)
            </span>
            <h2 className="text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">
              {totalMarketDebt.toLocaleString()} so&apos;m
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {debtors.length} ta mijoz hisobida olinmagan mablag&apos; mavjud
            </p>
          </div>
          <div className="p-4 bg-amber-500/20 text-amber-600 rounded-2xl">
            <BookOpen className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-center shadow-xs">
          <span className="text-xs font-medium text-slate-400 uppercase">Faol Qarzdorlar</span>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {debtors.length} nafar
          </h3>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <UserCheck className="w-3.5 h-3.5" /> Balanslar doimiy yangilanadi
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Mijoz ismi yoki telefon raqami bo'yicha qidiruv..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Debtors List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="py-3 px-4 font-semibold">Mijoz Ism-Familiyasi</th>
                <th className="py-3 px-4 font-semibold">Telefon Raqami</th>
                <th className="py-3 px-4 font-semibold text-right">Joriy Qarzi</th>
                <th className="py-3 px-4 font-semibold text-center">Oxirgi Harakat</th>
                <th className="py-3 px-4 font-semibold text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    Nasiyadorlar ro&apos;yxati yuklanmoqda...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    Qarzdor mijozlar topilmadi.
                  </td>
                </tr>
              ) : (
                filtered.map(d => (
                  <tr key={d.customerId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">
                      {d.customerName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {d.phone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400 font-mono">
                        {d.totalDebt.toLocaleString()} so&apos;m
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400">
                      {d.lastTransactionDate ? (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(d.lastTransactionDate).toLocaleDateString('uz-UZ')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Reminder button */}
                        <button
                          onClick={() => handleSendReminder(d)}
                          disabled={sendingDebtId === d.customerId}
                          className="px-3 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/40 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
                          title="SMS yoki Telegram orqali qarz eslatmasini yuborish"
                        >
                          <Send className={`w-3.5 h-3.5 ${sendingDebtId === d.customerId ? 'animate-spin' : ''}`} />
                          <span>{sendingDebtId === d.customerId ? '...' : 'Eslatma'}</span>
                        </button>

                        {/* History button */}
                        <button
                          onClick={() => onOpenHistoryModal(d)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center gap-1.5 transition"
                        >
                          <History className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Tarix</span>
                        </button>

                        {/* Repay button */}
                        <button
                          onClick={() => onOpenRepayModal(d)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-xs shadow-amber-600/20 flex items-center gap-1.5 transition"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Qarz To&apos;lash</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: QARZ ESLATMASI (SMS / TELEGRAM) */}
      {reminderModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Qarz Eslatmasi (SMS & Telegram)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {reminderModalData.debtor.customerName} ({reminderModalData.debtor.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReminderModalData(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status alerts */}
            {reminderModalData.result.telegramSent ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Do&apos;kon Telegram botiga eslatma muvaffaqiyatli jo&apos;natildi!</span>
              </div>
            ) : (
              <div className="p-3 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 rounded-2xl text-[11px] text-sky-700 dark:text-sky-300">
                💡 Telegram bot sozlanmagan bo&apos;lsa, quyidagi tayyor SMS matnidan nusxa olib mijoz telefoniga jo&apos;natishingiz mumkin.
              </div>
            )}

            {/* Pre-formatted message */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Tayyorlangan SMS Matni:
              </label>
              <div className="relative">
                <textarea
                  readOnly
                  rows={4}
                  value={reminderModalData.result.smsTemplate}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-200 resize-none focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(reminderModalData.result.smsTemplate);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Nusxalandi!' : 'SMS Matnidan Nusxa Olish'}</span>
              </button>

              <a
                href={`sms:${reminderModalData.debtor.phone}?body=${encodeURIComponent(reminderModalData.result.smsTemplate)}`}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                title="Telefon SMS dasturida ochish"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span>SMS Ochish</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
