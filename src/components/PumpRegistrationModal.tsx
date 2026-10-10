import React, { useState } from 'react';
import {
  Building2,
  Fuel,
  CheckCircle2,
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  Sparkles,
  Droplet,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { RegisteredPump, PumpSettings } from '../types';
import { storage } from '../services/storage';

interface PumpRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPumpRegistered: (pump: RegisteredPump) => void;
}

export const PumpRegistrationModal: React.FC<PumpRegistrationModalProps> = ({
  isOpen,
  onClose,
  onPumpRegistered,
}) => {
  const [stationName, setStationName] = useState('');
  const [oilCompany, setOilCompany] = useState<RegisteredPump['oilCompany']>('Indian Oil');
  const [roCode, setRoCode] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('Assam');
  const [district, setDistrict] = useState('Kamrup Metro');
  const [pincode, setPincode] = useState('781001');
  const [highwayName, setHighwayName] = useState('NH-27 Corridor');
  const [nozzlesCount, setNozzlesCount] = useState(6);
  const [tanksCount, setTanksCount] = useState(3);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newPump: RegisteredPump = {
      id: `pump-${Date.now()}`,
      stationName,
      oilCompany,
      roCode: roCode || `${oilCompany.substring(0, 3).toUpperCase()}-RO-${Math.floor(10000 + Math.random() * 90000)}`,
      ownerName,
      ownerPhone,
      ownerEmail,
      gstin: gstin || '18AABCP1234Q1ZT',
      address,
      state,
      district,
      pincode,
      highwayName,
      nozzlesCount: Number(nozzlesCount),
      tanksCount: Number(tanksCount),
      registeredDate: new Date().toISOString().split('T')[0],
      planStatus: 'Active',
      isActive: true,
    };

    storage.registerPump(newPump);
    setIsSuccess(true);

    setTimeout(() => {
      onPumpRegistered(newPump);
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 lg:p-8 shadow-2xl space-y-6 my-8 relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>New Station Onboarding / পাম্প পঞ্জীয়ন</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Register New Petrol Pump
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Add a new petrol pump station to your PumpTally network. Standard SaaS subscription: ₹999/month.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Station Registered Successfully!</h3>
            <p className="text-xs text-slate-300">
              {stationName} has been onboarded and configured as the active station.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Station Basic Info */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400 block">
                1. Petrol Pump & Oil Company Details
              </span>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Petrol Pump / Station Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brahmaputra Star Energy & Fuel Station"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Oil Company Brand *</label>
                  <select
                    value={oilCompany}
                    onChange={(e) => setOilCompany(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  >
                    <option value="Indian Oil">Indian Oil (IOCL)</option>
                    <option value="Bharat Petroleum">Bharat Petroleum (BPCL)</option>
                    <option value="Hindustan Petroleum">Hindustan Petroleum (HPCL)</option>
                    <option value="Shell">Shell</option>
                    <option value="Nayara">Nayara Energy</option>
                    <option value="Reliance">Reliance Petroleum (Jio-bp)</option>
                    <option value="Independent">Independent Dealer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Dealer RO Code</label>
                  <input
                    type="text"
                    placeholder="e.g. IOCL-RO-88419"
                    value={roCode}
                    onChange={(e) => setRoCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Owner & Contact Details */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block">
                2. Pump Owner & Management Contact
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bhaskar Senapati"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98200 44555"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Email Address</label>
                  <input
                    type="email"
                    placeholder="dealer@fuelstation.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">GSTIN / Tax ID</label>
                <input
                  type="text"
                  placeholder="e.g. 18AABCP1234Q1ZT"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase outline-hidden"
                />
              </div>
            </div>

            {/* Location & Infrastructure */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                3. Physical Location & Fuel Dispenser Setup
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Address & Highway Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plot 14, NH-27 Express Highway, KM 45"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">District / State</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Kamrup Metro"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                    />
                    <input
                      type="text"
                      placeholder="Assam"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Number of Nozzles</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={nozzlesCount}
                    onChange={(e) => setNozzlesCount(parseInt(e.target.value) || 4)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Underground Tanks</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tanksCount}
                    onChange={(e) => setTanksCount(parseInt(e.target.value) || 2)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Plan Notice */}
            <div className="p-3.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="font-extrabold text-orange-400 block">
                  SaaS Monthly Subscription: ₹999 / Month
                </span>
                <span className="text-[11px] text-slate-400">
                  Includes 14-day full free trial. Cancel anytime.
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-orange-500 text-white font-bold text-[10px]">
                Standard Pro
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-sm shadow-xl shadow-orange-500/30 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Complete Station Registration & Launch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
