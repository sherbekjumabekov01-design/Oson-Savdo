'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { ImportResultDto } from '@/types/api';
import { apiService } from '@/services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportProductsModal({ isOpen, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResultDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiService.importProductsCsv(file);
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'CSV faylni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Excel / CSV orqali tovarlar yuklash</h2>
              <p className="text-xs text-slate-400">Ommaviy import va yangilash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {/* Step 1: Download Template */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">1. Namuna shablonni yuklab oling</p>
              <p className="text-[11px] text-slate-400">Excel yoki Calc dasturida to&apos;ldirish uchun tayyor CSV</p>
            </div>
            <a
              href={apiService.getTemplateCsvUrl()}
              download="Mahsulotlar_Shablon.csv"
              className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-100 transition shadow-xs shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Shablon (.CSV)
            </a>
          </div>

          {/* Step 2: Upload CSV File */}
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-white mb-2">
                2. To&apos;ldirilgan CSV faylni tanlang:
              </label>
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500 transition bg-slate-50/50 dark:bg-slate-800/20">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={e => {
                    if (e.target.files?.[0]) setFile(e.target.files[0]);
                  }}
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {file ? file.name : 'CSV faylni bu yerga tashlang yoki tanlang'}
                  </p>
                  <p className="text-[10px] text-slate-400">Faqat UTF-8 formatidagi CSV fayllar</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Import muvaffaqiyatli yakunlandi!</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div>Qayta ishlandi: <span className="font-bold">{result.totalProcessed}</span></div>
                  <div>Yangi qo&apos;shildi: <span className="font-bold text-emerald-600">{result.addedCount}</span></div>
                  <div>Yangilandi: <span className="font-bold text-blue-600">{result.updatedCount}</span></div>
                </div>
                {result.errors.length > 0 && (
                  <div className="pt-2 text-[10px] text-rose-500">
                    <p className="font-semibold">Ogohlantirishlar ({result.errors.length}):</p>
                    <ul className="list-disc pl-4 max-h-20 overflow-y-auto">
                      {result.errors.map((er, idx) => (
                        <li key={idx}>{er}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Tovarlar yuklanmoqda...' : 'Tovarlarni Bazaga Yuklash'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
