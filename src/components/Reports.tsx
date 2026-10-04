import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Printer,
  Download,
  TrendingUp,
  DollarSign,
  Fuel,
  Package,
  Receipt,
  CheckCircle2,
  FileSpreadsheet,
  ArrowUpRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import {
  NozzleReading,
  Nozzle,
  FuelRate,
  LubricantSale,
  LubricantProduct,
  ExpenseRecord,
  CustomerCreditAccount,
  CreditIndentSlip,
  PumpSettings,
} from '../types';
import { getTodayDateString } from '../services/storage';

interface ReportsProps {
  settings: PumpSettings;
  rates: FuelRate[];
  nozzles: Nozzle[];
  readings: NozzleReading[];
  lubricants: LubricantProduct[];
  lubeSales: LubricantSale[];
  expenses: ExpenseRecord[];
  creditSlips: CreditIndentSlip[];
  customers: CustomerCreditAccount[];
}

export const Reports: React.FC<ReportsProps> = ({
  settings,
  rates,
  nozzles,
  readings,
  lubricants,
  lubeSales,
  expenses,
  creditSlips,
  customers,
}) => {
  const sym = settings.currencySymbol;
  const [dateFilter, setDateFilter] = useState<'today' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(getTodayDateString());

  // Filter records based on selected date
  const filteredData = useMemo(() => {
    const today = getTodayDateString();
    const filterFn = (itemDate: string) => {
      if (dateFilter === 'today') return itemDate === today;
      if (dateFilter === 'custom') return itemDate === customDate;
      return true; // all
    };

    const fReadings = readings.filter((r) => filterFn(r.date));
    const fLubeSales = lubeSales.filter((s) => filterFn(s.date));
    const fExpenses = expenses.filter((e) => filterFn(e.date));
    const fCreditSlips = creditSlips.filter((s) => filterFn(s.date));

    return {
      readings: fReadings,
      lubeSales: fLubeSales,
      expenses: fExpenses,
      creditSlips: fCreditSlips,
    };
  }, [readings, lubeSales, expenses, creditSlips, dateFilter, customDate]);

  // Compute Full P&L Statement and Daily Sales Report (DSR)
  const report = useMemo(() => {
    // 1. Fuel Sales & Margins Breakdown
    let totalFuelLiters = 0;
    let totalFuelSalesAmount = 0;
    let totalFuelCost = 0;
    let totalFuelDealerMargin = 0;

    const fuelByType: Record<string, { liters: number; revenue: number; margin: number }> = {
      petrol: { liters: 0, revenue: 0, margin: 0 },
      diesel: { liters: 0, revenue: 0, margin: 0 },
      premium_petrol: { liters: 0, revenue: 0, margin: 0 },
      cng: { liters: 0, revenue: 0, margin: 0 },
    };

    filteredData.readings.forEach((r) => {
      totalFuelLiters += r.netSaleQty;
      totalFuelSalesAmount += r.totalAmount;

      const nozzle = nozzles.find((n) => n.id === r.nozzleId);
      const fuelType = nozzle?.fuelType || 'petrol';
      const rateObj = rates.find((rt) => rt.type === fuelType);

      const marginPerL = rateObj?.dealerMarginPerLiter || 2.5;
      const margin = r.netSaleQty * marginPerL;
      const cost = r.netSaleQty * (rateObj?.dealerCostPerLiter || (r.rate - marginPerL));

      totalFuelCost += cost;
      totalFuelDealerMargin += margin;

      if (fuelByType[fuelType]) {
        fuelByType[fuelType].liters += r.netSaleQty;
        fuelByType[fuelType].revenue += r.totalAmount;
        fuelByType[fuelType].margin += margin;
      }
    });

    // 2. Lubricants Sales & Margins
    let totalLubeRevenue = 0;
    let totalLubeCost = 0;
    let totalLubeMargin = 0;
    let totalLubeUnits = 0;

    filteredData.lubeSales.forEach((s) => {
      totalLubeRevenue += s.totalAmount;
      totalLubeUnits += s.quantity;
      const product = lubricants.find((p) => p.id === s.productId);
      const cost = product ? product.purchaseCost * s.quantity : s.totalAmount * 0.8;
      totalLubeCost += cost;
      totalLubeMargin += s.totalAmount - cost;
    });

    // 3. Gross Turnover & Gross Margin
    const grossRevenue = totalFuelSalesAmount + totalLubeRevenue;
    const totalGrossProfit = totalFuelDealerMargin + totalLubeMargin;

    // 4. Operating Expenses
    const totalExpenses = filteredData.expenses.reduce((sum, e) => sum + e.amount, 0);

    const expensesByCategory: Record<string, number> = {};
    filteredData.expenses.forEach((e) => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });

    // 5. Net Business Profit
    const netStationProfit = totalGrossProfit - totalExpenses;
    const profitMarginPercentage = grossRevenue > 0 ? (netStationProfit / grossRevenue) * 100 : 0;

    // 6. Credit Slips Total
    const totalCreditSlips = filteredData.creditSlips.reduce((sum, s) => sum + s.totalAmount, 0);

    return {
      totalFuelLiters,
      totalFuelSalesAmount,
      totalFuelCost,
      totalFuelDealerMargin,
      fuelByType,
      totalLubeRevenue,
      totalLubeCost,
      totalLubeMargin,
      totalLubeUnits,
      grossRevenue,
      totalGrossProfit,
      totalExpenses,
      expensesByCategory,
      netStationProfit,
      profitMarginPercentage,
      totalCreditSlips,
    };
  }, [filteredData, nozzles, rates, lubricants]);

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = `PumpPro - Daily Sales & P&L Statement\n`;
    csv += `Station: ${settings.pumpName} (${settings.dealerBrand})\n`;
    csv += `Date Filter: ${dateFilter === 'custom' ? customDate : dateFilter}\n\n`;
    csv += `Summary Metrics\n`;
    csv += `Total Fuel Volume (Liters),${report.totalFuelLiters.toFixed(2)}\n`;
    csv += `Fuel Sales Revenue,${report.totalFuelSalesAmount.toFixed(2)}\n`;
    csv += `Fuel Dealer Commission Margin,${report.totalFuelDealerMargin.toFixed(2)}\n`;
    csv += `Lubricant Sales Revenue,${report.totalLubeRevenue.toFixed(2)}\n`;
    csv += `Lubricant Margin Profit,${report.totalLubeMargin.toFixed(2)}\n`;
    csv += `Gross Turnover,${report.grossRevenue.toFixed(2)}\n`;
    csv += `Total Operating Expenses,${report.totalExpenses.toFixed(2)}\n`;
    csv += `NET STATION PROFIT,${report.netStationProfit.toFixed(2)}\n\n`;

    csv += `Nozzle Readings Breakdown\n`;
    csv += `Nozzle,Opening,Closing,Testing,Net Liters,Rate,Amount\n`;
    filteredData.readings.forEach((r) => {
      const n = nozzles.find((noz) => noz.id === r.nozzleId);
      csv += `"${n?.name || r.nozzleId}",${r.openingReading},${r.closingReading},${r.testingQty},${r.netSaleQty},${r.rate},${r.totalAmount}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PumpPro_DSR_Report_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">
              Reports & Profit-Loss Statements
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Petroleum retail Daily Sales Register (DSR), dealer margins, lubricant profits, and net operational earnings.
          </p>
        </div>

        {/* Filter & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Date Filters */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                dateFilter === 'today'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                dateFilter === 'all'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                dateFilter === 'custom'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Date Select
            </button>
          </div>

          {dateFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl outline-hidden"
            />
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report (A4)</span>
          </button>
        </div>
      </div>

      {/* PRINT-READY REPORT CONTAINER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl space-y-6 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Printable Letterhead */}
        <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white print:text-black">
                {settings.pumpName}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 print:text-black print:border-black">
                {settings.dealerBrand} RO
              </span>
            </div>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
              RO Code: {settings.dealerCode} | GSTIN: {settings.gstNumber} | {settings.address}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Daily Sales Report (DSR) & P&L Statement
            </span>
            <span className="font-mono text-sm font-bold text-white print:text-black mt-0.5 block">
              Period: {dateFilter === 'custom' ? customDate : dateFilter.toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Generated: {new Date().toLocaleString()}
            </span>
          </div>
        </div>

        {/* Master Profit-Loss Card */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 print:bg-slate-50 print:border-slate-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 print:border-slate-300">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white print:text-black">
                Station Net Profit & Loss Summary
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              Net Margin: {report.profitMarginPercentage.toFixed(1)}% of Gross Sales
            </span>
          </div>

          {/* Core Numbers 4-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/40 print:bg-white p-3.5 rounded-xl border border-slate-800 print:border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Station Turnover
              </span>
              <div className="text-xl font-black font-mono text-white print:text-black mt-0.5">
                {sym}{report.grossRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Fuel + Lubricants combined
              </span>
            </div>

            <div className="bg-slate-800/40 print:bg-white p-3.5 rounded-xl border border-slate-800 print:border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Total Gross Margins
              </span>
              <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                {sym}{report.totalGrossProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Fuel Comm. + Lube Gross Profit
              </span>
            </div>

            <div className="bg-slate-800/40 print:bg-white p-3.5 rounded-xl border border-slate-800 print:border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block">
                Operating Expenses
              </span>
              <div className="text-xl font-black font-mono text-red-400 mt-0.5">
                {sym}{report.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Staff, Generator, Maintenance
              </span>
            </div>

            <div className="bg-emerald-500/10 print:bg-emerald-50 p-3.5 rounded-xl border border-emerald-500/30 print:border-emerald-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                NET STATION PROFIT
              </span>
              <div className="text-2xl font-black font-mono text-emerald-400 print:text-emerald-700 mt-0.5">
                {sym}{report.netStationProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
                Clear net operational income
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown: Fuel Margins vs Lubricant Margins */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fuel Sales & Margin by Grade */}
          <div className="bg-slate-950/40 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 print:border-slate-300">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white print:text-black">
                  Fuel Margins Breakdown (Dealer Commission)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-orange-400">
                {report.totalFuelLiters.toFixed(1)} Liters Total
              </span>
            </div>

            <div className="space-y-3">
              {Object.entries(report.fuelByType).map(([fKey, data]) => {
                if (data.liters === 0) return null;
                const rObj = rates.find((r) => r.type === fKey);

                return (
                  <div
                    key={fKey}
                    className="p-3 rounded-xl bg-slate-900 print:bg-white border border-slate-800 print:border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white print:text-black">{rObj?.name || fKey}</span>
                      <span className="font-mono text-slate-300 print:text-slate-800">
                        {data.liters.toFixed(1)} Liters
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Rate: {sym}{rObj?.ratePerLiter.toFixed(2)}/L</span>
                      <span>Total Revenue: {sym}{data.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60 print:border-slate-100 font-semibold text-emerald-400">
                      <span>Margin Rate: {sym}{rObj?.dealerMarginPerLiter.toFixed(2)}/L</span>
                      <span className="font-mono font-bold">
                        +{sym}{data.margin.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Commission
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-orange-500/10 print:bg-orange-50 border border-orange-500/20 text-xs flex items-center justify-between font-bold">
              <span className="text-orange-400 print:text-orange-800">
                Total Fuel Dealer Commission:
              </span>
              <span className="text-orange-400 print:text-orange-800 font-mono text-sm">
                {sym}{report.totalFuelDealerMargin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Lubricants Sales & Profit */}
          <div className="bg-slate-950/40 print:bg-slate-50 border border-slate-800 print:border-slate-300 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 print:border-slate-300">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white print:text-black">
                  Lubricants & Non-Fuel Profitability
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-sky-400">
                {report.totalLubeUnits} Units Sold
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900 print:bg-white border border-slate-800 print:border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Counter Retail Sales:</span>
                  <span className="font-mono font-bold text-white print:text-black">
                    {sym}{report.totalLubeRevenue.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Stock Purchase Cost of Goods:</span>
                  <span className="font-mono font-bold text-slate-300 print:text-slate-700">
                    -{sym}{report.totalLubeCost.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 print:border-slate-200 flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>Gross Profit from Lubricants:</span>
                  <span className="font-mono text-sm">
                    +{sym}{report.totalLubeMargin.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Expense Category Breakdown */}
              <div className="p-3 rounded-xl bg-slate-900 print:bg-white border border-slate-800 print:border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Operating Expenses Breakdown
                </span>
                {Object.entries(report.expensesByCategory).map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 print:text-slate-700">{cat}</span>
                    <span className="font-mono text-slate-400">
                      {sym}{amt.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-500/10 print:bg-sky-50 border border-sky-500/20 text-xs flex items-center justify-between font-bold">
              <span className="text-sky-400 print:text-sky-800">
                Total Lubricant Gross Margin:
              </span>
              <span className="text-sky-400 print:text-sky-800 font-mono text-sm">
                {sym}{report.totalLubeMargin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Individual Nozzle Reading Register Table for DSR Audit */}
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Nozzle-wise Meter Reading Log (Audit Trail)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {filteredData.readings.length} Recorded Entries
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar rounded-xl border border-slate-800 print:border-slate-300 -mx-1 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-800/80 print:bg-slate-100 text-slate-400 print:text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Dispenser Nozzle</th>
                  <th className="py-2.5 px-3">Fuel</th>
                  <th className="py-2.5 px-3">Opening</th>
                  <th className="py-2.5 px-3">Closing</th>
                  <th className="py-2.5 px-3">Testing</th>
                  <th className="py-2.5 px-3 text-right">Net Liters</th>
                  <th className="py-2.5 px-3 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3">Attendant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200 text-slate-300 print:text-slate-900">
                {filteredData.readings.map((r) => {
                  const nozzle = nozzles.find((n) => n.id === r.nozzleId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-850/50 print:hover:bg-transparent">
                      <td className="py-2 px-3 font-semibold text-white print:text-black">
                        {nozzle?.name || r.nozzleId}
                      </td>
                      <td className="py-2 px-3 uppercase text-[10px] font-bold text-slate-400">
                        {nozzle?.fuelType}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400">
                        {r.openingReading.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400">
                        {r.closingReading.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400">
                        {r.testingQty.toFixed(1)} L
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-emerald-400 print:text-emerald-700">
                        {r.netSaleQty.toFixed(2)} L
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-slate-400">
                        {sym}{r.rate.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-white print:text-black">
                        {sym}{r.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[11px]">
                        {r.recordedBy || 'DSM'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures Footer for Print/Audit */}
        <div className="pt-8 border-t border-slate-800 print:border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-400 print:text-slate-600">
          <div>
            <div className="h-10 border-b border-dashed border-slate-700 print:border-slate-400 mb-1" />
            <span>Duty Sales Master (DSM)</span>
          </div>
          <div>
            <div className="h-10 border-b border-dashed border-slate-700 print:border-slate-400 mb-1" />
            <span>Shift Manager</span>
          </div>
          <div>
            <div className="h-10 border-b border-dashed border-slate-700 print:border-slate-400 mb-1" />
            <span>Authorized RO Dealer Sign</span>
          </div>
        </div>
      </div>
    </div>
  );
};
