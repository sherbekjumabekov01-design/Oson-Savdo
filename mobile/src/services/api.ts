import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Product,
  Customer,
  DebtTransaction,
  Sale,
  DailyReport,
  PaymentType
} from '../types';

let API_BASE_URL = 'http://192.168.0.62:5050/api';

const STORAGE_KEYS = {
  API_URL: '@oson_savdo_api_url',
  PRODUCTS: '@oson_savdo_products',
  CUSTOMERS: '@oson_savdo_customers',
  TRANSACTIONS: '@oson_savdo_transactions',
  SALES: '@oson_savdo_sales'
};

// Dastlabki namunaviy test ma'lumotlari
const initialProducts: Product[] = [
  {
    id: 1,
    barcode: '4780012345678',
    name: 'Coca-Cola 1.5L',
    costPrice: 10500,
    sellingPrice: 14000,
    stockQuantity: 45,
    unit: 'dona',
    minStockAlert: 10,
    isLowStock: false
  },
  {
    id: 2,
    barcode: '4780087654321',
    name: 'Nestle Sut 3.2% 1L',
    costPrice: 11000,
    sellingPrice: 14500,
    stockQuantity: 4,
    unit: 'dona',
    minStockAlert: 8,
    isLowStock: true
  },
  {
    id: 3,
    barcode: '4780099887766',
    name: 'Makfa Un 1-nav 2kg',
    costPrice: 16000,
    sellingPrice: 21000,
    stockQuantity: 3,
    unit: 'dona',
    minStockAlert: 5,
    isLowStock: true
  },
  {
    id: 4,
    barcode: '4780033221144',
    name: 'Shakar (Qopda)',
    costPrice: 9500,
    sellingPrice: 12000,
    stockQuantity: 120,
    unit: 'kg',
    minStockAlert: 20,
    isLowStock: false
  },
  {
    id: 5,
    barcode: '4780055443322',
    name: 'Oloy Guruch (Lazer)',
    costPrice: 22000,
    sellingPrice: 28000,
    stockQuantity: 65,
    unit: 'kg',
    minStockAlert: 15,
    isLowStock: false
  }
];

const initialCustomers: Customer[] = [
  {
    id: 1,
    fullName: 'Anvar Qodirov',
    phone: '+998 90 123-45-67',
    totalDebt: 345000,
    lastTransactionDate: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 2,
    fullName: 'Dilshod Raximov',
    phone: '+998 93 987-65-43',
    totalDebt: 780000,
    lastTransactionDate: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 3,
    fullName: 'Sherzod Aliyev',
    phone: '+998 97 555-11-22',
    totalDebt: 125000,
    lastTransactionDate: new Date(Date.now() - 86400000).toISOString()
  }
];

const initialTransactions: DebtTransaction[] = [
  {
    id: 101,
    customerId: 1,
    customerName: 'Anvar Qodirov',
    amount: 150000,
    type: 'TakeDebt',
    note: "Savdo #1012 bo'yicha nasiya",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 102,
    customerId: 1,
    customerName: 'Anvar Qodirov',
    amount: 50000,
    type: 'RepayDebt',
    note: "Qisman to'landi",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 103,
    customerId: 2,
    customerName: 'Dilshod Raximov',
    amount: 780000,
    type: 'TakeDebt',
    note: "Savdo #1008 bo'yicha nasiya",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  }
];

// Yordamchi xotira boshqaruvi
async function getStoredData<T>(key: string, defaultData: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    await AsyncStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  } catch {
    return defaultData;
  }
}

async function setStoredData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('AsyncStorage saqlashda xatolik:', e);
  }
}

