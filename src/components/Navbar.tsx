import React, { useState, useEffect } from 'react';
import { PumpProLogo } from './PumpProLogo';
import { FuelRate, PumpSettings, PumpSubscription, RegisteredPump } from '../types';
import {
  Clock,
  Fuel,
  RefreshCw,
  Bell,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Layers,
  FileText,
  AlertTriangle,
  Zap,
  Building2,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Menu,
  X,
  Database,
  Maximize2,
  Minimize2,
  Lock,
} from 'lucide-react';

interface NavbarProps {
  settings: PumpSettings;
  rates: FuelRate[];
  activeShift: string;
  onChangeShift: (shift: string) => void;
  onOpenRatesModal: () => void;
  onNavigate: (tab: string) => void;
  lowStockCount: number;
  subscription: PumpSubscription;
  onOpenSubscriptionModal: () => void;
  registeredPumps?: RegisteredPump[];
  onSwitchPump?: (pumpId: string) => void;
  onOpenRegisterPumpModal?: () => void;
  onOpenAuditGuideModal?: () => void;
  onOpenProductLaunchModal?: () => void;
  onOpenNeonModal?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  activeRole?: 'staff' | 'owner';
  onToggleRole?: (role: 'staff' | 'owner') => void;
  isMobileFitMode?: boolean;
  onToggleMobileFitMode?: () => void;
  onLockOwner?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  rates,
  activeShift,
  onChangeShift,
  onOpenRatesModal,
  onNavigate,
  lowStockCount,
  subscription,
  onOpenSubscriptionModal,
  registeredPumps = [],
  onSwitchPump,
  onOpenRegisterPumpModal,
  onOpenAuditGuideModal,
  onOpenProductLaunchModal,
  onOpenNeonModal,
  onToggleMobileMenu,
  isMobileMenuOpen,
  activeRole = 'staff',
  onToggleRole,
  isMobileFitMode = false,
  onToggleMobileFitMode,
  onLockOwner,
}) => {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [shiftDropdownOpen, setShiftDropdownOpen] = useState(false);
  const [pumpDropdownOpen, setPumpDropdownOpen] = useState(false);
  const [showMobileRates, setShowMobileRates] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const shifts = [
    'Shift 1 (Morning)',
    'Shift 2 (Evening)',
    'Shift 3 (Night)',
    'General Full Day',
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      {/* Top Banner / Live Fuel Rates Ticker (Collapsible on mobile to maximize visible workspace) */}
      <div className={`${showMobileRates ? 'flex' : 'hidden md:flex'} bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-3 sm:px-4 py-1.5 border-b border-slate-800/80 items-center justify-between gap-2 sm:gap-3 text-xs overflow-hidden transition-all duration-300`}>
        {/* Rates Display with smooth touch scrolling */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 w-full md:w-auto flex-nowrap">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] pr-2 border-r border-slate-700/60 shrink-0">
            <Fuel className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden sm:inline">Today's Rates</span>
            <span className="sm:hidden">Rates</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-nowrap shrink-0">
            {rates.map((rate) => (
              <div
                key={rate.type}
                className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-700/60 transition cursor-pointer shrink-0"
                onClick={onOpenRatesModal}
                title="Click to update fuel prices"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: rate.color }}
                />
                <span className="font-bold text-slate-300 text-[11px]">{rate.shortCode}:</span>
                <span className="font-extrabold text-orange-400 text-xs">
                  {settings.currencySymbol}
                  {rate.ratePerLiter.toFixed(2)}/L
                </span>
                <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">
                  (+{settings.currencySymbol}{rate.dealerMarginPerLiter.toFixed(2)} mgn)
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={onOpenRatesModal}
            className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-semibold ml-1 transition shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="hidden sm:inline">Edit Rates</span>
          </button>
        </div>

        {/* Live Station & Time Display */}
        <div className="hidden md:flex items-center gap-4 text-slate-300 font-medium shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-semibold">{settings.dealerBrand}</span>
            <span className="text-slate-500">•</span>
            <span className="truncate max-w-[200px]" title={settings.pumpName}>
              {settings.pumpName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 border-l border-slate-800 pl-3">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-200 font-mono font-medium">{time}</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{dateStr}</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between gap-2 max-w-full overflow-hidden">
        {/* Brand Logo & Mobile Drawer Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-orange-400" />
              ) : (
                <Menu className="w-5 h-5 text-orange-400" />
              )}
            </button>
          )}

          <div className="sm:hidden flex items-center shrink-0">
            <PumpProLogo size="sm" />
          </div>
          <div className="hidden sm:flex items-center shrink-0">
            <PumpProLogo size="md" />
          </div>
        </div>

        {/* Action Controls (Responsive & Mobile-Optimized) */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Dual Panel Role Switcher (Staff vs Owner) */}
          {onToggleRole && (
            <div className="flex items-center bg-slate-950 p-0.5 sm:p-1 rounded-xl border border-slate-800 shadow-inner">
              <button
                onClick={() => onToggleRole('staff')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  activeRole === 'staff'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Staff Panel: Quick Meter Readings, Lube Sales, Tankers & Stock Reconciliations"
              >
                <span>⚡</span>
                <span className="inline">Staff</span>
              </button>
              <button
                onClick={() => onToggleRole('owner')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                  activeRole === 'owner'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Owner Panel: Full Executive Dashboard, Shortage Audits & Financial Reports"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="inline">Owner</span>
              </button>
            </div>
          )}

          {/* Quick Lock Button when in Owner Mode ("jate totkhanat belege hisab sabo nuare") */}
          {activeRole === 'owner' && onLockOwner && (
            <button
              onClick={onLockOwner}
              className="flex items-center gap-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              title="Lock Hisab: Instantly lock owner dashboard and return to Staff mode"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">লক কৰক</span>
              <span className="sm:hidden">Lock</span>
            </button>
          )}

          {/* Active Station Switcher (Desktop/Tablet) */}
          {registeredPumps.length > 0 && (
            <div className="relative hidden md:block">
              {/* Desktop Button */}
              <button
                onClick={() => setPumpDropdownOpen(!pumpDropdownOpen)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 transition cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-orange-400" />
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block -mb-0.5">Active Station</span>
                  <span className="font-bold text-white max-w-[140px] truncate block">
                    {settings.pumpName}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {pumpDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex justify-between items-center">
                    <span>Switch Petrol Pump</span>
                    <span className="text-[10px] text-orange-400 font-mono">SaaS Multi-Pump</span>
                  </div>
                  {registeredPumps.map((pump) => (
                    <button
                      key={pump.id}
                      onClick={() => {
                        if (onSwitchPump) onSwitchPump(pump.id);
                        setPumpDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition ${
                        pump.isActive
                          ? 'bg-orange-500/20 text-orange-400 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-bold truncate">{pump.stationName}</div>
                        <div className="text-[10px] text-slate-400">{pump.oilCompany} • {pump.district}</div>
                      </div>
                      {pump.isActive && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                    </button>
                  ))}
                  {onOpenRegisterPumpModal && (
                    <div className="p-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          onOpenRegisterPumpModal();
                          setPumpDropdownOpen(false);
                        }}
                        className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Register New Station</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SaaS Multi-Pump Subscription Plan Pill (Hidden on Mobile) */}
          <button
            onClick={onOpenSubscriptionModal}
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-orange-500/15 hover:from-orange-500/25 hover:to-amber-500/25 border border-orange-500/40 px-3 py-1.5 rounded-lg text-xs font-bold text-orange-300 transition shadow-xs group"
            title="Click to view or renew monthly multi-pump subscription"
          >
            <Zap className="w-3.5 h-3.5 text-orange-400 fill-current animate-pulse" />
            <div className="text-left leading-tight">
              <span className="text-[10px] text-orange-400/90 block font-normal -mb-0.5">
                {registeredPumps.length > 1 ? `${registeredPumps.length} Pumps` : 'SaaS Plan'}
              </span>
              <span className="font-extrabold text-white">
                {settings.currencySymbol}{subscription.totalMonthlyAmount}/mo
              </span>
            </div>
            <span className="hidden lg:inline-block px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {subscription.daysRemaining}d left
            </span>
          </button>

          {/* Low Stock Warning Badge (Hidden on mobile) */}
          {lowStockCount > 0 && (
            <button
              onClick={() => onNavigate('lubricants')}
              className="hidden lg:flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              title={`${lowStockCount} lubricant items below threshold`}
            >
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce text-amber-400" />
              <span>{lowStockCount} Low Stock</span>
            </button>
          )}

          {/* Neon PostgreSQL Cloud Database Status Button (Hidden on Mobile) */}
          {onOpenNeonModal && (
            <button
              onClick={onOpenNeonModal}
              className="hidden lg:flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 text-emerald-400 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs group cursor-pointer"
              title="Neon PostgreSQL Database Connected (AWS us-east-2). Click for diagnostics & sync."
            >
              <Database className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>Neon DB</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          )}

          {/* Audit & Accounts Verification Guide Button */}
          {onOpenAuditGuideModal && (
            <button
              onClick={onOpenAuditGuideModal}
              className="hidden xl:flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
              title="হিচাপ পৰীক্ষা আৰু আপডেট সহায়িকা (Accounts Verification & Audit Guide)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>হিচাপ পৰীক্ষা (Audit)</span>
            </button>
          )}

          {/* Shift Selector (Tablet & Desktop) */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShiftDropdownOpen(!shiftDropdownOpen)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 transition"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block -mb-0.5">Active Shift</span>
                <span className="font-semibold text-white">{activeShift}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {shiftDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Select Working Shift
                </div>
                {shifts.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onChangeShift(s);
                      setShiftDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition ${
                      activeShift === s
                        ? 'bg-orange-500/20 text-orange-400 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{s}</span>
                    {activeShift === s && (
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Record Reading Button */}
          <button
            onClick={() => onNavigate('readings')}
            className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-lg shadow-orange-500/20 transition active:scale-95"
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Enter Meter Readings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
