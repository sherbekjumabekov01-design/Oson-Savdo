export type PaymentType = 'Cash' | 'Card' | 'Debt' | 'Mixed';

export type TransactionType = 'TakeDebt' | 'RepayDebt';

export type UserRole = 'SuperAdmin' | 'Admin' | 'Cashier';

export type ShiftStatus = 'Open' | 'Closed';

export type SaleStatus = 'Completed' | 'Refunded' | 'PartiallyRefunded';

export interface UserDto {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  storeId?: number | null;
  storeName?: string | null;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  userId: number;
  username: string;
  fullName: string;
  role: UserRole;
  expiresAt: string;
  storeId?: number | null;
  storeName?: string | null;
}

export interface CashShiftResponseDto {
  id: number;
  userId: number;
  cashierName: string;
  openedAt: string;
  closedAt?: string | null;
  openingBalance: number;
  closingCashActual: number;
  expectedCash: number;
  cashDifference: number;
  totalCashSales: number;
  totalCardSales: number;
  totalDebtSales: number;
  totalRefunds: number;
  totalSalesCount: number;
  status: ShiftStatus;
  note?: string | null;
  totalDebtRepaidCash?: number;
  totalDebtRepaidCard?: number;
  totalExpensesCash?: number;
  totalCashIn?: number;
  totalCashOut?: number;
  operations?: CashOperationResponseDto[];
}

export type CashOperationType = 'CashIn' | 'CashOut' | 1 | 2;

export interface CashOperationResponseDto {
  id: number;
  cashShiftId: number;
  type: CashOperationType;
  amount: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface CreateCashOperationDto {
  type: CashOperationType;
  amount: number;
  reason: string;
}

export interface CurrentShiftSummaryDto {
  isOpen: boolean;
  shift?: CashShiftResponseDto | null;
  currentCalculatedCash: number;
}

export interface OpenShiftDto {
  openingBalance: number;
  note?: string;
}

export interface CloseShiftDto {
  closingCashActual: number;
  note?: string;
}

export interface ProductResponseDto {
  id: number;
  barcode: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  unit: string;
  category: string;
  minStockAlert: number;
  isLowStock: boolean;
  isWeighted?: boolean;
  pluCode?: string | null;
  expiryDate?: string | null;
  isUsdPrice?: boolean;
  costPriceUsd?: number;
  sellingPriceUsd?: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateProductDto {
  barcode: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  unit: string;
  category?: string;
  minStockAlert: number;
  isWeighted?: boolean;
  pluCode?: string | null;
  expiryDate?: string | null;
  isUsdPrice?: boolean;
  costPriceUsd?: number;
  sellingPriceUsd?: number;
}

export interface UpdateProductDto extends CreateProductDto {}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ImportResultDto {
  totalProcessed: number;
  addedCount: number;
  updatedCount: number;
  errors: string[];
}

export interface CustomerResponseDto {
  id: number;
  fullName: string;
  phone: string;
  totalDebt: number;
  cashbackBalance: number;
  cashbackPercent: number;
  createdAt: string;
}

export interface CreateCustomerDto {
  fullName: string;
  phone: string;
  cashbackPercent?: number;
}

export interface CustomerDebtSummaryDto {
  customerId: number;
  customerName: string;
  phone: string;
  totalDebt: number;
  lastTransactionDate?: string | null;
}

export interface DebtTransactionResponseDto {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  amount: number;
  type: TransactionType;
  paymentType?: PaymentType;
  previousDebt?: number;
  remainingDebt?: number;
  cashShiftId?: number | null;
  cashierName?: string;
  note?: string | null;
  createdAt: string;
}

export interface RepayDebtDto {
  customerId: number;
  amount: number;
  paymentType?: PaymentType;
  cashShiftId?: number | null;
  cashierName?: string;
  note?: string;
}

export interface ExpenseResponseDto {
  id: number;
  title: string;
  amount: number;
  category: string;
  paymentType: PaymentType;
  paymentTypeName?: string;
  cashShiftId?: number | null;
  createdByName?: string | null;
  createdAt: string;
}

export interface CreateExpenseDto {
  title: string;
  amount: number;
  category: string;
  paymentType?: PaymentType;
  createdByName?: string;
}

export interface SaleItemResponseDto {
  id: number;
  productId: number;
  productName: string;
  productBarcode: string;
  quantity: number;
  unitCostPrice: number;
  unitSellingPrice: number;
  discountAmount: number;
  refundedQuantity: number;
  subtotal: number;
  grossProfit: number;
}

export interface SaleResponseDto {
  id: number;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  discountAmount: number;
  paidCash: number;
  paidCard: number;
  cashbackEarned: number;
  cashbackUsed: number;
  paymentType: PaymentType;
  status: SaleStatus;
  cashierName: string;
  cashShiftId?: number | null;
  customerId?: number | null;
  customerName?: string | null;
  createdAt: string;
  items: SaleItemResponseDto[];
}

export interface CreateSaleItemDto {
  productId: number;
  quantity: number;
  unitSellingPrice?: number;
  discountAmount?: number;
}

export interface CreateSaleDto {
  items: CreateSaleItemDto[];
  paymentType: PaymentType;
  paidAmount: number;
  discountAmount?: number;
  paidCash?: number;
  paidCard?: number;
  cashbackUsed?: number;
  cashierName?: string;
  cashShiftId?: number | null;
  customerId?: number | null;
}

export interface SupplierResponseDto {
  id: number;
  name: string;
  phone: string;
  company?: string | null;
  address?: string | null;
  totalDebtToSupplier: number;
  createdAt: string;
}

export interface CreateSupplierDto {
  name: string;
  phone: string;
  company?: string;
  address?: string;
}

export interface UpdateSupplierDto extends CreateSupplierDto {}

export interface PaySupplierDebtDto {
  supplierId: number;
  amount: number;
  note?: string;
}

export interface CreateSupplyInvoiceItemDto {
  productId?: number | null;
  barcode: string;
  name: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  unit: string;
  category?: string;
}

export interface CreateSupplyInvoiceDto {
  supplierId?: number | null;
  supplierName?: string;
  invoiceNumber: string;
  paidAmount: number;
  note?: string;
  items: CreateSupplyInvoiceItemDto[];
}

export interface SupplyInvoiceItemResponseDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  subtotal: number;
}

export interface SupplyInvoiceResponseDto {
  id: number;
  supplierId?: number | null;
  supplierName: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  createdAt: string;
  note?: string | null;
  items: SupplyInvoiceItemResponseDto[];
}

export interface RefundItemDto {
  productId: number;
  quantity: number;
  refundPrice: number;
}

export interface CreateRefundDto {
  saleId: number;
  reason: string;
  cashierName?: string;
  items: RefundItemDto[];
}

export interface SaleRefundItemResponseDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  refundUnitPrice: number;
  subtotal: number;
}

