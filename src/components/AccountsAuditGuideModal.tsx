import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Fuel,
  Package,
  Users,
  Receipt,
  Scale,
  BarChart3,
  SlidersHorizontal,
  ArrowRight,
  X,
  Sparkles,
  Calculator,
  Droplet,
  Banknote,
  QrCode,
  Check,
  Info,
} from 'lucide-react';
import {
  PumpSettings,
  FuelRate,
  Nozzle,
  NozzleReading,
  TankStock,
  LubricantProduct,
  LubricantSale,
  CustomerCreditAccount,
  CreditIndentSlip,
  ExpenseRecord,
} from '../types';

interface AccountsAuditGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PumpSettings;
  rates: FuelRate[];
  nozzles: Nozzle[];
  readings: NozzleReading[];
  tanks: TankStock[];
  lubricants: LubricantProduct[];
  lubeSales: LubricantSale[];
  customers: CustomerCreditAccount[];
  creditSlips: CreditIndentSlip[];
  expenses: ExpenseRecord[];
  activeShift: string;
  onNavigate: (tab: string) => void;
}

export const AccountsAuditGuideModal: React.FC<AccountsAuditGuideModalProps> = ({
  isOpen,
  onClose,
  settings,
  rates,
  nozzles,
  readings,
  tanks,
  lubricants,
  lubeSales,
  customers,
  creditSlips,
  expenses,
  activeShift,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'guide'>('audit');
  const sym = settings.currencySymbol;

  if (!isOpen) return null;

  // Real-time live audit calculations
  const totalFuelSales = readings.reduce((acc, r) => acc + r.totalAmount, 0);
  const totalFuelLiters = readings.reduce((acc, r) => acc + r.netSaleQty, 0);
  const totalLubeSales = lubeSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const grossSales = totalFuelSales + totalLubeSales;

  const totalCreditGiven = creditSlips.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Expected counter cash = Gross Sales - Credit Slips - Station Cash Expenses
  const expectedCounterCash = Math.max(0, grossSales - totalCreditGiven - totalExpenses);

  // Verification checks
  const hasNozzleReadings = readings.length > 0;
  const zeroTestingQtyCheck = readings.every((r) => r.testingQty >= 0);
  const totalTankVolume = tanks.reduce((acc, t) => acc + t.currentVolumeLiters, 0);
  const totalTankCapacity = tanks.reduce((acc, t) => acc + t.capacityLiters, 0);
  const tankCapacityPercent = totalTankCapacity > 0 ? (totalTankVolume / totalTankCapacity) * 100 : 0;

  const steps = [
    {
      num: 1,
      titleAssamese: 'ইন্ধনৰ ক্ৰয়-বিক্ৰী আৰু নতুন ৰেট আপডেট (Fuel Rates)',
      titleEnglish: 'Update Fuel Selling & Purchase Rates',
      tab: 'settings',
      descriptionAssamese:
        'তেল কোম্পানীয়ে যেতিয়া পেট্ৰ’ল বা ডিজেলৰ দাম সলনি কৰে, "Settings & Rates" টেবত গৈ নতুন Selling Rate আৰু Dealer Cost আপডেট কৰক। চিস্টেমে আপোনাৰ প্ৰতি লিটাৰৰ মাৰ্জিন নিজে গণনা কৰিব।',
      descriptionEnglish:
        'Whenever oil companies revise fuel rates, enter the revised Dealer Cost and Retail Selling Price in the Rates tab. PumpPro automatically calculates dealer margins per liter.',
      statusText: `${rates.length} টা ইন্ধন সক্ৰিয় আছে (Petrol, Diesel, Premium)`,
      isDone: rates.length > 0,
    },
    {
      num: 2,
      titleAssamese: 'দৈনিক নজল মিটাৰ ৰিডিং ভৰোৱা (Daily Nozzle Readings)',
      titleEnglish: 'Record Nozzle Opening, Closing & Testing Liters',
      tab: 'readings',
      descriptionAssamese:
        'প্ৰতিটো নজলৰ পুৱা/আবেলিৰ আৰম্ভণি মিটাৰ (Opening Meter) আৰু শেষৰ মিটাৰ (Closing Meter) লিখক। টেষ্টিং তেল (Testing Qty) ঢালিলে সেইটো দিয়ক। চিস্টেমে নিজেই (Closing - Opening - Testing) কৰি মুঠ লিটাৰ আৰু বিক্ৰীৰ টকা উলিয়াব।',
      descriptionEnglish:
        'Enter Opening & Closing meter readings for each dispenser nozzle. Testing fuel poured back is deducted automatically to compute Net Sale Liters & Revenue.',
      statusText: `${readings.length} টা নজলৰ ৰিডিং এণ্ট্ৰি হৈছে (মুঠ: ${totalFuelLiters.toFixed(1)} L)`,
      isDone: hasNozzleReadings,
    },
    {
      num: 3,
      titleAssamese: 'মবিল আৰু AdBlue (DEF) মজুত আৰু বিক্ৰী (Lubricants & Non-Fuel)',
      titleEnglish: 'Manage Lubricants, Coolants & Counter Sales',
      tab: 'lubricants',
      descriptionAssamese:
        'ষ্টকলৈ নতুন মবিল আহিলে "Purchase / Stock-In" কৰক। কাউন্টাৰত ক্ৰেতাক বিক্ৰী কৰাৰ সময়ত "Sell Product" ত ক্লিক কৰি কেচ বা UPI বাবে এণ্ট্ৰি কৰক। ষ্টক নিজে কমি যাব।',
      descriptionEnglish:
        'Receive stock when oil supplies arrive. Record counter sales (Cash/UPI/Credit); stock is automatically decremented with low-stock alerts.',
      statusText: `${lubricants.length} টা মবিল প্ৰডাক্ট আছে (${totalLubeSales > 0 ? `বিক্ৰী: ${sym}${totalLubeSales}` : 'বিক্ৰী বাকী'})`,
      isDone: lubricants.length > 0,
    },
    {
      num: 4,
      titleAssamese: 'বাকী খাতা আৰু গাড়ীৰ ইণ্ডেণ্ট স্লিপ (Credit / Fleet Due Ledger)',
      titleEnglish: 'Issue Credit Slips & Collect Fleet Payments',
      tab: 'credit',
      descriptionAssamese:
        'যদি কোনো গাড়ী বা ট্ৰাকে বাকীত তেল লয়, গাড়ীৰ নম্বৰ আৰু স্লিপ নম্বৰ দি "Issue Credit Slip" কাটিব। পাৰ্টিয়ে যেতিয়া টকা জমা দিব, "Collect Payment" ত জমা কৰক।',
      descriptionEnglish:
        'Generate digital credit indent slips with vehicle numbers. Outstanding balances update in real-time, and settlement entries log when dues are cleared.',
      statusText: `${creditSlips.length} খন ক্ৰেডিট স্লিপ জাৰি কৰা হৈছে (মুঠ: ${sym}${totalCreditGiven})`,
      isDone: creditSlips.length > 0,
    },
    {
      num: 5,
      titleAssamese: 'দৈনিক খৰচ এণ্ট্ৰি (Daily Station Expenses)',
      titleEnglish: 'Log Shift Staff & Operating Expenses',
      tab: 'reconciliation',
      descriptionAssamese:
        'কৰ্মচাৰীৰ চাহ-জলপান, জেনেৰেটৰ ডিজেল, বিজুলী বিল বা ষ্টেচনাৰী আদি খৰচ এণ্ট্ৰি কৰক যাতে কাউন্টাৰৰ কেচৰ লগত সম্পূৰ্ণ খাপ খায়।',
      descriptionEnglish:
        'Log shift staff refreshments, generator fuel, electricity, and maintenance so expected drawer cash aligns perfectly.',
      statusText: `${expenses.length} টা খৰচ এণ্ট্ৰি কৰা হৈছে (মুঠ: ${sym}${totalExpenses})`,
      isDone: expenses.length > 0,
    },
    {
      num: 6,
      titleAssamese: 'কেচ ড্ৰয়াৰ আৰু শ্বিফ্ট মিলাওক (Shift Cash Reconciliation & Tally)',
      titleEnglish: 'Match Physical Notes & UPI Collections with Sales',
      tab: 'reconciliation',
      descriptionAssamese:
        'হাতত থকা ৫০০, ২০০, ১০০ টকীয়া নোট গণনা কৰি বহুৱাওক আৰু GooglePay/PhonePe/QR ৰ টকা দিয়ক। চিস্টেমে হিচাপ কৰি দেখুৱাব কোনো ঘাটতি (Shortage) বা অতিৰিক্ত (Excess) হৈছে নে নাই!',
      descriptionEnglish:
        'Input denomination note counts (500, 200, 100) and UPI/card sums. PumpPro immediately computes exact drawer variance (Zero Shortage validation).',
      statusText: `মুঠ বাকী থকা কেচ প্ৰত্যাশা: ${sym}${expectedCounterCash.toFixed(0)}`,
      isDone: true,
    },
    {
      num: 7,
      titleAssamese: 'দৈনিক বিক্ৰী ৰিপোৰ্ট (DSR) আৰু লাভৰ খতিয়ান (Daily Sales Report & P&L)',
      titleEnglish: 'View Daily Sales Report & Net Profit Margins',
      tab: 'reports',
      descriptionAssamese:
        'দিনটোৰ শেষত "Reports & P&L" লৈ গৈ সম্পূৰ্ণ DSR শ্বীট আৰু আপোনাৰ ব্যৱসায়ৰ নেট লাভ (Net Profit) চাওক আৰু প্ৰিণ্ট বা Excel লৈ ডাউনলোড কৰক।',
      descriptionEnglish:
        'Inspect the official Daily Sales Report (DSR), combining fuel dealer margins and lubricant profits minus operating expenses.',
      statusText: 'প্ৰিণ্ট-ৰেডী DSR আৰু P&L উপলব্ধ',
      isDone: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-3xl p-4 sm:p-6 lg:p-8 shadow-2xl space-y-4 sm:space-y-6 my-auto relative max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>হিচাপ পৰীক্ষা আৰু আপডেট সহায়িকা • Accounts Audit & Verification</span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            হিচাপ ক'ত, কেনেকৈ আপডেট কৰিব আৰু ঠিকে আছে নে চাওক
          </h2>
          <p className="text-xs text-slate-400">
            PumpPro ত আপোনাৰ পেট্ৰ’ল পাম্পৰ নজল ৰিডিং, মবিলৰ মজুত, বাকী খাতা আৰু কেচ ড্ৰয়াৰ ১০০% নিৰ্ভুলভাৱে পৰিচালনা কৰাৰ সম্পূৰ্ণ নিৰ্দেশনা।
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Live Audit & Health Check (হিচাপ পৰীক্ষা)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Step-by-Step Update Guide (ক'ত কি আপডেট কৰিব)</span>
          </button>
        </div>

        {/* TAB 1: LIVE AUDIT & CALCULATION HEALTH CHECK */}
        {activeTab === 'audit' && (
          <div className="space-y-5">
            {/* Live Calculation Flow Box */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  <span>Station Math Equation • হিচাপৰ সমীকৰণ</span>
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Shift: {activeShift}
                </span>
              </div>

              {/* Math breakdown cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                    + Fuel Sales (তেল)
                  </span>
                  <span className="text-base font-black text-white font-mono block mt-1">
                    {sym}{totalFuelSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {totalFuelLiters.toFixed(1)} Liters
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                    + Lube Sales (মবিল)
                  </span>
                  <span className="text-base font-black text-sky-400 font-mono block mt-1">
                    {sym}{totalLubeSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {lubeSales.length} Transactions
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-amber-400 font-semibold uppercase block">
                    - Credit Slips (বাকী)
                  </span>
                  <span className="text-base font-black text-amber-400 font-mono block mt-1">
                    {sym}{totalCreditGiven.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {creditSlips.length} Indents Issued
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-rose-400 font-semibold uppercase block">
                    - Expenses (খৰচ)
                  </span>
                  <span className="text-base font-black text-rose-400 font-mono block mt-1">
                    {sym}{totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {expenses.length} Entries
                  </span>
                </div>
              </div>

              {/* Net Expected Drawer Cash Highlight */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4" />
                    <span>Expected Net Cash in Hand / UPI (কাউন্টাৰত পাবলগীয়া টকা):</span>
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    মুঠ বিক্ৰী ({sym}{grossSales.toLocaleString('en-IN')}) - বাকী স্লিপ ({sym}{totalCreditGiven.toLocaleString('en-IN')}) - খৰচ ({sym}{totalExpenses.toLocaleString('en-IN')})
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {sym}{expectedCounterCash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Checklist of Real-Time Checks */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                স্বয়ংক্রিয় পৰীক্ষা আৰু শুদ্ধতা অডিট (Zero-Discrepancy Checkpoints)
              </h3>

              <div className="space-y-2">
                {/* Checkpoint 1: Meter Readings entered */}
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {hasNozzleReadings ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-white block">
                        ১. নজল মিটাৰ ৰিডিং সম্পূৰ্ণ আছে নে?
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {hasNozzleReadings
                          ? `সকলো নজলৰ ৰিডিং ভৰোৱা হৈছে (${readings.length} Nozzles recorded)`
                          : 'নজল ৰিডিং ভৰোৱা হোৱা নাই। অনুগ্ৰহ কৰি Daily Readings লৈ যাওক।'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('readings');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    নজল ৰিডিং চাওক →
                  </button>
                </div>

                {/* Checkpoint 2: Tank Stock Levels */}
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        ২. মাটিত থকা টেংকৰ তেলৰ লেভেল (Underground Tank Dips)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        মুঠ টেংক মজুত: {totalTankVolume.toLocaleString()} L / {totalTankCapacity.toLocaleString()} L ({tankCapacityPercent.toFixed(0)}% ভৰ্তি)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('settings');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    Dip আপডেট কৰক →
                  </button>
                </div>

                {/* Checkpoint 3: Cash Tally Discrepancy */}
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        ৩. কেচ ড্ৰয়াৰ আৰু জমা টকাৰ মিল (Cash Tally Match)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        শ্বিফ্ট ৰেকনচিলিয়েচনত নগদ নোট আৰু UPI টকা বহাই চাব পাৰে কোনো টকা ঘাটতি হৈছে নে নাই।
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('reconciliation');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    নগদ টকা মিলাওক →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STEP-BY-STEP UPDATE GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
              💡 <strong>সহজ নিয়ম:</strong> পাম্পৰ প্ৰতিটো কামৰ বাবে নিৰ্দিষ্ট টেব বনোৱা আছে। তলৰ প্ৰতিটো পদক্ষেপ পঢ়ক আৰু পোনপটীয়াকৈ সেই টেবত গৈ হিচাপ আপডেট কৰক।
            </div>

            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.num}
                  className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {step.num}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{step.titleAssamese}</h4>
                        <span className="text-[11px] text-slate-400">{step.titleEnglish}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onNavigate(step.tab);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-400 font-bold text-xs shrink-0 cursor-pointer transition active:scale-95 flex items-center gap-1"
                    >
                      <span>আপডেট কৰক</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-9">
                    {step.descriptionAssamese}
                  </p>

                  <div className="pl-9 pt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-semibold text-sky-400">বৰ্তমান স্থিতি:</span>
                    <span>{step.statusText}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            প্ৰশ্ন বা কাৰিকৰী সহায়ৰ বাবে: <strong>+91 98200 44555</strong>
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            বুজি পালোঁ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
