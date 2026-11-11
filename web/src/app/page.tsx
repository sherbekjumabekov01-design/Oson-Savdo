'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar, TabType } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { PosView } from '@/components/views/PosView';
import { DashboardView } from '@/components/views/DashboardView';
import { InventoryView } from '@/components/views/InventoryView';
import { SupplyView } from '@/components/views/SupplyView';
import { DebtView } from '@/components/views/DebtView';
import { FinanceView } from '@/components/views/FinanceView';
import { SalesView } from '@/components/views/SalesView';
import { SuperAdminView } from '@/components/views/SuperAdminView';
import { AnalyticsView } from '@/components/views/AnalyticsView';
import { AuditView } from '@/components/views/AuditView';

import { ReceiptModal } from '@/components/modals/ReceiptModal';
import { ShiftModal } from '@/components/modals/ShiftModal';
import { LoginModal } from '@/components/modals/LoginModal';
import { RefundModal } from '@/components/modals/RefundModal';
import { ImportProductsModal } from '@/components/modals/ImportProductsModal';
import { AddProductModal } from '@/components/modals/AddProductModal';
import { RepayDebtModal } from '@/components/modals/RepayDebtModal';
import { DebtReceiptModal } from '@/components/modals/DebtReceiptModal';
import { CustomerHistoryModal } from '@/components/modals/CustomerHistoryModal';
import { AddExpenseModal } from '@/components/modals/AddExpenseModal';
import { SaleDetailModal } from '@/components/modals/SaleDetailModal';
import { SubscriptionExpiredModal } from '@/components/modals/SubscriptionExpiredModal';
import { StoreSettingsModal } from '@/components/modals/StoreSettingsModal';
import { AlertTriangle, Megaphone, X, Menu, ScanLine, LayoutDashboard, Package, BookOpen } from 'lucide-react';

