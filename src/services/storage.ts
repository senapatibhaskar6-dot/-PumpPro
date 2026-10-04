import {
  FuelRate,
  Nozzle,
  NozzleReading,
  TankStock,
  LubricantProduct,
  LubricantSale,
  LubricantPurchase,
  CustomerCreditAccount,
  CreditIndentSlip,
  CreditPaymentRecord,
  ExpenseRecord,
  ShiftReconciliation,
  PumpSettings,
  PumpSubscription,
  RegisteredPump,
  SubscriptionInvoice,
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'pumppro_settings',
  RATES: 'pumppro_rates',
  NOZZLES: 'pumppro_nozzles',
  READINGS: 'pumppro_readings',
  TANKS: 'pumppro_tanks',
  LUBRICANTS: 'pumppro_lubricants',
  LUBE_SALES: 'pumppro_lube_sales',
  LUBE_PURCHASES: 'pumppro_lube_purchases',
  CUSTOMERS: 'pumppro_customers',
  CREDIT_SLIPS: 'pumppro_credit_slips',
  CREDIT_PAYMENTS: 'pumppro_credit_payments',
  EXPENSES: 'pumppro_expenses',
  RECONCILIATIONS: 'pumppro_reconciliations',
  SUBSCRIPTION: 'pumppro_subscription',
  REGISTERED_PUMPS: 'pumppro_registered_pumps',
};

// Initial default settings
export const DEFAULT_SETTINGS: PumpSettings = {
  pumpName: 'Highway Star Energy & Fuel Station',
  dealerBrand: 'Indian Oil',
  dealerCode: 'IOCL-RO-44219',
  gstNumber: '27AABCP1337Q1ZT',
  address: 'Plot 42, NH-48 Express Corridor, KM 118',
  phone: '+91 98200 44555',
  email: 'ops@highwaystarfuel.com',
  currencySymbol: '₹',
};

// Default Fuel Rates
export const DEFAULT_RATES: FuelRate[] = [
  {
    type: 'petrol',
    name: 'Petrol (Motor Spirit - MS)',
    shortCode: 'MS',
    ratePerLiter: 104.20,
    dealerCostPerLiter: 100.80,
    dealerMarginPerLiter: 3.40,
    color: '#f97316', // Orange
  },
  {
    type: 'diesel',
    name: 'Diesel (High Speed Diesel - HSD)',
    shortCode: 'HSD',
    ratePerLiter: 92.80,
    dealerCostPerLiter: 90.60,
    dealerMarginPerLiter: 2.20,
    color: '#0284c7', // Sky Blue
  },
  {
    type: 'premium_petrol',
    name: 'XP95 Premium Petrol (Speed)',
    shortCode: 'XP95',
    ratePerLiter: 112.50,
    dealerCostPerLiter: 107.70,
    dealerMarginPerLiter: 4.80,
    color: '#8b5cf6', // Purple
  },
  {
    type: 'cng',
    name: 'CNG (Compressed Natural Gas)',
    shortCode: 'CNG',
    ratePerLiter: 86.50,
    dealerCostPerLiter: 83.00,
    dealerMarginPerLiter: 3.50,
    color: '#10b981', // Emerald
  },
];

// Default Underground Tanks
export const DEFAULT_TANKS: TankStock[] = [
  {
    id: 'tank-1',
    name: 'Underground Tank 1 - Petrol (MS)',
    fuelType: 'petrol',
    capacityLiters: 25000,
    currentVolumeLiters: 17420,
    dipReadingCm: 144,
    lastRefillDate: '2026-10-01',
  },
  {
    id: 'tank-2',
    name: 'Underground Tank 2 - Diesel (HSD)',
    fuelType: 'diesel',
    capacityLiters: 35000,
    currentVolumeLiters: 24800,
    dipReadingCm: 182,
    lastRefillDate: '2026-10-02',
  },
  {
    id: 'tank-3',
    name: 'Underground Tank 3 - XP95 Premium',
    fuelType: 'premium_petrol',
    capacityLiters: 15000,
    currentVolumeLiters: 9650,
    dipReadingCm: 98,
    lastRefillDate: '2026-09-28',
  },
];

// Default Dispenser Nozzles
export const DEFAULT_NOZZLES: Nozzle[] = [
  {
    id: 'noz-1',
    dispenserUnit: 'DU-01 (Island 1)',
    nozzleNumber: 1,
    name: 'DU-01 Nozzle 1 (Petrol)',
    fuelType: 'petrol',
    tankId: 'tank-1',
  },
  {
    id: 'noz-2',
    dispenserUnit: 'DU-01 (Island 1)',
    nozzleNumber: 2,
    name: 'DU-01 Nozzle 2 (Diesel)',
    fuelType: 'diesel',
    tankId: 'tank-2',
  },
  {
    id: 'noz-3',
    dispenserUnit: 'DU-02 (Island 2)',
    nozzleNumber: 1,
    name: 'DU-02 Nozzle 1 (Petrol)',
    fuelType: 'petrol',
    tankId: 'tank-1',
  },
  {
    id: 'noz-4',
    dispenserUnit: 'DU-02 (Island 2)',
    nozzleNumber: 2,
    name: 'DU-02 Nozzle 2 (Diesel)',
    fuelType: 'diesel',
    tankId: 'tank-2',
  },
  {
    id: 'noz-5',
    dispenserUnit: 'DU-03 (Island 3)',
    nozzleNumber: 1,
    name: 'DU-03 Nozzle 1 (XP95 Premium)',
    fuelType: 'premium_petrol',
    tankId: 'tank-3',
  },
  {
    id: 'noz-6',
    dispenserUnit: 'DU-03 (Island 3)',
    nozzleNumber: 2,
    name: 'DU-03 Nozzle 2 (Diesel Heavy)',
    fuelType: 'diesel',
    tankId: 'tank-2',
  },
];

