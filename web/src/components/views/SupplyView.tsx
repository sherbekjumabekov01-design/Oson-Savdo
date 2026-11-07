'use client';

import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  DollarSign,
  FileText,
  Calendar,
  Building,
  Phone,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  SupplierResponseDto,
  SupplyInvoiceResponseDto,
  CreateSupplyInvoiceDto,
  CreateSupplierDto,
  PaySupplierDebtDto
} from '@/types/api';

interface Props {
  suppliers: SupplierResponseDto[];
  invoices: SupplyInvoiceResponseDto[];
  loading: boolean;
  onCreateSupplier: (dto: CreateSupplierDto) => Promise<void>;
  onPayDebt: (dto: PaySupplierDebtDto) => Promise<void>;
  onReceiveGoods: (dto: CreateSupplyInvoiceDto) => Promise<void>;
}

export function SupplyView({
  suppliers,
  invoices,
  loading,
  onCreateSupplier,
  onPayDebt,
  onReceiveGoods
}: Props) {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'invoices'>('invoices');
  const [search, setSearch] = useState('');

  // Modals
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [isReceiveGoodsOpen, setIsReceiveGoodsOpen] = useState(false);
  const [isPayDebtOpen, setIsPayDebtOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierResponseDto | null>(null);

  // New Supplier Form
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('+998 ');
  const [supCompany, setSupCompany] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Pay Debt Form
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  // Kirim Hujjati Form (Receive Goods)
  const [invoiceSupplierId, setInvoiceSupplierId] = useState<number | ''>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoicePaidAmount, setInvoicePaidAmount] = useState('0');
  const [invoiceNote, setInvoiceNote] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<
    { barcode: string; name: string; quantity: number; costPrice: number; sellingPrice: number; unit: string }[]
  >([
    { barcode: '', name: '', quantity: 10, costPrice: 10000, sellingPrice: 14000, unit: 'dona' }
  ]);

  const handleAddInvoiceItem = () => {
    setInvoiceItems(prev => [
      ...prev,
      { barcode: '', name: '', quantity: 10, costPrice: 10000, sellingPrice: 14000, unit: 'dona' }
    ]);
  };

  const handleRemoveInvoiceItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setInvoiceItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const invoiceTotal = invoiceItems.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);

  const handleSubmitReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceItems.length === 0) return;

    await onReceiveGoods({
      supplierId: invoiceSupplierId ? Number(invoiceSupplierId) : null,
      invoiceNumber: invoiceNumber.trim() || `KIRIM-${Date.now().toString().slice(-6)}`,
      paidAmount: parseFloat(invoicePaidAmount) || 0,
      note: invoiceNote,
      items: invoiceItems.map(it => ({
        barcode: it.barcode,
        name: it.name,
        quantity: it.quantity,
        costPrice: it.costPrice,
        sellingPrice: it.sellingPrice,
        unit: it.unit || 'dona'
      }))
    });

    setIsReceiveGoodsOpen(false);
    setInvoiceItems([
      { barcode: '', name: '', quantity: 10, costPrice: 10000, sellingPrice: 14000, unit: 'dona' }
    ]);
  };

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    await onCreateSupplier({
      name: supName.trim(),
      phone: supPhone.trim(),
      company: supCompany.trim(),
      address: supAddress.trim()
    });
    setIsNewSupplierOpen(false);
    setSupName('');
    setSupCompany('');
  };

  const handleSubmitPayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const amt = parseFloat(payAmount) || 0;
    if (amt <= 0) return;
    await onPayDebt({
      supplierId: selectedSupplier.id,
      amount: amt,
      note: payNote
    });
    setIsPayDebtOpen(false);
    setPayAmount('');
    setSelectedSupplier(null);
  };

  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + s.totalDebtToSupplier, 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold">Ta&apos;minotchilardan jami qarzimiz:</p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {totalSupplierDebt.toLocaleString()} so&apos;m
            </p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold">Jami Ta&apos;minotchilar:</p>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
              {suppliers.length} ta hamkor
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold">Kirim Hujjatlari:</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {invoices.length} ta qabul
            </p>
          </div>
          <button
            onClick={() => setIsReceiveGoodsOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            Yangi Kirim
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'invoices'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500'
            }`}
          >
            Kirim Tarixi (Hujjatlar)
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'suppliers'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500'
            }`}
          >
            Ta&apos;minotchilar Ro&apos;yxati
          </button>
        </div>

        {activeTab === 'suppliers' && (
          <button
            onClick={() => setIsNewSupplierOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition self-end sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Ta&apos;minotchi qo&apos;shish
          </button>
        )}
      </div>

      {/* Table Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {activeTab === 'invoices' ? (
          /* INVOICES TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-3 px-4 font-semibold">Hujjat #</th>
                  <th className="py-3 px-4 font-semibold">Sana</th>
                  <th className="py-3 px-4 font-semibold">Ta&apos;minotchi</th>
                  <th className="py-3 px-4 font-semibold text-center">Tovarlar</th>
                  <th className="py-3 px-4 font-semibold text-right">Jami Summa</th>
                  <th className="py-3 px-4 font-semibold text-right">To&apos;langan</th>
                  <th className="py-3 px-4 font-semibold text-right">Qarzga Qolgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Hozircha kirim hujjatlari mavjud emas.
                    </td>
                  </tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">#{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(inv.createdAt).toLocaleString('uz-UZ')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-white">
                        {inv.supplierName || 'Noma\'lum'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-[10px]">
                          {inv.items.length} xil
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-800 dark:text-white">
                        {inv.totalAmount.toLocaleString()} so&apos;m
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {inv.paidAmount.toLocaleString()} so&apos;m
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        {inv.debtAmount > 0 ? `${inv.debtAmount.toLocaleString()} so'm` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* SUPPLIERS TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-3 px-4 font-semibold">Ta&apos;minotchi</th>
                  <th className="py-3 px-4 font-semibold">Telefon</th>
                  <th className="py-3 px-4 font-semibold">Kompaniya</th>
                  <th className="py-3 px-4 font-semibold text-right">Bizning Qarzimiz</th>
                  <th className="py-3 px-4 font-semibold text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      Ta&apos;minotchilar ro&apos;yxati bo&apos;sh.
                    </td>
                  </tr>
                ) : (
                  suppliers.map(sup => (
                    <tr key={sup.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{sup.name}</td>
                      <td className="py-3 px-4 text-slate-500">{sup.phone || '-'}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{sup.company || '-'}</td>
                      <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400">
                        {sup.totalDebtToSupplier.toLocaleString()} so&apos;m
                      </td>
                      <td className="py-3 px-4 text-right">
                        {sup.totalDebtToSupplier > 0 && (
                          <button
                            onClick={() => {
                              setSelectedSupplier(sup);
                              setPayAmount(sup.totalDebtToSupplier.toString());
                              setIsPayDebtOpen(true);
                            }}
                            className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                          >
                            Qarz to&apos;lash
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: YANGI KIRIM HUJJATI (RECEIVE GOODS) */}
      {isReceiveGoodsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-800 dark:text-white">
                  Yangi Kirim Hujjati (Tovarlar Qabuli)
                </h2>
              </div>
              <button onClick={() => setIsReceiveGoodsOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitReceive} className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ta&apos;minotchi
                  </label>
                  <select
                    value={invoiceSupplierId}
                    onChange={e => setInvoiceSupplierId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    <option value="">-- Noma&apos;lum / Boshqa --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.company || s.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hujjat / Faktura raqami
                  </label>
                  <input
                    type="text"
                    placeholder="KIRIM-1001"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    To&apos;langan qismi (so&apos;m)
                  </label>
                  <input
                    type="number"
                    value={invoicePaidAmount}
                    onChange={e => setInvoicePaidAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-emerald-600"
                  />
                </div>
              </div>

              {/* Kirim qilinayotgan tovarlar qatorlari */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white">Qabul qilinayotgan tovarlar:</h3>
                  <button
                    type="button"
                    onClick={handleAddInvoiceItem}
                    className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Qator qo&apos;shish
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                  {invoiceItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-6 gap-2 items-center"
                    >
                      <input
                        type="text"
                        placeholder="Shtrix-kod"
                        value={item.barcode}
                        onChange={e => handleUpdateItem(idx, 'barcode', e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700 border rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Mahsulot nomi"
                        required
                        value={item.name}
                        onChange={e => handleUpdateItem(idx, 'name', e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700 border rounded-lg sm:col-span-2"
                      />
                      <input
                        type="number"
                        placeholder="Soni"
                        required
                        min="0.1"
                        step="any"
                        value={item.quantity}
                        onChange={e => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="px-2 py-1.5 text-xs bg-white dark:bg-slate-700 border rounded-lg text-center"
                      />
                      <input
                        type="number"
                        placeholder="Kelish narxi"
                        required
                        min="0"
                        value={item.costPrice}
                        onChange={e => handleUpdateItem(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                        className="px-2 py-1.5 text-xs bg-white dark:bg-slate-700 border rounded-lg text-right"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="Sotish narxi"
                          required
                          min="0"
                          value={item.sellingPrice}
                          onChange={e => handleUpdateItem(idx, 'sellingPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-700 border rounded-lg text-right font-bold text-emerald-600"
                        />
                        {invoiceItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveInvoiceItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500">Jami hisob: </span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {invoiceTotal.toLocaleString()} so&apos;m
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Qarzga yoziladi: </span>
                  <span className="font-bold text-rose-600">
                    {Math.max(0, invoiceTotal - (parseFloat(invoicePaidAmount) || 0)).toLocaleString()} so&apos;m
                  </span>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsReceiveGoodsOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition"
                >
                  Kirimni Saqlash & Qoldiqni Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TA'MINOTCHI QO'SHISH */}
      {isNewSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">
              Yangi Ta&apos;minotchi (Postavshik)
            </h2>
            <form onSubmit={handleSubmitSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ta&apos;minotchi / Mas&apos;ul shaxs ismi *
                </label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={e => setSupName(e.target.value)}
                  placeholder="Masalan: Sardor Komilov"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telefon raqami
                </label>
                <input
                  type="text"
                  value={supPhone}
                  onChange={e => setSupPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kompaniya / Firma nomi
                </label>
                <input
                  type="text"
                  value={supCompany}
                  onChange={e => setSupCompany(e.target.value)}
                  placeholder="Marqand Food MCHJ"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TA'MINOTCHIGA QARZ TO'LASH */}
      {isPayDebtOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-2">
              Ta&apos;minotchiga Qarz To&apos;lovi
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Hamkor: <span className="font-bold text-slate-800 dark:text-white">{selectedSupplier.name}</span>
            </p>
            <form onSubmit={handleSubmitPayDebt} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  To&apos;lanayotgan summa (so&apos;m)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedSupplier.totalDebtToSupplier}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border rounded-xl text-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Izoh (chekka yozish)
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  placeholder="Kassadan naqd to'landi..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayDebtOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  To&apos;lovni Tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
