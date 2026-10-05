import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  QrCode,
  CreditCard,
  Building2,
  Sparkles,
  X,
  Zap,
  Clock,
  ArrowRight,
  FileText,
  BadgeCheck,
  CheckSquare,
  Square,
} from 'lucide-react';
import { PumpSubscription, PumpSettings, RegisteredPump } from '../types';
import { storage } from '../services/storage';

interface SubscriptionModalProps {
  subscription: PumpSubscription;
  settings: PumpSettings;
  registeredPumps?: RegisteredPump[];
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionUpdated: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  subscription,
  settings,
  registeredPumps = [],
  isOpen,
  onClose,
  onSubscriptionUpdated,
}) => {
  const sym = settings.currencySymbol;
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMode, setPaymentMode] = useState<'UPI / QR' | 'Credit / Debit Card' | 'Net Banking'>('UPI / QR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected Pump IDs (All registered pumps checked by default)
  const [selectedPumpIds, setSelectedPumpIds] = useState<string[]>(
    registeredPumps.length > 0 ? registeredPumps.map((p) => p.id) : ['pump-01']
  );

  const togglePumpSelection = (pumpId: string) => {
    setSelectedPumpIds((prev) => {
      if (prev.includes(pumpId)) {
        if (prev.length <= 1) return prev; // Keep at least one pump selected
        return prev.filter((id) => id !== pumpId);
      } else {
        return [...prev, pumpId];
      }
    });
  };

  // Pricing math: Multiple pumps connect = Base ₹999 + ₹999 for EACH pump!
  const ratePerPump = billingCycle === 'monthly' ? 999 : 9990;
  const pumpCount = selectedPumpIds.length;
  const totalAmount = pumpCount * ratePerPump;

  if (!isOpen) return null;

  const features = [
    'Unlimited Daily Nozzle Readings & Auto-Volume Calculation',
    'Lubricant, Engine Oil & DEF Stock Inventory Management',
    'Fleet Customer Credit Indent Slips & Payment Ledger',
    'Shift Cash Drawer Reconciliation & Currency Note Counter',
    'Automated Daily Sales Report (DSR) & P&L Margins',
    'Underground Fuel Tanks Dip Level Calibration',
    'Thermal Slip & Formal GST Invoice Printing',
    'Centralized Multi-Station Management & Data Sync',
  ];

  const handlePayAndActivate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const txId = `TXN-PUMPPRO-${Date.now().toString().slice(-8)}`;
      storage.renewSubscription(billingCycle, paymentMode as any, txId, selectedPumpIds);
      setIsProcessing(false);
      setSuccessMsg(
        `সফলভাৱে সক্ৰিয় হ'ল! ${pumpCount} টা পেট্ৰ'ল পাম্পৰ বাবে ${
          billingCycle === 'monthly' ? `মাহিলী ₹${totalAmount}` : `বাৰ্ষিক ₹${totalAmount}`
        } ৰ চাবস্ক্ৰিপচন সক্ৰিয় কৰা হৈছে!`
      );
      onSubscriptionUpdated();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-2xl p-4 sm:p-6 lg:p-8 shadow-2xl space-y-4 sm:space-y-6 my-auto relative max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Commercial Petrol Pump SaaS Plan</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            PumpPro Commercial Subscription
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            প্ৰতিটো পেট্ৰ’ল পাম্পৰ বাবে মাত্ৰ <strong>₹৯৯৯/মাহে</strong> — Multiple পাম্প যোগ হ'লে প্ৰতিটো পাম্পৰ বাবদ ₹৯৯৯ যোগ হ'ব।
          </p>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Billing Cycle Switcher */}
        <div className="flex justify-center">
          <div className="bg-slate-800 p-1.5 rounded-2xl border border-slate-700 flex items-center gap-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-black transition ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Plan (₹999 / pump / month)
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-xs font-black transition relative ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual Plan (₹9,990 / pump / yr)
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-emerald-500 text-white font-extrabold uppercase">
                Save 2 Mo
              </span>
            </button>
          </div>
        </div>

        {/* MULTIPLE PUMP SELECTOR WITH PER-PUMP BILLING BREAKDOWN */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-orange-400" />
              <span>Select Petrol Pumps to License ({pumpCount} Selected)</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-orange-400">
              ₹{ratePerPump} / station
            </span>
          </div>

          <div className="space-y-2">
            {registeredPumps.map((pump) => {
              const isSelected = selectedPumpIds.includes(pump.id);
              return (
                <div
                  key={pump.id}
                  onClick={() => togglePumpSelection(pump.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? 'bg-orange-500/10 border-orange-500/50 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{pump.stationName}</span>
                        {pump.isActive && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active RO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {pump.oilCompany} • RO: {pump.roCode} • {pump.district}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-orange-400">
                    +{sym}{ratePerPump.toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Dynamic Plus Formula Summary Box */}
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="text-slate-400">
              <span className="text-slate-300 font-bold block">Formula Breakdown:</span>
              <span>
                {pumpCount} Petrol Pump{pumpCount > 1 ? 's' : ''} &times; {sym}{ratePerPump} ={' '}
                <strong className="text-orange-400 font-mono text-sm">
                  {sym}{totalAmount.toLocaleString('en-IN')}
                </strong>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-emerald-400 font-bold block">
                {pumpCount > 1 ? 'Multi-Pump Consolidated Billing' : 'Single Station Billing'}
              </span>
              <span className="text-[11px] text-slate-400">
                All pumps included in single dashboard
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Card Details */}
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">PumpPro Multi-Pump License</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {pumpCount} STATIONS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Total monthly SaaS subscription for your network
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-orange-400 font-mono">
                  {sym}{totalAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  / {billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                {pumpCount} &times; ₹{ratePerPump} (Inclusive of 18% GST)
              </span>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 text-xs">
            {features.slice(0, 6).map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-[11px] leading-snug">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 block">
            Select Payment Method (পেমেন্ট পদ্ধতি বাচক)
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setPaymentMode('UPI / QR')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                paymentMode === 'UPI / QR'
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400 ring-2 ring-orange-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>UPI / QR Code</span>
              <span className="text-[9px] text-slate-400">GPay, PhonePe, Paytm</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('Credit / Debit Card')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                paymentMode === 'Credit / Debit Card'
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400 ring-2 ring-orange-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Debit / Card</span>
              <span className="text-[9px] text-slate-400">Visa, RuPay, Master</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('Net Banking')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                paymentMode === 'Net Banking'
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400 ring-2 ring-orange-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Net Banking</span>
              <span className="text-[9px] text-slate-400">SBI, HDFC, ICICI, etc.</span>
            </button>
          </div>
        </div>

        {/* UPI QR Display if Selected */}
        {paymentMode === 'UPI / QR' && (
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">
                Scan & Pay {sym}{totalAmount.toLocaleString('en-IN')}
              </span>
              <p className="text-[11px] text-slate-400">
                Single consolidated UPI payment for {pumpCount} station{pumpCount > 1 ? 's' : ''}
              </p>
              <span className="font-mono text-xs text-orange-400 font-bold block pt-0.5">
                UPI ID: pumppro.billing@icici
              </span>
            </div>
            <div className="p-2 bg-white rounded-xl shadow-md flex-shrink-0">
              <div className="w-16 h-16 bg-slate-900 p-1 rounded-lg flex items-center justify-center text-white text-[9px] font-mono text-center">
                [UPI QR]
                <br />
                {sym}{totalAmount}
              </div>
            </div>
          </div>
        )}

        {/* Activation Button */}
        <div className="pt-1">
          <button
            onClick={handlePayAndActivate}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/30 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Activating {pumpCount} Station Plan...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>
                  Pay {sym}{totalAmount.toLocaleString('en-IN')} for {pumpCount} Station{pumpCount > 1 ? 's' : ''} ({billingCycle === 'monthly' ? '₹999/mo each' : '₹9,990/yr each'})
                </span>
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Encrypted • Multi-Pump Consolidated GST Tax Invoice • Instant Activation</span>
          </div>

          {/* Test Auto-Lock Simulation Button */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs mt-3">
            <span className="text-slate-400">Lock Testing (পৰীক্ষা):</span>
            <button
              type="button"
              onClick={() => {
                if (confirm('পাম্পপ্ৰ’ চাবস্ক্ৰিপচনৰ ম্যাদ শেষ কৰি অটো-লক পৰীক্ষা কৰিব বিচাৰে নেকি? (Simulate subscription expiry & auto-lock?)')) {
                  storage.expireSubscriptionForTesting();
                  onSubscriptionUpdated();
                  onClose();
                }
              }}
              className="text-xs text-red-400 hover:text-red-300 font-bold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              ⚠️ Simulate Expiry & Auto-Lock (অটো-লক পৰীক্ষা)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