// Get current date formatted YYYY-MM-DD
export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Default Seed Meter Readings for today
export const DEFAULT_READINGS: NozzleReading[] = [
  {
    id: 'read-01',
    date: getTodayDateString(),
    shift: 'Shift 1 (Morning)',
    nozzleId: 'noz-1',
    openingReading: 84320.5,
    closingReading: 85210.0,
    testingQty: 5.0, // 5L test pour
    netSaleQty: 884.5, // 85210.0 - 84320.5 - 5 = 884.5 L
    rate: 104.20,
    totalAmount: 92164.90,
    recordedBy: 'Rajesh (DSM-1)',
    timestamp: Date.now() - 3600000 * 3,
  },
  {
    id: 'read-02',
    date: getTodayDateString(),
    shift: 'Shift 1 (Morning)',
    nozzleId: 'noz-2',
    openingReading: 124800.0,
    closingReading: 126450.5,
    testingQty: 5.0,
    netSaleQty: 1645.5,
    rate: 92.80,
    totalAmount: 152702.40,
    recordedBy: 'Rajesh (DSM-1)',
    timestamp: Date.now() - 3600000 * 3,
  },
  {
    id: 'read-03',
    date: getTodayDateString(),
    shift: 'Shift 1 (Morning)',
    nozzleId: 'noz-3',
    openingReading: 61400.0,
    closingReading: 62150.0,
    testingQty: 5.0,
    netSaleQty: 745.0,
    rate: 104.20,
    totalAmount: 77629.00,
    recordedBy: 'Amit (DSM-2)',
    timestamp: Date.now() - 3600000 * 2.5,
  },
  {
    id: 'read-04',
    date: getTodayDateString(),
    shift: 'Shift 1 (Morning)',
    nozzleId: 'noz-4',
    openingReading: 98120.0,
    closingReading: 99760.0,
    testingQty: 5.0,
    netSaleQty: 1635.0,
    rate: 92.80,
    totalAmount: 151728.00,
    recordedBy: 'Amit (DSM-2)',
    timestamp: Date.now() - 3600000 * 2.5,
  },
  {
    id: 'read-05',
    date: getTodayDateString(),
    shift: 'Shift 1 (Morning)',
    nozzleId: 'noz-5',
    openingReading: 32410.0,
    closingReading: 32690.0,
    testingQty: 5.0,
    netSaleQty: 275.0,
    rate: 112.50,
    totalAmount: 30937.50,
    recordedBy: 'Kavita (DSM-3)',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'read-06',
    date: getTodayDateString(),
    shift: 'Shift 1 (Morning)',
    nozzleId: 'noz-6',
    openingReading: 115200.0,
    closingReading: 116800.0,
    testingQty: 5.0,
    netSaleQty: 1595.0,
    rate: 92.80,
    totalAmount: 148016.00,
    recordedBy: 'Kavita (DSM-3)',
    timestamp: Date.now() - 3600000 * 2,
  },
];

