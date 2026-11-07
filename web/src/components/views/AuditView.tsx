'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Barcode,
  Save,
  Check,
  RotateCcw,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { apiService } from '@/services/api';
import { InventoryAuditResponseDto, ProductResponseDto } from '@/types/api';

interface Props {
  products: ProductResponseDto[];
  onRefreshProducts: () => void;
}

export function AuditView({ products, onRefreshProducts }: Props) {
  const [audits, setAudits] = useState<InventoryAuditResponseDto[]>([]);
  const [activeAudit, setActiveAudit] = useState<InventoryAuditResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [discrepancyOnly, setDiscrepancyOnly] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const list = await apiService.getAudits();
      setAudits(list);
      if (list.length > 0 && !activeAudit) {
        // Agar ochiq (Draft) reviziya bo'lsa, o'shani tanlaymiz
        const draft = list.find(a => a.status === 'Draft') || list[0];
        setActiveAudit(draft);
      }
    } catch (err: any) {
      console.error('Reviziyalarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const handleStartNewAudit = async () => {
    if (!confirm('Yangi inventarizatsiya (reviziya) boshlashni tasdiqlaysizmi? Barcha mavjud tovarlar qoldiqlari ro\'yxatga olinadi.'))
      return;

    try {
      setActionLoading(true);
      const newAudit = await apiService.createAudit({
        note: `Reviziya sana: ${new Date().toLocaleDateString('uz-UZ')}`
      });
      setActiveAudit(newAudit);
      await fetchAudits();
      setStatusMessage('Yangi reviziya muvaffaqiyatli ochildi!');
    } catch (err: any) {
      alert(err.message || 'Reviziyani ochishda xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScanBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim() || !activeAudit || activeAudit.status === 'Completed') return;

    const trimmed = barcodeInput.trim();
    setBarcodeInput('');

    const item = activeAudit.items.find(i => i.barcode === trimmed || i.productName.toLowerCase().includes(trimmed.toLowerCase()));
    if (!item) {
      setStatusMessage(`Diqqat: '${trimmed}' shtrix-kodli tovar reviziya ro'yxatida topilmadi!`);
      return;
    }

    try {
      const updated = await apiService.updateAuditItem(activeAudit.id, {
        productId: item.productId,
        actualQuantity: item.actualQuantity + 1
      });
      setActiveAudit(updated);
      setStatusMessage(`✅ ${item.productName}: 1 dona qo'shildi (Jami: ${item.actualQuantity + 1})`);
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  const handleQuantityChange = async (productId: number, val: number) => {
    if (!activeAudit || activeAudit.status === 'Completed') return;

    try {
      const updated = await apiService.updateAuditItem(activeAudit.id, {
        productId,
        actualQuantity: Math.max(0, val)
      });
      setActiveAudit(updated);
    } catch (err: any) {
      alert(err.message || 'Yangilashda xatolik');
    }
  };

  const handleCompleteAudit = async () => {
    if (!activeAudit) return;
    if (!confirm(`DIQQAT: Reviziyani yakunlamoqchimisiz?\n\nTasdiqlasangiz, ombordagi barcha tovarlar soni ushbu haqiqiy sanalgan miqdorga O'ZGARTIRILADI!`))
      return;

    try {
      setActionLoading(true);
      const completed = await apiService.completeAudit(activeAudit.id);
      setActiveAudit(completed);
      await fetchAudits();
      onRefreshProducts();
      alert('Inventarizatsiya muvaffaqiyatli yakunlandi va do\'kon tovar qoldiqlari yangilandi!');
    } catch (err: any) {
      alert(err.message || 'Yakunlashda xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredItems = (activeAudit?.items || []).filter(item => {
    const matchSearch =
      item.productName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.barcode.includes(searchFilter);
    const matchDisc = discrepancyOnly ? item.difference !== 0 : true;
    return matchSearch && matchDisc;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Inventarizatsiya & Reviziya Moduli
            </h1>
            <p className="text-xs text-gray-500">
              Do'kondagi tovarlarni skanerlab sanash, kamomad va ortiqchalik dalolatnomasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAudits}
            className="p-2.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-gray-200 transition-colors"
            title="Yangilash"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleStartNewAudit}
            disabled={actionLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Yangi Reviziya Boshlash
          </button>
        </div>
      </div>

      {/* Reviziyalar ro'yxati (Chips) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {audits.map(a => {
          const isSelected = activeAudit?.id === a.id;
          const isDraft = a.status === 'Draft';
          return (
            <button
              key={a.id}
              onClick={() => setActiveAudit(a)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{a.auditNumber}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : isDraft
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isDraft ? 'Jarayonda' : 'Yakunlangan'}
              </span>
            </button>
          );
        })}
      </div>

      {activeAudit && (
        <>
          {/* KPI Kartalar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Kutilgan Qoldiq
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-gray-900">
                  {activeAudit.totalExpectedQty}
                </span>
                <span className="text-xs text-gray-400">dona tovar</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Dasturdagi hisob bo'yicha</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sanalgan Haqiqiy Qoldiq
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-blue-600">
                  {activeAudit.totalActualQty}
                </span>
                <span className="text-xs text-blue-400">dona sanaldi</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Skanerlangan yoki kiritilgan</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Farq (Kamomad / Ortiqcha)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-2xl font-black ${
                    activeAudit.totalDifferenceQty < 0
                      ? 'text-rose-600'
                      : activeAudit.totalDifferenceQty > 0
                      ? 'text-emerald-600'
                      : 'text-gray-700'
                  }`}
                >
                  {activeAudit.totalDifferenceQty > 0 ? `+${activeAudit.totalDifferenceQty}` : activeAudit.totalDifferenceQty}
                </span>
                <span className="text-xs text-gray-400">dona farq</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {activeAudit.totalDifferenceQty < 0
                  ? 'Kamomad aniqlandi'
                  : activeAudit.totalDifferenceQty > 0
                  ? 'Ortiqcha tovar chiqdi'
                  : 'To\'liq mos keldi'}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Summaviy Farq (Tannarxda)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-2xl font-black ${
                    activeAudit.totalDifferenceCost < 0
                      ? 'text-rose-600'
                      : activeAudit.totalDifferenceCost > 0
                      ? 'text-emerald-600'
                      : 'text-gray-700'
                  }`}
                >
                  {activeAudit.totalDifferenceCost.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400">so'm</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {activeAudit.totalDifferenceCost < 0 ? 'Moddiy zarar' : 'Ortiqcha qiymat'}
              </p>
            </div>
          </div>

          {/* Skaner va Qidiruv qatori */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleScanBarcode} className="w-full md:w-96 flex items-center gap-2">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 text-emerald-600 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Shtrix-kodni skanerlang yoki kiriting..."
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  disabled={activeAudit.status === 'Completed'}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={activeAudit.status === 'Completed' || !barcodeInput.trim()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                Qo'shish
              </button>
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Qidiruv */}
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Jadvaldan tovar qidirish..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Faqat farqlilarni ko'rsatish */}
              <button
                type="button"
                onClick={() => setDiscrepancyOnly(!discrepancyOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                  discrepancyOnly
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Faqat Farqlilar ({activeAudit.items.filter(i => i.difference !== 0).length})
              </button>

              {/* Yakunlash tugmasi */}
              {activeAudit.status === 'Draft' ? (
                <button
                  type="button"
                  onClick={handleCompleteAudit}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 whitespace-nowrap"
                >
                  <Check className="w-4 h-4" />
                  Reviziyani Tasdiqlash
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Yakunlangan ({new Date(activeAudit.completedAt || activeAudit.createdAt).toLocaleDateString()})
                </span>
              )}
            </div>
          </div>

          {statusMessage && (
            <div className="px-4 py-2.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center justify-between">
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage(null)} className="text-emerald-600 hover:text-emerald-900">
                &times;
              </button>
            </div>
          )}

          {/* Jadval */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 text-gray-600 uppercase tracking-wider font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3.5">Tovar Nomi & Shtrix-kod</th>
                    <th className="px-4 py-3.5 text-center">Tannarx</th>
                    <th className="px-4 py-3.5 text-center">Kutilgan Qoldiq</th>
                    <th className="px-4 py-3.5 text-center">Haqiqiy Sanalgan</th>
                    <th className="px-4 py-3.5 text-center">Farq (Dona)</th>
                    <th className="px-4 py-3.5 text-right">Summaviy Farq</th>
                    <th className="px-4 py-3.5 text-center">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map(item => {
                    const isDiff = item.difference !== 0;
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50/50 transition-colors ${
                          item.difference < 0
                            ? 'bg-rose-50/30'
                            : item.difference > 0
                            ? 'bg-emerald-50/30'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900">{item.productName}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{item.barcode}</p>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {item.costPrice.toLocaleString()} so'm
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-700">
                          {item.expectedQuantity}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {activeAudit.status === 'Draft' ? (
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.actualQuantity}
                              onChange={e =>
                                handleQuantityChange(item.productId, parseFloat(e.target.value) || 0)
                              }
                              className="w-20 px-2 py-1 text-center font-bold text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          ) : (
                            <span className="font-bold text-gray-900">{item.actualQuantity}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-black px-2 py-0.5 rounded text-xs ${
                              item.difference < 0
                                ? 'bg-rose-100 text-rose-700'
                                : item.difference > 0
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold ${
                            item.differenceCost < 0
                              ? 'text-rose-600'
                              : item.differenceCost > 0
                              ? 'text-emerald-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {item.differenceCost.toLocaleString()} so'm
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.difference === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> To'g'ri
                            </span>
                          ) : item.difference < 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                              <AlertCircle className="w-3.5 h-3.5" /> Kamomad
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600">
                              <Plus className="w-3.5 h-3.5" /> Ortiqcha
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
