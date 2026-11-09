import {
  ProductResponseDto,
  CreateProductDto,
  UpdateProductDto,
  PagedResultDto,
  ImportResultDto,
  CustomerResponseDto,
  CustomerDebtSummaryDto,
  DebtTransactionResponseDto,
  RepayDebtDto,
  ExpenseResponseDto,
  CreateExpenseDto,
  SaleResponseDto,
  CreateSaleDto,
  DailyReportDto,
  DashboardSummaryDto,
  UserDto,
  LoginDto,
  LoginResponseDto,
  CashShiftResponseDto,
  CurrentShiftSummaryDto,
  OpenShiftDto,
  CloseShiftDto,
  CashOperationResponseDto,
  CreateCashOperationDto,
  SupplierResponseDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  PaySupplierDebtDto,
  SupplyInvoiceResponseDto,
  CreateSupplyInvoiceDto,
  SaleRefundResponseDto,
  CreateRefundDto,
  StoreResponseDto,
  StoreSettingsDto,
  CreateStoreDto,
  UpdateStoreDto,
  PlatformStatsDto,
  StoreOverviewDto,
  HourlySalesDto,
  AbcAnalysisDto,
  WeeklyTrendDto,
  InventoryAuditResponseDto,
  CreateInventoryAuditDto,
  UpdateAuditItemDto,
  DebtReminderResponseDto,
  SubscriptionPaymentDto,
  RecordPaymentDto,
  ResetAdminPasswordDto,
  PlatformAnnouncementDto,
  CreateAnnouncementDto,
  PlatformAnalyticsDto,
  BulkExtendSubscriptionDto,
  BulkToggleStatusDto,
  BulkChangePlanDto,
  BroadcastTelegramDto,
  BroadcastResultDto,
  SendExpiryAlertsResultDto,
  PlatformAuditLogDto,
  SystemHealthDto
} from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://oson-savdo-z0mx.onrender.com/api';
const TOKEN_KEY = 'oson_savdo_token';
const USER_KEY = 'oson_savdo_user';
const SELECTED_STORE_KEY = 'oson_savdo_selected_store';
const PENDING_SALES_KEY = 'oson_savdo_pending_sales';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem(TOKEN_KEY);
  const selectedStore = localStorage.getItem(SELECTED_STORE_KEY);
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (selectedStore) headers['X-Store-Id'] = selectedStore;
  return headers;
}