// Default Lubricants Catalog
export const DEFAULT_LUBRICANTS: LubricantProduct[] = [
  {
    id: 'lube-01',
    name: 'Castrol Activ 4T 20W-40',
    brand: 'Castrol',
    category: 'Engine Oil 4T',
    packSize: '900 ml',
    sku: 'CAS-ACT-900',
    mrp: 410,
    purchaseCost: 310,
    sellingPrice: 385,
    currentStock: 24,
    lowStockThreshold: 10,
    unit: 'Bottle',
  },
  {
    id: 'lube-02',
    name: 'Servo 4T Super 10W-30',
    brand: 'Servo (IOCL)',
    category: 'Engine Oil 4T',
    packSize: '1 L',
    sku: 'SRV-4T-1L',
    mrp: 460,
    purchaseCost: 360,
    sellingPrice: 430,
    currentStock: 18,
    lowStockThreshold: 8,
    unit: 'Bottle',
  },
  {
    id: 'lube-03',
    name: 'Mak Gold 15W-40 Heavy Duty Diesel Oil',
    brand: 'Mak Lubricants',
    category: 'Commercial Heavy Duty',
    packSize: '5 L',
    sku: 'MAK-GLD-5L',
    mrp: 1750,
    purchaseCost: 1350,
    sellingPrice: 1650,
    currentStock: 6, // Low stock alert!
    lowStockThreshold: 8,
    unit: 'Can',
  },
  {
    id: 'lube-04',
    name: 'Castrol CRB Turbomax 15W-40',
    brand: 'Castrol',
    category: 'Commercial Heavy Duty',
    packSize: '20 L Bucket',
    sku: 'CAS-CRB-20L',
    mrp: 6200,
    purchaseCost: 4900,
    sellingPrice: 5750,
    currentStock: 5,
    lowStockThreshold: 4,
    unit: 'Bucket',
  },
  {
    id: 'lube-05',
    name: 'Servo Futura D 5W-30 Full Synthetic Car Oil',
    brand: 'Servo (IOCL)',
    category: 'Engine Oil Car/SUV',
    packSize: '3.5 L',
    sku: 'SRV-FUT-3.5L',
    mrp: 1980,
    purchaseCost: 1520,
    sellingPrice: 1850,
    currentStock: 11,
    lowStockThreshold: 5,
    unit: 'Can',
  },
  {
    id: 'lube-06',
    name: 'Golden Cruiser Long Life Radiator Coolant',
    brand: 'Golden Cruiser',
    category: 'Coolant & DEF',
    packSize: '1 L',
    sku: 'GC-COOL-1L',
    mrp: 320,
    purchaseCost: 210,
    sellingPrice: 285,
    currentStock: 25,
    lowStockThreshold: 10,
    unit: 'Bottle',
  },
  {
    id: 'lube-07',
    name: 'AP3 High Temp Multi-Purpose Lithium Grease',
    brand: 'Servo (IOCL)',
    category: 'Grease',
    packSize: '500 g',
    sku: 'SRV-AP3-500G',
    mrp: 240,
    purchaseCost: 155,
    sellingPrice: 215,
    currentStock: 3, // Very low stock alert!
    lowStockThreshold: 8,
    unit: 'Pouch',
  },
  {
    id: 'lube-08',
    name: 'EcoClean DEF / AdBlue Exhaust Fluid',
    brand: 'EcoClean',
    category: 'Coolant & DEF',
    packSize: '20 L Bucket',
    sku: 'ECO-DEF-20L',
    mrp: 1050,
    purchaseCost: 700,
    sellingPrice: 940,
    currentStock: 14,
    lowStockThreshold: 8,
    unit: 'Bucket',
  },
];

// Default Lube Sales for today
export const DEFAULT_LUBE_SALES: LubricantSale[] = [
  {
    id: 'ls-01',
    date: getTodayDateString(),
    shift: 'Shift 1 (Morning)',
    productId: 'lube-01',
    productName: 'Castrol Activ 4T 20W-40 (900 ml)',
    packSize: '900 ml',
    quantity: 2,
    unitPrice: 385,
    totalAmount: 770,
    paymentMode: 'Cash',
    customerName: 'Walk-in Bike Rider',
    vehicleNo: 'MH-12-AZ-5512',
    invoiceNo: 'LUB-2026-0041',
    timestamp: Date.now() - 3600000 * 4,
  },
  {
    id: 'ls-02',
    date: getTodayDateString(),
    shift: 'Shift 1 (Morning)',
    productId: 'lube-08',
    productName: 'EcoClean DEF / AdBlue Exhaust Fluid',
    packSize: '20 L Bucket',
    quantity: 2,
    unitPrice: 940,
    totalAmount: 1880,
    paymentMode: 'UPI',
    customerName: 'Tata Prima Multi-Axle',
    vehicleNo: 'MH-46-H-8821',
    invoiceNo: 'LUB-2026-0042',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'ls-03',
    date: getTodayDateString(),
    shift: 'Shift 1 (Morning)',
    productId: 'lube-03',
    productName: 'Mak Gold 15W-40 Heavy Duty Diesel Oil',
    packSize: '5 L',
    quantity: 1,
    unitPrice: 1650,
    totalAmount: 1650,
    paymentMode: 'Credit',
    customerId: 'cust-1',
    customerName: 'Royal Logistics Transporters',
    vehicleNo: 'MH-12-RN-4401',
    invoiceNo: 'LUB-2026-0043',
    timestamp: Date.now() - 3600000 * 1.5,
  },
];

// Default Fleet & Credit Accounts
export const DEFAULT_CUSTOMERS: CustomerCreditAccount[] = [
  {
    id: 'cust-1',
    name: 'Vikram Singh (Director)',
    companyOrFleetName: 'Royal Logistics Transporters',
    phone: '+91 98221 11222',
    vehicleNumbers: ['MH-12-RN-4401', 'MH-12-RN-4402', 'MH-12-RN-4405', 'NL-01-AF-3320'],
    creditLimit: 250000,
    currentBalance: 78450,
    status: 'Active',
    notes: 'Payment cycle: 15th & 30th of every month. Indent slip required.',
  },
  {
    id: 'cust-2',
    name: 'Suresh Patil (Fleet Manager)',
    companyOrFleetName: 'City Ride Cabs & Airport Fleet',
    phone: '+91 94220 33444',
    vehicleNumbers: ['MH-12-Q-7788', 'MH-12-Q-7789', 'MH-12-Q-7790', 'MH-14-EA-1200'],
    creditLimit: 120000,
    currentBalance: 31200,
    status: 'Active',
    notes: 'Daily limit up to ₹8,000. Verified driver slip only.',
  },
  {
    id: 'cust-3',
    name: 'Rameshwar Developers & JCB Infra',
    companyOrFleetName: 'Apex Construction & Earthmovers',
    phone: '+91 98810 55667',
    vehicleNumbers: ['MH-12-EQ-9001', 'MH-12-EQ-9002', 'JCB-SITE-04'],
    creditLimit: 300000,
    currentBalance: 154200,
    status: 'Active',
    notes: 'Bulk HSD dispenser authorized. Site supervisor sign required.',
  },
  {
    id: 'cust-4',
    name: 'Deepak Sharma',
    companyOrFleetName: 'Sharma Interstate Sleeper Coaches',
    phone: '+91 97654 33221',
    vehicleNumbers: ['MH-04-G-1100', 'MH-04-G-1105'],
    creditLimit: 150000,
    currentBalance: 46800,
    status: 'Active',
    notes: 'Refuels late night 11 PM to 2 AM.',
  },
];