import { apiService } from '@/services/api';
import {
  ProductResponseDto,
  CustomerResponseDto,
  CustomerDebtSummaryDto,
  ExpenseResponseDto,
  SaleResponseDto,
  DashboardSummaryDto,
  DailyReportDto,
  CreateProductDto,
  RepayDebtDto,
  DebtTransactionResponseDto,
  CreateExpenseDto,
  CreateSaleDto,
  CurrentShiftSummaryDto,
  CashShiftResponseDto,
  SupplierResponseDto,
  SupplyInvoiceResponseDto,
  CreateSupplierDto,
  PaySupplierDebtDto,
  CreateSupplyInvoiceDto,
  CreateRefundDto,
  LoginDto,
  LoginResponseDto,
  StoreResponseDto,
  PlatformAnnouncementDto
} from '@/types/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('pos');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeAnnouncements, setActiveAnnouncements] = useState<PlatformAnnouncementDto[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<number[]>([]);

  // Connection & Offline State
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSalesCount, setPendingSalesCount] = useState(0);

  // Auth state
  const [currentUser, setCurrentUser] = useState<LoginResponseDto | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Data states
  const [products, setProducts] = useState<ProductResponseDto[]>([]);
  const [customers, setCustomers] = useState<CustomerResponseDto[]>([]);
  const [debtors, setDebtors] = useState<CustomerDebtSummaryDto[]>([]);
  const [expenses, setExpenses] = useState<ExpenseResponseDto[]>([]);
  const [sales, setSales] = useState<SaleResponseDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierResponseDto[]>([]);
  const [supplyInvoices, setSupplyInvoices] = useState<SupplyInvoiceResponseDto[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryDto | null>(null);
  const [dailyReport, setDailyReport] = useState<DailyReportDto | null>(null);

  // Shift state
  const [shiftSummary, setShiftSummary] = useState<CurrentShiftSummaryDto | null>(null);
  const [shiftHistory, setShiftHistory] = useState<CashShiftResponseDto[]>([]);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // Modal states
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<SaleResponseDto | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedRefundSale, setSelectedRefundSale] = useState<SaleResponseDto | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isRepayDebtOpen, setIsRepayDebtOpen] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<CustomerDebtSummaryDto | null>(null);
  const [isCustomerHistoryOpen, setIsCustomerHistoryOpen] = useState(false);
  const [selectedDebtReceipt, setSelectedDebtReceipt] = useState<DebtTransactionResponseDto | null>(null);
  const [isDebtReceiptOpen, setIsDebtReceiptOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSaleDetailOpen, setIsSaleDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleResponseDto | null>(null);
  const [inspectingStore, setInspectingStore] = useState<StoreResponseDto | null>(null);
  const [isSubscriptionExpiredModalOpen, setIsSubscriptionExpiredModalOpen] = useState(false);
  const [subscriptionWarningDays, setSubscriptionWarningDays] = useState<number | null>(null);
  const [currentStoreInfo, setCurrentStoreInfo] = useState<StoreResponseDto | null>(null);
  const [isStoreSettingsOpen, setIsStoreSettingsOpen] = useState(false);

  // Do'kon obunasini tekshirish (SIM-karta kabi avtomatik to'xtash)
  const checkSubscription = async (storeId?: number | null, role?: string) => {
    if (!storeId || role === 'SuperAdmin') {
      setSubscriptionWarningDays(null);
      setIsSubscriptionExpiredModalOpen(false);
      return;
    }
    try {
      const store = await apiService.getStoreById(storeId);
      setCurrentStoreInfo(store);
      if (store.isSubscriptionExpired || !store.isActive) {
        setIsSubscriptionExpiredModalOpen(true);
      } else if (store.subscriptionExpiresAt) {
        const diff = new Date(store.subscriptionExpiresAt).getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days <= 3 && days > 0) {
          setSubscriptionWarningDays(days);
        } else {
          setSubscriptionWarningDays(null);
        }
      }
    } catch {
      // ignore
    }
  };

  // Tekshirish va yuklash
  useEffect(() => {
    const user = apiService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'SuperAdmin') {
        setActiveTab('saas');
      }
      checkSubscription(user.storeId, user.role);
    } else {
      // Boshlang'ich default admin sifatida kirish
      setCurrentUser({
        token: '',
        userId: 1,
        username: 'admin',
        fullName: "Do'kon Egasi (Admin)",
        role: 'Admin',
        storeId: 1,
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString()
      });
      checkSubscription(1, 'Admin');
    }

    const checkStatus = async () => {
      const online = await apiService.checkHealth();
      setIsOnline(online);
      setPendingSalesCount(apiService.getPendingSales().length);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000);

    const handleExpiredEvent = () => {
      setIsSubscriptionExpiredModalOpen(true);
    };
    window.addEventListener('subscription_expired', handleExpiredEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('subscription_expired', handleExpiredEvent);
    };
  }, []);

  // Fetch all core application data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, d, e, s, sum, rep, sh, sups, invs] = await Promise.all([
        apiService.getProducts().catch(() => []),
        apiService.getCustomers().catch(() => []),
        apiService.getDebtors().catch(() => []),
        apiService.getExpenses().catch(() => []),
        apiService.getSales().catch(() => []),
        apiService.getDashboardSummary().catch(() => null),
        apiService.getDailyReport().catch(() => null),
        apiService.getCurrentShift().catch(() => null),
        apiService.getSuppliers().catch(() => []),
        apiService.getSupplyInvoices().catch(() => [])
      ]);

      setProducts(p);
      setCustomers(c);
      setDebtors(d);
      setExpenses(e);
      setSales(s);
      setDashboardSummary(sum);
      setDailyReport(rep);
      setShiftSummary(sh);
      setSuppliers(sups);
      setSupplyInvoices(invs);
      setPendingSalesCount(apiService.getPendingSales().length);
      apiService.getPlatformAnnouncements().then(setActiveAnnouncements).catch(() => {});
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Shift Handlers
  const handleOpenShift = async (openingBalance: number, note?: string) => {
    await apiService.openShift({ openingBalance, note });
    const updated = await apiService.getCurrentShift();
    setShiftSummary(updated);
  };

  const handleCloseShift = async (shiftId: number, closingCash: number, note?: string) => {
    await apiService.closeShift(shiftId, { closingCashActual: closingCash, note });
    const updated = await apiService.getCurrentShift();
    setShiftSummary(updated);
    await loadData();
  };

  const handleRefreshShiftHistory = async () => {
    const list = await apiService.getShiftHistory();
    setShiftHistory(list);
  };

  // POS & Sales Handlers
  const handleSubmitSale = async (dto: CreateSaleDto): Promise<SaleResponseDto> => {
    const result = await apiService.createSale(dto);
    await loadData();
    return result;
  };

  const handleSaleCompleted = (sale: SaleResponseDto) => {
    setSelectedReceiptSale(sale);
    setIsReceiptOpen(true);
  };

  // Refund Handler
  const handleConfirmRefund = async (dto: CreateRefundDto) => {
    await apiService.createRefund(dto);
    await loadData();
  };

  // Suppliers & Kirim Handlers
  const handleCreateSupplier = async (dto: CreateSupplierDto) => {
    await apiService.createSupplier(dto);
    const sups = await apiService.getSuppliers();
    setSuppliers(sups);
  };

  const handlePaySupplierDebt = async (dto: PaySupplierDebtDto) => {
    await apiService.paySupplierDebt(dto);
    await loadData();
  };

  const handleReceiveGoods = async (dto: CreateSupplyInvoiceDto) => {
    await apiService.receiveGoods(dto);
    await loadData();
  };

  // Sync Offline Sales
  const handleSyncPendingSales = async () => {
    const { success, failed } = await apiService.syncPendingSales();
    setPendingSalesCount(apiService.getPendingSales().length);
    alert(`${success} ta savdo serverga yuklandi. ${failed > 0 ? `${failed} ta yuklanmadi.` : ''}`);
    await loadData();
  };

  // Customer creation helper
  const handleCreateCustomer = async (fullName: string, phone: string) => {
    const created = await apiService.createCustomer({ fullName, phone });
    setCustomers(prev => [created, ...prev]);
    return created;
  };

  // Product CRUD
  const handleCreateProduct = async (dto: CreateProductDto) => {
    await apiService.createProduct(dto);
    await loadData();
  };

  const handleDeleteProduct = async (id: number) => {
    await apiService.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    apiService.getDashboardSummary().then(setDashboardSummary);
  };

  // Debt & Expense CRUD
  const handleRepayDebt = async (dto: RepayDebtDto, printReceipt: boolean = true) => {
    const res = await apiService.repayDebt(dto);
    await loadData();
    if (printReceipt && res) {
      setSelectedDebtReceipt(res);
      setIsDebtReceiptOpen(true);
    }
    return res;
  };

  const handleCreateExpense = async (dto: CreateExpenseDto) => {
    await apiService.createExpense(dto);
    await loadData();
  };

  const handleDeleteExpense = async (id: number) => {
    await apiService.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    apiService.getDashboardSummary().then(setDashboardSummary);
    apiService.getDailyReport().then(setDailyReport);
  };

  // Auth Handlers
  const handleLogin = async (dto: LoginDto) => {
    const res = await apiService.login(dto);
    setCurrentUser(res);
    if (res.role === 'SuperAdmin') {
      setActiveTab('saas');
    } else {
      setActiveTab('pos');
    }
    await checkSubscription(res.storeId, res.role);
    await loadData();
  };

  const handleLogout = () => {
    apiService.logout();
    apiService.setSelectedStoreId(null);
    setInspectingStore(null);
    setCurrentUser(null);
    setSubscriptionWarningDays(null);
    setIsSubscriptionExpiredModalOpen(false);
    setActiveTab('pos');
  };

  // Store Inspection Handlers (SuperAdmin)
  const handleSelectStoreToInspect = async (store: StoreResponseDto) => {
    apiService.setSelectedStoreId(store.id);
    setInspectingStore(store);
    setActiveTab('dashboard');
    await loadData();
  };

  const handleExitStoreInspection = async () => {
    apiService.setSelectedStoreId(null);
    setInspectingStore(null);
    setActiveTab('saas');
    await loadData();
  };

  const isCashierRole = currentUser?.role === 'Cashier';

  // Section titles and descriptions
  const tabMeta: Record<TabType, { title: string; desc: string }> = {
    saas: {
      title: "SaaS Platforma Markazi (SuperAdmin)",
      desc: "Do'konlar, savdolar, obuna muddatlari va tizim nazorati"
    },
    pos: {
      title: 'Kassa & Tezkor Savdo (POS)',
      desc: "Shtrix-kod skaneri, savat, chek chop etish va qaytim hisoblagichi"
    },
    dashboard: {
      title: 'Boshqaruv Paneli',
      desc: "Do'konning umumiy moliyaviy va operatsion holati"
    },
    inventory: {
      title: 'Ombor va Tovar Boshqaruvi',
      desc: "Barcha tovarlar, qoldiqlar, narxlar va Excel import/export"
    },
    supply: {
      title: "Ta'minot & Kirim Hujjatlari",
      desc: "Ta'minotchilar (postavshiklar), tovarlar qabuli va qarzlar hisobi"
    },
    debts: {
      title: 'Qarz Daftari (Nasiya)',
      desc: "Mijozlarning nasiya qarzlari, to'lovlar va balanslar"
    },
    sales: {
      title: 'Sotuvlar Tarixi & Cheklar',
      desc: "Barcha amalga oshirilgan savdolar, qayta chop etish va vozvrat"
    },
    finance: {
      title: 'Moliya va Xarajatlar (Kirim-Chiqim)',
      desc: "Do'kon chiqimlari, tannarx va sof foyda hisob-kitobi"
    },
    analytics: {
      title: 'Analitika & ABC Tahlili',
      desc: "Haftalik daromad dinamikasi, soatbay savdo cho'qqisi va ABC tovarlar tahlili"
    },
    audit: {
      title: 'Ombor Reviziyasi (Inventarizatsiya)',
      desc: "Shtrix-kod skaner orqali tovarlar qoldig'ini solishtirish va ortiqcha/kamomadni qayd etish"
    }
  };

  const lowStockCount = products.filter(p => p.stockQuantity <= p.minStockAlert).length;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
        totalDebtorsCount={debtors.length}
        isCashierRole={isCashierRole}
        isSuperAdmin={currentUser?.role === 'SuperAdmin'}
        inspectingStoreName={inspectingStore?.name ?? null}
        onExitStoreInspection={handleExitStoreInspection}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title={inspectingStore ? `📍 ${inspectingStore.name} (Monitoring)` : (tabMeta[activeTab]?.title || 'Oson Savdo')}
          description={inspectingStore ? "Platforma egasi sifatida ushbu do'kon hisobot va kassa holatini ko'rmoqdasiz" : (tabMeta[activeTab]?.desc || '')}
          onRefresh={loadData}
          loading={loading}
          isOnline={isOnline}
          pendingSalesCount={pendingSalesCount}
          onSyncPendingSales={handleSyncPendingSales}
          shiftSummary={shiftSummary}
          onOpenShiftModal={() => setIsShiftModalOpen(true)}
          currentUser={currentUser}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onOpenStoreSettings={
            currentUser?.role === 'Admin' || inspectingStore
              ? () => setIsStoreSettingsOpen(true)
              : undefined
          }
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        />

        {/* SIM-karta kabi obuna tugashidan 3 kun oldin ogohlantirish banneri */}
        {subscriptionWarningDays !== null && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-md animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                DIQQAT: Do&apos;koningiz obunasi {subscriptionWarningDays} kundan keyin tugaydi va avtomatik ravishda to&apos;xtatiladi (xuddi SIM-karta kabi)! Xizmat to&apos;xtab qolmasligi uchun to&apos;lovni vaqtida amalga oshiring.
              </span>
            </div>
            <span className="text-[11px] underline ml-2 whitespace-nowrap">Platforma egasi bilan bog&apos;laning</span>
          </div>
        )}

        {/* Global Platform Announcements from SuperAdmin */}
        {activeAnnouncements
          .filter(a => !dismissedAnnouncements.includes(a.id))
          .map(a => (
            <div
              key={a.id}
              className={`px-6 py-2.5 flex items-center justify-between text-xs font-semibold shadow-md animate-in fade-in ${
                a.type === 'warning'
                  ? 'bg-amber-600 text-white'
                  : a.type === 'alert'
                  ? 'bg-rose-600 text-white'
                  : a.type === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-indigo-700 to-violet-800 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 shrink-0 text-amber-300" />
                <span>
                  <b>{a.title}:</b> {a.message}
                </span>
              </div>
              <button
                onClick={() => setDismissedAnnouncements(prev => [...prev, a.id])}
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition"
                title="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

        <main className="flex-1 p-2 sm:p-4 md:p-6 pb-20 md:pb-6 max-w-7xl w-full mx-auto min-w-0">
          {activeTab === 'saas' && (
            <SuperAdminView onSelectStoreToInspect={handleSelectStoreToInspect} />
          )}

          {activeTab === 'pos' && (
            <PosView
              products={products}
              customers={customers}
              shiftSummary={shiftSummary}
              onOpenShiftModal={() => setIsShiftModalOpen(true)}
              onSubmitSale={handleSubmitSale}
              onSaleCompleted={handleSaleCompleted}
              onCreateCustomer={handleCreateCustomer}
              isCashierRole={isCashierRole}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              summary={dashboardSummary}
              recentSales={sales}
              debtors={debtors}
              onNavigate={setActiveTab}
              onViewSale={sale => {
                setSelectedSale(sale);
                setIsSaleDetailOpen(true);
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              loading={loading}
              onOpenAddModal={() => setIsAddProductOpen(true)}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onDeleteProduct={handleDeleteProduct}
              onRefresh={loadData}
              isCashierRole={isCashierRole}
            />
          )}

          {activeTab === 'supply' && (
            <SupplyView
              suppliers={suppliers}
              invoices={supplyInvoices}
              loading={loading}
              onCreateSupplier={handleCreateSupplier}
              onPayDebt={handlePaySupplierDebt}
              onReceiveGoods={handleReceiveGoods}
            />
          )}

          {activeTab === 'debts' && (
            <DebtView
              debtors={debtors}
              loading={loading}
              onOpenRepayModal={debtor => {
                setSelectedDebtor(debtor);
                setIsRepayDebtOpen(true);
              }}
              onOpenHistoryModal={debtor => {
                setSelectedDebtor(debtor);
                setIsCustomerHistoryOpen(true);
              }}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceView
              expenses={expenses}
              dailyReport={dailyReport}
              loading={loading}
              onOpenAddExpenseModal={() => setIsAddExpenseOpen(true)}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              sales={sales}
              loading={loading}
              onViewSale={sale => {
                setSelectedSale(sale);
                setIsSaleDetailOpen(true);
              }}
              onPrintReceipt={sale => {
                setSelectedReceiptSale(sale);
                setIsReceiptOpen(true);
              }}
              onOpenRefund={sale => {
                setSelectedRefundSale(sale);
                setIsRefundModalOpen(true);
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView />
          )}

          {activeTab === 'audit' && (
            <AuditView
              products={products}
              onRefreshProducts={loadData}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        sale={selectedReceiptSale}
        onClose={() => {
          setIsReceiptOpen(false);
          setSelectedReceiptSale(null);
        }}
        storeName={inspectingStore?.name || currentStoreInfo?.name || currentUser?.storeName || "OSON SAVDO"}
        storePhone={inspectingStore?.phone || currentStoreInfo?.phone || "+998 71 200-00-00"}
        storeAddress={inspectingStore?.address || currentStoreInfo?.address || "Toshkent sh., Savdo markazi"}
      />

      <ShiftModal
        isOpen={isShiftModalOpen}
        shiftSummary={shiftSummary}
        onClose={() => setIsShiftModalOpen(false)}
        onOpenShift={handleOpenShift}
        onCloseShift={handleCloseShift}
        shiftHistory={shiftHistory}
        onRefreshHistory={handleRefreshShiftHistory}
        onRefreshShift={async () => {
          const summary = await apiService.getCurrentShift();
          setShiftSummary(summary);
        }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        currentUser={currentUser}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <RefundModal
        isOpen={isRefundModalOpen}
        sale={selectedRefundSale}
        onClose={() => {
          setIsRefundModalOpen(false);
          setSelectedRefundSale(null);
        }}
        onConfirmRefund={handleConfirmRefund}
      />

      <ImportProductsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={loadData}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSubmit={handleCreateProduct}
        usdRate={currentStoreInfo?.usdRate || 12850}
      />

      <RepayDebtModal
        isOpen={isRepayDebtOpen}
        customer={selectedDebtor}
        cashierName={currentUser?.fullName || currentUser?.username || 'Kassir'}
        activeShiftId={shiftSummary?.shift?.id}
        onClose={() => {
          setIsRepayDebtOpen(false);
          setSelectedDebtor(null);
        }}
        onSubmit={handleRepayDebt}
      />

      <CustomerHistoryModal
        isOpen={isCustomerHistoryOpen}
        customer={selectedDebtor}
        onClose={() => {
          setIsCustomerHistoryOpen(false);
          setSelectedDebtor(null);
        }}
        onViewReceipt={(tx) => {
          setSelectedDebtReceipt(tx);
          setIsDebtReceiptOpen(true);
        }}
      />

      <DebtReceiptModal
        isOpen={isDebtReceiptOpen}
        transaction={selectedDebtReceipt}
        onClose={() => {
          setIsDebtReceiptOpen(false);
          setSelectedDebtReceipt(null);
        }}
        storeName={inspectingStore?.name || currentStoreInfo?.name || currentUser?.storeName || "OSON SAVDO"}
        storePhone={inspectingStore?.phone || currentStoreInfo?.phone || "+998 71 200-00-00"}
        storeAddress={inspectingStore?.address || currentStoreInfo?.address || "Toshkent sh., Savdo markazi"}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSubmit={handleCreateExpense}
        cashierName={shiftSummary?.shift?.cashierName || currentUser?.fullName || currentUser?.username || 'Kassir'}
      />

      <SaleDetailModal
        isOpen={isSaleDetailOpen}
        sale={selectedSale}
        onClose={() => {
          setIsSaleDetailOpen(false);
          setSelectedSale(null);
        }}
      />

      <SubscriptionExpiredModal
        isOpen={isSubscriptionExpiredModalOpen}
        storeName={currentStoreInfo?.name || currentUser?.storeName || "Do'kon"}
        expiredAt={currentStoreInfo?.subscriptionExpiresAt}
        monthlyFee={currentStoreInfo?.monthlyFee}
        onLogout={handleLogout}
      />

      <StoreSettingsModal
        isOpen={isStoreSettingsOpen}
        store={inspectingStore || currentStoreInfo}
        onClose={() => setIsStoreSettingsOpen(false)}
        onSaved={loadData}
      />

      {/* Mobil pastki tezkor navigatsiya paneli (Bottom Navigation Bar) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:hidden flex items-center justify-around h-16 px-1 shadow-lg">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition ${
            activeTab === 'pos'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ScanLine className="w-5 h-5 mb-0.5" />
          <span>Kassa</span>
        </button>

        {!isCashierRole && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition ${
              activeTab === 'dashboard'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Panel</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition relative ${
            activeTab === 'inventory'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>Ombor</span>
          {lowStockCount > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('debts')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold transition relative ${
            activeTab === 'debts'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span>Qarzlar</span>
          {debtors.length > 0 && (
            <span className="absolute top-1 right-2.5 px-1 py-0.2 bg-amber-500 text-white rounded-full text-[8px] font-mono">
              {debtors.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Menyu</span>
        </button>
      </nav>
    </div>
  );
}
