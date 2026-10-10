import React, { useState, useMemo } from 'react';
import {
  Fuel,
  Droplet,
  Truck,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Scale,
  Layers,
  ArrowRight,
  Printer,
  FileText,
  Search,
  RefreshCw,
  X,
  Info,
  Thermometer,
  Compass,
  Check,
  Building2,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import {
  TankStock,
  FuelRate,
  Nozzle,
  NozzleReading,
  PumpSettings,
  TankerReceipt,
  DailyFuelStockReconciliation,
  DailyDensityRecord,
  DensityQualityStatus,
} from '../types';
import { storage, getTodayDateString } from '../services/storage';

interface FuelStockManagerProps {
  settings: PumpSettings;
  tanks: TankStock[];
  rates: FuelRate[];
  nozzles: Nozzle[];
  readings: NozzleReading[];
  onRefreshData: () => void;
}

export const FuelStockManager: React.FC<FuelStockManagerProps> = ({
  settings,
  tanks,
  rates,
  nozzles,
  readings,
  onRefreshData,
}) => {
  const sym = settings.currencySymbol;
  const todayStr = getTodayDateString();

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeSubTab, setActiveSubTab] = useState<'reconciliation' | 'tankers' | 'density' | 'analytics'>('reconciliation');
  const [selectedTankFilter, setSelectedTankFilter] = useState<string>('all');

  // Modals state
  const [showAddTankerModal, setShowAddTankerModal] = useState<boolean>(false);
  const [showAddReconModal, setShowAddReconModal] = useState<boolean>(false);
  const [editingTankId, setEditingTankId] = useState<string | null>(null);

  // Density Entry Form State
  const [densityDate, setDensityDate] = useState<string>(todayStr);
  const [densityShift, setDensityShift] = useState<string>('Shift 1 (Morning)');
  const [petrolObserved, setPetrolObserved] = useState<string>('743.0');
  const [petrolTemp, setPetrolTemp] = useState<string>('28.0');
  const [dieselObserved, setDieselObserved] = useState<string>('832.5');
  const [dieselTemp, setDieselTemp] = useState<string>('28.0');
  const [inspectorName, setInspectorName] = useState<string>('Manager / DSM On Duty');
  const [densityRemarks, setDensityRemarks] = useState<string>('Hydrometer & ASTM-53B thermometer check at 15°C.');
  const [densityFeedback, setDensityFeedback] = useState<string | null>(null);

  // Data from storage
  const tankerReceipts = storage.getTankerReceipts();
  const allReconciliations = storage.getStockReconciliations();
  const allDensityRecords = storage.getDailyDensityRecords();

  // Filtered by selected date
  const filteredReceipts = useMemo(() => {
    return tankerReceipts.filter(tr => tr.date === selectedDate);
  }, [tankerReceipts, selectedDate]);

  // Compute or get reconciliations for all tanks on selected date
  const dayReconciliations = useMemo(() => {
    return tanks.map(tank => {
      // Check if already saved in storage
      const saved = allReconciliations.find(r => r.tankId === tank.id && r.date === selectedDate);
      if (saved) return saved;

      // Otherwise compute dynamically using calculation logic
      return storage.calculateStockReconciliation(tank.id, selectedDate);
    });
  }, [tanks, allReconciliations, selectedDate, tankerReceipts, readings]);

  // Overall day totals
  const daySummary = useMemo(() => {
    let totalOpening = 0;
    let totalReceived = 0;
    let totalAvailable = 0;
    let totalSales = 0;
    let totalExpected = 0;
    let totalActual = 0;
    let totalVariance = 0;
    let totalFinancialImpact = 0;

    dayReconciliations.forEach(r => {
      totalOpening += r.openingStockLiters;
      totalReceived += r.stockReceivedLiters;
      totalAvailable += r.totalAvailableLiters;
      totalSales += r.netSalesLiters;
      totalExpected += r.expectedClosingLiters;
      totalActual += r.actualClosingLiters;
      totalVariance += r.varianceLiters;
      totalFinancialImpact += r.financialImpact;
    });

    const isShortage = totalVariance < 0;
    const isGain = totalVariance > 0;

    return {
      totalOpening: Math.round(totalOpening),
      totalReceived: Math.round(totalReceived),
      totalAvailable: Math.round(totalAvailable),
      totalSales: Number(totalSales.toFixed(1)),
      totalExpected: Number(totalExpected.toFixed(1)),
      totalActual: Math.round(totalActual),
      totalVariance: Number(totalVariance.toFixed(1)),
      totalFinancialImpact: Math.round(totalFinancialImpact),
      isShortage,
      isGain,
    };
  }, [dayReconciliations]);

  // Handle Tanker Receipt submission
  const handleSaveTankerReceipt = (receiptData: Omit<TankerReceipt, 'id' | 'timestamp'>) => {
    storage.addTankerReceipt(receiptData);
    setShowAddTankerModal(false);
    onRefreshData();
  };

  // Handle Reconciliation Record submission
  const handleSaveReconciliation = (recordData: Omit<DailyFuelStockReconciliation, 'id' | 'timestamp'>) => {
    storage.addStockReconciliation(recordData);
    setShowAddReconModal(false);
    setEditingTankId(null);
    onRefreshData();
  };

  // Quick inline update for Actual Physical Dip
  const handleQuickDipUpdate = (tankId: string, closingLiters: number, dipCm: number) => {
    const existing = dayReconciliations.find(r => r.tankId === tankId);
    if (!existing) return;

    const recalculated = storage.calculateStockReconciliation(
      tankId,
      selectedDate,
      existing.openingStockLiters,
      closingLiters,
      dipCm
    );

    storage.addStockReconciliation({
      ...recalculated,
      date: selectedDate,
    });
    onRefreshData();
  };

  // Official Standards & Live Verification Calculations
  const petrolStandardRef = settings.petrolStandardDensity || 742.0;
  const dieselStandardRef = settings.dieselStandardDensity || 832.0;

  const livePetrolObs = parseFloat(petrolObserved) || 0;
  const liveDieselObs = parseFloat(dieselObserved) || 0;
  const livePetrolVariance = Number((livePetrolObs - petrolStandardRef).toFixed(1));
  const liveDieselVariance = Number((liveDieselObs - dieselStandardRef).toFixed(1));

  const getDensityStatus = (variance: number): DensityQualityStatus => {
    const abs = Math.abs(variance);
    if (abs <= 1.5) return 'Normal';
    if (abs <= 3.0) return 'Warning';
    return 'Adulteration Alert';
  };

  const livePetrolStatus = getDensityStatus(livePetrolVariance);
  const liveDieselStatus = getDensityStatus(liveDieselVariance);

  const handleSaveDensityRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!livePetrolObs || !liveDieselObs) {
      alert('Please enter valid observed density readings for both Petrol and Diesel.');
      return;
    }

    storage.addDailyDensityRecord({
      date: densityDate,
      shift: densityShift,
      petrolDensityObserved: livePetrolObs,
      petrolOfficialDensity: petrolStandardRef,
      petrolTemperature: parseFloat(petrolTemp) || 28,
      petrolVariance: livePetrolVariance,
      petrolStatus: livePetrolStatus,
      dieselDensityObserved: liveDieselObs,
      dieselOfficialDensity: dieselStandardRef,
      dieselTemperature: parseFloat(dieselTemp) || 28,
      dieselVariance: liveDieselVariance,
      dieselStatus: liveDieselStatus,
      recordedBy: inspectorName.trim() || 'Duty DSM',
      remarks: densityRemarks.trim(),
    });

    setDensityFeedback('Daily Fuel Density Record verified and saved to database successfully!');
    setTimeout(() => setDensityFeedback(null), 4000);
    onRefreshData();
  };

  const handleDeleteDensityRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this density verification record?')) {
      storage.deleteDailyDensityRecord(id);
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Fuel Stock & Tanker Management</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ইন্ধন মজুত আৰু টেংকাৰ চালান
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Opening Stock + Tanker Inflow - Dispenser Sales = Expected vs Actual Dip Shortage/Gain Reconciliation
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Date Selector */}
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white">
              <Calendar className="w-4 h-4 text-orange-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold outline-hidden cursor-pointer"
              />
            </div>

            {/* Log Tanker Receipt Button */}
            <button
              onClick={() => setShowAddTankerModal(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>+ Log Tanker Delivery</span>
            </button>

            {/* Day End Reconciliation Button */}
            <button
              onClick={() => {
                setEditingTankId(tanks[0]?.id || null);
                setShowAddReconModal(true);
              }}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/30 active:scale-95 transition cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>+ Day-End Dip Audit</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 pt-6">
          {/* 1. Opening Stock */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Opening Stock (A)
            </span>
            <div className="text-base sm:text-lg font-black text-white mt-1">
              {daySummary.totalOpening.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">L</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Day start dip</span>
          </div>

          {/* 2. Stock Received */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
              2. Tanker Received (B)
            </span>
            <div className="text-base sm:text-lg font-black text-sky-300 mt-1 flex items-center gap-1">
              <span>+{daySummary.totalReceived.toLocaleString('en-IN')}</span>
              <span className="text-xs font-normal text-slate-400">L</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {filteredReceipts.length} Tanker decantations
            </span>
          </div>

          {/* 3. Total Available */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              3. Total Available (C)
            </span>
            <div className="text-base sm:text-lg font-black text-amber-300 mt-1">
              {daySummary.totalAvailable.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">L</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">A + B</span>
          </div>

          {/* 4. Metered Sales */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
              4. Metered Sales (D)
            </span>
            <div className="text-base sm:text-lg font-black text-orange-300 mt-1">
              -{daySummary.totalSales.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">L</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Dispenser throughput</span>
          </div>

          {/* 5. Actual Closing Stock */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
              5. Actual Closing (F)
            </span>
            <div className="text-base sm:text-lg font-black text-indigo-300 mt-1">
              {daySummary.totalActual.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">L</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Physical Dip Stock</span>
          </div>

          {/* 6. Shortage / Gain Calculation */}
          <div
            className={`border rounded-2xl p-3.5 ${
              daySummary.isShortage
                ? 'bg-rose-500/10 border-rose-500/30'
                : daySummary.isGain
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-slate-850/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block ${
                  daySummary.isShortage ? 'text-rose-400' : daySummary.isGain ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                6. Shortage / Gain (G)
              </span>
              {daySummary.isShortage ? (
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>

            <div
              className={`text-base sm:text-lg font-black mt-1 ${
                daySummary.isShortage ? 'text-rose-400' : daySummary.isGain ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {daySummary.totalVariance > 0 ? `+${daySummary.totalVariance}` : `${daySummary.totalVariance}`}{' '}
              <span className="text-xs font-normal">L</span>
            </div>

            <span
              className={`text-[10px] font-semibold mt-0.5 block truncate ${
                daySummary.isShortage ? 'text-rose-400/90' : daySummary.isGain ? 'text-emerald-400/90' : 'text-slate-500'
              }`}
            >
              {daySummary.isShortage
                ? `${Math.abs(daySummary.totalVariance)}L Short (${sym}${Math.abs(daySummary.totalFinancialImpact)})`
                : daySummary.isGain
                ? `${daySummary.totalVariance}L Gain (+${sym}${daySummary.totalFinancialImpact})`
                : 'Balanced'}
            </span>
          </div>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('reconciliation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'reconciliation'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Daily Stock Reconciliation (দৈনিক মজুত মিলোৱা)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('tankers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'tankers'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Tanker Delivery Receipts ({filteredReceipts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Shortage Analytics & Tolerance</span>
        </button>

        <button
          onClick={() => setActiveSubTab('density')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'density'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Droplet className="w-4 h-4 text-sky-400" />
          <span>Fuel Density Verification (ঘনত্ব পৰীক্ষণ & গুণমান)</span>
        </button>
      </div>

      {/* SUBTAB 1: DAILY STOCK RECONCILIATION */}
      {activeSubTab === 'reconciliation' && (
        <div className="space-y-6">
          {/* Tank-Wise Reconciliation Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {dayReconciliations.map(recon => {
              const tank = tanks.find(t => t.id === recon.tankId);
              const rate = rates.find(r => r.type === recon.fuelType);
              const isShort = recon.varianceLiters < 0;
              const isGain = recon.varianceLiters > 0;
              const pctOfCapacity = tank ? Math.round((recon.actualClosingLiters / tank.capacityLiters) * 100) : 50;

              return (
                <div
                  key={recon.tankId}
                  className={`bg-slate-900 border rounded-3xl p-5 shadow-xl transition hover:border-slate-700 flex flex-col justify-between ${
                    isShort
                      ? 'border-rose-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/20'
                      : isGain
                      ? 'border-emerald-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Tank Title & Fuel Badge */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Underground Tank
                        </span>
                        <h3 className="text-base font-bold text-white mt-0.5">{recon.tankName}</h3>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border"
                        style={{
                          backgroundColor: `${rate?.color || '#f97316'}20`,
                          color: rate?.color || '#f97316',
                          borderColor: `${rate?.color || '#f97316'}40`,
                        }}
                      >
                        {rate?.shortCode || recon.fuelType.toUpperCase()}
                      </span>
                    </div>

                    {/* Step-by-Step Calculation Formula Flow */}
                    <div className="space-y-2 py-4 text-xs">
                      {/* Step 1: Opening Stock */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-850/60 border border-slate-800">
                        <span className="text-slate-400 font-medium">1. Opening Stock (A)</span>
                        <span className="font-bold text-white font-mono">
                          {recon.openingStockLiters.toLocaleString('en-IN')} L
                        </span>
                      </div>

                      {/* Step 2: Tanker Delivery Received */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-sky-500/5 border border-sky-500/20">
                        <span className="text-sky-300 font-medium flex items-center gap-1">
                          <span>2. (+) Stock Received (B)</span>
                        </span>
                        <span className="font-bold text-sky-400 font-mono">
                          +{recon.stockReceivedLiters.toLocaleString('en-IN')} L
                        </span>
                      </div>

                      {/* Step 3: Total Available Stock */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <span className="text-amber-300 font-bold">3. (=) Total Available (A + B)</span>
                        <span className="font-extrabold text-amber-400 font-mono">
                          {recon.totalAvailableLiters.toLocaleString('en-IN')} L
                        </span>
                      </div>

                      {/* Step 4: Metered Dispenser Sales */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-orange-500/5 border border-orange-500/20">
                        <span className="text-orange-300 font-medium">4. (-) Metered Sales (D)</span>
                        <span className="font-bold text-orange-400 font-mono">
                          -{recon.netSalesLiters.toLocaleString('en-IN')} L
                        </span>
                      </div>

                      {/* Step 5: Expected Closing Stock */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700/80">
                        <span className="text-slate-300 font-semibold">5. Expected Closing (E = C - D)</span>
                        <span className="font-bold text-slate-200 font-mono">
                          {recon.expectedClosingLiters.toLocaleString('en-IN')} L
                        </span>
                      </div>

                      {/* Step 6: Actual Physical Measured Closing Stock */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                        <div>
                          <span className="text-indigo-300 font-bold block">6. Actual Physical Dip (F)</span>
                          <span className="text-[10px] text-slate-400">Stick: {recon.actualDipReadingCm} cm</span>
                        </div>
                        <span className="font-extrabold text-indigo-300 font-mono text-sm">
                          {recon.actualClosingLiters.toLocaleString('en-IN')} L
                        </span>
                      </div>
                    </div>

                    {/* Step 7: Variance / Shortage / Gain Banner */}
                    <div
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                        isShort
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                          : isGain
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isShort ? (
                          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                        ) : isGain ? (
                          <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        )}
                        <div>
                          <div className="font-black text-sm uppercase tracking-wide">
                            {isShort
                              ? `${recon.shortageLiters} Liters Shortage`
                              : isGain
                              ? `${recon.gainLiters} Liters Gain`
                              : 'Zero Discrepancy'}
                          </div>
                          <div className="text-[10px] opacity-90">
                            {isShort
                              ? `ঘাটতি লোকচান: ${sym}${Math.abs(recon.financialImpact)} (${recon.withinTolerance ? 'Within tolerance' : 'EXCEEDS TOLERANCE'})`
                              : isGain
                              ? `অতিৰিক্ত লাভ: +${sym}${recon.financialImpact}`
                              : 'Perfect physical reconciliation'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg ${
                          isShort ? 'bg-rose-950/80 text-rose-400' : 'bg-emerald-950/80 text-emerald-400'
                        }`}
                      >
                        {recon.varianceLiters > 0 ? `+${recon.varianceLiters}` : `${recon.varianceLiters}`} L
                      </span>
                    </div>

                    {/* Progress Bar of Tank Capacity */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Fill Level: {pctOfCapacity}%</span>
                        <span>Capacity: {tank?.capacityLiters.toLocaleString('en-IN')} L</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pctOfCapacity < 25
                              ? 'bg-rose-500'
                              : pctOfCapacity < 50
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, pctOfCapacity)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEditingTankId(recon.tankId);
                        setShowAddReconModal(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Scale className="w-3.5 h-3.5 text-orange-400" />
                      <span>Audit Physical Dip</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Fuel Stock Table View */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span>Daily Fuel Stock Reconciliation Statement ({selectedDate})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete day start, tanker delivery receipts, dispenser throughput, physical dip, and variance analysis
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  <Printer className="w-3.5 h-3.5 text-orange-400" />
                  <span>Print Statement</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto mt-4 -mx-5 sm:mx-0">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-850 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4">Tank & Product</th>
                    <th className="py-3 px-3 text-right">Opening (A)</th>
                    <th className="py-3 px-3 text-right text-sky-400">Received (B)</th>
                    <th className="py-3 px-3 text-right text-amber-400">Total Avail (C)</th>
                    <th className="py-3 px-3 text-right text-orange-400">Sales (D)</th>
                    <th className="py-3 px-3 text-right">Expected (E)</th>
                    <th className="py-3 px-3 text-right text-indigo-300">Actual Dip (F)</th>
                    <th className="py-3 px-3 text-right">Shortage / Gain (G)</th>
                    <th className="py-3 px-3 text-right">Financial Impact</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {dayReconciliations.map(recon => {
                    const isShort = recon.varianceLiters < 0;
                    const isGain = recon.varianceLiters > 0;

                    return (
                      <tr key={recon.tankId} className="hover:bg-slate-850/50 transition">
                        <td className="py-3.5 px-4 font-sans">
                          <div className="font-bold text-white text-xs">{recon.tankName}</div>
                          <div className="text-[10px] text-slate-400 uppercase">{recon.fuelType}</div>
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-300">
                          {recon.openingStockLiters.toLocaleString('en-IN')} L
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-sky-400">
                          +{recon.stockReceivedLiters.toLocaleString('en-IN')} L
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-amber-400">
                          {recon.totalAvailableLiters.toLocaleString('en-IN')} L
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-orange-400">
                          -{recon.netSalesLiters.toLocaleString('en-IN')} L
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-400">
                          {recon.expectedClosingLiters.toLocaleString('en-IN')} L
                        </td>
                        <td className="py-3.5 px-3 text-right font-black text-indigo-300">
                          {recon.actualClosingLiters.toLocaleString('en-IN')} L
                          <span className="block text-[10px] text-slate-500 font-sans">({recon.actualDipReadingCm} cm)</span>
                        </td>
                        <td
                          className={`py-3.5 px-3 text-right font-black ${
                            isShort ? 'text-rose-400' : isGain ? 'text-emerald-400' : 'text-slate-300'
                          }`}
                        >
                          {recon.varianceLiters > 0 ? `+${recon.varianceLiters}` : `${recon.varianceLiters}`} L
                        </td>
                        <td
                          className={`py-3.5 px-3 text-right font-bold ${
                            isShort ? 'text-rose-400' : isGain ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {recon.financialImpact < 0
                            ? `-${sym}${Math.abs(recon.financialImpact).toLocaleString('en-IN')}`
                            : `+${sym}${recon.financialImpact.toLocaleString('en-IN')}`}
                        </td>
                        <td className="py-3.5 px-4 text-center font-sans">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isShort
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : isGain
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isShort ? 'Shortage (ঘাটতি)' : isGain ? 'Gain (লাভ)' : 'Balanced'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Total Summary Row */}
                <tfoot className="border-t-2 border-slate-700 bg-slate-850/80 font-mono font-bold">
                  <tr>
                    <td className="py-3 px-4 font-sans text-xs text-white">Daily Total (সকলো টেংক)</td>
                    <td className="py-3 px-3 text-right text-slate-200">
                      {daySummary.totalOpening.toLocaleString('en-IN')} L
                    </td>
                    <td className="py-3 px-3 text-right text-sky-400">
                      +{daySummary.totalReceived.toLocaleString('en-IN')} L
                    </td>
                    <td className="py-3 px-3 text-right text-amber-400">
                      {daySummary.totalAvailable.toLocaleString('en-IN')} L
                    </td>
                    <td className="py-3 px-3 text-right text-orange-400">
                      -{daySummary.totalSales.toLocaleString('en-IN')} L
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {daySummary.totalExpected.toLocaleString('en-IN')} L
                    </td>
                    <td className="py-3 px-3 text-right text-indigo-300 font-black">
                      {daySummary.totalActual.toLocaleString('en-IN')} L
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-black ${
                        daySummary.isShortage ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {daySummary.totalVariance > 0 ? `+${daySummary.totalVariance}` : `${daySummary.totalVariance}`} L
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-black ${
                        daySummary.isShortage ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {daySummary.totalFinancialImpact < 0
                        ? `-${sym}${Math.abs(daySummary.totalFinancialImpact).toLocaleString('en-IN')}`
                        : `+${sym}${daySummary.totalFinancialImpact.toLocaleString('en-IN')}`}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="text-[10px] text-slate-400 font-semibold">Day Reconciliation</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: TANKER DELIVERY RECEIPTS */}
      {activeSubTab === 'tankers' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-sky-400" />
                  <span>Tanker Truck Deliveries & Decantation Log</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Log TT challan volume, density test at 15°C, temperature, pre/post discharge dip, and decantation loss
                </p>
              </div>

              <button
                onClick={() => setShowAddTankerModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Log New Tanker Delivery</span>
              </button>
            </div>

            {tankerReceipts.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Truck className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <h4 className="text-sm font-bold text-slate-300">No Tanker Receipts Recorded</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Log your first tanker arrival to automatically update tank stocks and track transit decantation shortage.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-4 -mx-5 sm:mx-0">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-850 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-3">Tanker & Invoice No</th>
                      <th className="py-3 px-3">Oil Terminal</th>
                      <th className="py-3 px-3">Target Tank</th>
                      <th className="py-3 px-3 text-right">Invoice Qty</th>
                      <th className="py-3 px-3 text-right text-emerald-400">Actual Received</th>
                      <th className="py-3 px-3 text-right">Transit Loss</th>
                      <th className="py-3 px-3">Quality (Density & Temp)</th>
                      <th className="py-3 px-3">Dip Height (Pre/Post)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {tankerReceipts.map(receipt => {
                      const tank = tanks.find(t => t.id === receipt.tankId);
                      const isShort = receipt.shortageGainLiters < 0;

                      return (
                        <tr key={receipt.id} className="hover:bg-slate-850/50 transition">
                          <td className="py-3.5 px-4 font-mono">
                            <span className="font-bold text-white block">{receipt.date}</span>
                            <span className="text-[10px] text-slate-400">{receipt.time}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-white font-mono block">{receipt.tankerNo}</span>
                            <span className="text-[10px] text-orange-400 font-mono">{receipt.invoiceNo}</span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-300">
                            <span>{receipt.supplier}</span>
                            <span className="block text-[10px] text-slate-400">Driver: {receipt.driverName || 'N/A'}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-white block">{tank?.name || receipt.tankId}</span>
                            <span className="text-[10px] text-slate-400 uppercase">{receipt.fuelType}</span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                            {receipt.invoiceQuantityLiters.toLocaleString('en-IN')} L
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400">
                            {receipt.actualReceivedLiters.toLocaleString('en-IN')} L
                          </td>
                          <td
                            className={`py-3.5 px-3 text-right font-mono font-bold ${
                              isShort ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {receipt.shortageGainLiters > 0
                              ? `+${receipt.shortageGainLiters}`
                              : `${receipt.shortageGainLiters}`}{' '}
                            L
                          </td>
                          <td className="py-3.5 px-3 font-mono text-[11px] text-slate-300">
                            <div>{receipt.densityObserved} kg/m³</div>
                            <div className="text-slate-500 text-[10px]">Temp: {receipt.temperature}°C</div>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-[11px] text-slate-300">
                            <div>Pre: {receipt.dipBeforeCm} cm</div>
                            <div className="text-slate-400 text-[10px]">Post: {receipt.dipAfterCm} cm</div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this tanker delivery log?')) {
                                  storage.deleteTankerReceipt(receipt.id);
                                  onRefreshData();
                                }
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                              title="Delete record"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: FUEL DENSITY VERIFICATION & QUALITY AUDIT */}
      {activeSubTab === 'density' && (
        <div className="space-y-6">
          {/* Density Header & KPI Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <Droplet className="w-5 h-5" />
                  </span>
                  <h3 className="text-lg lg:text-xl font-black text-white tracking-tight">
                    Fuel Density Verification & Quality Audit (ইন্ধনৰ ঘনত্ব আৰু গুণমান পৰীক্ষা)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Daily ASTM-53B hydrometer & thermo-density test converted to 15°C reference standard.
                  Instantly verify observed density side-by-side with official oil company standards to detect adulteration or contamination.
                </p>
              </div>

              {/* Standards Badge */}
              <div className="flex items-center gap-2 bg-slate-850 px-3 py-2 rounded-xl border border-slate-800 shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div className="text-[11px]">
                  <span className="text-slate-400 block">Official Tolerance Norm:</span>
                  <strong className="text-emerald-400 font-bold">±3.0 kg/m³ (OMC / OIDB Standard)</strong>
                </div>
              </div>
            </div>

            {/* Side-by-Side Reference Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              {/* Petrol Standard Card */}
              <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20">
                <div className="flex items-center justify-between text-xs text-orange-400 font-bold">
                  <span>Petrol (MS) Reference Standard</span>
                  <Fuel className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {petrolStandardRef.toFixed(1)} <span className="text-xs font-normal text-slate-400">kg/m³ @ 15°C</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Permissible Range: 720.0 - 775.0 kg/m³
                </span>
              </div>

              {/* Diesel Standard Card */}
              <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20">
                <div className="flex items-center justify-between text-xs text-sky-400 font-bold">
                  <span>Diesel (HSD) Reference Standard</span>
                  <Truck className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {dieselStandardRef.toFixed(1)} <span className="text-xs font-normal text-slate-400">kg/m³ @ 15°C</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Permissible Range: 820.0 - 860.0 kg/m³
                </span>
              </div>

              {/* Latest Petrol Test Status */}
              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Today's Petrol Observed
                </span>
                <div className="text-2xl font-black text-white mt-1">
                  {allDensityRecords[0] ? allDensityRecords[0].petrolDensityObserved.toFixed(1) : petrolStandardRef.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400">kg/m³</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      (allDensityRecords[0]?.petrolStatus || 'Normal') === 'Normal'
                        ? 'bg-emerald-400'
                        : allDensityRecords[0]?.petrolStatus === 'Warning'
                        ? 'bg-amber-400'
                        : 'bg-rose-500 animate-ping'
                    }`}
                  />
                  <span className="text-[11px] font-bold text-slate-300">
                    {allDensityRecords[0]?.petrolStatus || 'Normal / Pure'}
                  </span>
                </div>
              </div>

              {/* Latest Diesel Test Status */}
              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Today's Diesel Observed
                </span>
                <div className="text-2xl font-black text-white mt-1">
                  {allDensityRecords[0] ? allDensityRecords[0].dieselDensityObserved.toFixed(1) : dieselStandardRef.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400">kg/m³</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      (allDensityRecords[0]?.dieselStatus || 'Normal') === 'Normal'
                        ? 'bg-emerald-400'
                        : allDensityRecords[0]?.dieselStatus === 'Warning'
                        ? 'bg-amber-400'
                        : 'bg-rose-500 animate-ping'
                    }`}
                  />
                  <span className="text-[11px] font-bold text-slate-300">
                    {allDensityRecords[0]?.dieselStatus || 'Normal / Pure'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DENSITY ENTRY FORM: Side-by-Side Manual Entry */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    Daily Shift Density Entry & Automated Variation Verification
                  </h4>
                  <p className="text-xs text-slate-400">
                    Enter shift hydrometer test results. System automatically contrasts against reference density.
                  </p>
                </div>
              </div>

              {densityFeedback && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{densityFeedback}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveDensityRecord} className="space-y-6">
              {/* Shift & Date Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Audit Date (পৰীক্ষাৰ তাৰিখ)
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                    <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                    <input
                      type="date"
                      value={densityDate}
                      onChange={(e) => setDensityDate(e.target.value)}
                      className="bg-transparent text-white font-semibold outline-hidden w-full cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Operating Shift (শ্বিফ্ট)
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                    <Layers className="w-4 h-4 text-sky-400 shrink-0" />
                    <select
                      value={densityShift}
                      onChange={(e) => setDensityShift(e.target.value)}
                      className="bg-transparent text-white font-semibold outline-hidden w-full cursor-pointer"
                    >
                      <option value="Shift 1 (Morning)" className="bg-slate-900">Shift 1 (Morning - 06:00 AM)</option>
                      <option value="Shift 2 (Evening)" className="bg-slate-900">Shift 2 (Evening - 02:00 PM)</option>
                      <option value="Shift 3 (Night)" className="bg-slate-900">Shift 3 (Night - 10:00 PM)</option>
                      <option value="General Full Day" className="bg-slate-900">General Full Day</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Inspector / Duty DSM Name
                  </label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    placeholder="e.g. Ramesh Kalita (Shift In-charge)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              {/* SIDE-BY-SIDE FUEL DENSITY VERIFICATION CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. PETROL (MS) ENTRY & COMPARISON */}
                <div className="bg-slate-950 border-2 border-orange-500/30 rounded-2xl p-4.5 space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                        <Fuel className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-xs font-extrabold uppercase text-orange-400 tracking-wider">
                          Petrol (Motor Spirit / MS)
                        </span>
                        <h5 className="text-sm font-bold text-white">Daily Density Test @ 15°C</h5>
                      </div>
                    </div>

                    {/* Official Standard Badge */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">Reference Standard:</span>
                      <span className="px-2 py-0.5 rounded text-xs font-black bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        {petrolStandardRef.toFixed(1)} kg/m³
                      </span>
                    </div>
                  </div>

                  {/* Manual Input Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Observed Density (kg/m³)*
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={petrolObserved}
                        onChange={(e) => setPetrolObserved(e.target.value)}
                        placeholder="e.g. 743.0"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white focus:outline-hidden focus:border-orange-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Hydrometer @ 15°C</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Fuel Temp (°C)
                      </label>
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2">
                        <Thermometer className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <input
                          type="number"
                          step="0.1"
                          value={petrolTemp}
                          onChange={(e) => setPetrolTemp(e.target.value)}
                          placeholder="28.5"
                          className="bg-transparent text-sm font-mono font-bold text-white focus:outline-hidden w-full"
                        />
                        <span className="text-xs text-slate-400 font-mono">°C</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">ASTM 53B conversion</span>
                    </div>
                  </div>

                  {/* AUTOMATED SIDE-BY-SIDE COMPARISON & ADULTERATION HIGHLIGHT */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      livePetrolStatus === 'Normal'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : livePetrolStatus === 'Warning'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-rose-500/20 border-rose-500/60 animate-pulse'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Automated Purity Verification:
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-black ${
                          livePetrolStatus === 'Normal'
                            ? 'bg-emerald-500 text-slate-950'
                            : livePetrolStatus === 'Warning'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-rose-600 text-white font-extrabold animate-bounce'
                        }`}
                      >
                        {livePetrolStatus === 'Normal' && '✓ 100% PURE / NORMAL'}
                        {livePetrolStatus === 'Warning' && '⚠ ACCEPTABLE VARIATION'}
                        {livePetrolStatus === 'Adulteration Alert' && '🚨 ADULTERATION ALERT!'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Entered</span>
                        <strong className="text-sm font-black text-white font-mono">{livePetrolObs.toFixed(1)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Official Reference</span>
                        <strong className="text-sm font-black text-orange-400 font-mono">{petrolStandardRef.toFixed(1)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Variation</span>
                        <strong
                          className={`text-sm font-black font-mono ${
                            livePetrolStatus === 'Normal'
                              ? 'text-emerald-400'
                              : livePetrolStatus === 'Warning'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {livePetrolVariance > 0 ? `+${livePetrolVariance}` : livePetrolVariance} kg/m³
                        </strong>
                      </div>
                    </div>

                    <p className="text-[11px] mt-2 pt-1 border-t border-slate-800/40 text-slate-300">
                      {livePetrolStatus === 'Normal' && (
                        <span>
                          Strictly within ±1.5 kg/m³. 100% pure petrol quality verified. No staff adulteration detected.
                        </span>
                      )}
                      {livePetrolStatus === 'Warning' && (
                        <span>
                          Variation is within permissible Oil Company delivery tolerance (±3.0 kg/m³). Recommended to monitor evening shift.
                        </span>
                      )}
                      {livePetrolStatus === 'Adulteration Alert' && (
                        <span className="text-rose-300 font-semibold">
                          CRITICAL: Variation exceeds ±3.0 kg/m³ tolerance! Potential kerosene blending, naphtha solvent addition, or hydrometer malfunction. Immediate physical re-audit recommended.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* 2. DIESEL (HSD) ENTRY & COMPARISON */}
                <div className="bg-slate-950 border-2 border-sky-500/30 rounded-2xl p-4.5 space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                        <Truck className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-xs font-extrabold uppercase text-sky-400 tracking-wider">
                          Diesel (High Speed Diesel / HSD)
                        </span>
                        <h5 className="text-sm font-bold text-white">Daily Density Test @ 15°C</h5>
                      </div>
                    </div>

                    {/* Official Standard Badge */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-mono">Reference Standard:</span>
                      <span className="px-2 py-0.5 rounded text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        {dieselStandardRef.toFixed(1)} kg/m³
                      </span>
                    </div>
                  </div>

                  {/* Manual Input Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Observed Density (kg/m³)*
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={dieselObserved}
                        onChange={(e) => setDieselObserved(e.target.value)}
                        placeholder="e.g. 832.5"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white focus:outline-hidden focus:border-sky-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Hydrometer @ 15°C</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Fuel Temp (°C)
                      </label>
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2">
                        <Thermometer className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <input
                          type="number"
                          step="0.1"
                          value={dieselTemp}
                          onChange={(e) => setDieselTemp(e.target.value)}
                          placeholder="28.5"
                          className="bg-transparent text-sm font-mono font-bold text-white focus:outline-hidden w-full"
                        />
                        <span className="text-xs text-slate-400 font-mono">°C</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">ASTM 53B conversion</span>
                    </div>
                  </div>

                  {/* AUTOMATED SIDE-BY-SIDE COMPARISON & ADULTERATION HIGHLIGHT */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      liveDieselStatus === 'Normal'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : liveDieselStatus === 'Warning'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-rose-500/20 border-rose-500/60 animate-pulse'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Automated Purity Verification:
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-black ${
                          liveDieselStatus === 'Normal'
                            ? 'bg-emerald-500 text-slate-950'
                            : liveDieselStatus === 'Warning'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-rose-600 text-white font-extrabold animate-bounce'
                        }`}
                      >
                        {liveDieselStatus === 'Normal' && '✓ 100% PURE / NORMAL'}
                        {liveDieselStatus === 'Warning' && '⚠ ACCEPTABLE VARIATION'}
                        {liveDieselStatus === 'Adulteration Alert' && '🚨 ADULTERATION ALERT!'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Entered</span>
                        <strong className="text-sm font-black text-white font-mono">{liveDieselObs.toFixed(1)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Official Reference</span>
                        <strong className="text-sm font-black text-sky-400 font-mono">{dieselStandardRef.toFixed(1)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Variation</span>
                        <strong
                          className={`text-sm font-black font-mono ${
                            liveDieselStatus === 'Normal'
                              ? 'text-emerald-400'
                              : liveDieselStatus === 'Warning'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {liveDieselVariance > 0 ? `+${liveDieselVariance}` : liveDieselVariance} kg/m³
                        </strong>
                      </div>
                    </div>

                    <p className="text-[11px] mt-2 pt-1 border-t border-slate-800/40 text-slate-300">
                      {liveDieselStatus === 'Normal' && (
                        <span>
                          Strictly within ±1.5 kg/m³. 100% pure high-speed diesel quality verified. Engine friendly.
                        </span>
                      )}
                      {liveDieselStatus === 'Warning' && (
                        <span>
                          Variation is within permissible Oil Company delivery tolerance (±3.0 kg/m³). Verified within acceptable limits.
                        </span>
                      )}
                      {liveDieselStatus === 'Adulteration Alert' && (
                        <span className="text-rose-300 font-semibold">
                          CRITICAL: Variation exceeds ±3.0 kg/m³ tolerance! Risk of heavy oil residue, water ingress in underground tank, or unauthorized mixing. Check immediately.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Remarks & Submission */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Verification Remarks / Notes (মন্তব্য)
                </label>
                <input
                  type="text"
                  value={densityRemarks}
                  onChange={(e) => setDensityRemarks(e.target.value)}
                  placeholder="e.g. Morning hydrometer test conducted in presence of duty manager. Hydrometer calibrated."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Save Density Record (ঘনত্ব পৰীক্ষা জমা কৰক)</span>
                </button>
              </div>
            </form>
          </div>

          {/* HISTORICAL DENSITY AUDIT LOG TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span>Historical Fuel Density Audit Log (পূৰ্ববৰ্তী ঘনত্ব ৰেকৰ্ড)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Permanent quality ledger for Weights & Measures, Oil Marketing Company audits and station owners.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {allDensityRecords.length} Audited Records
              </span>
            </div>

            {allDensityRecords.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No density records logged yet. Use the form above to record your shift density tests.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Date & Shift</th>
                      <th className="py-3 px-3">Petrol (MS) Density</th>
                      <th className="py-3 px-3">Petrol Variance</th>
                      <th className="py-3 px-3">Diesel (HSD) Density</th>
                      <th className="py-3 px-3">Diesel Variance</th>
                      <th className="py-3 px-3">Auditor</th>
                      <th className="py-3 px-3">Remarks</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {allDensityRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-850/60 transition">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-white">{rec.date}</div>
                          <div className="text-[10px] text-slate-400">{rec.shift}</div>
                        </td>

                        {/* Petrol Column */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-orange-300 font-mono">
                            {rec.petrolDensityObserved.toFixed(1)} kg/m³
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Std: {rec.petrolOfficialDensity.toFixed(1)} | {rec.petrolTemperature || 28}°C
                          </div>
                        </td>

                        {/* Petrol Variance */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                              rec.petrolStatus === 'Normal'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : rec.petrolStatus === 'Warning'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-black'
                            }`}
                          >
                            <span>{rec.petrolVariance > 0 ? `+${rec.petrolVariance}` : rec.petrolVariance} kg/m³</span>
                            <span className="text-[9px]">({rec.petrolStatus})</span>
                          </span>
                        </td>

                        {/* Diesel Column */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-sky-300 font-mono">
                            {rec.dieselDensityObserved.toFixed(1)} kg/m³
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Std: {rec.dieselOfficialDensity.toFixed(1)} | {rec.dieselTemperature || 28}°C
                          </div>
                        </td>

                        {/* Diesel Variance */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                              rec.dieselStatus === 'Normal'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : rec.dieselStatus === 'Warning'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-black'
                            }`}
                          >
                            <span>{rec.dieselVariance > 0 ? `+${rec.dieselVariance}` : rec.dieselVariance} kg/m³</span>
                            <span className="text-[9px]">({rec.dieselStatus})</span>
                          </span>
                        </td>

                        {/* Auditor */}
                        <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                          {rec.recordedBy}
                        </td>

                        {/* Remarks */}
                        <td className="py-3 px-3 text-slate-400 text-[11px] max-w-xs truncate" title={rec.remarks}>
                          {rec.remarks || '—'}
                        </td>

                        {/* Delete action */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteDensityRecord(rec.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Delete this record"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tolerance Guidelines Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Petroleum Shortage & Tolerance Standards</h3>
                  <p className="text-xs text-slate-400">Standard Indian Oil (IOCL / BPCL / HPCL) norms</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 text-xs leading-relaxed text-slate-300">
                <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 space-y-1">
                  <div className="font-bold text-orange-400">1. Motor Spirit (Petrol / MS): Permissible 0.50% - 0.75%</div>
                  <p className="text-slate-400 text-[11px]">
                    Petrol is volatile with a low boiling point. Evaporative loss during summer heat and tanker discharge
                    is expected up to 0.5% - 0.75% of volume. Shortages within this limit are standard accounting losses.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 space-y-1">
                  <div className="font-bold text-sky-400">2. High Speed Diesel (HSD): Permissible 0.20% - 0.25%</div>
                  <p className="text-slate-400 text-[11px]">
                    Diesel has lower volatility. Permissible handling tolerance is tighter (0.20% - 0.25%). A shortage above
                    0.25% indicates pipeline leakage, nozzle calibration error, or dispenser meter drift.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 space-y-1">
                  <div className="font-bold text-emerald-400">3. Density Check Quality Assurance</div>
                  <p className="text-slate-400 text-[11px]">
                    Standard density at 15°C must match within ±3.0 kg/m³ of the terminal invoice. Variations outside this
                    window indicate temperature expansion or product adulteration.
                  </p>
                </div>
              </div>
            </div>

            {/* Reconciliation Formula Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Daily Reconciliation Formula</h3>
                  <p className="text-xs text-slate-400">গাণিতিক সূত্ৰ আৰু ঘাটি গণনা</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-800/80 text-slate-200">
                  <span className="text-orange-400 font-bold block mb-1">Total Available Stock:</span>
                  <span>Opening Stock (A) + Stock Received (B)</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 text-slate-200">
                  <span className="text-sky-400 font-bold block mb-1">Expected Closing Stock:</span>
                  <span>Total Available (C) - Metered Sales (D)</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 text-slate-200">
                  <span className="text-indigo-400 font-bold block mb-1">Physical Closing Stock:</span>
                  <span>Calculated from Physical Dip Chart (cm to Liters)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-500/30 text-rose-300">
                  <span className="text-rose-400 font-bold block mb-1 font-sans">
                    Shortage / Gain Calculation (ঘাটি / বৃদ্ধি):
                  </span>
                  <span className="text-white font-bold">Variance = Actual Closing Stock - Expected Closing Stock</span>
                  <p className="text-[11px] font-sans text-slate-300 mt-2">
                    • If Actual &lt; Expected: <strong>Shortage (লোকচান)</strong> (e.g. 50 L Short)<br />
                    • If Actual &gt; Expected: <strong>Gain (বৃদ্ধি)</strong> (temperature expansion)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: LOG TANKER RECEIPT */}
      {showAddTankerModal && (
        <TankerReceiptModal
          settings={settings}
          tanks={tanks}
          rates={rates}
          todayStr={todayStr}
          onClose={() => setShowAddTankerModal(false)}
          onSave={handleSaveTankerReceipt}
        />
      )}

      {/* MODAL 2: DAY-END DIP & RECONCILIATION */}
      {showAddReconModal && (
        <DayEndReconciliationModal
          settings={settings}
          tanks={tanks}
          rates={rates}
          readings={readings}
          tankerReceipts={tankerReceipts}
          allReconciliations={allReconciliations}
          selectedDate={selectedDate}
          initialTankId={editingTankId || tanks[0]?.id || ''}
          onClose={() => {
            setShowAddReconModal(false);
            setEditingTankId(null);
          }}
          onSave={handleSaveReconciliation}
        />
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// MODAL: LOG TANKER RECEIPT
// -----------------------------------------------------------------------------
interface TankerReceiptModalProps {
  settings: PumpSettings;
  tanks: TankStock[];
  rates: FuelRate[];
  todayStr: string;
  onClose: () => void;
  onSave: (receipt: Omit<TankerReceipt, 'id' | 'timestamp'>) => void;
}

const TankerReceiptModal: React.FC<TankerReceiptModalProps> = ({
  settings,
  tanks,
  rates,
  todayStr,
  onClose,
  onSave,
}) => {
  const [tankId, setTankId] = useState<string>(tanks[0]?.id || '');
  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>('10:00 AM');
  const [tankerNo, setTankerNo] = useState<string>('AS-01-EC-9921');
  const [invoiceNo, setInvoiceNo] = useState<string>('IOCL-INV-2026-');
  const [supplier, setSupplier] = useState<string>(`${settings.dealerBrand} Betkuchi Terminal`);
  const [invoiceQty, setInvoiceQty] = useState<number>(12000);
  const [actualQty, setActualQty] = useState<number>(11985);
  const [density, setDensity] = useState<number>(826.4);
  const [temperature, setTemperature] = useState<number>(28.5);
  const [dipBefore, setDipBefore] = useState<number>(110);
  const [dipAfter, setDipAfter] = useState<number>(180);
  const [driverName, setDriverName] = useState<string>('Manas Das');
  const [driverPhone, setDriverPhone] = useState<string>('+91 94350 22119');
  const [decantedBy, setDecantedBy] = useState<string>('DSM Incharge');
  const [remarks, setRemarks] = useState<string>('Density verified, dip rod certified, no water detected.');

  const selectedTank = tanks.find(t => t.id === tankId) || tanks[0];
  const shortageGain = actualQty - invoiceQty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      time,
      tankerNo,
      invoiceNo,
      supplier,
      fuelType: selectedTank?.fuelType || 'diesel',
      tankId,
      invoiceQuantityLiters: Number(invoiceQty),
      actualReceivedLiters: Number(actualQty),
      shortageGainLiters: Number(shortageGain.toFixed(2)),
      densityObserved: Number(density),
      temperature: Number(temperature),
      dipBeforeCm: Number(dipBefore),
      dipAfterCm: Number(dipAfter),
      driverName,
      driverPhone,
      decantedBy,
      remarks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Log Tanker Delivery Receipt</h3>
              <p className="text-xs text-slate-400 mt-0.5">তেংকাৰ চালান সংগ্ৰহ আৰু ঘনত্ব পৰীক্ষা</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Target Tank & Fuel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Target Underground Tank</label>
              <select
                value={tankId}
                onChange={e => setTankId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-medium outline-hidden"
              >
                {tanks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.fuelType.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Oil Company Supplier</label>
              <input
                type="text"
                required
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-hidden"
              />
            </div>
          </div>

          {/* Date, Time & Tanker Truck No */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Delivery Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Arrival Time</label>
              <input
                type="text"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Tanker Truck No (TT)</label>
              <input
                type="text"
                required
                value={tankerNo}
                onChange={e => setTankerNo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono uppercase outline-hidden"
              />
            </div>
          </div>

          {/* Invoice No & Quantities */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Invoice / Challan No</label>
              <input
                type="text"
                required
                value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Invoice Billed Qty (Liters)</label>
              <input
                type="number"
                required
                step="any"
                value={invoiceQty}
                onChange={e => setInvoiceQty(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono font-bold outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Actual Received Qty (Liters)</label>
              <input
                type="number"
                required
                step="any"
                value={actualQty}
                onChange={e => setActualQty(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-emerald-400 font-mono font-bold outline-hidden"
              />
            </div>
          </div>

          {/* Shortage / Decantation Loss Indicator */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between font-mono ${
              shortageGain < 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : shortageGain > 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
          >
            <span className="font-sans font-bold">Decantation Transit Loss / Shortage:</span>
            <span className="font-black text-sm">
              {shortageGain > 0 ? `+${shortageGain}` : `${shortageGain}`} Liters{' '}
              {shortageGain < 0 && '(ঘাটি)'}
            </span>
          </div>

          {/* Quality Parameters: Density & Temperature */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-orange-400" />
                <span>Density @ 15°C (kg/m³)</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={density}
                onChange={e => setDensity(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-sky-400" />
                <span>Observed Temperature (°C)</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono outline-hidden"
              />
            </div>
          </div>

          {/* Pre & Post Dip Readings */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Pre-Discharge Dip (cm)</label>
              <input
                type="number"
                step="0.1"
                value={dipBefore}
                onChange={e => setDipBefore(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Post-Discharge Dip (cm)</label>
              <input
                type="number"
                step="0.1"
                value={dipAfter}
                onChange={e => setDipAfter(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono outline-hidden"
              />
            </div>
          </div>

          {/* Driver & Decanted By */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Tanker Driver Name & Mobile</label>
              <input
                type="text"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                placeholder="Driver Name"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Supervised / Decanted By</label>
              <input
                type="text"
                value={decantedBy}
                onChange={e => setDecantedBy(e.target.value)}
                placeholder="Manager / Attendant"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-hidden"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="font-bold text-slate-300">Inspection Notes & Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-hidden"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Tanker Delivery & Update Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// MODAL: DAY-END PHYSICAL DIP & SHORTAGE RECONCILIATION
// -----------------------------------------------------------------------------
interface DayEndReconciliationModalProps {
  settings: PumpSettings;
  tanks: TankStock[];
  rates: FuelRate[];
  readings: NozzleReading[];
  tankerReceipts: TankerReceipt[];
  allReconciliations: DailyFuelStockReconciliation[];
  selectedDate: string;
  initialTankId: string;
  onClose: () => void;
  onSave: (record: Omit<DailyFuelStockReconciliation, 'id' | 'timestamp'>) => void;
}

const DayEndReconciliationModal: React.FC<DayEndReconciliationModalProps> = ({
  settings,
  tanks,
  rates,
  readings,
  tankerReceipts,
  allReconciliations,
  selectedDate,
  initialTankId,
  onClose,
  onSave,
}) => {
  const sym = settings.currencySymbol;

  const [tankId, setTankId] = useState<string>(initialTankId || tanks[0]?.id || '');
  const [date, setDate] = useState<string>(selectedDate);

  const selectedTank = tanks.find(t => t.id === tankId) || tanks[0];
  const rateObj = rates.find(r => r.type === selectedTank?.fuelType) || rates[0];
  const fuelRate = rateObj?.ratePerLiter || 95;

  // Initialize values
  const [openingStock, setOpeningStock] = useState<number>(() => {
    const prev = allReconciliations.find(r => r.tankId === tankId && r.date < date);
    return prev ? prev.actualClosingLiters : Math.round(selectedTank.capacityLiters * 0.45);
  });

  const [dipCm, setDipCm] = useState<number>(selectedTank.dipReadingCm || 150);
  const [actualClosingLiters, setActualClosingLiters] = useState<number>(selectedTank.currentVolumeLiters || 16000);
  const [recordedBy, setRecordedBy] = useState<string>('Station Manager');
  const [remarks, setRemarks] = useState<string>('Day-end physical dip verified with Dip stick.');

  // Tanker receipts for this tank on this date
  const stockReceived = useMemo(() => {
    return tankerReceipts
      .filter(tr => tr.tankId === tankId && tr.date === date)
      .reduce((sum, tr) => sum + tr.actualReceivedLiters, 0);
  }, [tankerReceipts, tankId, date]);

  // Total Available = Opening + Received
  const totalAvailable = openingStock + stockReceived;

  // Sales from connected nozzles
  const netSales = useMemo(() => {
    const nozzles = storage.getNozzles().filter(n => n.tankId === tankId);
    const nozzleIds = new Set(nozzles.map(n => n.id));
    const dayReadings = readings.filter(r => r.date === date && nozzleIds.has(r.nozzleId));
    return dayReadings.reduce((sum, r) => sum + r.netSaleQty, 0);
  }, [tankId, date, readings]);

  // Expected Closing = Total Available - Net Sales
  const expectedClosing = Math.max(0, totalAvailable - netSales);

  // Shortage / Gain Calculation
  const variance = Number((actualClosingLiters - expectedClosing).toFixed(2));
  const isShortage = variance < 0;
  const isGain = variance > 0;
  const shortageLiters = isShortage ? Math.abs(variance) : 0;
  const gainLiters = isGain ? variance : 0;
  const financialImpact = Number((variance * fuelRate).toFixed(2));

  // Tolerance check
  const tolerancePercentage = 0.25;
  const toleranceLiters = Number(((totalAvailable * tolerancePercentage) / 100).toFixed(2));
  const withinTolerance = Math.abs(variance) <= toleranceLiters;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      tankId,
      tankName: selectedTank.name,
      fuelType: selectedTank.fuelType,
      openingStockLiters: Number(openingStock),
      stockReceivedLiters: Number(stockReceived),
      totalAvailableLiters: Number(totalAvailable.toFixed(2)),
      meteredSalesLiters: Number(netSales.toFixed(2)),
      testingQuantityLiters: 10,
      netSalesLiters: Number(netSales.toFixed(2)),
      expectedClosingLiters: Number(expectedClosing.toFixed(2)),
      actualClosingLiters: Number(actualClosingLiters),
      actualDipReadingCm: Number(dipCm),
      varianceLiters: variance,
      status: isShortage ? 'Shortage' : isGain ? 'Gain' : 'Normal',
      shortageLiters,
      gainLiters,
      tolerancePercentage,
      toleranceLiters,
      withinTolerance,
      financialImpact,
      recordedBy,
      remarks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Day-End Fuel Stock & Shortage Reconciliation</h3>
              <p className="text-xs text-slate-400 mt-0.5">দৈনিক মজুত গণনা আৰু ঘাটি/লোকচান পৰীক্ষা</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Tank & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Underground Tank</label>
              <select
                value={tankId}
                onChange={e => {
                  const newId = e.target.value;
                  setTankId(newId);
                  const t = tanks.find(x => x.id === newId);
                  if (t) {
                    setActualClosingLiters(t.currentVolumeLiters);
                    setDipCm(t.dipReadingCm);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-medium outline-hidden"
              >
                {tanks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.fuelType.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Reconciliation Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono outline-hidden"
              />
            </div>
          </div>

          {/* 1. Opening Stock & 2. Stock Received */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">1. Opening Stock (Day Start Liters)</label>
              <input
                type="number"
                required
                step="any"
                value={openingStock}
                onChange={e => setOpeningStock(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono font-bold outline-hidden"
              />
              <span className="text-[10px] text-slate-400">Previous day closing or shift handover dip</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">2. Stock Received (Tankers Today)</label>
              <input
                type="number"
                disabled
                value={stockReceived}
                className="w-full bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2 text-sky-400 font-mono font-bold outline-hidden cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400">Summed automatically from today's tanker deliveries</span>
            </div>
          </div>

          {/* 3. Total Available Stock & 4. Metered Sales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">3. Total Available Stock (A + B)</span>
              <div className="text-base font-black text-amber-300 font-mono mt-0.5">
                {totalAvailable.toLocaleString('en-IN')} Liters
              </div>
            </div>

            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <span className="text-[10px] uppercase font-bold text-orange-400 block">4. Metered Sales (Dispenser Sum)</span>
              <div className="text-base font-black text-orange-300 font-mono mt-0.5">
                {netSales.toLocaleString('en-IN')} Liters
              </div>
            </div>
          </div>

          {/* 5. Expected Closing Stock */}
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 block">5. Expected Closing Stock (Opening + Received - Sales)</span>
              <span className="text-[10px] text-slate-400">Calculated mathematical book balance</span>
            </div>
            <span className="text-base font-mono font-black text-white">
              {expectedClosing.toLocaleString('en-IN')} Liters
            </span>
          </div>

          {/* 6. Physical Closing Stock (Direct Liters & Optional Dip) */}
          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-300 text-xs">
                6. Measured Physical Closing Stock (বাস্তৱিক ক্লজিং ষ্টক - লিটাৰত)
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Direct Liters Entry
              </span>
            </div>

            <div className="space-y-3">
              {/* PRIMARY: DIRECT LITERS ENTRY */}
              <div className="space-y-1">
                <label className="font-bold text-white text-xs flex items-center justify-between">
                  <span>Actual Closing Stock (Liters / লিটাৰত ষ্টক):</span>
                  <span className="text-[10px] text-emerald-400 font-normal">সরাসৰি লিটাৰত লিখক (Required)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    value={actualClosingLiters}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setActualClosingLiters(val);
                      // Auto-estimate dip stick cm so user never has to enter dip
                      const estDip = Math.round((val / Math.max(1, selectedTank.capacityLiters)) * 260);
                      setDipCm(estDip);
                    }}
                    placeholder="Enter physical volume in Liters"
                    className="w-full bg-slate-900 border border-emerald-500/50 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-emerald-300 font-mono font-black text-base outline-hidden pr-10"
                  />
                  <span className="absolute right-3.5 top-2.5 font-bold text-emerald-400">L</span>
                </div>
              </div>

              {/* SECONDARY: OPTIONAL DIP STICK READING */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-400 text-[11px] flex items-center justify-between">
                  <span>Physical Dip Stick cm (ঐচ্ছিক / Optional):</span>
                  <span className="text-[10px] text-slate-500">Auto-calculated if left as is</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={dipCm}
                  onChange={e => setDipCm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-slate-300 font-mono text-xs outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* 7. Shortage / Gain Banner */}
          <div
            className={`p-4 rounded-2xl border ${
              isShortage
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : isGain
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isShortage ? (
                  <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                )}
                <div>
                  <div className="text-sm font-black uppercase tracking-wide">
                    {isShortage
                      ? `Shortage of ${shortageLiters} Liters Detected`
                      : isGain
                      ? `Gain of ${gainLiters} Liters Recorded`
                      : 'Zero Discrepancy Verified'}
                  </div>
                  <div className="text-xs mt-0.5">
                    {isShortage
                      ? `ঘাটি মূল্য: ${sym}${Math.abs(financialImpact).toLocaleString('en-IN')} (${withinTolerance ? 'Within standard handling tolerance' : 'EXCEEDS PERMISSIBLE LOSS'})`
                      : isGain
                      ? `অতিৰিক্ত লাভ: +${sym}${financialImpact.toLocaleString('en-IN')}`
                      : 'Physical dip matches book stock balance perfectly.'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-lg font-black">
                  {variance > 0 ? `+${variance}` : `${variance}`} L
                </div>
                <div className="text-[10px] opacity-75">Tolerance: ±{toleranceLiters}L</div>
              </div>
            </div>
          </div>

          {/* Audit Officer & Remarks */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Audited & Recorded By</label>
              <input
                type="text"
                required
                value={recordedBy}
                onChange={e => setRecordedBy(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Remarks / Observation</label>
              <input
                type="text"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-hidden"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-950/30 active:scale-95 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Finalize Day Reconciliation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
