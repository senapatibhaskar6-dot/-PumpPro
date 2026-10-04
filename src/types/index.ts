export type FuelType = 'petrol' | 'diesel' | 'premium_petrol' | 'cng' | (string & {});

export interface FuelRate {
  type: FuelType;
  name: string;
  shortCode: string;
  ratePerLiter: number;
  dealerCostPerLiter: number; // For dealer margin / P&L
  dealerMarginPerLiter: number; // e.g. ₹3.20/L for Petrol, ₹2.10/L for Diesel
  color: string;
}

export interface Nozzle {
  id: string;
  dispenserUnit: string; // e.g. "DU-01", "DU-02"
  nozzleNumber: number;  // 1, 2, 3, 4
  name: string;          // e.g. "DU-1 Nozzle 1 (Petrol)"
  fuelType: FuelType;
  tankId: string;
}

export interface NozzleReading {
  id: string;
  date: string;          // YYYY-MM-DD
  shift: 'Shift 1 (Morning)' | 'Shift 2 (Evening)' | 'Shift 3 (Night)' | 'General Full Day';
  nozzleId: string;
  openingReading: number;
  closingReading: number;
  testingQty: number;    // Calibration fuel poured back to tank (Liters)
  netSaleQty: number;    // (closingReading - openingReading) - testingQty
  rate: number;
  totalAmount: number;   // netSaleQty * rate
  recordedBy?: string;
  timestamp: number;
}

export interface TankStock {
  id: string;
  name: string;
  fuelType: FuelType;
  capacityLiters: number;
  currentVolumeLiters: number;
  dipReadingCm: number;
  lastRefillDate: string;
}

export type LubeCategory = 'Engine Oil 4T' | 'Engine Oil Car/SUV' | 'Commercial Heavy Duty' | 'Gear Oil' | 'Coolant & DEF' | 'Grease';

export interface LubricantProduct {
  id: string;
  name: string;
  brand: string;         // e.g. "Castrol", "Servo", "Motul", "Mak", "Mobil"
  category: LubeCategory;
  packSize: string;      // e.g. "900 ml", "1 L", "3.5 L", "5 L", "20 L", "500 g"
  sku: string;
  mrp: number;
  purchaseCost: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
  unit: string;          // "Can", "Bottle", "Bucket", "Pouch"
}

export interface LubricantSale {
  id: string;
  date: string;
  shift: string;
  productId: string;
  productName: string;
  packSize: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Credit';
  customerId?: string;
  customerName?: string;
  vehicleNo?: string;
  invoiceNo?: string;
  timestamp: number;
}

export interface LubricantPurchase {
  id: string;
  date: string;
  productId: string;
  quantityAdded: number;
  costPerUnit: number;
  totalCost: number;
  supplierInvoice: string;
  supplierName: string;
  timestamp: number;
}

export interface CustomerCreditAccount {
  id: string;
  name: string;
  companyOrFleetName: string;
  phone: string;
  vehicleNumbers: string[];
  creditLimit: number;
  currentBalance: number; // positive = amount owed to petrol pump
  status: 'Active' | 'On Hold' | 'Blocked';
  notes?: string;
}

export interface CreditIndentSlip {
  id: string;
  slipNumber: string;    // e.g. "IND-2026-089"
  date: string;
  customerId: string;
  customerName: string;
  vehicleNumber: string;
  driverName: string;
  itemType: 'Fuel' | 'Lubricant';
  fuelType?: FuelType;
  lubeProductId?: string;
  lubeProductName?: string;
  quantity: number;      // Liters or packs
  rate: number;
  totalAmount: number;
  isPaid: boolean;
  settledAt?: string;
  settlementPaymentId?: string;
  shift: string;
  meterReadingSnapshot?: number;
  authorizedBy: string;
  timestamp: number;
}

