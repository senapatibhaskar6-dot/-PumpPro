import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  CheckCircle2,
  QrCode,
  CreditCard,
  Building2,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  FileText,
  BadgeCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { PumpProLogo } from './PumpProLogo';
import { PumpSubscription, PumpSettings } from '../types';
import { storage } from '../services/storage';

interface SubscriptionLockScreenProps {
  subscription: PumpSubscription;
  settings: PumpSettings;
  onUnlocked: () => void;
}

export const SubscriptionLockScreen: React.FC<SubscriptionLockScreenProps> = ({
  subscription,
  settings,
  onUnlocked,
}) => {
  const sym = settings.currencySymbol || '₹';
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMode, setPaymentMode] = useState<'UPI / QR' | 'Credit / Debit Card' | 'Net Banking'>('UPI / QR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const amount = billingCycle === 'monthly' ? 999 : 9990;
  const validityText = billingCycle === 'monthly' ? '30 Days Access' : '365 Days Access (2 Months FREE)';

  const handlePayAndUnlock = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const txId = `TXN-PUMPPRO-${Date.now().toString().slice(-8)}`;
      storage.renewSubscription(billingCycle, paymentMode, txId, [subscription.registeredPumpId || 'pump-01']);
      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        onUnlocked();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-8 px-3 sm:px-6 relative overflow-x-hidden selection:bg-orange-500 selection:text-white">
      {/* Background Warning Glows */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-2xl space-y-6">
        {/* Brand Header & Lock Icon */}
        <div className="text-center space-y-2">
          <div className="flex justify-center items-center">
            <PumpProLogo size="lg" />
          </div>

          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-xs sm:text-sm font-extrabold shadow-lg shadow-red-500/20 animate-pulse">
              <Lock className="w-4 h-4 text-red-400" />
              <span>পাম্পপ্ৰ’ এক্সেছ লক হৈছে • Subscription Expired & Locked</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Station Access Automatically Locked
          </h1>

          {/* Current Station Info */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold">
            <Building2 className="w-3.5 h-3.5 text-orange-400" />
            <span>{settings.pumpName}</span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-orange-400">{settings.dealerCode}</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            আপোনাৰ পেট্ৰল পাম্পৰ মাহেকীয়া / বাৰ্ষিক সেৱাৰ ম্যাদ শেষ হৈছে। ডেশ্ব’ৰ্ড, মিটাৰ এণ্ট্ৰী আৰু টেংক মজুত এক্সেছ কৰিবলৈ অনুগ্ৰহ কৰি তলৰ যিকোনো এটা প্লেন বাছি পেমেণ্ট কৰক আৰু তৎক্ষণাত আনলক কৰক।
          </p>
        </div>

        {/* Success Modal / State */}
        {isSuccess ? (
          <div className="bg-emerald-500/15 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-2xl shadow-emerald-500/20 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <Unlock className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-white">পেমেণ্ট সফল হৈছে! (Payment Successful)</h3>
            <p className="text-xs sm:text-sm text-emerald-300">
              Subscription renewed for {validityText}. Unlocking your station dashboard...
            </p>
            <div className="text-[11px] text-slate-400 font-mono">
              Tax Invoice Generated • PumpTally Commercial Plan Active
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step 1: Choose Monthly or Yearly Plan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Monthly Plan Card */}
              <div
                onClick={() => setBillingCycle('monthly')}
                className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-slate-900 border-orange-500 shadow-xl shadow-orange-500/15 ring-2 ring-orange-500/20'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    মাহেকীয়া প্লেন • Monthly
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      billingCycle === 'monthly'
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-slate-600'
                    }`}
                  >
                    {billingCycle === 'monthly' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-white">{sym}999</span>
                  <span className="text-xs text-slate-400">/ মাহে (30 Days)</span>
                </div>

                <p className="text-[11px] text-slate-400 mt-2">
                  Flexible pay-as-you-go plan. Renew monthly without long-term commitment.
                </p>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>Full Station Features + Reports</span>
                </div>
              </div>

              {/* Yearly Plan Card */}
              <div
                onClick={() => setBillingCycle('annual')}
                className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-slate-900 border-sky-500 shadow-xl shadow-sky-500/15 ring-2 ring-sky-500/20'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-black text-[9px] uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                  ⭐ 2 Months Free (Save 17%)
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                    বাৰ্ষিক প্লেন • Yearly Best Value
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      billingCycle === 'annual'
                        ? 'border-sky-500 bg-sky-500'
                        : 'border-slate-600'
                    }`}
                  >
                    {billingCycle === 'annual' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-white">{sym}9,990</span>
                  <span className="text-xs text-slate-400">/ বছৰি (365 Days)</span>
                </div>

                <p className="text-[11px] text-slate-400 mt-2">
                  Complete peace of mind for 1 full year. Zero monthly renewal hassle.
                </p>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] text-sky-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>365 Days Uninterrupted Access</span>
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Select Payment Method (পেমেণ্টৰ মাধ্যম)</span>
                <span className="text-[11px] text-emerald-400 font-medium">Instant Automatic Unlock</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI / QR')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    paymentMode === 'UPI / QR'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('Credit / Debit Card')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    paymentMode === 'Credit / Debit Card'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('Net Banking')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    paymentMode === 'Net Banking'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Net Banking</span>
                </button>
              </div>

              {/* Dynamic QR preview if UPI is selected */}
              {paymentMode === 'UPI / QR' && (
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
                      <QrCode className="w-8 h-8 text-slate-950" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Scan & Pay via any UPI App</div>
                      <div className="text-[10px] text-slate-400">Google Pay • PhonePe • Paytm • BHIM UPI</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-orange-400 text-sm">{sym}{amount}</span>
                </div>
              )}
            </div>

            {/* Step 3: Big Pay & Unlock Action Button */}
            <div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePayAndUnlock}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 transition cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>পেমেণ্ট পৰীক্ষা কৰা হৈছে... (Verifying Payment...)</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5" />
                    <span>
                      {sym}{amount.toLocaleString()} পেমেণ্ট সম্পন্ন কৰক আৰু আনলক কৰক (Pay & Unlock Now)
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Security & Commercial Invoicing Note */}
        <div className="text-center space-y-1 text-[11px] text-slate-500">
          <p>
            PumpTally OS Commercial Security • Automatic GST Tax Invoice generated on payment confirmation.
          </p>
          <p>
            Supports Multi-Pump Retail Outlets & 24×7 Highway Fuel Dispensation.
          </p>
        </div>
      </div>
    </div>
  );
};