// Default Credit Indent Slips for today
export const DEFAULT_CREDIT_SLIPS: CreditIndentSlip[] = [
  {
    id: 'slip-01',
    slipNumber: 'IND-2026-0182',
    date: getTodayDateString(),
    customerId: 'cust-1',
    customerName: 'Royal Logistics Transporters',
    vehicleNumber: 'MH-12-RN-4401',
    driverName: 'Balwinder Singh',
    itemType: 'Fuel',
    fuelType: 'diesel',
    quantity: 180.0,
    rate: 92.80,
    totalAmount: 16704.0,
    isPaid: false,
    shift: 'Shift 1 (Morning)',
    meterReadingSnapshot: 125400.0,
    authorizedBy: 'Manager Ramesh',
    timestamp: Date.now() - 3600000 * 3,
  },
  {
    id: 'slip-02',
    slipNumber: 'IND-2026-0183',
    date: getTodayDateString(),
    customerId: 'cust-2',
    customerName: 'City Ride Cabs & Airport Fleet',
    vehicleNumber: 'MH-12-Q-7788',
    driverName: 'Santosh Kadam',
    itemType: 'Fuel',
    fuelType: 'petrol',
    quantity: 35.0,
    rate: 104.20,
    totalAmount: 3647.0,
    isPaid: false,
    shift: 'Shift 1 (Morning)',
    meterReadingSnapshot: 84650.0,
    authorizedBy: 'DSM Rajesh',
    timestamp: Date.now() - 3600000 * 2.5,
  },
  {
    id: 'slip-03',
    slipNumber: 'IND-2026-0184',
    date: getTodayDateString(),
    customerId: 'cust-1',
    customerName: 'Royal Logistics Transporters',
    vehicleNumber: 'MH-12-RN-4401',
    driverName: 'Balwinder Singh',
    itemType: 'Lubricant',
    lubeProductId: 'lube-03',
    lubeProductName: 'Mak Gold 15W-40 Heavy Duty Diesel Oil (5 L)',
    quantity: 1,
    rate: 1650,
    totalAmount: 1650,
    isPaid: false,
    shift: 'Shift 1 (Morning)',
    authorizedBy: 'Manager Ramesh',
    timestamp: Date.now() - 3600000 * 1.5,
  },
];

// Default Credit Payments
export const DEFAULT_CREDIT_PAYMENTS: CreditPaymentRecord[] = [
  {
    id: 'pay-01',
    receiptNumber: 'REC-2026-0098',
    date: getTodayDateString(),
    customerId: 'cust-2',
    customerName: 'City Ride Cabs & Airport Fleet',
    amount: 25000,
    paymentMode: 'NEFT/Bank Transfer',
    referenceNo: 'HDFC261003449912',
    bankName: 'HDFC Bank Corporate',
    notes: 'Settlement for previous week diesel slips',
    timestamp: Date.now() - 3600000 * 5,
  },
];

// Default Daily Expenses
export const DEFAULT_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-01',
    date: getTodayDateString(),
    shift: 'Shift 1 (Morning)',
    category: 'Tea & Refreshments',
    description: 'Morning tea and snacks for 6 pump attendants and guards',
    amount: 240,
    paidTo: 'Om Sai Canteen',
    paymentMode: 'Counter Cash',
    voucherNo: 'VCH-0891',
    timestamp: Date.now() - 3600000 * 4,
  },
  {
    id: 'exp-02',
    date: getTodayDateString(),
    shift: 'Shift 1 (Morning)',
    category: 'Staff Wages',
    description: 'Advance salary paid to pump nozzle attendant Ganesh',
    amount: 1500,
    paidTo: 'Ganesh Shinde',
    paymentMode: 'Counter Cash',
    voucherNo: 'VCH-0892',
    timestamp: Date.now() - 3600000 * 3,
  },
  {
    id: 'exp-03',
    date: getTodayDateString(),
    shift: 'Shift 1 (Morning)',
    category: 'Pump Maintenance & Spares',
    description: 'Air tower pressure gauge replacement rubber valve & sealant',
    amount: 450,
    paidTo: 'Mahalaxmi Pneumatics',
    paymentMode: 'Counter Cash',
    voucherNo: 'VCH-0893',
    timestamp: Date.now() - 3600000 * 1,
  },
];