export interface CreditPaymentRecord {
  id: string;
  receiptNumber: string; // e.g. "REC-2026-104"
  date: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMode: 'Cash' | 'NEFT/Bank Transfer' | 'UPI' | 'Cheque';
  referenceNo?: string;  // UTR / Cheque No
  bankName?: string;
  notes?: string;
  timestamp: number;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  shift: string;
  category: 'Staff Wages' | 'Electricity & Generator' | 'Pump Maintenance & Spares' | 'Tea & Refreshments' | 'Stationery & Cleaning' | 'Calibration & Testing' | 'Bank Charges' | 'Miscellaneous';
  description: string;
  amount: number;
  paidTo: string;
  paymentMode: 'Counter Cash' | 'UPI/Online' | 'Bank Transfer';
  voucherNo?: string;
  timestamp: number;
}

export interface CashDenomination {
  note2000: number;
  note500: number;
  note200: number;
  note100: number;
  note50: number;
  note20: number;
  note10: number;
  coins: number;
}

export interface ShiftReconciliation {
  id: string;
  date: string;
  shift: string;
  managerName: string;
  
  // Fuel Sales
  fuelSalesAmount: number;
  fuelSalesLiters: number;
  
  // Lubricants Sales
  lubeSalesAmount: number;
  
  // Gross Total
  grossSalesAmount: number;
  
  // Non-cash counter deductions
  creditSlipsIssuedAmount: number;
  counterExpensesAmount: number;
  
  // Net Expected Cash/Bank collection
  expectedCounterCollection: number;
  
  // Actual physical collections
  cashDenominations: CashDenomination;
  totalPhysicalCash: number;
  upiQrCollection: number;
  posCardCollection: number;
  directBankDeposit: number;
  
  totalActualCollection: number;
  
  // Difference
  discrepancy: number; // positive = excess, negative = shortage
  status: 'Balanced' | 'Excess' | 'Shortage';
  remarks?: string;
  closedAt: number;
}

export interface PumpSettings {
  pumpName: string;
  dealerBrand: 'Indian Oil' | 'Bharat Petroleum' | 'Hindustan Petroleum' | 'Shell' | 'Nayara' | 'Reliance' | 'Independent';
  dealerCode: string;
  gstNumber: string;
  address: string;
  phone: string;
  email: string;
  currencySymbol: string; // e.g. "₹" or "$"
}

export type SubscriptionStatus = 'Active' | 'Trial' | 'Grace' | 'Expired';
export type BillingCycle = 'monthly' | 'quarterly' | 'annual';

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  planName: string;
  billingPeriod: string;
  paymentMode: 'UPI / QR' | 'Credit / Debit Card' | 'Net Banking' | 'Auto-Debit';
  transactionId: string;
  status: 'Paid' | 'Pending';
  taxAmount: number;
  pumpsCount?: number;
  ratePerPump?: number;
  downloadUrl?: string;
}

export interface PumpSubscription {
  id: string;
  planName: string; // "PumpPro Multi-Pump Commercial"
  pricePerPumpMonthly: number; // 999
  pricePerPumpAnnual: number; // 9990
  activePumpsCount: number; // e.g. 2
  totalMonthlyAmount: number; // activePumpsCount * 999 (e.g. 1998)
  totalAnnualAmount: number; // activePumpsCount * 9990
  currencySymbol: string; // "₹"
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  startDate: string;
  currentPeriodEnd: string;
  renewalDate: string;
  daysRemaining: number;
  isTrial: boolean;
  trialEndsAt?: string;
  autoRenew: boolean;
  licensedPumpIds: string[];
  registeredPumpId: string;
  pumpName: string;
  ownerName: string;
  ownerMobile: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  invoices: SubscriptionInvoice[];
}

export interface RegisteredPump {
  id: string;
  stationName: string;
  oilCompany: 'Indian Oil' | 'Bharat Petroleum' | 'Hindustan Petroleum' | 'Shell' | 'Nayara' | 'Reliance' | 'Independent';
  roCode: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  gstin: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
  highwayName?: string;
  nozzlesCount: number;
  tanksCount: number;
  registeredDate: string;
  planStatus: SubscriptionStatus;
  isActive: boolean;
}

