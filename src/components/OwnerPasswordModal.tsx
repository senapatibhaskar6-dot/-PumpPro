import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  AlertCircle,
  HelpCircle,
  Phone,
  Building2,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { PumpProLogo } from './PumpProLogo';
import { storage } from '../services/storage';
import { PumpSettings } from '../types';

interface OwnerPasswordModalProps {
  isOpen: boolean;
  settings: PumpSettings;
  onClose: () => void;
  onSuccess: () => void;
}

export const OwnerPasswordModal: React.FC<OwnerPasswordModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Recovery Mode
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryRoCode, setRecoveryRoCode] = useState(settings.dealerCode || '');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState<string | null>(null);

  // Reset fields on modal open
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg(null);
      setIsSuccess(false);
      setIsRecoveryMode(false);
      setRecoveryRoCode(settings.dealerCode || '');
      setRecoveryPhone('');
      setNewPassword('');
      setConfirmNewPassword('');
      setRecoverySuccessMsg(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!password.trim()) {
      setErrorMsg('অনুগ্ৰহ কৰি পাছৱৰ্ড বা PIN দিয়ক (Please enter password/PIN)');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const isValid = storage.verifyOwnerPassword(password);
    if (isValid) {
      setIsSuccess(true);
      storage.setOwnerUnlocked(true);
      setTimeout(() => {
        onSuccess();
      }, 400);
    } else {
      setShake(true);
      setErrorMsg('ভুল পাছৱৰ্ড! সঠিক PIN দিয়ক (Incorrect PIN/Password. Default: 1234)');
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKeypadPress = (digit: string) => {
    setErrorMsg(null);
    if (password.length < 10) {
      const next = password + digit;
      setPassword(next);
      // Auto-submit if 4 digits entered and matches
      if (next.length === 4 && storage.verifyOwnerPassword(next)) {
        setIsSuccess(true);
        storage.setOwnerUnlocked(true);
        setTimeout(() => onSuccess(), 350);
      }
    }
  };

  const handleKeypadBackspace = () => {
    setErrorMsg(null);
    setPassword((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setErrorMsg(null);
    setPassword('');
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!recoveryRoCode.trim()) {
      setErrorMsg('ষ্টেচনৰ RO ক’ড দিয়ক (Enter Station RO Code)');
      return;
    }
    if (!recoveryPhone.trim() || recoveryPhone.trim().replace(/\D/g, '').length < 10) {
      setErrorMsg('পঞ্জীভুক্ত ১০ সংখ্যাৰ মবাইল নম্বৰ দিয়ক (Enter registered 10-digit mobile number)');
      return;
    }
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setErrorMsg('নতুন পাছৱৰ্ড কমেও ৪টা সংখ্যা বা অক্ষৰ হ’ব লাগিব (Password must be at least 4 characters)');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('পাছৱৰ্ড দুয়োটা মিলি যোৱা নাই (Passwords do not match)');
      return;
    }

    const resetSuccess = storage.resetOwnerPasswordWithVerification(
      recoveryRoCode,
      recoveryPhone,
      newPassword
    );

    if (resetSuccess) {
      setRecoverySuccessMsg('পাছৱৰ্ড সফলভাৱে ৰিছেট কৰা হ’ল! এতিয়া আনলক হৈছে। (Password reset successfully!)');
      setTimeout(() => {
        onSuccess();
      }, 700);
    } else {
      setErrorMsg('ষ্টেচনৰ RO ক’ড বা মবাইল নম্বৰ মিল নাই! অনুগ্ৰহ কৰি সঠিক তথ্য দিয়ক। (RO Code or Mobile Number mismatch)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-orange-500/10 transition-all ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
            title="Close / Cancel"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <PumpProLogo size="sm" />
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>Security Protected</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 shrink-0">
              {isSuccess ? (
                <Unlock className="w-6 h-6 text-white animate-bounce" />
              ) : (
                <Lock className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                <span>মেনেজমেন্ট & অ’নাৰ হিচাপ লক</span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[260px]">
                {settings.pumpName} ({settings.dealerCode})
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {!isRecoveryMode ? (
            <>
              {/* Security Notice */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  পাম্পৰ দৈনিক মুঠ লাভ, কেচ হিচাপ, বাকী লেজাৰ আৰু বেংক একাউণ্ট চাবলৈ{' '}
                  <span className="text-orange-400 font-bold">অ’নাৰ সুৰক্ষা পাছৱৰ্ড বা PIN</span> দিয়ক।
                  <span className="block text-[11px] text-slate-400 mt-0.5">
                    (Enter Owner PIN/Password to access confidential accounts & management).
                  </span>
                </p>
              </div>

              {/* Password Form */}
              <form onSubmit={handleUnlock} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>সুৰক্ষা পাছৱৰ্ড / PIN</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      ডিফল্ট PIN: <strong className="text-amber-400 font-mono">1234</strong>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      placeholder="Enter 4-digit PIN or password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg(null);
                      }}
                      className="w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-700 focus:border-orange-500 rounded-2xl text-center text-lg sm:text-xl font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                    <KeyRound className="w-5 h-5 text-slate-500 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Touch-Friendly Number Pad for Fast Mobile Entry */}
                <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-wider mb-2">
                    দ্ৰুত আনলক কীপেড (Touch Keypad)
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadPress(digit)}
                        className="py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono font-bold text-base sm:text-lg transition shadow-xs cursor-pointer"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-slate-200 text-xs font-bold transition cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('0')}
                      className="py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono font-bold text-base sm:text-lg transition shadow-xs cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="py-2.5 sm:py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-400 hover:text-slate-200 text-xs font-bold transition cursor-pointer"
                    >
                      ⌫ Delete
                    </button>
                  </div>
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
                  >
                    {isSuccess ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>আনলক হৈছে... (Unlocked!)</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4" />
                        <span>হিচাপ আনলক কৰক (Unlock Dashboard)</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setIsRecoveryMode(true)}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>পাছৱৰ্ড পাহৰিলে? (Forgot PIN)</span>
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="text-slate-400 hover:text-slate-200 font-semibold cursor-pointer"
                    >
                      ষ্টাফ এন্ট্ৰিলৈ ঘূৰি যাওক (Cancel)
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            /* Forgot Password / Emergency Recovery Flow */
            <form onSubmit={handleRecoverySubmit} className="space-y-3">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  ষ্টেচনৰ সঠিক <strong className="text-white">RO ক’ড</strong> আৰু{' '}
                  <strong className="text-white">মালিকৰ মবাইল নম্বৰ</strong> দি নতুন পাছৱৰ্ড ছেট কৰক।
                </p>
              </div>

              {recoverySuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{recoverySuccessMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Station RO Code (ষ্টেচনৰ RO ক’ড)
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={recoveryRoCode}
                    onChange={(e) => setRecoveryRoCode(e.target.value)}
                    placeholder="e.g. IOCL-RO-44219"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Registered Owner Mobile (পঞ্জীভুক্ত মবাইল নম্বৰ)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={recoveryPhone}
                    onChange={(e) => setRecoveryPhone(e.target.value)}
                    placeholder="e.g. 9820044555"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    New PIN / Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Confirm PIN
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat PIN"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>পাছৱৰ্ড ৰিছেট কৰি আনলক কৰক (Reset & Unlock)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRecoveryMode(false)}
                  className="text-xs text-slate-400 hover:text-white py-1 cursor-pointer"
                >
                  ← পাছৱৰ্ড প্ৰৱেশলৈ উভতি যাওক (Back to PIN entry)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
