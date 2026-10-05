import React, { useState, useMemo } from 'react';
import {
  Fuel,
  Droplet,
  Truck,
  Plus,
  Scale,
  Save,
  DollarSign,
  Package,
  ArrowRight,
  ShieldCheck,
  Lock,
  Check,
  X,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import {
  PumpSettings,
  FuelRate,
  Nozzle,
  TankStock,
  NozzleReading,
  LubricantProduct,
  LubricantSale,
  CustomerCreditAccount,
  CreditIndentSlip,
  ExpenseRecord,
  TankerReceipt,
  DailyFuelStockReconciliation,
} from '../types';
import { storage, getTodayDateString } from '../services/storage';

interface StaffPanelProps {
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
  onRefreshData: () => void;
  onSwitchToOwner: () => void;
  onNavigate: (tab: string) => void;
  onPrintReadingSlip?: (reading: NozzleReading, nozzle: Nozzle) => void;
}

export const StaffPanel: React.FC<StaffPanelProps> = ({
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
  onRefreshData,
  onSwitchToOwner,
  onNavigate,
  onPrintReadingSlip,
}) => {
  const sym = settings.currencySymbol;
  const todayStr = getTodayDateString();

  // Active sub-view within staff panel
  const [activeView, setActiveView] = useState<'stock' | 'meters' | 'tanker' | 'lubes' | 'shift'>('stock');

  // Selected tank for stock reconciliation
  const [selectedTankId, setSelectedTankId] = useState<string>(tanks[0]?.id || '');
  const activeTank = tanks.find((t) => t.id === selectedTankId) || tanks[0];

  // Stock Reconciliation Entry Form State
  const [customOpening, setCustomOpening] = useState<string>('');
  const [actualDipCm, setActualDipCm] = useState<string>('');
  const [actualClosingLiters, setActualClosingLiters] = useState<string>('');
  const [stockNotes, setStockNotes] = useState<string>('');
  const [stockSavedSuccess, setStockSavedSuccess] = useState<boolean>(false);

  // Meter Reading Entry Modal State
  const [showReadingModal, setShowReadingModal] = useState<boolean>(false);
  const [selectedNozzleId, setSelectedNozzleId] = useState<string>(nozzles[0]?.id || '');
  const [closingReadingInput, setClosingReadingInput] = useState<string>('');
  const [testingQtyInput, setTestingQtyInput] = useState<string>('0');
  const [readingFeedback, setReadingFeedback] = useState<string | null>(null);

  // Tanker Receipt Entry Modal State
  const [showTankerModal, setShowTankerModal] = useState<boolean>(false);
  const [tankerForm, setTankerForm] = useState({
    tankerNo: '',
    invoiceNo: '',
    supplier: 'IOCL Betkuchi Terminal',
    fuelType: activeTank ? activeTank.fuelType : 'petrol',
    tankId: activeTank ? activeTank.id : (tanks[0]?.id || ''),
    invoiceQuantityLiters: '',
    actualReceivedLiters: '',
    densityObserved: '745.2',
    temperature: '26.5',
    dipBeforeCm: '',
    dipAfterCm: '',
    driverName: '',
    remarks: 'Seal verified & decanted successfully',
  });
  const [tankerSuccess, setTankerSuccess] = useState<boolean>(false);

  // Quick Lubricant Sale State
  const [selectedLubeId, setSelectedLubeId] = useState<string>(lubricants[0]?.id || '');
  const [lubeQuantity, setLubeQuantity] = useState<number>(1);
  const [lubePaymentMode, setLubePaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Credit'>('Cash');
  const [lubeSuccess, setLubeSuccess] = useState<boolean>(false);

  // Auto-calculated Stock Reconciliation for the selected tank
  const reconData = useMemo(() => {
    if (!activeTank) return null;

    const opNum = customOpening !== '' ? parseFloat(customOpening) : undefined;
    const clNum = actualClosingLiters !== '' ? parseFloat(actualClosingLiters) : undefined;
    const dipNum = actualDipCm !== '' ? parseFloat(actualDipCm) : undefined;

    return storage.calculateStockReconciliation(activeTank.id, todayStr, opNum, clNum, dipNum);
  }, [activeTank, todayStr, customOpening, actualClosingLiters, actualDipCm, readings, tanks]);

  // Current Fuel Rate for the active tank
  const activeFuelRate = useMemo(() => {
    if (!activeTank) return 95;
    const r = rates.find((rate) => rate.type === activeTank.fuelType);
    return r ? r.ratePerLiter : 95;
  }, [activeTank, rates]);

  // Helper to get latest nozzle reading for opening meter
  const getNozzleOpeningReading = (nozzleId: string): number => {
    const nozzleReadings = readings.filter((r) => r.nozzleId === nozzleId);
    if (nozzleReadings.length > 0) {
      return nozzleReadings[nozzleReadings.length - 1].closingReading;
    }
    return 12450.0;
  };

  // Today's total sales & shift collections
  const shiftMetrics = useMemo(() => {
    const todayReadings = readings.filter((r) => r.date === todayStr);
    const fuelSalesAmount = todayReadings.reduce((sum, r) => sum + r.totalAmount, 0);
    const fuelSalesLiters = todayReadings.reduce((sum, r) => sum + r.netSaleQty, 0);

    const todayLubeSales = lubeSales.filter((s) => s.date === todayStr);
    const lubeSalesAmount = todayLubeSales.reduce((sum, s) => sum + s.totalAmount, 0);

    const todayCredits = creditSlips.filter((s) => s.date === todayStr);
    const creditSalesAmount = todayCredits.reduce((sum, s) => sum + s.totalAmount, 0);

    const todayExpenses = expenses.filter((e) => e.date === todayStr);
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    const netCashUpiExpected = fuelSalesAmount + lubeSalesAmount - creditSalesAmount - totalExpenses;

    return {
      fuelSalesAmount,
      fuelSalesLiters,
      lubeSalesAmount,
      creditSalesAmount,
      totalExpenses,
      netCashUpiExpected,
      totalSalesAmount: fuelSalesAmount + lubeSalesAmount,
    };
  }, [readings, lubeSales, creditSlips, expenses, todayStr]);

  // Handle Save Stock Reconciliation
  const handleSaveStockReconciliation = () => {
    if (!reconData || !activeTank) return;

    const op = customOpening !== '' ? parseFloat(customOpening) : reconData.openingStockLiters;
    const cl = actualClosingLiters !== '' ? parseFloat(actualClosingLiters) : reconData.actualClosingLiters;
    const dip = actualDipCm !== '' ? parseFloat(actualDipCm) : reconData.actualDipReadingCm;

    storage.addStockReconciliation({
      date: todayStr,
      tankId: activeTank.id,
      tankName: activeTank.name,
      fuelType: activeTank.fuelType,
      openingStockLiters: op,
      stockReceivedLiters: reconData.stockReceivedLiters,
      totalAvailableLiters: op + reconData.stockReceivedLiters,
      meteredSalesLiters: reconData.meteredSalesLiters,
      testingQuantityLiters: reconData.testingQuantityLiters,
      netSalesLiters: reconData.netSalesLiters,
      expectedClosingLiters: reconData.expectedClosingLiters,
      actualClosingLiters: cl,
      actualDipReadingCm: dip,
      varianceLiters: reconData.varianceLiters,
      status: reconData.status,
      shortageLiters: reconData.shortageLiters,
      gainLiters: reconData.gainLiters,
      tolerancePercentage: reconData.tolerancePercentage,
      toleranceLiters: reconData.toleranceLiters,
      withinTolerance: reconData.withinTolerance,
      financialImpact: reconData.financialImpact,
      recordedBy: 'Shift Staff Operator',
      remarks: stockNotes || 'Recorded from Staff Quick Panel',
    });

    setStockSavedSuccess(true);
    setTimeout(() => setStockSavedSuccess(false), 3500);
    onRefreshData();
  };

  // Handle Save Meter Reading
  const handleSaveReading = () => {
    const nozzle = nozzles.find((n) => n.id === selectedNozzleId);
    if (!nozzle) return;

    const opening = getNozzleOpeningReading(nozzle.id);
    const closing = parseFloat(closingReadingInput);
    if (isNaN(closing) || closing < opening) {
      setReadingFeedback(`Closing meter must be greater than opening reading (${opening.toFixed(2)})`);
      return;
    }

    const testing = parseFloat(testingQtyInput) || 0;
    const totalQty = closing - opening;
    const netQty = Math.max(0, totalQty - testing);
    const rate = rates.find((r) => r.type === nozzle.fuelType)?.ratePerLiter || 95;
    const saleAmount = netQty * rate;

    // Shift safe typing
    const validShift =
      activeShift === 'Shift 2 (Evening)'
        ? 'Shift 2 (Evening)'
        : activeShift === 'Shift 3 (Night)'
        ? 'Shift 3 (Night)'
        : activeShift === 'General Full Day'
        ? 'General Full Day'
        : 'Shift 1 (Morning)';

    const newReading: NozzleReading = {
      id: `reading-${Date.now()}`,
      date: todayStr,
      shift: validShift,
      nozzleId: nozzle.id,
      openingReading: opening,
      closingReading: closing,
      testingQty: testing,
      netSaleQty: netQty,
      rate,
      totalAmount: saleAmount,
      recordedBy: 'Staff Attendant',
      timestamp: Date.now(),
    };

    storage.addReading(newReading);
    setReadingFeedback(`✅ ${nozzle.name} saved: ${netQty.toFixed(2)} L (₹${saleAmount.toFixed(2)})`);
    setClosingReadingInput('');
    setTestingQtyInput('0');
    onRefreshData();

    if (onPrintReadingSlip) {
      onPrintReadingSlip(newReading, nozzle);
    }

    setTimeout(() => {
      setReadingFeedback(null);
      setShowReadingModal(false);
    }, 1800);
  };

  // Handle Save Tanker Receipt
  const handleSaveTanker = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = parseFloat(tankerForm.invoiceQuantityLiters);
    const rec = parseFloat(tankerForm.actualReceivedLiters);

    if (isNaN(inv) || inv <= 0 || isNaN(rec) || rec <= 0) {
      alert('Please enter valid invoice and received liters.');
      return;
    }

    const variance = Number((rec - inv).toFixed(2));

    storage.addTankerReceipt({
      date: todayStr,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      tankerNo: tankerForm.tankerNo.toUpperCase(),
      invoiceNo: tankerForm.invoiceNo,
      supplier: tankerForm.supplier,
      fuelType: tankerForm.fuelType,
      tankId: tankerForm.tankId,
      invoiceQuantityLiters: inv,
      actualReceivedLiters: rec,
      shortageGainLiters: variance,
      densityObserved: parseFloat(tankerForm.densityObserved) || 745,
      temperature: parseFloat(tankerForm.temperature) || 27,
      dipBeforeCm: parseFloat(tankerForm.dipBeforeCm) || 0,
      dipAfterCm: parseFloat(tankerForm.dipAfterCm) || 0,
      driverName: tankerForm.driverName || 'Driver',
      remarks: tankerForm.remarks,
    });

    setTankerSuccess(true);
    onRefreshData();
    setTimeout(() => {
      setTankerSuccess(false);
      setShowTankerModal(false);
      setTankerForm({
        ...tankerForm,
        tankerNo: '',
        invoiceNo: '',
        invoiceQuantityLiters: '',
        actualReceivedLiters: '',
        dipBeforeCm: '',
        dipAfterCm: '',
      });
    }, 1800);
  };

  // Handle Save Quick Lube Sale
  const handleQuickLubeSale = () => {
    const lube = lubricants.find((l) => l.id === selectedLubeId);
    if (!lube || lube.currentStock < lubeQuantity) {
      alert('Insufficient stock for this lubricant.');
      return;
    }

    const total = lube.sellingPrice * lubeQuantity;
    storage.addLubeSale({
      id: `lube-sale-${Date.now()}`,
      date: todayStr,
      shift: activeShift,
      productId: lube.id,
      productName: lube.name,
      packSize: lube.packSize,
      quantity: lubeQuantity,
      unitPrice: lube.sellingPrice,
      totalAmount: total,
      paymentMode: lubePaymentMode,
      customerName: 'Counter Customer',
      vehicleNo: '',
      invoiceNo: `LUB-${Date.now().toString().slice(-6)}`,
      timestamp: Date.now(),
    });

    setLubeSuccess(true);
    onRefreshData();
    setTimeout(() => {
      setLubeSuccess(false);
      setLubeQuantity(1);
    }, 1500);
  };

  return (
    <div className="space-y-3 sm:space-y-4 pb-20">
      {/* Top Banner: Mode Indicator & Touch Switcher (Compact & Mobile-Optimized) */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-orange-500/15 border border-amber-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-base sm:text-xl shadow-inner shrink-0">
            ⚡
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                Staff Mode
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 truncate">{activeShift}</span>
            </div>
            <h1 className="text-sm sm:text-lg font-black text-white truncate mt-0.5">
              Daily Fuel & Meter Entry
            </h1>
          </div>
        </div>

        {/* Switch to Owner Panel Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onSwitchToOwner}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition shadow-md cursor-pointer"
            title="Switch to Owner Dashboard (Requires Security PIN / পাছৱৰ্ড প্ৰয়োজন)"
          >
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="hidden sm:inline">Owner Dashboard (পাছৱৰ্ড সুৰক্ষিত)</span>
            <span className="sm:hidden">Owner (PIN)</span>
          </button>
        </div>
      </div>

      {/* Touch-Friendly Action Navigation Bar (Horizontal Scroll on Mobile to Save Screen Space) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setActiveView('stock')}
          className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border flex items-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer text-xs font-bold ${
            activeView === 'stock'
              ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-md shadow-orange-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Fuel Reconciliation</span>
        </button>

        <button
          onClick={() => setActiveView('meters')}
          className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border flex items-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer text-xs font-bold ${
            activeView === 'meters'
              ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-md shadow-orange-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>Meter Readings</span>
        </button>

        <button
          onClick={() => setActiveView('tanker')}
          className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border flex items-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer text-xs font-bold ${
            activeView === 'tanker'
              ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-md shadow-orange-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Tanker Decantation</span>
        </button>

        <button
          onClick={() => setActiveView('lubes')}
          className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border flex items-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer text-xs font-bold ${
            activeView === 'lubes'
              ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-md shadow-orange-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Quick Lube Sale</span>
        </button>

        <button
          onClick={() => setActiveView('shift')}
          className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border flex items-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer text-xs font-bold ${
            activeView === 'shift'
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Shift Handover</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: FUEL STOCK RECONCILIATION & SHORTAGE / GAIN (MAIN REQUIREMENT) */}
      {/* ========================================================================= */}
      {activeView === 'stock' && (
        <div className="space-y-4">
          {/* Tank Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {tanks.map((tank) => (
              <button
                key={tank.id}
                onClick={() => {
                  setSelectedTankId(tank.id);
                  setCustomOpening('');
                  setActualClosingLiters('');
                  setActualDipCm('');
                }}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTank?.id === tank.id
                    ? 'bg-orange-500 text-white border-orange-600 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Droplet className={`w-3.5 h-3.5 ${tank.fuelType.includes('petrol') ? 'text-amber-300' : 'text-sky-300'}`} />
                <span>{tank.name}</span>
                <span className="text-[10px] opacity-80">({tank.fuelType})</span>
              </button>
            ))}
          </div>

          {reconData && activeTank && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-orange-400" />
                    <span>Daily Stock Calculation — {activeTank.name}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Date: <span className="font-mono text-white">{todayStr}</span> • Rate: <span className="text-orange-400 font-bold">{sym}{activeFuelRate}/L</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTankerModal(true)}
                    className="flex items-center gap-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>+ Log Tanker Delivery</span>
                  </button>
                </div>
              </div>

              {/* The 6 Core Fuel Stock Reconciliation Steps (2-Column on Mobile so user sees all together) */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {/* 1. Opening Stock */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-semibold mb-1">
                    <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] sm:text-[10px] text-orange-400 font-bold shrink-0">1</span>
                      <span className="truncate">Opening Stock</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 shrink-0">Start</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="text-lg sm:text-2xl font-black text-white font-mono truncate">
                      {reconData.openingStockLiters.toLocaleString()}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-semibold ml-1">L</span>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-900 flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="Edit (L)"
                      value={customOpening}
                      onChange={(e) => setCustomOpening(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] sm:text-[11px] text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* 2. Stock Received via Tanker */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-semibold mb-1">
                    <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] sm:text-[10px] text-sky-400 font-bold shrink-0">2</span>
                      <span className="truncate">Stock Received</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-sky-400 shrink-0">Tanker</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="text-lg sm:text-2xl font-black text-sky-400 font-mono truncate">
                      +{reconData.stockReceivedLiters.toLocaleString()}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-semibold ml-1">L</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-900 truncate">
                    {reconData.stockReceivedLiters > 0 ? 'Tanker decanted' : 'No tanker today'}
                  </p>
                </div>

                {/* 3. Total Available Stock (Opening + Received) */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between bg-gradient-to-br from-slate-950 to-slate-900">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-semibold mb-1">
                    <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] sm:text-[10px] text-amber-400 font-bold shrink-0">3</span>
                      <span className="truncate">Available Stock</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 shrink-0">(1+2)</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="text-lg sm:text-2xl font-black text-amber-400 font-mono truncate">
                      {reconData.totalAvailableLiters.toLocaleString()}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-semibold ml-1">L</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-900 truncate">
                    Cap: {activeTank.capacityLiters.toLocaleString()} L
                  </p>
                </div>

                {/* 4. Metered Sales */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-semibold mb-1">
                    <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] sm:text-[10px] text-red-400 font-bold shrink-0">4</span>
                      <span className="truncate">Metered Sales</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 shrink-0">Nozzles</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="text-lg sm:text-2xl font-black text-red-400 font-mono truncate">
                      -{reconData.netSalesLiters.toLocaleString()}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-semibold ml-1">L</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-900 truncate">
                    Test: {reconData.testingQuantityLiters} L
                  </p>
                </div>

                {/* 5. Expected Closing Stock */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 font-semibold mb-1">
                    <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] sm:text-[10px] text-purple-400 font-bold shrink-0">5</span>
                      <span className="truncate">Expected Closing</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 shrink-0">(3-4)</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="text-lg sm:text-2xl font-black text-purple-300 font-mono truncate">
                      {reconData.expectedClosingLiters.toLocaleString()}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-semibold ml-1">L</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-900 truncate">
                    Book stock
                  </p>
                </div>

                {/* 6. Actual Physical Closing Stock (Input) */}
                <div className="bg-slate-950/70 border-2 border-orange-500/40 rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between bg-orange-500/5">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-orange-400 font-bold mb-1">
                    <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-orange-500 flex items-center justify-center text-[9px] sm:text-[10px] text-slate-950 font-bold shrink-0">6</span>
                      <span className="truncate">Actual Dip Stock</span>
                    </span>
                    <span className="text-[9px] bg-orange-500/20 px-1 py-0.2 rounded text-orange-400 shrink-0">Dip Rod</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="text-lg sm:text-2xl font-black text-white font-mono truncate">
                      {reconData.actualClosingLiters.toLocaleString()}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-semibold ml-1">L</span>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800 grid grid-cols-2 gap-1">
                    <input
                      type="number"
                      placeholder="Dip cm"
                      value={actualDipCm}
                      onChange={(e) => {
                        setActualDipCm(e.target.value);
                        if (e.target.value) {
                          const cm = parseFloat(e.target.value);
                          const approxLiters = Math.round(activeTank.capacityLiters * (cm / 260));
                          setActualClosingLiters(String(approxLiters));
                        }
                      }}
                      className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] sm:text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="number"
                      placeholder="Liters"
                      value={actualClosingLiters}
                      onChange={(e) => setActualClosingLiters(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] sm:text-xs text-white focus:outline-none focus:border-orange-500 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Step 7: Automated Shortage / Gain Result Banner */}
              <div
                className={`rounded-2xl p-4 sm:p-5 border shadow-xl transition-all ${
                  reconData.status === 'Shortage'
                    ? 'bg-red-500/10 border-red-500/40 text-red-200'
                    : reconData.status === 'Gain'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                    : 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        reconData.status === 'Shortage'
                          ? 'bg-red-500/20 text-red-400'
                          : reconData.status === 'Gain'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {reconData.status === 'Shortage' ? (
                        <TrendingDown className="w-6 h-6" />
                      ) : reconData.status === 'Gain' ? (
                        <TrendingUp className="w-6 h-6" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${
                            reconData.status === 'Shortage'
                              ? 'bg-red-500 text-white'
                              : reconData.status === 'Gain'
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          {reconData.status === 'Shortage'
                            ? '⚠️ Shortage Detected'
                            : reconData.status === 'Gain'
                            ? '📈 Gain / Surplus'
                            : '✅ Balanced Stock'}
                        </span>
                        <span className="text-xs opacity-75">
                          {reconData.withinTolerance ? 'Within Operating Tolerance' : 'Exceeds Normal Loss Limit'}
                        </span>
                      </div>

                      <div className="text-lg sm:text-2xl font-black mt-1 font-mono">
                        {reconData.status === 'Shortage' ? (
                          <span>
                            {reconData.shortageLiters.toFixed(2)} Liters SHORTAGE{' '}
                            <span className="text-sm font-sans font-normal opacity-85">
                              (Loss Value: {sym}{Math.abs(reconData.financialImpact).toLocaleString()})
                            </span>
                          </span>
                        ) : reconData.status === 'Gain' ? (
                          <span>
                            +{reconData.gainLiters.toFixed(2)} Liters GAIN{' '}
                            <span className="text-sm font-sans font-normal opacity-85">
                              (Surplus Value: +{sym}{Math.abs(reconData.financialImpact).toLocaleString()})
                            </span>
                          </span>
                        ) : (
                          <span>0.00 Liters (Balanced)</span>
                        )}
                      </div>

                      <p className="text-xs opacity-80 mt-1">
                        Formula: Expected ({reconData.expectedClosingLiters.toFixed(2)} L) − Actual ({reconData.actualClosingLiters.toFixed(2)} L) = Variance {reconData.varianceLiters > 0 ? `+${reconData.varianceLiters.toFixed(2)}` : `${reconData.varianceLiters.toFixed(2)}`} L
                      </p>
                    </div>
                  </div>

                  {/* Save Daily Reconciliation Button */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={handleSaveStockReconciliation}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{stockSavedSuccess ? 'Saved & Synced!' : "Save Today's Stock"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: RAPID METER READINGS ENTRY */}
      {/* ========================================================================= */}
      {activeView === 'meters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Fuel className="w-5 h-5 text-orange-400" />
              <span>Attendant Rapid Meter Readings</span>
            </h2>
            <span className="text-xs text-slate-400">Shift: {activeShift}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nozzles.map((nozzle) => {
              const rate = rates.find((r) => r.type === nozzle.fuelType)?.ratePerLiter || 95;
              const isPetrol = nozzle.fuelType.includes('petrol');
              const currentReading = getNozzleOpeningReading(nozzle.id);

              return (
                <div
                  key={nozzle.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-white text-base flex items-center gap-2">
                        <span
                          className={`w-3 h-3 rounded-full ${
                            isPetrol ? 'bg-amber-400' : 'bg-sky-400'
                          }`}
                        />
                        {nozzle.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPetrol
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-sky-500/20 text-sky-400'
                        }`}
                      >
                        {nozzle.fuelType}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-3">
                      <div className="text-[11px] text-slate-400 font-semibold">Opening Meter:</div>
                      <div className="text-xl font-black text-white font-mono">
                        {currentReading.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Rate: {sym}{rate}/L
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedNozzleId(nozzle.id);
                      setClosingReadingInput('');
                      setTestingQtyInput('0');
                      setReadingFeedback(null);
                      setShowReadingModal(true);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <span>Record Closing Meter</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: TANKER RECEIPT & DECANTATION */}
      {/* ========================================================================= */}
      {activeView === 'tanker' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-400" />
                <span>Tanker (TT) Decantation Logging</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Record tanker invoice liters vs actual dip received to auto-detect transit loss.
              </p>
            </div>
            <button
              onClick={() => setShowTankerModal(true)}
              className="bg-sky-500 hover:bg-sky-600 active:scale-95 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Log Tanker Arrival</span>
            </button>
          </div>

          {/* Today's Tanker Receipts List */}
          {storage.getTankerReceipts().length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No tanker deliveries recorded yet. Tap "+ Log Tanker Arrival" above to record TT delivery.
            </div>
          ) : (
            <div className="space-y-3">
              {storage.getTankerReceipts().map((tr) => (
                <div
                  key={tr.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                      TT
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{tr.tankerNo}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {tr.fuelType}
                        </span>
                        <span className="text-[10px] text-slate-400">Inv: #{tr.invoiceNo}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Supplier: {tr.supplier} • {tr.date} {tr.time}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-slate-500">Invoice:</div>
                      <div className="font-bold text-white">{tr.invoiceQuantityLiters.toLocaleString()} L</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Received:</div>
                      <div className="font-bold text-sky-400">{tr.actualReceivedLiters.toLocaleString()} L</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Transit Variance:</div>
                      <div
                        className={`font-bold ${
                          tr.shortageGainLiters < 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {tr.shortageGainLiters > 0 ? `+${tr.shortageGainLiters}` : tr.shortageGainLiters} L
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: RAPID LUBRICANT SALE */}
      {/* ========================================================================= */}
      {activeView === 'lubes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              <span>Counter Lubricant Quick Sale</span>
            </h2>
            <p className="text-xs text-slate-400">
              One-tap cash or UPI billing for engine oil cans and additives.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {lubricants.map((lube) => (
              <button
                key={lube.id}
                onClick={() => setSelectedLubeId(lube.id)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  selectedLubeId === lube.id
                    ? 'bg-amber-500/20 border-amber-500 shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white truncate">{lube.name}</div>
                  <div className="text-[10px] text-slate-400">{lube.brand} • {lube.packSize}</div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-amber-400 font-bold text-sm">{sym}{lube.sellingPrice}</span>
                  <span className="text-[10px] text-slate-500">Stock: {lube.currentStock}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Sale Checkout Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300">Quantity:</span>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setLubeQuantity(Math.max(1, lubeQuantity - 1))}
                  className="w-8 h-8 rounded bg-slate-800 text-white font-bold flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center font-bold text-white text-sm">{lubeQuantity}</span>
                <button
                  onClick={() => setLubeQuantity(lubeQuantity + 1)}
                  className="w-8 h-8 rounded bg-slate-800 text-white font-bold flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Payment Mode */}
              <div className="flex items-center gap-1.5 ml-2">
                {(['Cash', 'UPI', 'Card', 'Credit'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setLubePaymentMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      lubePaymentMode === mode
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleQuickLubeSale}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {lubeSuccess
                  ? 'Sale Logged!'
                  : `Record Sale • ${sym}${
                      (lubricants.find((l) => l.id === selectedLubeId)?.sellingPrice || 0) * lubeQuantity
                    }`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: SHIFT CASH HANDOVER */}
      {/* ========================================================================= */}
      {activeView === 'shift' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Shift Cash Handover Tally</span>
              </h2>
              <p className="text-xs text-slate-400">
                Summary for {activeShift} on {todayStr}. Hand over this amount to pump manager/owner.
              </p>
            </div>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
              Shift Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Total Fuel Sales</span>
              <div className="text-xl font-black text-white mt-1">
                {sym}{shiftMetrics.fuelSalesAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">{shiftMetrics.fuelSalesLiters.toFixed(2)} Liters sold</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Lubricant Sales</span>
              <div className="text-xl font-black text-amber-400 mt-1">
                {sym}{shiftMetrics.lubeSalesAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Counter cans & oil</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Fleet Credit / Khata</span>
              <div className="text-xl font-black text-orange-400 mt-1">
                -{sym}{shiftMetrics.creditSalesAmount.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Credit indent slips</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/5">
              <span className="text-xs font-bold text-emerald-400">Net Expected Handover</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {sym}{shiftMetrics.netCashUpiExpected.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">Physical Cash + QR UPI</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RAPID METER READING ENTRY */}
      {/* ========================================================================= */}
      {showReadingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white text-base">Enter Closing Meter</h3>
              </div>
              <button
                onClick={() => setShowReadingModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Nozzle Info */}
            {(() => {
              const nozzle = nozzles.find((n) => n.id === selectedNozzleId);
              if (!nozzle) return null;
              const rate = rates.find((r) => r.type === nozzle.fuelType)?.ratePerLiter || 95;
              const opening = getNozzleOpeningReading(nozzle.id);
              const closing = parseFloat(closingReadingInput) || opening;
              const testing = parseFloat(testingQtyInput) || 0;
              const saleQty = Math.max(0, closing - opening - testing);
              const saleAmount = saleQty * rate;

              return (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-white">{nozzle.name}</div>
                      <div className="text-[10px] text-slate-400">{nozzle.fuelType} • Rate: {sym}{rate}/L</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-semibold">Opening Meter:</div>
                      <div className="text-base font-black text-white font-mono">{opening.toFixed(2)}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Closing Meter Reading (Liters):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      autoFocus
                      placeholder={`e.g. ${(opening + 150).toFixed(2)}`}
                      value={closingReadingInput}
                      onChange={(e) => setClosingReadingInput(e.target.value)}
                      className="w-full bg-slate-950 border-2 border-orange-500/60 rounded-xl px-4 py-3 text-xl font-mono font-bold text-white focus:outline-none focus:border-orange-500 shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Pump Testing Quantity (Liters):
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={testingQtyInput}
                      onChange={(e) => setTestingQtyInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-slate-700"
                    />
                  </div>

                  {/* Calculated Sale Preview */}
                  <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-orange-400">Net Sale Volume</div>
                      <div className="text-xl font-black text-white font-mono">{saleQty.toFixed(2)} L</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-amber-400">Sale Amount</div>
                      <div className="text-xl font-black text-amber-400 font-mono">{sym}{saleAmount.toFixed(2)}</div>
                    </div>
                  </div>

                  {readingFeedback && (
                    <div className="text-xs text-center font-bold text-orange-400 py-1">
                      {readingFeedback}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReadingModal(false)}
                      className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveReading}
                      className="py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-white font-bold rounded-xl text-xs shadow-lg transition"
                    >
                      Save Reading
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG TANKER ARRIVAL */}
      {/* ========================================================================= */}
      {showTankerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-white text-base">Log Tanker Delivery (TT Decantation)</h3>
              </div>
              <button
                onClick={() => setShowTankerModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTanker} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Tanker Vehicle No:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AS-01-EC-9921"
                    value={tankerForm.tankerNo}
                    onChange={(e) => setTankerForm({ ...tankerForm, tankerNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Invoice / Challan No:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-88219"
                    value={tankerForm.invoiceNo}
                    onChange={(e) => setTankerForm({ ...tankerForm, invoiceNo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Target Tank:</label>
                  <select
                    value={tankerForm.tankId}
                    onChange={(e) => {
                      const t = tanks.find((tk) => tk.id === e.target.value);
                      setTankerForm({
                        ...tankerForm,
                        tankId: e.target.value,
                        fuelType: t ? t.fuelType : tankerForm.fuelType,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {tanks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.fuelType})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-semibold mb-1">Supplier Terminal:</label>
                  <input
                    type="text"
                    value={tankerForm.supplier}
                    onChange={(e) => setTankerForm({ ...tankerForm, supplier: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs text-slate-300 font-bold mb-1">Invoice Quantity (L):</label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="e.g. 12000"
                    value={tankerForm.invoiceQuantityLiters}
                    onChange={(e) => setTankerForm({ ...tankerForm, invoiceQuantityLiters: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-sky-400 font-bold mb-1">Actual Received (Dip):</label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="e.g. 11960"
                    value={tankerForm.actualReceivedLiters}
                    onChange={(e) => setTankerForm({ ...tankerForm, actualReceivedLiters: e.target.value })}
                    className="w-full bg-slate-900 border-2 border-sky-500/60 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Transit Variance Calculation */}
              {tankerForm.invoiceQuantityLiters && tankerForm.actualReceivedLiters && (
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                  <span className="text-slate-400">Transit Difference:</span>
                  <span
                    className={`font-mono font-bold ${
                      parseFloat(tankerForm.actualReceivedLiters) - parseFloat(tankerForm.invoiceQuantityLiters) < 0
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {(parseFloat(tankerForm.actualReceivedLiters) - parseFloat(tankerForm.invoiceQuantityLiters)).toFixed(2)} L{' '}
                    {parseFloat(tankerForm.actualReceivedLiters) - parseFloat(tankerForm.invoiceQuantityLiters) < 0
                      ? '(Shortage)'
                      : '(Gain)'}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Density Observed:</label>
                  <input
                    type="text"
                    value={tankerForm.densityObserved}
                    onChange={(e) => setTankerForm({ ...tankerForm, densityObserved: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Temp (°C):</label>
                  <input
                    type="text"
                    value={tankerForm.temperature}
                    onChange={(e) => setTankerForm({ ...tankerForm, temperature: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Driver Name:</label>
                  <input
                    type="text"
                    placeholder="Driver"
                    value={tankerForm.driverName}
                    onChange={(e) => setTankerForm({ ...tankerForm, driverName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {tankerSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold text-center">
                  ✅ Tanker delivery successfully recorded and stock updated!
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTankerModal(false)}
                  className="py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  Confirm & Decant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
