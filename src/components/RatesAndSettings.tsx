import React, { useState } from 'react';
import {
  Settings,
  Fuel,
  Droplet,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Building,
  SlidersHorizontal,
  Layers,
  Database,
  Info,
  ShieldCheck,
  Zap,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import {
  FuelRate,
  TankStock,
  Nozzle,
  PumpSettings,
} from '../types';
import { storage } from '../services/storage';

interface RatesAndSettingsProps {
  settings: PumpSettings;
  rates: FuelRate[];
  tanks: TankStock[];
  nozzles: Nozzle[];
  onRefreshData: () => void;
  onReopenRegistration?: () => void;
  onLockOwner?: () => void;
}

export const RatesAndSettings: React.FC<RatesAndSettingsProps> = ({
  settings,
  rates,
  tanks,
  nozzles,
  onRefreshData,
  onReopenRegistration,
  onLockOwner,
}) => {
  const sym = settings.currencySymbol;
  const [activeSubTab, setActiveSubTab] = useState<'rates' | 'tanks' | 'station' | 'security' | 'backup'>('rates');

  // Rates State
  const [editableRates, setEditableRates] = useState<FuelRate[]>(rates);

  // Station Profile State
  const [stationForm, setStationForm] = useState<PumpSettings>(settings);

  // Tank Dips State
  const [editableTanks, setEditableTanks] = useState<TankStock[]>(tanks);

  // Owner Security State
  const [ownerPasswordInput, setOwnerPasswordInput] = useState<string>(() => storage.getOwnerPassword());
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>(() => storage.getOwnerPassword());
  const [isProtectedToggle, setIsProtectedToggle] = useState<boolean>(() => storage.isOwnerProtected());
  const [autoLockMins, setAutoLockMins] = useState<number>(settings.autoLockMinutes ?? 0);
  const [showSecPassword, setShowSecPassword] = useState<boolean>(false);

  // Backup text
  const [backupJson, setBackupJson] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [neonSyncing, setNeonSyncing] = useState<boolean>(false);
  const [neonMsg, setNeonMsg] = useState<string | null>(null);

  const handleSyncNeon = async () => {
    setNeonSyncing(true);
    setNeonMsg(null);
    try {
      const res = await storage.syncAllWithNeon();
      setNeonMsg(res.message);
      onRefreshData();
      setTimeout(() => setNeonMsg(null), 5000);
    } catch (e: any) {
      setNeonMsg(`Sync error: ${e.message}`);
    } finally {
      setNeonSyncing(false);
    }
  };

  // Handle Rates Update
  const handleRateChange = (type: string, field: 'ratePerLiter' | 'dealerCostPerLiter' | 'dealerMarginPerLiter', val: number) => {
    setEditableRates((prev) =>
      prev.map((r) => {
        if (r.type === type) {
          const updated = { ...r, [field]: val };
          if (field === 'ratePerLiter' || field === 'dealerCostPerLiter') {
            updated.dealerMarginPerLiter = updated.ratePerLiter - updated.dealerCostPerLiter;
          }
          return updated;
        }
        return r;
      })
    );
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveRates(editableRates);
    onRefreshData();
    setFeedback('Fuel rates successfully updated across all dispensers and calculation engines!');
    setTimeout(() => setFeedback(null), 4000);
  };

  // Handle Tanks Dip Update
  const handleTankChange = (tankId: string, field: 'currentVolumeLiters' | 'dipReadingCm', val: number) => {
    setEditableTanks((prev) =>
      prev.map((t) => {
        if (t.id === tankId) {
          return { ...t, [field]: val };
        }
        return t;
      })
    );
  };

  const handleSaveTanks = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveTanks(editableTanks);
    onRefreshData();
    setFeedback('Underground tank stock levels and dip readings saved successfully!');
    setTimeout(() => setFeedback(null), 4000);
  };

  // Handle Station Profile Save
  const handleSaveStation = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSettings(stationForm);
    onRefreshData();
    setFeedback('Petrol Pump Station Profile updated!');
    setTimeout(() => setFeedback(null), 4000);
  };

  // Handle Security & PIN Save
  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProtectedToggle) {
      if (!ownerPasswordInput.trim() || ownerPasswordInput.trim().length < 4) {
        setFeedback('Error: Password must be at least 4 characters long! (পাছৱৰ্ড কমেও ৪টা অক্ষৰ হ’ব লাগিব)');
        setTimeout(() => setFeedback(null), 4000);
        return;
      }
      if (ownerPasswordInput !== confirmPasswordInput) {
        setFeedback('Error: Passwords do not match! (পাছৱৰ্ড দুয়োটা মিলি যোৱা নাই)');
        setTimeout(() => setFeedback(null), 4000);
        return;
      }
    }
    storage.setOwnerPassword(ownerPasswordInput, isProtectedToggle, autoLockMins);
    onRefreshData();
    setFeedback('Owner & Management Security settings saved successfully (হিচাপ সুৰক্ষা সংৰক্ষণ হ’ল)!');
    setTimeout(() => setFeedback(null), 4000);
  };

  // Export Backup
  const handleExportBackup = () => {
    const jsonStr = storage.exportBackupJSON();
    setBackupJson(jsonStr);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PumpPro_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Import Backup
  const handleImportBackup = () => {
    if (!backupJson) {
      alert('Please paste a valid PumpPro JSON backup string.');
      return;
    }
    const success = storage.importBackupJSON(backupJson);
    if (success) {
      onRefreshData();
      alert('Backup restored successfully!');
    } else {
      alert('Failed to parse backup JSON. Please check formatting.');
    }
  };

  // Reset to default sample data
  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all data to default realistic station sample data?')) {
      storage.resetToSampleData();
      onRefreshData();
      alert('Station data reset to default demo values.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">
              Pump Settings, Fuel Rates & Underground Tanks
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure fuel retail prices, dealer commissions, tank dip levels, station identity, and system backups.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => setActiveSubTab('rates')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeSubTab === 'rates'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Fuel Rates
          </button>
          <button
            onClick={() => setActiveSubTab('tanks')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeSubTab === 'tanks'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tank Dips
          </button>
          <button
            onClick={() => setActiveSubTab('station')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeSubTab === 'station'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Station Profile
          </button>
          <button
            onClick={() => setActiveSubTab('security')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'security'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & PIN</span>
          </button>
          <button
            onClick={() => setActiveSubTab('backup')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeSubTab === 'backup'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Backup & Reset
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* SUBTAB 1: FUEL RATES */}
      {activeSubTab === 'rates' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Fuel className="w-5 h-5 text-orange-400" />
                <span>Daily Retail Fuel Rates & Dealer Margins</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set rate per liter and dealer cost price. Margins are automatically used in P&L statements.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveRates} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editableRates.map((rate) => (
                <div
                  key={rate.type}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4.5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: rate.color }}
                      />
                      <span className="font-extrabold text-white text-sm">
                        {rate.name}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                      {rate.shortCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">
                        Retail Selling ({sym}/L)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={rate.ratePerLiter}
                        onChange={(e) =>
                          handleRateChange(rate.type, 'ratePerLiter', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 border border-orange-500/50 rounded-xl px-2.5 py-2 text-white font-mono font-bold text-sm outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">
                        Dealer Cost ({sym}/L)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={rate.dealerCostPerLiter}
                        onChange={(e) =>
                          handleRateChange(rate.type, 'dealerCostPerLiter', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono font-bold text-sm outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-emerald-400">
                        Margin ({sym}/L)
                      </label>
                      <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-2.5 py-2 text-emerald-400 font-mono font-bold text-sm">
                        +{sym}{rate.dealerMarginPerLiter.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Fuel Rates</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 2: TANK DIPS & UNDERGROUND STORAGE */}
      {activeSubTab === 'tanks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Droplet className="w-5 h-5 text-sky-400" />
                <span>Underground Fuel Tanks & Dip Calibration</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Record daily dip stick measurement (cm) and calculate physical volume in tanks.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveTanks} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {editableTanks.map((tank) => (
                <div
                  key={tank.id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4.5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{tank.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-sky-400">
                      {tank.fuelType}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400">
                        Current Dip Reading (cm)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={tank.dipReadingCm}
                        onChange={(e) =>
                          handleTankChange(tank.id, 'dipReadingCm', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400">
                        Current Volume (Liters)
                      </label>
                      <input
                        type="number"
                        step="10"
                        value={tank.currentVolumeLiters}
                        onChange={(e) =>
                          handleTankChange(tank.id, 'currentVolumeLiters', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-hidden"
                      />
                    </div>

                    <div className="text-[11px] text-slate-400 flex justify-between pt-1">
                      <span>Total Capacity: {tank.capacityLiters.toLocaleString()} L</span>
                      <span className="font-mono text-sky-400 font-bold">
                        {Math.round((tank.currentVolumeLiters / tank.capacityLiters) * 100)}% Full
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-sky-600/20 active:scale-95 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Tank Readings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: STATION PROFILE */}
      {activeSubTab === 'station' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-orange-400" />
                <span>Station Branding & Tax Profile</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Printed on customer thermal slips, indents, and shift reports.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveStation} className="space-y-4 max-w-2xl">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Station / Retail Outlet Name</label>
              <input
                type="text"
                required
                value={stationForm.pumpName}
                onChange={(e) => setStationForm({ ...stationForm, pumpName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Oil Company Brand</label>
                <select
                  value={stationForm.dealerBrand}
                  onChange={(e) => setStationForm({ ...stationForm, dealerBrand: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                >
                  <option value="Indian Oil">Indian Oil (IOCL)</option>
                  <option value="Bharat Petroleum">Bharat Petroleum (BPCL)</option>
                  <option value="Hindustan Petroleum">Hindustan Petroleum (HPCL)</option>
                  <option value="Shell">Shell</option>
                  <option value="Nayara">Nayara Energy</option>
                  <option value="Reliance">Reliance Petroleum (Jio-bp)</option>
                  <option value="Independent">Independent Fuel Station</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Dealer / RO Code</label>
                <input
                  type="text"
                  required
                  value={stationForm.dealerCode}
                  onChange={(e) => setStationForm({ ...stationForm, dealerCode: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">GSTIN / Tax ID</label>
                <input
                  type="text"
                  required
                  value={stationForm.gstNumber}
                  onChange={(e) => setStationForm({ ...stationForm, gstNumber: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono uppercase outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Currency Symbol</label>
                <input
                  type="text"
                  required
                  value={stationForm.currencySymbol}
                  onChange={(e) => setStationForm({ ...stationForm, currencySymbol: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-bold outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Physical Address & Highway KM</label>
              <input
                type="text"
                required
                value={stationForm.address}
                onChange={(e) => setStationForm({ ...stationForm, address: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Phone</label>
                <input
                  type="text"
                  value={stationForm.phone}
                  onChange={(e) => setStationForm({ ...stationForm, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Email</label>
                <input
                  type="email"
                  value={stationForm.email}
                  onChange={(e) => setStationForm({ ...stationForm, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
              {onReopenRegistration && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('পাম্প পঞ্জীয়ন স্ক্ৰীণ পুনৰ খুলিব বিচাৰে নেকি? (Do you want to re-open the First-Time Station Setup & Registration wizard?)')) {
                      storage.resetSetup();
                      onReopenRegistration();
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-bold bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>পঞ্জীয়ন স্ক্ৰীণ পুনৰ খোলক (Re-run Registration Wizard)</span>
                </button>
              )}

              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition cursor-pointer ml-auto"
              >
                <Save className="w-4 h-4" />
                <span>Save Station Profile</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB: OWNER & MANAGEMENT SECURITY */}
      {activeSubTab === 'security' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Lock className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Owner & Management Security PIN (হিচাপ সুৰক্ষা ব্যৱস্থা)</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                মালিক আৰু মেনেজমেন্টৰ গোপন হিচাপ, দৈনিক লাভ-লোকচান, কেচ মেলা আৰু বেংক একাউণ্ট আনে চাব নোৱাৰাকৈ পাছৱৰ্ডেৰে লক কৰক।
              </p>
            </div>

            {/* Quick Lock Now Button */}
            {onLockOwner && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('এতিয়াই অ’নাৰ পেনেল লক কৰি ষ্টাফ মোডলৈ যাব বিচাৰে নেকি? (Lock owner access now and switch to staff view?)')) {
                    onLockOwner();
                  }
                }}
                className="flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                <Lock className="w-4 h-4 text-rose-400" />
                <span>🔒 এতিয়াই হিচাপ লক কৰক (Lock Now)</span>
              </button>
            )}
          </div>

          {/* Security Status Card */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Owner Hisab Protection:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isProtectedToggle
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {isProtectedToggle ? 'Active & Protected' : 'Protection Disabled'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isProtectedToggle
                    ? 'ষ্টেচনৰ অ’নাৰ মোড আৰু ফাইনেন্স পেনেল পাছৱৰ্ডেৰে সুৰক্ষিত হৈ আছে।'
                    : 'পাছৱৰ্ড সুৰক্ষা অফ কৰা আছে। যেতিয়াই অ’নাৰ মোড অন কৰিব পাৰিব।'}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300">পাছৱৰ্ড সুৰক্ষা:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isProtectedToggle}
                  onChange={(e) => setIsProtectedToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {/* Form to change PIN / Password */}
          <form onSubmit={handleSaveSecurity} className="space-y-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-orange-400" />
                <span>Change Owner PIN / Password (পাছৱৰ্ড সলনি কৰক)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New PIN */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>New PIN / Password (নতুন পাছৱৰ্ড)</span>
                    <span className="text-[10px] text-slate-500">Min 4 chars / digits</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSecPassword ? 'text' : 'password'}
                      placeholder="e.g. 1234 or Secret@2026"
                      value={ownerPasswordInput}
                      onChange={(e) => setOwnerPasswordInput(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowSecPassword(!showSecPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {showSecPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm PIN */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Confirm PIN (পাছৱৰ্ড নিশ্চিত কৰক)
                  </label>
                  <div className="relative">
                    <input
                      type={showSecPassword ? 'text' : 'password'}
                      placeholder="Repeat PIN / password"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              {/* Auto-Lock Inactivity Configuration */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Auto-Lock Timeout (স্বয়ংক্ৰিয় লক সময়সীমা)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Immediate on Exit / Staff Switch (লগে লগে লক)', val: 0 },
                    { label: 'After 5 Minutes (৫ মিনিট পাছত)', val: 5 },
                    { label: 'After 15 Minutes (১৫ মিনিট পাছত)', val: 15 },
                    { label: 'After 30 Minutes (৩০ মিনিট পাছত)', val: 30 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setAutoLockMins(opt.val)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                        autoLockMins === opt.val
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Emergency Recovery Info */}
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">জৰুৰীকালীন ৰিকভাৰী (Forgot Password Recovery):</strong>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  পাছৱৰ্ড পাহৰিলে আনলক স্ক্ৰীণত "পাছৱৰ্ড পাহৰিলে?" বিকল্পত ক্লিক কৰি পাম্পৰ RO ক’ড ({settings.dealerCode}) আৰু পঞ্জীভুক্ত মবাইল নম্বৰ ({settings.phone}) দি লগে লগে নতুন পাছৱৰ্ড ছেট কৰিব পাৰিব।
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Security PIN & Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 4: BACKUP & RESTORE */}
      {activeSubTab === 'backup' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-orange-400" />
                <span>Data Backup, Export & Restore</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                All records persist in your browser's local storage and sync in real time with Neon Serverless PostgreSQL.
              </p>
            </div>
          </div>

          {/* Neon PostgreSQL Cloud Persistence Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/30 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Neon Serverless PostgreSQL Database</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      LIVE CLOUD CONNECTED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Host: ep-icy-bonus-b44dhqg4-pooler.c-6.us-east-2.aws.neon.tech (neondb)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncNeon}
                disabled={neonSyncing}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/40 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Zap className={`w-3.5 h-3.5 ${neonSyncing ? 'animate-spin' : ''}`} />
                <span>{neonSyncing ? 'Syncing to Neon...' : 'Sync All Tables to Neon'}</span>
              </button>
            </div>

            {neonMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{neonMsg}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export & Reset */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <h3 className="font-bold text-white text-xs">Export Full Station Database</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Downloads all nozzle readings, lubricant catalog, fleet credit slips, payment receipts, and expenses into a JSON backup file.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/30 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup JSON</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-2">
                <h3 className="font-bold text-red-400 text-xs">Reset to Sample Demo Data</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Resets the application to active default sample data with dispensers, sample fleet accounts, and lubricant stock.
                </p>
                <button
                  onClick={handleResetDefaults}
                  className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            </div>

            {/* Import Backup */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <h3 className="font-bold text-white text-xs">Restore from JSON Backup</h3>
              <textarea
                rows={6}
                value={backupJson}
                onChange={(e) => setBackupJson(e.target.value)}
                placeholder="Paste exported PumpPro JSON backup content here..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 outline-hidden"
              />
              <button
                onClick={handleImportBackup}
                className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Restore JSON Backup</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
