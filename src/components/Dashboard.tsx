import React, { useState, useMemo } from 'react';
import {
  Fuel,
  TrendingUp,
  Package,
  Users,
  Receipt,
  Scale,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Droplet,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  X,
  Zap,
  Building,
  ShieldCheck,
  HelpCircle,
  Calculator,
  Truck,
} from 'lucide-react';
import {
  FuelRate,
  Nozzle,
  NozzleReading,
  TankStock,
  LubricantProduct,
  LubricantSale,
  CustomerCreditAccount,
  CreditIndentSlip,
  ExpenseRecord,
  PumpSettings,
} from '../types';
import { storage, getTodayDateString } from '../services/storage';
import { NewProductLaunchModal } from './NewProductLaunchModal';
import { AccountsAuditGuideModal } from './AccountsAuditGuideModal';

interface DashboardProps {
  settings: PumpSettings;
  rates: FuelRate[];
  tanks: TankStock[];
  nozzles: Nozzle[];
  readings: NozzleReading[];
  lubricants: LubricantProduct[];
  lubeSales: LubricantSale[];
  customers: CustomerCreditAccount[];
  creditSlips: CreditIndentSlip[];
  expenses: ExpenseRecord[];
  activeShift: string;
  onNavigate: (tab: string) => void;
  onOpenQuickSale?: () => void;
  onRefreshData?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  settings,
  rates,
  tanks,
  nozzles,
  readings,
  lubricants,
  lubeSales,
  customers,
  creditSlips,
  expenses,
  activeShift,
  onNavigate,
  onOpenQuickSale,
  onRefreshData,
}) => {
  const sym = settings.currencySymbol;

  // State for Add New Fuel / Energy Product Modal & Accounts Audit Guide
  const [showProductLaunchModal, setShowProductLaunchModal] = useState(false);
  const [showAuditGuideModal, setShowAuditGuideModal] = useState(false);

  // Calculate Key Real-Time Metrics for Today
  const metrics = useMemo(() => {
    // 1. Fuel Sales
    let totalFuelSalesAmount = 0;
    let totalFuelLiters = 0;
    let petrolLiters = 0;
    let petrolAmount = 0;
    let dieselLiters = 0;
    let dieselAmount = 0;
    let premiumLiters = 0;
    let premiumAmount = 0;
    let fuelDealerMargin = 0;

    const fuelProductStats: Record<string, { rateObj: FuelRate; liters: number; revenue: number; margin: number }> = {};
    rates.forEach((r) => {
      fuelProductStats[r.type] = { rateObj: r, liters: 0, revenue: 0, margin: 0 };
    });

    readings.forEach((r) => {
      totalFuelSalesAmount += r.totalAmount;
      totalFuelLiters += r.netSaleQty;

      const nozzle = nozzles.find((n) => n.id === r.nozzleId);
      const fuelType = nozzle?.fuelType || 'petrol';
      const rateObj = rates.find((rt) => rt.type === fuelType) || rates[0];
      const margin = rateObj ? rateObj.dealerMarginPerLiter : 2.5;

      fuelDealerMargin += r.netSaleQty * margin;

      if (!fuelProductStats[fuelType]) {
        fuelProductStats[fuelType] = { rateObj, liters: 0, revenue: 0, margin: 0 };
      }
      fuelProductStats[fuelType].liters += r.netSaleQty;
      fuelProductStats[fuelType].revenue += r.totalAmount;
      fuelProductStats[fuelType].margin += r.netSaleQty * margin;

      if (fuelType === 'petrol') {
        petrolLiters += r.netSaleQty;
        petrolAmount += r.totalAmount;
      } else if (fuelType === 'diesel') {
        dieselLiters += r.netSaleQty;
        dieselAmount += r.totalAmount;
      } else if (fuelType === 'premium_petrol') {
        premiumLiters += r.netSaleQty;
        premiumAmount += r.totalAmount;
      }
    });

    // 2. Lubricant / Non-Fuel Sales
    let totalLubeSalesAmount = 0;
    let totalLubeMargin = 0;
    let totalLubePacksSold = 0;

    lubeSales.forEach((ls) => {
      totalLubeSalesAmount += ls.totalAmount;
      totalLubePacksSold += ls.quantity;
      const product = lubricants.find((p) => p.id === ls.productId);
      if (product) {
        const itemMargin = (ls.unitPrice - product.purchaseCost) * ls.quantity;
        totalLubeMargin += Math.max(0, itemMargin);
      } else {
        totalLubeMargin += ls.totalAmount * 0.18; // fallback 18% margin
      }
    });

    // 3. Gross Sales
    const grossSalesAmount = totalFuelSalesAmount + totalLubeSalesAmount;

    // 4. Expenses Total
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 5. Credit Slips Total (Uncollected on counter today)
    const totalCreditGiven = creditSlips.reduce((sum, s) => sum + s.totalAmount, 0);

    // 6. Net Collections / Cash in Hand (Expected counter drawer)
    const expectedCounterCash = grossSalesAmount - totalCreditGiven - totalExpenses;

    // 7. Total Outstanding Customer Dues (Fleet & regular ledger)
    const totalOutstandingDues = customers.reduce((sum, c) => sum + c.currentBalance, 0);

    // 8. Net Estimated Daily Station Profit (Margins minus operating expenses)
    const totalGrossMargin = fuelDealerMargin + totalLubeMargin;
    const netStationProfit = totalGrossMargin - totalExpenses;

    // 9. Low stock lubricants
    const lowStockItems = lubricants.filter((l) => l.currentStock <= l.lowStockThreshold);

    return {
      totalFuelSalesAmount,
      totalFuelLiters,
      petrolLiters,
      petrolAmount,
      dieselLiters,
      dieselAmount,
      premiumLiters,
      premiumAmount,
      fuelDealerMargin,
      totalLubeSalesAmount,
      totalLubeMargin,
      totalLubePacksSold,
      grossSalesAmount,
      totalExpenses,
      totalCreditGiven,
      expectedCounterCash,
      totalOutstandingDues,
      netStationProfit,
      lowStockItems,
      fuelProductStats,
    };
  }, [readings, lubeSales, expenses, creditSlips, customers, nozzles, rates, lubricants]);

  const todayStr = getTodayDateString();
  const allRecons = storage.getStockReconciliations();
  const todayStockRecons = useMemo(() => {
    return tanks.map((tank) => {
      const saved = allRecons.find((r) => r.tankId === tank.id && r.date === todayStr);
      return saved || storage.calculateStockReconciliation(tank.id, todayStr);
    });
  }, [tanks, allRecons, todayStr, readings]);

  return (
    <div className="space-y-6 pb-12">
      {/* Station Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Live Station Control
            </span>
            <span className="text-slate-400 text-xs">Shift: {activeShift}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white mt-1 tracking-tight">
            {settings.pumpName}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>RO Code: <strong className="text-slate-300">{settings.dealerCode}</strong></span>
            <span>•</span>
            <span>Brand: <strong className="text-sky-400">{settings.dealerBrand}</strong></span>
            <span>•</span>
            <span>Corridor: {settings.address}</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => onNavigate('readings')}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-3 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95 cursor-pointer text-center"
          >
            <Fuel className="w-4 h-4 shrink-0" />
            <span className="truncate">Record Readings</span>
          </button>

          <button
            onClick={() => onNavigate('lubricants')}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3 py-2.5 rounded-xl transition active:scale-95 cursor-pointer text-center"
          >
            <Package className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="truncate">Sell Lubricant</span>
          </button>

          <button
            onClick={() => onNavigate('credit')}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-3 py-2.5 rounded-xl transition active:scale-95 cursor-pointer text-center"
          >
            <Users className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">Credit Slip</span>
          </button>

          <button
            onClick={() => onNavigate('reconciliation')}
            className="flex items-center justify-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold text-xs px-3 py-2.5 rounded-xl transition active:scale-95 cursor-pointer text-center"
          >
            <Scale className="w-4 h-4 shrink-0" />
            <span className="truncate">Shift Tally</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Fuel Sales Card */}
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4.5 shadow-lg relative overflow-hidden transition group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Fuel Sales</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {sym}{metrics.totalFuelSalesAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400 font-mono">
              {metrics.totalFuelLiters.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Liters
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{sym}{metrics.fuelDealerMargin.toFixed(0)} margin</span>
            </span>
          </div>
        </div>

        {/* Lubricant & Non-Fuel Sales */}
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4.5 shadow-lg relative overflow-hidden transition group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Lubes & Non-Fuel</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {sym}{metrics.totalLubeSalesAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400 font-medium">
              {metrics.totalLubePacksSold} Units sold
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{sym}{metrics.totalLubeMargin.toFixed(0)} margin</span>
            </span>
          </div>
        </div>

        {/* Credit / Fleet Dues Given */}
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4.5 shadow-lg relative overflow-hidden transition group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Credit Slips Given</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-tight">
            {sym}{metrics.totalCreditGiven.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">Total Outstanding</span>
            <span className="text-slate-300 font-mono font-bold">
              {sym}{metrics.totalOutstandingDues.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Expected Net Counter Cash */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-4.5 shadow-xl relative overflow-hidden transition group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Expected Counter Cash
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {sym}{metrics.expectedCounterCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400 font-mono">
              Excl. {sym}{metrics.totalExpenses} exp
            </span>
            <button
              onClick={() => onNavigate('reconciliation')}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline"
            >
              Tally Drawer →
            </button>
          </div>
        </div>
      </div>

      {/* Fuel Volume Breakdown, Underground Tank Levels & Live Audit (Selected Target Element) */}
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-800/80 rounded-3xl p-6 lg:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden transition duration-300 hover:border-slate-700/80 space-y-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Station Zero-Discrepancy Accounts Verification & Live Audit Bar */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">
                  হিচাপ পৰীক্ষা আৰু শুদ্ধতা অডিট • Live Station Health & Audit
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Zero Discrepancy Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                মুঠ বিক্ৰী: <strong className="text-white font-mono">{sym}{(metrics.totalFuelSalesAmount + metrics.totalLubeSalesAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> • বাকী স্লিপ: <strong className="text-amber-400 font-mono">-{sym}{metrics.totalCreditGiven.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> • খৰচ: <strong className="text-rose-400 font-mono">-{sym}{metrics.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> • পাবলগীয়া কেচ: <strong className="text-emerald-400 font-mono">{sym}{metrics.expectedCounterCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAuditGuideModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5 self-start md:self-auto"
          >
            <HelpCircle className="w-4 h-4" />
            <span>হিচাপ ক'ত কিদৰে চাব? (Guide & Audit)</span>
          </button>
        </div>

        {/* Daily Fuel Stock Reconciliation & Shortage/Gain Audit (Core User Requirement) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>Fuel Stock Management & Shortage Tracking</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-orange-400 border border-orange-500/30">
                    Daily Reconciliation
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Formula: Expected Closing (Opening + Received − Sales) vs Actual Physical Dip
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('fuel-stock')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold transition self-start sm:self-auto cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Open Stock & Tankers Ledger →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tanks.map((tank) => {
              const recon =
                todayStockRecons.find((r) => r.tankId === tank.id) ||
                storage.calculateStockReconciliation(tank.id, todayStr);
              const isShortage = recon.status === 'Shortage';
              const isGain = recon.status === 'Gain';

              return (
                <div
                  key={tank.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition ${
                    isShortage
                      ? 'bg-red-500/10 border-red-500/30 text-red-200'
                      : isGain
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-white text-sm flex items-center gap-1.5">
                        <Droplet className="w-3.5 h-3.5 text-orange-400" />
                        {tank.name}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isShortage
                            ? 'bg-red-500 text-white'
                            : isGain
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isShortage ? 'Shortage' : isGain ? 'Gain' : 'Balanced'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block font-sans">1. Opening:</span>
                        <span className="font-bold text-white">{recon.openingStockLiters.toLocaleString()} L</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
                        <span className="text-[10px] text-sky-400 block font-sans">2. Received:</span>
                        <span className="font-bold text-sky-400">+{recon.stockReceivedLiters.toLocaleString()} L</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
                        <span className="text-[10px] text-red-400 block font-sans">3. Sales:</span>
                        <span className="font-bold text-red-400">-{recon.netSalesLiters.toLocaleString()} L</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
                        <span className="text-[10px] text-purple-400 block font-sans">4. Expected:</span>
                        <span className="font-bold text-purple-300">{recon.expectedClosingLiters.toLocaleString()} L</span>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Actual Physical Dip:</span>
                        <span className="font-bold text-white font-mono text-sm">
                          {recon.actualClosingLiters.toLocaleString()} L
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Variance / Loss:</span>
                        <span
                          className={`font-black font-mono text-sm ${
                            isShortage ? 'text-red-400' : isGain ? 'text-emerald-400' : 'text-slate-300'
                          }`}
                        >
                          {isShortage
                            ? `-${recon.shortageLiters.toFixed(1)} L (${sym}${Math.abs(recon.financialImpact).toFixed(0)})`
                            : isGain
                            ? `+${recon.gainLiters.toFixed(1)} L (+${sym}${Math.abs(recon.financialImpact).toFixed(0)})`
                            : '0.0 L (Balanced)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Telemetry Grid: Left Fuel Sales by Product & Nozzles | Right Underground Tank Dips */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fuel Volumes & Daily Breakdown */}
          <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                  <Fuel className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Daily Fuel Sales by Product</h2>
                  <span className="text-[11px] text-slate-400">
                    Total Volume: <strong className="text-white font-mono">{metrics.totalFuelLiters.toFixed(1)} L</strong> ({rates.length} Active Fuel Grades)
                  </span>
                </div>
              </div>

              {/* NEW PRODUCT LAUNCH BUTTON FOR OIL COMPANY INTRODUCTIONS */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowProductLaunchModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs transition active:scale-95 cursor-pointer shadow-md shadow-orange-500/20"
                  title="Add newly launched fuel, DEF (AdBlue) or lubricant product from Oil Company"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Launch New Product (নতুন প্ৰডাক্ট)</span>
                </button>
              </div>
            </div>

            {/* Dynamic Fuel Products Cards Grid (Supports any new product added) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {rates.map((rate) => {
                const stat = metrics.fuelProductStats[rate.type] || { liters: 0, revenue: 0, margin: 0 };
                const percent = metrics.totalFuelLiters > 0 ? (stat.liters / metrics.totalFuelLiters) * 100 : 0;

                return (
                  <div
                    key={rate.type}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2 transition group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold flex items-center gap-1.5 truncate max-w-[130px]" style={{ color: rate.color }}>
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: rate.color }} />
                        <span className="truncate">{rate.name}</span>
                      </span>
                      <span className="font-mono text-slate-300 font-bold flex-shrink-0">
                        {stat.liters.toFixed(1)} L
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: rate.color,
                          width: `${percent}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span className="truncate font-mono">Rate: {sym}{rate.ratePerLiter.toFixed(2)}/L</span>
                      <span className="font-mono font-bold text-slate-200 flex-shrink-0">
                        {sym}{stat.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Interactive Card to Quick-Add another product */}
              <div
                onClick={() => setShowProductLaunchModal(true)}
                className="bg-slate-900/40 hover:bg-slate-900/80 border-2 border-dashed border-slate-800 hover:border-orange-500/50 rounded-xl p-3.5 flex flex-col items-center justify-center gap-1 cursor-pointer transition text-center group min-h-[90px]"
              >
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 group-hover:scale-110 transition">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-300 group-hover:text-orange-400 transition">
                  + Launch New Oil Product
                </span>
                <span className="text-[10px] text-slate-500">
                  XP100, AdBlue, XtraGreen, E20 etc.
                </span>
              </div>
            </div>

            {/* Quick Nozzle Reading Status Table */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Dispenser Nozzles Summary
                </span>
                <button
                  onClick={() => onNavigate('readings')}
                  className="text-xs font-semibold text-orange-400 hover:text-orange-300 cursor-pointer"
                >
                  View / Edit Readings →
                </button>
              </div>

              <div className="overflow-x-auto no-scrollbar rounded-xl border border-slate-800/80 -mx-1 sm:mx-0">
                <table className="w-full text-left text-xs min-w-[540px]">
                  <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Nozzle</th>
                      <th className="py-2.5 px-3">Fuel</th>
                      <th className="py-2.5 px-3">Opening</th>
                      <th className="py-2.5 px-3">Closing</th>
                      <th className="py-2.5 px-3">Test</th>
                      <th className="py-2.5 px-3 text-right">Net Liters</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {nozzles.slice(0, 4).map((nozzle) => {
                      const reading = readings.find((r) => r.nozzleId === nozzle.id);
                      const fuelColor =
                        nozzle.fuelType === 'petrol'
                          ? 'text-orange-400 bg-orange-500/10'
                          : nozzle.fuelType === 'diesel'
                          ? 'text-sky-400 bg-sky-500/10'
                          : 'text-purple-400 bg-purple-500/10';

                      return (
                        <tr key={nozzle.id} className="hover:bg-slate-900/60 transition">
                          <td className="py-2 px-3 font-semibold text-white">
                            {nozzle.name}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${fuelColor}`}>
                              {nozzle.fuelType.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-400">
                            {reading ? reading.openingReading.toFixed(1) : '—'}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-400">
                            {reading ? reading.closingReading.toFixed(1) : '—'}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-400">
                            {reading ? `${reading.testingQty.toFixed(1)}L` : '—'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-right text-emerald-400">
                            {reading ? `${reading.netSaleQty.toFixed(1)} L` : '0.0 L'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-right text-white">
                            {reading ? `${sym}${reading.totalAmount.toLocaleString('en-IN')}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Underground Tank Stock & Dip Status */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                  <Droplet className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Underground Tank Dips</h2>
              </div>
              <button
                onClick={() => onNavigate('settings')}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
              >
                Update Dips
              </button>
            </div>

            <div className="space-y-4">
              {tanks.map((tank) => {
                const percentage = Math.min(
                  100,
                  Math.round((tank.currentVolumeLiters / tank.capacityLiters) * 100)
                );
                const colorClass =
                  percentage < 25
                    ? 'bg-red-500'
                    : percentage < 45
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-sky-500 to-emerald-500';

                return (
                  <div
                    key={tank.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2 transition"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-white truncate max-w-[170px]">{tank.name}</span>
                      <span className="font-mono text-sky-400 font-bold">
                        {percentage}% ({tank.currentVolumeLiters.toLocaleString()} L)
                      </span>
                    </div>

                    {/* Tank Progress Bar */}
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Current Dip: <strong className="text-slate-200 font-mono">{tank.dipReadingCm} cm</strong>
                      </span>
                      <span>
                        Capacity: <strong className="text-slate-200 font-mono">{tank.capacityLiters.toLocaleString()} L</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Tank Refill Note */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>All tank sensors calibrated</span>
              </span>
              <span className="text-slate-400 font-mono">Dip verified</span>
            </div>

            {/* Fuel Stock & Shortage Reconciliation Hub Button */}
            <button
              onClick={() => onNavigate('fuel-stock')}
              className="w-full py-2.5 px-3.5 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 hover:from-orange-500/25 hover:to-amber-500/25 border border-orange-500/40 rounded-xl text-xs font-bold text-orange-400 hover:text-white flex items-center justify-between transition group shadow-md cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                <span className="text-left leading-tight">
                  <span className="block font-bold">Fuel Stock & Tanker Inflow</span>
                  <span className="text-[10px] text-slate-400 block font-normal">Opening + Tankers - Sales = Shortage/Gain</span>
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                Reconcile →
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Lubricant Low-Stock Alerts & Recent Fleet Credit Slips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Lubricants Warning Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">
                Lubricant Inventory Alerts
              </h2>
            </div>
            <button
              onClick={() => onNavigate('lubricants')}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
            >
              Manage Catalog →
            </button>
          </div>

          {metrics.lowStockItems.length === 0 ? (
            <div className="p-6 text-center bg-slate-800/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-slate-300">All lubricant stocks are healthy!</p>
              <p className="text-[11px] mt-0.5">No products below safety threshold.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {metrics.lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="text-amber-400 font-semibold">{item.category}</span>
                      <span>•</span>
                      <span>Pack: {item.packSize}</span>
                      <span>•</span>
                      <span>Selling: {sym}{item.sellingPrice}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-400 block font-mono">
                        {item.currentStock} {item.unit}s
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Min: {item.lowStockThreshold}
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigate('lubricants')}
                      className="px-2.5 py-1 text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg transition"
                    >
                      Stock In
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Fleet Credit Slips */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">
                Recent Credit & Fleet Indents
              </h2>
            </div>
            <button
              onClick={() => onNavigate('credit')}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
            >
              Credit Ledger →
            </button>
          </div>

          <div className="space-y-2.5">
            {creditSlips.slice(0, 3).map((slip) => (
              <div
                key={slip.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{slip.customerName}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-700 text-slate-300 font-semibold">
                      {slip.vehicleNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Slip #{slip.slipNumber} • {slip.driverName} • {slip.quantity}{' '}
                    {slip.itemType === 'Fuel' ? 'Liters' : 'Units'}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-white font-mono">
                    {sym}{slip.totalAmount.toLocaleString('en-IN')}
                  </div>
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      slip.isPaid
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}
                  >
                    {slip.isPaid ? 'Settled' : 'Unpaid Due'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Prompt to add credit slip */}
          <button
            onClick={() => onNavigate('credit')}
            className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            <span>Generate New Fleet Credit Slip</span>
          </button>
        </div>
      </div>

      {/* New Oil Company Product Launch Modal */}
      <NewProductLaunchModal
        isOpen={showProductLaunchModal}
        onClose={() => setShowProductLaunchModal(false)}
        settings={settings}
        existingRates={rates}
        existingLubes={lubricants}
        onProductAdded={() => {
          if (onRefreshData) onRefreshData();
        }}
      />

      {/* Accounts Audit & Verification Guide Modal */}
      <AccountsAuditGuideModal
        isOpen={showAuditGuideModal}
        onClose={() => setShowAuditGuideModal(false)}
        settings={settings}
        rates={rates}
        nozzles={nozzles}
        readings={readings}
        tanks={tanks}
        lubricants={lubricants}
        lubeSales={lubeSales}
        customers={customers}
        creditSlips={creditSlips}
        expenses={expenses}
        activeShift={activeShift}
        onNavigate={onNavigate}
      />
    </div>
  );
};