export interface SaleRefundResponseDto {
  id: number;
  saleId: number;
  cashierName: string;
  totalRefundAmount: number;
  reason: string;
  createdAt: string;
  items: SaleRefundItemResponseDto[];
}

export interface DailyReportDto {
  date: string;
  totalRevenue: number;
  cashRevenue: number;
  cardRevenue: number;
  debtIssued: number;
  debtCollected: number;
  totalCost: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  totalSalesCount: number;
}

export interface PeriodReportDto {
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
}

export interface DashboardSummaryDto {
  todayRevenue: number;
  todayGrossProfit: number;
  todayExpenses: number;
  todayNetProfit: number;
  totalSystemDebt: number;
  lowStockProductsCount: number;
  totalCustomersCount: number;
  totalProductsCount: number;
}

export interface StoreResponseDto {
  id: number;
  name: string;
  ownerFullName: string;
  phone: string;
  address?: string | null;
  isActive: boolean;
  subscriptionExpiresAt?: string | null;
  monthlyFee: number;
  plan: string;
  createdAt: string;
  productsCount: number;
  usersCount: number;
  salesCount: number;
  totalRevenue: number;
  todayRevenue: number;
  isSubscriptionExpired: boolean;
  telegramBotToken?: string | null;
  telegramChatId?: string | null;
  telegramNotificationsEnabled?: boolean;
  cashbackRate?: number;
  enableCashback?: boolean;
  scalePrefix?: string;
  usdRate?: number;
}

export interface StoreSettingsDto {
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramNotificationsEnabled: boolean;
  cashbackRate: number;
  enableCashback: boolean;
  scalePrefix: string;
  usdRate?: number;
}

export interface CreateStoreDto {
  name: string;
  ownerFullName: string;
  phone: string;
  address?: string;
  monthlyFee: number;
  plan: string;
  subscriptionDays: number;
  adminUsername: string;
  adminPassword: string;
}

export interface UpdateStoreDto {
  name: string;
  ownerFullName: string;
  phone: string;
  address?: string;
  monthlyFee: number;
  plan: string;
  isActive: boolean;
  subscriptionExpiresAt?: string;
}

export interface PlatformStatsDto {
  totalStores: number;
  activeStores: number;
  inactiveStores: number;
  expiredSubscriptionStores: number;
  totalPlatformRevenueToday: number;
  totalPlatformSalesCountToday: number;
  totalProductsAcrossStores: number;
  projectedMonthlySaaSFee: number;
}

export interface StoreOverviewDto {
  store: StoreResponseDto;
  totalSalesAmount: number;
  totalDebtsGiven: number;
  totalExpenses: number;
  lowStockProductsCount: number;
}