async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options?.headers || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = `Xatolik: ${res.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || parsed.title || parsed.error || message;

      if (parsed.isSubscriptionExpired && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('subscription_expired', { detail: parsed }));
      }
    } catch {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }

  if (res.status === 204) return {} as T;
  return await res.json();
}

export const apiService = {
  // 1. AUTH & USER MANAGEMENT
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const res = await fetchFromApi<LoginResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res));
    }
    return res;
  },

  getCurrentUser(): LoginResponseDto | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async getMe(): Promise<UserDto> {
    return fetchFromApi<UserDto>('/auth/me', { method: 'GET' });
  },

  async getUsers(): Promise<UserDto[]> {
    return fetchFromApi<UserDto[]>('/auth/users', { method: 'GET' });
  },

  // 2. KASSA SMENASI & Z-HISOBOT (SHIFTS)
  async getCurrentShift(): Promise<CurrentShiftSummaryDto> {
    return fetchFromApi<CurrentShiftSummaryDto>('/shifts/current', { method: 'GET' });
  },

  async openShift(dto: OpenShiftDto): Promise<CashShiftResponseDto> {
    return fetchFromApi<CashShiftResponseDto>('/shifts/open', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async closeShift(shiftId: number, dto: CloseShiftDto): Promise<CashShiftResponseDto> {
    return fetchFromApi<CashShiftResponseDto>(`/shifts/close/${shiftId}`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async getShiftHistory(limit = 30): Promise<CashShiftResponseDto[]> {
    return fetchFromApi<CashShiftResponseDto[]>(`/shifts/history?limit=${limit}`, { method: 'GET' });
  },

  async addCashOperation(shiftId: number, dto: CreateCashOperationDto): Promise<CashOperationResponseDto> {
    return fetchFromApi<CashOperationResponseDto>(`/shifts/${shiftId}/operations`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async getShiftOperations(shiftId: number): Promise<CashOperationResponseDto[]> {
    return fetchFromApi<CashOperationResponseDto[]>(`/shifts/${shiftId}/operations`, { method: 'GET' });
  },

  // 3. PRODUCTS & INVENTORY
  async getProducts(search?: string, lowStockOnly?: boolean): Promise<ProductResponseDto[]> {
    return fetchFromApi<ProductResponseDto[]>(
      `/products?search=${encodeURIComponent(search || '')}&lowStockOnly=${lowStockOnly ? 'true' : ''}`,
      { method: 'GET' }
    );
  },

  async getPagedProducts(
    search?: string,
    category?: string,
    lowStockOnly?: boolean,
    pageNumber = 1,
    pageSize = 50
  ): Promise<PagedResultDto<ProductResponseDto>> {
    const q = new URLSearchParams({
      search: search || '',
      category: category || '',
      lowStockOnly: lowStockOnly ? 'true' : '',
      pageNumber: pageNumber.toString(),
      pageSize: pageSize.toString()
    });
    return fetchFromApi<PagedResultDto<ProductResponseDto>>(`/products/paged?${q.toString()}`, {
      method: 'GET'
    });
  },

  async getCategories(): Promise<string[]> {
    return fetchFromApi<string[]>('/products/categories', { method: 'GET' });
  },

  async getProductByBarcode(barcode: string): Promise<ProductResponseDto> {
    return fetchFromApi<ProductResponseDto>(`/products/barcode/${encodeURIComponent(barcode)}`, {
      method: 'GET'
    });
  },

  async createProduct(dto: CreateProductDto): Promise<ProductResponseDto> {
    return fetchFromApi<ProductResponseDto>('/products', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async updateProduct(id: number, dto: UpdateProductDto): Promise<ProductResponseDto> {
    return fetchFromApi<ProductResponseDto>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  async deleteProduct(id: number): Promise<void> {
    return fetchFromApi<void>(`/products/${id}`, { method: 'DELETE' });
  },

  async importProductsCsv(file: File): Promise<ImportResultDto> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/products/import-csv`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      throw new Error('CSV faylni yuklashda xatolik yuz berdi');
    }

    return await res.json();
  },

  getExportCsvUrl(): string {
    return `${API_BASE}/products/export-csv`;
  },

  getTemplateCsvUrl(): string {
    return `${API_BASE}/products/template-csv`;
  },

  async sendLowStockAlert(): Promise<{ success: boolean; count: number; message: string }> {
    return fetchFromApi<{ success: boolean; count: number; message: string }>('/products/send-low-stock-alert', {
      method: 'POST'
    });
  },

  // 4. SALES & POS
  async createSale(dto: CreateSaleDto): Promise<SaleResponseDto> {
    try {
      return await fetchFromApi<SaleResponseDto>('/sales', {
        method: 'POST',
        body: JSON.stringify(dto)
      });
    } catch (err) {
      // Offline saqlash
      if (typeof window !== 'undefined') {
        const pending = this.getPendingSales();
        pending.push({ dto, createdAt: new Date().toISOString() });
        localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(pending));
      }
      throw err;
    }
  },

  async getSales(fromDate?: string, toDate?: string, customerId?: number): Promise<SaleResponseDto[]> {
    const q = new URLSearchParams();
    if (fromDate) q.append('fromDate', fromDate);
    if (toDate) q.append('toDate', toDate);
    if (customerId) q.append('customerId', customerId.toString());

    return fetchFromApi<SaleResponseDto[]>(`/sales?${q.toString()}`, { method: 'GET' });
  },

  async getSaleById(id: number): Promise<SaleResponseDto> {
    return fetchFromApi<SaleResponseDto>(`/sales/${id}`, { method: 'GET' });
  },

  // Offline savdolar navbati
  getPendingSales(): { dto: CreateSaleDto; createdAt: string }[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(PENDING_SALES_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async syncPendingSales(): Promise<{ success: number; failed: number }> {
    const pending = this.getPendingSales();
    if (pending.length === 0) return { success: 0, failed: 0 };

    let success = 0;
    let failed = 0;
    const remaining: { dto: CreateSaleDto; createdAt: string }[] = [];

    for (const item of pending) {
      try {
        await fetchFromApi<SaleResponseDto>('/sales', {
          method: 'POST',
          body: JSON.stringify(item.dto)
        });
        success++;
      } catch {
        remaining.push(item);
        failed++;
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(PENDING_SALES_KEY, JSON.stringify(remaining));
    }

    return { success, failed };
  },

  // 5. VOZVRAT (REFUNDS)
  async createRefund(dto: CreateRefundDto): Promise<SaleRefundResponseDto> {
    return fetchFromApi<SaleRefundResponseDto>('/sales/refund', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async getRefunds(saleId?: number): Promise<SaleRefundResponseDto[]> {
    return fetchFromApi<SaleRefundResponseDto[]>(`/sales/refunds${saleId ? `?saleId=${saleId}` : ''}`, {
      method: 'GET'
    });
  },

  // 6. TA'MINOTCHILAR & KIRIM (SUPPLIERS & INVOICES)
  async getSuppliers(): Promise<SupplierResponseDto[]> {
    return fetchFromApi<SupplierResponseDto[]>('/suppliers', { method: 'GET' });
  },

  async createSupplier(dto: CreateSupplierDto): Promise<SupplierResponseDto> {
    return fetchFromApi<SupplierResponseDto>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async updateSupplier(id: number, dto: UpdateSupplierDto): Promise<SupplierResponseDto> {
    return fetchFromApi<SupplierResponseDto>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  async paySupplierDebt(dto: PaySupplierDebtDto): Promise<SupplierResponseDto> {
    return fetchFromApi<SupplierResponseDto>('/suppliers/pay-debt', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async getSupplyInvoices(supplierId?: number): Promise<SupplyInvoiceResponseDto[]> {
    return fetchFromApi<SupplyInvoiceResponseDto[]>(
      `/suppliers/invoices${supplierId ? `?supplierId=${supplierId}` : ''}`,
      { method: 'GET' }
    );
  },

  async receiveGoods(dto: CreateSupplyInvoiceDto): Promise<SupplyInvoiceResponseDto> {
    return fetchFromApi<SupplyInvoiceResponseDto>('/suppliers/receive-goods', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  // 7. CUSTOMERS & DEBTS (NASIYA)
  async getCustomers(): Promise<CustomerResponseDto[]> {
    return fetchFromApi<CustomerResponseDto[]>('/customers', { method: 'GET' });
  },

  async createCustomer(dto: { fullName: string; phone: string }): Promise<CustomerResponseDto> {
    return fetchFromApi<CustomerResponseDto>('/customers', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async getDebtors(): Promise<CustomerDebtSummaryDto[]> {
    return fetchFromApi<CustomerDebtSummaryDto[]>('/debts/debtors', { method: 'GET' });
  },

  async repayDebt(dto: RepayDebtDto): Promise<DebtTransactionResponseDto> {
    return fetchFromApi<DebtTransactionResponseDto>('/debts/repay', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async getCustomerTransactions(customerId: number): Promise<DebtTransactionResponseDto[]> {
    return fetchFromApi<DebtTransactionResponseDto[]>(`/debts/customer/${customerId}/transactions`, {
      method: 'GET'
    });
  },

  // 8. EXPENSES (XARAJATLAR)
  async getExpenses(): Promise<ExpenseResponseDto[]> {
    return fetchFromApi<ExpenseResponseDto[]>('/expenses', { method: 'GET' });
  },

  async createExpense(dto: CreateExpenseDto): Promise<ExpenseResponseDto> {
    return fetchFromApi<ExpenseResponseDto>('/expenses', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async deleteExpense(id: number): Promise<void> {
    return fetchFromApi<void>(`/expenses/${id}`, { method: 'DELETE' });
  },

  // 9. REPORTS & DASHBOARD
  async getDailyReport(): Promise<DailyReportDto> {
    return fetchFromApi<DailyReportDto>('/reports/daily', { method: 'GET' });
  },

  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    return fetchFromApi<DashboardSummaryDto>('/reports/dashboard-summary', { method: 'GET' });
  },

  // 10. BACKUP
  getBackupDownloadUrl(): string {
    return `${API_BASE}/backup/download`;
  },

  // 11. SAAS & STORES MANAGEMENT (SuperAdmin)
  setSelectedStoreId(storeId: number | null): void {
    if (typeof window === 'undefined') return;
    if (storeId) {
      localStorage.setItem(SELECTED_STORE_KEY, storeId.toString());
    } else {
      localStorage.removeItem(SELECTED_STORE_KEY);
    }
  },

  getSelectedStoreId(): number | null {
    if (typeof window === 'undefined') return null;
    const val = localStorage.getItem(SELECTED_STORE_KEY);
    return val ? parseInt(val, 10) : null;
  },

  async getStores(): Promise<StoreResponseDto[]> {
    return fetchFromApi<StoreResponseDto[]>('/stores', { method: 'GET' });
  },

  async getPlatformStats(): Promise<PlatformStatsDto> {
    return fetchFromApi<PlatformStatsDto>('/stores/stats', { method: 'GET' });
  },

  async getStoreById(id: number): Promise<StoreResponseDto> {
    return fetchFromApi<StoreResponseDto>(`/stores/${id}`, { method: 'GET' });
  },

  async getStoreOverview(id: number): Promise<StoreOverviewDto> {
    return fetchFromApi<StoreOverviewDto>(`/stores/${id}/overview`, { method: 'GET' });
  },

  async createStore(dto: CreateStoreDto): Promise<StoreResponseDto> {
    return fetchFromApi<StoreResponseDto>('/stores', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async updateStore(id: number, dto: UpdateStoreDto): Promise<StoreResponseDto> {
    return fetchFromApi<StoreResponseDto>(`/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  async toggleStoreStatus(id: number): Promise<{ isActive: boolean }> {
    return fetchFromApi<{ isActive: boolean }>(`/stores/${id}/toggle-status`, {
      method: 'PUT'
    });
  },

  async extendSubscription(id: number, days: number): Promise<StoreResponseDto> {
    return fetchFromApi<StoreResponseDto>(`/stores/${id}/extend-subscription`, {
      method: 'POST',
      body: JSON.stringify({ days })
    });
  },

  async updateStoreSettings(id: number, dto: StoreSettingsDto): Promise<StoreResponseDto> {
    return fetchFromApi<StoreResponseDto>(`/stores/${id}/settings`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  async testTelegram(id: number): Promise<{ success: boolean; message: string }> {
    return fetchFromApi<{ success: boolean; message: string }>(`/stores/${id}/test-telegram`, {
      method: 'POST'
    });
  },

  async deleteStore(id: number): Promise<{ success: boolean; message: string }> {
    return fetchFromApi<{ success: boolean; message: string }>(`/stores/${id}`, {
      method: 'DELETE'
    });
  },

  async resetAdminPassword(id: number, newPassword: string): Promise<{ success: boolean; message: string }> {
    return fetchFromApi<{ success: boolean; message: string }>(`/stores/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  },

  async getSubscriptionPayments(): Promise<SubscriptionPaymentDto[]> {
    return fetchFromApi<SubscriptionPaymentDto[]>('/stores/payments', { method: 'GET' });
  },

  async recordSubscriptionPayment(id: number, dto: RecordPaymentDto): Promise<SubscriptionPaymentDto> {
    return fetchFromApi<SubscriptionPaymentDto>(`/stores/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async getPlatformAnalytics(): Promise<PlatformAnalyticsDto> {
    return fetchFromApi<PlatformAnalyticsDto>('/stores/analytics', { method: 'GET' });
  },

  async getPlatformAnnouncements(): Promise<PlatformAnnouncementDto[]> {
    return fetchFromApi<PlatformAnnouncementDto[]>('/stores/announcements', { method: 'GET' });
  },

  async createPlatformAnnouncement(dto: CreateAnnouncementDto): Promise<PlatformAnnouncementDto> {
    return fetchFromApi<PlatformAnnouncementDto>('/stores/announcements', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async deletePlatformAnnouncement(id: number): Promise<{ success: boolean }> {
    return fetchFromApi<{ success: boolean }>(`/stores/announcements/${id}`, {
      method: 'DELETE'
    });
  },

  getExportStoresCsvUrl(): string {
    return `${API_BASE}/stores/export`;
  },

  getDatabaseBackupUrl(): string {
    return `${API_BASE}/backup/download`;
  },

  async bulkExtendSubscription(dto: BulkExtendSubscriptionDto): Promise<{ success: boolean; count: number; message: string }> {
    return fetchFromApi<{ success: boolean; count: number; message: string }>('/stores/bulk-extend', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async bulkToggleStatus(dto: BulkToggleStatusDto): Promise<{ success: boolean; count: number; message: string }> {
    return fetchFromApi<{ success: boolean; count: number; message: string }>('/stores/bulk-toggle-status', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async bulkChangePlan(dto: BulkChangePlanDto): Promise<{ success: boolean; count: number; message: string }> {
    return fetchFromApi<{ success: boolean; count: number; message: string }>('/stores/bulk-change-plan', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async broadcastTelegram(dto: BroadcastTelegramDto): Promise<BroadcastResultDto> {
    return fetchFromApi<BroadcastResultDto>('/stores/broadcast-telegram', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async sendSubscriptionExpiryAlerts(): Promise<SendExpiryAlertsResultDto> {
    return fetchFromApi<SendExpiryAlertsResultDto>('/stores/send-expiry-alerts', {
      method: 'POST'
    });
  },

  async getPlatformAuditLogs(limit: number = 100): Promise<PlatformAuditLogDto[]> {
    return fetchFromApi<PlatformAuditLogDto[]>(`/stores/audit-logs?limit=${limit}`, {
      method: 'GET'
    });
  },

  async getSystemHealth(): Promise<SystemHealthDto> {
    return fetchFromApi<SystemHealthDto>('/stores/system-health', {
      method: 'GET'
    });
  },

  // 12. ADVANCED ANALYTICS (Hourly, ABC, Weekly)
  async getHourlySales(date?: string): Promise<HourlySalesDto> {
    const q = date ? `?date=${encodeURIComponent(date)}` : '';
    return fetchFromApi<HourlySalesDto>(`/reports/hourly${q}`, { method: 'GET' });
  },

  async getAbcAnalysis(): Promise<AbcAnalysisDto> {
    return fetchFromApi<AbcAnalysisDto>('/reports/abc', { method: 'GET' });
  },

  async getWeeklyTrend(): Promise<WeeklyTrendDto> {
    return fetchFromApi<WeeklyTrendDto>('/reports/weekly-trend', { method: 'GET' });
  },

  // 13. INVENTORY AUDIT (Reviziya)
  async getAudits(): Promise<InventoryAuditResponseDto[]> {
    return fetchFromApi<InventoryAuditResponseDto[]>('/audits', { method: 'GET' });
  },

  async getAuditById(id: number): Promise<InventoryAuditResponseDto> {
    return fetchFromApi<InventoryAuditResponseDto>(`/audits/${id}`, { method: 'GET' });
  },

  async createAudit(dto: CreateInventoryAuditDto): Promise<InventoryAuditResponseDto> {
    return fetchFromApi<InventoryAuditResponseDto>('/audits', {
      method: 'POST',
      body: JSON.stringify(dto)
    });
  },

  async updateAuditItem(auditId: number, dto: UpdateAuditItemDto): Promise<InventoryAuditResponseDto> {
    return fetchFromApi<InventoryAuditResponseDto>(`/audits/${auditId}/item`, {
      method: 'PUT',
      body: JSON.stringify(dto)
    });
  },

  async completeAudit(auditId: number): Promise<InventoryAuditResponseDto> {
    return fetchFromApi<InventoryAuditResponseDto>(`/audits/${auditId}/complete`, {
      method: 'POST'
    });
  },

  // 14. DEBT NOTIFICATIONS
  async sendDebtReminder(customerId: number): Promise<DebtReminderResponseDto> {
    return fetchFromApi<DebtReminderResponseDto>(`/customers/${customerId}/send-reminder`, {
      method: 'POST'
    });
  },

  // 15. DATABASE BACKUP
  async downloadBackup(): Promise<Blob> {
    const res = await fetch(`${API_BASE}/backup/download`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    if (!res.ok) {
      throw new Error("Baza zaxirasini yuklab olishda xatolik yuz berdi");
    }
    return res.blob();
  },

  async sendBackupToTelegram(): Promise<{ message: string }> {
    return fetchFromApi<{ message: string }>('/backup/send-telegram', {
      method: 'POST'
    });
  },

  // Server salomatligini tekshirish
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/products?search=ping`, {
        headers: getAuthHeader()
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
