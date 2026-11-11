'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  Package,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Unlock,
  ChevronRight,
  BarChart3,
  CreditCard,
  Eye,
  Store as StoreIcon,
  Settings,
  KeyRound,
  Pencil,
  Trash2,
  Megaphone,
  Send,
  FileSpreadsheet,
  Download,
  Sparkles,
  Receipt,
  Award,
  Check,
  ExternalLink,
  X,
  Layers,
  HelpCircle,
  ShieldCheck,
  CheckSquare,
  Square,
  Bell,
  BellRing,
  Database,
  Server,
  Printer,
  History,
  AlertCircle,
  Activity,
  Info
} from 'lucide-react';
import { apiService } from '@/services/api';
import {
  StoreResponseDto,
  CreateStoreDto,
  UpdateStoreDto,
  PlatformStatsDto,
  StoreOverviewDto,
  SubscriptionPaymentDto,
  RecordPaymentDto,
  PlatformAnnouncementDto,
  CreateAnnouncementDto,
  PlatformAnalyticsDto,
  BroadcastResultDto,
  SendExpiryAlertsResultDto,
  PlatformAuditLogDto,
  SystemHealthDto
} from '@/types/api';
import { StoreSettingsModal } from '@/components/modals/StoreSettingsModal';

interface SuperAdminViewProps {
  onSelectStoreToInspect: (store: StoreResponseDto) => void;
}

type SuperAdminTab = 'stores' | 'analytics' | 'payments' | 'announcements' | 'audit' | 'system' | 'plans';