export interface SubscriptionPaymentDto {
  id: number;
  storeId: number;
  storeName: string;
  amount: number;
  paymentMethod: string;
  daysAdded: number;
  paidAt: string;
  receiptNumber: string;
  note?: string | null;
}

export interface RecordPaymentDto {
  storeId: number;
  amount: number;
  paymentMethod: string;
  daysAdded: number;
  note?: string;
}

export interface ResetAdminPasswordDto {
  newPassword: string;
}

export interface PlatformAnnouncementDto {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  isActive: boolean;
  createdAt: string;
  expiresAt?: string | null;
}

export interface CreateAnnouncementDto {
  title: string;
  message: string;
  type: string;
  activeDays?: number;
}

export interface PlanDistributionDto {
  plan: string;
  count: number;
  totalMonthlyFee: number;
}

export interface TopStoreDto {
  id: number;
  name: string;
  ownerFullName: string;
  totalSales: number;
  todaySales: number;
  productsCount: number;
  plan: string;
  isActive: boolean;
}

export interface MonthlyRevenueGrowthDto {
  monthLabel: string;
  saasRevenue: number;
  storesGmv: number;
}

export interface PlatformAnalyticsDto {
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  totalPlatformGmv: number;
  averageRevenuePerStore: number;
  totalStores: number;
  activeStores: number;
  expiredStores: number;
  inactiveStores: number;
  plansDistribution: PlanDistributionDto[];
  topStores: TopStoreDto[];
  revenueGrowth: MonthlyRevenueGrowthDto[];
}

export interface BulkExtendSubscriptionDto {
  storeIds: number[];
  days: number;
}

export interface BulkToggleStatusDto {
  storeIds: number[];
  isActive: boolean;
}

export interface BulkChangePlanDto {
  storeIds: number[];
  plan: string;
  monthlyFee: number;
}

export interface BroadcastTelegramDto {
  message: string;
  storeIds?: number[] | null;
}

export interface BroadcastResultDto {
  totalStores: number;
  sentCount: number;
  failedCount: number;
  details: string[];
}

export interface SendExpiryAlertsResultDto {
  totalChecked: number;
  sentCount: number;
  skippedCount: number;
  details: string[];
}

export interface PlatformAuditLogDto {
  id: number;
  action: string;
  performedBy: string;
  storeId?: number | null;
  storeName?: string | null;
  details: string;
  createdAt: string;
}

export interface SystemHealthDto {
  databaseSize: string;
  databaseSizeBytes: number;
  totalStores: number;
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  totalExpenses: number;
  totalAuditLogs: number;
  serverTimeUtc: string;
  serverTimeLocal: string;
  osVersion: string;
}

// Analytics Interfaces
export interface HourlySalesPointDto {
  hour: number;
  hourLabel: string;
  revenue: number;
  ordersCount: number;
}

export interface HourlySalesDto {
  date: string;
  points: HourlySalesPointDto[];
  peakHour: number;
  peakRevenue: number;
}

export interface AbcProductItemDto {
  productId: number;
  name: string;
  barcode: string;
  category: string;
  revenue: number;
  profit: number;
  quantitySold: number;
  revenueSharePercent: number;
  cumulativeSharePercent: number;
  group: 'A' | 'B' | 'C' | 'DeadStock';
  currentStock: number;
  costPrice: number;
  sellingPrice: number;
}

export interface AbcAnalysisDto {
  items: AbcProductItemDto[];
  totalRevenue: number;
  groupACount: number;
  groupBCount: number;
  groupCCount: number;
  deadStockCount: number;
}

export interface WeeklyTrendPointDto {
  dayLabel: string;
  date: string;
  revenue: number;
  profit: number;
  ordersCount: number;
}

export interface WeeklyTrendDto {
  points: WeeklyTrendPointDto[];
  totalWeekRevenue: number;
  totalWeekProfit: number;
}

// Inventory Audit Interfaces
export interface InventoryAuditItemDto {
  id: number;
  productId: number;
  productName: string;
  barcode: string;
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
  costPrice: number;
  differenceCost: number;
}

export interface InventoryAuditResponseDto {
  id: number;
  auditNumber: string;
  createdAt: string;
  completedAt?: string | null;
  status: 'Draft' | 'Completed' | 'Cancelled';
  cashierName: string;
  totalExpectedQty: number;
  totalActualQty: number;
  totalDifferenceQty: number;
  totalDifferenceCost: number;
  note?: string | null;
  items: InventoryAuditItemDto[];
}

export interface CreateAuditItemDto {
  productId: number;
  actualQuantity: number;
}

export interface CreateInventoryAuditDto {
  note?: string;
  items?: CreateAuditItemDto[];
}

export interface UpdateAuditItemDto {
  productId: number;
  actualQuantity: number;
}

export interface DebtReminderResponseDto {
  success: boolean;
  telegramSent: boolean;
  smsTemplate: string;
  customerPhone: string;
  message: string;
}