export const apiService = {
  // API URL Sozlamalari
  async getApiUrl(): Promise<string> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.API_URL);
      if (saved) API_BASE_URL = saved;
    } catch {}
    return API_BASE_URL;
  },

  async setApiUrl(url: string): Promise<void> {
    API_BASE_URL = url;
    await AsyncStorage.setItem(STORAGE_KEYS.API_URL, url);
  },

  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE_URL}/products?search=ping`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  },

  // 1. TOVARLAR VA OMBOR
  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        await setStoredData(STORAGE_KEYS.PRODUCTS, data);
        return data;
      }
    } catch {}

    const local = await getStoredData<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
    return local.map(p => ({
      ...p,
      isLowStock: p.stockQuantity <= p.minStockAlert
    }));
  },

  async getProductByBarcode(barcode: string): Promise<Product> {
    const cleanBarcode = barcode.trim();

    // 1-urinish: Real Backend API
    try {
      const res = await fetch(`${API_BASE_URL}/products/barcode/${cleanBarcode}`);
      if (res.ok) {
        const prod = await res.json();
        return {
          ...prod,
          isLowStock: prod.stockQuantity <= prod.minStockAlert
        };
      }
    } catch {}

    // 2-urinish: Mahalliy xotiradan qidirish
    const products = await this.getProducts();
    const found = products.find(p => p.barcode === cleanBarcode);
    if (found) return found;

    // Topilmasa yangi tovar shaklida taklif qilish
    return {
      id: Date.now(),
      barcode: cleanBarcode,
      name: `Tovar (${cleanBarcode.slice(-4)})`,
      costPrice: 10000,
      sellingPrice: 15000,
      stockQuantity: 20,
      unit: 'dona',
      minStockAlert: 5,
      isLowStock: false
    };
  },

  async createProduct(product: Omit<Product, 'id' | 'isLowStock'>): Promise<Product> {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const products = await this.getProducts();
    const newProd: Product = {
      ...product,
      id: products.length ? Math.max(...products.map(p => p.id)) + 1 : 1,
      isLowStock: product.stockQuantity <= product.minStockAlert
    };
    products.unshift(newProd);
    await setStoredData(STORAGE_KEYS.PRODUCTS, products);
    return newProd;
  },

  async updateProduct(id: number, product: Omit<Product, 'id' | 'isLowStock'>): Promise<Product> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const products = await this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    const updated: Product = {
      ...product,
      id,
      isLowStock: product.stockQuantity <= product.minStockAlert
    };
    if (idx > -1) {
      products[idx] = updated;
    }
    await setStoredData(STORAGE_KEYS.PRODUCTS, products);
    return updated;
  },

  async deleteProduct(id: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // muvaffaqiyatli o'chirildi
      }
    } catch {}

    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    await setStoredData(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },

  // 2. SAVDO (POS TRANZAKSIYASI)
  async createSale(saleData: {
    items: { productId: number; quantity: number; unitSellingPrice: number }[];
    paymentType: PaymentType;
    paidAmount: number;
    customerId?: number | null;
  }): Promise<Sale> {
    try {
      const res = await fetch(`${API_BASE_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Offline / Mahalliy tranzaksiya amalga oshirish
    const products = await this.getProducts();
    const customers = await this.getCustomers();
    const transactions = await getStoredData<DebtTransaction[]>(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
    const sales = await getStoredData<Sale[]>(STORAGE_KEYS.SALES, []);

    let totalAmount = 0;
    const saleItems = saleData.items.map(it => {
      const prod = products.find(p => p.id === it.productId);
      if (prod) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - it.quantity);
        prod.isLowStock = prod.stockQuantity <= prod.minStockAlert;
      }
      const price = it.unitSellingPrice || prod?.sellingPrice || 0;
      const sub = price * it.quantity;
      totalAmount += sub;

      return {
        productId: it.productId,
        productName: prod?.name || 'Mahsulot',
        quantity: it.quantity,
        unitCostPrice: prod?.costPrice || 0,
        unitSellingPrice: price,
        subtotal: sub
      };
    });

    await setStoredData(STORAGE_KEYS.PRODUCTS, products);

    const debtAmount = totalAmount - saleData.paidAmount;
    let customerName = null;

    if (saleData.customerId) {
      const cust = customers.find(c => c.id === saleData.customerId);
      if (cust) {
        customerName = cust.fullName;
        if (debtAmount > 0) {
          cust.totalDebt += debtAmount;
          cust.lastTransactionDate = new Date().toISOString();

          transactions.unshift({
            id: Date.now(),
            customerId: cust.id,
            customerName: cust.fullName,
            amount: debtAmount,
            type: 'TakeDebt',
            note: `Savdo orqali nasiya (Jami: ${totalAmount.toLocaleString()} so'm)`,
            createdAt: new Date().toISOString()
          });

          await setStoredData(STORAGE_KEYS.CUSTOMERS, customers);
          await setStoredData(STORAGE_KEYS.TRANSACTIONS, transactions);
        }
      }
    }

    const newSale: Sale = {
      id: sales.length ? Math.max(...sales.map(s => s.id)) + 1 : 1001,
      totalAmount,
      paidAmount: saleData.paidAmount,
      debtAmount,
      paymentType: saleData.paymentType,
      customerId: saleData.customerId,
      customerName,
      createdAt: new Date().toISOString(),
      items: saleItems
    };

    sales.unshift(newSale);
    await setStoredData(STORAGE_KEYS.SALES, sales);
    return newSale;
  },

  // 3. QARZ VA MIJOZLAR
  async getCustomers(): Promise<Customer[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`);
      if (res.ok) {
        const data = await res.json();
        await setStoredData(STORAGE_KEYS.CUSTOMERS, data);
        return data;
      }
    } catch {}

    return await getStoredData<Customer[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
  },

  async createCustomer(fullName: string, phone: string): Promise<Customer> {
    try {
      const res = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const customers = await this.getCustomers();
    const newCust: Customer = {
      id: customers.length ? Math.max(...customers.map(c => c.id)) + 1 : 1,
      fullName: fullName.trim(),
      phone: phone.trim(),
      totalDebt: 0,
      lastTransactionDate: new Date().toISOString()
    };
    customers.unshift(newCust);
    await setStoredData(STORAGE_KEYS.CUSTOMERS, customers);
    return newCust;
  },

  async getDebtors(): Promise<Customer[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/debts/debtors`);
      if (res.ok) {
        const data = await res.json();
        return data.map((d: any) => ({
          id: d.customerId,
          fullName: d.customerName,
          phone: d.phone,
          totalDebt: d.totalDebt,
          lastTransactionDate: d.lastTransactionDate
        }));
      }
    } catch {}

    const customers = await this.getCustomers();
    return customers.filter(c => c.totalDebt > 0);
  },

  async repayDebt(customerId: number, amount: number, note?: string): Promise<DebtTransaction> {
    try {
      const res = await fetch(`${API_BASE_URL}/debts/repay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, amount, note })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const customers = await this.getCustomers();
    const transactions = await getStoredData<DebtTransaction[]>(STORAGE_KEYS.TRANSACTIONS, initialTransactions);

    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      cust.totalDebt = Math.max(0, cust.totalDebt - amount);
      cust.lastTransactionDate = new Date().toISOString();
      await setStoredData(STORAGE_KEYS.CUSTOMERS, customers);
    }

    const newTx: DebtTransaction = {
      id: Date.now(),
      customerId,
      customerName: cust?.fullName || 'Mijoz',
      amount,
      type: 'RepayDebt',
      note: note || "Qarz to'landi",
      createdAt: new Date().toISOString()
    };

    transactions.unshift(newTx);
    await setStoredData(STORAGE_KEYS.TRANSACTIONS, transactions);
    return newTx;
  },

  async getCustomerTransactions(customerId: number): Promise<DebtTransaction[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/debts/customer/${customerId}/transactions`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    const transactions = await getStoredData<DebtTransaction[]>(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
    return transactions.filter(t => t.customerId === customerId);
  },

  // 4. KUNLIK HISOBOT VA STATISTIKA
  async getDailyReport(): Promise<DailyReport> {
    try {
      const res = await fetch(`${API_BASE_URL}/reports/daily`);
      if (res.ok) {
        const data = await res.json();
        return {
          date: data.date,
          totalRevenue: data.totalRevenue,
          cashRevenue: data.cashRevenue,
          cardRevenue: data.cardRevenue,
          debtIssued: data.debtIssued,
          debtCollected: data.debtCollected,
          totalProfit: data.grossProfit,
          salesCount: data.totalSalesCount
        };
      }
    } catch {}

    const sales = await getStoredData<Sale[]>(STORAGE_KEYS.SALES, []);
    const transactions = await getStoredData<DebtTransaction[]>(STORAGE_KEYS.TRANSACTIONS, initialTransactions);

    const todayDate = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.createdAt).toDateString() === todayDate);

    const totalRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const cashRevenue = todaySales.filter(s => s.paymentType === 'Cash').reduce((sum, s) => sum + s.paidAmount, 0);
    const cardRevenue = todaySales.filter(s => s.paymentType === 'Card').reduce((sum, s) => sum + s.paidAmount, 0);
    const debtIssued = todaySales.reduce((sum, s) => sum + s.debtAmount, 0);
    const debtCollected = transactions
      .filter(t => t.type === 'RepayDebt' && new Date(t.createdAt).toDateString() === todayDate)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalProfit = todaySales.reduce((sum, s) => {
      return (
        sum +
        s.items.reduce(
          (iSum, it) => iSum + (it.unitSellingPrice - it.unitCostPrice) * it.quantity,
          0
        )
      );
    }, 0);

    return {
      date: new Date().toISOString(),
      totalRevenue,
      cashRevenue,
      cardRevenue,
      debtIssued,
      debtCollected,
      totalProfit,
      salesCount: todaySales.length
    };
  }
};

export const mobileApi = apiService;

