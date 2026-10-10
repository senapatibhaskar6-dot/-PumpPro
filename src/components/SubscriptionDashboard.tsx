import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Plus,
  RefreshCw,
  Zap,
  ShieldCheck,
  AlertCircle,
  FileText,
  Phone,
  Layers,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { PumpSubscription, RegisteredPump, PumpSettings } from '../types';
import { storage } from '../services/storage';

interface SubscriptionDashboardProps {
  subscription: PumpSubscription;
  registeredPumps: RegisteredPump[];
  settings: PumpSettings;
  onOpenUpgradeModal: () => void;
  onOpenRegisterPumpModal: () => void;
  onRefreshData: () => void;
}

export const SubscriptionDashboard: React.FC<SubscriptionDashboardProps> = ({
  subscription,
  registeredPumps,
  settings,
  onOpenUpgradeModal,
  onOpenRegisterPumpModal,
  onRefreshData,
}) => {
  const sym = settings.currencySymbol;
  const [activeTab, setActiveTab] = useState<'subscription' | 'stations' | 'invoices'>('subscription');

  const handleSwitchPump = (pumpId: string) => {
    storage.switchActivePump(pumpId);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">
              Subscription & Pump Registration (SaaS Portal)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            প্ৰতি মাহে মাত্ৰ ₹৯৯৯ ত আপোনাৰ পেট্ৰ’ল পাম্পৰ ডিজিটেল পৰিচালনা, নজল ৰিডিং, মবিল আৰু বাকী খাতা ব্যৱস্থাপনা।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (confirm('পাম্পপ্ৰ’ চাবস্ক্ৰিপচনৰ ম্যাদ শেষ কৰি অটো-লক পৰীক্ষা কৰিব বিচাৰে নেকি? (Simulate subscription expiry & auto-lock?)')) {
                storage.expireSubscriptionForTesting();
                onRefreshData();
              }
            }}
            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer"
            title="Simulate Subscription Expiration & Test Auto-Lock"
          >
            <Lock className="w-4 h-4 text-red-400" />
            <span>Test Auto-Lock (লক পৰীক্ষা)</span>
          </button>

          <button
            onClick={onOpenRegisterPumpModal}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Register New Pump (নতুন পাম্প)</span>
          </button>

          <button
            onClick={onOpenUpgradeModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Renew Plan ({sym}{subscription.totalMonthlyAmount}/mo for {registeredPumps.length} Pumps)</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'subscription'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Active Subscription Plan ({sym}{subscription.totalMonthlyAmount}/mo)</span>
        </button>

        <button
          onClick={() => setActiveTab('stations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'stations'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Registered Petrol Pumps ({registeredPumps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Payment Invoices & Receipts</span>
        </button>
      </div>

      {/* TAB 1: SUBSCRIPTION STATUS */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Active Plan Big Highlight Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PLAN STATUS: ACTIVE (সক্ৰিয়)</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300">
                    {registeredPumps.length} Pumps Licensed
                  </span>
                </div>

                <h2 className="text-3xl font-black text-white mt-2 tracking-tight">
                  {subscription.planName}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Active Station: <strong className="text-white">{subscription.pumpName}</strong> • Owner:{' '}
                  <strong className="text-slate-200">{subscription.ownerName}</strong>
                </p>
              </div>

              <div className="text-left md:text-right">
                <div className="text-4xl font-black text-orange-400 font-mono tracking-tight">
                  {sym}{subscription.totalMonthlyAmount.toLocaleString('en-IN')}
                  <span className="text-xs text-slate-400 font-semibold font-sans"> / month</span>
                </div>
                <span className="text-xs text-slate-300 font-bold block mt-0.5">
                  {registeredPumps.length} Stations &times; {sym}999 / pump / month
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Next Renewal Date:{' '}
                  <strong className="text-white font-mono">{subscription.renewalDate}</strong>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 block mt-0.5">
                  {subscription.daysRemaining} days remaining in current period
                </span>
              </div>
            </div>

            {/* Quick Metrics 4-Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Price Per Station
                </span>
                <div className="text-lg font-black text-white font-mono">
                  {sym}999 / Station / Mo
                </div>
                <span className="text-[10px] text-slate-500">Adds ₹999 for each extra pump</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Billing Cycle
                </span>
                <div className="text-lg font-black text-white capitalize">
                  {subscription.billingCycle}
                </div>
                <span className="text-[10px] text-slate-500">Auto-Renewal Active</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Registered Stations
                </span>
                <div className="text-lg font-black text-sky-400 font-mono">
                  {registeredPumps.length} Pumps
                </div>
                <span className="text-[10px] text-slate-500">Centralized Dashboard</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Customer Support
                </span>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  24x7 Priority
                </div>
                <span className="text-[10px] text-slate-500">+91 98200 44555 Support</span>
              </div>
            </div>

            {/* Commercial Value Pitch */}
            <div className="mt-6 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>PumpTally Commercial SaaS Guarantee</span>
                </span>
                <p className="text-xs text-slate-300">
                  Save hours of manual register bookkeeping every single day. Accurate meter sales, automated credit indents, and zero cash discrepancy.
                </p>
              </div>

              <button
                onClick={onOpenUpgradeModal}
                className="py-2.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition whitespace-nowrap active:scale-95 cursor-pointer"
              >
                Renew / Extend Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTERED PETROL PUMPS (MULTI-STATION) */}
      {activeTab === 'stations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Your Registered Petrol Pump Network</h2>
              <p className="text-xs text-slate-400">
                You can manage multiple pump stations under one account and switch between them anytime.
              </p>
            </div>

            <button
              onClick={onOpenRegisterPumpModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Another Station</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registeredPumps.map((pump) => (
              <div
                key={pump.id}
                className={`bg-slate-900 border rounded-3xl p-5 shadow-lg space-y-4 transition ${
                  pump.isActive
                    ? 'border-orange-500/60 ring-2 ring-orange-500/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      {pump.oilCompany}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">RO: {pump.roCode}</span>
                  </div>

                  {pump.isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>CURRENTLY ACTIVE</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitchPump(pump.id)}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition"
                    >
                      Switch to This Station
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-black text-white">{pump.stationName}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {pump.address} • {pump.district}, {pump.state}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-slate-800">
                  <div className="p-2 rounded-xl bg-slate-800/40">
                    <span className="text-[10px] text-slate-400 block">Nozzles</span>
                    <span className="font-mono font-bold text-white">{pump.nozzlesCount} Nozzles</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/40">
                    <span className="text-[10px] text-slate-400 block">Tanks</span>
                    <span className="font-mono font-bold text-white">{pump.tanksCount} Tanks</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/40">
                    <span className="text-[10px] text-slate-400 block">Plan</span>
                    <span className="font-mono font-bold text-emerald-400">{sym}999/mo</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Owner: <strong className="text-slate-200">{pump.ownerName}</strong> ({pump.ownerPhone})</span>
                  <span>GSTIN: {pump.gstin}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INVOICES & TAX RECEIPTS */}
      {activeTab === 'invoices' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Subscription Payment Invoices</h2>
              <p className="text-xs text-slate-400">
                Download official GST invoices for tax deduction and station accounting.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Plan Description</th>
                  <th className="py-3 px-3">Billing Period</th>
                  <th className="py-3 px-3">Payment Mode & Ref</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {subscription.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-850/60 transition">
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{inv.date}</td>
                    <td className="py-3 px-3 font-semibold text-slate-200">{inv.planName}</td>
                    <td className="py-3 px-3 text-slate-400">{inv.billingPeriod}</td>
                    <td className="py-3 px-3">
                      <div>{inv.paymentMode}</div>
                      <div className="text-[10px] font-mono text-slate-500">{inv.transactionId}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-right text-emerald-400 text-sm">
                      {sym}{inv.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => alert(`Downloading Invoice ${inv.invoiceNumber} (PDF format with GSTIN: ${settings.gstNumber})...`)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition"
                        title="Download Tax Invoice PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