export function SuperAdminView({ onSelectStoreToInspect }: SuperAdminViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<SuperAdminTab>('stores');
  const [stores, setStores] = useState<StoreResponseDto[]>([]);
  const [stats, setStats] = useState<PlatformStatsDto | null>(null);
  const [analytics, setAnalytics] = useState<PlatformAnalyticsDto | null>(null);
  const [payments, setPayments] = useState<SubscriptionPaymentDto[]>([]);
  const [announcements, setAnnouncements] = useState<PlatformAnnouncementDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired' | 'expiring_soon'>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  // Enterprise States & Selection
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [isBulkPlanModalOpen, setIsBulkPlanModalOpen] = useState(false);
  const [bulkPlan, setBulkPlan] = useState('Standart');
  const [bulkMonthlyFee, setBulkMonthlyFee] = useState(150000);

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'selected'>('all');
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResultDto | null>(null);

  const [expiryAlertResult, setExpiryAlertResult] = useState<SendExpiryAlertsResultDto | null>(null);
  const [isAlertResultModalOpen, setIsAlertResultModalOpen] = useState(false);
  const [sendingAlerts, setSendingAlerts] = useState(false);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<SubscriptionPaymentDto | null>(null);

  const [auditLogs, setAuditLogs] = useState<PlatformAuditLogDto[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilterAction, setAuditFilterAction] = useState<string>('all');

  const [systemHealth, setSystemHealth] = useState<SystemHealthDto | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  const [selectedStore, setSelectedStore] = useState<StoreResponseDto | null>(null);
  const [selectedOverview, setSelectedOverview] = useState<StoreOverviewDto | null>(null);

  // Form States
  const [newStore, setNewStore] = useState<CreateStoreDto>({
    name: '',
    ownerFullName: '',
    phone: '+998 ',
    address: '',
    monthlyFee: 150000,
    plan: 'Standart',
    subscriptionDays: 30,
    adminUsername: '',
    adminPassword: ''
  });

  const [editStoreData, setEditStoreData] = useState<UpdateStoreDto>({
    name: '',
    ownerFullName: '',
    phone: '',
    address: '',
    monthlyFee: 150000,
    plan: 'Standart',
    isActive: true,
    subscriptionExpiresAt: ''
  });

  const [paymentForm, setPaymentForm] = useState<RecordPaymentDto>({
    storeId: 0,
    amount: 150000,
    paymentMethod: 'Naqd',
    daysAdded: 30,
    note: ''
  });

  const [newPassword, setNewPassword] = useState('');
  const [extendDays, setExtendDays] = useState(30);

  const [announcementForm, setAnnouncementForm] = useState<CreateAnnouncementDto>({
    title: '',
    message: '',
    type: 'info',
    activeDays: 7
  });

  const [submitting, setSubmitting] = useState(false);

  // Data Loading
  const loadData = async () => {
    setLoading(true);
    try {
      const [storesData, statsData, analyticsData, paymentsData, announcementsData] = await Promise.all([
        apiService.getStores(),
        apiService.getPlatformStats(),
        apiService.getPlatformAnalytics().catch(() => null),
        apiService.getSubscriptionPayments().catch(() => []),
        apiService.getPlatformAnnouncements().catch(() => [])
      ]);

      setStores(storesData);
      setStats(statsData);
      setAnalytics(analyticsData);
      setPayments(paymentsData);
      setAnnouncements(announcementsData);
    } catch (err: any) {
      alert(`Ma'lumotlarni yuklashda xatolik: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const data = await apiService.getPlatformAuditLogs(100);
      setAuditLogs(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const loadSystemHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await apiService.getSystemHealth();
      setSystemHealth(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'audit' && auditLogs.length === 0) {
      loadAuditLogs();
    } else if (activeSubTab === 'system' && !systemHealth) {
      loadSystemHealth();
    }
  }, [activeSubTab]);

  const handleToggleSelectStore = (id: number) => {
    setSelectedStoreIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllToggle = (currentFiltered: StoreResponseDto[]) => {
    if (selectedStoreIds.length === currentFiltered.length && currentFiltered.length > 0) {
      setSelectedStoreIds([]);
    } else {
      setSelectedStoreIds(currentFiltered.map(s => s.id));
    }
  };

  const handleBulkExtend = async (days: number) => {
    if (selectedStoreIds.length === 0) return;
    if (!confirm(`${selectedStoreIds.length} ta do'kon obunasini +${days} kunga uzaytirmoqchimisiz?`)) return;
    setSubmitting(true);
    try {
      const res = await apiService.bulkExtendSubscription({ storeIds: selectedStoreIds, days });
      alert(res.message);
      setSelectedStoreIds([]);
      loadData();
    } catch (err: any) {
      alert(`Xatolik: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkToggleStatus = async (isActive: boolean) => {
    if (selectedStoreIds.length === 0) return;
    const actionText = isActive ? "faollashtirmoqchimisiz" : "to'xtatmoqchimisiz (bloklamoqchimisiz)";
    if (!confirm(`${selectedStoreIds.length} ta do'konni ${actionText}?`)) return;
    setSubmitting(true);
    try {
      const res = await apiService.bulkToggleStatus({ storeIds: selectedStoreIds, isActive });
      alert(res.message);
      setSelectedStoreIds([]);
      loadData();
    } catch (err: any) {
      alert(`Xatolik: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkChangePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStoreIds.length === 0) return;
    setSubmitting(true);
    try {
      const res = await apiService.bulkChangePlan({ storeIds: selectedStoreIds, plan: bulkPlan, monthlyFee: bulkMonthlyFee });
      alert(res.message);
      setIsBulkPlanModalOpen(false);
      setSelectedStoreIds([]);
      loadData();
    } catch (err: any) {
      alert(`Xatolik: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBroadcastTelegramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) {
      alert("Xabar matnini kiriting!");
      return;
    }
    setSubmitting(true);
    try {
      const targetIds = broadcastTarget === 'selected' ? selectedStoreIds : null;
      const res = await apiService.broadcastTelegram({ message: broadcastMessage, storeIds: targetIds });
      setBroadcastResult(res);
      setBroadcastMessage('');
    } catch (err: any) {
      alert(`Telegram xabarnoma yuborishda xatolik: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendExpiryAlerts = async () => {
    if (!confirm("Obunasi tugagan yoki 3 kun ichida tugaydigan barcha do'konlarga Telegram bot orqali eslatma yuborilsinmi?")) return;
    setSendingAlerts(true);
    try {
      const res = await apiService.sendSubscriptionExpiryAlerts();
      setExpiryAlertResult(res);
      setIsAlertResultModalOpen(true);
    } catch (err: any) {
      alert(`Eslatmalarni yuborishda xatolik: ${err.message}`);
    } finally {
      setSendingAlerts(false);
    }
  };

  const handleOpenReceiptModal = (payment: SubscriptionPaymentDto) => {
    setSelectedPaymentForReceipt(payment);
    setIsReceiptModalOpen(true);
  };

  // Formatters
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Belgilanmagan';
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return 'Belgilanmagan';
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handlers
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiService.createStore(newStore);
      setIsAddModalOpen(false);
      setNewStore({
        name: '',
        ownerFullName: '',
        phone: '+998 ',
        address: '',
        monthlyFee: 150000,
        plan: 'Standart',
        subscriptionDays: 30,
        adminUsername: '',
        adminPassword: ''
      });
      loadData();
    } catch (err: any) {
      alert(`Do'kon yaratishda xatolik: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (store: StoreResponseDto) => {
    setSelectedStore(store);
    setEditStoreData({
      name: store.name,
      ownerFullName: store.ownerFullName,
      phone: store.phone,
      address: store.address || '',
      monthlyFee: store.monthlyFee,
      plan: store.plan || 'Standart',
      isActive: store.isActive,
      subscriptionExpiresAt: store.subscriptionExpiresAt ? store.subscriptionExpiresAt.split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    setSubmitting(true);
    try {
      await apiService.updateStore(selectedStore.id, editStoreData);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Do'konni yangilashda xatolik: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (store: StoreResponseDto) => {
    const actionText = store.isActive ? "bloklamoqchimisiz" : "faollashtirmoqchimisiz";
    if (!confirm(`'${store.name}' do'konini ${actionText}?`)) return;

    try {
      await apiService.toggleStoreStatus(store.id);
      loadData();
    } catch (err: any) {
      alert(`Holatni o'zgartirishda xatolik: ${err.message}`);
    }
  };

  const handleDeleteStore = async (store: StoreResponseDto) => {
    const promptName = prompt(
      `DIQQAT! '${store.name}' do'koni va uning barcha savdo/tovar ma'lumotlari butunlay o'chiriladi!\nTasdiqlash uchun do'kon nomini kiriting:`
    );
    if (promptName !== store.name) {
      if (promptName !== null) alert("Do'kon nomi mos kelmadi. O'chirish bekor qilindi.");
      return;
    }

    try {
      await apiService.deleteStore(store.id);
      alert(`'${store.name}' do'koni muvaffaqiyatli o'chirildi.`);
      loadData();
    } catch (err: any) {
      alert(`Do'konni o'chirishda xatolik: ${err.message}`);
    }
  };

  const handleExtendSubscription = async () => {
    if (!selectedStore) return;
    setSubmitting(true);
    try {
      await apiService.extendSubscription(selectedStore.id, extendDays);
      setIsExtendModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Obunani uzaytirishda xatolik: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRecordPayment = (store: StoreResponseDto) => {
    setSelectedStore(store);
    setPaymentForm({
      storeId: store.id,
      amount: store.monthlyFee,
      paymentMethod: 'Naqd',
      daysAdded: 30,
      note: `${store.name} do'koni uchun obuna to'lovi`
    });
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    setSubmitting(true);
    try {
      await apiService.recordSubscriptionPayment(selectedStore.id, paymentForm);
      setIsPaymentModalOpen(false);
      alert(`To'lov muvaffaqiyatli qayd etildi va '${selectedStore.name}' obunasi uzaytirildi!`);
      loadData();
    } catch (err: any) {
      alert(`To'lovni qayd qilishda xatolik: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    if (newPassword.length < 4) {
      alert("Parol kamida 4 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    setSubmitting(true);
    try {
      await apiService.resetAdminPassword(selectedStore.id, newPassword);
      setIsResetPasswordModalOpen(false);
      setNewPassword('');
      alert(`'${selectedStore.name}' admin paroli muvaffaqiyatli yangilandi!`);
    } catch (err: any) {
      alert(`Parolni yangilashda xatolik: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiService.createPlatformAnnouncement(announcementForm);
      setIsAnnouncementModalOpen(false);
      setAnnouncementForm({
        title: '',
        message: '',
        type: 'info',
        activeDays: 7
      });
      loadData();
    } catch (err: any) {
      alert(`E'lon yaratishda xatolik: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm("Ushbu e'lonni o'chirishga ishonchingiz komilmi?")) return;
    try {
      await apiService.deletePlatformAnnouncement(id);
      loadData();
    } catch (err: any) {
      alert(`E'lonni o'chirishda xatolik: ${err.message}`);
    }
  };

  const handleViewOverview = async (store: StoreResponseDto) => {
    try {
      const overview = await apiService.getStoreOverview(store.id);
      setSelectedStore(store);
      setSelectedOverview(overview);
      setIsOverviewModalOpen(true);
    } catch (err: any) {
      alert(`Ko'rsatkichlarni yuklashda xatolik: ${err.message}`);
    }
  };

  // Stores whose subscription expires in <= 3 days (or already expired)
  const expiringStores = stores.filter(s => {
    if (!s.subscriptionExpiresAt) return false;
    const diffMs = new Date(s.subscriptionExpiresAt).getTime() - Date.now();
    const daysLeft = diffMs / (1000 * 60 * 60 * 24);
    return daysLeft <= 3;
  });

  // Filtered stores
  const filteredStores = stores.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerFullName.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search);

    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
          ? s.isActive && !s.isSubscriptionExpired
          : filterStatus === 'expired'
            ? s.isSubscriptionExpired
            : filterStatus === 'expiring_soon'
              ? Boolean(s.subscriptionExpiresAt && ((new Date(s.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 3))
              : !s.isActive;

    const matchesPlan = filterPlan === 'all' ? true : s.plan === filterPlan;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* TOP HEADER */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                SaaS Boshqaruv Markazi
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Oson Savdo Multi-Tenant SaaS
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Barcha do&apos;konlar, obuna muddatlari, oylik to&apos;lovlar (MRR), kvitansiyalar va platforma xavfsizligini markazlashtirilgan tarzda boshqaring.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href={apiService.getExportStoresCsvUrl()}
              download
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-2xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition shadow-sm"
              title="Barcha do'konlar ma'lumotlarini Excel/CSV formatida yuklab olish"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Excel (.CSV)</span>
            </a>

            <button
              onClick={() => {
                setBroadcastTarget('all');
                setIsBroadcastModalOpen(true);
              }}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-sky-600/20 active:scale-95"
              title="Barcha do'konlarga Telegram bot orqali ommaviy xabarnoma jo'natish"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram Xabar</span>
            </button>

            <button
              onClick={handleSendExpiryAlerts}
              disabled={sendingAlerts}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-amber-600/20 active:scale-95 disabled:opacity-50"
              title="Muddati tugayotgan do'konlarga avtomatik Telegram eslatma yuborish"
            >
              <BellRing className={`w-3.5 h-3.5 ${sendingAlerts ? 'animate-bounce' : ''}`} />
              <span>{sendingAlerts ? 'Eslatmalar...' : 'Obuna Eslatmalari'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi Do&apos;kon Qo&apos;shish</span>
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition"
              title="Ma'lumotlarni yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-800/80 overflow-x-auto pb-1">
          {[
            { id: 'stores' as SuperAdminTab, label: "Do'konlar Ro'yxati", icon: Building2, count: stores.length },
            { id: 'analytics' as SuperAdminTab, label: 'MRR & Moliyaviy Analitika', icon: TrendingUp, badge: 'MRR / GMV' },
            { id: 'payments' as SuperAdminTab, label: 'Obuna To\'lovlari & Kvitansiyalar', icon: Receipt, count: payments.length },
            { id: 'announcements' as SuperAdminTab, label: 'Bildirishnomalar & Telegram', icon: Megaphone, count: announcements.length },
            { id: 'audit' as SuperAdminTab, label: 'Audit & Xavfsizlik Jurnali', icon: History },
            { id: 'system' as SuperAdminTab, label: 'Tizim Holati & Backup', icon: Server },
            { id: 'plans' as SuperAdminTab, label: 'Tarif Rejalari (Plans)', icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition ${isActive
                    ? 'bg-white text-slate-900 shadow-lg'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-700 text-slate-300'
                      }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: DO'KONLAR RO'YXATI */}
      {activeSubTab === 'stores' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Jami Do&apos;konlar</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{stats?.totalStores || stores.length}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Faol Obunalar</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats?.activeStores || 0}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Obunasi Tugagan</p>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400">{stats?.expiredSubscriptionStores || 0}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Oylik SaaS MRR</p>
                <p className="text-xl font-black text-violet-600 dark:text-violet-400">
                  {formatMoney(stats?.projectedMonthlySaaSFee || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Expiring Soon Banner */}
          {expiringStores.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{expiringStores.length} ta do&apos;konning obunasi tugagan yoki 3 kundan kam vaqt qolgan!</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black">
                      Diqqat
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Do&apos;konlar savdosi to&apos;xtab qolmasligi uchun egalariga Telegram bot orqali rasmiy eslatma xabarnomasini yuboring.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setFilterStatus('expiring_soon')}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 rounded-2xl text-xs font-bold transition text-center"
                >
                  Filtr bilan ko&apos;rish
                </button>
                <button
                  type="button"
                  onClick={handleSendExpiryAlerts}
                  disabled={sendingAlerts}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/30 transition active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingAlerts ? 'Yuborilmoqda...' : 'Telegram Botdan Eslatma'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Do'kon nomi, egasi yoki telefon raqami bo'yicha qidiruv..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Select All Toggle */}
              <button
                type="button"
                onClick={() => handleSelectAllToggle(filteredStores)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                {selectedStoreIds.length === filteredStores.length && filteredStores.length > 0 ? (
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  {selectedStoreIds.length === filteredStores.length && filteredStores.length > 0
                    ? 'Tanlovni bekor qilish'
                    : 'Barchasini tanlash'}
                </span>
              </button>

              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              >
                <option value="all">Barcha holatlar ({stores.length})</option>
                <option value="active">Faqat faollar</option>
                <option value="expiring_soon">⏳ Tugashiga &le; 3 kun qolganlar ({expiringStores.length})</option>
                <option value="expired">Obunasi tugaganlar</option>
                <option value="inactive">Bloklanganlar</option>
              </select>

              {/* Plan filter */}
              <select
                value={filterPlan}
                onChange={e => setFilterPlan(e.target.value)}
                className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Barcha tariflar</option>
                <option value="Start">Start</option>
                <option value="Standart">Standart</option>
                <option value="Pro">Pro</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
          </div>

          {/* Stores Cards Grid */}
          {loading ? (
            <div className="text-center py-16 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
              Do&apos;konlar ma&apos;lumotlari yuklanmoqda...
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
              <p className="font-bold text-slate-700 dark:text-slate-300">Mos keluvchi do&apos;konlar topilmadi</p>
              <p className="text-xs mt-1">Qidiruv parametrlarini o&apos;zgartirib ko&apos;ring</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStores.map(store => {
                const isExpired = store.isSubscriptionExpired;
                const isActive = store.isActive;
                const isSelected = selectedStoreIds.includes(store.id);

                return (
                  <div
                    key={store.id}
                    className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between ${isSelected
                        ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/5'
                        : !isActive
                          ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/10'
                          : isExpired
                            ? 'border-amber-200 dark:border-amber-900/50'
                            : 'border-slate-200 dark:border-slate-800'
                      }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          {/* Selection Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelectStore(store.id);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition shrink-0"
                            title="Ommaviy amallar uchun tanlash"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                            )}
                          </button>

                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0">
                            {store.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                              {store.name}
                            </h3>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <span>{store.ownerFullName}</span>
                            </p>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${!isActive
                                ? 'bg-rose-500/10 text-rose-600'
                                : isExpired
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : 'bg-emerald-500/10 text-emerald-600'
                              }`}
                          >
                            {!isActive ? 'Bloklangan' : isExpired ? 'Obunasi tugagan' : 'Faol'}
                          </span>

                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            Tarif: {store.plan || 'Standart'}
                          </span>
                        </div>
                      </div>

                      {/* Store Details */}
                      <div className="py-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> Telefon:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${store.phone}`}
                              className="font-mono font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600"
                            >
                              {store.phone}
                            </a>
                            <a
                              href={
                                store.phone.replace(/[^0-9]/g, '') === '998918028184'
                                  ? 'https://t.me/Jumabekov_014'
                                  : `https://t.me/${store.phone.replace(/[^0-9]/g, '')}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-500 hover:opacity-80"
                              title="Telegramda ochish"
                            >
                              <Send className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {store.address && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" /> Manzil:
                            </span>
                            <span className="truncate max-w-[160px] text-right font-medium">
                              {store.address}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> Obuna muddati:
                          </span>
                          <span
                            className={`font-semibold ${isExpired
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                : 'text-slate-800 dark:text-slate-200'
                              }`}
                          >
                            {formatDate(store.subscriptionExpiresAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" /> Oylik obuna stavkasi:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatMoney(store.monthlyFee)}
                          </span>
                        </div>
                      </div>

                      {/* Store Performance Stats Pill */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400">Jami Savdo</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate font-mono text-[11px]">
                            {formatMoney(store.totalRevenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">Bugun</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 truncate font-mono text-[11px]">
                            {formatMoney(store.todayRevenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">Tovarlar</p>
                          <p className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                            {store.productsCount} ta
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ACTION TOOLBAR */}
                    <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        {/* Inspect / Impersonate */}
                        <button
                          onClick={() => onSelectStoreToInspect(store)}
                          className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-95"
                          title="Do'kon boshqaruv paneliga kirish (Monitoring)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Do&apos;konni Ko&apos;rish</span>
                        </button>

                        {/* Record Payment */}
                        <button
                          onClick={() => handleOpenRecordPayment(store)}
                          className="py-2 px-2.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1 transition"
                          title="Obuna to'lovini qabul qilish"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>To&apos;lov</span>
                        </button>
                      </div>

                      {/* Icon actions row */}
                      <div className="flex items-center justify-between gap-1 pt-1">
                        {/* Extend Subscription */}
                        <button
                          onClick={() => {
                            setSelectedStore(store);
                            setIsExtendModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition"
                          title="Obunani uzaytirish"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>

                        {/* Edit details */}
                        <button
                          onClick={() => handleOpenEdit(store)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition"
                          title="Do'kon parametrlarini tahrirlash"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Reset password */}
                        <button
                          onClick={() => {
                            setSelectedStore(store);
                            setNewPassword('');
                            setIsResetPasswordModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-xl transition"
                          title="Admin login/parolini tiklash"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Overview stats */}
                        <button
                          onClick={() => handleViewOverview(store)}
                          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                          title="Batafsil moliyaviy hisobot"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>

                        {/* Settings (Bot, Cashback, Scale) */}
                        <button
                          onClick={() => {
                            setSelectedStore(store);
                            setIsSettingsModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-xl transition"
                          title="Do'kon sozlamalari (Telegram Bot, Keshbek & Tarozi)"
                        >
                          <Settings className="w-4 h-4" />
                        </button>

                        {/* Toggle Active status */}
                        <button
                          onClick={() => handleToggleStatus(store)}
                          className={`p-2 rounded-xl transition ${store.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          title={store.isActive ? "Do'konni bloklash" : "Do'konni faollashtirish"}
                        >
                          {store.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>

                        {/* Delete store */}
                        <button
                          onClick={() => handleDeleteStore(store)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition"
                          title="Do'konni butunlay o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Bulk Actions Toolbar */}
          {selectedStoreIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white border border-slate-700/80 px-6 py-3.5 rounded-3xl shadow-2xl flex items-center gap-3 flex-wrap animate-in slide-in-from-bottom-5">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-2 pr-3 border-r border-slate-700">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                {selectedStoreIds.length} ta do&apos;kon tanlandi
              </span>
              <button
                type="button"
                onClick={() => handleBulkExtend(30)}
                disabled={submitting}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                +30 Kun
              </button>
              <button
                type="button"
                onClick={() => handleBulkExtend(90)}
                disabled={submitting}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                +90 Kun
              </button>
              <button
                type="button"
                onClick={() => handleBulkToggleStatus(true)}
                disabled={submitting}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Unlock className="w-3.5 h-3.5" />
                Faollashtirish
              </button>
              <button
                type="button"
                onClick={() => handleBulkToggleStatus(false)}
                disabled={submitting}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                Bloklash
              </button>
              <button
                type="button"
                onClick={() => setIsBulkPlanModalOpen(true)}
                disabled={submitting}
                className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Award className="w-3.5 h-3.5" />
                Tarifni o&apos;zgartirish
              </button>
              <button
                type="button"
                onClick={() => {
                  setBroadcastTarget('selected');
                  setIsBroadcastModalOpen(true);
                }}
                disabled={submitting}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                Telegram Xabar
              </button>
              <button
                type="button"
                onClick={() => setSelectedStoreIds([])}
                className="p-2 text-slate-400 hover:text-white rounded-xl transition"
                title="Tanlovni tozalash"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MRR & SAAS FINANCIAL ANALYTICS */}
      {activeSubTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Hero SaaS Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 rounded-3xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                MRR (Oylik Obunadan Daromad)
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {formatMoney(analytics.monthlyRecurringRevenue)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Har oy platformaga tushadigan barqaror tushum</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border border-violet-500/20 rounded-3xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                ARR (Yillik Run Rate Proyeksiyasi)
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {formatMoney(analytics.annualRecurringRevenue)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">MRR × 12 oylik umumiy kutilayotgan aylanma</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-3xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Platforma GMV (Jami Savdo)
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {formatMoney(analytics.totalPlatformGmv)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Barcha do&apos;konlar orqali o&apos;tgan tovar aylanmasi</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-3xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                ARPU (O&apos;rtacha To&apos;lov)
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {formatMoney(analytics.averageRevenuePerStore)}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Bitta faol do&apos;kondan olinadigan oylik daromad</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Performing Stores */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Top 5 Eng Ilg&apos;or Do&apos;konlar (Savdo bo&apos;yicha)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Platforma yetakchilari</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">Do&apos;kon</th>
                      <th className="py-2.5 px-3">Tarif</th>
                      <th className="py-2.5 px-3 text-right">Bugungi Savdo</th>
                      <th className="py-2.5 px-3 text-right">Jami Aylanma</th>
                      <th className="py-2.5 px-3 text-center">Tovarlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {analytics.topStores.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white">{t.name}</p>
                              <p className="text-[10px] text-slate-400">{t.ownerFullName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                            {t.plan}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                          {formatMoney(t.todaySales)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-white">
                          {formatMoney(t.totalSales)}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-500">
                          {t.productsCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Plans Distribution */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Tariflar Bo&apos;yicha Taqsimot
                </h3>
              </div>

              <div className="space-y-3">
                {analytics.plansDistribution.map(p => {
                  const share = Math.round((p.count / (analytics.totalStores || 1)) * 100);
                  return (
                    <div key={p.plan} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800 dark:text-white">{p.plan} Tarifi</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{p.count} ta do&apos;kon ({share}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${share}%` }} />
                      </div>
                      <p className="text-[11px] text-slate-400 text-right">
                        Oylik tushum: <b>{formatMoney(p.totalMonthlyFee)}</b>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OBUNA TO'LOVLARI & KVITANSIYALAR */}
      {activeSubTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Barcha Qabul Qilingan Obuna To&apos;lovlari
              </h3>
              <p className="text-xs text-slate-400">Do&apos;konlar tomonidan to&apos;langan oylik to&apos;lovlar tarixi</p>
            </div>
            <button
              onClick={() => {
                if (stores.length > 0) handleOpenRecordPayment(stores[0]);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi To&apos;lov Qayd Qilish</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400">
                    <th className="py-3 px-4 font-semibold">Kvitansiya #</th>
                    <th className="py-3 px-4 font-semibold">Do&apos;kon Nomi</th>
                    <th className="py-3 px-4 font-semibold text-right">Summa</th>
                    <th className="py-3 px-4 font-semibold">To&apos;lov Usuli</th>
                    <th className="py-3 px-4 font-semibold text-center">Qo&apos;shilgan Muddat</th>
                    <th className="py-3 px-4 font-semibold">To&apos;langan Sana</th>
                    <th className="py-3 px-4 font-semibold">Izoh</th>
                    <th className="py-3 px-4 font-semibold text-center">Hujjat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        Hozircha hech qanday obuna to&apos;lovlari qayd etilmagan.
                      </td>
                    </tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                          {p.receiptNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">
                          {p.storeName}
                        </td>
                        <td className="py-3 px-4 text-right font-bold font-mono text-emerald-600 text-sm">
                          {formatMoney(p.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-600 dark:text-slate-400">
                          +{p.daysAdded} kun
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {formatDateTime(p.paidAt)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                          {p.note || '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenReceiptModal(p)}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition shadow-xs active:scale-95"
                            title="To'lov kvitansiyasini chiqarish"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Kvitansiya</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OMMAVIY BILDIRISHNOMALAR (ANNOUNCEMENTS) */}
      {activeSubTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Barcha Do&apos;konlarga Ommaviy Bildirishnomalar
              </h3>
              <p className="text-xs text-slate-400">
                Ushbu e&apos;lonlar platformadagi barcha do&apos;kon adminlari va kassirlari ekranida yuqorida ko&apos;rinadi
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setBroadcastTarget('all');
                  setIsBroadcastModalOpen(true);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Telegram Bot Xabar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAnnouncementModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi E&apos;lon Yaratish</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
                <p>Hozirda faol e&apos;lonlar mavjud emas</p>
              </div>
            ) : (
              announcements.map(a => (
                <div
                  key={a.id}
                  className={`p-5 rounded-3xl border space-y-3 relative ${a.type === 'warning'
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                      : a.type === 'alert'
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                        : a.type === 'success'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                          : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{a.title}</h4>
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="E'lonni o'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{a.message}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] text-slate-400">
                    <span>Yaratilgan: {formatDateTime(a.createdAt)}</span>
                    {a.expiresAt && <span>Amal qilish: {formatDate(a.expiresAt)} gacha</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: AUDIT & XAVFSIZLIK JURNALI */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <span>Platforma Harakatlari va Xavfsizlik Jurnali</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                SuperAdmin tomonidan amalga oshirilgan barcha tizim o&apos;zgarishlari, to&apos;lovlar, parollarni tiklash va ommaviy amallar tarixi
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditFilterAction}
                onChange={e => setAuditFilterAction(e.target.value)}
                className="text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              >
                <option value="all">Barcha amallar</option>
                <option value="StoreCreated">Yangi do&apos;konlar</option>
                <option value="SubscriptionExtended">Obuna uzaytirishlar</option>
                <option value="PaymentRecorded">To&apos;lovlar</option>
                <option value="AdminPasswordReset">Parol tiklashlar</option>
                <option value="StoreStatusToggled">Holat o&apos;zgartirishlar</option>
                <option value="BulkExtendSubscription">Ommaviy uzaytirish</option>
                <option value="BulkToggleStatus">Ommaviy bloklash/faollashtirish</option>
                <option value="BroadcastTelegram">Telegram xabarlar</option>
                <option value="SendExpiryAlerts">Eslatmalar</option>
              </select>

              <button
                type="button"
                onClick={loadAuditLogs}
                disabled={loadingAudit}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition"
                title="Yangilash"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAudit ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400">
                    <th className="py-3 px-4 font-semibold">Sana & Vaqt</th>
                    <th className="py-3 px-4 font-semibold">Amal Turi</th>
                    <th className="py-3 px-4 font-semibold">Do&apos;kon</th>
                    <th className="py-3 px-4 font-semibold">Bajaruvchi</th>
                    <th className="py-3 px-4 font-semibold">Tafsilotlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Audit yozuvlari yuklanmoqda...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        Audit jurnali hozircha bo&apos;sh.
                      </td>
                    </tr>
                  ) : (
                    auditLogs
                      .filter(l => auditFilterAction === 'all' || l.action === auditFilterAction)
                      .map(log => {
                        const isSuccess = log.action.includes('Created') || log.action.includes('Payment') || log.action.includes('Extend');
                        const isWarn = log.action.includes('Reset') || log.action.includes('Alert');
                        const isDanger = log.action.includes('Delete') || log.action.includes('Block');

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                              {formatDateTime(log.createdAt)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isDanger
                                    ? 'bg-rose-500/10 text-rose-600'
                                    : isWarn
                                      ? 'bg-amber-500/10 text-amber-600'
                                      : isSuccess
                                        ? 'bg-emerald-500/10 text-emerald-600'
                                        : 'bg-indigo-500/10 text-indigo-600'
                                  }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                              {log.storeName || '-'}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                              {log.performedBy}
                            </td>
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                              {log.details}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TIZIM HOLATI & BACKUP */}
      {activeSubTab === 'system' && (
        <div className="space-y-6">
          {/* System Health Hero */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <Server className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Server & Ma&apos;lumotlar Bazasi Holati</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                    Online / Normal
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  SQLite arxitekturasi, server vaqti va tizim ma&apos;lumotlarining zaxira nusxalarini (Backup) boshqarish
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <a
                href={apiService.getDatabaseBackupUrl()}
                download
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-indigo-600/20 active:scale-95"
                title="Barcha ma'lumotlar bazasini to'liq yuklab olish"
              >
                <Database className="w-4 h-4" />
                <span>Baza Zaxira Nusxasini Yuklab Olish (.db)</span>
              </a>

              <button
                type="button"
                onClick={loadSystemHealth}
                disabled={loadingHealth}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition"
                title="Yangilash"
              >
                <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-600" /> Baza Hajmi
              </span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {systemHealth?.databaseSize || '0 MB'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {systemHealth?.databaseSizeBytes ? `${systemHealth.databaseSizeBytes.toLocaleString()} bayt` : ''}
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Jami Do&apos;konlar
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {systemHealth?.totalStores || stores.length} ta
              </p>
              <p className="text-[11px] text-slate-400">
                Foydalanuvchilar: {systemHealth?.totalUsers || 0} nafar
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" /> Tovar & Savdolar
              </span>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {systemHealth?.totalProducts || 0} tovar
              </p>
              <p className="text-[11px] text-slate-400">
                Jami savdolar: {systemHealth?.totalSales || 0} ta chek
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-amber-600" /> Audit Yozuvlari
              </span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {systemHealth?.totalAuditLogs || 0} ta
              </p>
              <p className="text-[11px] text-slate-400">
                Xarajatlar: {systemHealth?.totalExpenses || 0} ta yozuv
              </p>
            </div>
          </div>

          {/* Server Times and OS details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Server Vaqtlari</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <span className="text-slate-400">Toshkent Mahaliy Vaqti (UZT):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{systemHealth?.serverTimeLocal || '-'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <span className="text-slate-400">Server UTC Vaqti:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{systemHealth?.serverTimeUtc || '-'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Muhit & Xavfsizlik Ma&apos;lumotlari</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <span className="text-slate-400">Operatsion Tizim:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{systemHealth?.osVersion || '-'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <span className="text-slate-400">Ma&apos;lumotlar Bazasi Drayveri:</span>
                  <span className="font-bold text-indigo-600">SQLite 3 (WAL Mode & Multi-tenant)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TARIF REJALARI (PLANS & PRICING) */}
      {activeSubTab === 'plans' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              SaaS Do&apos;konlar Uchun Standart Tarif Rejalari
            </h2>
            <p className="text-xs text-slate-500">
              Do&apos;konlarning hajmiga moslashtirilgan obuna to&apos;lov paketlari va ularga beriladigan imkoniyatlar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Plan 1: Start */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase">
                  🥉 Start
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  100 000 <span className="text-xs font-normal text-slate-400">so&apos;m/oy</span>
                </h3>
                <p className="text-xs text-slate-500">Kichik do&apos;konlar va yangi boshlovchi tadbirkorlar uchun</p>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 1 ta Kassa o&apos;rni</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 500 ta tovar chegarasi</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Nasiya qarzdorlar daftari</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Chek va kvitansiya chop etish</li>
                </ul>
              </div>
              <p className="text-[11px] text-slate-400 font-medium text-center bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                {stores.filter(s => s.plan === 'Start').length} ta do&apos;kon foydalanmoqda
              </p>
            </div>

            {/* Plan 2: Standart (Popular) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-indigo-600 shadow-xl flex flex-col justify-between space-y-5 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white font-bold text-[10px] rounded-full uppercase tracking-wider">
                Eng Ommabop
              </div>
              <div className="space-y-3">
                <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase">
                  🥈 Standart
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  200 000 <span className="text-xs font-normal text-slate-400">so&apos;m/oy</span>
                </h3>
                <p className="text-xs text-slate-500">O&apos;rta oziq-ovqat va kiyim-kechak do&apos;konlari uchun</p>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 3 ta Kassa o&apos;rni</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> 5 000 ta tovar hajmi</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Telegram Bot Z-Hisobot</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Mijozlar Keshbek tizimi</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Excel Import & Export</li>
                </ul>
              </div>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium text-center bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-xl">
                {stores.filter(s => s.plan === 'Standart').length} ta do&apos;kon foydalanmoqda
              </p>
            </div>

            {/* Plan 3: Pro */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <span className="px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-bold text-xs uppercase">
                  🥇 Pro / Business
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  350 000 <span className="text-xs font-normal text-slate-400">so&apos;m/oy</span>
                </h3>
                <p className="text-xs text-slate-500">Katta supermarket va ko&apos;p tarmoqli savdo nuqtalari uchun</p>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Cheksiz kassirlar</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Elektron Tarozi shtrix-kodi</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> ABC & Dead Stock analitikasi</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> Ombor Reviziyasi (Sanoq)</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-500" /> SMS qarz eslatmalari</li>
                </ul>
              </div>
              <p className="text-[11px] text-slate-400 font-medium text-center bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                {stores.filter(s => s.plan === 'Pro').length} ta do&apos;kon foydalanmoqda
              </p>
            </div>

            {/* Plan 4: VIP */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-amber-300 dark:border-amber-800/60 shadow-xs flex flex-col justify-between space-y-5 bg-gradient-to-b from-amber-50/20 to-transparent">
              <div className="space-y-3">
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase">
                  💎 VIP Tarmoq
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  600 000 <span className="text-xs font-normal text-slate-400">so&apos;m/oy</span>
                </h3>
                <p className="text-xs text-slate-500">Franshiza va yirik savdo tarmoqlari uchun maxsus servis</p>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-500" /> Barcha Pro imkoniyatlar</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-500" /> Shaxsiy menejer va 24/7 yordam</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-500" /> Maxsus API & 1C integratsiyasi</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-500" /> Barcha filiallar konsolidatsiyasi</li>
                </ul>
              </div>
              <p className="text-[11px] text-amber-600 font-medium text-center bg-amber-50 dark:bg-amber-950/30 p-2 rounded-xl">
                {stores.filter(s => s.plan === 'VIP').length} ta do&apos;kon foydalanmoqda
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS SECTION */}
      {/* ============================================================== */}

      {/* MODAL 1: YANGI DO'KON QO'SHISH */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Yangi Do&apos;kon Qo&apos;shish</h3>
                  <p className="text-[11px] text-slate-400">Do&apos;kon ma&apos;lumotlari va boshlang&apos;ich admin kirish login/paroli</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Do&apos;kon Nomi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Chorsu Market"
                    value={newStore.name}
                    onChange={e => setNewStore({ ...newStore, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Egasi F.I.SH *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Alisher Usmonov"
                    value={newStore.ownerFullName}
                    onChange={e => setNewStore({ ...newStore, ownerFullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefon Raqami *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+998 91 802 8184"
                    value={newStore.phone}
                    onChange={e => setNewStore({ ...newStore, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Manzil
                  </label>
                  <input
                    type="text"
                    placeholder="Guliston shahar"
                    value={newStore.address || ''}
                    onChange={e => setNewStore({ ...newStore, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tarif Rejasi
                  </label>
                  <select
                    value={newStore.plan}
                    onChange={e => {
                      const p = e.target.value;
                      const fee = p === 'Start' ? 100000 : p === 'Pro' ? 350000 : p === 'VIP' ? 600000 : 200000;
                      setNewStore({ ...newStore, plan: p, monthlyFee: fee });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Start">Start (100k)</option>
                    <option value="Standart">Standart (200k)</option>
                    <option value="Pro">Pro (350k)</option>
                    <option value="VIP">VIP (600k)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Oylik To&apos;lov (so&apos;m)
                  </label>
                  <input
                    type="number"
                    value={newStore.monthlyFee}
                    onChange={e => setNewStore({ ...newStore, monthlyFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Muddat (kun)
                  </label>
                  <input
                    type="number"
                    value={newStore.subscriptionDays}
                    onChange={e => setNewStore({ ...newStore, subscriptionDays: parseInt(e.target.value, 10) || 30 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Admin Login & Password */}
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  Do&apos;kon Admini Kirish Hisobi (Login & Parol)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Admin Login *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="chorsu_admin"
                      value={newStore.adminUsername}
                      onChange={e => setNewStore({ ...newStore, adminUsername: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Admin Parol *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Kamida 4 belgi"
                      value={newStore.adminPassword}
                      onChange={e => setNewStore({ ...newStore, adminPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
                >
                  {submitting ? 'Yaratilmoqda...' : 'Do\'konni Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAHRIRLASH (EDIT STORE) */}
      {isEditModalOpen && selectedStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Do&apos;konni Tahrirlash</h3>
                  <p className="text-[11px] text-slate-400">{selectedStore.name} parametrlarini yangilash</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStore} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Do&apos;kon Nomi
                  </label>
                  <input
                    type="text"
                    required
                    value={editStoreData.name}
                    onChange={e => setEditStoreData({ ...editStoreData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Egasi F.I.SH
                  </label>
                  <input
                    type="text"
                    required
                    value={editStoreData.ownerFullName}
                    onChange={e => setEditStoreData({ ...editStoreData, ownerFullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefon Raqami
                  </label>
                  <input
                    type="text"
                    required
                    value={editStoreData.phone}
                    onChange={e => setEditStoreData({ ...editStoreData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Manzil
                  </label>
                  <input
                    type="text"
                    value={editStoreData.address || ''}
                    onChange={e => setEditStoreData({ ...editStoreData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tarif
                  </label>
                  <select
                    value={editStoreData.plan}
                    onChange={e => setEditStoreData({ ...editStoreData, plan: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="Start">Start</option>
                    <option value="Standart">Standart</option>
                    <option value="Pro">Pro</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Oylik To&apos;lov
                  </label>
                  <input
                    type="number"
                    value={editStoreData.monthlyFee}
                    onChange={e => setEditStoreData({ ...editStoreData, monthlyFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Obuna Tugash Sanasi
                  </label>
                  <input
                    type="date"
                    value={editStoreData.subscriptionExpiresAt ? editStoreData.subscriptionExpiresAt.split('T')[0] : ''}
                    onChange={e => setEditStoreData({ ...editStoreData, subscriptionExpiresAt: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: OBUNANI UZAYTIRISH (QUICK EXTEND) */}
      {isExtendModalOpen && selectedStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Obunani Uzaytirish</h3>
                  <p className="text-[11px] text-slate-400">{selectedStore.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsExtendModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Hozirgi amal qilish muddati: <b>{formatDate(selectedStore.subscriptionExpiresAt)}</b>
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Muddatni tanlang:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { days: 30, label: '1 Oy (+30 kun)' },
                  { days: 90, label: '3 Oy (+90 kun)' },
                  { days: 180, label: '6 Oy (+180 kun)' },
                  { days: 365, label: '1 Yil (+365 kun)' }
                ].map(opt => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setExtendDays(opt.days)}
                    className={`p-3 rounded-2xl text-xs font-bold border transition text-center ${extendDays === opt.days
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsExtendModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleExtendSubscription}
                disabled={submitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Uzaytirilmoqda...' : `+${extendDays} Kunga Uzaytirish`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TO'LOV QAYD QILISH (RECORD PAYMENT) */}
      {isPaymentModalOpen && selectedStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Obuna To&apos;lovini Qayd Qilish</h3>
                  <p className="text-[11px] text-slate-400">{selectedStore.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  To&apos;lov Summasi (so&apos;m)
                </label>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    To&apos;lov Usuli
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="Naqd">Naqd pul</option>
                    <option value="Click">Click</option>
                    <option value="Payme">Payme</option>
                    <option value="Hisob-raqam">Hisob-raqam (Perechislenie)</option>
                    <option value="Karta">Bank Kartasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Uzaytiriladigan kun
                  </label>
                  <input
                    type="number"
                    value={paymentForm.daysAdded}
                    onChange={e => setPaymentForm({ ...paymentForm, daysAdded: parseInt(e.target.value, 10) || 30 })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Izoh / Kvitansiya ma&apos;lumoti (Ixtiyoriy)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: 2026-yil noyabr oyi to'lovi"
                  value={paymentForm.note || ''}
                  onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Qayd etilmoqda...' : 'To\'lovni Qayd Qilish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PAROLNI TIKLASH (RESET PASSWORD) */}
      {isResetPasswordModalOpen && selectedStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admin Parolini Tiklash</h3>
                  <p className="text-[11px] text-slate-400">{selectedStore.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Yangi Parolni Kiriting *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: admin2026"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Ushbu parol do&apos;kon boshqaruvchisi uchun darhol kuchga kiradi.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saqlanmoqda...' : 'Yangi Parolni Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: OMMAVIY E'LON YARATISH (BROADCAST ANNOUNCEMENT) */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Ommaviy Bildirishnoma Yuborish</h3>
                  <p className="text-[11px] text-slate-400">Barcha do&apos;konlarning ekranida ko&apos;rinadi</p>
                </div>
              </div>
              <button
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sarlavha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Texnik Profilaktika Yangilanishi"
                  value={announcementForm.title}
                  onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Xabar Matni *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Bugun soat 23:00 da yangi funksiyalar qo'shilishi munosabati bilan..."
                  value={announcementForm.message}
                  onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Xabar Turi
                  </label>
                  <select
                    value={announcementForm.type}
                    onChange={e => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  >
                    <option value="info">Info (Ma&apos;lumot - Ko&apos;k)</option>
                    <option value="warning">Warning (Ogohlantirish - Sariq)</option>
                    <option value="success">Success (Yutuq - Yashil)</option>
                    <option value="alert">Alert (Muhim / Qizil)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amal Qilish (kun)
                  </label>
                  <input
                    type="number"
                    value={announcementForm.activeDays || 7}
                    onChange={e => setAnnouncementForm({ ...announcementForm, activeDays: parseInt(e.target.value, 10) || 7 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Yuborilmoqda...' : 'E\'lonni Tarqatish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: DO'KON OVERVIEW HISOBOTI */}
      {isOverviewModalOpen && selectedStore && selectedOverview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Do&apos;kon Faoliyat Ko&apos;rsatkichlari</h3>
                  <p className="text-[11px] text-slate-400">{selectedStore.name} — {selectedStore.ownerFullName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOverviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] text-slate-400 font-medium">Jami Savdolar Summasi</p>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatMoney(selectedOverview.totalSalesAmount)}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] text-slate-400 font-medium">Mijozlardagi Jami Nasiya</p>
                <p className="text-base font-black text-amber-600 dark:text-amber-400 mt-1">
                  {formatMoney(selectedOverview.totalDebtsGiven)}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] text-slate-400 font-medium">Jami Xarajatlar</p>
                <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-1">
                  {formatMoney(selectedOverview.totalExpenses)}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                <p className="text-[11px] text-slate-400 font-medium">Kam Qolgan Mahsulotlar</p>
                <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {selectedOverview.lowStockProductsCount} xil tovar
                </p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 text-xs space-y-1">
              <p className="text-slate-600 dark:text-slate-300">
                Ro&apos;yxatdan o&apos;tgan sana: <b>{formatDate(selectedStore.createdAt)}</b>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Xodimlar (Admin va Kassirlar): <b>{selectedStore.usersCount} nafar</b>
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setIsOverviewModalOpen(false);
                  onSelectStoreToInspect(selectedStore);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
              >
                <Eye className="w-4 h-4" />
                <span>Ushbu Do&apos;kon Kabinetiga O&apos;tish (Monitoring)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OMMAVIY TARIFNI O'ZGARTIRISH */}
      {isBulkPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Ommaviy Tarifni O&apos;zgartirish</h3>
                  <p className="text-[11px] text-slate-400">{selectedStoreIds.length} ta do&apos;kon tanlangan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkPlanModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkChangePlanSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Yangi Tarif Rejasi
                </label>
                <select
                  value={bulkPlan}
                  onChange={e => {
                    const p = e.target.value;
                    setBulkPlan(p);
                    if (p === 'Start') setBulkMonthlyFee(100000);
                    else if (p === 'Standart') setBulkMonthlyFee(200000);
                    else if (p === 'Pro') setBulkMonthlyFee(350000);
                    else if (p === 'VIP') setBulkMonthlyFee(600000);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                >
                  <option value="Start">Start (100 000 so&apos;m/oy)</option>
                  <option value="Standart">Standart (200 000 so&apos;m/oy)</option>
                  <option value="Pro">Pro / Business (350 000 so&apos;m/oy)</option>
                  <option value="VIP">VIP Tarmoq (600 000 so&apos;m/oy)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Oylik To&apos;lov Miqdori (so&apos;m)
                </label>
                <input
                  type="number"
                  value={bulkMonthlyFee}
                  onChange={e => setBulkMonthlyFee(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkPlanModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'O\'zgartirilmoqda...' : 'Tarifni Yangilash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TELEGRAM BROADCAST */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Telegram Bot Xabarnoma Yuborish</h3>
                  <p className="text-[11px] text-slate-400">
                    {broadcastTarget === 'selected' ? `${selectedStoreIds.length} ta tanlangan do'konga` : `Barcha ${stores.length} ta do'konga`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBroadcastModalOpen(false);
                  setBroadcastResult(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {broadcastResult ? (
              <div className="space-y-4 py-2">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                    Telegram Xabarlar Jo&apos;natildi!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Yetkazildi: <b>{broadcastResult.sentCount} ta</b> | Yetib bormadi: <b>{broadcastResult.failedCount} ta</b>
                  </p>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs">
                  {broadcastResult.details.map((d, i) => (
                    <div key={i} className="text-slate-600 dark:text-slate-300">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBroadcastModalOpen(false);
                      setBroadcastResult(null);
                    }}
                    className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBroadcastTelegramSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kimlarga yuborilsin?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBroadcastTarget('all')}
                      className={`p-3 rounded-2xl text-xs font-bold border transition text-center ${broadcastTarget === 'all'
                          ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                      Barcha Do&apos;konlar ({stores.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastTarget('selected')}
                      disabled={selectedStoreIds.length === 0}
                      className={`p-3 rounded-2xl text-xs font-bold border transition text-center disabled:opacity-40 ${broadcastTarget === 'selected'
                          ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                    >
                      Tanlanganlar ({selectedStoreIds.length})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Xabarnoma Matni *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Hurmatli hamkorlar! Tizimga yangi xarajatlar va kassa smenasi moduli qo'shildi..."
                    value={broadcastMessage}
                    onChange={e => setBroadcastMessage(e.target.value)}
                    className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white resize-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Xabar do&apos;konlarning rasmiy Telegram botiga chiroyli sarlavha va sana bilan avtomatik yuboriladi.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBroadcastModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                  >
                    {submitting ? 'Yuborilmoqda...' : 'Telegram orqali Yuborish'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: OBUNA ESLATMALARI NATIJASI */}
      {isAlertResultModalOpen && expiryAlertResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Obuna Eslatmalari Yuborildi</h3>
                  <p className="text-[11px] text-slate-400">Telegram bot xabarlari hisoboti</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAlertResultModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs">
              <div>
                <p className="text-[10px] text-slate-400">Nomzodlar</p>
                <p className="font-bold text-slate-900 dark:text-white text-base">{expiryAlertResult.totalChecked}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Yetkazildi</p>
                <p className="font-bold text-emerald-600 text-base">{expiryAlertResult.sentCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Boti yo&apos;q</p>
                <p className="font-bold text-amber-600 text-base">{expiryAlertResult.skippedCount}</p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs">
              {expiryAlertResult.details.length === 0 ? (
                <p className="text-slate-400 text-center py-2">Obunasi tugayotgan do&apos;konlar topilmadi.</p>
              ) : (
                expiryAlertResult.details.map((d, i) => (
                  <div key={i} className="text-slate-600 dark:text-slate-300">
                    {d}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAlertResultModalOpen(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RASMIY TO'LOV KVITANSIYASI / INVOYS */}
      {isReceiptModalOpen && selectedPaymentForReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            id="printable-saas-receipt"
            className="bg-white text-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200"
          >
            {/* Header & Logo */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                    OS
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">OSON SAVDO</h2>
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">
                  SaaS Platforma To&apos;lov Kvitansiyasi
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {selectedPaymentForReceipt.receiptNumber}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sana: {formatDateTime(selectedPaymentForReceipt.paidAt)}
                </p>
              </div>
            </div>

            {/* Receipt Details Table */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">To&apos;lovchi Do&apos;kon:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedPaymentForReceipt.storeName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">To&apos;lov Turi:</span>
                <span className="font-bold text-slate-800">{selectedPaymentForReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Qo&apos;shilgan Muddat:</span>
                <span className="font-bold text-slate-800">+{selectedPaymentForReceipt.daysAdded} kun</span>
              </div>
              {selectedPaymentForReceipt.note && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">Izoh:</span>
                  <span className="font-medium text-slate-700">{selectedPaymentForReceipt.note}</span>
                </div>
              )}
              <div className="flex justify-between py-3 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
                <span className="font-bold text-emerald-900 text-sm">To&apos;langan Jami Summa:</span>
                <span className="font-mono font-black text-emerald-700 text-lg">
                  {formatMoney(selectedPaymentForReceipt.amount)}
                </span>
              </div>
            </div>

            {/* Stamp / Signature Area */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">Qabul qildi:</p>
                <p className="italic">Oson Savdo Ma&apos;muriyati</p>
                <div className="w-20 h-10 border-b border-dashed border-slate-400 mt-2" />
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-700">M.O&apos; (Muhr o&apos;rni):</p>
                <div className="w-16 h-16 rounded-full border-2 border-indigo-400/40 flex items-center justify-center text-[10px] text-indigo-400 font-bold ml-auto mt-1">
                  TASDIQLANDI
                </div>
              </div>
            </div>

            {/* Print and Close Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Chop Etish (Printer)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: DO'KON SOZLAMALARI (TELEGRAM, KESHBEK, TAROZI) */}
      <StoreSettingsModal
        isOpen={isSettingsModalOpen}
        store={selectedStore}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
}
