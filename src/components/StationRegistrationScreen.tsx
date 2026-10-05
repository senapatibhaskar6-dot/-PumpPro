import React, { useState } from 'react';
import {
  Building2,
  Fuel,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  Truck,
  Droplet,
  Info,
  QrCode,
  CreditCard,
  BadgeCheck,
  Zap,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import { PumpProLogo } from './PumpProLogo';
import { RegisteredPump, PumpSettings } from '../types';
import { storage } from '../services/storage';

interface StationRegistrationScreenProps {
  onCompleteRegistration: (pump: RegisteredPump) => void;
}

export const StationRegistrationScreen: React.FC<StationRegistrationScreenProps> = ({
  onCompleteRegistration,
}) => {
  // Form State
  const [stationName, setStationName] = useState('');
  const [oilCompany, setOilCompany] = useState<RegisteredPump['oilCompany']>('Indian Oil');
  const [roCode, setRoCode] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [highwayName, setHighwayName] = useState('NH-27 Expressway Corridor');
  const [district, setDistrict] = useState('Kamrup Metro');
  const [state, setState] = useState('Assam');
  const [pincode, setPincode] = useState('781001');
  const [nozzlesCount, setNozzlesCount] = useState<number>(6);
  const [tanksCount, setTanksCount] = useState<number>(3);
  const [initialShift, setInitialShift] = useState<string>('Shift 1 (Morning)');

  // Mandatory Subscription Plan Selection (Monthly or Yearly)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMode, setPaymentMode] = useState<'UPI / QR' | 'Credit / Debit Card' | 'Net Banking'>('UPI / QR');

  // Owner & Management Security Password ("website registration korar pisot password loggabo pora system")
  const [ownerPassword, setOwnerPassword] = useState('1234');
  const [confirmPassword, setConfirmPassword] = useState('1234');
  const [isPasswordProtected, setIsPasswordProtected] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Quick fill with sample data
  const handleQuickFill = () => {
    setStationName('M/S Brahmaputra Highway Energy & Fuel Station');
    setOilCompany('Indian Oil');
    setRoCode('IOCL-RO-88412');
    setOwnerName('Bhaskar Senapati');
    setOwnerPhone('+91 98200 44555');
    setOwnerEmail('senapatibhaskar6@gmail.com');
    setGstin('18AABCP1337Q1ZT');
    setAddress('Plot 42, Highway Link Road, Near Brahmaputra Bridge');
    setHighwayName('NH-27 / Asian Highway 1');
    setDistrict('Kamrup Metro');
    setState('Assam');
    setPincode('781014');
    setNozzlesCount(6);
    setTanksCount(3);
    setOwnerPassword('1234');
    setConfirmPassword('1234');
    setIsPasswordProtected(true);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form validation
    if (!stationName.trim()) {
      setErrorMsg('Please enter your Petrol Pump / Station Name (পেট্ৰল পাম্পৰ নাম দিয়ক)');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg('Please enter the Owner or In-charge Name (মালিকৰ নাম দিয়ক)');
      return;
    }
    if (!ownerPhone.trim()) {
      setErrorMsg('Please enter a valid Contact Mobile Number (মবাইল নম্বৰ দিয়ক)');
      return;
    }

    if (isPasswordProtected) {
      if (!ownerPassword.trim() || ownerPassword.trim().length < 4) {
        setErrorMsg('অনুগ্ৰহ কৰি কমেও ৪টা সংখ্যা বা অক্ষৰৰ সুৰক্ষা পাছৱৰ্ড দিয়ক (Password must be at least 4 characters)');
        return;
      }
      if (ownerPassword !== confirmPassword) {
        setErrorMsg('পাছৱৰ্ড দুয়োটা মিলি যোৱা নাই (Passwords do not match)');
        return;
      }
    }

    const generatedRoCode = roCode.trim() || `${oilCompany.substring(0, 3).toUpperCase()}-RO-${Math.floor(10000 + Math.random() * 90000)}`;

    const newPump: RegisteredPump = {
      id: `pump-${Date.now()}`,
      stationName: stationName.trim(),
      oilCompany,
      roCode: generatedRoCode,
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim(),
      ownerEmail: ownerEmail.trim() || 'contact@pumppro.local',
      gstin: gstin.trim() || '18AABCP1337Q1ZT',
      address: address.trim() || 'Highway Service Corridor',
      highwayName: highwayName.trim(),
      district: district.trim() || 'Kamrup',
      state: state.trim() || 'Assam',
      pincode: pincode.trim() || '781001',
      nozzlesCount: Number(nozzlesCount) || 4,
      tanksCount: Number(tanksCount) || 2,
      registeredDate: new Date().toISOString().split('T')[0],
      planStatus: 'Active',
      isActive: true,
      ownerPassword: isPasswordProtected ? ownerPassword.trim() : '',
      isOwnerProtected: isPasswordProtected,
    };

    setIsSubmitting(true);

    try {
      // 1. Save registered pump
      storage.registerPump(newPump);

      // 2. Update Pump Settings
      const updatedSettings: PumpSettings = {
        pumpName: newPump.stationName,
        dealerBrand: newPump.oilCompany,
        dealerCode: newPump.roCode,
        gstNumber: newPump.gstin,
        address: `${newPump.address}, ${newPump.district}, ${newPump.state} - ${newPump.pincode}`,
        phone: newPump.ownerPhone,
        email: newPump.ownerEmail,
        currencySymbol: '₹',
        ownerPassword: isPasswordProtected ? ownerPassword.trim() : '',
        isOwnerProtected: isPasswordProtected,
        autoLockMinutes: 0,
      };
      storage.saveSettings(updatedSettings);

      // 3. Set Owner Security & session unlock for new registration
      storage.setOwnerPassword(isPasswordProtected ? ownerPassword.trim() : '', isPasswordProtected, 0);
      storage.setOwnerUnlocked(true);

      // 4. Process Mandatory Subscription Plan Payment (Monthly or Yearly)
      const txId = `TXN-PUMPPRO-${Date.now().toString().slice(-8)}`;
      storage.renewSubscription(billingCycle, paymentMode, txId, [newPump.id]);

      // 5. Mark setup as completed in localStorage
      storage.setSetupCompleted(true);

      setIsSuccess(true);

      // 4. Smoothly redirect to main dashboard
      setTimeout(() => {
        onCompleteRegistration(newPump);
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Error saving station details. Please retry.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-6 px-3 sm:px-6 relative overflow-x-hidden selection:bg-orange-500 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-3xl space-y-5">
        {/* Brand Header & Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center items-center">
            <PumpProLogo size="lg" />
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/40 text-orange-400 text-xs font-extrabold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>প্ৰথমবাৰৰ পঞ্জীয়ন • First-Time Setup</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Commercial Retail Outlet OS</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Register Your Petrol Pump Station
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            আপোনাৰ পেট্ৰল পাম্পৰ নাম, ডীলাৰ ব্ৰেণ্ড আৰু মালিকৰ সবিশেষ ইয়াত অন্তৰ্ভুক্ত কৰক। পঞ্জীয়নৰ পিছত আপুনি ডেশ্ব’ৰ্ডত কাম আৰম্ভ কৰিব পাৰিব।
          </p>
        </div>

        {/* Quick Fill Sample Button (Great for testing) */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleQuickFill}
            className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-bold bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 px-3 py-1.5 rounded-xl transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ডেমো তথ্যৰে পূৰণ কৰক (Quick Fill Sample Data)</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 shadow-md">
            <Info className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Modal / State */}
        {isSuccess && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 px-4 py-4 rounded-2xl text-center space-y-1 shadow-lg animate-pulse">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-base font-black text-white">পঞ্জীয়ন সফল হৈছে! (Registration Successful)</h3>
            <p className="text-xs text-emerald-300">
              Station registered successfully. Redirecting to your Main Dashboard...
            </p>
          </div>
        )}

        {/* Main Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card 1: Station Identity */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-xs">
                1
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-orange-400" />
                <span>Station Details & Oil Company (পেট্ৰল পাম্পৰ বিৱৰণ)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Station Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Petrol Pump / Station Name <span className="text-orange-400">*</span>
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(পেট্ৰল পাম্পৰ নাম)</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. M/S Valley Highway Energy Station"
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>

              {/* Oil Company / Brand */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Dealer Brand / Oil Company <span className="text-orange-400">*</span>
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(তেল কোম্পানী)</span>
                </label>
                <select
                  value={oilCompany}
                  onChange={(e) => setOilCompany(e.target.value as RegisteredPump['oilCompany'])}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-semibold cursor-pointer"
                >
                  <option value="Indian Oil">Indian Oil (IOCL)</option>
                  <option value="Bharat Petroleum">Bharat Petroleum (BPCL)</option>
                  <option value="Hindustan Petroleum">Hindustan Petroleum (HPCL)</option>
                  <option value="Nayara">Nayara Energy</option>
                  <option value="Shell">Shell India</option>
                  <option value="Reliance">Reliance Petroleum (Jio-bp)</option>
                  <option value="Independent">Independent Dealer</option>
                </select>
              </div>

              {/* RO Code / Dealer Customer Code */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  RO Code / Dealer SAP Code
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(ডীলাৰ ক’ড)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. IOCL-RO-44219"
                  value={roCode}
                  onChange={(e) => setRoCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              {/* GSTIN */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  GSTIN Number
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(জিএছটি পঞ্জীয়ন নম্বৰ)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 18AABCP1234Q1ZT"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Owner & Management Profile */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-xs">
                2
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Owner & Management Contact (মালিক আৰু মেনেজাৰৰ তথ্য)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Owner Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Dealer / Owner Name <span className="text-orange-400">*</span>
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(মালিকৰ নাম)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bhaskar Senapati"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              {/* Owner Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Contact Mobile / WhatsApp <span className="text-orange-400">*</span>
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(ফোন নম্বৰ)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98200 44555"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* Owner Email */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Official Email Address
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(ইমেইল)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="e.g. senapatibhaskar6@gmail.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Location & Highway Corridor */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                3
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Station Location & Address (স্থান আৰু ঠিকনা)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Premises / Street Address
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(ঠিকনা)</span>
                </label>
                <input
                  type="text"
                  placeholder="Plot / Dag No, Landmark, Village / Town"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Highway Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Highway / Road Corridor
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(ৰাজপথ)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. NH-27 Corridor, KM 118"
                  value={highwayName}
                  onChange={(e) => setHighwayName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  District
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(জিলা)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kamrup Metro, Guwahati"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  State (ৰাজ্য)
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* PIN Code */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  PIN Code (পিন ক’ড)
                </label>
                <input
                  type="text"
                  placeholder="781001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Equipment & Shifts */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                4
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Station Configuration (পাম্পৰ আন্তঃগাঁথনি)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tanks count */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Underground Tanks
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(টেংক সংখ্যা)</span>
                </label>
                <select
                  value={tanksCount}
                  onChange={(e) => setTanksCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
                >
                  <option value={2}>2 Underground Tanks (Petrol, Diesel)</option>
                  <option value={3}>3 Tanks (MS Petrol, HSD Diesel, XP95)</option>
                  <option value={4}>4 Tanks (MS, HSD 1, HSD 2, Speed/CNG)</option>
                  <option value={5}>5 Underground Tanks</option>
                </select>
              </div>

              {/* Nozzles count */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Dispensing Nozzles
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(নজল সংখ্যা)</span>
                </label>
                <select
                  value={nozzlesCount}
                  onChange={(e) => setNozzlesCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
                >
                  <option value={2}>2 Dispensing Nozzles</option>
                  <option value={4}>4 Nozzles (DU-1 & DU-2)</option>
                  <option value={6}>6 Dispensing Nozzles</option>
                  <option value={8}>8 Dispensing Nozzles</option>
                  <option value={12}>12 Dispensing Nozzles</option>
                </select>
              </div>

              {/* Initial Shift */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Initial Working Shift
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(প্ৰাৰম্ভিক শিফ্ট)</span>
                </label>
                <select
                  value={initialShift}
                  onChange={(e) => setInitialShift(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
                >
                  <option value="Shift 1 (Morning)">Shift 1 (Morning)</option>
                  <option value="Shift 2 (Evening)">Shift 2 (Evening)</option>
                  <option value="Shift 3 (Night)">Shift 3 (Night)</option>
                  <option value="General Full Day">General Full Day</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 5: Owner & Management Security Password ("website registration korar pisot password loggabo pora system") */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  5
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Owner & Management Security PIN (হিচাপ সুৰক্ষা পাছৱৰ্ড)</span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    অফিচৰ গোপন হিচাপ, লাভ-লোকচান আৰু বেংক একাউণ্ট যাতে আনে চাব নোৱাৰে (Protect accounts from unauthorized viewing)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Security
              </span>
            </div>

            {/* Toggle Enable Protection */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>অ’নাৰ ডেচব’ৰ্ড পাছৱৰ্ডেৰে সুৰক্ষিত কৰক</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  নজেলমেন বা কৰ্মচাৰীয়ে ষ্টাফ এন্ট্ৰি কৰিব পাৰিব কিন্তু গোপন হিচাপ চাব নোৱাৰিব
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPasswordProtected}
                  onChange={(e) => setIsPasswordProtected(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {isPasswordProtected && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in">
                {/* Password / PIN */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Owner PIN / Password (সুৰক্ষা পাছৱৰ্ড)</span>
                    <span className="text-[10px] text-amber-400 font-mono">ডিফল্ট: 1234</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="e.g. 1234 or Secret@2026"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Confirm PIN (পাছৱৰ্ড নিশ্চিত কৰক)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repeat PIN / password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="sm:col-span-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    পাছৱৰ্ড পাহৰিলে ভয় নাই: আপোনাৰ পঞ্জীভুক্ত RO ক’ড আৰু মবাইল নম্বৰ দি যিকোনো সময়তে ৰিছেট কৰিব পাৰিব।
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card 6: Mandatory Subscription Plan & Payment */}
          <div className="bg-slate-900/90 border-2 border-orange-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 bg-orange-500/5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-slate-950 font-black text-xs">
                  6
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-orange-400 fill-current" />
                    <span>Choose Plan & Complete Payment (চাবস্ক্ৰিপচন প্লেন আৰু পেমেণ্ট)</span>
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    পেমেণ্ট সম্পন্ন কৰিলেহে ডেশ্ব’ৰ্ডলৈ প্ৰৱেশ কৰিব পাৰিব (Payment required to unlock access)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                Required
              </span>
            </div>

            {/* Monthly vs Yearly Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Monthly Option */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setBillingCycle('monthly')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-slate-950 border-orange-500 shadow-md ring-1 ring-orange-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-300">মাহেকীয়া • Monthly</span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      billingCycle === 'monthly' ? 'border-orange-500 bg-orange-500' : 'border-slate-600'
                    }`}
                  >
                    {billingCycle === 'monthly' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-white">₹999</span>
                  <span className="text-[11px] text-slate-400">/ মাহে (30 Days)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Flexible month-to-month access. Auto-locks after 30 days if not renewed.
                </p>
              </div>

              {/* Yearly Option */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setBillingCycle('annual')}
                className={`relative p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-slate-950 border-sky-500 shadow-md ring-1 ring-sky-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-75'
                }`}
              >
                <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full">
                  ⭐ 2 Months Free (Save 17%)
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-sky-400">বাৰ্ষিক • Yearly Best Value</span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      billingCycle === 'annual' ? 'border-sky-500 bg-sky-500' : 'border-slate-600'
                    }`}
                  >
                    {billingCycle === 'annual' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-white">₹9,990</span>
                  <span className="text-[11px] text-slate-400">/ বছৰি (365 Days)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Full 1-year uninterrupted operations without monthly payment hassle.
                </p>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-300">
                Payment Method (পেমেণ্টৰ মাধ্যম)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI / QR')}
                  className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
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
                  className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
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
                  className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
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
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs mt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
                      <QrCode className="w-7 h-7 text-slate-950" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Dynamic UPI QR Code</div>
                      <div className="text-[10px] text-slate-400">PhonePe • GPay • Paytm • BHIM</div>
                    </div>
                  </div>
                  <span className="font-mono font-black text-orange-400 text-sm">
                    ₹{billingCycle === 'monthly' ? '999' : '9,990'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>
                {isSubmitting
                  ? 'পেমেণ্ট পৰীক্ষা আৰু পঞ্জীয়ন কৰা হৈছে... (Processing Payment & Activating...)'
                  : `₹${billingCycle === 'monthly' ? '999' : '9,990'} পেমেণ্ট সম্পন্ন কৰক আৰু ডেশ্ব’ৰ্ড আনলক কৰক (Complete Payment & Unlock App)`}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-500">
          PumpPro Petrol Station Management System • Built for 24×7 Highway Operations, Stock Audits & Meter Readings.
        </p>
      </div>
    </div>
  );
};
