'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Send,
  Sparkles,
  Bot,
  Percent,
  Scale,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  DollarSign,
  Database,
  Download
} from 'lucide-react';
import { apiService } from '@/services/api';
import { StoreResponseDto, StoreSettingsDto } from '@/types/api';

interface Props {
  isOpen: boolean;
  store: StoreResponseDto | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function StoreSettingsModal({ isOpen, store, onClose, onSaved }: Props) {
  const [formData, setFormData] = useState<StoreSettingsDto>({
    telegramBotToken: '',
    telegramChatId: '',
    telegramNotificationsEnabled: false,
    cashbackRate: 1,
    enableCashback: true,
    scalePrefix: '21',
    usdRate: 12850
  });

  const [loading, setLoading] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [sendingBackup, setSendingBackup] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (store) {
      setFormData({
        telegramBotToken: store.telegramBotToken || '',
        telegramChatId: store.telegramChatId || '',
        telegramNotificationsEnabled: store.telegramNotificationsEnabled ?? false,
        cashbackRate: store.cashbackRate ?? 1,
        enableCashback: store.enableCashback ?? true,
        scalePrefix: store.scalePrefix || '21',
        usdRate: store.usdRate ?? 12850
      });
      setMessage(null);
    }
  }, [store]);

  if (!isOpen || !store) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await apiService.updateStoreSettings(store.id, formData);
      setMessage({ text: "Sozlamalar muvaffaqiyatli saqlandi!", type: 'success' });
      if (onSaved) onSaved();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setMessage({ text: err.message || "Saqlashda xatolik yuz berdi", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!formData.telegramBotToken || !formData.telegramChatId) {
      setMessage({
        text: "Iltimos, avval Telegram Bot Token va Chat ID maydonlarini to'ldiring!",
        type: 'error'
      });
      return;
    }

    setTestingTelegram(true);
    setMessage(null);
    try {
      // First save settings so backend has the latest token/chatId
      await apiService.updateStoreSettings(store.id, formData);
      const res = await apiService.testTelegram(store.id);
      setMessage({
        text: res.message || "Telegramga test xabar muvaffaqiyatli jo'natildi! Botni tekshiring.",
        type: 'success'
      });
    } catch (err: any) {
      setMessage({
        text: `Telegram xabarnoma jo'natilmadi: ${err.message}`,
        type: 'error'
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    setMessage(null);
    try {
      const blob = await apiService.downloadBackup();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OsonSavdo_Baza_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMessage({ text: "Baza zaxira nusxasi muvaffaqiyatli yuklab olindi (.zip)!", type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || "Zaxirani yuklab olishda xatolik", type: 'error' });
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleSendBackupToTelegram = async () => {
    setSendingBackup(true);
    setMessage(null);
    try {
      const res = await apiService.sendBackupToTelegram();
      setMessage({ text: res.message || "Zaxira nusxasi Telegram botga yuborildi!", type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || "Telegramga yuborishda xatolik yuz berdi", type: 'error' });
    } finally {
      setSendingBackup(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Do&apos;kon Sozlamalari & Integratsiyalar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {store.name} — Telegram Bot, Keshbek & Tarozi sozlamalari
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {message && (
            <div
              className={`flex items-start gap-2.5 p-3.5 rounded-2xl text-xs font-semibold border animate-in fade-in ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <div className="flex-1">{message.text}</div>
            </div>
          )}

          {/* SECTION 1: TELEGRAM BOT NOTIFICATIONS */}
          <div className="p-4 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Telegram Bot Xabarnomalari (Z-Hisobot, Kamomad, Kam qolgan tovarlar)
                </h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.telegramNotificationsEnabled}
                  onChange={e =>
                    setFormData({ ...formData, telegramNotificationsEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-sky-600"></div>
              </label>
            </div>

            <p className="text-[11px] text-slate-500">
              Kassa smenasi yopilganda Z-hisobot, kamomad yuz berganda va mahsulot kam qolganda do&apos;kon egasining Telegramiga avtomatik xabar boradi.
            </p>

            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telegram Bot Token (masalan: @BotFather bergan token)
                </label>
                <input
                  type="text"
                  placeholder="1234567890:AAH_XYZ1234567890..."
                  value={formData.telegramBotToken || ''}
                  onChange={e => setFormData({ ...formData, telegramBotToken: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telegram Chat ID yoki Guruh ID (masalan: 987654321 yoki -100123456789)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Masalan: 123456789"
                    value={formData.telegramChatId || ''}
                    onChange={e => setFormData({ ...formData, telegramChatId: e.target.value })}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={testingTelegram || !formData.telegramBotToken || !formData.telegramChatId}
                    className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-40 shadow-xs"
                  >
                    {testingTelegram ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Test Jo&apos;natish</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CASHBACK & LOYALTY */}
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Mijozlar Keshbek & Sodiqlik Dasturi
                </h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableCashback}
                  onChange={e => setFormData({ ...formData, enableCashback: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <p className="text-[11px] text-slate-500">
              Har bir xarid uchun mijozning bonus hisobiga foiz to&apos;planadi. Mijoz keyingi xaridlarida ushbu bonusdan to&apos;lov qilishi mumkin.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Keshbek Stavka Foizi (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={formData.cashbackRate}
                  onChange={e =>
                    setFormData({ ...formData, cashbackRate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-32 px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-500">% har bir xariddan</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: SCALE BARCODE PREFIX */}
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Elektron Tarozi Shtrix-kod Prefiksi
              </h4>
            </div>

            <p className="text-[11px] text-slate-500">
              Tarozi chiqaradigan 13 xonali shtrix-kodlar prefiksi (masalan, O&apos;zbekistonda standart &quot;21&quot; yoki &quot;22&quot;).
              Format: <b>PP + TTTTT + WWWWW + C</b> (Prefiks + PLU kod + Og&apos;irlik grammda + Nazorat raqami).
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={2}
                value={formData.scalePrefix}
                onChange={e => setFormData({ ...formData, scalePrefix: e.target.value })}
                className="w-24 px-3 py-2 text-center text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[11px] text-slate-500">Standart: 21 (yoki 22)</span>
            </div>
          </div>

          {/* SECTION 4: USD CURRENCY RATE */}
          <div className="p-4 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-violet-600" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Valyuta Kursi ($ 1 AQSh Dollari = so&apos;m)
              </h4>
            </div>

            <p className="text-[11px] text-slate-500">
              Qurilish mollari, kiyim-kechak yoki texnika tovarlari dollarga bog&apos;langan bo&apos;lsa, ushbu kurs o&apos;zgarganda ularning so&apos;mdagi narxlari avtomatik qayta hisoblanadi.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1000"
                step="50"
                value={formData.usdRate || 12850}
                onChange={e => setFormData({ ...formData, usdRate: parseFloat(e.target.value) || 12850 })}
                className="w-36 px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500"
              />
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">so&apos;m (Masalan: 12,850)</span>
            </div>
          </div>

          {/* SECTION 5: DATABASE BACKUP & TELEGRAM BOT COMMANDS */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Baza Zaxirasi (Backup) & Telegram Bot Buyruqlari
              </h4>
            </div>

            <p className="text-[11px] text-slate-500">
              Ma&apos;lumotlar bazasi har kecha soat 23:30 da Telegram botingizga avtomatik arxivlanib yuboriladi. Istalgan vaqtda quyidagi tugmalar orqali zaxira olishingiz mumkin:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={downloadingBackup}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs"
              >
                {downloadingBackup ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                )}
                <span>Bazani Yuklab Olish (.ZIP)</span>
              </button>

              <button
                type="button"
                onClick={handleSendBackupToTelegram}
                disabled={sendingBackup || !formData.telegramBotToken || !formData.telegramChatId}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-40 shadow-xs"
              >
                {sendingBackup ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Telegramga Zaxira Yuborish</span>
              </button>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                🤖 Do&apos;kon egasi uchun Telegram tezkor buyruqlari:
              </div>
              <div className="text-slate-500 font-mono text-[10px] space-y-0.5">
                <div>• <b className="text-indigo-600 dark:text-indigo-400">/bugun</b> — Bugungi savdo va sof foyda hisoboti</div>
                <div>• <b className="text-indigo-600 dark:text-indigo-400">/kassa</b> — Faol smena va kassadagi naqd pul</div>
                <div>• <b className="text-indigo-600 dark:text-indigo-400">/qarzlar</b> — Nasiya qarzdorlar ro&apos;yxati va summasi</div>
                <div>• <b className="text-indigo-600 dark:text-indigo-400">/kamqoldi</b> — Zaxirasi tugayotgan tovarlar</div>
                <div>• <b className="text-indigo-600 dark:text-indigo-400">/backup</b> — Bazaning yangi nusxasini botga olish</div>
                <div>• <b className="text-indigo-600 dark:text-indigo-400">901234567</b> — Mijoz telefon raqamini yozib, qarz va keshbekini tekshirish</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
            >
              {loading ? "Saqlanmoqda..." : "Sozlamalarni Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