// Default SaaS Subscription Plan (Monthly ₹999 per pump)
export const DEFAULT_SUBSCRIPTION: PumpSubscription = {
  id: 'sub-pumppro-001',
  planName: 'PumpPro Multi-Pump Commercial Pro',
  pricePerPumpMonthly: 999,
  pricePerPumpAnnual: 9990,
  activePumpsCount: 2, // 2 default stations
  totalMonthlyAmount: 1998, // 2 x ₹999 = ₹1,998
  totalAnnualAmount: 19980, // 2 x ₹9,990 = ₹19,980
  currencySymbol: '₹',
  billingCycle: 'monthly',
  status: 'Active',
  startDate: '2026-10-01',
  currentPeriodEnd: '2026-11-03',
  renewalDate: '2026-11-03',
  daysRemaining: 28,
  isTrial: false,
  autoRenew: true,
  licensedPumpIds: ['pump-01', 'pump-02'],
  registeredPumpId: 'pump-01',
  pumpName: 'Highway Star Energy & Fuel Station',
  ownerName: 'Bhaskar Senapati',
  ownerMobile: '+91 98200 44555',
  lastPaymentDate: '2026-10-01',
  lastPaymentAmount: 1998,
  invoices: [
    {
      id: 'inv-sub-1001',
      invoiceNumber: 'PUMPPRO-INV-2026-1001',
      date: '2026-10-01',
      amount: 1998,
      planName: 'PumpPro Commercial Pro (2 Stations @ ₹999/pump/mo)',
      billingPeriod: '01 Oct 2026 - 03 Nov 2026',
      paymentMode: 'UPI / QR',
      transactionId: 'UPI-RAZOR-9948210344',
      status: 'Paid',
      taxAmount: 304.76, // 18% GST component included
      pumpsCount: 2,
      ratePerPump: 999,
    },
  ],
};

// Default Registered Pumps for SaaS Multi-Station readiness
export const DEFAULT_REGISTERED_PUMPS: RegisteredPump[] = [
  {
    id: 'pump-01',
    stationName: 'Highway Star Energy & Fuel Station',
    oilCompany: 'Indian Oil',
    roCode: 'IOCL-RO-44219',
    ownerName: 'Bhaskar Senapati',
    ownerPhone: '+91 98200 44555',
    ownerEmail: 'senapatibhaskar6@gmail.com',
    gstin: '27AABCP1337Q1ZT',
    address: 'Plot 42, NH-48 Express Corridor, KM 118',
    state: 'Assam / Highway Zone',
    district: 'Kamrup Metro',
    pincode: '781001',
    highwayName: 'NH-27 / Asian Highway 1',
    nozzlesCount: 6,
    tanksCount: 3,
    registeredDate: '2026-10-01',
    planStatus: 'Active',
    isActive: true,
  },
  {
    id: 'pump-02',
    stationName: 'Brahmaputra Highway Fuel Point',
    oilCompany: 'Bharat Petroleum',
    roCode: 'BPCL-RO-88410',
    ownerName: 'Bhaskar Senapati (Branch 2)',
    ownerPhone: '+91 98200 44555',
    ownerEmail: 'senapatibhaskar6@gmail.com',
    gstin: '18AABCB9921M1ZR',
    address: 'Near Brahmaputra Bridge Link Road, Jalukbari',
    state: 'Assam',
    district: 'Guwahati',
    pincode: '781014',
    highwayName: 'NH-37 Corridor',
    nozzlesCount: 4,
    tanksCount: 2,
    registeredDate: '2026-10-02',
    planStatus: 'Active',
    isActive: false,
  },
];

