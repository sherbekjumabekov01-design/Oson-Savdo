'use client';

import React, { useState } from 'react';
import { X, Barcode, Package, DollarSign, AlertCircle, Scale, Calendar } from 'lucide-react';
import { CreateProductDto } from '@/types/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateProductDto) => Promise<void>;
  usdRate?: number;
}

export function AddProductModal({ isOpen, onClose, onSubmit, usdRate = 12850 }: Props) {
  const [formData, setFormData] = useState<CreateProductDto>({
    barcode: '',
    name: '',
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    unit: 'dona',
    minStockAlert: 5,
    isWeighted: false,
    pluCode: '',
    expiryDate: '',
    isUsdPrice: false,
    costPriceUsd: 0,
    sellingPriceUsd: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const generateBarcode = () => {
    // Standard EAN-13 ichki shtrix-kod generatsiyasi (200 prefiks + nazorat raqami)
    const prefix = '200';
    let code = prefix + Math.floor(100000000 + Math.random() * 900000000).toString().substring(0, 9);
    while (code.length < 12) code += '0';
    code = code.substring(0, 12);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(code[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checksum = (10 - (sum % 10)) % 10;
    const finalBarcode = code + checksum;
    setFormData(prev => ({ ...prev, barcode: finalBarcode }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.barcode || !formData.name) {
      setError("Iltimos, shtrix-kod va tovar nomini to'ldiring.");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Yangi Tovar Qo&apos;shish</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ombor va POS uchun tovar parametrlarini kiriting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Shtrix-kod */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Shtrix-kod (Skaner yoki Qo&apos;lda)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Masalan: 4780012345678"
                  value={formData.barcode}
                  onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={generateBarcode}
                className="px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Auto-kod
              </button>
            </div>
          </div>

          {/* Nomi */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Tovar Nomi
            </label>
            <input
              type="text"
              required
              placeholder="Masalan: Coca-Cola 1.5L"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Narxlar (Valyuta va So'm) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Narxlar {formData.isUsdPrice ? `(Kurs: $1 = ${usdRate.toLocaleString()} so'm)` : ''}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !formData.isUsdPrice;
                  setFormData(prev => ({
                    ...prev,
                    isUsdPrice: nextVal,
                    costPriceUsd: nextVal && prev.costPrice > 0 ? +(prev.costPrice / usdRate).toFixed(2) : prev.costPriceUsd,
                    sellingPriceUsd: nextVal && prev.sellingPrice > 0 ? +(prev.sellingPrice / usdRate).toFixed(2) : prev.sellingPriceUsd
                  }));
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                  formData.isUsdPrice
                    ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {formData.isUsdPrice ? '✓ Dollarda ($)' : '💵 Dollarga ($) bog\'lash'}
              </button>
            </div>

            {formData.isUsdPrice ? (
              <div className="grid grid-cols-2 gap-4 p-3 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 rounded-xl">
                <div>
                  <label className="block text-[11px] font-bold text-violet-900 dark:text-violet-300 mb-1">
                    Tannarx ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.costPriceUsd || ''}
                    onChange={e => {
                      const usd = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        costPriceUsd: usd,
                        costPrice: Math.round(usd * usdRate)
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    ≈ {(formData.costPrice || 0).toLocaleString()} so&apos;m
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-violet-900 dark:text-violet-300 mb-1">
                    Sotuv Narxi ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.sellingPriceUsd || ''}
                    onChange={e => {
                      const usd = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        sellingPriceUsd: usd,
                        sellingPrice: Math.round(usd * usdRate)
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    ≈ {(formData.sellingPrice || 0).toLocaleString()} so&apos;m
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Tannarx (so&apos;m)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={formData.costPrice || ''}
                      onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Sotuv Narxi (so&apos;m)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="100"
                      required
                      value={formData.sellingPrice || ''}
                      onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Qoldiq va Birlik */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Boshlang&apos;ich Qoldiq
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.stockQuantity || ''}
                onChange={e => setFormData({ ...formData, stockQuantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                O&apos;lchov Birligi
              </label>
              <select
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="dona">dona</option>
                <option value="kg">kg</option>
                <option value="litr">litr</option>
                <option value="metr">metr</option>
                <option value="pachka">pachka</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Min. Chegara
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.minStockAlert || ''}
                onChange={e => setFormData({ ...formData, minStockAlert: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Tarozi & Yaroqlilik muddati */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isWeighted || false}
                  onChange={e => {
                    const isW = e.target.checked;
                    setFormData({
                      ...formData,
                      isWeighted: isW,
                      unit: isW ? 'kg' : formData.unit
                    });
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-500" />
                  Tarozi Tovari (Elektron tarozi shtrix-kodi orqali)
                </span>
              </label>
            </div>

            {formData.isWeighted && (
              <div className="animate-in fade-in pt-1">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  PLU Kodi (Tarozidagi tovar raqami, masalan: 101)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: 101"
                  value={formData.pluCode || ''}
                  onChange={e => setFormData({ ...formData, pluCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Elektron tarozi chiqaradigan 13 xonali shtrix-kod ushbu PLU kod orqali avtomatik aniqlanadi.
                </p>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Yaroqlilik Muddati (Ixtiyoriy)
              </label>
              <input
                type="date"
                value={formData.expiryDate ? formData.expiryDate.split('T')[0] : ''}
                onChange={e => setFormData({ ...formData, expiryDate: e.target.value || undefined })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Footer tugmalari */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition"
            >
              {loading ? "Qo'shilmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
