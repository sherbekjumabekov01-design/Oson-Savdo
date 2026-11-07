export type PaymentType = 'Cash' | 'Card' | 'Debt' | 'Mixed';

export type TransactionType = 'TakeDebt' | 'RepayDebt';

export interface Product {
  id: number;
  barcode: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  unit: string;
  minStockAlert: number;
  isLowStock?: boolean;
}

export type ProductResponseDto = Product;

export interface CustomerDebtSummaryDto {
  customerId: number;
  customerName: string;
  phone: string;
  totalDebt: number;
  lastTransactionDate?: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  totalDebt: number;
  lastTransactionDate?: string | null;
}

export interface DebtTransaction {
  id: number;
  customerId: number;
  customerName: string;
  amount: number;
  type: TransactionType;
  note?: string | null;
  createdAt: string;
}

export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitCostPrice: number;
  unitSellingPrice: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  paymentType: PaymentType;
  customerId?: number | null;
  customerName?: string | null;
  createdAt: string;
  items: SaleItem[];
}

export interface DailyReport {
  date: string;
  totalRevenue: number;
  cashRevenue: number;
  cardRevenue: number;
  debtIssued: number;
  debtCollected: number;
  totalProfit: number;
  salesCount: number;
}
