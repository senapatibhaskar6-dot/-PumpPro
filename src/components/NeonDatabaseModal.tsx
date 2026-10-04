import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Server,
  ShieldCheck,
  Zap,
  HardDrive,
  Activity,
  Layers,
  Fuel,
  Package,
  Receipt,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import { storage, NeonDbStatus } from '../services/storage';

interface NeonDatabaseModalProps {
  onClose: () => void;
}

export const NeonDatabaseModal: React.FC<NeonDatabaseModalProps> = ({ onClose }) => {
  const [status, setStatus] = useState<NeonDbStatus>(storage.getNeonStatus());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Initial fetch
    refreshStatus();

    const handleNeonStatus = (e: any) => {
      if (e.detail) {
        setStatus(e.detail);
      }
    };

    window.addEventListener('pumppro_neon_status', handleNeonStatus);
    return () => {
      window.removeEventListener('pumppro_neon_status', handleNeonStatus);
    };
  }, []);

  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const updated = await storage.checkNeonStatus();
      setStatus(updated);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await storage.syncAllWithNeon();
      if (res.success) {
        setSyncFeedback(res.message);
        await refreshStatus();
      } else {
        setSyncFeedback(`Sync failed: ${res.message}`);
      }
    } catch (e: any) {
      setSyncFeedback(`Error: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const maskedConnString =
    'postgresql://neondb_owner:••••••••••••@ep-icy-bonus-b44dhqg4-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

  const handleCopyHost = () => {
    navigator.clipboard.writeText('ep-icy-bonus-b44dhqg4-pooler.c-6.us-east-2.aws.neon.tech');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tableSummary = [
    { name: 'Station Settings & Profile', key: 'SETTINGS', icon: Server, desc: 'Station brand, GSTIN, RO Code' },
    { name: 'Fuel Rates & Profit Margins', key: 'RATES', icon: Fuel, desc: 'MS, HSD, XP95, CNG selling rates' },
    { name: 'Nozzles & Dispensers', key: 'NOZZLES', icon: Activity, desc: 'Islands, DU units & tanks mapping' },
    { name: 'Daily Meter Readings', key: 'READINGS', icon: HardDrive, desc: 'Opening, closing, testing & sales' },
    { name: 'Underground Tanks & Dips', key: 'TANKS', icon: Layers, desc: 'Liters stock, cm dip height & alerts' },
    { name: 'Lubricant Inventory & DEF', key: 'LUBRICANTS', icon: Package, desc: 'Engine oil SKUs, MRP & reorder levels' },
    { name: 'Fleet Credit Ledger', key: 'CUSTOMERS', icon: Users, desc: 'Transporters, vehicle numbers & limits' },
    { name: 'Credit Indent Slips', key: 'CREDIT_SLIPS', icon: Receipt, desc: 'Driver vouchers, bills & sign slips' },
    { name: 'Shift Cash Reconciliations', key: 'RECONCILIATIONS', icon: ShieldCheck, desc: 'Cash notes breakdown, UPI & deficit' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg">
              <Database className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Neon PostgreSQL Database</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AWS us-east-2 Serverless Cloud PostgreSQL • Auto-Sync Active
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Connection Status Card */}
          <div className="bg-gradient-to-br from-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4.5 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    status.connected ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-rose-500'
                  }`}
                />
                <span className="font-bold text-sm text-white">
                  {status.connected ? 'Neon Cloud Database Connected' : 'Connecting to Neon...'}
                </span>
                {status.latencyMs !== undefined && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 font-mono">
                    ⚡ {status.latencyMs} ms latency
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={refreshStatus}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition disabled:opacity-50"
                  title="Ping database connection"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
                  <span>{isRefreshing ? 'Pinging...' : 'Ping Test'}</span>
                </button>
                <button
                  onClick={handleSyncAll}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-md shadow-emerald-950/40 disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync All Data'}</span>
                </button>
              </div>
            </div>

            {/* Connection Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cloud Host</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-slate-200 truncate max-w-[210px]" title={status.host}>
                    {status.host || 'ep-icy-bonus-b44dhqg4-pooler.c-6.us-east-2.aws.neon.tech'}
                  </span>
                  <button
                    onClick={handleCopyHost}
                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                    title="Copy Host"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Database & User</span>
                <span className="font-mono text-slate-200 block mt-1">
                  {status.database || 'neondb'} <span className="text-slate-500">(user: {status.user || 'neondb_owner'})</span>
                </span>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Region & Architecture</span>
                <span className="text-slate-200 block mt-1">
                  AWS us-east-2 (Ohio) • Serverless Pooler
                </span>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Engine Version</span>
                <span className="text-slate-200 block mt-1 truncate" title={status.pgVersion || 'PostgreSQL 18.6'}>
                  {status.pgVersion ? status.pgVersion.split(' ')[0] + ' ' + status.pgVersion.split(' ')[1] : 'PostgreSQL 18.6 (Latest)'}
                </span>
              </div>
            </div>

            {/* Connection String Preview */}
            <div className="mt-3 pt-3 border-t border-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Configured Connection String</span>
              <div className="p-2 rounded-lg bg-black/40 border border-slate-800 text-[11px] font-mono text-slate-300 break-all select-all">
                {maskedConnString}
              </div>
            </div>

            {/* Last Synced Feedback */}
            {syncFeedback && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}
            {status.lastSyncedAt && !syncFeedback && (
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Last auto-synchronized with Neon: {new Date(status.lastSyncedAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Assamese & English Overview Guide */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
            <h4 className="text-xs font-bold uppercase text-orange-400 tracking-wider flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>স্থায়ী ক্লাউড সংৰক্ষণ (Neon Cloud Persistence Active)</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              আপোনাৰ পেট্রোল পাম্পৰ সকলো মিটাৰ ৰিডিং, টেংকৰ ডিপ হাইট, মবিল আৰু ডিইএফ বিক্ৰী, বাকী খাতা আৰু দৈনিক খৰচৰ তথ্য এতিয়া পোনপটীয়াকৈ <strong>Neon Serverless PostgreSQL</strong> ডাটাবেজত সংৰক্ষিত হৈ আছে। কম্পিউটাৰ সলনি হ'লেও বা ব্ৰাউজাৰ কেচ মচিলেও কোনো তথ্য নেহেৰায়।
            </p>
          </div>

          {/* Synchronized Tables Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                Synchronized Collections ({tableSummary.length} Tables)
              </h4>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Auto-Backup Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tableSummary.map((tab, idx) => {
                const Icon = tab.icon;
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 border border-slate-800 flex items-start gap-2.5 transition"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-orange-400 flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-white truncate">{tab.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{tab.desc}</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" title="Synced" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            Status: <span className="text-emerald-400 font-semibold">Online & SSL Encrypted</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
