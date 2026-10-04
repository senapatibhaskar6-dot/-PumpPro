import React, { useState, useMemo } from 'react';
import {
  Fuel,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Printer,
  Calendar,
  Layers,
  User,
  Plus,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  FuelRate,
  Nozzle,
  NozzleReading,
  PumpSettings,
} from '../types';
import { storage, getTodayDateString } from '../services/storage';

interface MeterReadingsProps {
  settings: PumpSettings;
  rates: FuelRate[];
  nozzles: Nozzle[];
  readings: NozzleReading[];
  activeShift: string;
  onRefreshData: () => void;
  onPrintSlip?: (reading: NozzleReading, nozzle: Nozzle) => void;
}

export const MeterReadings: React.FC<MeterReadingsProps> = ({
  settings,
  rates,
  nozzles,
  readings,
  activeShift,
  onRefreshData,
  onPrintSlip,
}) => {
  const sym = settings.currencySymbol;
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedShift, setSelectedShift] = useState<string>(activeShift);
  const [editingNozzleId, setEditingNozzleId] = useState<string | null>(nozzles[0]?.id || null);

  // Form State for active editing nozzle
  const [opening, setOpening] = useState<string>('');
  const [closing, setClosing] = useState<string>('');
  const [testing, setTesting] = useState<string>('5.0'); // default 5L calibration test
  const [attendant, setAttendant] = useState<string>('Rajesh (DSM)');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Current selected nozzle object
  const currentNozzle = useMemo(() => {
    return nozzles.find((n) => n.id === editingNozzleId) || nozzles[0];
  }, [nozzles, editingNozzleId]);

  // Current fuel rate for this nozzle
  const currentRateObj = useMemo(() => {
    if (!currentNozzle) return rates[0];
    return rates.find((r) => r.type === currentNozzle.fuelType) || rates[0];
  }, [currentNozzle, rates]);

  // Filtered readings for selected date and shift
  const currentShiftReadings = useMemo(() => {
    return readings.filter(
      (r) => r.date === selectedDate && r.shift === selectedShift
    );
  }, [readings, selectedDate, selectedShift]);

  // Load nozzle reading into form when changing nozzle or shift
  const loadNozzleReading = (nozzleId: string) => {
    setEditingNozzleId(nozzleId);
    setFeedbackMsg(null);
    const existing = readings.find(
      (r) => r.nozzleId === nozzleId && r.date === selectedDate && r.shift === selectedShift
    );

    if (existing) {
      setOpening(existing.openingReading.toString());
      setClosing(existing.closingReading.toString());
      setTesting(existing.testingQty.toString());
      if (existing.recordedBy) setAttendant(existing.recordedBy);
    } else {
      // Find latest previous reading for opening default
      const prevReading = readings.find((r) => r.nozzleId === nozzleId);
      if (prevReading) {
        setOpening(prevReading.closingReading.toString());
        setClosing((prevReading.closingReading + 500).toString());
      } else {
        setOpening('50000.0');
        setClosing('50800.0');
      }
      setTesting('5.0');
    }
  };

  // Auto-calculated live values
  const calcResults = useMemo(() => {
    const op = parseFloat(opening) || 0;
    const cl = parseFloat(closing) || 0;
    const test = parseFloat(testing) || 0;
    const rate = currentRateObj?.ratePerLiter || 100;

    const diff = cl - op;
    const netSale = Math.max(0, diff - test);
    const totalAmount = netSale * rate;

    const isNegative = cl < op && cl > 0;

    return {
      grossDifference: diff,
      netSaleLiters: netSale,
      totalAmount,
      isNegative,
      rate,
    };
  }, [opening, closing, testing, currentRateObj]);

  // Handle Save
  const handleSaveReading = (e: React.FormEvent) => {
    e.preventDefault();
    const op = parseFloat(opening);
    const cl = parseFloat(closing);
    const test = parseFloat(testing) || 0;

    if (isNaN(op) || isNaN(cl)) {
      setFeedbackMsg({ type: 'error', text: 'Please enter valid meter numbers.' });
      return;
    }

    if (cl < op) {
      setFeedbackMsg({
        type: 'error',
        text: 'Closing meter reading cannot be lower than opening reading.',
      });
      return;
    }

    const netQty = (cl - op) - test;
    const amount = netQty * (currentRateObj?.ratePerLiter || 0);

    const newReading: NozzleReading = {
      id: `read-${currentNozzle.id}-${selectedDate}-${Date.now()}`,
      date: selectedDate,
      shift: selectedShift as any,
      nozzleId: currentNozzle.id,
      openingReading: op,
      closingReading: cl,
      testingQty: test,
      netSaleQty: Math.max(0, netQty),
      rate: currentRateObj?.ratePerLiter || 0,
      totalAmount: Math.max(0, amount),
      recordedBy: attendant,
      timestamp: Date.now(),
    };

    storage.addReading(newReading);
    onRefreshData();
    setFeedbackMsg({
      type: 'success',
      text: `Successfully recorded ${netQty.toFixed(1)} Liters (${sym}${amount.toFixed(2)}) for ${currentNozzle.name}`,
    });

    // Auto advance to next nozzle if available
    const currentIndex = nozzles.findIndex((n) => n.id === currentNozzle.id);
    if (currentIndex < nozzles.length - 1) {
      const nextNozzle = nozzles[currentIndex + 1];
      setTimeout(() => {
        loadNozzleReading(nextNozzle.id);
      }, 700);
    }
  };

  // Summary of all nozzles for this shift
  const shiftTotals = useMemo(() => {
    let liters = 0;
    let amount = 0;
    let completedCount = 0;

    currentShiftReadings.forEach((r) => {
      liters += r.netSaleQty;
      amount += r.totalAmount;
      completedCount++;
    });

    return {
      liters,
      amount,
      completedCount,
      totalNozzles: nozzles.length,
    };
  }, [currentShiftReadings, nozzles]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
              <Fuel className="w-5 h-5" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">
              Nozzle Meter Reading & Daily Fuel Sales
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enter opening, closing, and calibration testing fuel for accurate volume calculations.
          </p>
        </div>

        {/* Date & Shift Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span className="text-slate-400">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-semibold outline-hidden cursor-pointer"
            />
          </div>

          {/* Shift Picker */}
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

      {/* Shift Completion Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Shift Total Volume
            </span>
            <div className="text-2xl font-black text-orange-400 font-mono mt-0.5">
              {shiftTotals.liters.toLocaleString('en-IN', { maximumFractionDigits: 1 })} L
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Fuel className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Fuel Sales Revenue
            </span>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {sym}{shiftTotals.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Calculator className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Nozzles Recorded
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {shiftTotals.completedCount} / {shiftTotals.totalNozzles}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Nozzles Selector Column + Entry Form & Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: All Dispenser Nozzles List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Dispenser Nozzle
            </span>
            <span className="text-xs text-slate-400">
              {nozzles.length} Configured
            </span>
          </div>

          <div className="space-y-2">
            {nozzles.map((nozzle) => {
              const isSelected = currentNozzle?.id === nozzle.id;
              const recorded = currentShiftReadings.find((r) => r.nozzleId === nozzle.id);
              const fuelColor =
                nozzle.fuelType === 'petrol'
                  ? 'border-l-orange-500 text-orange-400'
                  : nozzle.fuelType === 'diesel'
                  ? 'border-l-sky-500 text-sky-400'
                  : 'border-l-purple-500 text-purple-400';

              return (
                <button
                  key={nozzle.id}
                  onClick={() => loadNozzleReading(nozzle.id)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all duration-150 flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-orange-500/50 shadow-md ring-1 ring-orange-500/40'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  } border-l-4 ${fuelColor}`}
                >
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{nozzle.name}</span>
                      {recorded && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {nozzle.dispenserUnit} •{' '}
                      <span className="font-semibold uppercase">{nozzle.fuelType}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    {recorded ? (
                      <div>
                        <span className="text-xs font-mono font-bold text-emerald-400 block">
                          {recorded.netSaleQty.toFixed(1)} L
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sym}{recorded.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        Pending
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Nozzle Meter Entry & Live Calculation Engine */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Header of Active Nozzle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">{currentNozzle.name}</h2>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
                  style={{
                    backgroundColor: `${currentRateObj.color}20`,
                    color: currentRateObj.color,
                  }}
                >
                  {currentNozzle.fuelType.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Current Fuel Rate:{' '}
                <strong className="text-orange-400 font-mono text-sm">
                  {sym}{currentRateObj.ratePerLiter.toFixed(2)}/L
                </strong>
              </p>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="px-2 py-1 bg-slate-800 rounded-lg border border-slate-700 font-mono">
                {selectedShift}
              </span>
              <span className="px-2 py-1 bg-slate-800 rounded-lg border border-slate-700 font-mono">
                {selectedDate}
              </span>
            </div>
          </div>

          {/* Feedback banner */}
          {feedbackMsg && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Entry Form */}
          <form onSubmit={handleSaveReading} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Opening Reading */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Opening Meter Reading</span>
                  <span className="text-[10px] text-slate-400 font-normal">Start of shift</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    required
                    value={opening}
                    onChange={(e) => setOpening(e.target.value)}
                    placeholder="e.g. 84200.0"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-white font-mono text-base font-bold outline-hidden transition"
                  />
                  <span className="absolute right-3 top-3 text-[11px] font-mono text-slate-400">
                    Liters
                  </span>
                </div>
              </div>

              {/* Closing Reading */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Closing Meter Reading</span>
                  <span className="text-[10px] text-slate-400 font-normal">End of shift</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    required
                    value={closing}
                    onChange={(e) => setClosing(e.target.value)}
                    placeholder="e.g. 85084.5"
                    className={`w-full bg-slate-800 border rounded-xl px-3.5 py-2.5 text-white font-mono text-base font-bold outline-hidden transition ${
                      calcResults.isNegative
                        ? 'border-red-500 focus:border-red-400'
                        : 'border-slate-700 focus:border-orange-500'
                    }`}
                  />
                  <span className="absolute right-3 top-3 text-[11px] font-mono text-slate-400">
                    Liters
                  </span>
                </div>
              </div>

              {/* Testing Qty (Calibration) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Testing Qty (Calibration)</span>
                  <span className="text-[10px] text-orange-400 font-normal">Poured to tank</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={testing}
                    onChange={(e) => setTesting(e.target.value)}
                    placeholder="5.0"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-white font-mono text-base font-bold outline-hidden transition"
                  />
                  <span className="absolute right-3 top-3 text-[11px] font-mono text-slate-400">
                    Liters
                  </span>
                </div>
              </div>
            </div>

            {/* DSM Attendant Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>Duty Sales Attendant / DSM Incharge</span>
              </label>
              <input
                type="text"
                value={attendant}
                onChange={(e) => setAttendant(e.target.value)}
                placeholder="Attendant Name / Employee ID"
                className="w-full sm:w-80 bg-slate-800 border border-slate-700 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden transition"
              />
            </div>

            {/* Live Calculation Display Box */}
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>Real-Time Formula Calculation</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  (Closing - Opening) - Testing = Net Volume
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Meter Diff */}
                <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Gross Meter Diff
                  </span>
                  <span className="text-base font-mono font-bold text-slate-200">
                    {calcResults.grossDifference.toFixed(2)} L
                  </span>
                </div>

                {/* Net Sale Liters */}
                <div className="bg-orange-500/10 rounded-xl p-3 border border-orange-500/20">
                  <span className="text-[10px] text-orange-400 block uppercase font-bold">
                    Net Billable Volume
                  </span>
                  <span className="text-xl font-mono font-black text-orange-400">
                    {calcResults.netSaleLiters.toFixed(2)} L
                  </span>
                </div>

                {/* Total Sale Amount */}
                <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 block uppercase font-bold">
                    Total Amount @ {sym}{calcResults.rate.toFixed(2)}
                  </span>
                  <span className="text-xl font-mono font-black text-emerald-400">
                    {sym}{calcResults.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-400" />
                <span>Saving will update current shift register and DSR reports.</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Nozzle Reading</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
