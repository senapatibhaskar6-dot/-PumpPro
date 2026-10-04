import React, { useState, useMemo } from 'react';
import {
  Scale,
  DollarSign,
  Receipt,
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calculator,
  Save,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Info,
  Clock,
} from 'lucide-react';
import {
  NozzleReading,
  LubricantSale,
  CreditIndentSlip,
  ExpenseRecord,
  ShiftReconciliation,
  CashDenomination,
  PumpSettings,
} from '../types';
import { storage, getTodayDateString } from '../services/storage';

interface CashReconciliationProps {
  settings: PumpSettings;
  readings: NozzleReading[];
  lubeSales: LubricantSale[];
  creditSlips: CreditIndentSlip[];
  expenses: ExpenseRecord[];
  activeShift: string;
  onRefreshData: () => void;
}

export const CashReconciliation: React.FC<CashReconciliationProps> = ({
  settings,
  readings,
  lubeSales,
  creditSlips,
  expenses,
  activeShift,
  onRefreshData,
}) => {
  const sym = settings.currencySymbol;
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedShift, setSelectedShift] = useState<string>(activeShift);
  const [managerName, setManagerName] = useState<string>('Ramesh Kumar (Shift Manager)');
  const [remarks, setRemarks] = useState<string>('');

  // Cash Denomination State
  const [denominations, setDenominations] = useState<CashDenomination>({
    note2000: 0,
    note500: 420,  // e.g. ₹2,10,000
    note200: 250,  // e.g. ₹50,000
    note100: 380,  // e.g. ₹38,000
    note50: 120,   // e.g. ₹6,000
    note20: 80,    // e.g. ₹1,600
    note10: 95,    // e.g. ₹950
    coins: 350,    // e.g. ₹350
  });

  // Digital Payment Collections State
  const [upiAmount, setUpiAmount] = useState<number>(142500); // PhonePe / Paytm / GPay
  const [posCardAmount, setPosCardAmount] = useState<number>(56800); // Card swipes
  const [bankDepositAmount, setBankDepositAmount] = useState<number>(0);

  // New Expense Quick Add State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState<ExpenseRecord['category']>('Tea & Refreshments');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState(250);
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expPaymentMode, setExpPaymentMode] = useState<ExpenseRecord['paymentMode']>('Counter Cash');

  // Filtered Items for this shift and date
  const shiftReadings = useMemo(() => {
    return readings.filter((r) => r.date === selectedDate && r.shift === selectedShift);
  }, [readings, selectedDate, selectedShift]);

  const shiftLubeSales = useMemo(() => {
    return lubeSales.filter((s) => s.date === selectedDate && s.shift === selectedShift);
  }, [lubeSales, selectedDate, selectedShift]);

  const shiftCreditSlips = useMemo(() => {
    return creditSlips.filter((s) => s.date === selectedDate && s.shift === selectedShift);
  }, [creditSlips, selectedDate, selectedShift]);

  const shiftExpenses = useMemo(() => {
    return expenses.filter((e) => e.date === selectedDate && e.shift === selectedShift);
  }, [expenses, selectedDate, selectedShift]);

  // Total Expected Sales Calculation
  const fuelSalesTotal = useMemo(() => {
    return shiftReadings.reduce((sum, r) => sum + r.totalAmount, 0);
  }, [shiftReadings]);

  const fuelLitersTotal = useMemo(() => {
    return shiftReadings.reduce((sum, r) => sum + r.netSaleQty, 0);
  }, [shiftReadings]);

  const lubeSalesTotal = useMemo(() => {
    return shiftLubeSales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [shiftLubeSales]);

  const grossSalesTotal = fuelSalesTotal + lubeSalesTotal;

  // Non-cash counter deductions
  const creditSlipsTotal = useMemo(() => {
    return shiftCreditSlips.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [shiftCreditSlips]);

  // Expenses paid from Counter Cash
  const counterExpensesTotal = useMemo(() => {
    return shiftExpenses
      .filter((e) => e.paymentMode === 'Counter Cash')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [shiftExpenses]);

  // Net Expected Collection (All payment modes combined)
  const expectedCollectionTotal = grossSalesTotal - creditSlipsTotal - counterExpensesTotal;

  // Actual Physical Cash from Denominations
  const totalPhysicalCash = useMemo(() => {
    return (
      denominations.note2000 * 2000 +
      denominations.note500 * 500 +
      denominations.note200 * 200 +
      denominations.note100 * 100 +
      denominations.note50 * 50 +
      denominations.note20 * 20 +
      denominations.note10 * 10 +
      denominations.coins
    );
  }, [denominations]);

  // Total Actual Collections (Physical Cash + UPI + POS Card + Bank)
  const totalActualCollection =
    totalPhysicalCash + upiAmount + posCardAmount + bankDepositAmount;

  // Discrepancy
  const discrepancy = totalActualCollection - expectedCollectionTotal;
  const isBalanced = Math.abs(discrepancy) < 2; // tolerates 1-2 rupee coin rounding
  const isShortage = discrepancy <= -2;
  const isExcess = discrepancy >= 2;

  // Update Denomination
  const handleDenomChange = (field: keyof CashDenomination, value: string) => {
    const num = Math.max(0, parseInt(value) || 0);
    setDenominations((prev) => ({ ...prev, [field]: num }));
  };

  // Add Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const newExp: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      date: selectedDate,
      shift: selectedShift,
      category: expCategory,
      description: expDesc || `${expCategory} expense`,
      amount: Number(expAmount),
      paidTo: expPaidTo || 'Vendor',
      paymentMode: expPaymentMode,
      voucherNo: `VCH-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: Date.now(),
    };

    storage.addExpense(newExp);
    onRefreshData();
    setShowExpenseModal(false);
    setExpDesc('');
    setExpPaidTo('');
    setExpAmount(250);
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    storage.deleteExpense(id);
    onRefreshData();
  };

  // Save Reconciliation Snapshot
  const handleSaveReconciliation = () => {
    const rec: ShiftReconciliation = {
      id: `rec-${selectedDate}-${selectedShift}`,
      date: selectedDate,
      shift: selectedShift,
      managerName,
      fuelSalesAmount: fuelSalesTotal,
      fuelSalesLiters: fuelLitersTotal,
      lubeSalesAmount: lubeSalesTotal,
      grossSalesAmount: grossSalesTotal,
      creditSlipsIssuedAmount: creditSlipsTotal,
      counterExpensesAmount: counterExpensesTotal,
      expectedCounterCollection: expectedCollectionTotal,
      cashDenominations: denominations,
      totalPhysicalCash,
      upiQrCollection: upiAmount,
      posCardCollection: posCardAmount,
      directBankDeposit: bankDepositAmount,
      totalActualCollection,
      discrepancy,
      status: isBalanced ? 'Balanced' : isExcess ? 'Excess' : 'Shortage',
      remarks,
      closedAt: Date.now(),
    };

    storage.saveReconciliation(rec);
    alert('Shift reconciliation successfully saved and archived in station records!');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Scale className="w-5 h-5" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">
              Shift Cash Drawer Tally & Reconciliation
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare total meter & lubricant sales against physical currency denominations, UPI slips, and card receipts.
          </p>
        </div>

        {/* Date & Shift Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-orange-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-semibold outline-hidden cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Layers className="w-4 h-4 text-sky-400" />
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="bg-transparent text-white font-semibold outline-hidden cursor-pointer"
            >
              <option value="Shift 1 (Morning)" className="bg-slate-900">Shift 1 (Morning)</option>
              <option value="Shift 2 (Evening)" className="bg-slate-900">Shift 2 (Evening)</option>
              <option value="Shift 3 (Night)" className="bg-slate-900">Shift 3 (Night)</option>
              <option value="General Full Day" className="bg-slate-900">General Full Day</option>
            </select>
          </div>
        </div>
      </div>

      {/* DISCREPANCY STATUS BANNER */}
      <div
        className={`p-5 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
          isBalanced
            ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-emerald-500/50'
            : isShortage
            ? 'bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border-red-500/50'
            : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-amber-500/50'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-2xl ${
              isBalanced
                ? 'bg-emerald-500/20 text-emerald-400 ring-4 ring-emerald-500/10'
                : isShortage
                ? 'bg-red-500/20 text-red-400 ring-4 ring-red-500/10 animate-pulse'
                : 'bg-amber-500/20 text-amber-400 ring-4 ring-amber-500/10'
            }`}
          >
            {isBalanced ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Reconciliation Balance Status
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  isBalanced
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isShortage
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {isBalanced ? 'PERFECTLY BALANCED' : isShortage ? 'CASH SHORTAGE DETECTED' : 'EXCESS CASH IN DRAWER'}
              </span>
            </div>

            <div className="text-2xl lg:text-3xl font-black font-mono mt-0.5 tracking-tight">
              {isBalanced ? (
                <span className="text-emerald-400">₹0.00 Variance (Tally Match)</span>
              ) : isShortage ? (
                <span className="text-red-400">
                  -{sym}{Math.abs(discrepancy).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Shortage
                </span>
              ) : (
                <span className="text-amber-400">
                  +{sym}{discrepancy.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Excess
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              Expected: <strong className="text-white font-mono">{sym}{expectedCollectionTotal.toLocaleString('en-IN')}</strong> | Actual Counted:{' '}
              <strong className="text-white font-mono">{sym}{totalActualCollection.toLocaleString('en-IN')}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveReconciliation}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Save className="w-4 h-4" />
          <span>Save & Close Shift Settlement</span>
        </button>
      </div>

      {/* Main Reconciliation Grid: Expected Sales Breakdown vs Actual Drawer Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calculation Sheet (Gross Sales - Deductions) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sales Breakdown Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Expected Shift Sales
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {selectedShift}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>Fuel Sales ({fuelLitersTotal.toFixed(1)} L)</span>
                </span>
                <span className="font-mono font-bold text-white">
                  {sym}{fuelSalesTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span>Lubricants & Non-Fuel Sales</span>
                </span>
                <span className="font-mono font-bold text-white">
                  {sym}{lubeSalesTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700 font-bold">
                <span className="text-white">Gross Total Sales</span>
                <span className="font-mono text-base text-white">
                  {sym}{grossSalesTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Deductions: Credit Slips & Counter Expenses */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                2. Non-Cash Deductions from Counter
              </span>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/20 text-orange-300">
                <span>(-) Fleet Credit Slips Issued</span>
                <span className="font-mono font-bold">
                  -{sym}{creditSlipsTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-500/5 border border-red-500/20 text-red-300">
                <span>(-) Counter Cash Expenses Paid</span>
                <span className="font-mono font-bold">
                  -{sym}{counterExpensesTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Net Expected Counter Collection */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                  Net Expected Total Collection
                </span>
                <span className="text-xs text-slate-400">Cash + UPI + Card Drawer Target</span>
              </div>
              <span className="text-xl font-black font-mono text-emerald-400">
                {sym}{expectedCollectionTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Daily Expenses Ledger for this shift */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-orange-400" />
                <span>Shift Expenses ({shiftExpenses.length})</span>
              </span>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Expense</span>
              </button>
            </div>

            {shiftExpenses.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                No expenses logged for this shift yet.
              </div>
            ) : (
              <div className="space-y-2">
                {shiftExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{exp.description}</div>
                      <div className="text-[11px] text-slate-400">
                        {exp.category} • Paid to: {exp.paidTo} ({exp.paymentMode})
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">
                        {sym}{exp.amount}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Physical Currency Note Denomination Counter + Electronic Slips */}
        <div className="lg:col-span-7 space-y-6">
          {/* Currency Note Counter */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">
                  Physical Cash Note Denomination Counter
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Total Cash: {sym}{totalPhysicalCash.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Denomination Rows Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* ₹2000 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-mono font-bold text-pink-400 w-16">₹2,000 x</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={denominations.note2000}
                  onChange={(e) => handleDenomChange('note2000', e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white outline-hidden"
                />
                <span className="font-mono font-bold text-right text-slate-300 w-24">
                  = {sym}{(denominations.note2000 * 2000).toLocaleString('en-IN')}
                </span>
              </div>

              {/* ₹500 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-mono font-bold text-emerald-400 w-16">₹500 x</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={denominations.note500}
                  onChange={(e) => handleDenomChange('note500', e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white outline-hidden"
                />
                <span className="font-mono font-bold text-right text-slate-300 w-24">
                  = {sym}{(denominations.note500 * 500).toLocaleString('en-IN')}
                </span>
              </div>

              {/* ₹200 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-mono font-bold text-amber-400 w-16">₹200 x</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={denominations.note200}
                  onChange={(e) => handleDenomChange('note200', e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white outline-hidden"
                />
                <span className="font-mono font-bold text-right text-slate-300 w-24">
                  = {sym}{(denominations.note200 * 200).toLocaleString('en-IN')}
                </span>
              </div>

              {/* ₹100 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-mono font-bold text-purple-400 w-16">₹100 x</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={denominations.note100}
                  onChange={(e) => handleDenomChange('note100', e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white outline-hidden"
                />
                <span className="font-mono font-bold text-right text-slate-300 w-24">
                  = {sym}{(denominations.note100 * 100).toLocaleString('en-IN')}
                </span>
              </div>

              {/* ₹50 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-mono font-bold text-sky-400 w-16">₹50 x</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={denominations.note50}
                  onChange={(e) => handleDenomChange('note50', e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white outline-hidden"
                />
                <span className="font-mono font-bold text-right text-slate-300 w-24">
                  = {sym}{(denominations.note50 * 50).toLocaleString('en-IN')}
                </span>
              </div>

              {/* ₹20 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-mono font-bold text-lime-400 w-16">₹20 x</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={denominations.note20}
                  onChange={(e) => handleDenomChange('note20', e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white outline-hidden"
                />
                <span className="font-mono font-bold text-right text-slate-300 w-24">
                  = {sym}{(denominations.note20 * 20).toLocaleString('en-IN')}
                </span>
              </div>

              {/* ₹10 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-mono font-bold text-slate-300 w-16">₹10 x</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={denominations.note10}
                  onChange={(e) => handleDenomChange('note10', e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white outline-hidden"
                />
                <span className="font-mono font-bold text-right text-slate-300 w-24">
                  = {sym}{(denominations.note10 * 10).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Coins Total */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="font-mono font-bold text-orange-400 w-16">Coins:</span>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={denominations.coins}
                  onChange={(e) => handleDenomChange('coins', e.target.value)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white outline-hidden"
                />
                <span className="font-mono font-bold text-right text-slate-300 w-24">
                  = {sym}{denominations.coins.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Electronic Collections & Card Settlements */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">
                  Electronic UPI, POS Card & Online Collections
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-sky-400">
                Total Digital: {sym}{(upiAmount + posCardAmount + bankDepositAmount).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-purple-400" />
                  <span>UPI / QR Collections</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono">{sym}</span>
                  <input
                    type="number"
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono font-bold text-sm outline-hidden"
                  />
                </div>
                <span className="text-[10px] text-slate-500">PhonePe, Paytm, GooglePay slips</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                  <span>POS Card Machine Swipes</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono">{sym}</span>
                  <input
                    type="number"
                    value={posCardAmount}
                    onChange={(e) => setPosCardAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono font-bold text-sm outline-hidden"
                  />
                </div>
                <span className="text-[10px] text-slate-500">PineLabs / EDC batch report</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direct Bank / NEFT</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono">{sym}</span>
                  <input
                    type="number"
                    value={bankDepositAmount}
                    onChange={(e) => setBankDepositAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white font-mono font-bold text-sm outline-hidden"
                  />
                </div>
                <span className="text-[10px] text-slate-500">Direct station bank credit</span>
              </div>
            </div>

            {/* Reconciliation Notes */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Cashier / Manager Shift Remarks & Variance Reason (If Any)
              </label>
              <input
                type="text"
                placeholder="e.g. All nozzle meter tallies verified. Change provided for ₹500 note."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-400" />
                <h2 className="text-base font-bold text-white">Log Station Expense</h2>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                >
                  <option value="Staff Wages">Staff Wages / Advance</option>
                  <option value="Tea & Refreshments">Tea & Refreshments</option>
                  <option value="Electricity & Generator">Electricity & Generator Diesel</option>
                  <option value="Pump Maintenance & Spares">Pump Maintenance & Spares</option>
                  <option value="Stationery & Cleaning">Stationery & Cleaning</option>
                  <option value="Calibration & Testing">Calibration & Testing</option>
                  <option value="Bank Charges">Bank Charges</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Generator 10L diesel top-up"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Amount ({sym})</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Paid To</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Canteen"
                    value={expPaidTo}
                    onChange={(e) => setExpPaidTo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Payment Mode</label>
                <select
                  value={expPaymentMode}
                  onChange={(e) => setExpPaymentMode(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                >
                  <option value="Counter Cash">Counter Cash (Deducted from drawer)</option>
                  <option value="UPI/Online">UPI / Online</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition"
              >
                Save Expense Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
