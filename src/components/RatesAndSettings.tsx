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
  Plus,
  Trash2,
  PlusCircle,
  X,
  Gauge,
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
  const [activeSubTab, setActiveSubTab] = useState<'rates' | 'tanks' | 'nozzles' | 'station' | 'security' | 'backup'>('rates');

  // Rates State
  const [editableRates, setEditableRates] = useState<FuelRate[]>(rates);

  // Station Profile State
  const [stationForm, setStationForm] = useState<PumpSettings>(settings);

  // Tanks State (Direct Liters System)
  const [editableTanks, setEditableTanks] = useState<TankStock[]>(tanks);

  // Nozzles State (Dynamic Plus System)
  const [editableNozzles, setEditableNozzles] = useState<Nozzle[]>(nozzles);

  // Add Tank Modal State
  const [showAddTankModal, setShowAddTankModal] = useState<boolean>(false);
  const [newTankName, setNewTankName] = useState<string>('');
  const [newTankFuelType, setNewTankFuelType] = useState<string>('petrol');
  const [newTankCapacity, setNewTankCapacity] = useState<string>('20000');
  const [newTankStockLiters, setNewTankStockLiters] = useState<string>('12000');

  // Add Nozzle Modal State
  const [showAddNozzleModal, setShowAddNozzleModal] = useState<boolean>(false);
  const [newNozzleDU, setNewNozzleDU] = useState<string>('DU-01');
  const [newNozzleNumber, setNewNozzleNumber] = useState<string>('1');
  const [newNozzleName, setNewNozzleName] = useState<string>('');
  const [newNozzleFuelType, setNewNozzleFuelType] = useState<string>('petrol');
  const [newNozzleTankId, setNewNozzleTankId] = useState<string>(tanks[0]?.id || 'tank-1');

  // Keep state synced with props
  React.useEffect(() => {
    setEditableTanks(tanks);
  }, [tanks]);

  React.useEffect(() => {
    setEditableNozzles(nozzles);
  }, [nozzles]);

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

  // Handle Tanks Field Update (Direct Liters & Capacity)
  const handleTankFieldChange = (tankId: string, field: keyof TankStock, val: any) => {
    setEditableTanks((prev) =>
      prev.map((t) => {
        if (t.id === tankId) {
          const updated = { ...t, [field]: val };
          // If volume changed, auto-estimate dipCm for convenience
          if (field === 'currentVolumeLiters') {
            const cap = updated.capacityLiters || 20000;
            updated.dipReadingCm = Math.round((Number(val) / Math.max(1, cap)) * 260);
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleSaveTanks = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveTanks(editableTanks);
    onRefreshData();
    setFeedback('Underground tank stock levels saved successfully (Direct Liters)!');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddTankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTankName.trim()) {
      alert('Please enter a name for the underground tank (e.g. Tank 4 - MS Petrol).');
      return;
    }
    const cap = parseFloat(newTankCapacity) || 20000;
    const vol = parseFloat(newTankStockLiters) || 0;
    const created = storage.addTank({
      name: newTankName.trim(),
      fuelType: newTankFuelType,
      capacityLiters: cap,
      currentVolumeLiters: vol,
      dipReadingCm: Math.round((vol / Math.max(1, cap)) * 260),
      lastRefillDate: new Date().toISOString().split('T')[0],
    });

    setEditableTanks(storage.getTanks());
    setShowAddTankModal(false);
    setNewTankName('');
    onRefreshData();
    setFeedback(`New Underground Tank "${created.name}" added successfully!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteTank = (tankId: string, tankName: string) => {
    // Check if any nozzles connect to this tank
    const connectedNozzles = editableNozzles.filter(n => n.tankId === tankId);
    let confirmMsg = `Are you sure you want to delete "${tankName}"?`;
    if (connectedNozzles.length > 0) {
      confirmMsg += `\nWarning: ${connectedNozzles.length} nozzle(s) currently connect to this tank.`;
    }
    if (window.confirm(confirmMsg)) {
      storage.deleteTank(tankId);
      setEditableTanks(storage.getTanks());
      onRefreshData();
      setFeedback(`Tank "${tankName}" deleted.`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Handle Nozzles Field Update
  const handleNozzleFieldChange = (nozzleId: string, field: keyof Nozzle, val: any) => {
    setEditableNozzles((prev) =>
      prev.map((n) => {
        if (n.id === nozzleId) {
          return { ...n, [field]: val };
        }
        return n;
      })
    );
  };

  const handleSaveNozzles = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveNozzles(editableNozzles);
    onRefreshData();
    setFeedback('All dispensing nozzles configuration updated successfully!');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddNozzleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const du = newNozzleDU.trim() || 'DU-01';
    const nozNum = parseInt(newNozzleNumber) || 1;
    const name = newNozzleName.trim() || `${du} Nozzle ${nozNum} (${newNozzleFuelType.toUpperCase()})`;

    const created = storage.addNozzle({
      dispenserUnit: du,
      nozzleNumber: nozNum,
      name,
      fuelType: newNozzleFuelType,
      tankId: newNozzleTankId || (editableTanks[0]?.id || 'tank-1'),
    });

    setEditableNozzles(storage.getNozzles());
    setShowAddNozzleModal(false);
    setNewNozzleName('');
    onRefreshData();
    setFeedback(`New Dispensing Nozzle "${created.name}" added successfully!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDeleteNozzle = (nozzleId: string, nozzleName: string) => {
    if (window.confirm(`Are you sure you want to delete dispensing nozzle "${nozzleName}"?`)) {
      storage.deleteNozzle(nozzleId);
      setEditableNozzles(storage.getNozzles());
      onRefreshData();
      setFeedback(`Nozzle "${nozzleName}" deleted.`);
      setTimeout(() => setFeedback(null), 4000);
    }
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
    a.download = `PumpTally_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Import Backup
  const handleImportBackup = () => {
    if (!backupJson) {
      alert('Please paste a valid PumpTally JSON backup string.');
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
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'tanks'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>Tanks (Liters)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('nozzles')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'nozzles'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Nozzles & DUs</span>
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

      {/* SUBTAB 2: UNDERGROUND TANKS - DIRECT LITERS & PLUS SYSTEM */}
      {activeSubTab === 'tanks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Droplet className="w-5 h-5 text-sky-400" />
                <span>Underground Fuel Tanks (মাটিৰ তলৰ টেংকীসমূহ)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="text-emerald-400 font-semibold">পোনপটীয়াকৈ লিটাৰত (Liters) ষ্টক আৰু ক্ষমতা লিখক</span> • কোনো ডিপ ৰড (Dip stick cm) মাপ নিলিখিলেও হ'ব।
              </p>
            </div>

            {/* PLUS BUTTON: Add Underground Tank */}
            <button
              type="button"
              onClick={() => {
                setNewTankName(`Underground Tank ${editableTanks.length + 1}`);
                setNewTankCapacity('20000');
                setNewTankStockLiters('10000');
                setNewTankFuelType('petrol');
                setShowAddTankModal(true);
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Tank (টেংকী যোগ কৰক)</span>
            </button>
          </div>

          <form onSubmit={handleSaveTanks} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {editableTanks.map((tank) => {
                const pct = Math.min(
                  100,
                  Math.round((tank.currentVolumeLiters / Math.max(1, tank.capacityLiters)) * 100)
                );
                return (
                  <div
                    key={tank.id}
                    className="bg-slate-850/80 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-4.5 space-y-3.5 relative transition shadow-sm"
                  >
                    {/* Top Row: Name and Fuel Type + Delete */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={tank.name}
                          onChange={(e) => handleTankFieldChange(tank.id, 'name', e.target.value)}
                          className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-bold text-white w-full focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <select
                        value={tank.fuelType}
                        onChange={(e) => handleTankFieldChange(tank.id, 'fuelType', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-bold text-sky-400 focus:outline-none cursor-pointer"
                      >
                        <option value="petrol">Petrol (MS)</option>
                        <option value="diesel">Diesel (HSD)</option>
                        <option value="premium_petrol">XP95 / Speed</option>
                        <option value="cng">CNG</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDeleteTank(tank.id, tank.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete this underground tank"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Inputs: Direct Liters Stock & Capacity */}
                    <div className="space-y-2.5">
                      {/* 1. CURRENT STOCK IN LITERS (NO DIP REQUIRED) */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                          <span>বৰ্তমান তেল (Liters / লিটাৰত):</span>
                          <span className="text-[10px] text-slate-400 font-normal">Direct Liters</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            value={tank.currentVolumeLiters}
                            onChange={(e) =>
                              handleTankFieldChange(tank.id, 'currentVolumeLiters', parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-mono font-black text-sm outline-hidden focus:border-emerald-400 pr-10"
                          />
                          <span className="absolute right-3 top-2 text-xs font-bold text-emerald-400">L</span>
                        </div>
                      </div>

                      {/* 2. TOTAL CAPACITY IN LITERS */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                          <span>মুঠ ক্ষমতা (Capacity Liters):</span>
                          <span className="text-[10px] text-slate-400 font-normal">ট্যাংক ক্ষমতা</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            value={tank.capacityLiters}
                            onChange={(e) =>
                              handleTankFieldChange(tank.id, 'capacityLiters', parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono font-bold text-xs outline-hidden focus:border-orange-500 pr-10"
                          />
                          <span className="absolute right-3 top-1.5 text-xs font-bold text-slate-400">L</span>
                        </div>
                      </div>

                      {/* Visual Capacity Bar */}
                      <div className="pt-1 space-y-1">
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              pct < 25 ? 'bg-rose-500' : pct < 45 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-400 flex justify-between">
                          <span className="font-mono text-slate-300 font-semibold">{pct}% ভৰ্তি (Full)</span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            Est. Dip: {tank.dipReadingCm} cm
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-800">
              <span className="text-xs text-slate-400">
                মুঠ টেংকী: <strong className="text-white font-mono">{editableTanks.length}</strong> টা
              </span>
              <button
                type="submit"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Tanks Stock (ষ্টক সাঁচি ৰাখক)</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: DISPENSING NOZZLES - DYNAMIC PLUS SYSTEM */}
      {activeSubTab === 'nozzles' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Fuel className="w-5 h-5 text-orange-400" />
                <span>Dispensing Nozzles & Units (ডিচপেন্চাৰ নজলসমূহ)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="text-orange-400 font-semibold">প্লাছ (+) চিষ্টেমেৰে নজল যোগ কৰক</span> • প্ৰতিটো নজল নিৰ্দিষ্ট টেংকীৰ সৈতে সংযুক্ত থাকে।
              </p>
            </div>

            {/* PLUS BUTTON: Add Dispensing Nozzle */}
            <button
              type="button"
              onClick={() => {
                const nextNozNum = (editableNozzles.length % 2) + 1;
                const nextDuNum = Math.floor(editableNozzles.length / 2) + 1;
                setNewNozzleDU(`DU-0${nextDuNum}`);
                setNewNozzleNumber(String(nextNozNum));
                setNewNozzleFuelType('petrol');
                setNewNozzleTankId(editableTanks[0]?.id || 'tank-1');
                setNewNozzleName(`DU-0${nextDuNum} Nozzle ${nextNozNum} (PETROL)`);
                setShowAddNozzleModal(true);
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-orange-500/20 active:scale-95 transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Nozzle (নজল যোগ কৰক)</span>
            </button>
          </div>

          <form onSubmit={handleSaveNozzles} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {editableNozzles.map((nozzle) => {
                const connectedTank = editableTanks.find(t => t.id === nozzle.tankId);
                return (
                  <div
                    key={nozzle.id}
                    className="bg-slate-850/80 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-4.5 space-y-3 relative transition shadow-sm"
                  >
                    {/* Top Row: Unit, Number & Delete */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        {nozzle.dispenserUnit || 'DU-01'} • Nozzle #{nozzle.nozzleNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteNozzle(nozzle.id, nozzle.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete this nozzle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Nozzle Name input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Nozzle Label / Name:</label>
                      <input
                        type="text"
                        value={nozzle.name}
                        onChange={(e) => handleNozzleFieldChange(nozzle.id, 'name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Fuel Type & Connected Underground Tank */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400">Fuel Type:</label>
                        <select
                          value={nozzle.fuelType}
                          onChange={(e) => handleNozzleFieldChange(nozzle.id, 'fuelType', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-bold text-white focus:outline-none cursor-pointer"
                        >
                          <option value="petrol">Petrol (MS)</option>
                          <option value="diesel">Diesel (HSD)</option>
                          <option value="premium_petrol">XP95 Premium</option>
                          <option value="cng">CNG</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400">Connected Tank:</label>
                        <select
                          value={nozzle.tankId}
                          onChange={(e) => handleNozzleFieldChange(nozzle.id, 'tankId', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-bold text-sky-400 focus:outline-none cursor-pointer"
                        >
                          {editableTanks.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Tank Connection Status Badge */}
                    <div className="pt-1 text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>সংযুক্ত টেংকী: </span>
                      <span className="text-slate-300 font-semibold truncate">
                        {connectedTank?.name || 'Tank Connected'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-800">
              <span className="text-xs text-slate-400">
                মুঠ নজল: <strong className="text-white font-mono">{editableNozzles.length}</strong> টা
              </span>
              <button
                type="submit"
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-orange-600/20 active:scale-95 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save All Nozzles (নজল সংৰক্ষণ কৰক)</span>
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
                placeholder="Paste exported PumpTally JSON backup content here..."
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
      {/* MODAL: ADD UNDERGROUND TANK */}
      {showAddTankModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Underground Tank</h3>
                  <p className="text-[11px] text-slate-400">মাটিৰ তলৰ নতুন টেংকী যোগ কৰক (Liters System)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTankModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTankSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Tank Label / Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tank 4 - MS Premium"
                  value={newTankName}
                  onChange={(e) => setNewTankName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Fuel Product Type:</label>
                <select
                  value={newTankFuelType}
                  onChange={(e) => setNewTankFuelType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="petrol">Petrol (MS)</option>
                  <option value="diesel">Diesel (HSD)</option>
                  <option value="premium_petrol">XP95 / Premium Petrol</option>
                  <option value="cng">CNG (Natural Gas)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Capacity (Liters):</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      step="any"
                      placeholder="20000"
                      value={newTankCapacity}
                      onChange={(e) => setNewTankCapacity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-sky-500 pr-7"
                    />
                    <span className="absolute right-2.5 top-2 text-xs text-slate-400">L</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-400">Opening Stock (Liters):</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      step="any"
                      placeholder="10000"
                      value={newTankStockLiters}
                      onChange={(e) => setNewTankStockLiters(e.target.value)}
                      className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-400 pr-7"
                    />
                    <span className="absolute right-2.5 top-2 text-xs text-emerald-400">L</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                💡 <span className="text-slate-300 font-semibold">Direct Liters Entry:</span> পোনপটীয়াকৈ লিটাৰত লিখক। কোনো ডিপ নিলিখিলেও চিষ্টেমে স্বয়ংক্ৰিয়ভাৱে সকলো হিচাপ কৰিব।
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTankModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 transition cursor-pointer"
                >
                  + Add Tank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DISPENSING NOZZLE */}
      {showAddNozzleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Dispensing Nozzle</h3>
                  <p className="text-[11px] text-slate-400">নতুন ডিচপেন্চাৰ নজল যোগ কৰক (+ Plus System)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddNozzleModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNozzleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Dispenser Unit (DU):</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DU-01"
                    value={newNozzleDU}
                    onChange={(e) => setNewNozzleDU(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Nozzle Number:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="1"
                    value={newNozzleNumber}
                    onChange={(e) => setNewNozzleNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nozzle Label / Name:</label>
                <input
                  type="text"
                  placeholder="e.g. DU-01 Nozzle 1 (Petrol)"
                  value={newNozzleName}
                  onChange={(e) => setNewNozzleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Fuel Product Type:</label>
                <select
                  value={newNozzleFuelType}
                  onChange={(e) => setNewNozzleFuelType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="petrol">Petrol (MS)</option>
                  <option value="diesel">Diesel (HSD)</option>
                  <option value="premium_petrol">XP95 / Premium Petrol</option>
                  <option value="cng">CNG (Natural Gas)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Connect to Underground Tank:</label>
                <select
                  value={newNozzleTankId}
                  onChange={(e) => setNewNozzleTankId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-sky-400 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  {editableTanks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.fuelType.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNozzleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/30 transition cursor-pointer"
                >
                  + Add Nozzle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
