import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ShoppingCart,
  ArrowDownToLine,
  Tag,
  Filter,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Droplet,
  Layers,
  X,
  CreditCard,
  QrCode,
  Banknote,
} from 'lucide-react';
import {
  LubricantProduct,
  LubricantSale,
  LubricantPurchase,
  CustomerCreditAccount,
  PumpSettings,
  LubeCategory,
} from '../types';
import { storage, getTodayDateString } from '../services/storage';

interface LubricantsManagerProps {
  settings: PumpSettings;
  lubricants: LubricantProduct[];
  lubeSales: LubricantSale[];
  customers: CustomerCreditAccount[];
  activeShift: string;
  onRefreshData: () => void;
}

export const LubricantsManager: React.FC<LubricantsManagerProps> = ({
  settings,
  lubricants,
  lubeSales,
  customers,
  activeShift,
  onRefreshData,
}) => {
  const sym = settings.currencySymbol;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LubricantProduct | null>(null);

  // Quick Sale Form State
  const [saleQty, setSaleQty] = useState(1);
  const [salePrice, setSalePrice] = useState(0);
  const [salePaymentMode, setSalePaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Credit'>('Cash');
  const [saleCustomerName, setSaleCustomerName] = useState('');
  const [saleVehicleNo, setSaleVehicleNo] = useState('');
  const [saleCustomerId, setSaleCustomerId] = useState('');

  // Stock In Form State
  const [stockInQty, setStockInQty] = useState(10);
  const [stockInCost, setStockInCost] = useState(0);
  const [stockInSupplier, setStockInSupplier] = useState('Authorized Distributor (Bharat Petroleum / Castrol)');
  const [stockInInvoice, setStockInInvoice] = useState(`INV-SUP-${Math.floor(1000 + Math.random() * 9000)}`);

  // New Product Form State
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('Castrol');
  const [newProductCategory, setNewProductCategory] = useState<LubeCategory>('Engine Oil 4T');
  const [newProductPackSize, setNewProductPackSize] = useState('1 L');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductMrp, setNewProductMrp] = useState(450);
  const [newProductCost, setNewProductCost] = useState(350);
  const [newProductSelling, setNewProductSelling] = useState(420);
  const [newProductStock, setNewProductStock] = useState(12);
  const [newProductThreshold, setNewProductThreshold] = useState(6);
  const [newProductUnit, setNewProductUnit] = useState('Bottle');

  const categories: string[] = [
    'All',
    'Engine Oil 4T',
    'Engine Oil Car/SUV',
    'Commercial Heavy Duty',
    'Gear Oil',
    'Coolant & DEF',
    'Grease',
  ];

  // Filtered Lubricants List
  const filteredProducts = useMemo(() => {
    return lubricants.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.packSize.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === 'All' || p.category === selectedCategory;

      const matchLowStock = !showLowStockOnly || p.currentStock <= p.lowStockThreshold;

      return matchSearch && matchCategory && matchLowStock;
    });
  }, [lubricants, searchQuery, selectedCategory, showLowStockOnly]);

  // Overall Lubricant Inventory Value Metrics
  const inventoryStats = useMemo(() => {
    let totalStockUnits = 0;
    let totalStockValueCost = 0;
    let totalStockValueRetail = 0;
    let lowStockCount = 0;

    lubricants.forEach((p) => {
      totalStockUnits += p.currentStock;
      totalStockValueCost += p.currentStock * p.purchaseCost;
      totalStockValueRetail += p.currentStock * p.sellingPrice;
      if (p.currentStock <= p.lowStockThreshold) {
        lowStockCount++;
      }
    });

    // Today's Lube Sales Totals
    const todaySales = lubeSales.filter((s) => s.date === getTodayDateString());
    const todaySalesTotal = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
    const todayUnitsSold = todaySales.reduce((acc, s) => acc + s.quantity, 0);

    return {
      totalStockUnits,
      totalStockValueCost,
      totalStockValueRetail,
      lowStockCount,
      todaySalesTotal,
      todayUnitsSold,
    };
  }, [lubricants, lubeSales]);

  // Open Sale Modal for a specific product
  const handleOpenSale = (product: LubricantProduct) => {
    setSelectedProduct(product);
    setSaleQty(1);
    setSalePrice(product.sellingPrice);
    setSalePaymentMode('Cash');
    setSaleCustomerName('');
    setSaleVehicleNo('');
    setSaleCustomerId('');
    setShowSaleModal(true);
  };

  // Open Stock In Modal for a specific product
  const handleOpenStockIn = (product: LubricantProduct) => {
    setSelectedProduct(product);
    setStockInQty(10);
    setStockInCost(product.purchaseCost);
    setShowStockInModal(true);
  };

  // Submit Sale
  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (saleQty > selectedProduct.currentStock) {
      alert(`Insufficient stock! Only ${selectedProduct.currentStock} ${selectedProduct.unit}s available.`);
      return;
    }

    const totalAmount = saleQty * salePrice;
    const invNo = `LUB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSale: LubricantSale = {
      id: `ls-${Date.now()}`,
      date: getTodayDateString(),
      shift: activeShift,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      packSize: selectedProduct.packSize,
      quantity: saleQty,
      unitPrice: salePrice,
      totalAmount,
      paymentMode: salePaymentMode,
      customerId: salePaymentMode === 'Credit' ? saleCustomerId : undefined,
      customerName:
        salePaymentMode === 'Credit'
          ? customers.find((c) => c.id === saleCustomerId)?.companyOrFleetName || saleCustomerName
          : saleCustomerName || 'Counter Retail Customer',
      vehicleNo: saleVehicleNo || 'Counter',
      invoiceNo: invNo,
      timestamp: Date.now(),
    };

    storage.addLubeSale(newSale);
    onRefreshData();
    setShowSaleModal(false);
  };

  // Submit Stock In
  const handleCompleteStockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const purchase: LubricantPurchase = {
      id: `pur-${Date.now()}`,
      date: getTodayDateString(),
      productId: selectedProduct.id,
      quantityAdded: stockInQty,
      costPerUnit: stockInCost,
      totalCost: stockInQty * stockInCost,
      supplierInvoice: stockInInvoice,
      supplierName: stockInSupplier,
      timestamp: Date.now(),
    };

    storage.addLubePurchase(purchase);
    onRefreshData();
    setShowStockInModal(false);
  };

  // Submit Add New Product
  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: LubricantProduct = {
      id: `lube-${Date.now()}`,
      name: newProductName,
      brand: newProductBrand,
      category: newProductCategory,
      packSize: newProductPackSize,
      sku: newProductSku || `${newProductBrand.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      mrp: Number(newProductMrp),
      purchaseCost: Number(newProductCost),
      sellingPrice: Number(newProductSelling),
      currentStock: Number(newProductStock),
      lowStockThreshold: Number(newProductThreshold),
      unit: newProductUnit,
    };

    storage.addOrUpdateLubricant(newProduct);
    onRefreshData();
    setShowAddProductModal(false);
    // Reset Form
    setNewProductName('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">
              Lubricants & Non-Fuel Inventory
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Engine oils, coolants, grease, and DEF stock control, counter sales, and purchase entries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddProductModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Stock In Hand
            </span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {inventoryStats.totalStockUnits} Units
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Valued at {sym}{inventoryStats.totalStockValueCost.toLocaleString('en-IN')} (Cost)
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Retail Value of Stock
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {sym}{inventoryStats.totalStockValueRetail.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-400/80 mt-0.5 block">
              Potential Margin: {sym}{(inventoryStats.totalStockValueRetail - inventoryStats.totalStockValueCost).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Today's Counter Sales
            </span>
            <div className="text-2xl font-black text-orange-400 font-mono mt-0.5">
              {sym}{inventoryStats.todaySalesTotal.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {inventoryStats.todayUnitsSold} Packs dispensed today
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Low Stock Alerts
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              {inventoryStats.lowStockCount} Products
            </div>
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className="text-[10px] font-bold text-amber-400 hover:underline mt-0.5 block text-left"
            >
              {showLowStockOnly ? 'Show All Products' : 'Filter Low Stock →'}
            </button>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by lubricant name, brand (Castrol, Servo, Mak), pack size, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-hidden placeholder:text-slate-500 transition"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap py-1 shrink-0 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const isLowStock = product.currentStock <= product.lowStockThreshold;
          const isCritical = product.currentStock <= Math.floor(product.lowStockThreshold / 2);
          const margin = product.sellingPrice - product.purchaseCost;
          const marginPercent = Math.round((margin / product.purchaseCost) * 100);

          return (
            <div
              key={product.id}
              className={`bg-slate-900 border rounded-2xl p-4.5 shadow-lg flex flex-col justify-between transition group hover:border-slate-700 ${
                isCritical
                  ? 'border-red-500/40 bg-gradient-to-b from-red-500/5 to-slate-900'
                  : isLowStock
                  ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-slate-900'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Brand & Category */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-extrabold text-orange-400 tracking-wider uppercase text-[10px] bg-orange-500/10 px-2 py-0.5 rounded">
                    {product.brand}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    SKU: {product.sku}
                  </span>
                </div>

                {/* Name & Pack Size */}
                <h3 className="font-bold text-white text-sm group-hover:text-orange-400 transition leading-snug">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px]">
                    {product.packSize}
                  </span>
                  <span>•</span>
                  <span>{product.category}</span>
                </div>

                {/* Stock Level Progress */}
                <div className="mt-3.5 space-y-1.5 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">In Stock</span>
                    <span
                      className={`font-mono font-bold ${
                        isCritical
                          ? 'text-red-400'
                          : isLowStock
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {product.currentStock} {product.unit}s
                    </span>
                  </div>

                  <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCritical
                          ? 'bg-red-500'
                          : isLowStock
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (product.currentStock / (product.lowStockThreshold * 2.5)) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Min Safety Level: {product.lowStockThreshold}</span>
                    {isLowStock && (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Low Stock</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Price Matrix */}
                <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-slate-800/80">
                  <div className="bg-slate-800/30 p-1.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">MRP</span>
                    <span className="text-xs font-mono font-bold text-slate-400 line-through">
                      {sym}{product.mrp}
                    </span>
                  </div>
                  <div className="bg-slate-800/30 p-1.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Buy Cost</span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {sym}{product.purchaseCost}
                    </span>
                  </div>
                  <div className="bg-orange-500/10 p-1.5 rounded-lg border border-orange-500/20">
                    <span className="text-[10px] text-orange-400 block font-bold">Sell Price</span>
                    <span className="text-xs font-mono font-black text-orange-400">
                      {sym}{product.sellingPrice}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleOpenSale(product)}
                  disabled={product.currentStock <= 0}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition cursor-pointer active:scale-95"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Sell (Counter)</span>
                </button>

                <button
                  onClick={() => handleOpenStockIn(product)}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                  title="Stock-in / Add purchase quantity"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Stock In</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Sale Checkout Modal */}
      {showSaleModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-400" />
                <h2 className="text-base font-bold text-white">Record Counter Sale</h2>
              </div>
              <button
                onClick={() => setShowSaleModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
              <div className="text-xs font-bold text-white">{selectedProduct.name}</div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Pack: {selectedProduct.packSize}</span>
                <span className="font-mono text-emerald-400 font-bold">
                  Available: {selectedProduct.currentStock} {selectedProduct.unit}s
                </span>
              </div>
            </div>

            <form onSubmit={handleCompleteSale} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct.currentStock}
                    required
                    value={saleQty}
                    onChange={(e) => setSaleQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Unit Price ({sym})</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-hidden"
                  />
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Payment Mode</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Cash', 'UPI', 'Card', 'Credit'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSalePaymentMode(mode)}
                      className={`py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition ${
                        salePaymentMode === mode
                          ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {mode === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                      {mode === 'UPI' && <QrCode className="w-3.5 h-3.5" />}
                      {mode === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                      {mode === 'Credit' && <Tag className="w-3.5 h-3.5" />}
                      <span>{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* If Credit, select Fleet Customer */}
              {salePaymentMode === 'Credit' ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-400">
                    Select Fleet Customer Account
                  </label>
                  <select
                    required
                    value={saleCustomerId}
                    onChange={(e) => setSaleCustomerId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  >
                    <option value="">-- Choose Account --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyOrFleetName} ({c.name}) - Due: {sym}{c.currentBalance}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Customer and Vehicle Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Walk-in / Driver"
                    value={saleCustomerName}
                    onChange={(e) => setSaleCustomerName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g. MH-12-AB-1234"
                    value={saleVehicleNo}
                    onChange={(e) => setSaleVehicleNo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase outline-hidden"
                  />
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-slate-800 rounded-xl flex items-center justify-between border border-slate-700">
                <span className="text-xs text-slate-400">Total Bill Amount:</span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  {sym}{(saleQty * salePrice).toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition"
              >
                Confirm Sale & Print Slip
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stock In Purchase Modal */}
      {showStockInModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">Stock-In / Purchase Entry</h2>
              </div>
              <button
                onClick={() => setShowStockInModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
              <div className="text-xs font-bold text-white">{selectedProduct.name}</div>
              <div className="text-[11px] text-slate-400">
                Current Stock: {selectedProduct.currentStock} {selectedProduct.unit}s
              </div>
            </div>

            <form onSubmit={handleCompleteStockIn} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Quantity Added</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockInQty}
                    onChange={(e) => setStockInQty(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Purchase Cost/Unit ({sym})</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={stockInCost}
                    onChange={(e) => setStockInCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={stockInSupplier}
                  onChange={(e) => setStockInSupplier(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Supplier Invoice / Challan No.</label>
                <input
                  type="text"
                  required
                  value={stockInInvoice}
                  onChange={(e) => setStockInInvoice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-hidden"
                />
              </div>

              <div className="p-3 bg-slate-800 rounded-xl flex items-center justify-between border border-slate-700">
                <span className="text-xs text-slate-400">Total Purchase Value:</span>
                <span className="text-lg font-black font-mono text-sky-400">
                  {sym}{(stockInQty * stockInCost).toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 active:scale-95 transition"
              >
                Update Stock In Inventory
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-400" />
                <h2 className="text-base font-bold text-white">Add Lubricant / Fluid Product</h2>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Castrol MAGNATEC Stop-Start 5W-30"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Servo, Castrol, Mak, Mobil"
                    value={newProductBrand}
                    onChange={(e) => setNewProductBrand(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Category</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value as LubeCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  >
                    <option value="Engine Oil 4T">Engine Oil 4T (Bike)</option>
                    <option value="Engine Oil Car/SUV">Engine Oil Car/SUV</option>
                    <option value="Commercial Heavy Duty">Commercial Heavy Duty</option>
                    <option value="Gear Oil">Gear Oil</option>
                    <option value="Coolant & DEF">Coolant & DEF</option>
                    <option value="Grease">Grease</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Pack Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 L, 3.5 L, 5 L, 20 L"
                    value={newProductPackSize}
                    onChange={(e) => setNewProductPackSize(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Unit Type</label>
                  <select
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  >
                    <option value="Bottle">Bottle</option>
                    <option value="Can">Can</option>
                    <option value="Bucket">Bucket</option>
                    <option value="Pouch">Pouch</option>
                    <option value="Drum">Drum / Barrel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">SKU Code</label>
                  <input
                    type="text"
                    placeholder="Auto or CAS-5W30"
                    value={newProductSku}
                    onChange={(e) => setNewProductSku(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">MRP ({sym})</label>
                  <input
                    type="number"
                    value={newProductMrp}
                    onChange={(e) => setNewProductMrp(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Purchase Cost ({sym})</label>
                  <input
                    type="number"
                    value={newProductCost}
                    onChange={(e) => setNewProductCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-orange-400">Selling Price ({sym})</label>
                  <input
                    type="number"
                    value={newProductSelling}
                    onChange={(e) => setNewProductSelling(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-orange-500/60 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Opening Stock Qty</label>
                  <input
                    type="number"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-400">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    value={newProductThreshold}
                    onChange={(e) => setNewProductThreshold(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition"
              >
                Save Product to Catalog
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
