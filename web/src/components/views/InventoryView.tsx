'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  AlertTriangle,
  Barcode,
  Package,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Download,
  Upload,
  Printer,
  Scale,
  Send,
  Calendar
} from 'lucide-react';
import { ProductResponseDto } from '@/types/api';
import { apiService } from '@/services/api';
import { PrintBarcodeModal } from '@/components/modals/PrintBarcodeModal';

interface Props {
  products: ProductResponseDto[];
  loading: boolean;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onDeleteProduct: (id: number) => Promise<void>;
  onRefresh: () => void;
  isCashierRole?: boolean;
}

export function InventoryView({
  products,
  loading,
  onOpenAddModal,
  onOpenImportModal,
  onDeleteProduct,
  isCashierRole = false
}: Props) {
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterExpiringSoon, setFilterExpiringSoon] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<ProductResponseDto | null>(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const pageSize = 10;

  const handleSendTelegramLowStock = async () => {
    try {
      setSendingAlert(true);
      const res = await apiService.sendLowStockAlert();
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'Telegramga yuborishda xatolik yuz berdi');
    } finally {
      setSendingAlert(false);
    }
  };

  // Filter products
  const filtered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase());

    const matchesLowStock = filterLowStock ? p.stockQuantity <= p.minStockAlert : true;
    const matchesUnit = selectedUnit === 'all' ? true : p.unit === selectedUnit;
    const matchesCategory = selectedCategory === 'all' ? true : p.category === selectedCategory;

    let matchesExpiry = true;
    if (filterExpiringSoon) {
      if (!p.expiryDate) {
        matchesExpiry = false;
      } else {
        const diffDays = (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        matchesExpiry = diffDays <= 30;
      }
    }

    return matchesSearch && matchesLowStock && matchesUnit && matchesCategory && matchesExpiry;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const units = Array.from(new Set(products.map(p => p.unit)));
  const categories = Array.from(new Set(products.map(p => p.category || 'Umumiy')));

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Nomi yoki shtrix-kod bo'yicha qidiruv..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filters and Add button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Barcha toifalar</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Unit filter */}
          <div className="relative">
            <select
              value={selectedUnit}
              onChange={e => {
                setSelectedUnit(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Barcha o&apos;lchovlar</option>
              {units.map(u => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Low stock toggle */}
          <button
            onClick={() => {
              setFilterLowStock(!filterLowStock);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 text-xs font-medium rounded-xl flex items-center gap-1.5 transition ${
              filterLowStock
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Kam qolganlar</span>
          </button>

          {/* Expiry filter toggle */}
          <button
            onClick={() => {
              setFilterExpiringSoon(!filterExpiringSoon);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 text-xs font-medium rounded-xl flex items-center gap-1.5 transition ${
              filterExpiringSoon
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Muddati yaqinlar</span>
          </button>

          {/* Telegram Low Stock Alert button */}
          {products.some(p => p.stockQuantity <= p.minStockAlert) && !isCashierRole && (
            <button
              onClick={handleSendTelegramLowStock}
              disabled={sendingAlert}
              className="px-3 py-2 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-900 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-sky-100 transition shadow-xs disabled:opacity-50"
              title="Kam qolgan tovarlar ro'yxatini do'kon egasining Telegramiga yuborish"
            >
              <Send className={`w-3.5 h-3.5 ${sendingAlert ? 'animate-spin' : ''}`} />
              <span>{sendingAlert ? 'Yuborilmoqda...' : 'Telegramga ogohlantirish'}</span>
            </button>
          )}

          {/* Barcode & Price Tag print button */}
          <button
            onClick={() => {
              setSelectedBarcodeProduct(products[0] || null);
              setIsBarcodeModalOpen(true);
            }}
            className="px-3 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition shadow-xs"
            title="Tovarlar uchun shtrix-kod va narx yorliqlarini (tsenik) chop etish"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Shtrix-kod / Tsenik</span>
          </button>

          {/* Excel Export */}
          <a
            href={apiService.getExportCsvUrl()}
            download
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            title="Barcha tovarlarni Excel (.CSV) ga eksport qilish"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Eksport (.CSV)</span>
          </a>

          {/* Excel Import button */}
          {!isCashierRole && (
            <button
              onClick={onOpenImportModal}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Excel Import</span>
            </button>
          )}

          {/* Add product button */}
          {!isCashierRole && (
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tovar Qo&apos;shish</span>
            </button>
          )}
        </div>
      </div>

      {/* Inventory table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="py-3 px-4 font-semibold">Shtrix-kod</th>
                <th className="py-3 px-4 font-semibold">Tovar Nomi</th>
                <th className="py-3 px-4 font-semibold">Toifa</th>
                {!isCashierRole && <th className="py-3 px-4 font-semibold text-right">Tannarx</th>}
                <th className="py-3 px-4 font-semibold text-right">Sotuv Narxi</th>
                {!isCashierRole && <th className="py-3 px-4 font-semibold text-right">Marja</th>}
                <th className="py-3 px-4 font-semibold text-center">Ombor Qoldig&apos;i</th>
                <th className="py-3 px-4 font-semibold text-center">Holat</th>
                {!isCashierRole && <th className="py-3 px-4 font-semibold text-right">Amal</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={isCashierRole ? 6 : 9} className="text-center py-12 text-slate-400">
                    Tovarlar yuklanmoqda...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={isCashierRole ? 6 : 9} className="text-center py-12 text-slate-400">
                    Mos keluvchi tovarlar topilmadi.
                  </td>
                </tr>
              ) : (
                paginated.map(p => {
                  const isLow = p.stockQuantity <= p.minStockAlert;
                  const marginPercent =
                    p.costPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.costPrice) * 100).toFixed(0) : 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${
                        isLow ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" />
                          {p.barcode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-white">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{p.name}</span>
                          {p.isWeighted && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[9px]">
                              <Scale className="w-2.5 h-2.5" />
                              Tarozi {p.pluCode ? `(PLU: ${p.pluCode})` : ''}
                            </span>
                          )}
                          {p.expiryDate && (
                            <span
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                new Date(p.expiryDate).getTime() < Date.now()
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  : (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 7
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              <Calendar className="w-2.5 h-2.5" />
                              Muddati: {new Date(p.expiryDate).toLocaleDateString('uz-UZ')}
                              {new Date(p.expiryDate).getTime() < Date.now() ? ' (O\'tgan!)' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {p.category || 'Umumiy'}
                        </span>
                      </td>
                      {!isCashierRole && (
                        <td className="py-3 px-4 text-right text-slate-500 font-mono">
                          <div>{p.costPrice.toLocaleString()} so&apos;m</div>
                          {p.isUsdPrice && p.costPriceUsd ? (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">${p.costPriceUsd.toFixed(2)}</div>
                          ) : null}
                        </td>
                      )}
                      <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-slate-100 font-mono">
                        <div>{p.sellingPrice.toLocaleString()} so&apos;m</div>
                        {p.isUsdPrice && p.sellingPriceUsd ? (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">${p.sellingPriceUsd.toFixed(2)}</div>
                        ) : null}
                      </td>
                      {!isCashierRole && (
                        <td className="py-3 px-4 text-right">
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            +{marginPercent}%
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-white">
                        {p.stockQuantity} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Kam qoldi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Yetarli
                          </span>
                        )}
                      </td>
                      {!isCashierRole && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedBarcodeProduct(p);
                                setIsBarcodeModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Shtrix-kod & Tsenik chop etish"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`'${p.name}' mahsulotini o'chirishga ishonchingiz komilmi?`)) {
                                  onDeleteProduct(p.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="O'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
          <div>
            Jami: <span className="font-bold text-slate-700 dark:text-slate-300">{filtered.length} ta</span> mahsulot
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Barcode & Price Tag Modal */}
      <PrintBarcodeModal
        isOpen={isBarcodeModalOpen}
        products={products}
        initialSelectedProduct={selectedBarcodeProduct}
        onClose={() => setIsBarcodeModalOpen(false)}
      />
    </div>
  );
}