// LocalStorage Helper Service
class StorageService {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Dispatch storage event for cross-component sync
      window.dispatchEvent(new Event('pumppro_data_changed'));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  // Settings
  getSettings(): PumpSettings {
    return this.getItem<PumpSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  saveSettings(settings: PumpSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  // Rates
  getRates(): FuelRate[] {
    return this.getItem<FuelRate[]>(STORAGE_KEYS.RATES, DEFAULT_RATES);
  }

  saveRates(rates: FuelRate[]): void {
    this.setItem(STORAGE_KEYS.RATES, rates);
  }

  updateRate(type: string, ratePerLiter: number, dealerCostPerLiter?: number): void {
    const rates = this.getRates();
    const updated = rates.map(r => {
      if (r.type === type) {
        const cost = dealerCostPerLiter !== undefined ? dealerCostPerLiter : r.dealerCostPerLiter;
        const margin = ratePerLiter - cost;
        return { ...r, ratePerLiter, dealerCostPerLiter: cost, dealerMarginPerLiter: margin };
      }
      return r;
    });
    this.saveRates(updated);
  }

  // Tanks
  getTanks(): TankStock[] {
    return this.getItem<TankStock[]>(STORAGE_KEYS.TANKS, DEFAULT_TANKS);
  }

  saveTanks(tanks: TankStock[]): void {
    this.setItem(STORAGE_KEYS.TANKS, tanks);
  }

  updateTankDip(tankId: string, dipCm: number, newVolume: number): void {
    const tanks = this.getTanks();
    const updated = tanks.map(t => {
      if (t.id === tankId) {
        return { ...t, dipReadingCm: dipCm, currentVolumeLiters: newVolume };
      }
      return t;
    });
    this.saveTanks(updated);
  }

  // Nozzles
  getNozzles(): Nozzle[] {
    return this.getItem<Nozzle[]>(STORAGE_KEYS.NOZZLES, DEFAULT_NOZZLES);
  }

  saveNozzles(nozzles: Nozzle[]): void {
    this.setItem(STORAGE_KEYS.NOZZLES, nozzles);
  }

  // Readings
  getReadings(): NozzleReading[] {
    return this.getItem<NozzleReading[]>(STORAGE_KEYS.READINGS, DEFAULT_READINGS);
  }

  saveReadings(readings: NozzleReading[]): void {
    this.setItem(STORAGE_KEYS.READINGS, readings);
  }

  addReading(reading: NozzleReading): void {
    const readings = this.getReadings();
    // Check if reading exists for same nozzle and shift today
    const existingIdx = readings.findIndex(
      r => r.nozzleId === reading.nozzleId && r.date === reading.date && r.shift === reading.shift
    );
    if (existingIdx >= 0) {
      readings[existingIdx] = reading;
    } else {
      readings.unshift(reading);
    }
    this.saveReadings(readings);
  }

  // Lubricants
  getLubricants(): LubricantProduct[] {
    return this.getItem<LubricantProduct[]>(STORAGE_KEYS.LUBRICANTS, DEFAULT_LUBRICANTS);
  }

  saveLubricants(lubes: LubricantProduct[]): void {
    this.setItem(STORAGE_KEYS.LUBRICANTS, lubes);
  }

  addOrUpdateLubricant(product: LubricantProduct): void {
    const lubes = this.getLubricants();
    const idx = lubes.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      lubes[idx] = product;
    } else {
      lubes.push(product);
    }
    this.saveLubricants(lubes);
  }

  adjustLubeStock(productId: string, qtyDelta: number): void {
    const lubes = this.getLubricants();
    const updated = lubes.map(p => {
      if (p.id === productId) {
        return { ...p, currentStock: Math.max(0, p.currentStock + qtyDelta) };
      }
      return p;
    });
    this.saveLubricants(updated);
  }

  // Lube Sales
  getLubeSales(): LubricantSale[] {
    return this.getItem<LubricantSale[]>(STORAGE_KEYS.LUBE_SALES, DEFAULT_LUBE_SALES);
  }

  saveLubeSales(sales: LubricantSale[]): void {
    this.setItem(STORAGE_KEYS.LUBE_SALES, sales);
  }

  addLubeSale(sale: LubricantSale): void {
    const sales = this.getLubeSales();
    sales.unshift(sale);
    this.saveLubeSales(sales);
    // Deduct stock
    this.adjustLubeStock(sale.productId, -sale.quantity);

    // If sold on credit, also log to credit slips
    if (sale.paymentMode === 'Credit' && sale.customerId) {
      const slip: CreditIndentSlip = {
        id: `slip-lube-${Date.now()}`,
        slipNumber: `IND-LUBE-${Math.floor(1000 + Math.random() * 9000)}`,
        date: sale.date,
        customerId: sale.customerId,
        customerName: sale.customerName || 'Customer',
        vehicleNumber: sale.vehicleNo || 'N/A',
        driverName: 'Customer',
        itemType: 'Lubricant',
        lubeProductId: sale.productId,
        lubeProductName: `${sale.productName} (${sale.packSize})`,
        quantity: sale.quantity,
        rate: sale.unitPrice,
        totalAmount: sale.totalAmount,
        isPaid: false,
        shift: sale.shift,
        authorizedBy: 'Counter DSM',
        timestamp: Date.now(),
      };
      this.addCreditSlip(slip);
    }
  }

  // Lube Purchases
  getLubePurchases(): LubricantPurchase[] {
    return this.getItem<LubricantPurchase[]>(STORAGE_KEYS.LUBE_PURCHASES, []);
  }

  addLubePurchase(purchase: LubricantPurchase): void {
    const purchases = this.getLubePurchases();
    purchases.unshift(purchase);
    this.setItem(STORAGE_KEYS.LUBE_PURCHASES, purchases);
    // Increase stock
    this.adjustLubeStock(purchase.productId, purchase.quantityAdded);
  }

  // Customers (Credit)
  getCustomers(): CustomerCreditAccount[] {
    return this.getItem<CustomerCreditAccount[]>(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS);
  }

  saveCustomers(customers: CustomerCreditAccount[]): void {
    this.setItem(STORAGE_KEYS.CUSTOMERS, customers);
  }

  addOrUpdateCustomer(customer: CustomerCreditAccount): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === customer.id);
    if (idx >= 0) {
      customers[idx] = customer;
    } else {
      customers.push(customer);
    }
    this.saveCustomers(customers);
  }

  // Credit Slips
  getCreditSlips(): CreditIndentSlip[] {
    return this.getItem<CreditIndentSlip[]>(STORAGE_KEYS.CREDIT_SLIPS, DEFAULT_CREDIT_SLIPS);
  }

  saveCreditSlips(slips: CreditIndentSlip[]): void {
    this.setItem(STORAGE_KEYS.CREDIT_SLIPS, slips);
  }

  addCreditSlip(slip: CreditIndentSlip): void {
    const slips = this.getCreditSlips();
    slips.unshift(slip);
    this.saveCreditSlips(slips);

    // Increase customer outstanding balance
    const customers = this.getCustomers();
    const updatedCustomers = customers.map(c => {
      if (c.id === slip.customerId) {
        return { ...c, currentBalance: c.currentBalance + slip.totalAmount };
      }
      return c;
    });
    this.saveCustomers(updatedCustomers);
  }

  // Credit Payments
  getCreditPayments(): CreditPaymentRecord[] {
    return this.getItem<CreditPaymentRecord[]>(STORAGE_KEYS.CREDIT_PAYMENTS, DEFAULT_CREDIT_PAYMENTS);
  }

  saveCreditPayments(payments: CreditPaymentRecord[]): void {
    this.setItem(STORAGE_KEYS.CREDIT_PAYMENTS, payments);
  }

  addCreditPayment(payment: CreditPaymentRecord): void {
    const payments = this.getCreditPayments();
    payments.unshift(payment);
    this.setItem(STORAGE_KEYS.CREDIT_PAYMENTS, payments);

    // Reduce customer balance
    const customers = this.getCustomers();
    const updatedCustomers = customers.map(c => {
      if (c.id === payment.customerId) {
        return { ...c, currentBalance: Math.max(0, c.currentBalance - payment.amount) };
      }
      return c;
    });
    this.saveCustomers(updatedCustomers);
  }

  // Expenses
  getExpenses(): ExpenseRecord[] {
    return this.getItem<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
  }

  saveExpenses(expenses: ExpenseRecord[]): void {
    this.setItem(STORAGE_KEYS.EXPENSES, expenses);
  }

  addExpense(expense: ExpenseRecord): void {
    const expenses = this.getExpenses();
    expenses.unshift(expense);
    this.saveExpenses(expenses);
  }

  deleteExpense(id: string): void {
    const expenses = this.getExpenses().filter(e => e.id !== id);
    this.saveExpenses(expenses);
  }

  // Reconciliations
  getReconciliations(): ShiftReconciliation[] {
    return this.getItem<ShiftReconciliation[]>(STORAGE_KEYS.RECONCILIATIONS, []);
  }

  saveReconciliation(rec: ShiftReconciliation): void {
    const recs = this.getReconciliations();
    const idx = recs.findIndex(r => r.id === rec.id || (r.date === rec.date && r.shift === rec.shift));
    if (idx >= 0) {
      recs[idx] = rec;
    } else {
      recs.unshift(rec);
    }
    this.setItem(STORAGE_KEYS.RECONCILIATIONS, recs);
    window.dispatchEvent(new Event('pumppro_data_changed'));
  }

  // Reset all to sample defaults
  resetToSampleData(): void {
    localStorage.clear();
    this.saveSettings(DEFAULT_SETTINGS);
    this.saveRates(DEFAULT_RATES);
    this.saveTanks(DEFAULT_TANKS);
    this.saveNozzles(DEFAULT_NOZZLES);
    this.saveReadings(DEFAULT_READINGS);
    this.saveLubricants(DEFAULT_LUBRICANTS);
    this.saveLubeSales(DEFAULT_LUBE_SALES);
    this.saveCustomers(DEFAULT_CUSTOMERS);
    this.saveCreditSlips(DEFAULT_CREDIT_SLIPS);
    this.saveCreditPayments(DEFAULT_CREDIT_PAYMENTS);
    this.saveExpenses(DEFAULT_EXPENSES);
    window.dispatchEvent(new Event('pumppro_data_changed'));
  }

  // Subscription Management
  getSubscription(): PumpSubscription {
    return this.getItem<PumpSubscription>(STORAGE_KEYS.SUBSCRIPTION, DEFAULT_SUBSCRIPTION);
  }

  saveSubscription(sub: PumpSubscription): void {
    this.setItem(STORAGE_KEYS.SUBSCRIPTION, sub);
  }

  renewSubscription(
    planCycle: 'monthly' | 'annual',
    paymentMode: 'UPI / QR' | 'Credit / Debit Card' | 'Net Banking' | 'Auto-Debit',
    transactionId: string,
    licensedPumpIds?: string[]
  ): PumpSubscription {
    const current = this.getSubscription();
    const pumps = this.getRegisteredPumps();
    const selectedIds = licensedPumpIds && licensedPumpIds.length > 0
      ? licensedPumpIds
      : pumps.map(p => p.id);
    const pumpsCount = Math.max(1, selectedIds.length);

    const ratePerPump = planCycle === 'monthly' ? current.pricePerPumpMonthly : current.pricePerPumpAnnual;
    const totalAmount = pumpsCount * ratePerPump;
    const daysToAdd = planCycle === 'monthly' ? 30 : 365;

    // Calculate new period end
    const now = new Date();
    const newEnd = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const dateStr = newEnd.toISOString().split('T')[0];

    const invoice: SubscriptionInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `PUMPPRO-INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: now.toISOString().split('T')[0],
      amount: totalAmount,
      planName: `PumpPro Multi-Pump Commercial (${pumpsCount} Stations @ ₹${ratePerPump}/station/${planCycle === 'monthly' ? 'mo' : 'yr'})`,
      billingPeriod: `${now.toISOString().split('T')[0]} - ${dateStr}`,
      paymentMode,
      transactionId,
      status: 'Paid',
      taxAmount: Math.round((totalAmount * 0.18) * 100) / 100,
      pumpsCount,
      ratePerPump,
    };

    const updated: PumpSubscription = {
      ...current,
      billingCycle: planCycle,
      status: 'Active',
      activePumpsCount: pumpsCount,
      totalMonthlyAmount: pumpsCount * current.pricePerPumpMonthly,
      totalAnnualAmount: pumpsCount * current.pricePerPumpAnnual,
      licensedPumpIds: selectedIds,
      startDate: now.toISOString().split('T')[0],
      currentPeriodEnd: dateStr,
      renewalDate: dateStr,
      daysRemaining: daysToAdd,
      isTrial: false,
      lastPaymentDate: now.toISOString().split('T')[0],
      lastPaymentAmount: totalAmount,
      invoices: [invoice, ...current.invoices],
    };

    this.saveSubscription(updated);
    return updated;
  }

  // Registered Pumps Management (Multi-Station SaaS)
  getRegisteredPumps(): RegisteredPump[] {
    return this.getItem<RegisteredPump[]>(STORAGE_KEYS.REGISTERED_PUMPS, DEFAULT_REGISTERED_PUMPS);
  }

  saveRegisteredPumps(pumps: RegisteredPump[]): void {
    this.setItem(STORAGE_KEYS.REGISTERED_PUMPS, pumps);
  }

  registerPump(newPump: RegisteredPump): void {
    const pumps = this.getRegisteredPumps();
    // Deactivate previous active pumps if new pump is set to active
    const updated = pumps.map(p => ({ ...p, isActive: false }));
    updated.unshift({ ...newPump, isActive: true });
    this.saveRegisteredPumps(updated);

    // Also update settings to match newly registered pump
    const settings: PumpSettings = {
      pumpName: newPump.stationName,
      dealerBrand: newPump.oilCompany,
      dealerCode: newPump.roCode,
      gstNumber: newPump.gstin,
      address: `${newPump.address}, ${newPump.district}, ${newPump.state} - ${newPump.pincode}`,
      phone: newPump.ownerPhone,
      email: newPump.ownerEmail,
      currencySymbol: '₹',
    };
    this.saveSettings(settings);

    // Automatically increase subscription active pumps count and plus ₹999/mo!
    const sub = this.getSubscription();
    const newCount = updated.length;
    sub.registeredPumpId = newPump.id;
    sub.pumpName = newPump.stationName;
    sub.ownerName = newPump.ownerName;
    sub.ownerMobile = newPump.ownerPhone;
    sub.activePumpsCount = newCount;
    sub.totalMonthlyAmount = newCount * sub.pricePerPumpMonthly; // Each additional pump adds ₹999!
    sub.totalAnnualAmount = newCount * sub.pricePerPumpAnnual;
    if (!sub.licensedPumpIds.includes(newPump.id)) {
      sub.licensedPumpIds.push(newPump.id);
    }
    this.saveSubscription(sub);
  }

  switchActivePump(pumpId: string): void {
    const pumps = this.getRegisteredPumps();
    const target = pumps.find(p => p.id === pumpId);
    if (!target) return;

    const updated = pumps.map(p => ({
      ...p,
      isActive: p.id === pumpId,
    }));
    this.saveRegisteredPumps(updated);

    // Update settings
    this.saveSettings({
      pumpName: target.stationName,
      dealerBrand: target.oilCompany,
      dealerCode: target.roCode,
      gstNumber: target.gstin,
      address: `${target.address}, ${target.district}, ${target.state} - ${target.pincode}`,
      phone: target.ownerPhone,
      email: target.ownerEmail,
      currencySymbol: '₹',
    });

    const sub = this.getSubscription();
    sub.registeredPumpId = target.id;
    sub.pumpName = target.stationName;
    sub.ownerName = target.ownerName;
    sub.ownerMobile = target.ownerPhone;
    this.saveSubscription(sub);
  }

  // Export full JSON backup
  exportBackupJSON(): string {
    const backup = {
      settings: this.getSettings(),
      rates: this.getRates(),
      tanks: this.getTanks(),
      nozzles: this.getNozzles(),
      readings: this.getReadings(),
      lubricants: this.getLubricants(),
      lubeSales: this.getLubeSales(),
      lubePurchases: this.getLubePurchases(),
      customers: this.getCustomers(),
      creditSlips: this.getCreditSlips(),
      creditPayments: this.getCreditPayments(),
      expenses: this.getExpenses(),
      reconciliations: this.getReconciliations(),
      exportedAt: new Date().toISOString(),
      app: 'PumpPro v2.4',
    };
    return JSON.stringify(backup, null, 2);
  }

  // Import JSON backup
  importBackupJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.settings) this.saveSettings(data.settings);
      if (data.rates) this.saveRates(data.rates);
      if (data.tanks) this.saveTanks(data.tanks);
      if (data.nozzles) this.saveNozzles(data.nozzles);
      if (data.readings) this.saveReadings(data.readings);
      if (data.lubricants) this.saveLubricants(data.lubricants);
      if (data.lubeSales) this.saveLubeSales(data.lubeSales);
      if (data.customers) this.saveCustomers(data.customers);
      if (data.creditSlips) this.saveCreditSlips(data.creditSlips);
      if (data.creditPayments) this.setItem(STORAGE_KEYS.CREDIT_PAYMENTS, data.creditPayments);
      if (data.expenses) this.saveExpenses(data.expenses);
      if (data.reconciliations) this.setItem(STORAGE_KEYS.RECONCILIATIONS, data.reconciliations);
      window.dispatchEvent(new Event('pumppro_data_changed'));
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  }
}

export const storage = new StorageService();
