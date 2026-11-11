'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  BookOpen,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Sparkles,
  ArrowRight,
  UserPlus,
  QrCode,
  Scale,
  Gift,
  Keyboard,
  Pause,
  RotateCcw,
  X
} from 'lucide-react';
import {
  ProductResponseDto,
  CustomerResponseDto,
  CreateSaleDto,
  PaymentType,
  CurrentShiftSummaryDto,
  SaleResponseDto
} from '@/types/api';

interface CartItem {
  product: ProductResponseDto;
  quantity: number;
  discount: number;
}

interface HeldSale {
  id: string;
  heldAt: string;
  cart: CartItem[];
  customer?: CustomerResponseDto | null;
  overallDiscount: string;
  subtotal: number;
  totalAmount: number;
}

interface Props {
  products: ProductResponseDto[];
  customers: CustomerResponseDto[];
  shiftSummary: CurrentShiftSummaryDto | null;
  onOpenShiftModal: () => void;
  onSubmitSale: (dto: CreateSaleDto) => Promise<SaleResponseDto>;
  onSaleCompleted: (sale: SaleResponseDto) => void;
  onCreateCustomer: (name: string, phone: string) => Promise<CustomerResponseDto>;
  isCashierRole: boolean;
}

export function PosView({
  products,
  customers,
  shiftSummary,
  onOpenShiftModal,
  onSubmitSale,
  onSaleCompleted,
  onCreateCustomer,
  isCashierRole
}: Props) {
  // Savat holati
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [mobilePosTab, setMobilePosTab] = useState<'catalog' | 'cart'>('catalog');

  // To'lov parametrlari
  const [paymentType, setPaymentType] = useState<PaymentType>('Cash');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [overallDiscount, setOverallDiscount] = useState<string>('0');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  // Yangi mijoz qo'shish
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+998 ');

  // Aralash to'lov
  const [mixedCash, setMixedCash] = useState<string>('');
  const [mixedCard, setMixedCard] = useState<string>('');

  // Keshbek / Bonus & QR To'lov
  const [cashbackUsed, setCashbackUsed] = useState<number>(0);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Kechiktirilgan savdolar (Hold / Pause sales)
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('osonsavdo_held_sales');
      if (saved) {
        setHeldSales(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Global apparat (USB) shtrix-kod skaneri tinglovchisi
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Agar boshqa inputda yozilayotgan bo'lsa aralashmaymiz
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target.id !== 'barcode-scanner-input') {
        return;
      }

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          handleScanBarcode(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1) {
        // Tezkor terish (skaner 30ms ichida yozadi)
        if (diff < 60) {
          buffer += e.key;
        } else {
          buffer = e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const handleHoldSaleRef = useRef<() => void>(() => {});
  const handleProcessSaleRef = useRef<() => void>(() => {});
  const clearCartRef = useRef<() => void>(() => {});

  // Tezkor Klaviatura Tugmalari (Hotkeys: F1, F2, F3, F4, F6, F7, F9, Esc)
  useEffect(() => {
    const handleGlobalHotkeys = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        const searchInput = document.getElementById('pos-search-input') as HTMLInputElement | null;
        searchInput?.focus();
        searchInput?.select();
      } else if (e.key === 'F2') {
        e.preventDefault();
        setPaymentType('Cash');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setPaymentType('Card');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setPaymentType('Debt');
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleHoldSaleRef.current();
      } else if (e.key === 'F7') {
        e.preventDefault();
        setIsQrModalOpen(true);
      } else if (e.key === 'F9') {
        e.preventDefault();
        const disc = prompt("Savdoga umumiy chegirma (so'mda):", overallDiscount);
        if (disc !== null) setOverallDiscount(disc);
      } else if (e.key === 'Escape') {
        if (isQrModalOpen) {
          setIsQrModalOpen(false);
        } else if (isHeldModalOpen) {
          setIsHeldModalOpen(false);
        } else if (cart.length > 0) {
          if (confirm("Savatni tozalashni xohlaysizmi?")) clearCartRef.current();
        }
      } else if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handleProcessSaleRef.current();
      }
    };

    window.addEventListener('keydown', handleGlobalHotkeys);
    return () => window.removeEventListener('keydown', handleGlobalHotkeys);
  }, [cart.length, overallDiscount, isQrModalOpen, isHeldModalOpen]);

  // Shtrix-kod skanerlanganda savatga tashlash (Oddiy va 13-xonali Tarozi shtrix-kodi)
  const handleScanBarcode = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    // 1. Tarozili shtrix-kod parsingi (masalan 21TTTTTWWWWWC: 2100105012503)
    if (clean.length === 13 && (clean.startsWith('21') || clean.startsWith('22'))) {
      const plu = clean.substring(2, 7);
      const shortPlu = plu.replace(/^0+/, '');
      const weightGrams = parseInt(clean.substring(7, 12), 10);
      const weightKg = weightGrams > 0 ? weightGrams / 1000 : 1;

      const weighted = products.find(p =>
        p.pluCode === plu ||
        p.pluCode === shortPlu ||
        p.barcode === plu ||
        p.barcode === shortPlu ||
        (p.isWeighted && p.barcode.endsWith(plu))
      );

      if (weighted) {
        addWeightedToCart(weighted, weightKg);
        setBarcodeInput('');
        return;
      }
    }

    // 2. Standart mahsulot qidiruvi
    const found = products.find(p => p.barcode === clean);
    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      alert(`'${clean}' shtrix-kodli mahsulot bazada topilmadi.`);
    }
  };

  const addWeightedToCart = (product: ProductResponseDto, weightKg: number) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity = Math.round((copy[idx].quantity + weightKg) * 1000) / 1000;
        return copy;
      }
      return [...prev, { product, quantity: weightKg, discount: 0 }];
    });
  };

  const addToCart = (product: ProductResponseDto) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const next = item.quantity + delta;
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const setExactQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.product.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const removeItem = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashGiven('');
    setOverallDiscount('0');
    setCashbackUsed(0);
    setSelectedCustomerId(null);
  };

  // Hisob-kitoblar
  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const discountVal = parseFloat(overallDiscount) || 0;
  const rawTotal = Math.max(0, subtotal - discountVal);
  const totalAmount = Math.max(0, rawTotal - cashbackUsed);
  const totalItemsCount = Math.round(cart.reduce((sum, item) => sum + item.quantity, 0) * 1000) / 1000;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Savdoni kechiktirish (Hold / Pause Sale)
  const handleHoldSale = () => {
    if (cart.length === 0) {
      alert("Kechiktirish uchun savatda hech bo'lmaganda 1 ta tovar bo'lishi kerak.");
      return;
    }
    const newHeld: HeldSale = {
      id: `SAVAT-#${Date.now().toString().slice(-4)}`,
      heldAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      cart: [...cart],
      customer: selectedCustomer || null,
      overallDiscount,
      subtotal,
      totalAmount
    };
    const updated = [newHeld, ...heldSales];
    setHeldSales(updated);
    try {
      localStorage.setItem('osonsavdo_held_sales', JSON.stringify(updated));
    } catch {
      // ignore
    }
    clearCart();
  };

  const handleRestoreHeldSale = (heldId: string) => {
    const target = heldSales.find(h => h.id === heldId);
    if (!target) return;
    if (cart.length > 0) {
      if (!confirm("Hozirgi savatda tovarlar bor. Kechiktirilgan savatni ochsangiz, hozirgi savat o'chiriladi. Davom etasizmi?")) {
        return;
      }
    }
    setCart(target.cart);
    setOverallDiscount(target.overallDiscount);
    setSelectedCustomerId(target.customer?.id ?? null);
    const updated = heldSales.filter(h => h.id !== heldId);
    setHeldSales(updated);
    try {
      localStorage.setItem('osonsavdo_held_sales', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setIsHeldModalOpen(false);
  };

  const handleDeleteHeldSale = (heldId: string) => {
    if (!confirm("Ushbu kechiktirilgan savatni bekor qilmoqchimisiz?")) return;
    const updated = heldSales.filter(h => h.id !== heldId);
    setHeldSales(updated);
    try {
      localStorage.setItem('osonsavdo_held_sales', JSON.stringify(updated));
    } catch {
      // ignore
    }
    if (updated.length === 0) {
      setIsHeldModalOpen(false);
    }
  };

  // Qaytim hisoblagich
  const cashNum = parseFloat(cashGiven) || 0;
  const change = Math.max(0, cashNum - totalAmount);

  // Kategoriyalar
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'Umumiy')))];

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    const matchesCat = selectedCategory === 'All' ? true : p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Yangi mijoz saqlash
  const handleCreateCustomer = async () => {
    if (!newCustName.trim()) return;
    try {
      const created = await onCreateCustomer(newCustName.trim(), newCustPhone.trim());
      setSelectedCustomerId(created.id);
      setIsAddingCustomer(false);
      setNewCustName('');
      setNewCustPhone('+998 ');
    } catch {
      alert("Mijoz qo'shishda xatolik");
    }
  };

  // Savdoni yakunlash
  const handleProcessSale = async (overridePaymentType?: PaymentType) => {
    if (cart.length === 0) {
      alert("Savat bo'sh! Avval tovarlarni qo'shing.");
      return;
    }

    const effectivePayment = overridePaymentType || paymentType;

    if (effectivePayment === 'Debt' && !selectedCustomerId) {
      alert('Nasiyaga savdo qilish uchun mijozni tanlang!');
      return;
    }

    if (effectivePayment === 'Mixed') {
      const cVal = parseFloat(mixedCash) || 0;
      const kVal = parseFloat(mixedCard) || 0;
      if (cVal + kVal < totalAmount && !selectedCustomerId) {
        alert("Aralash to'lovda qolgan summa nasiyaga yozilishi uchun mijozni tanlang!");
        return;
      }
    }

    // Smena holati ogohlantirishi
    if (!shiftSummary?.isOpen) {
      if (!confirm("Diqqat! Hozirda kassa smenasi ochilmagan. Shunga qaramay savdoni davom ettirasizmi?")) {
        onOpenShiftModal();
        return;
      }
    }

    setSubmitting(true);
    try {
      let paidAmount = totalAmount;
      let paidCash = 0;
      let paidCard = 0;

      if (effectivePayment === 'Debt') {
        paidAmount = 0;
      } else if (effectivePayment === 'Cash') {
        paidCash = totalAmount;
      } else if (effectivePayment === 'Card') {
        paidCard = totalAmount;
      } else if (effectivePayment === 'Mixed') {
        paidCash = parseFloat(mixedCash) || 0;
        paidCard = parseFloat(mixedCard) || 0;
        paidAmount = paidCash + paidCard;
      }

      const saleDto: CreateSaleDto = {
        items: cart.map(it => ({
          productId: it.product.id,
          quantity: it.quantity,
          unitSellingPrice: it.product.sellingPrice,
          discountAmount: it.discount
        })),
        paymentType: effectivePayment,
        paidAmount,
        discountAmount: discountVal,
        paidCash,
        paidCard,
        cashbackUsed,
        customerId: selectedCustomerId,
        cashShiftId: shiftSummary?.shift?.id
      };

      const result = await onSubmitSale(saleDto);
      clearCart();
      setIsQrModalOpen(false);
      onSaleCompleted(result);
    } catch (err: any) {
      alert(err?.message || 'Savdoni amalga oshirishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  handleHoldSaleRef.current = handleHoldSale;
  handleProcessSaleRef.current = handleProcessSale;
  clearCartRef.current = clearCart;

  return (
    <div className="flex flex-col gap-3 sm:gap-5 min-h-[calc(100vh-130px)] lg:h-[calc(100vh-100px)] lg:flex-row relative">
      {/* Mobil ekranlar uchun Katalog / Savat tablari */}
      <div className="flex lg:hidden bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setMobilePosTab('catalog')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            mobilePosTab === 'catalog'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Katalog ({filteredProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobilePosTab('cart')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            mobilePosTab === 'cart'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Savat ({cart.length})</span>
          {cart.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {totalAmount.toLocaleString()}
            </span>
          )}
        </button>
      </div>

      {/* CHAP TOMON: MAHSULOTLAR KATALOGI VA TEZKOR SKANER */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs ${
        mobilePosTab === 'cart' ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Hotkeys Toolbar */}
        <div className="hidden md:flex px-4 py-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-b border-slate-200/60 dark:border-slate-800 items-center justify-between gap-2 overflow-x-auto text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 shrink-0">
            <Keyboard className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Tezkor Tugmalar:</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-slate-300">
              <b className="text-emerald-600">F1</b> Qidiruv
            </span>
            <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-slate-300">
              <b className="text-emerald-600">F2</b> Naqd
            </span>
            <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-slate-300">
              <b className="text-emerald-600">F3</b> Karta
            </span>
            <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-slate-300">
              <b className="text-emerald-600">F4</b> Nasiya
            </span>
            <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-slate-300">
              <b className="text-amber-600">F6</b> Kechiktirish
            </span>
            <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-slate-300">
              <b className="text-emerald-600">F7</b> QR To'lov
            </span>
            <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-slate-300">
              <b className="text-emerald-600">F9</b> Skidka
            </span>
            <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-slate-300">
              <b className="text-emerald-600">Ctrl+Enter</b> Yakunlash
            </span>
            <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-600 dark:text-slate-300">
              <b className="text-rose-600">Esc</b> Bekor
            </span>
          </div>
        </div>

        {/* Yuqori qidiruv va skaner paneli */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex gap-2">
            {/* Tezkor shtrix-kod kiritish inputi */}
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 absolute left-3.5 top-3 text-emerald-500 animate-pulse" />
              <input
                id="barcode-scanner-input"
                ref={barcodeInputRef}
                type="text"
                placeholder="Shtrix-kodni skanerlang yoki qo'lda kiriting + Enter..."
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleScanBarcode(barcodeInput);
                  }
                }}
                className="w-full pl-11 pr-4 py-2.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>

            {/* Qidiruv inputi */}
            <div className="relative w-64 hidden sm:block">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                id="pos-search-input"
                type="text"
                placeholder="Nomi bo'yicha qidiruv (F1)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
            </div>
          </div>

          {/* Kategoriya filtrlari */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat === 'All' ? 'Barchasi' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Mahsulotlar kartalari to'plami (Scrollable Grid) */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map(product => {
              const inCart = cart.find(c => c.product.id === product.id);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    inCart
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs ring-1 ring-emerald-500'
                      : 'border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60 shadow-xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {product.category || 'Umumiy'}
                      </span>
                      {product.stockQuantity <= product.minStockAlert ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600">
                          {product.stockQuantity} {product.unit}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                          {product.stockQuantity} {product.unit}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-xs text-slate-800 dark:text-white line-clamp-2">
                      {product.name}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
                    <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                      {product.sellingPrice.toLocaleString()} so&apos;m
                    </span>
                    {inCart && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                        {inCart.quantity}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobil suzuvchi Savatga o'tish tugmasi */}
      {mobilePosTab === 'catalog' && cart.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-30 lg:hidden">
          <button
            type="button"
            onClick={() => setMobilePosTab('cart')}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xl shadow-emerald-600/40 flex items-center justify-between transition animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                {cart.length}
              </div>
              <span>Savatga o&apos;tish</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm">{totalAmount.toLocaleString()} so&apos;m</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* O'NG TOMON: SAVAT VA TO'LOV PANELI (POS CHECKOUT) */}
      <div className={`w-full lg:w-[420px] xl:w-[460px] flex flex-col bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs shrink-0 ${
        mobilePosTab === 'catalog' ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Savat sarlavhasi */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobilePosTab('catalog')}
              className="lg:hidden p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1 font-semibold"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>Katalog</span>
            </button>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl hidden sm:block">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Kassir Savati</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                {totalItemsCount} ta tovar • {cart.length} xil
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleHoldSale}
                title="Savatni keyinga saqlab turish (F6)"
                className="flex items-center gap-1 px-2.5 py-1 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 text-xs font-semibold rounded-lg transition"
              >
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kechiktirish</span>
              </button>
            )}

            {heldSales.length > 0 && (
              <button
                type="button"
                onClick={() => setIsHeldModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-white bg-amber-600 hover:bg-amber-500 text-xs font-bold rounded-lg shadow-sm shadow-amber-600/30 transition animate-pulse"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Kechiktirilganlar ({heldSales.length})</span>
              </button>
            )}

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="px-2.5 py-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold rounded-lg transition"
              >
                Tozalash
              </button>
            )}
          </div>
        </div>

        {/* Savatdagi tovarlar ro'yxati (Scrollable List) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Savat hozircha bo&apos;sh</p>
              <p className="text-[11px] text-slate-400 max-w-[200px]">
                Mahsulotni skanerlang yoki chapdagi ro&apos;yxatdan tanlang
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.product.id}
                className="p-2.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-xs text-slate-800 dark:text-white truncate">
                      {item.product.name}
                    </p>
                    {(item.product.isWeighted || item.quantity % 1 !== 0) && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded">
                        <Scale className="w-2.5 h-2.5" /> Tarozi
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {item.product.sellingPrice.toLocaleString()} so&apos;m / {item.product.unit}
                  </p>
                </div>

                {/* Soni boshqarish */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 transition shadow-xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="number"
                    step="any"
                    value={item.quantity}
                    onChange={e => setExactQuantity(item.product.id, parseFloat(e.target.value) || 0)}
                    className="w-12 text-center font-bold text-xs bg-transparent focus:outline-none"
                  />

                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* PASTKI TO'LOV PANELI */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
          {/* To'lov turlari */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'Cash', label: 'Naqd (F2)', icon: Banknote },
              { id: 'Card', label: 'Karta (F3)', icon: CreditCard },
              { id: 'Debt', label: 'Nasiya (F4)', icon: BookOpen },
              { id: 'Mixed', label: 'Aralash', icon: Sparkles }
            ].map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setPaymentType(m.id as PaymentType)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition ${
                    paymentType === m.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px]">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* QR To'lov tugmasi */}
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Click / Payme / Uzum QR To'lov (F7)</span>
          </button>

          {/* Mijoz Tanlash & Keshbek / Bonus & Nasiya */}
          <div className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Mijoz (Keshbek / Nasiya):
              </span>
              <button
                type="button"
                onClick={() => setIsAddingCustomer(!isAddingCustomer)}
                className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5"
              >
                <UserPlus className="w-3 h-3" />
                Yangi mijoz
              </button>
            </div>

            {isAddingCustomer ? (
              <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-700">
                <input
                  type="text"
                  placeholder="Mijoz to'liq ismi..."
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="+998 90 123-45-67"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                  <button
                    onClick={handleCreateCustomer}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                  >
                    Saqlash
                  </button>
                </div>
              </div>
            ) : (
              <select
                value={selectedCustomerId || ''}
                onChange={e => {
                  const id = e.target.value ? parseInt(e.target.value) : null;
                  setSelectedCustomerId(id);
                  setCashbackUsed(0);
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
              >
                <option value="">-- Mijoz tanlanmagan (Umumiy xaridor) --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phone}) - Qarz: {c.totalDebt.toLocaleString()} | Bonus: {c.cashbackBalance.toLocaleString()} so'm
                  </option>
                ))}
              </select>
            )}

            {/* Agar mijoz tanlangan bo'lsa: Bonus balansi va bonusdan to'lash */}
            {selectedCustomer && (
              <div className="p-2 bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/60 rounded-xl flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-emerald-600" />
                  <div>
                    <span className="text-slate-600 dark:text-slate-300">Mavjud bonus:</span>{' '}
                    <b className="text-emerald-700 dark:text-emerald-400">
                      {selectedCustomer.cashbackBalance.toLocaleString()} so'm
                    </b>
                  </div>
                </div>
                {selectedCustomer.cashbackBalance > 0 && (
                  cashbackUsed > 0 ? (
                    <button
                      type="button"
                      onClick={() => setCashbackUsed(0)}
                      className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded hover:bg-rose-200 text-[10px]"
                    >
                      Bekor qilish (-{cashbackUsed.toLocaleString()})
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const canUse = Math.min(selectedCustomer.cashbackBalance, rawTotal);
                        setCashbackUsed(canUse);
                      }}
                      className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 text-[10px]"
                    >
                      Bonusdan to'lash
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Agar Naqd to'lov bo'lsa: Tezkor pul tugmalari va Qaytim */}
          {paymentType === 'Cash' && totalAmount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">Qabul qilingan naqd:</span>
                <input
                  type="number"
                  placeholder={totalAmount.toString()}
                  value={cashGiven}
                  onChange={e => setCashGiven(e.target.value)}
                  className="w-28 text-right px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs"
                />
              </div>

              {/* Tezkor nominal tugmalari */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setCashGiven(totalAmount.toString())}
                  className="px-2 py-1 text-[10px] bg-slate-200 dark:bg-slate-700 rounded-lg font-bold"
                >
                  Aniqlik bilan
                </button>
                {[10000, 20000, 50000, 100000, 200000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setCashGiven((cashNum + amt).toString())}
                    className="px-2 py-1 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                  >
                    +{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Qaytim ko'rsatkichi */}
              {cashNum > 0 && (
                <div className="flex justify-between items-center text-xs p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl font-bold text-emerald-600">
                  <span>QAYTIM:</span>
                  <span className="text-sm font-black">{change.toLocaleString()} so&apos;m</span>
                </div>
              )}
            </div>
          )}

          {/* Agar Aralash to'lov bo'lsa: Naqd va Karta miqdori */}
          {paymentType === 'Mixed' && (
            <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-500 font-bold">💵 Naqd qismi:</label>
                    <button
                      type="button"
                      onClick={() => {
                        const cardVal = parseFloat(mixedCard) || 0;
                        const remainder = Math.max(0, totalAmount - cardVal);
                        setMixedCash(remainder.toString());
                      }}
                      className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                    >
                      Qoldiq
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="0"
                    value={mixedCash}
                    onChange={e => setMixedCash(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-500 font-bold">💳 Karta qismi:</label>
                    <button
                      type="button"
                      onClick={() => {
                        const cashVal = parseFloat(mixedCash) || 0;
                        const remainder = Math.max(0, totalAmount - cashVal);
                        setMixedCard(remainder.toString());
                      }}
                      className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                    >
                      Qoldiq
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="0"
                    value={mixedCard}
                    onChange={e => setMixedCard(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Taqsimot va Nasiya holati */}
              {(() => {
                const cVal = parseFloat(mixedCash) || 0;
                const kVal = parseFloat(mixedCard) || 0;
                const paid = cVal + kVal;
                const diff = totalAmount - paid;
                if (diff > 0) {
                  return (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400 text-[11px] flex justify-between items-center">
                      <span>Qolgan qismi Nasiyaga:</span>
                      <span className="font-extrabold">{diff.toLocaleString()} so&apos;m</span>
                    </div>
                  );
                } else if (diff < 0) {
                  return (
                    <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-[11px] flex justify-between items-center font-bold">
                      <span>Ortiqcha kiritildi:</span>
                      <span>+{Math.abs(diff).toLocaleString()} so&apos;m</span>
                    </div>
                  );
                }
                return (
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] text-center font-bold">
                    ✓ Summa to&apos;liq taqsimlandi
                  </div>
                );
              })()}
            </div>
          )}

          {/* Jami va Chegirma satri */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Tovarlar summasi:</span>
              <span className="font-semibold">{subtotal.toLocaleString()} so&apos;m</span>
            </div>

            {discountVal > 0 && (
              <div className="flex justify-between items-center text-[11px] text-rose-500">
                <span>Chegirma (skidka):</span>
                <span>-{discountVal.toLocaleString()} so&apos;m</span>
              </div>
            )}

            {cashbackUsed > 0 && (
              <div className="flex justify-between items-center text-[11px] text-emerald-600 font-bold">
                <span>Bonusdan to'landi:</span>
                <span>-{cashbackUsed.toLocaleString()} so&apos;m</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1 text-sm font-black text-slate-900 dark:text-white">
              <span>JAMI TO&apos;LOV:</span>
              <span className="text-base text-emerald-600 dark:text-emerald-400">
                {totalAmount.toLocaleString()} so&apos;m
              </span>
            </div>
          </div>

          {/* Asosiy savdoni yakunlash tugmasi */}
          <button
            onClick={() => handleProcessSale()}
            disabled={submitting || cart.length === 0}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            {submitting ? 'Savdo bajarilmoqda...' : "TO'LOVNI QABUL QILISH & CHEK (Ctrl+Enter)"}
          </button>
        </div>
      </div>

      {/* Dynamic QR To'lov Modali (Click / Payme / Uzum) */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tezkor QR To'lov
              </span>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* To'lov Tizimlari Logolari */}
            <div className="flex items-center justify-center gap-2">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 font-black rounded-lg text-xs">CLICK</span>
              <span className="px-2.5 py-1 bg-teal-50 text-teal-600 font-black rounded-lg text-xs">PAYME</span>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-600 font-black rounded-lg text-xs">UZUM</span>
            </div>

            {/* QR Kod Simulyatsiyasi */}
            <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl inline-block shadow-inner">
              <svg width="180" height="180" viewBox="0 0 100 100" className="mx-auto">
                <rect x="0" y="0" width="30" height="30" fill="#000" />
                <rect x="5" y="5" width="20" height="20" fill="#fff" />
                <rect x="10" y="10" width="10" height="10" fill="#000" />

                <rect x="70" y="0" width="30" height="30" fill="#000" />
                <rect x="75" y="5" width="20" height="20" fill="#fff" />
                <rect x="80" y="10" width="10" height="10" fill="#000" />

                <rect x="0" y="70" width="30" height="30" fill="#000" />
                <rect x="5" y="75" width="20" height="20" fill="#fff" />
                <rect x="10" y="80" width="10" height="10" fill="#000" />

                {/* Markaziy naqshlar */}
                <rect x="40" y="40" width="20" height="20" fill="#10b981" rx="4" />
                <circle cx="50" cy="50" r="5" fill="#fff" />
                <rect x="35" y="10" width="10" height="20" fill="#000" />
                <rect x="50" y="20" width="15" height="10" fill="#000" />
                <rect x="10" y="35" width="20" height="10" fill="#000" />
                <rect x="70" y="40" width="10" height="25" fill="#000" />
                <rect x="40" y="70" width="25" height="10" fill="#000" />
                <rect x="70" y="75" width="20" height="15" fill="#000" />
              </svg>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-medium">To'lov summasi:</p>
              <p className="text-2xl font-black text-emerald-600">{totalAmount.toLocaleString()} so'm</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Xaridor ilovasi (Click / Payme / Uzum) orqali ushbu kodni skaner qiladi
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={() => handleProcessSale('Card')}
                disabled={submitting || cart.length === 0}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20"
              >
                To'lov Tasdiqlandi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KECHIKTIRILGAN SAVDOLAR MODAL OYNASI */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/60 dark:bg-amber-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
                  <Pause className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                    Kechiktirilgan Savdolar
                    <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-mono">
                      {heldSales.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Muzlatib qo&apos;yilgan savatlar ro&apos;yxati
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHeldModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {heldSales.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Kechiktirilgan savdolar mavjud emas.
                </div>
              ) : (
                heldSales.map(h => (
                  <div
                    key={h.id}
                    className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl space-y-2.5 hover:border-amber-300 dark:hover:border-amber-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-amber-700 dark:text-amber-400">
                        {h.id}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" /> {h.heldAt}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Mijoz: <b>{h.customer ? `${h.customer.fullName} (${h.customer.phone})` : "Noma'lum xaridor"}</b></span>
                      <span className="text-slate-500 font-semibold">{h.cart.length} xil tovar</span>
                    </div>

                    {/* Tovarlar ro'yxati qisqacha */}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 truncate">
                      {h.cart.map(c => `${c.product.name} (${c.quantity} ${c.product.unit})`).join(', ')}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Jami summa:</span>
                        <div className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                          {h.totalAmount.toLocaleString()} so&apos;m
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteHeldSale(h.id)}
                          className="px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition font-semibold"
                        >
                          O&apos;chirish
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRestoreHeldSale(h.id)}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Savatga Tiklash</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
