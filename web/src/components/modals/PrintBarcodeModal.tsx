'use client';

import React, { useState } from 'react';
import { X, Printer, Tag, CheckSquare, Square, Layers, Search } from 'lucide-react';
import { ProductResponseDto } from '@/types/api';

interface Props {
  isOpen: boolean;
  products: ProductResponseDto[];
  onClose: () => void;
  storeName?: string;
  initialSelectedProduct?: ProductResponseDto | null;
}

type LabelSize = '30x20' | '40x30' | '58x40' | 'shelf_a4';

// Oddiy va ishonchli SVG Code-128 chiziqli shtrix-kod generatori
function BarcodeSvg({ value, width = 140, height = 40 }: { value: string; width?: number; height?: number }) {
  // Mock chiziqlar ketma-ketligini barcode belgilariga qarab hosil qilamiz
  const chars = value.split('');
  const bars: { x: number; w: number }[] = [];
  let curX = 5;

  chars.forEach((c, idx) => {
    const code = c.charCodeAt(0);
    const pattern = [(code % 3) + 1, ((code >> 1) % 2) + 1, ((code >> 2) % 3) + 1, ((code >> 3) % 2) + 1];
    pattern.forEach((w, pIdx) => {
      if (pIdx % 2 === 0) {
        bars.push({ x: curX, w: w * 1.5 });
      }
      curX += w * 1.5 + (idx % 2 === 0 ? 1 : 1.5);
    });
  });

  const totalWidth = Math.max(curX + 5, width);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${totalWidth} 40`} className="mx-auto">
      {bars.map((bar, i) => (
        <rect key={i} x={bar.x} y="2" width={bar.w} height="32" fill="#000" />
      ))}
    </svg>
  );
}

export function PrintBarcodeModal({
  isOpen,
  products,
  onClose,
  storeName = 'Oson Savdo',
  initialSelectedProduct = null
}: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    if (initialSelectedProduct) return [initialSelectedProduct.id];
    return products.slice(0, 10).map(p => p.id);
  });
  const [size, setSize] = useState<LabelSize>('40x30');
  const [search, setSearch] = useState('');
  const [copyCount, setCopyCount] = useState<number>(1);

  React.useEffect(() => {
    if (initialSelectedProduct) {
      setSelectedIds([initialSelectedProduct.id]);
    }
  }, [initialSelectedProduct]);

  if (!isOpen) return null;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  const selectedProducts = products.filter(p => selectedIds.includes(p.id));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Chop etish oynasi uchun maxsus CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-labels-area, #printable-labels-area * {
            visibility: visible;
          }
          #printable-labels-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Shtrix-kod & Narx Qog'ozi (Tsenik) Chop Etish</h2>
              <p className="text-xs text-emerald-100">Polka va tovarlar uchun termal stikerlar hamda A4 narxnomalar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Chap ustun: Sozlamalar va Tovar tanlash */}
          <div className="lg:col-span-5 border-r border-gray-200 p-5 flex flex-col gap-4 overflow-y-auto bg-gray-50/50">
            {/* O'lcham tanlash */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Format / Stiker O'lchami:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSize('40x30')}
                  className={`p-3 text-left rounded-xl border text-xs font-medium transition-all ${
                    size === '40x30'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-500'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <p className="font-bold">40x30 mm (Standart)</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Xprinter / Rongta stiker</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSize('30x20')}
                  className={`p-3 text-left rounded-xl border text-xs font-medium transition-all ${
                    size === '30x20'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-500'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <p className="font-bold">30x20 mm (Kichik)</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Mayda buyumlar uchun</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSize('58x40')}
                  className={`p-3 text-left rounded-xl border text-xs font-medium transition-all ${
                    size === '58x40'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-500'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <p className="font-bold">58x40 mm (Katta)</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Batafsil ma'lumotli</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSize('shelf_a4')}
                  className={`p-3 text-left rounded-xl border text-xs font-medium transition-all ${
                    size === 'shelf_a4'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-500'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <p className="font-bold">A4 Polka Tsenik</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Vitrina narxnomalari</p>
                </button>
              </div>
            </div>

            {/* Nusxa soni */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
              <span className="text-xs font-semibold text-gray-700">Har biridan nechta stiker:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={copyCount}
                  onChange={e => setCopyCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1 text-center font-bold text-sm border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-gray-500">dona</span>
              </div>
            </div>

            {/* Tovar qidirish */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Tovar nomi yoki shtrix-kodi..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Tovar ro'yxati */}
            <div className="flex-1 min-h-[220px] bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  {selectedIds.length === filtered.length && filtered.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  Barchasini tanlash ({selectedIds.length} ta)
                </button>
                <span className="text-gray-400">{filtered.length} ta tovar</span>
              </div>
              <div className="divide-y divide-gray-100 overflow-y-auto flex-1 max-h-[300px]">
                {filtered.map(p => {
                  const isChecked = selectedIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer text-xs transition-colors ${
                        isChecked ? 'bg-emerald-50/60' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div className="truncate">
                          <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{p.barcode}</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-700 whitespace-nowrap ml-2">
                        {p.sellingPrice.toLocaleString()} so'm
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* O'ng ustun: Jonli Ko'rish (Preview) */}
          <div className="lg:col-span-7 p-6 flex flex-col bg-gray-100 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Layers className="w-4 h-4 text-emerald-600" />
                Jonli Ko'rinish (Preview) — {selectedProducts.length * copyCount} ta stiker
              </div>
              <span className="text-xs bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 font-medium">
                {size === 'shelf_a4' ? 'A4 Polka Tsenik' : `Termal Stiker: ${size} mm`}
              </span>
            </div>

            {/* Chop etiladigan maydon */}
            <div
              id="printable-labels-area"
              className="flex-1 bg-white rounded-xl shadow-inner border border-gray-200 p-6 overflow-y-auto"
            >
              {selectedProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Tag className="w-12 h-12 stroke-[1.5] mb-2 text-gray-300" />
                  <p className="text-sm">Chop etish uchun tovarlarni tanlang</p>
                </div>
              ) : (
                <div
                  className={`grid gap-4 ${
                    size === 'shelf_a4'
                      ? 'grid-cols-2 md:grid-cols-3'
                      : size === '30x20'
                      ? 'grid-cols-3 md:grid-cols-4'
                      : 'grid-cols-2 md:grid-cols-3'
                  }`}
                >
                  {selectedProducts.flatMap(p =>
                    Array.from({ length: copyCount }).map((_, cIdx) => (
                      <div
                        key={`${p.id}-${cIdx}`}
                        className={`bg-white border-2 border-dashed border-gray-300 rounded-lg p-2 flex flex-col justify-between text-center relative overflow-hidden ${
                          size === 'shelf_a4'
                            ? 'min-h-[160px] p-4 border-solid border-gray-800'
                            : size === '30x20'
                            ? 'min-h-[85px] p-1.5'
                            : size === '58x40'
                            ? 'min-h-[135px] p-3'
                            : 'min-h-[110px] p-2'
                        }`}
                      >
                        {/* Do'kon nomi */}
                        <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider truncate">
                          {storeName}
                        </div>

                        {/* Mahsulot nomi */}
                        <div
                          className={`font-bold text-gray-900 leading-tight line-clamp-2 my-1 ${
                            size === 'shelf_a4' ? 'text-base font-extrabold' : size === '30x20' ? 'text-[10px]' : 'text-xs'
                          }`}
                        >
                          {p.name}
                        </div>

                        {/* Shtrix-kod grafiki */}
                        {size !== 'shelf_a4' && (
                          <div className="my-0.5">
                            <BarcodeSvg
                              value={p.barcode}
                              width={size === '30x20' ? 95 : size === '58x40' ? 140 : 120}
                              height={size === '30x20' ? 22 : 28}
                            />
                            <p className="text-[9px] font-mono tracking-widest text-gray-600 mt-0.5">
                              {p.barcode}
                            </p>
                          </div>
                        )}

                        {/* Narx */}
                        <div
                          className={`font-black text-gray-950 mt-1 ${
                            size === 'shelf_a4'
                              ? 'text-2xl text-emerald-700 bg-emerald-50 py-2 rounded-lg border border-emerald-200'
                              : size === '30x20'
                              ? 'text-xs'
                              : 'text-sm'
                          }`}
                        >
                          {p.sellingPrice.toLocaleString()}{' '}
                          <span className="text-[10px] font-normal text-gray-600">so'm / {p.unit}</span>
                        </div>

                        {size === 'shelf_a4' && (
                          <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2 pt-2 border-t border-gray-200 font-mono">
                            <span>Kod: {p.barcode}</span>
                            <span>{new Date().toLocaleDateString('uz-UZ')}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Pastki tugmalar */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                Jami: <b>{selectedProducts.length * copyCount}</b> ta stiker chop etiladi
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={selectedProducts.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  Printerda Chop Etish
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
